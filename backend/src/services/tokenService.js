import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session } from '../models/Session.js';
import { AppError } from '../utils/AppError.js';
import { ROLE_PERMISSIONS } from '../constants/workflow.js';

const TEN_MINUTES_MS=10*60*1000;
const ADMIN_SESSION_MS=24*60*60*1000;
const CUSTOMER_SESSION_MS=7*24*60*60*1000;
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const cookieBase={httpOnly:true,secure:env.NODE_ENV==='production',sameSite:'strict'};
const isPrivileged=user=>user.role!=='CUSTOMER';
const COOKIE_NAMES={storefront:{access:'storeAccessToken',refresh:'storeRefreshToken',csrf:'storeCsrfToken'},admin:{access:'adminAccessToken',refresh:'adminRefreshToken',csrf:'adminCsrfToken'}};
const LEGACY_COOKIE_NAMES={access:'accessToken',refresh:'refreshToken',csrf:'csrfToken'};
const familyForUser=user=>isPrivileged(user)?COOKIE_NAMES.admin:COOKIE_NAMES.storefront;
const familyForRequest=req=>req.get('x-client')==='admin'?COOKIE_NAMES.admin:COOKIE_NAMES.storefront;
export const sessionLifetimeMs=user=>isPrivileged(user)?ADMIN_SESSION_MS:CUSTOMER_SESSION_MS;
export function sessionCookieValue(req,kind){const names=familyForRequest(req);return req.cookies?.[names[kind]]||req.cookies?.[LEGACY_COOKIE_NAMES[kind]]}

export const signAccess=(user,sessionId,maxAgeMs)=>jwt.sign({sub:user.id,sid:sessionId,sv:user.sessionVersion,role:user.role,permissions:[...new Set([...(ROLE_PERMISSIONS[user.role]||[]),...(user.permissions||[])])]},env.JWT_ACCESS_SECRET,{expiresIn:Math.max(1,Math.ceil(maxAgeMs/1000)),issuer:'embody-api',audience:'embody-apps'});

export async function createSession(req,res,user,{expiresAt}={}){
  const refresh=crypto.randomBytes(48).toString('base64url');
  const csrf=crypto.randomBytes(32).toString('base64url');
  const absoluteExpiry=expiresAt?new Date(expiresAt):new Date(Date.now()+sessionLifetimeMs(user));
  const remainingMs=absoluteExpiry.getTime()-Date.now();
  if(remainingMs<=0)throw new AppError('Session expired. Please sign in again.',401,'SESSION_EXPIRED');
  const accessMaxAge=Math.min(isPrivileged(user)?remainingMs:TEN_MINUTES_MS,remainingMs);
  const session=await Session.create({user:user.id,tokenHash:hash(refresh),csrfHash:hash(csrf),userAgentHash:hash(req.get('user-agent')||'unknown'),ipHash:hash(req.ip||'unknown'),expiresAt:absoluteExpiry});
  const names=familyForUser(user);
  res.cookie(names.access,signAccess(user,session.id,accessMaxAge),{...cookieBase,maxAge:accessMaxAge,path:'/'});
  res.cookie(names.refresh,refresh,{...cookieBase,maxAge:remainingMs,path:'/api/v1/auth'});
  res.cookie(names.csrf,csrf,{httpOnly:false,secure:env.NODE_ENV==='production',sameSite:'strict',maxAge:remainingMs,path:'/'});
  return session;
}

export async function rotateSession(req){
  const refresh=sessionCookieValue(req,'refresh');const csrf=sessionCookieValue(req,'csrf');const csrfHeader=req.get('x-csrf-token');
  if(!refresh)throw new AppError('Session expired. Please sign in again.',401,'SESSION_EXPIRED');
  if(!csrf||!csrfHeader||csrf.length!==csrfHeader.length||!crypto.timingSafeEqual(Buffer.from(csrf),Buffer.from(csrfHeader)))throw new AppError('Security token is missing or invalid.',403,'CSRF_INVALID');
  const tokenDigest=hash(refresh);
  const current=await Session.findOneAndUpdate({tokenHash:tokenDigest,csrfHash:hash(csrf),revokedAt:null,expiresAt:{$gt:new Date()}},{$set:{revokedAt:new Date(),lastUsedAt:new Date()}},{new:true});
  if(!current){const reused=await Session.findOne({tokenHash:tokenDigest}).select('user');if(reused?.user)await Session.updateMany({user:reused.user,revokedAt:null},{$set:{revokedAt:new Date()}});throw new AppError('Session expired. Please sign in again.',401,'SESSION_EXPIRED')}
  return current;
}

export async function revokeSession(refresh){if(refresh)await Session.updateOne({tokenHash:hash(refresh),revokedAt:null},{revokedAt:new Date()})}
export async function revokeAllSessions(userId){await Session.updateMany({user:userId,revokedAt:null},{revokedAt:new Date()})}
export function clearSession(reqOrRes,resMaybe,{all=false}={}){const req=resMaybe?reqOrRes:null;const res=resMaybe||reqOrRes;const families=all||!req?[COOKIE_NAMES.storefront,COOKIE_NAMES.admin]:[familyForRequest(req)];for(const names of families){res.clearCookie(names.access,{...cookieBase,path:'/'});res.clearCookie(names.refresh,{...cookieBase,path:'/api/v1/auth'});res.clearCookie(names.csrf,{secure:env.NODE_ENV==='production',sameSite:'strict',path:'/'})}for(const [kind,name] of Object.entries(LEGACY_COOKIE_NAMES))res.clearCookie(name,{...(kind==='csrf'?{secure:env.NODE_ENV==='production',sameSite:'strict'}:cookieBase),path:kind==='refresh'?'/api/v1/auth':'/'})}
export const tokenHash=hash;

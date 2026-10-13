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
export const sessionLifetimeMs=user=>isPrivileged(user)?ADMIN_SESSION_MS:CUSTOMER_SESSION_MS;

export const signAccess=(user,sessionId,maxAgeMs)=>jwt.sign({sub:user.id,sid:sessionId,sv:user.sessionVersion,role:user.role,permissions:[...new Set([...(ROLE_PERMISSIONS[user.role]||[]),...(user.permissions||[])])]},env.JWT_ACCESS_SECRET,{expiresIn:Math.max(1,Math.ceil(maxAgeMs/1000)),issuer:'embody-api',audience:'embody-apps'});

export async function createSession(req,res,user,{expiresAt}={}){
  const refresh=crypto.randomBytes(48).toString('base64url');
  const csrf=crypto.randomBytes(32).toString('base64url');
  const absoluteExpiry=expiresAt?new Date(expiresAt):new Date(Date.now()+sessionLifetimeMs(user));
  const remainingMs=absoluteExpiry.getTime()-Date.now();
  if(remainingMs<=0)throw new AppError('Session expired. Please sign in again.',401,'SESSION_EXPIRED');
  const accessMaxAge=Math.min(isPrivileged(user)?remainingMs:TEN_MINUTES_MS,remainingMs);
  const session=await Session.create({user:user.id,tokenHash:hash(refresh),csrfHash:hash(csrf),userAgentHash:hash(req.get('user-agent')||'unknown'),ipHash:hash(req.ip||'unknown'),expiresAt:absoluteExpiry});
  res.cookie('accessToken',signAccess(user,session.id,accessMaxAge),{...cookieBase,maxAge:accessMaxAge,path:'/'});
  res.cookie('refreshToken',refresh,{...cookieBase,maxAge:remainingMs,path:'/api/v1/auth'});
  res.cookie('csrfToken',csrf,{httpOnly:false,secure:env.NODE_ENV==='production',sameSite:'strict',maxAge:remainingMs,path:'/'});
  return session;
}

export async function rotateSession(req){
  const refresh=req.cookies?.refreshToken;const csrf=req.cookies?.csrfToken;const csrfHeader=req.get('x-csrf-token');
  if(!refresh)throw new AppError('Session expired. Please sign in again.',401,'SESSION_EXPIRED');
  if(!csrf||!csrfHeader||csrf.length!==csrfHeader.length||!crypto.timingSafeEqual(Buffer.from(csrf),Buffer.from(csrfHeader)))throw new AppError('Security token is missing or invalid.',403,'CSRF_INVALID');
  const tokenDigest=hash(refresh);
  const current=await Session.findOneAndUpdate({tokenHash:tokenDigest,csrfHash:hash(csrf),revokedAt:null,expiresAt:{$gt:new Date()}},{$set:{revokedAt:new Date(),lastUsedAt:new Date()}},{new:true});
  if(!current){const reused=await Session.findOne({tokenHash:tokenDigest}).select('user');if(reused?.user)await Session.updateMany({user:reused.user,revokedAt:null},{$set:{revokedAt:new Date()}});throw new AppError('Session expired. Please sign in again.',401,'SESSION_EXPIRED')}
  return current;
}

export async function revokeSession(refresh){if(refresh)await Session.updateOne({tokenHash:hash(refresh),revokedAt:null},{revokedAt:new Date()})}
export async function revokeAllSessions(userId){await Session.updateMany({user:userId,revokedAt:null},{revokedAt:new Date()})}
export function clearSession(res){res.clearCookie('accessToken',{...cookieBase,path:'/'});res.clearCookie('refreshToken',{...cookieBase,path:'/api/v1/auth'});res.clearCookie('csrfToken',{secure:env.NODE_ENV==='production',sameSite:'strict',path:'/'})}
export const tokenHash=hash;

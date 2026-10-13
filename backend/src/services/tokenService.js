import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session } from '../models/Session.js';
import { AppError } from '../utils/AppError.js';
import { ROLE_PERMISSIONS } from '../constants/workflow.js';

const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const cookieBase={httpOnly:true,secure:env.NODE_ENV==='production',sameSite:'strict'};
export const signAccess=(user,sessionId)=>jwt.sign({sub:user.id,sid:sessionId,sv:user.sessionVersion,role:user.role,permissions:[...new Set([...(ROLE_PERMISSIONS[user.role]||[]),...(user.permissions||[])])]},env.JWT_ACCESS_SECRET,{expiresIn:'10m',issuer:'embody-api',audience:'embody-apps'});
export async function createSession(req,res,user){const refresh=crypto.randomBytes(48).toString('base64url');const csrf=crypto.randomBytes(32).toString('base64url');const session=await Session.create({user:user.id,tokenHash:hash(refresh),csrfHash:hash(csrf),userAgentHash:hash(req.get('user-agent')||'unknown'),ipHash:hash(req.ip||'unknown'),expiresAt:new Date(Date.now()+7*864e5)});res.cookie('accessToken',signAccess(user,session.id),{...cookieBase,maxAge:10*60*1000,path:'/'});res.cookie('refreshToken',refresh,{...cookieBase,maxAge:7*864e5,path:'/api/v1/auth'});res.cookie('csrfToken',csrf,{httpOnly:false,secure:env.NODE_ENV==='production',sameSite:'strict',maxAge:7*864e5,path:'/'});return session}
export async function rotateSession(req){const refresh=req.cookies?.refreshToken;const csrf=req.cookies?.csrfToken;const csrfHeader=req.get('x-csrf-token');if(!refresh)throw new AppError('Session expired. Please sign in again.',401,'SESSION_EXPIRED');if(!csrf||!csrfHeader||csrf.length!==csrfHeader.length||!crypto.timingSafeEqual(Buffer.from(csrf),Buffer.from(csrfHeader)))throw new AppError('Security token is missing or invalid.',403,'CSRF_INVALID');const tokenDigest=hash(refresh);const current=await Session.findOneAndUpdate({tokenHash:tokenDigest,csrfHash:hash(csrf),revokedAt:null,expiresAt:{$gt:new Date()}},{$set:{revokedAt:new Date(),lastUsedAt:new Date()}},{new:true});if(!current){const reused=await Session.findOne({tokenHash:tokenDigest}).select('user');if(reused?.user)await Session.updateMany({user:reused.user,revokedAt:null},{$set:{revokedAt:new Date()}});throw new AppError('Session expired. Please sign in again.',401,'SESSION_EXPIRED')}return current}
export async function revokeSession(refresh){if(refresh)await Session.updateOne({tokenHash:hash(refresh),revokedAt:null},{revokedAt:new Date()})}
export async function revokeAllSessions(userId){await Session.updateMany({user:userId,revokedAt:null},{revokedAt:new Date()})}
export function clearSession(res){res.clearCookie('accessToken',{...cookieBase,path:'/'});res.clearCookie('refreshToken',{...cookieBase,path:'/api/v1/auth'});res.clearCookie('csrfToken',{secure:env.NODE_ENV==='production',sameSite:'strict',path:'/'})}
export const tokenHash=hash;

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';

export async function authenticate(req,_res,next){try{const token=req.cookies?.accessToken||req.headers.authorization?.replace(/^Bearer\s+/,'');if(!token)throw new Error();const payload=jwt.verify(token,env.JWT_ACCESS_SECRET,{issuer:'embody-api',audience:'embody-apps'});const[session,user]=await Promise.all([Session.findOne({_id:payload.sid,revokedAt:null,expiresAt:{$gt:new Date()}}).select('+csrfHash'),User.findById(payload.sub).select('sessionVersion status')]);if(!session||!user||user.status!=='ACTIVE'||user.sessionVersion!==payload.sv)throw new Error();req.user=payload;req.session=session;next()}catch{next(new AppError('Authentication required.',401,'AUTH_REQUIRED'))}}
export function authorize(...permissions){return(req,_res,next)=>{if(req.user?.role==='SUPER_ADMIN'||permissions.some(p=>req.user?.permissions?.includes(p)))return next();next(new AppError('You do not have permission for this action.',403,'FORBIDDEN'))}}

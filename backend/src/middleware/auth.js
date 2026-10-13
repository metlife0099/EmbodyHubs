import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function authenticate(req,_res,next){try{const token=req.cookies?.accessToken||req.headers.authorization?.replace(/^Bearer\s+/,'');if(!token)throw new Error();req.user=jwt.verify(token,env.JWT_ACCESS_SECRET);next()}catch{next(new AppError('Authentication required.',401,'AUTH_REQUIRED'))}}
export function authorize(...permissions){return(req,_res,next)=>{if(req.user?.role==='SUPER_ADMIN'||permissions.some(p=>req.user?.permissions?.includes(p)))return next();next(new AppError('You do not have permission for this action.',403,'FORBIDDEN'))}}

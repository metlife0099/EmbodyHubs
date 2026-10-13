import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signAccess=user=>jwt.sign({sub:user.id,role:user.role,permissions:user.permissions||[]},env.JWT_ACCESS_SECRET,{expiresIn:'15m',issuer:'embody-api',audience:'embody-apps'});
export const signRefresh=user=>jwt.sign({sub:user.id,type:'refresh'},env.JWT_REFRESH_SECRET,{expiresIn:'7d',issuer:'embody-api'});
export function setSession(res,user){res.cookie('accessToken',signAccess(user),{httpOnly:true,secure:env.NODE_ENV==='production',sameSite:'lax',maxAge:15*60*1000,path:'/'});res.cookie('refreshToken',signRefresh(user),{httpOnly:true,secure:env.NODE_ENV==='production',sameSite:'strict',maxAge:7*864e5,path:'/api/v1/auth'})}
export function clearSession(res){res.clearCookie('accessToken',{path:'/'});res.clearCookie('refreshToken',{path:'/api/v1/auth'})}

import crypto from 'node:crypto';
import { AppError } from '../utils/AppError.js';
import { sessionCookieValue,tokenHash } from '../services/tokenService.js';
export function requireCsrf(req,_res,next){const cookie=sessionCookieValue(req,'csrf');const header=req.get('x-csrf-token');if(!cookie||!header||cookie.length!==header.length||!crypto.timingSafeEqual(Buffer.from(cookie),Buffer.from(header))||tokenHash(cookie)!==req.session?.csrfHash)return next(new AppError('Security token is missing or invalid. Refresh and try again.',403,'CSRF_INVALID'));next()}

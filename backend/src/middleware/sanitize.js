import { AppError } from '../utils/AppError.js';
function inspect(value){if(!value||typeof value!=='object')return;for(const[key,child]of Object.entries(value)){if(key.startsWith('$')||key.includes('.'))throw new AppError('Invalid input key.',400,'UNSAFE_INPUT');inspect(child)}}
export function rejectMongoOperators(req,_res,next){try{inspect(req.body);next()}catch(error){next(error)}}

import { z } from 'zod';
import { createSignedUpload,deleteAsset } from '../services/cloudinaryService.js';
export async function signUpload(req,res){const{publicId}=z.object({publicId:z.string().regex(/^[a-zA-Z0-9_-]+$/).max(80).optional()}).parse(req.body);res.json({success:true,data:createSignedUpload({publicId})})}
export async function removeAsset(req,res){const{publicId}=z.object({publicId:z.string().min(3).max(220)}).parse(req.body);await deleteAsset(publicId);res.json({success:true,message:'Media asset deleted.'})}

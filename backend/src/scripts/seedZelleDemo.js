import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { ZelleConfiguration } from '../models/ZelleConfiguration.js';
import { blindIndex,encryptText } from '../services/partnerCryptoService.js';

async function seed(){
  if(env.NODE_ENV==='production'||!env.ZELLE_DEMO_MODE)throw new Error('Zelle demo seeding is allowed only when development demo mode is explicitly enabled.');
  const recipient='test-payments@embodyhubs.invalid';await connectDatabase();
  await ZelleConfiguration.findOneAndUpdate({key:'PRIMARY'},{$set:{enabled:true,demoOnly:true,businessUseConfirmed:true,businessDisplayName:'Embody Hubs — LOCAL TEST',recipientType:'EMAIL',recipientEncrypted:encryptText(recipient,{aad:'zelle-config:PRIMARY'}),recipientFingerprint:blindIndex(recipient,'zelle-recipient'),recipientLast4:recipient.slice(-4),qrImageUrl:'/images/zelle-demo-qr.svg',qrBankProvided:false,instructions:'Local interface demonstration only. Do not send money. This non-scannable QR is replaced by an official bank-provided asset before production.',verificationMode:'MANUAL_BANK_RECONCILIATION',expiresMinutes:60},$unset:{qrVerifiedAt:1}},{upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true});
  console.log('Local Zelle UI demo enabled. This configuration cannot be used in production.');
}
seed().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>mongoose.disconnect());

import { connectDatabase,disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { OtpChallenge } from '../models/OtpChallenge.js';

if(!env.ADMIN_SEED_EMAIL||!env.ADMIN_SEED_PASSWORD){
  console.error('Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in the project-root .env first.');
  process.exit(1);
}

try{
  await connectDatabase();
  const email=env.ADMIN_SEED_EMAIL.toLowerCase();
  const now=new Date();
  let user=await User.findOne({email}).select('+passwordHash');
  if(!user){
    user=await User.create({email,passwordHash:await User.hashPassword(env.ADMIN_SEED_PASSWORD),firstName:'Store',lastName:'Administrator',role:'SUPER_ADMIN',permissions:[],emailVerifiedAt:now,adultConfirmedAt:now,termsAcceptedAt:now,privacyAcknowledgedAt:now,privacyNoticeVersion:'2026-10-13',status:'ACTIVE',failedLogins:0,sessionVersion:0,mfaRequired:true,passwordChangedAt:now});
  }else{
    user.passwordHash=await User.hashPassword(env.ADMIN_SEED_PASSWORD);
    user.role='SUPER_ADMIN';
    user.status='ACTIVE';
    user.emailVerifiedAt=user.emailVerifiedAt||now;
    user.adultConfirmedAt=user.adultConfirmedAt||now;
    user.termsAcceptedAt=user.termsAcceptedAt||now;
    user.privacyAcknowledgedAt=user.privacyAcknowledgedAt||now;
    user.privacyNoticeVersion=user.privacyNoticeVersion||'2026-10-13';
    user.failedLogins=0;
    user.lockedUntil=undefined;
    user.passwordChangedAt=now;
    user.sessionVersion=(user.sessionVersion||0)+1;
    user.mfaRequired=true;
    await user.save();
  }
  await Promise.all([
    Session.updateMany({user:user.id,revokedAt:null},{$set:{revokedAt:now}}),
    OtpChallenge.updateMany({user:user.id,consumedAt:null},{$set:{consumedAt:now},$unset:{developmentCode:1}})
  ]);
  console.log('Administrator provisioned securely. Previous sessions and OTP challenges were revoked.');
}finally{
  await disconnectDatabase();
}

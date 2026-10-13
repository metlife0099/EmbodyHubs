import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

if(!env.ADMIN_SEED_EMAIL||!env.ADMIN_SEED_PASSWORD){
  console.error('Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in the project-root .env first.');
  process.exit(1);
}

const now=new Date().toISOString();
const asDate=value=>({$date:value});
const admin={
  _id:{$oid:new mongoose.Types.ObjectId().toString()},
  email:env.ADMIN_SEED_EMAIL.toLowerCase(),
  passwordHash:await User.hashPassword(env.ADMIN_SEED_PASSWORD),
  firstName:'Store',
  lastName:'Administrator',
  role:'SUPER_ADMIN',
  permissions:[],
  emailVerifiedAt:asDate(now),
  adultConfirmedAt:asDate(now),
  termsAcceptedAt:asDate(now),
  privacyAcknowledgedAt:asDate(now),
  privacyNoticeVersion:'2026-10-13',
  status:'ACTIVE',
  failedLogins:0,
  sessionVersion:0,
  mfaRequired:true,
  passwordChangedAt:asDate(now),
  createdAt:asDate(now),
  updatedAt:asDate(now),
  __v:0
};

const outputPath=path.resolve(process.cwd(),'admin-atlas.json');
await writeFile(outputPath,`${JSON.stringify(admin,null,2)}\n`,{encoding:'utf8',mode:0o600});
console.log(`Atlas admin JSON created at ${outputPath}`);
console.log('Treat this password hash as sensitive and delete the file after importing it into the users collection.');

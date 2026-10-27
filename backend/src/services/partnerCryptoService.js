import crypto from 'node:crypto';
import { env } from '../config/env.js';

const decoded=Buffer.from(env.ENCRYPTION_KEY,'base64');const master=decoded.length===32?decoded:crypto.createHash('sha256').update(env.ENCRYPTION_KEY,'utf8').digest();
const encryptionKey=Buffer.from(crypto.hkdfSync('sha256',master,Buffer.from('embody-partner-v1'),Buffer.from('field-encryption'),32));
const indexKey=Buffer.from(crypto.hkdfSync('sha256',master,Buffer.from('embody-partner-v1'),Buffer.from('blind-index'),32));
const integrityKey=Buffer.from(crypto.hkdfSync('sha256',master,Buffer.from('embody-partner-v1'),Buffer.from('document-integrity'),32));

export function encryptJson(value,{aad='partner-profile'}={}){return encryptBuffer(Buffer.from(JSON.stringify(value)),aad).toString('base64url')}
export function decryptJson(value,{aad='partner-profile'}={}){return JSON.parse(decryptBuffer(Buffer.from(value,'base64url'),aad).toString('utf8'))}
export function encryptText(value,{aad='partner-field'}={}){return encryptBuffer(Buffer.from(String(value)),aad).toString('base64url')}
export function decryptText(value,{aad='partner-field'}={}){return decryptBuffer(Buffer.from(value,'base64url'),aad).toString('utf8')}
export function blindIndex(value,purpose='lookup'){return crypto.createHmac('sha256',indexKey).update(`${purpose}:${String(value).trim().toLowerCase()}`).digest('base64url')}
export function documentIntegrity(value){return crypto.createHmac('sha256',integrityKey).update(value).digest('base64url')}
export function encryptDocument(value,aad){return encryptBuffer(value,aad)}
export function decryptDocument(value,aad){return decryptBuffer(value,aad)}

function encryptBuffer(value,aad){const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey,iv);cipher.setAAD(Buffer.from(aad));const encrypted=Buffer.concat([cipher.update(value),cipher.final()]);return Buffer.concat([Buffer.from('EHV1'),iv,cipher.getAuthTag(),encrypted])}
function decryptBuffer(value,aad){if(value.subarray(0,4).toString()!=='EHV1'||value.length<33)throw new Error('Encrypted data envelope is invalid.');const iv=value.subarray(4,16);const tag=value.subarray(16,32);const decipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey,iv);decipher.setAAD(Buffer.from(aad));decipher.setAuthTag(tag);return Buffer.concat([decipher.update(value.subarray(32)),decipher.final()])}

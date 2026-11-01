import test from 'node:test';
import assert from 'node:assert/strict';
import { createZellePaymentSnapshot,customerReportDecision,customerZellePayment,reconcileDecision } from '../src/services/zellePaymentService.js';
import { encryptText,blindIndex } from '../src/services/partnerCryptoService.js';
import { ROLE_PERMISSIONS } from '../src/constants/workflow.js';

function config(overrides={}){return{businessDisplayName:'Embody Hubs',recipientType:'EMAIL',recipientLast4:'.com',recipientEncrypted:encryptText('payments@embodyhubs.com',{aad:'zelle-config:PRIMARY'}),qrImageUrl:'https://res.cloudinary.com/demo/image/upload/zelle.png',qrBankProvided:true,qrVerifiedAt:new Date(),instructions:'Use the enrolled business recipient and enter the exact amount.',expiresMinutes:60,...overrides}}

test('Zelle snapshot preserves the server-calculated $99.00 amount',()=>{
  const payment=createZellePaymentSnapshot(config(),{orderId:'68ed1234567890abcdef1234',amountCents:9900});
  assert.equal(payment.expectedAmountCents,9900);assert.equal(payment.provider,'zelle');assert.match(payment.paymentReference,/^ZEL-[A-F0-9]{14}$/);
});

test('only a bank-attested and verified QR is exposed',()=>{
  const yes=createZellePaymentSnapshot(config(),{orderId:'68ed1234567890abcdef1234',amountCents:9900});
  const noAttestation=createZellePaymentSnapshot(config({qrBankProvided:false}),{orderId:'68ed1234567890abcdef1235',amountCents:9900});
  const noVerification=createZellePaymentSnapshot(config({qrVerifiedAt:null}),{orderId:'68ed1234567890abcdef1236',amountCents:9900});
  assert.match(yes.qrImageUrl,/cloudinary/);assert.equal(noAttestation.qrImageUrl,'');assert.equal(noVerification.qrImageUrl,'');
});

test('missing QR safely retains recipient and manual instructions',()=>{
  const id='68ed1234567890abcdef1234';const payment=createZellePaymentSnapshot(config({qrImageUrl:''}),{orderId:id,amountCents:9900});
  const view=customerZellePayment({_id:id,number:'EH-1042',status:'PENDING_PAYMENT',paymentStatus:'PENDING_PAYMENT',payment,currency:'usd',totalCents:9900,createdAt:new Date()});
  assert.equal(view.qrImageUrl,null);assert.equal(view.recipient,'payments@embodyhubs.com');assert.match(view.instructions,/exact amount/i);
});

test('customer report can only move payment to independent review',()=>{
  assert.equal(customerReportDecision('PENDING_PAYMENT'),'PAYMENT_UNDER_REVIEW');assert.notEqual(customerReportDecision('PENDING_PAYMENT'),'SUCCEEDED');assert.equal(customerReportDecision('SUCCEEDED'),'SUCCEEDED');
});

test('exact verified bank amount reaches paid review without fulfillment approval',()=>{
  assert.deepEqual(reconcileDecision({expectedAmountCents:9900,verifiedAmountCents:9900,outcome:'VERIFIED'}),{paymentStatus:'SUCCEEDED',orderStatus:'PAID_REVIEW_REQUIRED',event:'PAYMENT_VERIFIED'});
});

test('incorrect verified amount remains under manual review',()=>{
  assert.deepEqual(reconcileDecision({expectedAmountCents:9900,verifiedAmountCents:9800,outcome:'VERIFIED'}),{paymentStatus:'PAYMENT_UNDER_REVIEW',orderStatus:'PENDING_PAYMENT',event:'PAYMENT_AMOUNT_DISCREPANCY'});
});

test('failed and cancelled bank outcomes never become paid',()=>{
  assert.equal(reconcileDecision({expectedAmountCents:9900,verifiedAmountCents:0,outcome:'FAILED'}).paymentStatus,'FAILED');assert.equal(reconcileDecision({expectedAmountCents:9900,verifiedAmountCents:0,outcome:'CANCELLED'}).paymentStatus,'CANCELLED');
});

test('payment references are unique and recipient encryption is non-deterministic',()=>{
  const first=createZellePaymentSnapshot(config(),{orderId:'68ed1234567890abcdef1234',amountCents:9900});const second=createZellePaymentSnapshot(config(),{orderId:'68ed1234567890abcdef1235',amountCents:9900});
  assert.notEqual(first.paymentReference,second.paymentReference);assert.notEqual(first.recipientEncrypted,second.recipientEncrypted);
});

test('bank transaction blind indexes deduplicate case and whitespace without exposing the reference',()=>{
  const first=blindIndex(' Bank-Transaction-1042 ','zelle-bank-transaction');const second=blindIndex('bank-transaction-1042','zelle-bank-transaction');assert.equal(first,second);assert.doesNotMatch(first,/transaction-1042/i);
});

test('only finance-capable roles receive reconciliation permissions',()=>{
  assert.ok(ROLE_PERMISSIONS.FINANCE.includes('payments:reconcile'));assert.ok(ROLE_PERMISSIONS.PHARMACY_ADMIN.includes('payments:reconcile'));assert.ok(!ROLE_PERMISSIONS.SUPPORT.includes('payments:reconcile'));assert.ok(!ROLE_PERMISSIONS.FULFILLMENT.includes('payments:reconcile'));
});

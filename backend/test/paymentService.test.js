import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCompletedPayment } from '../src/services/paymentService.js';

test('accepts only the explicit sandbox payment marker outside production',async()=>{
  const payment=await verifyCompletedPayment({confirmationId:'sandbox_paid',amountCents:4200});
  assert.equal(payment.provider,'sandbox');
  assert.match(payment.externalId,/^sandbox-4200-/);
  assert.ok(payment.confirmedAt instanceof Date);
});

test('fails closed when a payment provider is not configured',async()=>{
  await assert.rejects(
    verifyCompletedPayment({confirmationId:'unverified-client-value',amountCents:4200}),
    error=>error.code==='PAYMENT_NOT_CONFIGURED'&&error.status===503
  );
});

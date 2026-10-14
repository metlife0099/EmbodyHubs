import test from 'node:test';
import assert from 'node:assert/strict';
import { newsletterSubscriptionSchema } from '../src/schemas/newsletter.js';

test('normalizes a newsletter subscription confirmed by the submit action',()=>{
  const result=newsletterSubscriptionSchema.parse({fullName:'  Casey   Morgan ',email:'CASEY@GMAIL.COM',website:''});
  assert.equal(result.fullName,'Casey Morgan');
  assert.equal(result.email,'casey@gmail.com');
  assert.equal(result.consent,true);
});

test('rejects an explicitly declined subscription',()=>{
  const result=newsletterSubscriptionSchema.safeParse({fullName:'Casey Morgan',email:'casey@gmail.com',consent:false,website:''});
  assert.equal(result.success,false);
});

test('tolerates a legacy honeypot populated by browser autofill',()=>{
  const result=newsletterSubscriptionSchema.safeParse({fullName:'Casey Morgan',email:'casey@gmail.com',website:'https://autofilled.example'});
  assert.equal(result.success,true);
});

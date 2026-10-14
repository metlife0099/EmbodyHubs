import test from 'node:test';
import assert from 'node:assert/strict';
import { newsletterSubscriptionSchema } from '../src/schemas/newsletter.js';

test('normalizes a consented newsletter subscription',()=>{
  const result=newsletterSubscriptionSchema.parse({fullName:'  Casey   Morgan ',email:'CASEY@GMAIL.COM',consent:true,website:''});
  assert.equal(result.fullName,'Casey Morgan');
  assert.equal(result.email,'casey@gmail.com');
});

test('rejects newsletter subscriptions without explicit consent',()=>{
  const result=newsletterSubscriptionSchema.safeParse({fullName:'Casey Morgan',email:'casey@gmail.com',consent:false,website:''});
  assert.equal(result.success,false);
});

test('rejects a filled bot honeypot',()=>{
  const result=newsletterSubscriptionSchema.safeParse({fullName:'Casey Morgan',email:'casey@gmail.com',consent:true,website:'spam'});
  assert.equal(result.success,false);
});

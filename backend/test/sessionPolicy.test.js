import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionLifetimeMs } from '../src/services/tokenService.js';

test('privileged administrator sessions expire after exactly 24 hours',()=>{
  assert.equal(sessionLifetimeMs({role:'SUPER_ADMIN'}),24*60*60*1000);
  assert.equal(sessionLifetimeMs({role:'PHARMACY_ADMIN'}),24*60*60*1000);
});

test('customer session policy remains separate from administrator sessions',()=>{
  assert.equal(sessionLifetimeMs({role:'CUSTOMER'}),7*24*60*60*1000);
});

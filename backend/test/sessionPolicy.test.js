import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionCookieValue,sessionLifetimeMs } from '../src/services/tokenService.js';

test('privileged administrator sessions expire after exactly 24 hours',()=>{
  assert.equal(sessionLifetimeMs({role:'SUPER_ADMIN'}),24*60*60*1000);
  assert.equal(sessionLifetimeMs({role:'PHARMACY_ADMIN'}),24*60*60*1000);
});

test('customer sessions expire after exactly 24 hours',()=>{
  assert.equal(sessionLifetimeMs({role:'CUSTOMER'}),24*60*60*1000);
});

test('storefront and admin requests use isolated cookie families',()=>{
  const cookies={storeAccessToken:'customer-token',adminAccessToken:'admin-token',accessToken:'legacy-token'};
  assert.equal(sessionCookieValue({cookies,get:()=> 'storefront'},'access'),'customer-token');
  assert.equal(sessionCookieValue({cookies,get:()=> 'admin'},'access'),'admin-token');
  assert.equal(sessionCookieValue({cookies:{accessToken:'legacy-token'},get:()=> 'storefront'},'access'),'legacy-token');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { customerPasswordSchema,customerPreferencesSchema,customerProfileSchema } from '../src/schemas/account.js';

const completeProfile={
  firstName:'Jordan',lastName:'Lee',preferredName:'Jordy',phone:'(555) 555-0123',
  defaultShippingAddress:{name:'Jordan Lee',line1:'120 Market Street',line2:'Suite 4',city:'Austin',state:'TX',postalCode:'78701',country:'US'},
  registrationProfile:{ageRange:'30_44',state:'TX',serviceGoal:'OTC_SHOPPING',pharmacistSupport:'NOT_SURE'}
};

test('accepts a complete privacy-minimized customer profile',()=>{
  const result=customerProfileSchema.parse(completeProfile);
  assert.equal(result.defaultShippingAddress.state,'TX');
  assert.equal(result.phone,'(555) 555-0123');
});

test('allows a customer to remove the optional saved address',()=>{
  const result=customerProfileSchema.parse({...completeProfile,defaultShippingAddress:null,phone:''});
  assert.equal(result.defaultShippingAddress,null);
});

test('rejects partial or invalid U.S. address data',()=>{
  assert.equal(customerProfileSchema.safeParse({...completeProfile,defaultShippingAddress:{...completeProfile.defaultShippingAddress,postalCode:'ABC'}}).success,false);
});

test('requires a strong new password different from the current password',()=>{
  assert.equal(customerPasswordSchema.safeParse({currentPassword:'OldPassword!234',newPassword:'NewPassword!234'}).success,true);
  assert.equal(customerPasswordSchema.safeParse({currentPassword:'SamePassword!234',newPassword:'SamePassword!234'}).success,false);
});

test('accepts only an explicit marketing email preference',()=>{
  assert.deepEqual(customerPreferencesSchema.parse({marketingEmail:false}),{marketingEmail:false});
  assert.equal(customerPreferencesSchema.safeParse({marketingEmail:'false'}).success,false);
});

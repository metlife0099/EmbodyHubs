import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdultAgeRange,registrationSchema } from '../src/schemas/registration.js';

const validRegistration={
  email:'customer@example.com',
  password:'StrongPassword!2026',
  firstName:'Casey',
  lastName:'Morgan',
  ageRange:'30_44',
  state:'CA',
  serviceGoal:'PHARMACIST_QUESTION',
  pharmacistSupport:'YES',
  termsAccepted:'true',
  privacyAcknowledged:'true'
};

test('accepts a complete privacy-minimized registration profile',()=>{
  const result=registrationSchema.parse(validRegistration);
  assert.equal(result.state,'CA');
  assert.equal(isAdultAgeRange(result.ageRange),true);
});

test('rejects registration without a separate privacy acknowledgement',()=>{
  const{privacyAcknowledged,...incomplete}=validRegistration;
  assert.equal(registrationSchema.safeParse(incomplete).success,false);
});

test('identifies an under-18 age range for the controller eligibility gate',()=>{
  assert.equal(isAdultAgeRange('UNDER_18'),false);
});

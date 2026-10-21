import test from 'node:test';
import assert from 'node:assert/strict';
import { healthcareProfessionalApplicationSchema,healthcareProfessionalReviewSchema } from '../src/schemas/healthcareProfessional.js';
import { isValidNpi } from '../src/services/npiRegistryService.js';

const validApplication={
  professionType:'PHYSICIAN',specialty:'Family medicine',npi:'1104465236',licenseNumber:'TX-123456',licenseState:'TX',practiceName:'Northside Family Practice',professionalEmail:'doctor@example.org',practicePhone:'(555) 555-0123',practiceAddress:{line1:'100 Main Street',line2:'Suite 200',city:'Austin',state:'TX',postalCode:'78701'},intendedUse:'PATIENT_EDUCATION',credentialAttestation:true,noPatientDataAttestation:true,termsAccepted:true,privacyAcknowledged:true
};

test('validates NPI check digits',()=>{
  assert.equal(isValidNpi('1104465236'),true);
  assert.equal(isValidNpi('1234567893'),true);
  assert.equal(isValidNpi('1104465235'),false);
  assert.equal(isValidNpi('123'),false);
});

test('accepts a privacy-minimized professional application',()=>{
  const parsed=healthcareProfessionalApplicationSchema.parse(validApplication);
  assert.equal(parsed.npi,'1104465236');
  assert.equal(parsed.practiceAddress.state,'TX');
});

test('rejects invalid NPI and missing attestations',()=>{
  const parsed=healthcareProfessionalApplicationSchema.safeParse({...validApplication,npi:'1104465235',noPatientDataAttestation:false});
  assert.equal(parsed.success,false);
  assert.ok(parsed.error.issues.some(issue=>issue.path[0]==='npi'));
  assert.ok(parsed.error.issues.some(issue=>issue.path[0]==='noPatientDataAttestation'));
});

test('requires a reviewer note for adverse decisions',()=>{
  assert.equal(healthcareProfessionalReviewSchema.safeParse({status:'REJECTED',note:''}).success,false);
  assert.equal(healthcareProfessionalReviewSchema.safeParse({status:'APPROVED',note:''}).success,true);
});

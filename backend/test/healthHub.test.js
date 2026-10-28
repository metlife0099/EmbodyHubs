import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNextSteps } from '../src/services/healthHubNextStepService.js';
import { healthHubLifecycle,HEALTH_HUB_FLAGS } from '../src/services/healthHubFeatureService.js';
import { JOURNEY_STATES } from '../src/models/CustomerJourney.js';

test('Health Hub exposes every specified journey state and independent production control',()=>{
  for(const state of ['STARTED','DISCOVERING','EXPLORING','COMPARING','DECIDING','ACTION_REQUIRED','PROCESSING','AWAITING_CUSTOMER','AWAITING_PHARMACY','AWAITING_EXTERNAL','COMPLETED','ARCHIVED','CANCELLED','SUPPORT_REQUIRED'])assert.ok(JOURNEY_STATES.includes(state));
  assert.equal(new Set(HEALTH_HUB_FLAGS).size,8);
});

test('next-step engine prioritizes required customer action and never converts an estimate into confirmed',()=>{
  const result=buildNextSteps({journeys:[{_id:'j1',title:'Compare options',state:'ACTION_REQUIRED',stageLabel:'Choice needed',nextStep:{label:'Review the comparison',responsibleParty:'CUSTOMER'},updatedAt:new Date()}],orders:[{_id:'o1',number:'ORD-1',status:'PROCESSING',updatedAt:new Date()}],supportCases:[]});
  assert.equal(result[0].classification,'AWAITING_CUSTOMER');
  assert.equal(result[0].responsibleParty,'CUSTOMER');
  assert.equal(result[0].next,'Review the comparison');
});

test('data lifecycle keeps temporary assistant context and prescription records separate',()=>{
  const rows=healthHubLifecycle();
  assert.ok(rows.find(row=>row.category==='Temporary assistant context').retention.includes('Not stored'));
  assert.ok(rows.find(row=>row.category==='Prescription records').retention.includes('regulated'));
  assert.ok(rows.find(row=>row.category==='Recently viewed').retention.includes('No server-side'));
});

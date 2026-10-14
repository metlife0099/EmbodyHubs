import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryStatus } from '../src/controllers/inventoryController.js';
import { canTransitionShipment } from '../src/controllers/shippingController.js';

test('inventory status uses available stock after reservations',()=>{
  assert.equal(inventoryStatus(20,5,10),'IN_STOCK');
  assert.equal(inventoryStatus(12,5,10),'LOW_STOCK');
  assert.equal(inventoryStatus(5,5,10),'OUT_OF_STOCK');
});

test('shipment transition policy permits forward progress and rejects regressions',()=>{
  assert.equal(canTransitionShipment(undefined,'LABEL_CREATED'),true);
  assert.equal(canTransitionShipment('LABEL_CREATED','IN_TRANSIT'),true);
  assert.equal(canTransitionShipment('IN_TRANSIT','DELIVERED'),true);
  assert.equal(canTransitionShipment('DELIVERED','IN_TRANSIT'),false);
  assert.equal(canTransitionShipment('RETURNED_TO_SENDER','DELIVERED'),false);
});

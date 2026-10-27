import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryStatus } from '../src/controllers/inventoryController.js';
import { canTransitionShipment } from '../src/controllers/shippingController.js';
import { productRemovalMode } from '../src/controllers/productController.js';
import { selectCheckoutVariant,validatePlanSelection,variantDisplayName } from '../src/controllers/checkoutController.js';
import { comparisonInputSchema } from '../src/controllers/comparisonController.js';
import { pricingConfiguratorSchema } from '../src/controllers/productController.js';

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

test('product removal preserves regulated commerce history',()=>{
  assert.equal(productRemovalMode({orders:false,inventory:false,responses:false}),'DELETED');
  assert.equal(productRemovalMode({orders:true,inventory:false,responses:false}),'ARCHIVED');
  assert.equal(productRemovalMode({orders:false,inventory:true,responses:false}),'ARCHIVED');
  assert.equal(productRemovalMode({orders:false,inventory:false,responses:true}),'ARCHIVED');
});

test('checkout selects the exact requested product variant',()=>{
  const product={variants:[{_id:'68ed1234567890abcdef1234',sku:'CET-10-30',dosage:'10 mg',form:'Tablet',packSize:'30 tablets',priceCents:1200,stock:8,active:true},{_id:'68ed1234567890abcdef1235',sku:'CET-10-90',label:'90-count value pack',priceCents:2800,stock:2,active:true}]};
  const selected=selectCheckoutVariant(product,{variantId:'68ed1234567890abcdef1235',quantity:2});
  assert.equal(selected.variant.sku,'CET-10-90');
  assert.equal(variantDisplayName(selected.variant),'90-count value pack');
  assert.equal(selectCheckoutVariant(product,{quantity:1}).error,'VARIANT_SELECTION_REQUIRED');
  assert.equal(selectCheckoutVariant(product,{variantId:'68ed1234567890abcdef1235',quantity:3}).error,'INSUFFICIENT_STOCK');
  assert.equal(selectCheckoutVariant(product,{variantId:'68ed1234567890abcdef9999',quantity:1}).error,'VARIANT_UNAVAILABLE');
});

test('legacy single-option carts remain compatible',()=>{
  const product={variants:[{_id:'68ed1234567890abcdef1234',sku:'STANDARD',priceCents:900,stock:4,active:true}]};
  assert.equal(selectCheckoutVariant(product,{quantity:1}).variant.sku,'STANDARD');
});

test('purchase plan selections are checked against the published product configuration',()=>{
  const category='68ed1234567890abcdef1000';
  const source={slug:'plan-page',category,pricingConfigurator:{enabled:true,frequencyOptions:['Taken daily'],doseOptions:[{label:'4 doses',quantity:4}],shippingOptions:[{label:'Every month',months:1}]}};
  const product={slug:'product-a',category};
  const requested={quantity:4,planSelection:{sourceProductSlug:'plan-page',dosingFrequency:'Taken daily',doseLabel:'4 doses',shippingFrequency:'Every month',shippingMonths:1}};
  assert.equal(validatePlanSelection(requested,product,[source]).doseLabel,'4 doses');
  assert.throws(()=>validatePlanSelection({...requested,quantity:5},product,[source]));
  assert.throws(()=>validatePlanSelection({...requested,planSelection:{...requested.planSelection,shippingMonths:3}},product,[source]));
});

test('product pricing configurator validates quantities, intervals, and unique labels',()=>{
  const valid={enabled:true,frequencyOptions:['Taken daily','Taken as needed'],doseOptions:[{label:'4 doses',quantity:4},{label:'8 doses',quantity:8}],shippingOptions:[{label:'Every month',months:1},{label:'Every 3 months',months:3}]};
  assert.equal(pricingConfiguratorSchema.parse(valid).shippingOptions[1].months,3);
  assert.throws(()=>pricingConfiguratorSchema.parse({...valid,doseOptions:[{label:'Too many',quantity:101}]}));
  assert.throws(()=>pricingConfiguratorSchema.parse({...valid,frequencyOptions:['Daily','daily']}));
});

test('comparison content supports simple columns and validates optional sources',()=>{
  const valid={purpose:'Tadalafil vs Sildenafil',items:[{name:'Tadalafil'},{name:'Sildenafil'}],publicationStatus:'PUBLISHED',sortOrder:10};
  assert.equal(comparisonInputSchema.parse(valid).items.length,2);
  assert.throws(()=>comparisonInputSchema.parse({...valid,items:[{name:'Only one'}]}));
  assert.throws(()=>comparisonInputSchema.parse({...valid,items:[{name:'Tadalafil',source:{label:'Source',url:'http://example.com'}},{name:'Sildenafil'}]}));
  assert.throws(()=>comparisonInputSchema.parse({...valid,items:[{name:'Tadalafil',source:{label:'Source',url:''}},{name:'Sildenafil'}]}));
});

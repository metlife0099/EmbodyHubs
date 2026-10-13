import test from 'node:test';
import assert from 'node:assert/strict';
import { cartQuestionInputSchema,cartQuestionUpdateSchema,normalizeOptions } from '../src/schemas/cartQuestionnaire.js';

test('validates an administrator-configured choice question',()=>{
  const result=cartQuestionInputSchema.parse({key:'delivery-preference',prompt:'How would you prefer pharmacy follow-up?',responseType:'SINGLE_CHOICE',options:[{value:'email',label:'Email'},{value:'phone',label:'Phone'}],required:true,active:true,productSlugs:[],sortOrder:10});
  assert.equal(result.options.length,2);
});

test('rejects a choice question without enough options',()=>{
  const result=cartQuestionInputSchema.safeParse({key:'invalid-choice',prompt:'Choose your preferred option.',responseType:'SINGLE_CHOICE',options:[{value:'one',label:'One'}]});
  assert.equal(result.success,false);
});

test('supports safe partial updates and fixed yes-no options',()=>{
  assert.equal(cartQuestionUpdateSchema.parse({active:false}).active,false);
  assert.equal(normalizeOptions({responseType:'YES_NO',options:[]}).length,2);
});

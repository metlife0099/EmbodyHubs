import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../src/middleware/errors.js';

test('returns a safe client error for malformed JSON',()=>{
  let status;
  let payload;
  const response={status(value){status=value;return this},json(value){payload=value;return this}};
  errorHandler({type:'entity.parse.failed'},{id:'request-test'},response,()=>{});
  assert.equal(status,400);
  assert.equal(payload.code,'INVALID_JSON');
  assert.equal(payload.requestId,'request-test');
});

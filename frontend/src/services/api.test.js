import { describe,expect,it } from 'vitest';
import { authSessionBarrier } from './api';

describe('auth session barrier',()=>{
  it('changes generation when an account session is invalidated',()=>{const before=authSessionBarrier.current();authSessionBarrier.invalidate();expect(authSessionBarrier.current()).toBe(before+1)});
});

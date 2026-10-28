import { afterEach,describe,expect,it,vi } from 'vitest';
import { api,authSessionBarrier } from './api';

const jsonResponse=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});

afterEach(()=>vi.unstubAllGlobals());

describe('auth session barrier',()=>{
  it('changes generation when an account session is invalidated',()=>{const before=authSessionBarrier.current();authSessionBarrier.invalidate();expect(authSessionBarrier.current()).toBe(before+1)});

  it('uses one refresh rotation for concurrent expired requests',async()=>{
    vi.stubGlobal('document',{cookie:'storeCsrfToken=csrf-token'});
    let protectedCalls=0;let refreshCalls=0;
    vi.stubGlobal('fetch',vi.fn(async url=>{
      if(String(url).endsWith('/auth/refresh')){refreshCalls+=1;await new Promise(resolve=>setTimeout(resolve,5));return jsonResponse({success:true,data:{sessionExpiresAt:new Date(Date.now()+86_400_000).toISOString()}})}
      protectedCalls+=1;
      return protectedCalls<=2?jsonResponse({message:'Authentication required.'},401):jsonResponse({success:true,data:{id:'customer'}});
    }));
    const[first,second]=await Promise.all([api.account(),api.account()]);
    expect(first.data.id).toBe('customer');expect(second.data.id).toBe('customer');expect(refreshCalls).toBe(1);
  });

  it('refreshes an expired access cookie before customer logout',async()=>{
    vi.stubGlobal('document',{cookie:'storeCsrfToken=csrf-token'});
    const calls=[];
    vi.stubGlobal('fetch',vi.fn(async url=>{calls.push(String(url));return String(url).endsWith('/auth/refresh')?jsonResponse({success:true,data:{}}):jsonResponse({success:true,message:'Signed out securely.'})}));
    const result=await api.logout();
    expect(result.message).toBe('Signed out securely.');expect(calls.map(value=>value.split('/api/v1')[1])).toEqual(['/auth/refresh','/auth/logout']);
  });
});

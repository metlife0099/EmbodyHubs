import { createContext,useContext,useEffect,useState } from 'react';
import { adminApi } from './api';

const Context=createContext(null);
const CACHE_KEY='embody-admin-session';
let sessionBootstrap;

function restoreAdminSession(){
  if(!sessionBootstrap)sessionBootstrap=adminApi.refresh();
  return sessionBootstrap;
}

function readCachedSession(){
  try{
    const value=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
    if(!value?.user||!value?.sessionExpiresAt||new Date(value.sessionExpiresAt).getTime()<=Date.now())return null;
    return value;
  }catch{
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
}

export function AdminAuthProvider({children}){
  const cached=readCachedSession();
  const[user,setUser]=useState(cached?.user||null);
  const[sessionExpiresAt,setSessionExpiresAt]=useState(cached?.sessionExpiresAt||null);
  const[checking,setChecking]=useState(true);

  const clearLocalSession=()=>{
    setUser(null);
    setSessionExpiresAt(null);
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem('embody-admin-user');
  };

  const storeSession=(next,expiresAt)=>{
    if(!expiresAt)throw new Error('The server did not provide a session expiry.');
    const session={user:next,sessionExpiresAt:expiresAt};
    setUser(next);
    setSessionExpiresAt(expiresAt);
    sessionStorage.setItem(CACHE_KEY,JSON.stringify(session));
  };

  useEffect(()=>{
    if(!document.cookie.includes('adminCsrfToken=')&&!document.cookie.includes('csrfToken=')){
      clearLocalSession();
      setChecking(false);
      return;
    }
    restoreAdminSession().then(result=>{
      if(result.data.user.role==='CUSTOMER')throw new Error('Admin role required.');
      storeSession(result.data.user,result.data.sessionExpiresAt);
    }).catch(clearLocalSession).finally(()=>setChecking(false));
  },[]);

  useEffect(()=>{
    if(!user||!sessionExpiresAt)return;
    const remaining=new Date(sessionExpiresAt).getTime()-Date.now();
    if(remaining<=0){clearLocalSession();return}
    const timer=window.setTimeout(()=>{
      adminApi.logout().catch(()=>{}).finally(clearLocalSession);
    },remaining);
    return()=>window.clearTimeout(timer);
  },[user,sessionExpiresAt]);

  const completeLogin=(next,expiresAt)=>storeSession(next,expiresAt);
  const logout=async()=>{try{await adminApi.logout()}finally{sessionBootstrap=null;clearLocalSession()}};
  return <Context.Provider value={{user,checking,sessionExpiresAt,completeLogin,logout}}>{children}</Context.Provider>;
}

export const useAdminAuth=()=>useContext(Context);

import { createContext,useContext,useEffect,useState } from 'react';
import { adminApi } from './api';
const Context=createContext(null);
let sessionBootstrap;
function restoreAdminSession(){
  if(!sessionBootstrap)sessionBootstrap=adminApi.refresh();
  return sessionBootstrap;
}
function readCachedUser(){try{return JSON.parse(sessionStorage.getItem('embody-admin-user')||'null')}catch{sessionStorage.removeItem('embody-admin-user');return null}}
export function AdminAuthProvider({children}){const[user,setUser]=useState(readCachedUser);const[checking,setChecking]=useState(true);useEffect(()=>{if(!document.cookie.includes('csrfToken=')){setChecking(false);return}restoreAdminSession().then(result=>{if(result.data.user.role==='CUSTOMER')throw new Error('Admin role required.');setUser(result.data.user);sessionStorage.setItem('embody-admin-user',JSON.stringify(result.data.user))}).catch(()=>{setUser(null);sessionStorage.removeItem('embody-admin-user')}).finally(()=>setChecking(false))},[]);const completeLogin=next=>{setUser(next);sessionStorage.setItem('embody-admin-user',JSON.stringify(next))};const logout=async()=>{try{await adminApi.logout()}finally{sessionBootstrap=null;setUser(null);sessionStorage.removeItem('embody-admin-user')}};return <Context.Provider value={{user,checking,completeLogin,logout}}>{children}</Context.Provider>}
export const useAdminAuth=()=>useContext(Context);

import { useState } from 'react';
import { LockKeyhole,ShieldCheck } from 'lucide-react';
import { adminApi } from './api';
import { useAdminAuth } from './AdminAuth';
import './AdminAuth.css';

export default function AdminLogin(){
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const{completeLogin}=useAdminAuth();

  const submit=async event=>{
    event.preventDefault();
    setBusy(true);
    setError('');
    try{
      const form=Object.fromEntries(new FormData(event.currentTarget));
      const result=await adminApi.login(form);
      if(result.data.user.role==='CUSTOMER')throw new Error('An administrator role is required.');
      completeLogin(result.data.user,result.data.sessionExpiresAt);
    }catch(err){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  };

  return <main className="admin-login"><section>
    <div className="login-brand"><b>E</b><span>EMBODY<small>SECURE OPERATIONS</small></span></div>
    <LockKeyhole className="login-symbol"/>
    <span className="overline">Restricted access</span>
    <h1>Admin sign in</h1>
    <p>Use an authorized staff account. A successful sign-in creates a protected session that expires automatically after 24 hours.</p>
    <form onSubmit={submit}>
      <label>Email address<input required type="email" name="email" autoComplete="username"/></label>
      <label>Password<input required type="password" name="password" autoComplete="current-password"/></label>
      {error&&<p className="admin-error" role="alert">{error}</p>}
      <button disabled={busy} className="primary">{busy?'Signing in…':'Sign in securely'}</button>
    </form>
    <div className="login-security"><ShieldCheck/> HttpOnly sessions, CSRF protection, role enforcement, login lockouts, and a fixed 24-hour expiry.</div>
  </section></main>;
}

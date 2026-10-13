import { LockKeyhole,X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LoginRequiredModal(){
  const{loginPrompt,setLoginPrompt}=useApp();
  if(!loginPrompt)return null;
  const returnTo=`${window.location.pathname}${window.location.search}`;
  return <div className="modal-backdrop" role="presentation"><section className="login-required-modal" role="dialog" aria-modal="true" aria-labelledby="login-required-title"><button className="modal-close" onClick={()=>setLoginPrompt(null)} aria-label="Close"><X/></button><LockKeyhole/><span className="eyebrow">Account required</span><h2 id="login-required-title">Please log in first.</h2><p>You must sign in or create a verified account before adding <b>{loginPrompt.name}</b> to your cart.</p><Link className="btn btn-primary btn-wide" to={`/login?returnTo=${encodeURIComponent(returnTo)}`} onClick={()=>setLoginPrompt(null)}>Log in securely</Link><Link className="btn btn-ghost btn-wide" to={`/register?returnTo=${encodeURIComponent(returnTo)}`} onClick={()=>setLoginPrompt(null)}>Create an account</Link></section></div>;
}

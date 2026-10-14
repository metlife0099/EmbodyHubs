import { useState } from 'react';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { api } from '../services/api';

const initial={fullName:'',email:'',consent:false,website:''};

export default function NewsletterSignup(){
  const[form,setForm]=useState(initial);
  const[status,setStatus]=useState('idle');
  const[message,setMessage]=useState('');
  const change=event=>{const{name,value,type,checked}=event.target;setForm(current=>({...current,[name]:type==='checkbox'?checked:value}));if(status!=='idle'){setStatus('idle');setMessage('')}};
  const submit=async event=>{
    event.preventDefault();setStatus('loading');setMessage('');
    try{const result=await api.subscribeNewsletter(form);setStatus('success');setMessage(result.message);setForm(initial)}
    catch(error){setStatus('error');setMessage(error.message)}
  };

  return <section className="newsletter-band" aria-labelledby="newsletter-title">
    <div className="newsletter-copy"><span className="eyebrow light"><Mail/> The EMBODY letter</span><h2 id="newsletter-title">Smarter pharmacy updates, thoughtfully delivered.</h2><p>Product education, medication-safety guidance, and store news. No diagnosis, no clutter.</p></div>
    {status==='success'?<div className="newsletter-success" role="status"><CheckCircle2/><div><strong>You’re subscribed.</strong><p>{message}</p></div></div>:<form className="newsletter-form" onSubmit={submit}>
      <div className="newsletter-fields">
        <label><span>Full name</span><input name="fullName" value={form.fullName} onChange={change} autoComplete="name" minLength="2" maxLength="100" placeholder="Your full name" required/></label>
        <label><span>Email address</span><input type="email" name="email" value={form.email} onChange={change} autoComplete="email" maxLength="254" placeholder="you@gmail.com" required/></label>
        <button className="newsletter-submit" disabled={status==='loading'}>{status==='loading'?'Joining…':<>Subscribe <ArrowRight/></>}</button>
      </div>
      <label className="newsletter-consent"><input type="checkbox" name="consent" checked={form.consent} onChange={change} required/><span>I agree to receive marketing email from EMBODY. I can unsubscribe at any time.</span></label>
      <label className="newsletter-honeypot" aria-hidden="true">Website<input name="website" value={form.website} onChange={change} tabIndex="-1" autoComplete="off"/></label>
      {status==='error'&&<p className="newsletter-error" role="alert">{message}</p>}
    </form>}
  </section>;
}

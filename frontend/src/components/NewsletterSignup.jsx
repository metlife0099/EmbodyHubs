import { useId,useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight,BookOpenCheck,CheckCircle2,Mail,ShieldCheck,Sparkles } from 'lucide-react';
import { api } from '../services/api';

const initial={fullName:'',email:''};

export default function NewsletterSignup(){
  const nameId=useId();
  const emailId=useId();
  const[form,setForm]=useState(initial);
  const[status,setStatus]=useState('idle');
  const[message,setMessage]=useState('');
  const change=event=>{const{name,value}=event.target;setForm(current=>({...current,[name]:value}));if(status==='error'){setStatus('idle');setMessage('')}};
  const submit=async event=>{
    event.preventDefault();setStatus('loading');setMessage('');
    try{const result=await api.subscribeNewsletter(form);setStatus('success');setMessage(result.message);setForm(initial)}
    catch(error){setStatus('error');setMessage(error.message)}
  };

  return <section className="newsletter-band" aria-labelledby="newsletter-title">
    <div className="newsletter-orbit newsletter-orbit--one" aria-hidden="true"/><div className="newsletter-orbit newsletter-orbit--two" aria-hidden="true"/>
    <div className="newsletter-inner">
      <div className="newsletter-copy">
        <span className="eyebrow light"><Sparkles/> The EMBODY letter</span>
        <h2 id="newsletter-title">Useful health guidance.<br/><em>Never inbox clutter.</em></h2>
        <p>Get practical medication-safety education, thoughtful product updates, and pharmacy news written for everyday decisions.</p>
        <div className="newsletter-benefits" aria-label="Newsletter benefits"><span><BookOpenCheck/> Plain-language guidance</span><span><ShieldCheck/> Privacy-minded delivery</span></div>
      </div>
      <div className="newsletter-panel">
        {status==='success'?<div className="newsletter-success" role="status" aria-live="polite"><span><CheckCircle2/></span><div><small>Subscription confirmed</small><strong>You’re on the list.</strong><p>{message}</p><button type="button" onClick={()=>{setStatus('idle');setMessage('')}}>Add another email</button></div></div>:<>
          <header className="newsletter-panel-heading"><span><Mail/></span><div><small>Free email newsletter</small><h3>Join the community</h3></div></header>
          <form className="newsletter-form" onSubmit={submit} noValidate>
            <div className="newsletter-fields">
              <label htmlFor={nameId}><span>Full name</span><input id={nameId} name="fullName" value={form.fullName} onChange={change} autoComplete="name" minLength="2" maxLength="100" placeholder="Jordan Taylor" required/></label>
              <label htmlFor={emailId}><span>Email address</span><input id={emailId} type="email" name="email" value={form.email} onChange={change} autoComplete="email" inputMode="email" maxLength="254" placeholder="you@gmail.com" required/></label>
            </div>
            {status==='error'&&<p className="newsletter-error" role="alert">{message}</p>}
            <button className="newsletter-submit" disabled={status==='loading'}>{status==='loading'?'Subscribing…':<>Subscribe free <ArrowRight/></>}</button>
            <p className="newsletter-disclosure">By selecting “Subscribe free,” you agree to receive EMBODY marketing emails. Unsubscribe anytime. Read our <Link to="/policies/privacy">privacy notice</Link>.</p>
          </form>
        </>}
      </div>
    </div>
  </section>;
}

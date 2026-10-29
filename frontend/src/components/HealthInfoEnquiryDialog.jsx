import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function HealthInfoEnquiryDialog({ enquiry, onClose }) {
  const { user } = useApp();
  const closeRef = useRef(null);
  const [form, setForm] = useState({
    name: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    email: user?.email || '',
    message: '',
    companyWebsite: '',
    acknowledgedNoSensitiveInfo: false
  });
  const [state, setState] = useState({ saving: false, error: '', reference: '' });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const close = event => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', close);
    closeRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', close); };
  }, [onClose]);

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const submit = async event => {
    event.preventDefault();
    setState({ saving: true, error: '', reference: '' });
    try {
      const result = await api.healthInfoEnquiry({ ...form, categorySlug: enquiry.category.slug });
      setState({ saving: false, error: '', reference: result.data.reference });
    } catch (error) {
      setState({ saving: false, error: error.message, reference: '' });
    }
  };

  return <div className="health-enquiry-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="health-enquiry-dialog" role="dialog" aria-modal="true" aria-labelledby="health-enquiry-title">
      <button ref={closeRef} className="health-enquiry-close" onClick={onClose} aria-label="Close enquiry form"><X/></button>
      {state.reference ? <div className="health-enquiry-success">
        <CheckCircle2/>
        <span>Enquiry sent</span>
        <h2 id="health-enquiry-title">The EMBODY team has your question.</h2>
        <p>Your reference is <strong>{state.reference}</strong>. A team member can reply to the email address you supplied.</p>
        <button className="btn btn-primary" onClick={onClose}>Close</button>
      </div> : <>
        <header>
          <span><Mail/> General information enquiry</span>
          <h2 id="health-enquiry-title">Ask about {enquiry.category.name}</h2>
          <p>{enquiry.category.description}</p>
        </header>
        <div className="health-enquiry-context"><small>{enquiry.groupLabel}</small><strong>{enquiry.category.name}</strong>{enquiry.category.medicineExamples?.length > 0 && <p>Medicine names shown: {enquiry.category.medicineExamples.slice(0, 4).join(' · ')}</p>}</div>
        <form onSubmit={submit}>
          <div className="field-row">
            <label>Full name<input name="name" value={form.name} onChange={update} autoComplete="name" minLength="2" maxLength="100" required/></label>
            <label>Email address<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" maxLength="254" required/></label>
          </div>
          <label>Your general question<textarea name="message" value={form.message} onChange={update} minLength="10" maxLength="1000" rows="5" placeholder="What general information would you like to understand?" required/><small>{form.message.length}/1000</small></label>
          <label className="health-enquiry-honeypot" aria-hidden="true">Company website<input name="companyWebsite" value={form.companyWebsite} onChange={update} tabIndex="-1" autoComplete="off"/></label>
          <label className="health-enquiry-consent"><input name="acknowledgedNoSensitiveInfo" type="checkbox" checked={form.acknowledgedNoSensitiveInfo} onChange={update} required/><span><ShieldCheck/>I understand this is for general information only and will not include symptoms, diagnoses, prescriptions, emergencies, or other sensitive health information.</span></label>
          {state.error && <p className="health-enquiry-error" role="alert">{state.error}</p>}
          <button className="btn btn-primary btn-wide" disabled={state.saving}>{state.saving ? 'Sending securely…' : <>Send enquiry to EMBODY <ArrowRight/></>}</button>
        </form>
      </>}
    </section>
  </div>;
}

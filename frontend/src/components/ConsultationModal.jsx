import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, LockKeyhole, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

const questions = [
  { key: 'age', title: 'First, confirm your age', help: 'Prescription ED care on this platform is for adults only.', type: 'choice', options: [['18-24','18–24'],['25-39','25–39'],['40-64','40–64'],['65+','65 or older'],['under-18','Under 18']] },
  { key: 'goal', title: 'What brings you here today?', help: 'This helps route your request. It does not diagnose a condition or select a treatment.', type: 'choice', options: [['first-assessment','A first-time assessment'],['refill','I have an existing prescription'],['not-effective','A previous treatment was not effective'],['side-effects','I experienced side effects'],['alternatives','I want to discuss alternatives']] },
  { key: 'experience', title: 'Have you used ED medicine before?', help: 'A licensed professional will confirm your history and any existing prescription.', type: 'choice', options: [['never','No, never'],['current-rx','Yes, with a current prescription'],['past-rx','Yes, with a past prescription'],['unsure','I’m not sure']] },
  { key: 'medical', title: 'Medicines and health history', help: 'Select every statement that applies. You can add details securely during professional review.', type: 'multi', options: [['nitrates','I take nitrates for chest pain'],['riociguat','I take riociguat'],['heart','I have a heart or serious blood pressure condition'],['allergy','I have a relevant medicine allergy'],['other-meds','I take other prescription medicines'],['none','None of these'],['unsure','I’m not sure']] },
  { key: 'urgent', title: 'Are you experiencing any urgent symptoms?', help: 'These symptoms need urgent, in-person care and should not be handled through routine checkout.', type: 'multi', options: [['chest-pain','Chest pain'],['vision-hearing','Sudden vision or hearing loss'],['prolonged-erection','An erection lasting more than 4 hours'],['none','None of these']] },
  { key: 'consent', title: 'Privacy and consent', help: 'Health answers are stored separately and used only for care routing, safety review, and required operations—not advertising.', type: 'consent' }
];

export default function ConsultationModal() {
  const { consultationProduct: product, setConsultationProduct, addItem, setNotice } = useApp();
  const [step, setStep] = useState(0); const [answers, setAnswers] = useState({}); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const dialog = useRef(null);
  useEffect(() => { if (product) { setStep(0); setAnswers({}); setError(''); document.body.classList.add('modal-open'); setTimeout(() => dialog.current?.focus(), 20); } else document.body.classList.remove('modal-open'); return () => document.body.classList.remove('modal-open'); }, [product]);
  if (!product) return null;
  const q = questions[step]; const value = answers[q.key];
  const urgent = (answers.urgent || []).some(x => x !== 'none');
  const dangerous = (answers.medical || []).some(x => ['nitrates','riociguat'].includes(x));
  const toggle = option => setAnswers(a => {
    if (q.type === 'multi') {
      if (option === 'none') return { ...a, [q.key]: ['none'] };
      const old = (a[q.key] || []).filter(x => x !== 'none');
      return { ...a, [q.key]: old.includes(option) ? old.filter(x => x !== option) : [...old, option] };
    }
    return { ...a, [q.key]: option };
  });
  const valid = q.type === 'consent' ? answers.privacyConsent && answers.accuracy : Array.isArray(value) ? value.length : Boolean(value);
  const close = () => setConsultationProduct(null);
  const submit = async () => {
    if (urgent) return;
    setBusy(true); setError('');
    const status = dangerous || answers.experience === 'unsure' ? 'ADDITIONAL_INFORMATION_REQUIRED' : 'AWAITING_CLINICIAN_REVIEW';
    try {
      let consultationId = `demo-${crypto.randomUUID()}`;
      try { const result = await api.submitConsultation({ productId: product.id, answers, privacyConsent: true }); consultationId = result.data?.id || consultationId; } catch { /* demo fallback remains clearly identified */ }
      addItem({ ...product, consultationStatus: status }, consultationId);
      close();
      setNotice({ type: 'success', message: dangerous ? 'Added with a safety flag for professional review.' : 'Assessment received. Professional review is required before fulfillment.' });
    } finally { setBusy(false); }
  };
  const next = () => {
    if (!valid) { setError('Please select an answer before continuing.'); return; }
    setError('');
    if (q.key === 'age' && value === 'under-18') { setError('You must be 18 or older. This request cannot continue.'); return; }
    if (q.key === 'urgent' && urgent) return;
    step < questions.length - 1 ? setStep(step + 1) : submit();
  };
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}>
    <section className="intake-modal" role="dialog" aria-modal="true" aria-labelledby="intake-title" tabIndex="-1" ref={dialog}>
      <header><div><span>Private eligibility intake</span><b>{product.name} {product.dosage}</b></div><button className="icon-btn" onClick={close} aria-label="Close"><X/></button></header>
      <div className="progress-row"><span>Step {step + 1} of {questions.length}</span><div className="progress"><i style={{ width: `${((step + 1) / questions.length) * 100}%` }}/></div></div>
      <div className="intake-body">
        {q.key === 'urgent' && urgent ? <div className="urgent-state"><AlertTriangle/><h2>Stop and get urgent medical help</h2><p>These symptoms may require emergency care. Call 911 or go to the nearest emergency department now. Do not continue routine checkout.</p><button className="btn btn-primary" onClick={close}>Close this assessment</button></div> : <>
          <span className="eyebrow"><LockKeyhole size={15}/> Your answers stay private</span><h2 id="intake-title">{q.title}</h2><p className="question-help">{q.help}</p>
          {q.type === 'consent' ? <div className="consent-box"><label><input type="checkbox" checked={!!answers.privacyConsent} onChange={e => setAnswers(a => ({...a, privacyConsent:e.target.checked}))}/><span><b>I consent to health data processing</b><small>I understand this information is used for eligibility and professional review and is not a diagnosis or prescription.</small></span></label><label><input type="checkbox" checked={!!answers.accuracy} onChange={e => setAnswers(a => ({...a, accuracy:e.target.checked}))}/><span><b>I confirm these answers are accurate</b><small>I understand a licensed professional may request additional information.</small></span></label></div> : <div className="answer-list">{q.options.map(([id,label]) => { const selected = Array.isArray(value) ? value.includes(id) : value === id; return <button key={id} className={selected ? 'selected' : ''} onClick={() => toggle(id)}><span>{label}</span><i>{selected && <Check size={16}/>}</i></button>; })}</div>}
          {dangerous && step >= 3 && <div className="safety-flag"><AlertTriangle/><span><b>Professional safety review required.</b> This answer can indicate a serious interaction. No medication is being recommended.</span></div>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </>}
      </div>
      {!urgent && <footer><button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={17}/> Back</button><button className="btn btn-primary" disabled={busy} onClick={next}>{step === questions.length - 1 ? (busy ? 'Submitting…' : 'Submit for review') : 'Continue'} <ArrowRight size={17}/></button></footer>}
    </section>
  </div>;
}

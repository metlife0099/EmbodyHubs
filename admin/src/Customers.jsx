import { useEffect,useState } from 'react';
import { CheckCircle2,ChevronDown,ChevronUp,RefreshCw,Search,UserRound } from 'lucide-react';
import { adminApi } from './api';
import './Customers.css';

const answerLabels={
  ageRange:{'18_29':'18–29','30_44':'30–44','45_59':'45–59','60_PLUS':'60+'},
  serviceGoal:{OTC_SHOPPING:'Shop over-the-counter products',MEDICATION_SAFETY:'Medication safety information',PHARMACIST_QUESTION:'Ask a pharmacist',EXISTING_PRESCRIPTION:'Existing prescription support'},
  pharmacistSupport:{YES:'Yes',NO:'No',NOT_SURE:'Not sure'}
};
const label=(group,value)=>answerLabels[group]?.[value]||value||'Not provided';

export default function Customers(){
  const[customers,setCustomers]=useState([]);
  const[query,setQuery]=useState('');
  const[open,setOpen]=useState(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');

  const load=async(search=query)=>{
    setLoading(true);setError('');
    try{const result=await adminApi.customers(search.trim());setCustomers(result.data)}
    catch(err){setError(err.message)}finally{setLoading(false)}
  };

  useEffect(()=>{load('')},[]);
  const submit=event=>{event.preventDefault();load(query)};

  return <section className="panel customer-directory">
    <header><div><span>Customer directory</span><h2>Profiles and signup answers</h2><p>Only the privacy-minimized profile answers collected during registration are shown here.</p></div><button className="icon-action" onClick={()=>load()} aria-label="Refresh customers"><RefreshCw/></button></header>
    <form className="customer-search" onSubmit={submit}><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search name, email, or state" aria-label="Search customers"/><button>Search</button></form>
    {error&&<p className="admin-error" role="alert">{error}</p>}
    {loading?<div className="admin-loading">Loading customers…</div>:customers.length?<div className="customer-records">{customers.map(customer=><article key={customer.id}>
      <button className="customer-row" onClick={()=>setOpen(open===customer.id?null:customer.id)} aria-expanded={open===customer.id}>
        <span className="customer-avatar"><UserRound/></span>
        <span><b>{customer.name}</b><small>{customer.email}</small></span>
        <span><b>{customer.signupAnswers.state||'—'}</b><small>U.S. state</small></span>
        <span className={`customer-status ${customer.status?.toLowerCase()}`}><b>{customer.status?.replaceAll('_',' ')}</b><small>{customer.emailVerified?'Email verified':'Email pending'}</small></span>
        <span><b>{new Date(customer.createdAt).toLocaleDateString()}</b><small>Joined</small></span>
        {open===customer.id?<ChevronUp/>:<ChevronDown/>}
      </button>
      {open===customer.id&&<div className="customer-detail">
        <div className="answer-heading"><div><span>Registration profile</span><h3>Signup answers</h3></div>{customer.emailVerified&&<span><CheckCircle2/> Verified account</span>}</div>
        <dl>
          <div><dt>Age range</dt><dd>{label('ageRange',customer.signupAnswers.ageRange)}</dd></div>
          <div><dt>U.S. state</dt><dd>{customer.signupAnswers.state||'Not provided'}</dd></div>
          <div><dt>Primary goal</dt><dd>{label('serviceGoal',customer.signupAnswers.serviceGoal)}</dd></div>
          <div><dt>Pharmacist support</dt><dd>{label('pharmacistSupport',customer.signupAnswers.pharmacistSupport)}</dd></div>
          <div><dt>Marketing consent</dt><dd>{customer.signupAnswers.marketingConsent?'Opted in':'Not opted in'}</dd></div>
          <div><dt>Last sign in</dt><dd>{customer.lastLoginAt?new Date(customer.lastLoginAt).toLocaleString():'Not yet'}</dd></div>
        </dl>
        <p className="privacy-note">These answers support account routing and preferences. They are not a diagnosis or a substitute for pharmacist review.</p>
      </div>}
    </article>)}</div>:<div className="empty compact"><h3>No customers found</h3><p>Try another search or wait for a customer to complete registration.</p></div>}
  </section>;
}

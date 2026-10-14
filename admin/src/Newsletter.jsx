import { useEffect,useState } from 'react';
import { CheckCircle2,Mail,RefreshCw,Search,UsersRound } from 'lucide-react';
import { adminApi } from './api';
import './Newsletter.css';

const syncLabels={SYNCED:'Brevo synced',PENDING:'Sync pending',FAILED:'Sync failed',NOT_CONFIGURED:'Local only'};

export default function Newsletter(){
  const[subscribers,setSubscribers]=useState([]);
  const[meta,setMeta]=useState({page:1,pages:1,total:0,all:0,active:0});
  const[query,setQuery]=useState('');
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const load=async(page=1,search=query)=>{setLoading(true);setError('');try{const result=await adminApi.newsletterSubscribers({page,q:search.trim()});setSubscribers(result.data);setMeta(result.meta)}catch(err){setError(err.message)}finally{setLoading(false)}};
  useEffect(()=>{load(1,'')},[]);

  return <div className="newsletter-admin">
    <section className="newsletter-metrics">
      <article><span><UsersRound/></span><div><small>All subscribers</small><strong>{meta.all}</strong></div></article>
      <article><span><CheckCircle2/></span><div><small>Active subscribers</small><strong>{meta.active}</strong></div></article>
      <article className="newsletter-guidance"><Mail/><div><b>Consent-first list</b><small>Every record includes an explicit marketing consent timestamp.</small></div></article>
    </section>
    <section className="panel newsletter-directory">
      <header><div><span>Audience directory</span><h2>Newsletter subscribers</h2><p>Search the consented mailing list and review local or Brevo synchronization status.</p></div><button className="icon-action" onClick={()=>load(meta.page)} aria-label="Refresh subscribers"><RefreshCw/></button></header>
      <form className="newsletter-search" onSubmit={event=>{event.preventDefault();load(1,query)}}><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search by name or email" aria-label="Search subscribers"/><button>Search</button></form>
      {error&&<p className="admin-error" role="alert">{error}</p>}
      {loading?<div className="admin-loading">Loading subscribers…</div>:subscribers.length?<>
        <div className="newsletter-table-wrap"><table className="newsletter-table"><thead><tr><th>Subscriber</th><th>Status</th><th>Provider</th><th>Consented</th><th>Last subscribed</th></tr></thead><tbody>{subscribers.map(subscriber=><tr key={subscriber.id}><td><b>{subscriber.fullName}</b><small>{subscriber.email}</small></td><td><span className={`subscriber-badge ${subscriber.status.toLowerCase()}`}>{subscriber.status}</span></td><td><span className={`sync-badge ${subscriber.syncStatus.toLowerCase().replace('_','-')}`}>{syncLabels[subscriber.syncStatus]||subscriber.syncStatus}</span></td><td>{new Date(subscriber.consentedAt).toLocaleDateString()}</td><td>{new Date(subscriber.lastSubscribedAt).toLocaleString()}</td></tr>)}</tbody></table></div>
        {meta.pages>1&&<nav className="newsletter-pagination" aria-label="Subscriber pages"><button disabled={meta.page<=1} onClick={()=>load(meta.page-1)}>Previous</button><span>Page {meta.page} of {meta.pages}</span><button disabled={meta.page>=meta.pages} onClick={()=>load(meta.page+1)}>Next</button></nav>}
      </>:<div className="empty compact"><Mail/><h3>No subscribers found</h3><p>New newsletter signups will appear here automatically.</p></div>}
    </section>
  </div>;
}

import { useEffect,useState } from 'react';
import { AlertCircle,CheckCircle2,Cloud,Mail,RefreshCw,Search,SlidersHorizontal,UsersRound,X } from 'lucide-react';
import { adminApi } from './api';
import './Newsletter.css';

const syncLabels={SYNCED:'Brevo synced',PENDING:'Sync pending',FAILED:'Sync failed',NOT_CONFIGURED:'Local only'};
const formatDate=value=>value?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(value)):'—';
const formatTime=value=>value?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value)):'—';
const initials=name=>name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();

export default function Newsletter(){
  const[subscribers,setSubscribers]=useState([]);
  const[meta,setMeta]=useState({page:1,pages:1,total:0,stats:{all:0,active:0,synced:0,attention:0}});
  const[filters,setFilters]=useState({q:'',status:'',sync:''});
  const[applied,setApplied]=useState({q:'',status:'',sync:''});
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const load=async(page=1,next=applied)=>{setLoading(true);setError('');try{const result=await adminApi.newsletterSubscribers({page,...next});setSubscribers(result.data);setMeta(result.meta)}catch(err){setError(err.message)}finally{setLoading(false)}};
  useEffect(()=>{load(1,{q:'',status:'',sync:''})},[]);
  const apply=event=>{event.preventDefault();const next={...filters,q:filters.q.trim()};setApplied(next);load(1,next)};
  const clear=()=>{const next={q:'',status:'',sync:''};setFilters(next);setApplied(next);load(1,next)};
  const hasFilters=Boolean(applied.q||applied.status||applied.sync);
  const stats=meta.stats||{};

  return <div className="newsletter-admin">
    <section className="newsletter-command">
      <div><span className="newsletter-kicker"><Mail/> Audience operations</span><h2>Build a cleaner, consent-led audience.</h2><p>Review newsletter signups, delivery synchronization, and consent history from one protected workspace.</p></div>
      <aside><span>List health</span><strong>{stats.all?Math.round((Number(stats.active||0)/Number(stats.all))*100):0}%</strong><small>of subscribers currently active</small></aside>
    </section>

    <section className="newsletter-metrics" aria-label="Newsletter summary">
      <article><span className="metric-icon"><UsersRound/></span><div><small>Total audience</small><strong>{stats.all||0}</strong><em>All captured subscribers</em></div></article>
      <article><span className="metric-icon active"><CheckCircle2/></span><div><small>Active</small><strong>{stats.active||0}</strong><em>Eligible local records</em></div></article>
      <article><span className="metric-icon synced"><Cloud/></span><div><small>Brevo synced</small><strong>{stats.synced||0}</strong><em>Provider-ready contacts</em></div></article>
      <article><span className="metric-icon attention"><AlertCircle/></span><div><small>Needs attention</small><strong>{stats.attention||0}</strong><em>Pending or failed sync</em></div></article>
    </section>

    <section className="panel newsletter-directory">
      <header><div><span>Subscriber directory</span><h2>Audience records</h2><p>{meta.total} matching subscriber{meta.total===1?'':'s'} · newest records first</p></div><button className={`newsletter-refresh ${loading?'is-loading':''}`} onClick={()=>load(meta.page)} aria-label="Refresh subscribers"><RefreshCw/></button></header>
      <form className="newsletter-toolbar" onSubmit={apply}>
        <label className="newsletter-search"><Search/><span className="sr-only">Search subscribers</span><input value={filters.q} onChange={event=>setFilters(current=>({...current,q:event.target.value}))} placeholder="Search name or email"/></label>
        <label><SlidersHorizontal/><span className="sr-only">Subscriber status</span><select value={filters.status} onChange={event=>setFilters(current=>({...current,status:event.target.value}))}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="UNSUBSCRIBED">Unsubscribed</option></select></label>
        <label><Cloud/><span className="sr-only">Provider status</span><select value={filters.sync} onChange={event=>setFilters(current=>({...current,sync:event.target.value}))}><option value="">All delivery states</option><option value="SYNCED">Brevo synced</option><option value="PENDING">Sync pending</option><option value="FAILED">Sync failed</option><option value="NOT_CONFIGURED">Local only</option></select></label>
        <button className="newsletter-apply">Apply filters</button>
        {hasFilters&&<button type="button" className="newsletter-clear" onClick={clear}><X/> Clear</button>}
      </form>
      {error&&<p className="admin-error" role="alert">{error}</p>}
      {loading?<div className="newsletter-loading" aria-live="polite">{[1,2,3,4].map(item=><span key={item}/>)}</div>:subscribers.length?<>
        <div className="newsletter-table-wrap"><table className="newsletter-table"><caption className="sr-only">Newsletter subscriber directory</caption><thead><tr><th>Subscriber</th><th>Subscription</th><th>Delivery</th><th>Consented</th><th>Latest action</th></tr></thead><tbody>{subscribers.map(subscriber=><tr key={subscriber.id}><td data-label="Subscriber"><div className="subscriber-identity"><span>{initials(subscriber.fullName)}</span><div><b>{subscriber.fullName}</b><small>{subscriber.email}</small></div></div></td><td data-label="Subscription"><span className={`subscriber-badge ${subscriber.status.toLowerCase()}`}><i/>{subscriber.status.toLowerCase()}</span></td><td data-label="Delivery"><span className={`sync-badge ${subscriber.syncStatus.toLowerCase().replace('_','-')}`}>{syncLabels[subscriber.syncStatus]||subscriber.syncStatus}</span></td><td data-label="Consented"><b className="date-primary">{formatDate(subscriber.consentedAt)}</b><small className="date-secondary">Subscribe button</small></td><td data-label="Latest action"><b className="date-primary">{formatTime(subscriber.lastSubscribedAt)}</b><small className="date-secondary">Subscribed</small></td></tr>)}</tbody></table></div>
        <footer className="newsletter-table-footer"><span>Showing {subscribers.length} of {meta.total} matching records</span>{meta.pages>1&&<nav className="newsletter-pagination" aria-label="Subscriber pages"><button disabled={meta.page<=1} onClick={()=>load(meta.page-1)}>Previous</button><span>{meta.page} / {meta.pages}</span><button disabled={meta.page>=meta.pages} onClick={()=>load(meta.page+1)}>Next</button></nav>}</footer>
      </>:<div className="newsletter-empty"><span><Mail/></span><h3>{hasFilters?'No matching subscribers':'Your audience starts here'}</h3><p>{hasFilters?'Adjust or clear the filters to see more records.':'New consented newsletter subscriptions will appear here automatically.'}</p>{hasFilters&&<button onClick={clear}>Clear all filters</button>}</div>}
    </section>
  </div>;
}

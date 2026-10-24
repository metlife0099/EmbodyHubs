import { useEffect, useState } from 'react';
import { Check, ChevronDown, Pencil, Plus, RefreshCw, Save, Scale, Trash2, X } from 'lucide-react';
import { adminApi } from './api';
import './CompareManager.css';

const newItem=()=>({name:'',genericName:'',tagline:'',typicalOnset:'',typicalDuration:'',frequency:'',prescription:'',importantConsiderations:'',priceLabel:'',highlights:'',sourceLabel:'',sourceUrl:''});
const empty=()=>({id:'',purpose:'',slug:'',intro:'',items:[newItem(),newItem()],publicationStatus:'PUBLISHED',sortOrder:0});
const fromComparison=comparison=>({id:comparison.id,purpose:comparison.purpose||'',slug:comparison.slug||'',intro:comparison.intro||'',items:(comparison.items||[]).map(item=>({...newItem(),...item,highlights:(item.highlights||[]).join('\n'),sourceLabel:item.source?.label||'',sourceUrl:item.source?.url||''})),publicationStatus:comparison.publicationStatus||'DRAFT',sortOrder:comparison.sortOrder||0});

export default function CompareManager(){
  const[comparisons,setComparisons]=useState([]);
  const[form,setForm]=useState(empty);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState('');
  const[notice,setNotice]=useState('');

  const load=async()=>{setLoading(true);setError('');try{const result=await adminApi.comparisonOptions();setComparisons(result.data||[])}catch(err){setError(err.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  const setItem=(index,key,value)=>setForm(current=>({...current,items:current.items.map((item,itemIndex)=>itemIndex===index?{...item,[key]:value}:item)}));
  const addItem=()=>setForm(current=>current.items.length>=6?current:{...current,items:[...current.items,newItem()]});
  const removeItem=index=>setForm(current=>current.items.length<=2?current:{...current,items:current.items.filter((_,itemIndex)=>itemIndex!==index)});
  const reset=()=>{setForm(empty());setError('');setNotice('');window.scrollTo({top:0,behavior:'smooth'})};
  const edit=comparison=>{setForm(fromComparison(comparison));setError('');setNotice('');window.scrollTo({top:0,behavior:'smooth'})};

  const save=async event=>{
    event.preventDefault();setSaving(true);setError('');setNotice('');
    const payload={purpose:form.purpose,intro:form.intro,publicationStatus:form.publicationStatus,sortOrder:Number(form.sortOrder),items:form.items.map(item=>({name:item.name,genericName:item.genericName,tagline:item.tagline,typicalOnset:item.typicalOnset,typicalDuration:item.typicalDuration,frequency:item.frequency,prescription:item.prescription,importantConsiderations:item.importantConsiderations,priceLabel:item.priceLabel,highlights:item.highlights.split('\n').map(value=>value.trim()).filter(Boolean),source:{label:item.sourceLabel,url:item.sourceUrl}}))};
    try{const result=form.id?await adminApi.updateComparisonOption(form.id,payload):await adminApi.createComparisonOption(payload);setNotice(result.message);setForm(fromComparison(result.data));await load()}catch(err){setError(err.message)}finally{setSaving(false)}
  };
  const archive=async comparison=>{if(!window.confirm(`Archive “${comparison.purpose}”? It will no longer appear on the Compare page.`))return;setError('');try{const result=await adminApi.deleteComparisonOption(comparison.id);setNotice(result.message);if(form.id===comparison.id)setForm(empty());await load()}catch(err){setError(err.message)}};

  return <div className="compare-admin">
    <section className="compare-admin-hero"><div><span>Compare page</span><h2>Manage comparisons</h2><p>Create a purpose, add two or more items, and publish. Extra details are optional.</p></div><button className="compare-new" onClick={reset}><Plus/> Add comparison</button></section>
    {notice&&<div className="compare-admin-notice"><Check/>{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss"><X/></button></div>}
    {error&&<div className="compare-admin-error" role="alert">{error}</div>}

    <form className="panel compare-editor" onSubmit={save}>
      <header><div><span>{form.id?'Edit comparison':'New comparison'}</span><h2>{form.id?form.purpose||'Untitled comparison':'Add a comparison'}</h2></div><Scale/></header>
      <div className="compare-editor-body">
        <section className="compare-step"><div className="compare-step-number">1</div><div><h3>What is the purpose?</h3><p>This becomes the title customers see.</p><label>Purpose<input required maxLength="120" value={form.purpose} onChange={event=>set('purpose',event.target.value)} placeholder="Example: Tadalafil vs Sildenafil"/></label><label>Short introduction <small>Optional</small><textarea maxLength="320" rows="2" value={form.intro} onChange={event=>set('intro',event.target.value)} placeholder="What should customers know before comparing?"/></label></div></section>

        <section className="compare-step"><div className="compare-step-number">2</div><div><div className="compare-items-heading"><div><h3>Add the items</h3><p>Item 1 and Item 2 are required. Add up to six columns.</p></div><button type="button" className="secondary" onClick={addItem} disabled={form.items.length>=6}><Plus/> Add column</button></div><div className="compare-item-grid">{form.items.map((item,index)=><ItemEditor item={item} index={index} setItem={setItem} removeItem={removeItem} canRemove={form.items.length>2} key={index}/>)}</div></div></section>

        <section className="compare-step"><div className="compare-step-number">3</div><div><h3>Publish</h3><p>Published comparisons appear on the customer Compare page immediately.</p><div className="compare-publish-fields"><label>Status<select value={form.publicationStatus} onChange={event=>set('publicationStatus',event.target.value)}><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select></label><label>Display order<input type="number" min="0" max="10000" value={form.sortOrder} onChange={event=>set('sortOrder',event.target.value)}/></label></div></div></section>

        <div className="compare-editor-actions">{form.id&&<button type="button" className="secondary" onClick={reset}>Cancel</button>}<button className="primary" disabled={saving}><Save/>{saving?'Saving…':form.id?'Save changes':'Create comparison'}</button></div>
      </div>
    </form>

    <section className="panel compare-library"><header><div><span>Compare page content</span><h2>All comparisons</h2><p>Customers see every published comparison in this list.</p></div><button onClick={load} aria-label="Refresh comparisons"><RefreshCw/></button></header>{loading?<div className="compare-library-empty">Loading comparisons…</div>:comparisons.length?<div className="compare-library-list">{comparisons.map(comparison=><article key={comparison.id}><div><span className={`compare-state ${comparison.publicationStatus.toLowerCase()}`}>{comparison.publicationStatus}</span><h3>{comparison.purpose}</h3><p>{comparison.items.length} items · display order {comparison.sortOrder}</p><div className="compare-library-items">{comparison.items.map(item=><span key={item.id||item.name}>{item.name}</span>)}</div></div><div className="compare-library-actions"><button onClick={()=>edit(comparison)}><Pencil/> Edit</button><button className="archive" onClick={()=>archive(comparison)} aria-label={`Archive ${comparison.purpose}`}><Trash2/> Archive</button></div></article>)}</div>:<div className="compare-library-empty"><Scale/><h3>No comparisons yet</h3><p>Use “Add comparison” to create the first one.</p></div>}</section>
  </div>
}

function ItemEditor({item,index,setItem,removeItem,canRemove}){
  return <article className="compare-item-card"><header><div><span>Item {index+1}</span><strong>{item.name||`Item ${index+1}`}</strong></div>{canRemove&&<button type="button" onClick={()=>removeItem(index)} aria-label={`Remove item ${index+1}`}><X/></button>}</header><label>Item name<input required maxLength="80" value={item.name} onChange={event=>setItem(index,'name',event.target.value)} placeholder={index===0?'Tadalafil':index===1?'Sildenafil':'Another option'}/></label><label>Short description <small>Optional</small><textarea maxLength="240" rows="2" value={item.tagline} onChange={event=>setItem(index,'tagline',event.target.value)} placeholder="A simple summary for customers."/></label><details><summary>More details <ChevronDown/></summary><div className="compare-advanced"><label>Generic or familiar name<input maxLength="120" value={item.genericName} onChange={event=>setItem(index,'genericName',event.target.value)}/></label><label>Typical onset<input maxLength="180" value={item.typicalOnset} onChange={event=>setItem(index,'typicalOnset',event.target.value)}/></label><label>Typical duration<input maxLength="180" value={item.typicalDuration} onChange={event=>setItem(index,'typicalDuration',event.target.value)}/></label><label>Frequency<input maxLength="180" value={item.frequency} onChange={event=>setItem(index,'frequency',event.target.value)}/></label><label>Prescription<input maxLength="180" value={item.prescription} onChange={event=>setItem(index,'prescription',event.target.value)}/></label><label>Price<input maxLength="180" value={item.priceLabel} onChange={event=>setItem(index,'priceLabel',event.target.value)}/></label><label className="full">Important considerations<textarea maxLength="800" rows="3" value={item.importantConsiderations} onChange={event=>setItem(index,'importantConsiderations',event.target.value)}/></label><label className="full">Highlights <small>One point per line</small><textarea rows="4" value={item.highlights} onChange={event=>setItem(index,'highlights',event.target.value)}/></label><label>Source label<input maxLength="160" value={item.sourceLabel} onChange={event=>setItem(index,'sourceLabel',event.target.value)}/></label><label>HTTPS source URL<input type="url" pattern="https://.*" value={item.sourceUrl} onChange={event=>setItem(index,'sourceUrl',event.target.value)} placeholder="https://…"/></label></div></details></article>
}

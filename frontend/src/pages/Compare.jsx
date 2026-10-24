import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ExternalLink, Info, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { comparisonRows, fallbackComparisons } from '../data/comparisonOptions';
import './Compare.css';

export default function Compare(){
  const[comparisons,setComparisons]=useState(fallbackComparisons);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;api.comparisons().then(result=>{const published=(result.data||[]).filter(item=>item.items?.length>=2);if(active&&published.length)setComparisons(published)}).catch(()=>{}).finally(()=>active&&setLoading(false));return()=>{active=false}},[]);
  return <main className="compare-page">
    <section className="compare-hero">
      <div className="compare-hero__copy"><span className="eyebrow light">Compare your options</span><h1>See the differences.<br/><em>Choose with confidence.</em></h1><p>There is no single option that is right for everyone. Review the details that matter to you, then discuss your needs with a licensed professional.</p><div className="compare-hero__trust"><span><ShieldCheck/> Clear information</span><span><Scale/> Side by side, not ranked</span><span><Sparkles/> Easy to understand</span></div></div>
      <div className="compare-hero__art" aria-hidden="true"><div className="compare-orbit compare-orbit--one"/><div className="compare-orbit compare-orbit--two"/><span className="compare-capsule compare-capsule--one"/><span className="compare-capsule compare-capsule--two"/><div className="compare-hero__mark"><Scale/><strong>Compare</strong><small>Understand the differences</small></div></div>
    </section>

    <nav className="compare-index" aria-label="Available comparisons">
      <div><span>Explore comparisons</span>{comparisons.map((comparison,index)=><a href={`#compare-${comparison.slug}`} key={comparison.id||comparison.slug}><b>{String(index+1).padStart(2,'0')}</b>{comparison.purpose}</a>)}</div>
      {loading&&<small>Checking for the latest published content…</small>}
    </nav>

    {comparisons.map((comparison,index)=><ComparisonSection comparison={comparison} index={index} key={comparison.id||comparison.slug}/>)}

    <section className="compare-safety"><Info/><div><span className="eyebrow">A useful starting point</span><h2>Comparison information is not personal medical advice.</h2><p>Product characteristics do not determine what is appropriate for you. Review warnings, interactions, your health history, and your complete medicine list with a licensed professional.</p></div><Link to="/learn/safety-side-effects">Read safety guides <ArrowRight/></Link></section>
    <section className="compare-cta"><span className="eyebrow light">Still unsure?</span><h2>Start with what matters to you.</h2><p>Explore the care journey, prepare your questions, and let a licensed professional determine whether treatment is appropriate.</p><Link className="btn btn-ivory" to="/online-care">Start My Path <ArrowRight/></Link></section>
  </main>
}

function ComparisonSection({comparison,index}){
  const sources=comparison.items.filter(item=>item.source?.url);
  return <section className="comparison-set" id={`compare-${comparison.slug}`}>
    <header className="comparison-set__header"><div><span className="eyebrow">Comparison {String(index+1).padStart(2,'0')}</span><h2>{comparison.purpose}</h2></div><p>{comparison.intro||'See each option side by side. More details can be added by the pharmacy team.'}</p></header>
    <div className="compare-matrix-scroll" tabIndex="0" aria-label={`${comparison.purpose} comparison table`}>
      <div className="compare-matrix" style={{'--compare-columns':comparison.items.length,'--compare-min':`${210+(comparison.items.length*220)}px`,'--compare-min-mobile':`${120+(comparison.items.length*185)}px`}}>
        <div className="compare-matrix__head"><div className="compare-matrix__corner">At a glance</div>{comparison.items.map((item,itemIndex)=><OptionHeading item={item} number={itemIndex+1} key={item.id||`${item.name}-${itemIndex}`}/>)}</div>
        {comparisonRows.map(([key,label])=><div className={`compare-matrix__row compare-matrix__row--${key}`} key={key}><div className="compare-matrix__label">{label}</div>{comparison.items.map((item,itemIndex)=><div data-label={item.name} key={item.id||`${key}-${itemIndex}`}>{item[key]||'—'}</div>)}</div>)}
      </div>
    </div>
    <div className="compare-consider">
      <header><span className="eyebrow">Helpful details</span><h2>What stands out?</h2><p>These summaries help you prepare questions. They do not rank the options or replace an individual evaluation.</p></header>
      <div className="compare-consider__grid">{comparison.items.map((item,itemIndex)=><ConsiderCard item={item} number={itemIndex+1} key={item.id||`${item.name}-${itemIndex}`}/>)}</div>
    </div>
    {sources.length>0&&<div className="compare-sources"><div><span className="eyebrow">References</span><h2>Review the source.</h2><p>When the pharmacy team provides a source, you can open it directly here.</p></div><div>{sources.map((item,itemIndex)=><a href={item.source.url} target="_blank" rel="noreferrer" key={item.id||`${item.name}-${itemIndex}`}><span>{item.name}</span><strong>{item.source.label}</strong><ExternalLink/></a>)}</div></div>}
  </section>
}

function OptionHeading({item,number}){return <div className="compare-option-heading"><span>{String(number).padStart(2,'0')}</span><div><strong>{item.name}</strong>{item.genericName&&<small>{item.genericName}</small>}</div></div>}
function ConsiderCard({item,number}){return <article><div className="compare-consider__top"><span>{String(number).padStart(2,'0')}</span><Scale/></div>{item.genericName&&<small>{item.genericName}</small>}<h3>{item.name}</h3><p>{item.tagline||'More information will be added by the pharmacy team.'}</p>{item.highlights?.length>0&&<ul>{item.highlights.map((point,index)=><li key={`${point}-${index}`}><Check/>{point}</li>)}</ul>}{item.source?.url&&<a href={item.source.url} target="_blank" rel="noreferrer">Review source <ExternalLink/></a>}</article>}

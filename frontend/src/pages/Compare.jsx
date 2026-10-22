import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ExternalLink, Info, RefreshCw, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { comparisonRows, fallbackComparisonOptions } from '../data/comparisonOptions';
import './Compare.css';

export default function Compare(){
  const[options,setOptions]=useState(fallbackComparisonOptions);const[leftSlug,setLeftSlug]=useState('tadalafil');const[rightSlug,setRightSlug]=useState('sildenafil');const[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;api.comparisons().then(result=>{if(active&&result.data?.length>=2){const sorted=[...result.data].sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)||a.name.localeCompare(b.name));setOptions(sorted);setLeftSlug(current=>sorted.some(item=>item.slug===current)?current:sorted[0].slug);setRightSlug(current=>sorted.some(item=>item.slug===current)&&current!==sorted[0].slug?current:sorted[1].slug)}}).catch(()=>{}).finally(()=>active&&setLoading(false));return()=>{active=false}},[]);
  const left=useMemo(()=>options.find(item=>item.slug===leftSlug)||options[0],[options,leftSlug]);
  const right=useMemo(()=>options.find(item=>item.slug===rightSlug)||options.find(item=>item.slug!==left?.slug)||options[0],[options,rightSlug,left]);
  const choose=(side,value)=>{if(side==='left'){setLeftSlug(value);if(value===rightSlug)setRightSlug(leftSlug)}else{setRightSlug(value);if(value===leftSlug)setLeftSlug(rightSlug)}};
  const swap=()=>{setLeftSlug(right.slug);setRightSlug(left.slug)};
  if(!left||!right)return <main className="compare-empty"><Scale/><h1>Comparison information is being prepared.</h1><p>Published options will appear here after source and clinical review.</p><Link className="btn btn-primary" to="/learn">Visit Learn</Link></main>;
  return <main className="compare-page">
    <section className="compare-hero">
      <div className="compare-hero__copy"><span className="eyebrow light">Compare treatment information</span><h1>See the differences.<br/><em>Choose with confidence.</em></h1><p>There isn’t one option that’s right for everyone. Compare the things that matter to you, then discuss your health history and goals with a licensed professional.</p><div className="compare-hero__trust"><span><ShieldCheck/> Prescription required</span><span><Scale/> Side-by-side, not ranked</span><span><Sparkles/> Source-backed information</span></div></div>
      <div className="compare-hero__art" aria-hidden="true"><div className="compare-orbit compare-orbit--one"/><div className="compare-orbit compare-orbit--two"/><span className="compare-capsule compare-capsule--one"/><span className="compare-capsule compare-capsule--two"/><div className="compare-hero__mark"><Scale/><strong>Compare</strong><small>Understand the differences</small></div></div>
    </section>

    <section className="compare-picker" aria-labelledby="compare-picker-title">
      <div><span className="eyebrow">Build your comparison</span><h2 id="compare-picker-title">Choose two options.</h2><p>Select any two published entries. Changing a selection updates every section below.</p></div>
      <div className="compare-picker__controls">
        <label><span>First option</span><div><select value={left.slug} onChange={event=>choose('left',event.target.value)}>{options.filter(item=>item.slug!==right.slug||item.slug===left.slug).map(item=><option value={item.slug} key={item.slug}>{item.name}</option>)}</select><ChevronDown/></div></label>
        <button onClick={swap} aria-label="Swap comparison options"><RefreshCw/></button>
        <label><span>Second option</span><div><select value={right.slug} onChange={event=>choose('right',event.target.value)}>{options.filter(item=>item.slug!==left.slug||item.slug===right.slug).map(item=><option value={item.slug} key={item.slug}>{item.name}</option>)}</select><ChevronDown/></div></label>
      </div>
      {loading&&<small className="compare-loading">Checking for the latest published comparison content…</small>}
    </section>

    <section className="compare-glance">
      <header><span className="eyebrow">At a glance</span><h2>The details, without the fine-print feeling.</h2><p>Timing and response vary. These are general characteristics, not a prediction of what you will experience.</p></header>
      <div className="compare-matrix">
        <div className="compare-matrix__head"><div/><OptionHeading option={left} number="01"/><OptionHeading option={right} number="02"/></div>
        {comparisonRows.map(([key,label])=><div className={`compare-matrix__row compare-matrix__row--${key}`} key={key}><div className="compare-matrix__label">{label}</div><div data-label={left.name}>{left[key]||'Ask a licensed professional'}</div><div data-label={right.name}>{right[key]||'Ask a licensed professional'}</div></div>)}
      </div>
    </section>

    <section className="compare-consider">
      <header><span className="eyebrow">Questions worth discussing</span><h2>What may make someone consider each option?</h2><p>These points explain practical differences. They are not reasons to choose a medicine without an individual evaluation.</p></header>
      <div className="compare-consider__grid"><ConsiderCard option={left} number="01"/><ConsiderCard option={right} number="02"/></div>
    </section>

    <section className="compare-safety"><Info/><div><span className="eyebrow">Important safety boundary</span><h2>Similar category does not mean interchangeable.</h2><p>Both options require a prescription and professional review. PDE5 inhibitors must not be combined with nitrate medicines. Your complete medicine list, cardiovascular health, blood pressure, kidney or liver health, and other factors may change what is appropriate.</p></div><Link to="/learn/important-precautions-interactions">Read precautions <ArrowRight/></Link></section>

    <section className="compare-sources"><div><span className="eyebrow">Verified references</span><h2>Go to the source.</h2><p>Comparison copy links to current U.S. prescribing information. Product-specific instructions from your prescriber and dispensing pharmacy take priority.</p></div><div>{[left,right].map(option=><a href={option.source.url} target="_blank" rel="noreferrer" key={option.slug}><span>{option.name}</span><strong>{option.source.label}</strong><ExternalLink/></a>)}</div></section>

    <section className="compare-cta"><span className="eyebrow light">Still unsure?</span><h2>Start with what matters to you.</h2><p>Explore the care journey, prepare your questions, and let a licensed professional determine whether treatment is appropriate.</p><Link className="btn btn-ivory" to="/online-care">Start My Path <ArrowRight/></Link></section>
  </main>
}

function OptionHeading({option,number}){return <div className="compare-option-heading"><span>{number}</span><div><strong>{option.name}</strong><small>{option.genericName}</small></div></div>}
function ConsiderCard({option,number}){return <article><div className="compare-consider__top"><span>{number}</span><Scale/></div><small>{option.genericName}</small><h3>{option.name}</h3><p>{option.tagline}</p><ul>{option.highlights.map(item=><li key={item}><Check/>{item}</li>)}</ul><a href={option.source.url} target="_blank" rel="noreferrer">Review official source <ExternalLink/></a></article>}

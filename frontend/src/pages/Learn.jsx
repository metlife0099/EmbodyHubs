import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, BookMarked, BookOpen, ChevronRight, CircleHelp, Clock3, ExternalLink, FileText, LibraryBig, Search, ShieldCheck, Stethoscope } from 'lucide-react';
import { getLearnArticle, glossaryTerms, learnArticles, learnCategories } from '../data/learnContent';
import SaveToHubButton from '../components/SaveToHubButton';
import StartJourneyButton from '../components/StartJourneyButton';
import './Learn.css';

const iconByCategory = {
  'treatment-basics': BookOpen,
  'condition-guides': Stethoscope,
  'treatment-comparisons': FileText,
  'safety-side-effects': ShieldCheck,
  'frequently-asked-questions': CircleHelp,
  glossary: BookMarked
};

function ArticleCard({ article, featured = false }) {
  return <Link className={`learn-card${featured ? ' learn-card--featured' : ''}`} to={`/learn/${article.slug}`}>
    <div className="learn-card__meta"><span>{article.category}</span><span><Clock3/> {article.read}</span></div>
    <h3>{article.title}</h3>
    <p>{article.summary}</p>
    <span className="learn-card__link">Read guide <ArrowRight/></span>
  </Link>;
}

export function Learn() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => learnArticles.filter(article => {
    const matchesCategory = activeCategory === 'all' || article.categoryId === activeCategory;
    const matchesQuery = !normalized || `${article.title} ${article.summary} ${article.category} ${article.keywords.join(' ')}`.toLowerCase().includes(normalized);
    return matchesCategory && matchesQuery;
  }), [activeCategory, normalized]);
  const featured = learnArticles.filter(article => article.featured).slice(0, 3);

  return <main className="learn-hub">
    <section className="learn-hero">
      <div className="learn-hero__copy">
        <span className="eyebrow light">EMBODY Learn</span>
        <h1>Better information.<br/><em>Better conversations.</em></h1>
        <p>Clear, source-backed guides to help you understand common concerns, prepare better questions, and talk with a licensed healthcare professional.</p>
        <form className="learn-search" role="search" onSubmit={event => event.preventDefault()}>
          <Search aria-hidden="true"/>
          <label className="sr-only" htmlFor="learn-search">Search Learn</label>
          <input id="learn-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a treatment, question, or term"/>
        </form>
        <p className="learn-hero__note"><ShieldCheck/><span>Education only—not diagnosis or treatment advice.</span></p>
      </div>
      <div className="learn-hero__visual" aria-hidden="true">
        <img src="/images/pharmacy-still-life-v2.png" alt=""/>
        <div className="learn-hero__stamp"><LibraryBig/><span>Plain language</span><strong>Source checked</strong></div>
      </div>
    </section>

    <nav className="learn-category-nav" aria-label="Learn categories">
      <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>All topics</button>
      {learnCategories.slice(0, -1).map(category => <button key={category.id} className={activeCategory === category.id ? 'active' : ''} onClick={() => setActiveCategory(category.id)}>{category.name}</button>)}
      <Link to="/learn/glossary">Glossary</Link>
    </nav>

    {normalized || activeCategory !== 'all' ? <section className="learn-results" aria-live="polite">
      <div className="learn-section-heading"><div><span className="eyebrow">Filtered library</span><h2>{filtered.length} useful result{filtered.length === 1 ? '' : 's'}</h2></div>{(normalized || activeCategory !== 'all') && <button onClick={() => { setQuery(''); setActiveCategory('all'); }}>Clear filters</button>}</div>
      {filtered.length ? <div className="learn-card-grid">{filtered.map(article => <ArticleCard key={article.slug} article={article}/>)}</div> : <div className="learn-empty"><Search/><h3>No exact match yet</h3><p>Try a shorter phrase, browse a category, or use the glossary for medical terms.</p><Link to="/learn/glossary">Open the glossary <ArrowRight/></Link></div>}
    </section> : <>
      <section className="learn-intro">
        <div><span className="eyebrow">Start here</span><h2>Questions are easier when the language is clear.</h2></div>
        <p>Learn is organized around real decisions—not clicks. Begin with a basic explanation, compare approaches, then review safety and the questions worth taking to a professional.</p>
      </section>

      <section className="learn-featured">
        <div className="learn-section-heading"><div><span className="eyebrow">Essential reading</span><h2>A thoughtful place to begin.</h2></div><span className="learn-updated">Reviewed for source accuracy · Oct 22, 2026</span></div>
        <div className="learn-featured-grid">{featured.map((article, index) => <ArticleCard key={article.slug} article={article} featured={index === 0}/>)}</div>
      </section>

      <section className="learn-directory" aria-labelledby="learn-directory-title">
        <div className="learn-section-heading"><div><span className="eyebrow">Explore the library</span><h2 id="learn-directory-title">Find the right starting point.</h2></div></div>
        <div className="learn-category-grid">
          {learnCategories.slice(0, -1).map(category => {
            const Icon = iconByCategory[category.id];
            const articles = learnArticles.filter(article => article.categoryId === category.id);
            return <article id={category.id} className={`learn-category learn-category--${category.accent}`} key={category.id}>
              <div className="learn-category__top"><span>{category.number}</span><Icon/></div>
              <h3>{category.name}</h3><p>{category.description}</p>
              <ul>{articles.slice(0, 3).map(article => <li key={article.slug}><Link to={`/learn/${article.slug}`}>{article.title}<ChevronRight/></Link></li>)}</ul>
              <button onClick={() => { setActiveCategory(category.id); document.querySelector('.learn-category-nav')?.scrollIntoView({ behavior:'smooth' }); }}>See all {articles.length} guides <ArrowRight/></button>
            </article>;
          })}
        </div>
      </section>

      <section className="learn-glossary-preview">
        <div className="learn-glossary-preview__copy"><span className="eyebrow light">The plain-language glossary</span><h2>“PDE5 inhibitor”<br/><em>should not require another search.</em></h2><p>Medical terms can make a simple question feel complicated. Our glossary explains the words you may see in an evaluation, prescription, or pharmacy conversation.</p><Link className="btn btn-ivory" to="/learn/glossary">Explore the glossary <ArrowRight/></Link></div>
        <div className="learn-term-stack">{glossaryTerms.slice(6, 10).map(item => <div key={item.term}><span>{item.letter}</span><div><strong>{item.term}</strong><p>{item.definition}</p></div></div>)}</div>
      </section>
    </>}

    <section className="learn-standards">
      <ShieldCheck/>
      <div><span className="eyebrow">How we handle health information</span><h2>Clear about what education can—and cannot—do.</h2><p>Our guides use authoritative U.S. health sources and plain language. They do not diagnose a condition, decide whether a prescription is right for you, or replace advice from a licensed professional. In an emergency, call 911.</p></div>
      <Link to="/how-it-works">See our safety approach <ArrowRight/></Link>
    </section>
  </main>;
}

export function LearnArticle() {
  const { slug } = useParams();
  const article = getLearnArticle(slug);
  if (!article) return <main className="learn-not-found"><BookOpen/><span className="eyebrow">Learn</span><h1>That guide is not in the library.</h1><p>It may have moved, or the address may be incomplete.</p><Link className="btn btn-primary" to="/learn"><ArrowLeft/> Back to Learn</Link></main>;

  const related = learnArticles.filter(item => item.slug !== article.slug && item.categoryId === article.categoryId).slice(0, 3);
  return <main className="learn-article">
    <div className="learn-article__shell">
      <nav className="learn-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight/><Link to="/learn">Learn</Link><ChevronRight/><span>{article.category}</span></nav>
      <header className="learn-article__header">
        <div className="learn-card__meta"><span>{article.category}</span><span><Clock3/> {article.read}</span></div>
        <h1>{article.title}</h1><p>{article.summary}</p><div className="hub-public-actions"><SaveToHubButton type="LEARNING" sourceId={article.slug} title={article.title} url={`/learn/${article.slug}`} summary={article.summary}/><StartJourneyButton type="LEARNING" title={article.title} sourceType="ARTICLE" sourceId={article.slug}/></div>
        <div className="learn-review"><ShieldCheck/><div><strong>Source checked</strong><span>Updated {new Date(`${article.updated}T12:00:00`).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})} · Educational content</span></div></div>
      </header>

      <div className="learn-article__layout">
        <aside className="learn-article__aside"><span>In this guide</span>{article.sections.map(section => <a key={section.heading} href={`#${section.heading.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}>{section.heading}</a>)}<a href="#sources">Sources</a></aside>
        <article className="learn-article__body">
          <div className="learn-callout"><BookMarked/><div><h2>The short version</h2><ul>{article.takeaways.map(item => <li key={item}>{item}</li>)}</ul></div></div>
          {article.sections.map(section => <section id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g,'-')} key={section.heading}><h2>{section.heading}</h2>{section.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.list && <ul>{section.list.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}
          <div className="learn-warning"><AlertTriangle/><p><strong>This guide is educational.</strong> It cannot diagnose you or determine whether a medicine is safe for you. Do not start, stop, share, or change a prescription without a licensed healthcare professional. Call 911 for an emergency.</p></div>
          <section className="learn-sources" id="sources"><h2>Sources</h2><p>We use public health and medication resources to support the facts in this guide. Your own prescription information and clinician’s instructions take priority.</p><ol>{article.sources.map(item => <li key={item.url}><a href={item.url} target="_blank" rel="noreferrer">{item.name}<ExternalLink/></a></li>)}</ol></section>
        </article>
      </div>
    </div>
    <section className="learn-related"><div className="learn-section-heading"><div><span className="eyebrow">Continue learning</span><h2>Related reading.</h2></div><Link to="/learn">View all guides <ArrowRight/></Link></div><div className="learn-card-grid">{related.map(item => <ArticleCard key={item.slug} article={item}/>)}</div></section>
  </main>;
}

export function Glossary() {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const terms = glossaryTerms.filter(item => `${item.term} ${item.definition}`.toLowerCase().includes(normalized));
  return <main className="glossary-page">
    <header className="glossary-hero"><nav className="learn-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight/><Link to="/learn">Learn</Link><ChevronRight/><span>Glossary</span></nav><span className="eyebrow light">Plain-language glossary</span><h1>Medical words,<br/><em>made human.</em></h1><p>Clear definitions for terms you may hear during a health, prescription, or pharmacy conversation.</p><div className="learn-search"><Search/><label className="sr-only" htmlFor="glossary-search">Search the glossary</label><input id="glossary-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a word or definition"/></div></header>
    <section className="glossary-list" aria-live="polite">{terms.length ? terms.map(item => <article key={item.term}><span>{item.letter}</span><div><h2>{item.term}</h2><p>{item.definition}</p></div></article>) : <div className="learn-empty"><Search/><h3>No matching term</h3><p>Try a shorter phrase, or return to the Learn library.</p></div>}</section>
    <section className="glossary-footer"><div><BookOpen/><span className="eyebrow">Keep learning</span><h2>A definition is the beginning—not personal medical advice.</h2></div><Link className="btn btn-primary" to="/learn">Browse all guides <ArrowRight/></Link></section>
  </main>;
}

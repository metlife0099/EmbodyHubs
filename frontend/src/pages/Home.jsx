import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, ClipboardCheck, HeartHandshake, PackageCheck, ShieldCheck, Stethoscope } from 'lucide-react';
import { products, categories, articles } from '../data/catalog';
import ProductCard from '../components/ProductCard';

const reveal = { initial:{opacity:0,y:24}, whileInView:{opacity:1,y:0}, viewport:{once:true,margin:'-80px'}, transition:{duration:.55} };

export default function Home() {
  return <>
    <section className="hero">
      <div className="hero-image" role="img" aria-label="Adult man in a calm, private home setting"/>
      <div className="hero-overlay"/>
      <motion.div className="hero-content" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.7}}>
        <span className="eyebrow light">Private care. Thoughtful decisions.</span>
        <h1>Feel like yourself,<br/><em>on your terms.</em></h1>
        <p>Explore men’s health options with clear information, discreet service, and professional review where it matters.</p>
        <div className="hero-actions"><Link className="btn btn-ivory" to="/shop">Explore care <ArrowRight/></Link><Link className="play-link" to="/how-it-works"><span>01</span> See how it works</Link></div>
        <div className="hero-trust"><span><ShieldCheck/> Secure by design</span><span><PackageCheck/> Discreet delivery</span><span><Stethoscope/> Professional review</span></div>
      </motion.div>
    </section>

    <section className="trust-strip"><p>CARE THAT PUTS SAFETY FIRST</p><div><span><CheckCircle2/> No automatic prescribing</span><span><CheckCircle2/> Eligibility verified before fulfillment</span><span><CheckCircle2/> Clear pricing before checkout</span></div></section>

    <section className="section categories-section">
      <motion.div className="section-heading" {...reveal}><div><span className="eyebrow">Explore by need</span><h2>Care that meets you<br/>where you are.</h2></div><p>Private, straightforward pathways built around informed choices—not pressure.</p></motion.div>
      <div className="category-grid">{categories.map((c,i) => <motion.article key={c.slug} className={`category-card category-card--${i+1}`} {...reveal} transition={{duration:.5,delay:i*.08}}><span>0{i+1}</span><div><small>{c.eyebrow}</small><h3>{c.name}</h3><p>{c.description}</p><Link to={`/shop?category=${c.slug}`}>Explore {c.name.toLowerCase()} <ArrowRight/></Link></div></motion.article>)}</div>
    </section>

    <section className="section featured-section">
      <div className="section-heading compact"><div><span className="eyebrow">Thoughtfully selected</span><h2>Explore the collection.</h2></div><Link className="text-link" to="/shop">View all products <ArrowRight/></Link></div>
      <div className="product-grid">{products.slice(0,3).map((p,i) => <ProductCard product={p} index={i} key={p.id}/>)}</div>
      <p className="clinical-disclaimer">Prescription medicines shown are examples only. Display does not establish availability, suitability, approval, or a prescribing relationship.</p>
    </section>

    <section className="process-section">
      <div className="process-intro"><span className="eyebrow light">How it works</span><h2>Care, without<br/><em>the awkward.</em></h2><p>A private, guided path from first questions to the appropriate next step.</p><Link className="btn btn-ivory" to="/how-it-works">See the complete process <ArrowRight/></Link></div>
      <div className="process-steps">
        {[['01',ClipboardCheck,'Tell us what you need','Answer a few focused questions. They help route your request and do not replace a medical assessment.'],['02',Stethoscope,'Professional review','When required, an appropriately licensed professional reviews your request and may ask for more information.'],['03',PackageCheck,'Verified fulfillment','Only eligible orders can move to a licensed pharmacy workflow, with discreet tracking after shipment.']].map(([n,Icon,title,copy]) => <div className="process-step" key={n}><span>{n}</span><Icon/><div><h3>{title}</h3><p>{copy}</p></div></div>)}
      </div>
    </section>

    <section className="section safety-section"><motion.div className="safety-panel" {...reveal}><div><span className="eyebrow">Safety is the service</span><h2>Your health deserves more than a quick checkout.</h2><p>Prescription requests remain gated by professional review, prescription verification, inventory, and pharmacy authorization. Payment never means approval to dispense.</p><Link className="text-link" to="/policies/prescription">Read our prescription policy <ArrowRight/></Link></div><div className="safety-list">{['Health information separated from shopping profiles','Urgent symptoms interrupt the purchase journey','Nitrate and riociguat interaction screening','Role-based access and consequential-action audit logs'].map(x => <span key={x}><ShieldCheck/> {x}</span>)}</div></motion.div></section>

    <section className="section journal-section"><div className="section-heading compact"><div><span className="eyebrow">The journal</span><h2>Clear answers. No shame.</h2></div><Link className="text-link" to="/learn">Visit the journal <ArrowRight/></Link></div><div className="article-grid">{articles.map((a,i) => <Link to={`/learn/${a.slug}`} className="article-card" key={a.slug}><div className={`article-art article-art--${i+1}`}><HeartHandshake/></div><span>{a.category} · {a.read}</span><h3>{a.title}</h3><p>{a.summary}</p><b>Read article <ArrowRight/></b></Link>)}</div></section>

    <section className="cta-section"><span className="eyebrow light">A better next step</span><h2>Ready to explore your options?</h2><p>Start privately, move at your pace, and get appropriate review where required.</p><Link className="btn btn-ivory" to="/shop">Explore care <ArrowRight/></Link></section>
  </>;
}

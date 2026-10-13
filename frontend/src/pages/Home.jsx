import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, ClipboardCheck, HeartHandshake, PackageCheck, ShieldCheck, Stethoscope } from 'lucide-react';
import { categories, articles } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';

const reveal = { initial:{opacity:0,y:24}, whileInView:{opacity:1,y:0}, viewport:{once:true,margin:'-80px'}, transition:{duration:.55} };

export default function Home() {
  const{catalogProducts:products}=useApp();
  return <>
    <section className="hero">
      <div className="hero-image" role="img" aria-label="Adult man in a calm, private home setting"/>
      <div className="hero-overlay"/>
      <motion.div className="hero-content" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.7}}>
        <span className="eyebrow light">Everyday pharmacy. Thoughtful service.</span>
        <h1>Health essentials,<br/><em>made clearer.</em></h1>
        <p>Shop everyday wellness and over-the-counter products with transparent labels, secure accounts, and pharmacist-ready support.</p>
        <div className="hero-actions"><Link className="btn btn-ivory" to="/shop">Explore care <ArrowRight/></Link><Link className="play-link" to="/how-it-works"><span>01</span> See how it works</Link></div>
        <div className="hero-trust"><span><ShieldCheck/> Secure by design</span><span><PackageCheck/> Tracked delivery</span><span><Stethoscope/> Pharmacist access before launch</span></div>
      </motion.div>
    </section>

    <section className="trust-strip"><p>PHARMACY SAFETY FIRST</p><div><span><CheckCircle2/> Label-first information</span><span><CheckCircle2/> State licensing gates</span><span><CheckCircle2/> Clear pricing before checkout</span></div></section>

    <section className="section categories-section">
      <motion.div className="section-heading" {...reveal}><div><span className="eyebrow">Explore by need</span><h2>Everyday essentials,<br/>carefully organized.</h2></div><p>Straightforward categories, readable labels, and no exaggerated health claims.</p></motion.div>
      <div className="category-grid">{categories.map((c,i) => <motion.article key={c.slug} className={`category-card category-card--${i+1}`} {...reveal} transition={{duration:.5,delay:i*.08}}><span>0{i+1}</span><div><small>{c.eyebrow}</small><h3>{c.name}</h3><p>{c.description}</p><Link to={`/shop?category=${c.slug}`}>Explore {c.name.toLowerCase()} <ArrowRight/></Link></div></motion.article>)}</div>
    </section>

    <section className="section featured-section">
      <div className="section-heading compact"><div><span className="eyebrow">Thoughtfully selected</span><h2>Explore the collection.</h2></div><Link className="text-link" to="/shop">View all products <ArrowRight/></Link></div>
      <div className="product-grid">{products.slice(0,3).map((p,i) => <ProductCard product={p} index={i} key={p.id}/>)}</div>
      <p className="clinical-disclaimer">Current demo products are non-prescription examples. Availability, labeling, inventory, tax, and shipping must be verified before a production sale.</p>
    </section>

    <section className="process-section">
      <div className="process-intro"><span className="eyebrow light">How it works</span><h2>Pharmacy service,<br/><em>made transparent.</em></h2><p>A secure path from product information to verified fulfillment and support.</p><Link className="btn btn-ivory" to="/how-it-works">See the complete process <ArrowRight/></Link></div>
      <div className="process-steps">
        {[['01',ClipboardCheck,'Choose label-first products','Review active ingredients, directions, and warnings before adding an OTC item.'],['02',Stethoscope,'Ask a pharmacist when needed','Production prescription service requires a state-licensed pharmacy and a licensed pharmacist available for questions.'],['03',PackageCheck,'Verified fulfillment','The server rechecks inventory, totals, destination eligibility, and order status before shipment.']].map(([n,Icon,title,copy]) => <div className="process-step" key={n}><span>{n}</span><Icon/><div><h3>{title}</h3><p>{copy}</p></div></div>)}
      </div>
    </section>

    <section className="section safety-section"><motion.div className="safety-panel" {...reveal}><div><span className="eyebrow">Safety is the service</span><h2>A legitimate pharmacy is more than a storefront.</h2><p>Prescription sales remain disabled until the operating pharmacy’s state licenses, US address and phone, licensed-pharmacist contact, valid-prescription workflow, and destination eligibility are configured and verified.</p><Link className="text-link" to="/policies/prescription">Read our prescription policy <ArrowRight/></Link></div><div className="safety-list">{['Valid prescriptions required for prescription products','US physical address and phone required before launch','State license checks for the pharmacy and customer location','No controlled substances unless separately authorized'].map(x => <span key={x}><ShieldCheck/> {x}</span>)}</div></motion.div></section>

    <section className="section journal-section"><div className="section-heading compact"><div><span className="eyebrow">The journal</span><h2>Clear answers. No shame.</h2></div><Link className="text-link" to="/learn">Visit the journal <ArrowRight/></Link></div><div className="article-grid">{articles.map((a,i) => <Link to={`/learn/${a.slug}`} className="article-card" key={a.slug}><div className={`article-art article-art--${i+1}`}><HeartHandshake/></div><span>{a.category} · {a.read}</span><h3>{a.title}</h3><p>{a.summary}</p><b>Read article <ArrowRight/></b></Link>)}</div></section>

    <section className="cta-section"><span className="eyebrow light">A better next step</span><h2>Ready to explore your options?</h2><p>Start privately, move at your pace, and get appropriate review where required.</p><Link className="btn btn-ivory" to="/shop">Explore care <ArrowRight/></Link></section>
  </>;
}

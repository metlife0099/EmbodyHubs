import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import ProductPlanBuilder from '../components/ProductPlanBuilder';
import { getCareContent } from '../data/careContent';
import './ProductVariants.css';

export default function ProductDetail() {
  const { slug } = useParams();
  const { requestAdd, catalogProducts: products, catalogCategories: categories } = useApp();
  const [openFaq, setOpenFaq] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const product = products.find(item => item.slug === slug);
  const variants = product?.variants || [];
  const selectedVariant = variants.find(item => item.id === selectedVariantId) || variants.find(item => item.stock > 0) || variants[0];
  useEffect(() => { setSelectedVariantId(product?.variantId || ''); }, [product?.id]);

  if (!product) return <div className="empty-page"><span className="eyebrow">Online care</span><h1>Product not found</h1><p>This product may have moved or is no longer available.</p><Link className="btn btn-primary" to="/online-care">Explore online care <ArrowRight/></Link></div>;

  const selectedProduct = selectedVariant ? {...product,variantId:selectedVariant.id,variantLabel:selectedVariant.label,sku:selectedVariant.sku,dosage:selectedVariant.dosage,form:selectedVariant.form,pack:selectedVariant.pack,price:selectedVariant.price,stock:selectedVariant.stock,cartKey:`${product.id}:${selectedVariant.id||'default'}`} : product;
  const content = getCareContent(product);
  const category = categories.find(item => item.slug === product.category) || { name: 'Everyday care', slug: product.category };
  const warnings = product.warnings?.length ? product.warnings : ['Read the complete product label before use.', 'Ask a healthcare professional if you have questions about medicines, allergies, or health conditions.'];
  const categoryProducts = products.filter(item => item.category === product.category);
  const related = categoryProducts.filter(item => item.id !== product.id).slice(0, 3);

  return <article className="product-detail-page">
    <nav className="pdp-breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link><span>/</span><Link to="/online-care">Online care</Link><span>/</span><Link to={`/online-care?category=${category.slug}`}>{category.name}</Link><span>/</span><span aria-current="page">{product.name}</span>
    </nav>

    <section className="pdp-hero-modern">
      <div className={`pdp-gallery product-visual--${product.tone}`}>
        <div className="pdp-gallery-top"><span className="pdp-care-label">{content.careName}</span><span className="rx-pill">{selectedProduct.stock <= 0 ? 'Out' : product.prescriptionRequired ? 'Rx' : 'OTC'}</span></div>
        {product.imageUrl ? <img className="pdp-photo" src={product.imageUrl} alt={product.imageAlt || product.name}/> : <div className="pdp-pack-stage"><div className="product-pack product-pack--large"><small>EMBODY</small><b>{product.name}</b><span>{selectedProduct.dosage} · {selectedProduct.form}</span><i>{selectedProduct.pack}</i></div><div className="pdp-shape pdp-shape--one"/><div className="pdp-shape pdp-shape--two"/></div>}
        <p>Actual packaging and appearance may vary. Always read the package label.</p>
      </div>

      <div className="pdp-purchase">
        <Link className="pdp-back" to="/online-care"><ArrowLeft/> All online care</Link>
        <span className="product-badge">{product.badge}</span>
        <h1>{product.name}</h1>
        <p className="pdp-headline">{content.headline}</p>
        <p className="ingredient">{[product.ingredient, selectedProduct.dosage, selectedProduct.form].filter(Boolean).join(' · ')}</p>
        <ul className="pdp-benefit-list">{content.summaryPoints.map(point => <li key={point}><Check/>{point}</li>)}</ul>
        {product.hasVariants&&<fieldset className="pdp-variant-picker"><legend>Choose an option <span>{variants.length} available configurations</span></legend><div>{variants.map(variant=><label className={`${variant.id===selectedProduct.variantId?'is-selected':''} ${variant.stock<=0?'is-unavailable':''}`} key={variant.id}><input type="radio" name="product-variant" value={variant.id} checked={variant.id===selectedProduct.variantId} disabled={variant.stock<=0} onChange={()=>setSelectedVariantId(variant.id)}/><span><b>{variant.label}</b><small>{variant.stock>0?`${variant.stock} in stock · ${variant.sku}`:'Out of stock'}</small></span><strong>${variant.price.toFixed(2)}</strong></label>)}</div></fieldset>}
        <div className="pdp-price-panel"><div><small>{product.hasVariants?'Selected option':'One-time purchase'}</small><strong>${Number(selectedProduct.price).toFixed(2)}</strong></div><span>{selectedProduct.pack}{selectedProduct.sku&&<small>SKU {selectedProduct.sku}</small>}</span></div>
        <button disabled={selectedProduct.stock <= 0} className="btn btn-primary btn-wide pdp-add-button" onClick={() => requestAdd(selectedProduct)}>{selectedProduct.stock <= 0 ? 'Currently out of stock' : 'Add selected option to cart'}{selectedProduct.stock > 0 && <ArrowRight/>}</button>
        <p className="pdp-account-note"><ShieldCheck/> Secure sign-in is required before an item can be added. Product questions appear when enabled by the pharmacy team.</p>
        <div className="pdp-service-row"><span><Truck/> Discreet shipping</span><span><PackageCheck/> Live stock check</span><span><ShieldCheck/> Secure checkout</span></div>
      </div>
    </section>

    <section className="pdp-fact-strip" aria-label="Product summary">
      <div><small>Active ingredient</small><strong>{product.ingredient || 'See product label'}</strong></div>
      <div><small>Strength</small><strong>{selectedProduct.dosage || 'See product label'}</strong></div>
      <div><small>Form</small><strong>{selectedProduct.form || 'See product label'}</strong></div>
      <div><small>Package</small><strong>{selectedProduct.pack || 'See product label'}</strong></div>
    </section>

    {product.pricingConfigurator?.enabled&&<ProductPlanBuilder product={product} categoryProducts={categoryProducts} requestAdd={requestAdd}/>}

    <section className="pdp-story">
      <aside><span className="eyebrow">Product guide</span><h2>The details, without the guesswork.</h2><p>Use this overview with the complete package label. If the two differ, follow the label.</p></aside>
      <div className="pdp-story-sections">
        <section><span>01</span><div><h3>What it is</h3><p>{product.description}</p></div></section>
        <section><span>02</span><div><h3>How it works</h3><p>{content.howItWorks}</p></div></section>
        <section><span>03</span><div><h3>How to use it</h3><p>{product.directions || 'Use only as directed on the complete product label. Do not take or apply more than directed.'}</p></div></section>
      </div>
    </section>

    <section className="pdp-safety">
      <div className="pdp-safety-title"><AlertTriangle/><span className="eyebrow">Important safety information</span><h2>Know the warnings before use.</h2><p>This summary is not the complete Drug Facts or product label.</p></div>
      <div className="pdp-warning-list">{warnings.map((warning, index) => <div key={warning}><span>0{index + 1}</span><p>{warning}</p></div>)}<div className="pdp-pharmacist-note"><ShieldCheck/><p><b>When to ask a pharmacist</b>{content.pharmacistNote}</p></div></div>
    </section>

    <section className="pdp-faq">
      <header><span className="eyebrow"><CircleHelp/> Common questions</span><h2>Good to know.</h2><p>Clear answers for a more informed purchase.</p></header>
      <div className="pdp-faq-list">{content.faqs.map(([question, answer], index) => <div className={openFaq === index ? 'is-open' : ''} key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span><ChevronDown/></button>{openFaq === index && <p>{answer}</p>}</div>)}</div>
    </section>

    {related.length > 0 && <section className="pdp-related"><div className="section-heading compact"><div><span className="eyebrow">Related {category.name}</span><h2>More in this category.</h2></div><Link className="text-link" to={`/online-care?category=${category.slug}`}>View category <ArrowRight/></Link></div><div className="product-grid">{related.map((item, index) => <ProductCard key={item.id} product={item} index={index}/>)}</div></section>}

    <section className="pdp-disclaimer"><ShieldCheck/><p><b>Use products safely.</b> Information on this page is educational and does not replace the complete label or professional medical advice. Stop use and get medical help as directed by the label. For emergencies, call 911.</p></section>
  </article>;
}

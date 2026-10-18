import { useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, Check, HeartPulse, PackageCheck, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';

export default function OnlineCare() {
  const { slug: routeCategory } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [sort, setSort] = useState('featured');
  const { catalogProducts: products, catalogCategories: categories } = useApp();
  const requestedCategory = routeCategory || params.get('category') || 'all';
  const category = categories.some(item => item.slug === requestedCategory) ? requestedCategory : 'all';
  const shown = useMemo(() => {
    const filtered = products.filter(product => category === 'all' || product.category === category);
    return [...filtered].sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : 0);
  }, [products, category, sort]);

  const chooseCategory = value => navigate(value === 'all' ? '/online-care#care-products' : `/online-care?category=${value}#care-products`);

  return <div className="online-care-page">
    <section className="care-hero">
      <div className="care-hero-copy">
        <span className="eyebrow light"><Sparkles/> Online care, made clearer</span>
        <h1>Everyday care.<br/><em>Clearly explained.</em></h1>
        <p>Explore OTC and wellness products by care need, compare the details that matter, and add to cart through a secure account.</p>
        <div className="care-hero-actions"><a className="btn btn-ivory" href="#care-products">Explore all products <ArrowDown/></a><Link className="care-hero-link" to="/how-it-works">How it works <ArrowRight/></Link></div>
        <div className="care-hero-trust"><span><ShieldCheck/> Label-first information</span><span><PackageCheck/> Live inventory</span><span><HeartPulse/> Pharmacist-ready support</span></div>
      </div>
      <div className="care-hero-art" aria-hidden="true">
        <div className="care-orbit care-orbit--one"/>
        <div className="care-orbit care-orbit--two"/>
        <div className="care-pack care-pack--main"><small>EMBODY</small><b>Everyday<br/>care</b><span>Clear labels · Secure checkout</span></div>
        <div className="care-roundel"><b>{products.length}</b><span>care options</span></div>
        <div className="care-note"><Check/> Shop by care need</div>
      </div>
    </section>

    <section className="care-catalog" id="care-products">
      <header className="care-catalog-heading">
        <div><span className="eyebrow">The complete collection</span><h2>Find your everyday care.</h2><p>{shown.length} product{shown.length === 1 ? '' : 's'} with ingredient, direction, and safety details.</p></div>
        <label className="care-sort"><SlidersHorizontal/><span>Sort</span><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort products"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
      </header>
      <div className="care-filter" aria-label="Filter products by care category">
        <button className={category === 'all' ? 'active' : ''} onClick={() => chooseCategory('all')}>All care <span>{products.length}</span></button>
        {categories.map(item => <button key={item.slug} className={category === item.slug ? 'active' : ''} onClick={() => chooseCategory(item.slug)}>{item.name} <span>{products.filter(product => product.category === item.slug).length}</span></button>)}
      </div>
      {shown.length ? <div className="product-grid care-product-grid">{shown.map((product, index) => <ProductCard product={product} index={index} key={product.id}/>)}</div> : <div className="care-empty"><h3>No products in this care area yet.</h3><p>Choose another category to view available options.</p><button className="btn btn-primary" onClick={() => chooseCategory('all')}>View all care</button></div>}
    </section>

    <section className="care-pathways">
      <div className="care-pathways-intro"><span className="eyebrow light">Browse your way</span><h2>Care organized around real routines.</h2><p>Start with a need, then open any product for label details, directions, warnings, and common questions.</p></div>
      <div className="care-pathway-list">{categories.map((item, index) => <Link key={item.slug} to={`/online-care?category=${item.slug}#care-products`}><span>0{index + 1}</span><div><small>{item.eyebrow}</small><h3>{item.name}</h3><p>{item.description}</p></div><ArrowRight/></Link>)}</div>
    </section>

    <section className="care-safety-callout">
      <div><ShieldCheck/><span className="eyebrow">Designed for informed choices</span><h2>Read the label. Know when to ask.</h2></div>
      <div><p>Every detail page brings key facts, directions, warnings, and pharmacist guidance into one readable place.</p><p>Product information does not replace the complete package label or advice from a healthcare professional. For emergencies, call 911.</p><Link className="btn btn-primary" to="/how-it-works">See our safety approach <ArrowRight/></Link></div>
    </section>
  </div>;
}

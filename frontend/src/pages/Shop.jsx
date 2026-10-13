import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { categories } from '../data/catalog';
import { useApp } from '../context/AppContext';

export default function Shop() {
  const [params, setParams] = useSearchParams(); const [sort, setSort] = useState('featured');
  const { catalogProducts:products }=useApp();
  const category = params.get('category') || 'all';
  const shown = useMemo(() => products.filter(p => category === 'all' || p.category === category).sort((a,b) => sort === 'low' ? a.price-b.price : sort === 'high' ? b.price-a.price : 0), [category, sort]);
  return <div className="page-shell"><header className="page-hero"><span className="eyebrow">EMBODY collection</span><h1>Care, thoughtfully curated.</h1><p>Clear product information with professional review built into every prescription pathway.</p></header><div className="shop-toolbar"><div className="filter-tabs"><button onClick={() => setParams({})} className={category==='all'?'active':''}>All</button>{categories.map(c => <button key={c.slug} className={category===c.slug?'active':''} onClick={() => setParams({category:c.slug})}>{c.name}</button>)}</div><label><SlidersHorizontal size={16}/><span className="sr-only">Sort products</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div><div className="product-grid shop-grid">{shown.map((p,i)=><ProductCard product={p} index={i} key={p.id}/>)}</div></div>;
}

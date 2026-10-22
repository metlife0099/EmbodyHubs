import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product, index = 0 }) {
  const { requestAdd } = useApp();
  return <motion.article className="product-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: index * .08 }}>
    <Link className={`product-visual product-visual--${product.tone}`} to={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
      <span className="rx-pill">{product.stock<=0?'Out':product.prescriptionRequired ? 'Rx' : 'OTC'}</span>
      {product.imageUrl?<img className="product-photo" src={product.imageUrl} alt={product.imageAlt}/>:<div className="product-pack"><small>EMBODY</small><b>{product.name}</b><span>{product.dosage} · {product.form}</span><i>{product.pack}</i></div>}
    </Link>
    <div className="product-info">
      <span className="product-badge">{product.prescriptionRequired && <LockKeyhole size={13}/>} {product.badge}</span>
      <div className="product-title"><div><h3><Link to={`/products/${product.slug}`}>{product.name}</Link></h3><p>{product.ingredient} · {product.hasVariants?`${product.variants.length} options`:product.dosage}</p></div><strong>{product.hasVariants?'From ':''}${Number(product.hasVariants?product.minPrice:product.price).toFixed(2)}</strong></div>
      {product.hasVariants?<Link className="text-action" to={`/products/${product.slug}`}>Choose options <ArrowRight size={16}/></Link>:<button className="text-action" disabled={product.stock<=0} onClick={() => requestAdd(product)}>{product.stock<=0?'Out of stock':'Add to cart'} {product.stock>0&&<ArrowRight size={16}/>}</button>}
    </div>
  </motion.article>;
}

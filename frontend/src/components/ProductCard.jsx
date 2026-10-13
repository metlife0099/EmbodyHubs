import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product, index = 0 }) {
  const { requestAdd } = useApp();
  return <motion.article className="product-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: index * .08 }}>
    <Link className={`product-visual product-visual--${product.tone}`} to={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
      <span className="rx-pill">{product.prescriptionRequired ? 'Rx' : 'OTC'}</span>
      <div className="product-pack"><small>EMBODY</small><b>{product.name}</b><span>{product.dosage} · {product.form}</span><i>{product.pack}</i></div>
    </Link>
    <div className="product-info">
      <span className="product-badge">{product.prescriptionRequired && <LockKeyhole size={13}/>} {product.badge}</span>
      <div className="product-title"><div><h3><Link to={`/products/${product.slug}`}>{product.name}</Link></h3><p>{product.ingredient} · {product.dosage}</p></div><strong>${product.price}</strong></div>
      <button className="text-action" onClick={() => requestAdd(product)}>{product.prescriptionRequired ? 'Start eligibility review' : 'Add to cart'} <ArrowRight size={16}/></button>
    </div>
  </motion.article>;
}

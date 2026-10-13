import { Link } from 'react-router-dom';
export default function Brand({ light = false }) {
  return <Link className={`brand ${light ? 'brand--light' : ''}`} to="/" aria-label="Embody Men's Health home"><span className="brand-mark" aria-hidden="true">E</span><span><b>EMBODY</b><small>MEN’S HEALTH</small></span></Link>;
}

import { Link } from 'react-router-dom';
import './Brand.css';
export default function Brand({ light = false }) {
  return <Link className={`brand ${light ? 'brand--light' : ''}`} to="/" aria-label="Embody Hubs home"><img className="brand-logo" src="/images/embody-logo-512.png" alt="" aria-hidden="true"/><span className="brand-wordmark"><b>Embody</b><strong>Hubs</strong></span></Link>;
}

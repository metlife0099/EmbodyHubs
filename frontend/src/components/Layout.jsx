import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Search, ShoppingBag, UserRound, X, ArrowRight, Camera, BriefcaseBusiness } from 'lucide-react';
import Brand from './Brand';
import SeoManager from './SeoManager';
import { useApp } from '../context/AppContext';

const nav = [['Shop', '/shop'], ['How it works', '/how-it-works'], ['Learn', '/learn'], ['About', '/about']];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const { count, notice } = useApp();
  const location = useLocation();
  useEffect(() => { setOpen(false); setSearch(false); window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);
  return <>
    <SeoManager/>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="announcement">Free shipping on orders over $50 <span>•</span> <Link to="/how-it-works">See how pharmacy service works <ArrowRight size={14}/></Link></div>
    <header className="site-header">
      <div className="header-inner">
        <button className="icon-btn mobile-only" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X/> : <Menu/>}</button>
        <Brand/>
        <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          {nav.map(([label, path]) => <NavLink key={path} to={path}>{label}</NavLink>)}
          <Link className="mobile-nav-cta" to="/shop">Start exploring <ArrowRight size={16}/></Link>
        </nav>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setSearch(true)} aria-label="Search"><Search/></button>
          <Link className="icon-btn hide-mobile" to="/account" aria-label="Account"><UserRound/></Link>
          <Link className="icon-btn cart-icon" to="/cart" aria-label={`Cart with ${count} items`}><ShoppingBag/>{count > 0 && <span>{count}</span>}</Link>
        </div>
      </div>
    </header>
    {search && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search"><button className="close-search" onClick={() => setSearch(false)} aria-label="Close search"><X/></button><form action="/search"><label htmlFor="site-search">What can we help you find?</label><div><input id="site-search" name="q" autoFocus placeholder="Search products and guidance"/><button className="btn btn-primary">Search</button></div><p>Popular: allergy relief, pain relief, medication safety</p></form></div>}
    <main id="main">{children}</main>
    <footer className="site-footer">
      <div className="footer-top"><div><Brand light/><p>Everyday pharmacy shopping designed around privacy, safety, and informed decisions.</p><div className="socials"><a href="#social" aria-label="Social updates"><Camera/></a><a href="#company" aria-label="Company updates"><BriefcaseBusiness/></a></div></div>
        <div><h3>Pharmacy</h3><Link to="/shop">Shop OTC</Link><Link to="/how-it-works">How it works</Link><Link to="/tracking">Track an order</Link><Link to="/contact">Ask for help</Link></div>
        <div><h3>Company</h3><Link to="/about">About</Link><Link to="/learn">Learn</Link><Link to="/contact">Contact</Link><Link to="/account">My account</Link></div>
        <div><h3>Important</h3><Link to="/policies/privacy">Privacy</Link><Link to="/policies/terms">Terms</Link><Link to="/policies/shipping">Shipping</Link><Link to="/policies/prescription">Prescription policy</Link></div>
      </div>
      <div className="footer-notice"><p><b>Important safety note:</b> EMBODY is a demonstration platform and is not a pharmacy or medical practice. Prescription products require review by an appropriately licensed professional and verification by a licensed dispensing pharmacy before fulfillment. For emergencies, call 911.</p></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} EMBODY Pharmacy</span><span>Built for legal, pharmacy, privacy, and security review before launch.</span></div>
    </footer>
    {notice && <div className={`toast toast--${notice.type}`} role="status">{notice.message}</div>}
  </>;
}

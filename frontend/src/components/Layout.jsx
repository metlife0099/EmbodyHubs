import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Search, ShoppingBag, UserRound, X, ArrowRight, Camera, BriefcaseBusiness, ChevronDown, Stethoscope } from 'lucide-react';
import Brand from './Brand';
import SeoManager from './SeoManager';
import { useApp } from '../context/AppContext';
import CartQuestionnaire from './CartQuestionnaire';
import LoginRequiredModal from './LoginRequiredModal';
import NewsletterSignup from './NewsletterSignup';
import SupportChatWidget from './SupportChatWidget';

const nav = [['How it works', '/how-it-works'], ['Compare', '/compare'], ['Learn', '/learn'], ['About', '/about']];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const careNavRef = useRef(null);
  const { count, notice, catalogProducts, catalogCategories } = useApp();
  const location = useLocation();
  useEffect(() => { setOpen(false); setSearch(false); setCareOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname, location.search]);
  useEffect(() => { const close = event => { if (event.type === 'keydown' && event.key !== 'Escape') return; if (event.type === 'pointerdown' && careNavRef.current?.contains(event.target)) return; setCareOpen(false) }; document.addEventListener('pointerdown', close); document.addEventListener('keydown', close); return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close) } }, []);
  return <>
    <SeoManager/>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="professional-switch"><Link to="/professionals"><Stethoscope/><span>Are you a healthcare professional?</span><b>Join EMBODY Now</b><ArrowRight/></Link></div>
    <div className="announcement">Free shipping on orders over $50 <span>•</span> <Link to="/how-it-works">See how pharmacy service works <ArrowRight size={14}/></Link></div>
    <header className="site-header">
      <div className="header-inner">
        <button className="icon-btn mobile-only" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X/> : <Menu/>}</button>
        <Brand/>
        <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          <div className={`care-nav ${careOpen ? 'is-open' : ''}`} ref={careNavRef}>
            <button className="care-nav-trigger" onClick={() => setCareOpen(value => !value)} aria-expanded={careOpen} aria-controls="care-mega-menu">Online care <ChevronDown/></button>
            <div className="care-mega" id="care-mega-menu" aria-hidden={!careOpen}>
              <div className="care-mega-intro"><span className="eyebrow">Online care</span><h2>Find care by need.</h2><p>Browse every available option with clear product, direction, and safety information.</p><Link className="text-link" to="/online-care">See all products <ArrowRight/></Link></div>
              <div className="care-mega-groups">{catalogCategories.map(category => { const grouped = catalogProducts.filter(product => product.category === category.slug); return <section className="care-mega-group" key={category.slug}><Link className="care-mega-heading" to={`/online-care?category=${category.slug}`}><span>{category.name}</span><ArrowRight/></Link>{grouped.length ? grouped.map(product => <Link key={product.id} to={`/products/${product.slug}`}><b>{product.name}</b><small>{[product.ingredient, product.dosage].filter(Boolean).join(' · ') || 'View product details'}</small></Link>) : <small className="care-mega-empty">No published products yet</small>}</section>})}</div>
            </div>
          </div>
          {nav.map(([label, path]) => <NavLink key={path} to={path}>{label}</NavLink>)}
          <Link className="mobile-nav-cta" to="/online-care">Explore all care <ArrowRight size={16}/></Link>
        </nav>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setSearch(true)} aria-label="Search"><Search/></button>
          <Link className="icon-btn hide-mobile" to="/support/chat" aria-label="Customer support chat"><BriefcaseBusiness/></Link>
          <Link className="icon-btn hide-mobile" to="/account" aria-label="Account"><UserRound/></Link>
          <Link className="icon-btn cart-icon" to="/cart" aria-label={`Cart with ${count} items`}><ShoppingBag/>{count > 0 && <span>{count}</span>}</Link>
        </div>
      </div>
    </header>
    {search && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search"><button className="close-search" onClick={() => setSearch(false)} aria-label="Close search"><X/></button><form action="/search"><label htmlFor="site-search">What can we help you find?</label><div><input id="site-search" name="q" autoFocus placeholder="Search products and guidance"/><button className="btn btn-primary">Search</button></div><p>Popular: allergy relief, pain relief, medication safety</p></form></div>}
    <main id="main">{children}</main>
    <NewsletterSignup/>
    <footer className="site-footer">
      <div className="footer-top"><div><Brand light/><p>Everyday pharmacy shopping designed around privacy, safety, and informed decisions.</p><div className="socials"><a href="#social" aria-label="Social updates"><Camera/></a><a href="#company" aria-label="Company updates"><BriefcaseBusiness/></a></div></div>
        <div><h3>Pharmacy</h3><Link to="/online-care">Online care</Link><Link to="/how-it-works">How it works</Link><Link to="/tracking">Track an order</Link><Link to="/support/chat">Customer chat</Link></div>
        <div><h3>Company</h3><Link to="/about">About</Link><Link to="/compare">Compare</Link><Link to="/learn">Learn</Link><Link to="/contact">Contact</Link><Link to="/account">My account</Link></div>
        <div><h3>Important</h3><Link to="/policies/privacy">Privacy</Link><Link to="/policies/terms">Terms</Link><Link to="/policies/shipping">Shipping</Link><Link to="/policies/prescription">Prescription policy</Link></div>
      </div>
      <div className="footer-notice"><p><b>Important safety note:</b> EMBODY is a demonstration platform and is not a pharmacy or medical practice. Prescription products require review by an appropriately licensed professional and verification by a licensed dispensing pharmacy before fulfillment. For emergencies, call 911.</p></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} EMBODY Pharmacy</span><span>Built for legal, pharmacy, privacy, and security review before launch.</span></div>
    </footer>
    {notice && <div className={`toast toast--${notice.type}`} role="status">{notice.message}</div>}
    <CartQuestionnaire/>
    <LoginRequiredModal/>
    <SupportChatWidget/>
  </>;
}

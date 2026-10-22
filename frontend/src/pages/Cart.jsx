import { useEffect,useRef } from 'react';
import { Link,useLocation } from 'react-router-dom';
import { ArrowRight,CheckCircle2,LockKeyhole,Minus,Plus,ShieldCheck,Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './ProductVariants.css';

export default function Cart(){
  const{cart,user,subtotal,requestAdd,updateQuantity,removeItem}=useApp();
  const location=useLocation();
  const prompted=useRef(false);
  const pendingItem=user?cart.find(item=>!item.questionnaireCompleted||item.questionnaireCompletedBy!==user.id):null;
  const shipping=subtotal>=50?0:6;
  const total=subtotal+shipping;

  useEffect(()=>{
    const shouldReview=new URLSearchParams(location.search).get('review')==='1';
    if(shouldReview&&pendingItem&&!prompted.current){prompted.current=true;requestAdd(pendingItem,{existing:true})}
  },[location.search,pendingItem,requestAdd]);

  if(!cart.length)return <div className="empty-page empty-cart"><div className="empty-cart-card"><span className="eyebrow">Your cart</span><h1>A little room for essentials.</h1><p>Your cart is empty. Explore everyday OTC and wellness products selected for clear, label-first shopping.</p><Link className="btn btn-primary" to="/online-care">Explore the collection <ArrowRight/></Link></div></div>;
  return <div className="page-shell cart-page">
    <header className="simple-header cart-hero"><div><span className="eyebrow">Secure cart</span><h1>Your selections.</h1><p>Only signed-in customers can add products. Required product questions are completed before an item enters this cart.</p></div><div className="cart-hero-trust"><ShieldCheck/><span><b>Protected checkout</b><small>Secure account and server-verified answers</small></span></div></header>
    <div className="cart-grid">
      <div className="cart-items">{cart.map(item=><article className="cart-item" key={item.cartKey}>
        <div className={`cart-thumb product-visual--${item.tone}`}><div className="mini-pack">{item.name}<small>{item.dosage}</small></div></div>
        <div className="cart-copy"><span>{item.prescriptionRequired?'Prescription · Unavailable in demo':'Non-prescription'}</span><h2>{item.name}</h2><p>{item.variantLabel||[item.dosage,item.form,item.pack].filter(Boolean).join(' · ')}</p>{item.sku&&<small className="cart-sku">SKU {item.sku}</small>}
          {user&&item.questionnaireCompleted&&item.questionnaireCompletedBy===user.id&&<div className="review-status"><CheckCircle2/> Customer questions complete</div>}
          <div className="cart-controls"><div className="quantity-control" aria-label={`Quantity for ${item.name}`}><button type="button" disabled={item.quantity<=1} onClick={()=>updateQuantity(item.cartKey,item.quantity-1)} aria-label={`Decrease ${item.name} quantity`}><Minus/></button><output className="quantity-value" aria-live="polite" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</output><button type="button" disabled={item.quantity>=item.stock} onClick={()=>updateQuantity(item.cartKey,item.quantity+1)} aria-label={`Increase ${item.name} quantity`}><Plus/></button></div><button type="button" className="remove-btn" onClick={()=>removeItem(item.cartKey)}><Trash2/> Remove</button></div>
        </div><strong>${(item.price*item.quantity).toFixed(2)}</strong>
      </article>)}</div>
      <aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal</span><b>${subtotal.toFixed(2)}</b></div><div><span>Estimated shipping</span><b>{shipping?'$6.00':'Free'}</b></div><div className="summary-total"><span>Estimated total</span><b>${total.toFixed(2)}</b></div><p>Tax and final shipping are calculated by the server after destination and inventory checks.</p>
        {!user?<><Link className="btn btn-primary btn-wide" to={`/login?returnTo=${encodeURIComponent('/cart?review=1')}`}>Sign in to continue <ArrowRight/></Link><span className="secure-note"><LockKeyhole/> Your cart stays on this device while you sign in.</span></>:pendingItem?<><button className="btn btn-primary btn-wide" onClick={()=>requestAdd(pendingItem,{existing:true})}>Answer questions to continue <ArrowRight/></button><span className="secure-note"><ShieldCheck/> Questions are set by an authorized pharmacy administrator.</span></>:<Link className="btn btn-primary btn-wide" to="/checkout">Continue to secure checkout <ArrowRight/></Link>}
      </aside>
    </div>
  </div>;
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft,ArrowUpRight,Check,Clipboard,Clock3,ExternalLink,Info,PackageCheck,ShieldCheck,Truck } from 'lucide-react';
import './OrderDetail.css';
import './OrderTrackingDetails.css';

export default function OrderDetail({order}){
  const[copied,setCopied]=useState(false);const shipment=order.shipment;const trackingNumber=shipment?.trackingNumber;
  const copyTracking=async()=>{if(!trackingNumber)return;try{await navigator.clipboard.writeText(trackingNumber);setCopied(true);setTimeout(()=>setCopied(false),1800)}catch{/* The visible ID remains selectable if clipboard permission is unavailable. */}};
  return <div className="order-detail-page">
    <Link className="order-detail-back" to="/orders"><ArrowLeft/> Back to orders</Link>
    <header className="order-detail-hero"><div><span>Order details</span><h1>{order.number}</h1><p>Placed {date(order.createdAt,{dateStyle:'long'})}</p></div><div className="order-detail-total"><small>Total</small><strong>{money(order.totalCents,order.currency)}</strong><span>{human(order.paymentStatus)}</span></div></header>
    <section className="order-tracking-card" aria-labelledby="tracking-title">
      <header><span className="tracking-icon"><Truck/></span><div><small>India Post delivery</small><h2 id="tracking-title">Track your order</h2><p>{trackingNumber?'Your shipment reference and verified Embody Hubs updates are shown below.':'Tracking will appear here as soon as the order is dispatched.'}</p></div><StatusBadge value={shipment?.status||order.status}/></header>
      {trackingNumber?<><div className="tracking-reference"><div><small>India Post consignment ID</small><strong>{trackingNumber}</strong></div><button type="button" onClick={copyTracking} aria-label="Copy India Post consignment ID">{copied?<Check/>:<Clipboard/>}{copied?'Copied':'Copy'}</button></div><div className="tracking-actions"><a className="btn btn-primary" href={shipment.officialTrackingUrl} target="_blank" rel="noopener noreferrer">Track on India Post <ExternalLink/></a><p><Info/> India Post may ask you to enter the consignment ID and complete its verification step on the official website.</p></div></>:<div className="tracking-pending"><Clock3/><div><b>Preparing for dispatch</b><p>The order cannot be marked shipped until an administrator records a valid India Post consignment ID.</p></div></div>}
      <ShipmentFacts shipment={shipment}/>
      <ShipmentTimeline shipment={shipment}/>
    </section>
    <div className="order-detail-grid"><section className="order-items-card"><header><span>Order summary</span><h2>{order.items.length} {order.items.length===1?'item':'items'}</h2></header><div>{order.items.map((item,index)=><article key={`${item.sku||item.name}-${index}`}><span className="item-number">{String(index+1).padStart(2,'0')}</span><div><h3>{item.name}</h3>{item.variantLabel&&<p>{item.variantLabel}</p>}<small>Quantity {item.quantity}</small></div></article>)}</div></section><aside className="order-security-card"><ShieldCheck/><span>Secure order access</span><h2>Your delivery details stay in your verified account.</h2><p>Use only the official India Post link above. Embody Hubs will never ask for a password, OTP, or banking PIN to release a shipment.</p><Link to="/support/chat">Need delivery help? <ArrowUpRight/></Link></aside></div>
  </div>;
}
function ShipmentFacts({shipment}){if(!shipment?.trackingNumber)return null;const facts=[['Service',shipment.serviceType],['Booking office',shipment.bookingOffice],['Destination office',shipment.destinationOffice],['Estimated delivery',shipment.estimatedDeliveryAt?date(shipment.estimatedDeliveryAt,{dateStyle:'medium',timeStyle:'short'}):null]].filter(([,value])=>value);if(!facts.length)return null;return <dl className="shipment-facts">{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
function ShipmentTimeline({shipment}){const events=shipment?.events||[];if(!events.length)return null;return <div className="shipment-timeline"><h3>Shipment updates</h3>{events.map((event,index)=><article key={`${event.status}-${event.occurredAt}-${index}`} className={index===0?'current':''}><span><PackageCheck/></span><div><b>{human(event.status)}</b><p>{event.description}</p>{event.location&&<em>{event.location}</em>}<small>{date(event.occurredAt,{dateStyle:'medium',timeStyle:'short'})} · {event.source==='INDIA_POST_API'?'India Post API':'Operations verified'}</small></div></article>)}</div>}
function StatusBadge({value}){return <span className={`order-status-badge ${String(value||'').toLowerCase()}`}>{human(value||'PROCESSING')}</span>}
function human(value){return String(value||'').toLowerCase().replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase())}
function date(value,options){return value?new Intl.DateTimeFormat('en-US',options).format(new Date(value)):'—'}
function money(cents,currency='usd'){return new Intl.NumberFormat('en-US',{style:'currency',currency:String(currency).toUpperCase()}).format((cents||0)/100)}

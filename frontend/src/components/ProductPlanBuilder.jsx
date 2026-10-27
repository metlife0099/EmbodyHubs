import { useEffect,useMemo,useState } from 'react';
import { CalendarDays,Flame,PackageOpen,Pill,ShoppingBag,Truck } from 'lucide-react';
import './ProductPlanBuilder.css';

export default function ProductPlanBuilder({product,categoryProducts,requestAdd}){
  const config=product.pricingConfigurator;
  const products=useMemo(()=>categoryProducts.filter(item=>item.variants?.length),[categoryProducts]);
  const[selectedSlug,setSelectedSlug]=useState(product.slug);
  const[selectedVariantId,setSelectedVariantId]=useState('');
  const[frequency,setFrequency]=useState(config.frequencyOptions[0]);
  const[doseLabel,setDoseLabel]=useState(config.doseOptions[0]?.label);
  const[shippingLabel,setShippingLabel]=useState(config.shippingOptions[0]?.label);
  const selectedProduct=products.find(item=>item.slug===selectedSlug)||product;
  const availableVariants=selectedProduct.variants.filter(item=>item.stock>0);
  const selectedVariant=availableVariants.find(item=>item.id===selectedVariantId)||availableVariants[0]||selectedProduct.variants[0];
  const dose=config.doseOptions.find(item=>item.label===doseLabel)||config.doseOptions[0];
  const shipping=config.shippingOptions.find(item=>item.label===shippingLabel)||config.shippingOptions[0];
  const quantity=Math.min(dose?.quantity||1,selectedVariant?.stock||0);
  const total=(selectedVariant?.price||0)*quantity;
  const monthly=shipping?.months?total/shipping.months:total;

  useEffect(()=>{setSelectedSlug(product.slug);setFrequency(config.frequencyOptions[0]);setDoseLabel(config.doseOptions[0]?.label);setShippingLabel(config.shippingOptions[0]?.label)},[product.id]);
  useEffect(()=>{const next=products.find(item=>item.slug===selectedSlug)||product;setSelectedVariantId(next.variants.find(item=>item.stock>0)?.id||next.variants[0]?.id||'')},[selectedSlug,products,product]);

  const add=()=>{
    if(!selectedVariant||quantity<1)return;
    requestAdd({...selectedProduct,variantId:selectedVariant.id,variantLabel:selectedVariant.label,sku:selectedVariant.sku,dosage:selectedVariant.dosage,form:selectedVariant.form,pack:selectedVariant.pack,price:selectedVariant.price,stock:selectedVariant.stock,cartKey:`${selectedProduct.id}:${selectedVariant.id||'default'}`,initialQuantity:quantity,planSelection:{sourceProductSlug:product.slug,dosingFrequency:frequency,doseLabel:dose.label,shippingFrequency:shipping.label,shippingMonths:shipping.months}});
  };

  return <section className="plan-builder" aria-labelledby="plan-builder-title">
    <header><span className="eyebrow">{config.eyebrow}</span><h2 id="plan-builder-title">{config.title}</h2><p>{config.subtitle}</p></header>
    <div className="plan-builder__panel">
      <div className="plan-builder__controls">
        <ChoiceRow icon={<CalendarDays/>} title="Dosing frequency">{config.frequencyOptions.map(option=><ChoiceButton selected={frequency===option} onClick={()=>setFrequency(option)} key={option}>{option}</ChoiceButton>)}</ChoiceRow>
        <ChoiceRow icon={<Pill/>} title="Product choice">{products.map(item=><ChoiceButton selected={selectedProduct.slug===item.slug} onClick={()=>setSelectedSlug(item.slug)} key={item.id}>{item.name}{item.ingredient&&<small>{item.ingredient}</small>}</ChoiceButton>)}</ChoiceRow>
        {selectedProduct.variants.length>1&&<ChoiceRow icon={<PackageOpen/>} title="Product option">{selectedProduct.variants.map(variant=><ChoiceButton selected={selectedVariant?.id===variant.id} disabled={variant.stock<=0} onClick={()=>setSelectedVariantId(variant.id)} key={variant.id}>{variant.label}<small>{variant.stock>0?`$${variant.price.toFixed(2)}`:'Out of stock'}</small></ChoiceButton>)}</ChoiceRow>}
        <ChoiceRow icon={<Flame/>} title="Doses per month">{config.doseOptions.map(option=><ChoiceButton selected={dose?.label===option.label} disabled={option.quantity>(selectedVariant?.stock||0)} onClick={()=>setDoseLabel(option.label)} key={option.label}>{option.label}</ChoiceButton>)}</ChoiceRow>
        <ChoiceRow icon={<Truck/>} title="Shipping frequency">{config.shippingOptions.map(option=><ChoiceButton selected={shipping?.label===option.label} onClick={()=>setShippingLabel(option.label)} key={option.label}>{option.label}</ChoiceButton>)}</ChoiceRow>
      </div>
      <aside className="plan-builder__summary">
        <span>Estimated monthly cost</span><div className="plan-builder__price"><sup>$</sup><strong>{monthly.toFixed(0)}</strong></div><small>per month</small><p>Total today <b>${total.toFixed(2)}</b></p><button className="btn btn-primary" onClick={add} disabled={!selectedVariant||quantity<1||selectedProduct.prescriptionRequired}><ShoppingBag/>{selectedProduct.prescriptionRequired?'Prescription checkout unavailable':'Add to cart'}</button><em>{quantity} × {selectedProduct.name}{selectedVariant?.label?` · ${selectedVariant.label}`:''}</em>
      </aside>
    </div>
    <p className="plan-builder__disclaimer">*{config.disclaimer} Delivery preference is recorded with this order and does not start recurring billing.</p>
  </section>
}

function ChoiceRow({icon,title,children}){return <fieldset className="plan-choice-row"><legend>{icon}<span>{title}</span></legend><div>{children}</div></fieldset>}
function ChoiceButton({selected,disabled,onClick,children}){return <button type="button" className={selected?'is-selected':''} disabled={disabled} aria-pressed={selected} onClick={onClick}>{children}</button>}

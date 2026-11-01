import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Compass,
  CreditCard,
  Headphones,
  HeartHandshake,
  LayoutDashboard,
  LockKeyhole,
  MessageCircleQuestion,
  PackageCheck,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  UserRoundCheck
} from 'lucide-react';
import './HowItWorks.css';

const steps = [
  {
    number:'01',
    kicker:'Choose with context',
    title:'Explore with confidence.',
    lead:'Understand what you are choosing before you decide.',
    body:'Browse over-the-counter products, wellness essentials, and available treatment information. Product pages are structured to make active ingredients, intended use, directions, and important warnings easier to review.',
    points:['Clear product descriptions','Ingredient and usage information','Important precautions and warnings','Prescription requirements identified where applicable'],
    cta:'Explore Health Essentials',
    to:'/online-care',
    icon:Compass,
    image:'/images/medicine-still-life-v3.png',
    imageAlt:'Unbranded everyday pharmacy and wellness essentials'
  },
  {
    number:'02',
    kicker:'Protect account access',
    title:'Create your secure account.',
    lead:'Your account. Your information. Your control.',
    body:'Register with your email address. During sign-up, a short-lived, single-use verification code confirms email ownership before account access is granted.',
    points:['Email verification during registration','A personal account experience','Access to available order information','One place to manage account details'],
    cta:'Create an Account',
    to:'/register',
    icon:UserRoundCheck
  },
  {
    number:'03',
    kicker:'Review before submission',
    title:'Check out with clarity.',
    lead:'Know what you are ordering and what it costs.',
    body:'Before an order is accepted, the system rechecks current prices, inventory, delivery eligibility, applicable taxes, and shipping charges. You can review the order and total before submitting payment.',
    points:['Order summary before submission','Current price and availability checks','Destination eligibility review','Taxes and shipping displayed at checkout'],
    cta:'Browse Products',
    to:'/online-care',
    icon:ReceiptText
  },
  {
    number:'04',
    kicker:'Prescription safeguards',
    title:'Additional checks for prescription treatments.',
    lead:'Because prescription care requires more than a checkout.',
    body:'Where prescription services are available, fulfillment requires a valid prescription and verification by an appropriately licensed pharmacy authorized to serve the customer’s state. A listing, account, payment, or questionnaire never guarantees that a prescription will be issued or filled.',
    points:['Prescription requirements explained clearly','Verification before prescription fulfillment','Appropriate pharmacy oversight','Availability based on state eligibility'],
    cta:'Understand Prescription Requirements',
    to:'/policies/prescription',
    icon:Stethoscope,
    image:'/images/pharmacist-consultation-v3.png',
    imageAlt:'A pharmacist discussing care information with a customer',
    dark:true
  },
  {
    number:'05',
    kicker:'After dispatch',
    title:'Stay informed as your order moves.',
    lead:'A little more visibility. A lot less uncertainty.',
    body:'Once an eligible order is processed and shipped, available carrier updates help you follow delivery progress. Tracking describes package movement; it does not indicate that a prescription has been approved or clinically authorized.',
    points:['Available shipment tracking information','Carrier-based delivery updates','Clearer visibility after dispatch','Customer support when assistance is needed'],
    cta:'Track an Order',
    to:'/tracking',
    icon:PackageSearch
  }
];

const principles = [
  [ClipboardCheck,'Clear product information','Review intended use, directions, ingredients, and safety considerations before choosing a product.'],
  [LockKeyhole,'Account protection','Email verification during registration helps protect access to your personal account.'],
  [CreditCard,'Transparent checkout','Review current pricing, availability, taxes, and applicable charges before submitting an order.'],
  [Stethoscope,'Responsible prescription processes','Prescription products require appropriate authorization and licensed pharmacy involvement.'],
  [Truck,'Order visibility','Follow available carrier events after an eligible order has shipped.'],
  [Headphones,'Support when you need it','Use secure customer support for website navigation, account, and order-related questions.']
];

const faqs = [
  ['Do I need an account to shop with Embody Hubs?','Some website information can be explored without signing in. An account is required for protected features such as adding products to a cart, completing checkout, managing orders, and accessing personalized account tools.'],
  ['How does Embody Hubs verify my email address?','During registration, a short-lived, single-use code is sent to the email address you provide. Entering the correct code confirms email ownership. If it expires, you can request a new code. Sign-in does not require a new email code after registration verification.'],
  ['Can I purchase prescription medication without a prescription?','No. Prescription medication requires a valid prescription and appropriate pharmacy verification. Checkout or an online questionnaire does not replace these requirements.'],
  ['Why might a product be unavailable in my state?','Some products and services are subject to licensing, shipping, pharmacy, or other legal restrictions. Availability depends on the product and destination, which are reviewed during checkout and fulfillment.'],
  ['Will the price change during checkout?','The system revalidates price, inventory, applicable taxes, and shipping before accepting an order. Review the final order summary before submitting payment.'],
  ['How can I track my order?','After an eligible order ships and carrier information becomes available, use Track an Order to review available shipment events.'],
  ['Does a tracking number mean my prescription was approved?','No. Tracking information describes package movement. Prescription authorization and pharmacy verification are separate processes completed before lawful prescription fulfillment.'],
  ['What if I need help with my order?','Use Customer Chat for account access, website navigation, or order-related help. Medication-specific questions should go to the dispensing pharmacist or your healthcare professional.'],
  ['Can Ask Embody Hubs recommend or prescribe medication?','No. Ask Embody Hubs can explain published information and help you navigate the platform. It does not diagnose, independently recommend treatment, prescribe, or replace a licensed healthcare professional.']
];

export default function HowItWorks(){
  useEffect(()=>{
    const site=(import.meta.env.VITE_SITE_URL||window.location.origin).replace(/\/$/,'');
    const script=document.createElement('script');
    script.type='application/ld+json';
    script.dataset.howItWorksJsonld='true';
    script.textContent=JSON.stringify({
      '@context':'https://schema.org',
      '@graph':[
        {
          '@type':'HowTo',
          name:'How Embody Hubs Works',
          description:'A clear path from exploring health essentials to account verification, checkout, prescription safeguards, and shipment tracking.',
          url:`${site}/how-it-works`,
          inLanguage:'en-US',
          step:steps.map(step=>({'@type':'HowToStep',position:Number(step.number),name:step.title,text:`${step.lead} ${step.body}`,url:`${site}/how-it-works#step-${step.number}`}))
        },
        {
          '@type':'FAQPage',
          mainEntity:faqs.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))
        }
      ]
    });
    document.head.appendChild(script);
    return()=>script.remove();
  },[]);

  return <main className="works-page">
    <section className="works-hero">
      <div className="works-hero__copy">
        <span className="eyebrow light"><HeartHandshake/> A clearer health journey</span>
        <h1>Your health essentials, <em>made simpler.</em></h1>
        <p className="works-hero__lead">A clear path from choosing a product to understanding your order.</p>
        <p>Explore useful product information, create a secure account, and follow each eligible order with greater clarity. Everyday wellness and prescription pathways are explained before you move forward.</p>
        <div className="works-hero__actions">
          <Link className="works-button works-button--light" to="/online-care">Explore Products <ArrowRight/></Link>
          <Link className="works-button works-button--outline" to="/online-care">Learn About Online Care <ArrowRight/></Link>
        </div>
      </div>
      <div className="works-hero__visual">
        <img src="/images/pharmacist-consultation-v3.png" alt="A pharmacist having a clear, supportive conversation with a customer"/>
        <div className="works-hero__badge"><ShieldCheck/><span><b>Clarity at each stage</b><small>Information • safeguards • support</small></span></div>
      </div>
      <nav className="works-hero__rail" aria-label="How it works steps">
        {steps.map(step=><a key={step.number} href={`#step-${step.number}`}><span>{step.number}</span>{step.kicker}</a>)}
      </nav>
    </section>

    <section className="works-intro">
      <div><span className="eyebrow">How Embody Hubs works</span><h2>Know what to expect, before the next step.</h2></div>
      <p>Our process separates ordinary shopping, account protection, checkout validation, prescription safeguards, and delivery tracking so each stage is easier to understand.</p>
    </section>

    <section className="works-steps" aria-label="The Embody Hubs customer journey">
      {steps.map((step,index)=><JourneyStep key={step.number} step={step} index={index}/>)}
    </section>

    <section className="works-principles">
      <header><span className="eyebrow light">Built around clarity and care</span><h2>Health shopping should feel informed, not overwhelming.</h2><p>We focus on the details that help you understand what is happening at every stage.</p></header>
      <div>{principles.map(([Icon,title,copy],index)=><article key={title}><span>0{index+1}</span><Icon/><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </section>

    <section className="works-tools">
      <article className="works-tool works-tool--hub">
        <div className="works-tool__image"><img src="/images/pharmacy-still-life-v2.png" alt="Organized health essentials representing the My Health Hub dashboard" loading="lazy"/></div>
        <div className="works-tool__copy"><span className="eyebrow"><LayoutDashboard/> My Health Hub</span><h2>Your Embody Hubs experience, organized.</h2><p>Review account details, find available order information, and navigate relevant next steps from one secure dashboard.</p><ul><li><Check/>Account and preference controls</li><li><Check/>Available order and journey information</li><li><Check/>Privacy and security settings</li></ul><Link className="works-button works-button--dark" to="/account">Go to My Health Hub <ArrowRight/></Link><small>My Health Hub is not a medical record, emergency monitor, or substitute for professional care.</small></div>
      </article>
      <article className="works-tool works-tool--ask">
        <div className="works-tool__copy"><span className="eyebrow light"><Sparkles/> Ask Embody Hubs</span><h2>Helpful guidance while you explore.</h2><p>Find published product information, understand common platform steps, and navigate verified account activity more easily.</p><div className="works-question"><MessageCircleQuestion/><span><b>“What happens after checkout?”</b><small>Answers stay grounded in published information and verified account activity.</small></span></div><Link className="works-button works-button--light" to="/account/ask-embody">Ask Embody Hubs <ArrowRight/></Link><small>Ask Embody Hubs does not diagnose, prescribe, or replace a licensed healthcare professional.</small></div>
      </article>
    </section>

    <section className="works-faq">
      <header><div><span className="eyebrow"><CircleHelp/> Frequently asked questions</span><h2>Clear answers for common next steps.</h2></div><p>For medication-specific questions, contact the dispensing pharmacist or your healthcare professional.</p></header>
      <div className="works-faq__list">{faqs.map(([question,answer],index)=><details key={question}><summary><span>{String(index+1).padStart(2,'0')}</span><b>{question}</b><ChevronDown/></summary><p>{answer}</p></details>)}</div>
    </section>

    <section className="works-final">
      <div><span className="eyebrow light">A more confident way to move forward</span><h2>Explore thoughtfully.<br/>Order clearly. Stay informed.</h2><p>Start with the information you need and move forward at a pace that works for you.</p><div><Link className="works-button works-button--light" to="/online-care">Explore Products <ArrowRight/></Link><Link className="works-button works-button--outline" to="/support/chat">Contact Support <Headphones/></Link></div></div>
      <aside><PackageCheck/><b>Important information</b><p>Embody Hubs is not an emergency medical service. Product availability, prescription services, and fulfillment eligibility vary. Prescription products may be supplied only when all applicable legal and professional requirements are met.</p></aside>
    </section>
  </main>;
}

function JourneyStep({step,index}){
  const Icon=step.icon;
  return <article id={`step-${step.number}`} className={`works-step ${index%2?'works-step--reverse':''} ${step.dark?'works-step--dark':''}`}>
    <div className="works-step__number"><span>{step.number}</span><i/></div>
    <div className="works-step__copy">
      <span className={`eyebrow ${step.dark?'light':''}`}><Icon/> {step.kicker}</span>
      <h2>{step.title}</h2><h3>{step.lead}</h3><p>{step.body}</p>
      <ul>{step.points.map(point=><li key={point}><BadgeCheck/>{point}</li>)}</ul>
      <Link className={`works-button ${step.dark?'works-button--light':'works-button--dark'}`} to={step.to}>{step.cta} <ArrowRight/></Link>
    </div>
    <StepVisual step={step}/>
  </article>;
}

function StepVisual({step}){
  const Icon=step.icon;
  if(step.image)return <div className="works-step__visual works-step__visual--image"><img src={step.image} alt={step.imageAlt} loading="lazy"/><div><span>{step.number}</span><b>{step.lead}</b></div></div>;
  if(step.number==='02')return <div className="works-step__visual works-step__visual--account"><LockKeyhole/><span>Email ownership</span><b>Single-use code</b><div><i/><i/><i/><i/><i/><i/></div><small>Verified during registration</small></div>;
  if(step.number==='03')return <div className="works-step__visual works-step__visual--receipt"><ReceiptText/><span>Order review</span><dl><div><dt>Products</dt><dd>Confirmed</dd></div><div><dt>Availability</dt><dd>Rechecked</dd></div><div><dt>Delivery</dt><dd>Eligible</dd></div><div><dt>Final total</dt><dd>Before payment</dd></div></dl><small><ShieldCheck/>Validated at checkout</small></div>;
  return <div className="works-step__visual works-step__visual--tracking"><div className="tracking-path"><i/><i/><i/><i/></div><Icon/><span>Carrier updates</span><b>From dispatch to delivery</b><small>Shipment movement only</small></div>;
}

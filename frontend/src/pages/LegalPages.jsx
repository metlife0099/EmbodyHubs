import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  FileLock2,
  Gavel,
  HeartPulse,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Printer,
  Scale,
  ShieldCheck,
  UserRoundCheck
} from 'lucide-react';
import './LegalPages.css';

const EFFECTIVE_DATE='November 1, 2026';
const LAST_UPDATED='November 1, 2026';

const legalDetails={
  entity:import.meta.env.VITE_LEGAL_ENTITY_NAME?.trim()||'Embody Hubs',
  address:import.meta.env.VITE_BUSINESS_ADDRESS?.trim()||'',
  state:import.meta.env.VITE_BUSINESS_STATE?.trim()||'',
  privacyEmail:import.meta.env.VITE_PRIVACY_EMAIL?.trim()||'',
  supportEmail:import.meta.env.VITE_SUPPORT_EMAIL?.trim()||'',
  phone:import.meta.env.VITE_SUPPORT_PHONE?.trim()||''
};

const privacySections=[
  {id:'scope',title:'1. Scope and who is responsible',paragraphs:[
    `This Privacy Policy explains how ${legalDetails.entity}, operating the Embody Hubs website and customer experience (“Embody Hubs,” “we,” “our,” or “us”), collects, uses, discloses, retains, and protects personal information through the website, customer accounts, online-care features, My Health Hub, Ask Embody Hubs, order tracking, customer support, and related services (collectively, the “Services”).`,
    'This Policy applies when Embody Hubs acts as the website or service operator. A healthcare professional, prescriber, pharmacy, payment provider, carrier, or other organization may independently control information and provide its own privacy notice.'
  ]},
  {id:'information',title:'2. Information we collect',paragraphs:[
    'The information we collect depends on the feature you use, what you choose to provide, and the legal and operational requirements that apply.'
  ],bullets:[
    'Account and identity information, including name, email, telephone number, age or date-of-birth information, mailing address, credentials, and account-verification records.',
    'Health and treatment information you choose to submit, such as symptoms, medical history, medicines, allergies, treatment preferences, questionnaire responses, prescription requests, and prescription documents.',
    'Order and transaction information, including requested products, prescription-verification status, order history, shipping details, payment status, refunds, invoices, and fulfillment events.',
    'Communications through secure chat, support cases, online-care forms, health-information enquiries, email, and Ask Embody Hubs.',
    'Device and website information, including IP address, browser and operating-system information, device identifiers, approximate location inferred from technical data, referral data, security events, and cookie or similar-technology data.',
    'Information lawfully received from identity-verification services, payment processors, shipping providers, licensed healthcare professionals, pharmacies, and vendors supporting a requested service.'
  ],callout:'We ask users not to place medical information, prescriptions, or protected health information in ordinary email or general-purpose forms.'},
  {id:'use',title:'3. How we use information',bullets:[
    'Create, verify, secure, and maintain customer and professional accounts.',
    'Provide requested features, support, order status, and customer-controlled preferences.',
    'Facilitate legally permitted prescription review, pharmacy routing, pharmacist communication, and fulfillment where enabled.',
    'Process authorized transactions, refunds, invoices, shipping, and delivery updates.',
    'Detect, investigate, and prevent fraud, misuse, security incidents, and unlawful activity.',
    'Comply with recordkeeping, privacy, pharmacy, consumer-protection, and other legal obligations.',
    'Improve accessibility, reliability, safety, and performance using appropriately limited information.',
    'Send transactional communications and optional marketing only as permitted by law and the user’s preferences.'
  ],paragraphs:['We do not use sensitive health information for unrelated advertising, and we do not authorize vendors to use it for their independent advertising.']},
  {id:'hipaa',title:'4. Health information and HIPAA',paragraphs:[
    'HIPAA applies to covered health plans, healthcare clearinghouses, and certain healthcare providers—and to business associates performing covered functions for them. HIPAA does not automatically apply to every health-related website or every piece of consumer health information.',
    'This website Privacy Policy is not a HIPAA Notice of Privacy Practices. When a HIPAA-covered provider or pharmacy provides a service, that organization’s Notice of Privacy Practices explains its uses and disclosures of protected health information and the rights available to patients. Where Embody Hubs acts as a business associate, it handles protected health information under applicable law and the governing business-associate agreement.',
    'Consumer health information that is outside HIPAA may still be protected by the FTC Health Breach Notification Rule, state consumer-health-data laws, general privacy laws, and consumer-protection requirements.'
  ],callout:'A pharmacy or healthcare provider’s clinical record is governed by that organization’s notice and legal duties—not only by this website policy.'},
  {id:'sharing',title:'5. When we disclose information',paragraphs:['We disclose information only when legally permitted and reasonably necessary for the purpose involved. Recipient categories may include:'],bullets:[
    'Licensed healthcare professionals supporting a requested evaluation, treatment communication, or other authorized healthcare service.',
    'Licensed pharmacies verifying prescriptions, performing professional review, dispensing, providing pharmacist support, or completing lawful fulfillment.',
    'Hosting, authentication, security, communications, analytics, document-storage, support, and other service providers bound by appropriate restrictions.',
    'Payment providers processing authorized charges, refunds, disputes, and fraud checks.',
    'Shipping providers receiving the minimum information reasonably necessary for delivery and status communication.',
    'Legal, regulatory, or public authorities when disclosure is required by valid law or legal process.',
    'Participants in a lawful merger, financing, acquisition, reorganization, or asset transfer, subject to applicable privacy obligations.'
  ],paragraphsAfter:['We do not sell protected health information. We do not sell consumer health data or share it for cross-context behavioral advertising. If our practices materially change, we will provide any notice, consent, and opt-out controls required before the affected processing begins.']},
  {id:'assistant',title:'6. Ask Embody Hubs and automated assistance',paragraphs:[
    'Ask Embody Hubs may provide general educational information, published product information, and help navigating verified account activity. Unless expressly identified as part of an authorized clinical service, it is not a healthcare professional, does not diagnose, prescribe, or determine treatment eligibility, and does not replace professional judgment.',
    'Temporary conversations are not retained as saved history unless the user affirmatively enables and chooses that feature. Saved-history controls and retention information appear in My Health Hub. Prescription documents are excluded from the general assistant context.',
    'Do not use automated assistance for an emergency. Call 911 or seek immediate medical care when appropriate.'
  ]},
  {id:'cookies',title:'7. Cookies, analytics, and privacy signals',paragraphs:[
    'We use necessary cookies and comparable technologies for login, security, fraud prevention, cart functions, user preferences, and service operation. Optional analytics or advertising technologies may be used only after required assessment and consent controls are active.',
    'We evaluate whether a technology could receive health, treatment, prescription, or other sensitive information before deployment. We do not intentionally disclose protected health information or consumer health data to advertising platforms.',
    'Where legally required, we will recognize applicable opt-out preference signals, including Global Privacy Control, and provide a cookie-preferences control before activating optional technologies.'
  ]},
  {id:'marketing',title:'8. Marketing communications',paragraphs:[
    'You receive promotional email only after an affirmative subscription or another lawful basis. Marketing messages identify the sender, use accurate subject information, include the required business contact information, and provide a functioning unsubscribe method.',
    'You may unsubscribe at any time. Opting out of marketing does not stop necessary security, account, prescription, order, safety, or transactional communications. Marketing that uses protected health information requires any authorization mandated by HIPAA.'
  ]},
  {id:'security',title:'9. Security and incident response',paragraphs:[
    'We use administrative, technical, and physical safeguards designed for the sensitivity and risk of the information processed. Measures may include encryption in transit and at rest, access controls, role separation, secure authentication, malware scanning, integrity verification, audit logging, monitoring, vendor diligence, and incident-response procedures.',
    'No website or electronic system can guarantee absolute security. We investigate suspected incidents and provide notices to affected people, regulators, or others when required by the HIPAA Breach Notification Rule, the FTC Health Breach Notification Rule, state breach-notification laws, or other applicable requirements.'
  ]},
  {id:'retention',title:'10. Retention and deletion',paragraphs:[
    'We retain information only for as long as reasonably necessary for the purpose collected, a requested service, security and fraud prevention, dispute resolution, and applicable legal obligations. Different records have different schedules.',
    'Prescription, pharmacy, clinical, financial, tax, transaction, audit, consent, and security records may be subject to mandatory retention or legal holds. A request to close an account does not automatically delete records we must preserve.',
    'When information is no longer required, we delete, de-identify, or securely dispose of it using a process appropriate to the record and applicable law.'
  ]},
  {id:'rights',title:'11. Your privacy choices and rights',paragraphs:['Depending on your residence, the information involved, and the laws that apply, you may have rights to:'],bullets:[
    'Know or access categories and specific pieces of personal information.',
    'Correct inaccurate personal information.',
    'Delete eligible personal information.',
    'Receive a portable copy of eligible information.',
    'Withdraw consent for future processing when consent is the legal basis.',
    'Opt out of certain sales, sharing, targeted advertising, or profiling.',
    'Limit certain uses or disclosures of sensitive personal information.',
    'Appeal a denied request where applicable and receive a reasoned response.',
    'Use an authorized agent where permitted and avoid unlawful discrimination for exercising a right.'
  ],paragraphsAfter:['Requests are subject to identity verification and legal exceptions, including healthcare and pharmacy recordkeeping, security, fraud prevention, transaction completion, and legal claims. Submit a request using the secure Contact page or the verified privacy channel shown below.']},
  {id:'state-health',title:'12. State consumer health data',paragraphs:[
    'Residents of states with consumer-health-data laws may receive additional notice and rights involving the collection, use, disclosure, consent, withdrawal, access, and deletion of consumer health data. The scope and exceptions differ by state.',
    'If Embody Hubs becomes subject to a law requiring a separate Consumer Health Data Privacy Policy—such as Washington’s My Health My Data Act—we will publish that distinct notice prominently and obtain any required consent before the covered collection or sharing. We do not use geofencing to identify or track people seeking in-person healthcare services.'
  ]},
  {id:'children',title:'13. Children and age restrictions',paragraphs:[
    'The general consumer Services are intended for adults age 18 and older. We do not knowingly collect personal information through the general Services from a child under 13. A service for a minor will be offered only when expressly designed and operated with the authorization, consent, notices, and safeguards required by applicable law.',
    'If you believe a child provided information improperly, contact us so we can investigate and take appropriate action.'
  ]},
  {id:'third-parties',title:'14. Third-party services and interstate processing',paragraphs:[
    'The Services may link to or integrate with independent healthcare organizations, pharmacies, payment providers, shipping companies, and other third parties. Their privacy policies and security practices apply to information they independently control.',
    'Information may be processed in the United States wherever our service providers operate. We apply contractual and security protections appropriate to the information and applicable law.'
  ]},
  {id:'changes-contact',title:'15. Changes, questions, and complaints',paragraphs:[
    'We may update this Policy to reflect changes in Services, law, technology, or data practices. The revised version will show a new effective or last-updated date. We will provide additional notice, and obtain consent, when required for a material change.',
    'You may contact us about privacy, submit a rights request, or raise a complaint through the secure contact options below. We will not unlawfully retaliate against a person for exercising a privacy right or filing a good-faith complaint.'
  ]}
];

function termsSections(){
  const governing=legalDetails.state
    ?`These Terms are governed by applicable federal law and the law of ${legalDetails.state}, without overriding consumer-protection or other rights that cannot lawfully be waived. Any court proceeding must be filed in a court with lawful jurisdiction.`
    :'These Terms are governed by applicable United States federal and state law. No state-specific choice-of-law or venue provision applies until the business operator’s state is configured and the provision is approved for the actual operating model. Mandatory consumer-protection rights are not displaced.';
  return [
    {id:'agreement',title:'1. Agreement and eligibility',paragraphs:[`These Terms & Conditions (“Terms”) govern access to the Embody Hubs website, customer accounts, online-care features, My Health Hub, Ask Embody Hubs, order tracking, support, and related services (collectively, the “Services”) operated by ${legalDetails.entity}. By using the Services, you agree to these Terms to the extent permitted by law.`,'You must be at least 18 years old to create a standard account or request adult prescription services unless a specific service expressly permits otherwise under applicable law. You must provide accurate identity, age, location, and account information.']},
    {id:'services',title:'2. Nature and availability of the Services',paragraphs:['Embody Hubs may provide health education, wellness and over-the-counter product information, prescription-product listings, account tools, order tracking, support, and access to services provided by independent licensed professionals or pharmacies. Features may be unavailable until legal, licensing, security, payment, pharmacy, and state-eligibility requirements are satisfied.','A listing does not guarantee availability, suitability, prescribing, dispensing, shipment, insurance coverage, or a particular outcome. The identity and role of a participating provider or pharmacy will be disclosed when required.']},
    {id:'medical',title:'3. No automatic medical advice or emergency service',paragraphs:['General website content, Ask Embody Hubs, and ordinary customer support are informational and administrative. They do not replace medical advice, diagnosis, or treatment from a licensed professional and do not establish a clinician-patient relationship unless an authorized clinical service expressly states otherwise.','Never delay or disregard professional advice because of website content. Embody Hubs is not an emergency service. Call 911 or seek immediate emergency care for a medical emergency.']},
    {id:'prescriptions',title:'4. Prescription requirements',paragraphs:['Prescription medicine may be supplied only after all legal, clinical, professional, and pharmacy requirements are satisfied. A valid prescription from an appropriately licensed and authorized prescriber is required, and the dispensing pharmacy must be authorized to serve the patient’s jurisdiction.','A questionnaire, account, payment, or order request does not guarantee a prescription or dispensing. A pharmacist or other authorized professional may seek clarification, contact a prescriber, decline dispensing, place a professional hold, or cancel a request when necessary for safety or compliance. You may not submit false information, altered documents, or another person’s prescription.']},
    {id:'clinical',title:'5. Online care and independent clinical decisions',paragraphs:['When online care is available, appropriately licensed healthcare professionals make clinical decisions independently and within their lawful scope of practice. They may determine that a requested medicine is inappropriate or that an in-person examination, laboratory work, referral, or other follow-up is necessary.','Embody Hubs does not guarantee a diagnosis, prescription, medicine, strength, dosage, treatment duration, or outcome. Availability varies by state, condition, professional licensing, and provider capacity.']},
    {id:'medication-safety',title:'6. Medication information and safety',paragraphs:['Product descriptions are general information. Follow the prescription label and instructions from the prescriber and dispensing pharmacy. Benefits, risks, contraindications, interactions, and monitoring differ by person and product. Do not combine medicines or change a dose without authorized professional guidance.','If a product is compounded, its status and relevant differences from FDA-approved drugs must be disclosed as required. Compounded drugs are not FDA-approved. Seek immediate help for a severe reaction or emergency.']},
    {id:'pricing',title:'7. Product availability, descriptions, and pricing',paragraphs:['Products, options, quantities, inventory, and prices may change. The final amount, material fees, recurring terms, shipping charges, and taxes will be shown before submission as required by law. Displaying an item or price does not guarantee inventory or lawful availability to a particular person or destination.','We may correct genuine listing or pricing errors, subject to applicable consumer-protection law and any required notice, cancellation, or refund.']},
    {id:'orders',title:'8. Orders and pharmacy verification',paragraphs:['Submitting an order is a request, not final acceptance. Prescription orders may require professional review, prescription and identity verification, state eligibility, inventory confirmation, payment authorization, and pharmacy approval before fulfillment.','An order may be delayed, changed with legally sufficient authorization, or declined because of prescription issues, safety, inventory, shipping, payment, fraud, or legal restrictions. You are responsible for accurate delivery details and timely responses to legitimate verification requests.']},
    {id:'payments',title:'9. Payments, refunds, and billing disputes',paragraphs:['Payments may be handled by an authorized third-party processor. By submitting a payment method, you authorize only the charges disclosed for the requested transaction. Failed or reversed payments may pause the related order or service.','Refunds, credits, cancellations, and billing disputes are governed by the applicable disclosed policy and nonwaivable law. Contact support promptly about a charge you do not recognize.']},
    {id:'subscriptions',title:'10. Subscriptions and automatic renewal',paragraphs:['When a subscription is offered, the enrollment flow will clearly disclose the amount, billing frequency, included products or services, minimum commitment, trial or promotional terms, renewal timing, cancellation method, effective date of cancellation, and refund limitations before consent.','Recurring charges require affirmative authorization. A reasonably accessible cancellation method will be provided as required by applicable federal and state law. Cancellation does not reverse an order already lawfully dispensed or shipped unless the applicable policy or law provides otherwise.']},
    {id:'shipping',title:'11. Shipping, delivery, and product condition',paragraphs:['Products may be shipped only where they can lawfully be supplied. Delivery dates are estimates unless expressly guaranteed. Temperature-sensitive or regulated products may require special packaging, carriers, tracking, or delivery restrictions.','Contact support promptly if a shipment is damaged, incomplete, tampered with, or exposed to potentially unsafe conditions. Do not use medicine that may be compromised until the dispensing pharmacy or another authorized professional provides guidance.']},
    {id:'returns',title:'12. Returns, cancellations, and damaged orders',paragraphs:['Return eligibility depends on product type, condition, dispensing status, law, and pharmacy policy. Prescription medicine generally cannot be returned to inventory after dispensing. This does not limit rights or remedies that cannot lawfully be waived.','An order not yet dispensed or shipped may be eligible for cancellation under the policy shown during the transaction. Use the secure support channel promptly for a damaged, incorrect, or incomplete delivery.']},
    {id:'accounts',title:'13. Accounts and security',paragraphs:['You are responsible for protecting credentials, using your own account, and notifying us promptly about suspected unauthorized access. You may not share an account in a manner that bypasses identity, age, prescription, or professional-verification requirements.','We may restrict or suspend access when reasonably necessary to investigate fraud, protect users or systems, enforce these Terms, or comply with law. Closing an account does not require deletion of records subject to lawful retention.']},
    {id:'health-hub',title:'14. My Health Hub and family access',paragraphs:['My Health Hub may display account, order, preference, support, and treatment-related information received from different sources. It is not an emergency-monitoring system or a substitute for a medical record maintained by a provider or pharmacy.','Family access is permission-based. Commerce permissions and access to health-related information are separate, require the controls shown in the account, and may be revoked subject to legal recordkeeping requirements.']},
    {id:'automated',title:'15. Ask Embody Hubs and automated features',paragraphs:['Automated responses may be incomplete or inaccurate. They must not be the sole basis for a medical decision. Ask Embody Hubs does not independently prescribe, diagnose, approve treatment, or override a licensed professional.','We may limit, monitor for abuse, suspend, or change automated features to protect safety, privacy, security, and service integrity. Any saved conversation feature is subject to the privacy controls and retention information shown in the account.']},
    {id:'communications',title:'16. Communications and electronic records',paragraphs:['You may receive security codes, account notices, prescription and order status, support replies, and other necessary transactional messages using contact information you provide. Promotional messages require the consent or other lawful basis applicable to the channel.','You may opt out of eligible marketing without losing required transactional communications. Carrier message and data charges may apply. Do not send medical or prescription information through ordinary email when a secure channel is available.']},
    {id:'privacy',title:'17. Privacy and separate healthcare notices',paragraphs:['Our website data practices are described in the Embody Hubs Privacy Policy. A separate healthcare provider or pharmacy may provide a HIPAA Notice of Privacy Practices or another legally required notice.','Acknowledging receipt of a notice does not replace an authorization, consent, or choice required by law.']},
    {id:'conduct',title:'18. Prohibited conduct',paragraphs:['You may not misuse the Services. Prohibited conduct includes:'],bullets:['Submitting false prescriptions, altered documents, or misleading medical or identity information.','Obtaining prescription products for unauthorized resale, diversion, or another person.','Impersonating another person or misrepresenting professional credentials.','Attempting unauthorized access, bypassing security controls, scraping sensitive data, or introducing malicious code.','Interfering with service availability, audits, investigations, pharmacy review, or safety controls.','Harassing professionals, pharmacy staff, support personnel, partners, or other users.','Using the Services for unlawful, fraudulent, abusive, or rights-infringing activity.']},
    {id:'professional',title:'19. Professional and partner accounts',paragraphs:['Professional and pharmacy-partner access is discretionary and requires independent credential, license, business, compliance, and security review. Submission does not create employment, agency, exclusivity, a clinical relationship, or a guaranteed partnership.','Professional users must protect credentials, act within their lawful authority, keep licenses current, avoid patient information in general forms, and use secure workflows. Approval may be limited by state, capability, product, and service.']},
    {id:'intellectual-property',title:'20. Intellectual property',paragraphs:['The Embody Hubs name, logo, website design, original text, graphics, software, and other proprietary material are protected by applicable law. You receive a limited, revocable, nonexclusive right to use the Services for lawful personal purposes.','You may not reproduce, distribute, reverse engineer, or commercially exploit protected material except with permission or as permitted by law. Third-party marks belong to their owners; references do not imply endorsement.']},
    {id:'third-parties',title:'21. Independent third-party services',paragraphs:['Healthcare professionals, pharmacies, payment processors, carriers, identity services, and technology providers may be independent parties with separate terms and responsibilities. Their terms apply to services they independently provide.','Nothing in these Terms removes or transfers a healthcare professional’s, pharmacy’s, or other regulated party’s legal duties.']},
    {id:'changes-service',title:'22. Service changes, suspension, and termination',paragraphs:['We may change, suspend, or discontinue features for legitimate safety, legal, security, operational, or business reasons. Required notice, refunds, or remedies will be provided when changes affect an existing paid service.','We may terminate or restrict an account for a material violation, fraud, danger, legal requirement, or security risk. Provisions that by their nature should survive—such as payment obligations, intellectual property, disclaimers, and dispute terms—continue to the extent enforceable.']},
    {id:'disclaimers',title:'23. Disclaimers',paragraphs:['To the extent permitted by law, general website content and nonclinical technology features are provided without a guarantee of uninterrupted or error-free operation. Product information may change and should be confirmed using current labeling and professional guidance.','These disclaimers do not limit professional duties of licensed providers or pharmacies, warranties expressly made in writing, or consumer rights and remedies that cannot legally be excluded.']},
    {id:'liability',title:'24. Limitation of liability',paragraphs:['To the extent permitted by applicable law, Embody Hubs is not liable for indirect, incidental, special, exemplary, or consequential loss arising solely from ordinary nonclinical website interruptions or technical issues.','No limitation excludes liability that cannot lawfully be limited, including certain intentional misconduct, statutory consumer remedies, or independent professional obligations. No monetary cap or mandatory arbitration clause is imposed by these Terms; any future clause requires separate, conspicuous drafting and qualified legal review.']},
    {id:'law-disputes',title:'25. Governing law and disputes',paragraphs:[governing,'Nothing prevents a user from contacting a regulator, filing a legally protected complaint, reporting a safety issue, or exercising a nonwaivable right. Before filing a lawsuit, the parties may attempt good-faith informal resolution through the secure support channel, but this does not shorten a legal deadline.']},
    {id:'general',title:'26. Changes, severability, and contact',paragraphs:['We may update these Terms for changes in law, Services, or operations. The new version will show its effective date, and material changes will receive notice or renewed acceptance when required.','If a provision is unenforceable, it will be limited or severed to the minimum extent necessary without invalidating the remainder. A failure to enforce a provision once is not a waiver. These Terms and incorporated transaction-specific disclosures form the agreement for the Services they cover.','Questions about these Terms may be submitted through the verified contact options below. Medication questions should go to the dispensing pharmacy or prescribing professional. For emergencies, call 911.']}
  ];
}

const resources=[
  {label:'HHS — HIPAA Notices of Privacy Practices',href:'https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/model-notices-privacy-practices/index.html'},
  {label:'FTC — Health Breach Notification Rule',href:'https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0'},
  {label:'California DOJ — CCPA rights',href:'https://oag.ca.gov/privacy/ccpa'},
  {label:'Washington AG — My Health My Data Act',href:'https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy'},
  {label:'FTC — CAN-SPAM compliance',href:'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business'},
  {label:'FDA — Buying medicine safely online',href:'https://www.fda.gov/consumers/consumer-updates/how-buy-medicines-safely-online-pharmacy'}
];

const privacyHighlights=[
  [FileLock2,'Sensitive by design','Health and account information receives purpose-limited handling and heightened safeguards.'],
  [UserRoundCheck,'Rights and controls','Access, correction, deletion, consent, and opt-out rights are honored where applicable.'],
  [ShieldCheck,'No health-data advertising','Consumer health data is not sold or used for cross-context behavioral advertising.']
];

const termsHighlights=[
  [HeartPulse,'Professionals decide','Clinical and dispensing decisions remain with appropriately licensed professionals.'],
  [Scale,'Clear commercial terms','Prices, recurring charges, cancellations, and material fees must be disclosed before consent.'],
  [Landmark,'Lawful availability','Prescription and pharmacy services remain subject to state, license, and professional requirements.']
];

export function PrivacyPolicy(){return <LegalPage type="privacy" sections={privacySections}/>}
export function TermsConditions(){
  const sections=useMemo(()=>termsSections(),[]);
  return <LegalPage type="terms" sections={sections}/>;
}

function LegalPage({type,sections}){
  const privacy=type==='privacy';
  const [active,setActive]=useState(sections[0].id);
  const content=useMemo(()=>privacy?{
    eyebrow:'Privacy & trust',title:'Privacy, explained with care.',lead:'How Embody Hubs handles personal information, health-related data, choices, and rights across the website and connected services.',image:'/images/pharmacist-consultation-v3.png',imageAlt:'A pharmacist speaking with a customer in a private consultation',icon:LockKeyhole,highlights:privacyHighlights
  }:{
    eyebrow:'Terms & responsibilities',title:'Clear terms for a careful service.',lead:'The rules, safeguards, and responsibilities that apply when using Embody Hubs, customer accounts, pharmacy workflows, and online-care features.',image:'/images/pharmacy-still-life-v2.png',imageAlt:'Organized medicine packaging and pharmacy supplies',icon:Gavel,highlights:termsHighlights
  },[privacy]);
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.isIntersecting&&setActive(entry.target.id)),{rootMargin:'-18% 0px -72%'});
    sections.forEach(section=>{const element=document.getElementById(section.id);if(element)observer.observe(element)});
    const site=(import.meta.env.VITE_SITE_URL||window.location.origin).replace(/\/$/,'');
    const script=document.createElement('script');script.type='application/ld+json';script.dataset.legalJsonld='true';script.textContent=JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:privacy?'Privacy Policy | Embody Hubs':'Terms & Conditions | Embody Hubs',url:`${site}${privacy?'/policies/privacy':'/policies/terms'}`,datePublished:'2026-11-01',dateModified:'2026-11-01',isPartOf:{'@type':'WebSite',name:'Embody Hubs',url:site},inLanguage:'en-US'});document.head.appendChild(script);
    return()=>{observer.disconnect();script.remove()};
  },[privacy,sections]);
  useEffect(()=>{
    const toc=document.querySelector('.legal-toc');
    const current=toc?.querySelector('a.active');
    if(!toc||!current||window.matchMedia('(max-width: 740px)').matches)return;
    const visibleTop=toc.scrollTop+42;
    const visibleBottom=toc.scrollTop+toc.clientHeight-24;
    const itemTop=current.offsetTop;
    const itemBottom=itemTop+current.offsetHeight;
    if(itemTop<visibleTop||itemBottom>visibleBottom){
      toc.scrollTo({top:Math.max(0,itemTop-toc.clientHeight/2),behavior:'smooth'});
    }
  },[active]);
  const Icon=content.icon;
  return <main className={`legal-page legal-page--${type}`}>
    <header className="legal-hero">
      <div className="legal-hero-copy"><span className="eyebrow light"><Icon/> {content.eyebrow}</span><h1>{content.title}</h1><p>{content.lead}</p><div className="legal-hero-actions"><a href="#legal-document">Read the document <ArrowRight/></a><button onClick={()=>window.print()}><Printer/> Print or save PDF</button></div></div>
      <div className="legal-hero-image"><img src={content.image} alt={content.imageAlt}/><span><ShieldCheck/> Plain-language legal information</span></div>
    </header>
    <section className="legal-meta" aria-label="Document information"><div><span>Effective</span><b>{EFFECTIVE_DATE}</b></div><div><span>Last updated</span><b>{LAST_UPDATED}</b></div><div><span>Applies to</span><b>United States website users</b></div><div><span>Document</span><b>{privacy?'Privacy Policy':'Terms & Conditions'}</b></div></section>
    <section className="legal-highlights">{content.highlights.map(([ItemIcon,title,text])=><article key={title}><ItemIcon/><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>
    <div className="legal-scope-note"><BookOpenCheck/><div><b>{privacy?'Website policy—not a substitute for a provider’s HIPAA notice':'Important service boundary'}</b><p>{privacy?'A participating HIPAA-covered provider or pharmacy supplies its own Notice of Privacy Practices when applicable. This page covers the Embody Hubs website and platform role.':'Embody Hubs does not promise that a prescription will be issued or filled. Licensed professionals and pharmacies retain their independent legal and clinical responsibilities.'}</p></div></div>
    <section className="legal-layout" id="legal-document">
      <aside className="legal-toc"><span>In this document</span><nav aria-label={`${privacy?'Privacy Policy':'Terms and Conditions'} sections`}>{sections.map(section=><a className={active===section.id?'active':''} href={`#${section.id}`} key={section.id}><i/>{section.title}</a>)}</nav><Link to={privacy?'/policies/terms':'/policies/privacy'}>{privacy?'Read Terms & Conditions':'Read Privacy Policy'} <ArrowRight/></Link></aside>
      <article className="legal-document">
        <div className="legal-introduction"><span>Embody Hubs</span><h2>{privacy?'Privacy Policy':'Terms & Conditions'}</h2><p>{privacy?'We recognize that health-related and account information can be especially sensitive. This Policy describes our commitments and the choices available to you.':'Please read these Terms carefully. If you do not agree, do not use the Services. Rights that cannot lawfully be waived remain protected.'}</p></div>
        {sections.map(section=><LegalSection section={section} key={section.id}/>) }
        <LegalContact privacy={privacy}/>
        <section className="legal-regulatory" aria-labelledby="legal-resources-title"><span>Authoritative resources</span><h2 id="legal-resources-title">Review the underlying guidance.</h2><p>These government resources help explain the legal frameworks referenced in this document. External sites maintain their own content and policies.</p><div>{resources.map(resource=><a key={resource.href} href={resource.href} target="_blank" rel="noreferrer">{resource.label}<ExternalLink/></a>)}</div></section>
        <div className="legal-review-note"><Scale/><div><b>Business-specific legal review remains required.</b><p>This production-oriented document cannot determine the company’s corporate form, state-specific obligations, HIPAA role, pharmacy relationships, service footprint, or required notices. Qualified U.S. counsel should approve the configured entity, contacts, governing state, operational practices, and launch version.</p></div></div>
      </article>
    </section>
  </main>;
}

function LegalSection({section}){return <section className="legal-section" id={section.id}><span>{section.title.split('.')[0].padStart(2,'0')}</span><div><h2>{section.title.replace(/^\d+\.\s*/, '')}</h2>{section.paragraphs?.map((paragraph,index)=><p key={index}>{paragraph}</p>)}{section.bullets&&<ul>{section.bullets.map(item=><li key={item}><CheckCircle2/>{item}</li>)}</ul>}{section.paragraphsAfter?.map((paragraph,index)=><p key={`after-${index}`}>{paragraph}</p>)}{section.callout&&<aside><ShieldCheck/><p>{section.callout}</p></aside>}</div></section>}

function LegalContact({privacy}){return <section className="legal-contact" id="contact"><div><span>Verified contact</span><h2>{privacy?'Privacy requests and questions':'Questions about these Terms'}</h2><p>Use a verified channel. Do not include prescriptions, diagnoses, medical records, or other sensitive health information in ordinary email.</p></div><dl><div><dt>Business operator</dt><dd>{legalDetails.entity}</dd></div><div><dt>Business address</dt><dd>{legalDetails.address||<>Available through the <Link to="/contact">secure Contact page</Link> until verified for publication.</>}</dd></div><div><dt>{privacy?'Privacy contact':'Support contact'}</dt><dd>{(privacy?legalDetails.privacyEmail:legalDetails.supportEmail)?<a href={`mailto:${privacy?legalDetails.privacyEmail:legalDetails.supportEmail}`}><Mail/>{privacy?legalDetails.privacyEmail:legalDetails.supportEmail}</a>:<Link to="/contact"><Mail/>Secure Contact page</Link>}</dd></div><div><dt>Telephone</dt><dd>{legalDetails.phone?<a href={`tel:${legalDetails.phone}`}><Phone/>{legalDetails.phone}</a>:'Published after business verification'}</dd></div>{legalDetails.address&&<div><dt>Location</dt><dd><MapPin/>{legalDetails.address}</dd></div>}</dl></section>}

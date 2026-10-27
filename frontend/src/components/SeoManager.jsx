import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { glossaryTerms, learnArticles } from '../data/learnContent';
import { useApp } from '../context/AppContext';
import { getCareContent } from '../data/careContent';
import { fallbackComparisonOptions } from '../data/comparisonOptions';

const siteUrl=(import.meta.env.VITE_SITE_URL||'https://embody-mens-health.paleshore64.chatgpt.site').replace(/\/$/,'');
const shareImage=`${siteUrl}/images/embody-hero.png`;
const staticPages={
  '/':{title:'EMBODY Pharmacy | Everyday OTC & Wellness Essentials',description:'Explore clearly presented over-the-counter and wellness products with secure accounts and pharmacy-safety safeguards.',label:'Home'},
  '/online-care':{title:'Online Care: OTC & Wellness Products | EMBODY Pharmacy',description:'Explore allergy, pain-relief, hair-care, and daily wellness products by care need, with readable ingredients, directions, warnings, and secure checkout.',label:'Online care'},
  '/about':{title:'About EMBODY Pharmacy',description:'Learn how EMBODY approaches privacy, pharmacy boundaries, product information, and verified fulfillment.',label:'About'},
  '/compare':{title:'Compare Treatment Options | EMBODY Pharmacy',description:'Compare treatment options side by side, including timing, duration, frequency, prescription requirements, important considerations, and price factors.',label:'Compare treatments'},
  '/learn':{title:'Men’s Health Education & Treatment Guides | EMBODY Learn',description:'Explore plain-language guides to erectile concerns, treatment basics, comparisons, safety, side effects, prescriptions, shipping, refills, and medical terminology.',label:'Learn'},
  '/learn/glossary':{title:'Men’s Health & Pharmacy Glossary | EMBODY Learn',description:'Understand PDE5 inhibitors, contraindications, interactions, onset, half-life, prescriptions, refills, and other health terms in plain language.',label:'Glossary'},
  '/how-it-works':{title:'How Online Pharmacy Service Works | EMBODY',description:'Understand account verification, checkout validation, pharmacy licensing gates, pharmacist access, and fulfillment.',label:'How it works'},
  '/contact':{title:'Contact EMBODY Pharmacy Support',description:'Contact EMBODY support without sending medical information through ordinary email.',label:'Contact'},
  '/professionals':{title:'Healthcare Professional Program | EMBODY Pharmacy',description:'Apply for credential-reviewed EMBODY professional access with NPI-supported verification, privacy-minimized onboarding, and medication education resources.',label:'Healthcare professionals'},
  '/professionals/apply':{title:'Professional Credential Application | EMBODY Pharmacy',description:'Securely submit a healthcare professional application for credential review.',label:'Professional application'},
  '/partner-with-us':{title:'U.S. Pharmacy & Pharmacist Partnerships | EmbodyHubs',description:'Apply for an individually reviewed EmbodyHubs partnership as a licensed U.S. pharmacy, pharmacist, or healthcare organization.',label:'Partner with EmbodyHubs'},
  '/partner-with-us/apply':{title:'Secure Partnership Application | EmbodyHubs',description:'Submit a secure U.S. pharmacy or pharmacist partnership application for licensing, business, and compliance review.',label:'Partnership application'},
  '/partner-with-us/verify':{title:'Verify Partnership Application Email | EmbodyHubs',description:'Verify the professional email associated with an EmbodyHubs partnership application.',label:'Partnership email verification'},
  '/partner-account':{title:'Secure Partner Account | EmbodyHubs',description:'Access the administrator-approved EmbodyHubs pharmacy partner workspace.',label:'Partner account'},
  '/policies/privacy':{title:'Privacy Notice | EMBODY Pharmacy',description:'Review how EMBODY limits, protects, and handles account and storefront information.',label:'Privacy notice'},
  '/policies/terms':{title:'Terms of Service | EMBODY Pharmacy',description:'Review the terms and important limitations that apply when using the EMBODY storefront.',label:'Terms of service'},
  '/policies/shipping':{title:'Shipping Policy | EMBODY Pharmacy',description:'Learn about EMBODY order verification, fulfillment gates, carrier estimates, and shipping limitations.',label:'Shipping policy'},
  '/policies/prescription':{title:'Prescription Policy | EMBODY Pharmacy',description:'Understand the licensing, prescription, pharmacist, and destination checks required before prescription fulfillment.',label:'Prescription policy'}
};
const privatePrefixes=['/account','/orders','/cart','/checkout','/login','/register','/forgot-password','/reset-password','/search','/tracking','/support/chat','/professionals/apply','/partner-with-us/apply','/partner-with-us/verify','/partner-account'];

export default function SeoManager(){
  const{pathname}=useLocation();
  const{catalogProducts:products,catalogCategories:categories}=useApp();
  useEffect(()=>{
    const product=pathname.startsWith('/products/')?products.find(item=>`/products/${item.slug}`===pathname):null;
    const article=pathname.startsWith('/learn/')?learnArticles.find(item=>`/learn/${item.slug}`===pathname):null;
    const categorySlug=pathname.startsWith('/categories/')?pathname.split('/').pop():null;
    const category=categories.find(item=>item.slug===categorySlug);
    const page=product
      ?{title:product.seo?.title||`${product.name} ${product.dosage} – Uses, Safety & Price | EMBODY`,description:product.seo?.description||`Explore ${product.name}: ${product.description} Review directions, warnings, available plans, and current pricing before checkout.`,label:product.name}
      :article
        ?{title:article.seoTitle||`${article.title} | EMBODY Learn`,description:article.summary,label:article.title}
        :category
          ?{title:`${category.name} Online Care | EMBODY Pharmacy`,description:`Explore ${category.name.toLowerCase()} products with clear ingredients, directions, warnings, and secure checkout.`,label:category.name}
          :staticPages[pathname]||{title:'Page Not Found | EMBODY Pharmacy',description:'The requested EMBODY page could not be found.',label:'Not found'};
    const canonical=`${siteUrl}${pathname==='/'?'':pathname}`;
    const noIndex=privatePrefixes.some(prefix=>pathname.startsWith(prefix))||pathname.startsWith('/policies/')||Boolean(product?.seo?.noIndex)||article?.reviewStatus==='draft'||page.label==='Not found';
    document.title=page.title;
    setMeta('description',page.description);setMeta('robots',noIndex?'noindex,nofollow':'index,follow,max-image-preview:large');setMeta('author','EMBODY Pharmacy');
    setProperty('og:title',page.title);setProperty('og:description',page.description);setProperty('og:type',product?'product':article?'article':'website');setProperty('og:url',canonical);setProperty('og:site_name','EMBODY Pharmacy');setProperty('og:locale','en_US');setProperty('og:image',shareImage);setProperty('og:image:alt',article?'EMBODY Learn health education library':'EMBODY everyday pharmacy and wellness storefront');
    setMeta('twitter:card','summary_large_image');setMeta('twitter:title',page.title);setMeta('twitter:description',page.description);setMeta('twitter:image',shareImage);
    let link=document.querySelector('link[rel="canonical"]');if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link)}link.href=canonical;
    document.querySelector('script[data-embody-jsonld]')?.remove();
    if(!noIndex){const script=document.createElement('script');script.type='application/ld+json';script.dataset.embodyJsonld='true';script.textContent=JSON.stringify(schemaGraph({product,article,category,categories,page,canonical,pathname}));document.head.appendChild(script)}
    return()=>document.querySelector('script[data-embody-jsonld]')?.remove();
  },[pathname,products,categories]);
  return null;
}

function setMeta(name,content){let node=document.querySelector(`meta[name="${name}"]`);if(!node){node=document.createElement('meta');node.name=name;document.head.appendChild(node)}node.content=content}
function setProperty(property,content){let node=document.querySelector(`meta[property="${property}"]`);if(!node){node=document.createElement('meta');node.setAttribute('property',property);document.head.appendChild(node)}node.content=content}
function schemaGraph({product,article,category,categories,page,canonical,pathname}){
  const storeId=`${siteUrl}/#store`;const websiteId=`${siteUrl}/#website`;
  const graph=[{'@type':'OnlineStore','@id':storeId,name:'EMBODY Pharmacy',url:siteUrl,description:'Online OTC and wellness storefront with privacy and pharmacy-readiness safeguards.',image:`${siteUrl}/images/embody-hero.png`},{'@type':'WebSite','@id':websiteId,url:siteUrl,name:'EMBODY Pharmacy',publisher:{'@id':storeId},inLanguage:'en-US'}];
  if(pathname!=='/'){
    const crumbs=[{'@type':'ListItem',position:1,name:'Home',item:siteUrl}];
    if(product){const productCategory=categories.find(item=>item.slug===product.category);crumbs.push({'@type':'ListItem',position:2,name:'Online care',item:`${siteUrl}/online-care`});if(productCategory)crumbs.push({'@type':'ListItem',position:3,name:productCategory.name,item:`${siteUrl}/categories/${productCategory.slug}`});crumbs.push({'@type':'ListItem',position:crumbs.length+1,name:product.name,item:canonical})}
    else if(article)crumbs.push({'@type':'ListItem',position:2,name:'Learn',item:`${siteUrl}/learn`},{'@type':'ListItem',position:3,name:article.category,item:`${siteUrl}/learn#${article.categoryId}`},{'@type':'ListItem',position:4,name:article.title,item:canonical});
    else if(pathname==='/learn/glossary')crumbs.push({'@type':'ListItem',position:2,name:'Learn',item:`${siteUrl}/learn`},{'@type':'ListItem',position:3,name:'Glossary',item:canonical});
    else crumbs.push({'@type':'ListItem',position:2,name:page.label,item:canonical});
    graph.push({'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:crumbs});
  }
  if(product){const content=getCareContent(product);const image=product.imageUrl?(product.imageUrl.startsWith('http')?product.imageUrl:`${siteUrl}${product.imageUrl.startsWith('/')?'':'/'}${product.imageUrl}`):shareImage;const rules=product.pricingConfigurator?.priceRules||[];const totals=rules.map(rule=>{const months=product.pricingConfigurator.shippingOptions.find(option=>option.label===rule.shippingLabel)?.months||1;return(rule.monthlyPriceCents!==undefined?rule.monthlyPriceCents*months:rule.totalPriceCents)/100}).filter(Number.isFinite);const availability=product.variants?.some(variant=>variant.stock>0)?'https://schema.org/InStock':'https://schema.org/OutOfStock';const offers=totals.length?{'@type':'AggregateOffer',priceCurrency:'USD',lowPrice:Math.min(...totals).toFixed(2),highPrice:Math.max(...totals).toFixed(2),offerCount:totals.length,availability,url:canonical,seller:{'@id':storeId}}:{'@type':'Offer',priceCurrency:'USD',price:Number(product.price).toFixed(2),itemCondition:'https://schema.org/NewCondition',availability,url:canonical,seller:{'@id':storeId}};graph.push({'@type':'Product','@id':`${canonical}#product`,name:product.name,sku:String(product.id),image:[image],description:product.description,url:canonical,category:categories.find(item=>item.slug===product.category)?.name||product.category,brand:{'@type':'Brand',name:'EMBODY'},offers});graph.push({'@type':'FAQPage','@id':`${canonical}#faq`,mainEntity:content.faqs.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))})}
  else if(article){graph.push({'@type':'Article','@id':`${canonical}#article`,headline:article.title,description:article.summary,url:canonical,mainEntityOfPage:canonical,datePublished:article.updated,dateModified:article.updated,articleSection:article.category,keywords:article.keywords.join(', '),author:{'@type':'Organization',name:'EMBODY Editorial Team'},publisher:{'@id':storeId},inLanguage:'en-US'});if(article.faq)graph.push({'@type':'FAQPage','@id':`${canonical}#faq`,mainEntity:article.faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))})}
  else if(pathname==='/learn')graph.push({'@type':'CollectionPage','@id':`${canonical}#webpage`,url:canonical,name:page.title,description:page.description,isPartOf:{'@id':websiteId},inLanguage:'en-US',mainEntity:{'@type':'ItemList',numberOfItems:learnArticles.length,itemListElement:learnArticles.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.title,url:`${siteUrl}/learn/${item.slug}`}))}});
  else if(pathname==='/compare')graph.push({'@type':'WebPage','@id':`${canonical}#webpage`,url:canonical,name:page.title,description:page.description,isPartOf:{'@id':websiteId},inLanguage:'en-US',about:fallbackComparisonOptions.map(item=>({'@type':'Drug',name:item.name,alternateName:item.genericName,prescriptionStatus:'https://schema.org/PrescriptionOnly'}))});
  else if(pathname==='/learn/glossary')graph.push({'@type':'DefinedTermSet','@id':`${canonical}#glossary`,name:'EMBODY Learn plain-language glossary',url:canonical,description:page.description,hasDefinedTerm:glossaryTerms.map(item=>({'@type':'DefinedTerm',name:item.term,description:item.definition,inDefinedTermSet:canonical}))});
  else graph.push({'@type':category?'CollectionPage':'WebPage','@id':`${canonical}#webpage`,url:canonical,name:page.title,description:page.description,isPartOf:{'@id':websiteId},inLanguage:'en-US'});
  return{'@context':'https://schema.org','@graph':graph};
}

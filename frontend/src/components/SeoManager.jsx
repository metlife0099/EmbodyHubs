import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { articles } from '../data/catalog';
import { useApp } from '../context/AppContext';
import { getCareContent } from '../data/careContent';

const siteUrl=(import.meta.env.VITE_SITE_URL||'https://embody-mens-health.paleshore64.chatgpt.site').replace(/\/$/,'');
const shareImage=`${siteUrl}/images/embody-hero.png`;
const staticPages={
  '/':{title:'EMBODY Pharmacy | Everyday OTC & Wellness Essentials',description:'Explore clearly presented over-the-counter and wellness products with secure accounts and pharmacy-safety safeguards.',label:'Home'},
  '/online-care':{title:'Online Care: OTC & Wellness Products | EMBODY Pharmacy',description:'Explore allergy, pain-relief, hair-care, and daily wellness products by care need, with readable ingredients, directions, warnings, and secure checkout.',label:'Online care'},
  '/about':{title:'About EMBODY Pharmacy',description:'Learn how EMBODY approaches privacy, pharmacy boundaries, product information, and verified fulfillment.',label:'About'},
  '/learn':{title:'Medication Safety & Pharmacy Education | EMBODY',description:'Read practical, pharmacist-review-ready guides about Drug Facts labels, medication lists, and safer OTC use.',label:'Learn'},
  '/how-it-works':{title:'How Online Pharmacy Service Works | EMBODY',description:'Understand account verification, checkout validation, pharmacy licensing gates, pharmacist access, and fulfillment.',label:'How it works'},
  '/contact':{title:'Contact EMBODY Pharmacy Support',description:'Contact EMBODY support without sending medical information through ordinary email.',label:'Contact'},
  '/policies/privacy':{title:'Privacy Notice | EMBODY Pharmacy',description:'Review how EMBODY limits, protects, and handles account and storefront information.',label:'Privacy notice'},
  '/policies/terms':{title:'Terms of Service | EMBODY Pharmacy',description:'Review the terms and important limitations that apply when using the EMBODY storefront.',label:'Terms of service'},
  '/policies/shipping':{title:'Shipping Policy | EMBODY Pharmacy',description:'Learn about EMBODY order verification, fulfillment gates, carrier estimates, and shipping limitations.',label:'Shipping policy'},
  '/policies/prescription':{title:'Prescription Policy | EMBODY Pharmacy',description:'Understand the licensing, prescription, pharmacist, and destination checks required before prescription fulfillment.',label:'Prescription policy'}
};
const privatePrefixes=['/account','/orders','/cart','/checkout','/login','/register','/forgot-password','/reset-password','/search','/tracking','/support/chat'];

export default function SeoManager(){
  const{pathname}=useLocation();
  const{catalogProducts:products,catalogCategories:categories}=useApp();
  useEffect(()=>{
    const product=pathname.startsWith('/products/')?products.find(item=>`/products/${item.slug}`===pathname):null;
    const article=pathname.startsWith('/learn/')?articles.find(item=>`/learn/${item.slug}`===pathname):null;
    const categorySlug=pathname.startsWith('/categories/')?pathname.split('/').pop():null;
    const category=categories.find(item=>item.slug===categorySlug);
    const page=product?{title:product.seo?.title||`${product.name} ${product.dosage} – Uses, Safety & Price | EMBODY`,description:product.seo?.description||`Explore ${product.name}: ${product.description} Review directions, warnings, package details, and current price before adding to cart.`,label:product.name}:article?{title:`${article.title} | EMBODY Pharmacy`,description:article.summary,label:article.title}:category?{title:`${category.name} Online Care | EMBODY Pharmacy`,description:`Explore ${category.name.toLowerCase()} products with clear ingredients, directions, warnings, and secure checkout.`,label:category.name}:staticPages[pathname]||{title:'Page Not Found | EMBODY Pharmacy',description:'The requested EMBODY page could not be found.',label:'Not found'};
    const canonical=`${siteUrl}${pathname==='/'?'':pathname}`;
    const noIndex=privatePrefixes.some(prefix=>pathname.startsWith(prefix))||pathname.startsWith('/policies/')||Boolean(product?.seo?.noIndex)||Boolean(article?.reviewed?.toLowerCase().includes('required'))||page.label==='Not found';
    document.title=page.title;
    setMeta('description',page.description);setMeta('robots',noIndex?'noindex,nofollow':'index,follow,max-image-preview:large');setMeta('author','EMBODY Pharmacy');
    setProperty('og:title',page.title);setProperty('og:description',page.description);setProperty('og:type',product?'product':article?'article':'website');setProperty('og:url',canonical);setProperty('og:site_name','EMBODY Pharmacy');setProperty('og:locale','en_US');setProperty('og:image',shareImage);setProperty('og:image:alt','EMBODY everyday pharmacy and wellness storefront');
    setMeta('twitter:card','summary_large_image');setMeta('twitter:title',page.title);setMeta('twitter:description',page.description);setMeta('twitter:image',shareImage);
    let link=document.querySelector('link[rel="canonical"]');if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link)}link.href=canonical;
    const old=document.querySelector('script[data-embody-jsonld]');old?.remove();
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
  if(pathname!=='/'){const crumbs=[{'@type':'ListItem',position:1,name:'Home',item:siteUrl}];if(product){const productCategory=categories.find(item=>item.slug===product.category);crumbs.push({'@type':'ListItem',position:2,name:'Online care',item:`${siteUrl}/online-care`});if(productCategory)crumbs.push({'@type':'ListItem',position:3,name:productCategory.name,item:`${siteUrl}/categories/${productCategory.slug}`});crumbs.push({'@type':'ListItem',position:crumbs.length+1,name:product.name,item:canonical})}else crumbs.push({'@type':'ListItem',position:2,name:page.label,item:canonical});graph.push({'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:crumbs})}
  if(product){const content=getCareContent(product);const image=product.imageUrl?(product.imageUrl.startsWith('http')?product.imageUrl:`${siteUrl}${product.imageUrl.startsWith('/')?'':'/'}${product.imageUrl}`):shareImage;graph.push({'@type':'Product','@id':`${canonical}#product`,name:product.name,sku:String(product.id),image:[image],description:product.description,url:canonical,category:categories.find(item=>item.slug===product.category)?.name||product.category,brand:{'@type':'Brand',name:'EMBODY'},offers:{'@type':'Offer',priceCurrency:'USD',price:Number(product.price).toFixed(2),itemCondition:'https://schema.org/NewCondition',availability:product.stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',url:canonical,seller:{'@id':storeId}}});graph.push({'@type':'FAQPage','@id':`${canonical}#faq`,mainEntity:content.faqs.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))})}
  else if(article)graph.push({'@type':'Article','@id':`${canonical}#article`,headline:article.title,description:article.summary,url:canonical,mainEntityOfPage:canonical,publisher:{'@id':storeId},inLanguage:'en-US'});
  else graph.push({'@type':category?'CollectionPage':'WebPage','@id':`${canonical}#webpage`,url:canonical,name:page.title,description:page.description,isPartOf:{'@id':websiteId},inLanguage:'en-US'});
  return{'@context':'https://schema.org','@graph':graph};
}

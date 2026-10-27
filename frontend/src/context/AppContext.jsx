import { createContext,useContext,useEffect,useMemo,useState } from 'react';
import { api } from '../services/api';
import { categories as fallbackCategories,products as fallbackProducts } from '../data/catalog';

const AppContext=createContext(null);
function readLocalJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{localStorage.removeItem(key);return fallback}}
function cartKey(product){return product.cartKey||`${product.id}:${product.variantId||'default'}`}

export function AppProvider({children}){
  const[user,setStoredUser]=useState(()=>readLocalJson('embody-user',null));
  const[cart,setCart]=useState(()=>readLocalJson('embody-user',null)?readLocalJson('embody-cart',[]).map(item=>({...item,cartKey:cartKey(item)})):[]);
  const[notice,setNotice]=useState(null);
  const[questionnaire,setQuestionnaire]=useState(null);
  const[loginPrompt,setLoginPrompt]=useState(null);
  const[catalogProducts,setCatalogProducts]=useState(()=>fallbackProducts.map(normalizeProduct));
  const[catalogCategories,setCatalogCategories]=useState(()=>fallbackCategories.map(normalizeCategory));

  useEffect(()=>localStorage.setItem('embody-cart',JSON.stringify(cart)),[cart]);
  useEffect(()=>user?localStorage.setItem('embody-user',JSON.stringify(user)):localStorage.removeItem('embody-user'),[user]);
  useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(null),4200);return()=>clearTimeout(id)},[notice]);
  useEffect(()=>{api.products('?limit=48&sort=newest').then(result=>{if(result.data?.length)setCatalogProducts(result.data.map(normalizeProduct))}).catch(()=>{})},[]);
  useEffect(()=>{api.productCategories().then(result=>{if(result.data?.length)setCatalogCategories(result.data.map(normalizeCategory))}).catch(()=>{})},[]);
  useEffect(()=>{const expire=()=>{setStoredUser(null);setCart([]);localStorage.removeItem('embody-user');setNotice({type:'error',message:'Your session expired. Sign in again to continue.'})};window.addEventListener('embody:auth-expired',expire);return()=>window.removeEventListener('embody:auth-expired',expire)},[]);
  const setUser=nextUser=>{setStoredUser(nextUser);if(!nextUser)setCart([])};

  const addItem=(product,questionnaireCompleted=false,questionnaireResponseId=null)=>{
    setCart(items=>{
      const key=cartKey(product);const existing=items.find(item=>cartKey(item)===key);const requestedQuantity=Math.max(1,Math.min(Number(product.initialQuantity||1),Number(product.stock||1)));
      return existing
        ?items.map(item=>cartKey(item)===key?{...item,...product,cartKey:key,quantity:product.initialQuantity?requestedQuantity:Math.min(item.quantity+1,product.stock),questionnaireCompleted:item.questionnaireCompleted||questionnaireCompleted,questionnaireCompletedBy:questionnaireCompleted?user?.id:item.questionnaireCompletedBy,questionnaireResponseId:questionnaireResponseId||item.questionnaireResponseId}:item)
        :[...items,{...product,cartKey:key,quantity:requestedQuantity,questionnaireCompleted,questionnaireCompletedBy:questionnaireCompleted?user?.id:undefined,questionnaireResponseId}];
    });
    setNotice({type:'success',message:`${product.name} added to your cart.`});
  };

  const completeQuestionedAction=(product,existing,questionnaireResponseId=null)=>{
    if(existing){
      const key=cartKey(product);setCart(items=>items.map(item=>cartKey(item)===key?{...item,questionnaireCompleted:true,questionnaireCompletedBy:user.id,questionnaireResponseId}:item));
      setNotice({type:'success',message:`Questions completed for ${product.name}.`});
    }else addItem(product,true,questionnaireResponseId);
  };

  const requestAdd=async(product,{existing=false}={})=>{
    if(product.stock<=0){setNotice({type:'error',message:`${product.name} is currently out of stock.`});return}
    if(product.prescriptionRequired){setNotice({type:'error',message:'Prescription ordering is unavailable until pharmacy licensing is configured.'});return}
    if(!user){setLoginPrompt(product);return}
    setQuestionnaire({product,existing,questions:[],loading:true,error:''});
    try{
      const result=await api.cartQuestions(product.slug);
      if(!result.data.enabled||!result.data.questions.length){setQuestionnaire(null);completeQuestionedAction(product,existing);return}
      setQuestionnaire({product,existing,questions:result.data.questions,loading:false,error:''});
    }catch(error){setQuestionnaire(current=>({...current,loading:false,error:error.message}))}
  };

  const submitQuestionnaire=async answers=>{
    setQuestionnaire(current=>({...current,saving:true,error:''}));
    try{
      const result=await api.submitCartAnswers({productSlug:questionnaire.product.slug,answers});
      completeQuestionedAction(questionnaire.product,questionnaire.existing,result.data.responseId);
      setQuestionnaire(null);
    }catch(error){setQuestionnaire(current=>({...current,saving:false,error:error.message}))}
  };

  const updateQuantity=(key,quantity)=>setCart(items=>items.map(item=>cartKey(item)===key?{...item,quantity:Math.max(1,Math.min(Number(quantity),item.stock))}:item));
  const removeItem=key=>setCart(items=>items.filter(item=>cartKey(item)!==key));
  const clearCart=()=>setCart([]);
  const count=cart.reduce((sum,item)=>sum+item.quantity,0);
  const subtotal=cart.reduce((sum,item)=>sum+(item.planSelection&&Number.isFinite(Number(item.lineTotal))?Number(item.lineTotal):item.price*item.quantity),0);
  const resolvedCategories=useMemo(()=>{const known=new Set(catalogCategories.map(item=>item.slug));const missing=[...new Set(catalogProducts.map(item=>item.category).filter(Boolean))].filter(slug=>!known.has(slug)).map(slug=>fallbackCategories.find(item=>item.slug===slug)||{id:slug,slug,name:'Other care',eyebrow:'Online care',description:'Additional care products with clear label and safety information.',sortOrder:999,active:true});return[...catalogCategories,...missing].sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)||a.name.localeCompare(b.name))},[catalogCategories,catalogProducts]);
  const value=useMemo(()=>({cart,user,setUser,notice,setNotice,questionnaire,setQuestionnaire,loginPrompt,setLoginPrompt,catalogProducts,catalogCategories:resolvedCategories,requestAdd,submitQuestionnaire,updateQuantity,removeItem,clearCart,count,subtotal}),[cart,user,notice,questionnaire,loginPrompt,catalogProducts,resolvedCategories,count,subtotal]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp=()=>useContext(AppContext);

function normalizeProduct(product){
  const productId=String(product._id||product.id);const supplied=product.variants?.length?product.variants:[{_id:product.variantId||'',sku:product.sku||'',dosage:product.dosage,form:product.form,packSize:product.pack,priceCents:Math.round(Number(product.price||0)*100),stock:product.stock,active:true}];
  const variants=supplied.filter(item=>item.active!==false).map(item=>{const id=String(item._id||item.id||'');const label=item.label||[item.dosage,item.form,item.packSize].filter(Boolean).join(' · ')||item.sku||'Standard option';return{id,label,sku:item.sku||'',dosage:item.dosage||'',form:item.form||'',pack:item.packSize||'',price:Number(item.priceCents||0)/100,stock:Number(item.stock||0),active:item.active!==false}});
  const variant=variants.find(item=>item.stock>0)||variants[0]||{id:'',label:'Unavailable',sku:'',dosage:'',form:'',pack:'',price:0,stock:0};const prices=variants.map(item=>item.price);const minPrice=prices.length?Math.min(...prices):0;
  const rawConfigurator=product.pricingConfigurator||{};const pricingConfigurator={enabled:Boolean(rawConfigurator.enabled),eyebrow:rawConfigurator.eyebrow||'Flexible purchase',title:rawConfigurator.title||'Build your plan',subtitle:rawConfigurator.subtitle||'Choose the options that fit your needs.',disclaimer:rawConfigurator.disclaimer||'Prices are estimates based on the selected product, quantity, and delivery interval. Final availability and pricing are confirmed at checkout.',frequencyOptions:rawConfigurator.frequencyOptions?.length?rawConfigurator.frequencyOptions:['Standard use'],doseOptions:rawConfigurator.doseOptions?.length?rawConfigurator.doseOptions.map(item=>({label:item.label,quantity:Number(item.quantity)})):[{label:'1 item',quantity:1}],shippingOptions:rawConfigurator.shippingOptions?.length?rawConfigurator.shippingOptions.map(item=>({label:item.label,months:Number(item.months)})):[{label:'One-time delivery',months:1}],priceRules:(rawConfigurator.priceRules||[]).map(rule=>({...rule,totalPriceCents:Number(rule.totalPriceCents)}))};
  return{id:productId,slug:product.slug,category:product.category?.slug||product.category||'daily-wellness',categoryName:product.category?.name||'',name:product.name,ingredient:product.activeIngredient||product.ingredient||'',variantId:variant.id,variantLabel:variant.label,sku:variant.sku,dosage:variant.dosage,form:variant.form,pack:variant.pack,price:variant.price,minPrice,hasVariants:variants.length>1,variants,productType:product.productType,prescriptionRequired:Boolean(product.prescriptionRequired),cartQuestionnaireEnabled:Boolean(product.cartQuestionnaireEnabled),pricingConfigurator,stock:variant.stock,badge:product.productType==='WELLNESS'?'Wellness':product.prescriptionRequired?'Prescription':'Over-the-counter',tone:product.tone||'teal',imageUrl:product.images?.[0]?.url||product.imageUrl||'',imageAlt:product.images?.[0]?.alt||product.imageAlt||product.name,description:product.description||'',directions:product.directions||'',warnings:product.warnings||[],careName:product.careName||'',headline:product.headline||'',summaryPoints:product.summaryPoints||[],howItWorks:product.howItWorks||'',pharmacistNote:product.pharmacistNote||'',faqs:product.faqs||[],seo:product.seo||{}}
}
function normalizeCategory(category){return{id:category._id||category.id,slug:category.slug,name:category.name,eyebrow:'Online care',description:category.description||'Explore clear product information for this care area.',sortOrder:category.sortOrder||0,active:category.active!==false}}

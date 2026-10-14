import { createContext,useContext,useEffect,useMemo,useState } from 'react';
import { api } from '../services/api';
import { products as fallbackProducts } from '../data/catalog';

const AppContext=createContext(null);
function readLocalJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{localStorage.removeItem(key);return fallback}}

export function AppProvider({children}){
  const[user,setStoredUser]=useState(()=>readLocalJson('embody-user',null));
  const[cart,setCart]=useState(()=>readLocalJson('embody-user',null)?readLocalJson('embody-cart',[]):[]);
  const[notice,setNotice]=useState(null);
  const[questionnaire,setQuestionnaire]=useState(null);
  const[loginPrompt,setLoginPrompt]=useState(null);
  const[catalogProducts,setCatalogProducts]=useState(fallbackProducts);

  useEffect(()=>localStorage.setItem('embody-cart',JSON.stringify(cart)),[cart]);
  useEffect(()=>user?localStorage.setItem('embody-user',JSON.stringify(user)):localStorage.removeItem('embody-user'),[user]);
  useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(null),4200);return()=>clearTimeout(id)},[notice]);
  useEffect(()=>{api.products('?limit=48&sort=newest').then(result=>{if(result.data?.length)setCatalogProducts(result.data.map(normalizeProduct))}).catch(()=>{})},[]);
  const setUser=nextUser=>{setStoredUser(nextUser);if(!nextUser)setCart([])};

  const addItem=(product,questionnaireCompleted=false,questionnaireResponseId=null)=>{
    setCart(items=>{
      const existing=items.find(item=>item.id===product.id);
      return existing
        ?items.map(item=>item.id===product.id?{...item,quantity:Math.min(item.quantity+1,product.stock),questionnaireCompleted:item.questionnaireCompleted||questionnaireCompleted,questionnaireCompletedBy:questionnaireCompleted?user?.id:item.questionnaireCompletedBy,questionnaireResponseId:questionnaireResponseId||item.questionnaireResponseId}:item)
        :[...items,{...product,quantity:1,questionnaireCompleted,questionnaireCompletedBy:questionnaireCompleted?user?.id:undefined,questionnaireResponseId}];
    });
    setNotice({type:'success',message:`${product.name} added to your cart.`});
  };

  const completeQuestionedAction=(product,existing,questionnaireResponseId=null)=>{
    if(existing){
      setCart(items=>items.map(item=>item.id===product.id?{...item,questionnaireCompleted:true,questionnaireCompletedBy:user.id,questionnaireResponseId}:item));
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

  const updateQuantity=(id,quantity)=>setCart(items=>items.map(item=>item.id===id?{...item,quantity:Math.max(1,Math.min(Number(quantity),item.stock))}:item));
  const removeItem=id=>setCart(items=>items.filter(item=>item.id!==id));
  const clearCart=()=>setCart([]);
  const count=cart.reduce((sum,item)=>sum+item.quantity,0);
  const subtotal=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const value=useMemo(()=>({cart,user,setUser,notice,setNotice,questionnaire,setQuestionnaire,loginPrompt,setLoginPrompt,catalogProducts,requestAdd,submitQuestionnaire,updateQuantity,removeItem,clearCart,count,subtotal}),[cart,user,notice,questionnaire,loginPrompt,catalogProducts,count,subtotal]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp=()=>useContext(AppContext);

function normalizeProduct(product){const variant=product.variants?.find(item=>item.active!==false)||product.variants?.[0]||{};return{id:product._id||product.id,slug:product.slug,category:product.category?.slug||product.category||'all',name:product.name,ingredient:product.activeIngredient||'',dosage:variant.dosage||'',form:variant.form||'',pack:variant.packSize||'',price:(variant.priceCents||0)/100,productType:product.productType,prescriptionRequired:Boolean(product.prescriptionRequired),cartQuestionnaireEnabled:Boolean(product.cartQuestionnaireEnabled),stock:variant.stock||0,badge:product.productType==='WELLNESS'?'Wellness':product.prescriptionRequired?'Prescription':'Over-the-counter',tone:'teal',imageUrl:product.images?.[0]?.url||'',imageAlt:product.images?.[0]?.alt||product.name,description:product.description||'',directions:product.directions||'',warnings:product.warnings||[]}}

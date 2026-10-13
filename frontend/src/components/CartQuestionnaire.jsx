import { useState } from 'react';
import { AlertCircle,Check,LoaderCircle,ShieldCheck,X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CartQuestionnaire(){
  const{questionnaire,setQuestionnaire,requestAdd,submitQuestionnaire}=useApp();
  const[answers,setAnswers]=useState({});
  if(!questionnaire)return null;
  const{product,questions,loading,saving,error}=questionnaire;
  const setSingle=(id,value)=>setAnswers(current=>({...current,[id]:[value]}));
  const toggle=(id,value)=>setAnswers(current=>{const values=current[id]||[];return{...current,[id]:values.includes(value)?values.filter(item=>item!==value):[...values,value]}});
  const submit=event=>{
    event.preventDefault();
    submitQuestionnaire(questions.map(question=>({questionId:question.id,values:answers[question.id]||[]})));
  };
  return <div className="modal-backdrop" role="presentation">
    <section className="cart-questionnaire" role="dialog" aria-modal="true" aria-labelledby="cart-question-title">
      <header><div><span>Required before checkout</span><h2 id="cart-question-title">A few questions about {product.name}</h2></div><button onClick={()=>setQuestionnaire(null)} aria-label="Close questions"><X/></button></header>
      {loading?<div className="questionnaire-loading"><LoaderCircle/><p>Loading the current pharmacy questions…</p></div>:error&&!questions.length?<div className="questionnaire-loading"><AlertCircle/><p className="form-error" role="alert">{error}</p><button className="btn btn-primary" onClick={()=>requestAdd(product,{existing:questionnaire.existing})}>Try again</button></div>:<form onSubmit={submit}>
        <div className="questionnaire-intro"><ShieldCheck/><p>Your cart was kept while you signed in. Answer only the questions currently configured by an authorized administrator.</p></div>
        {questions.map((question,index)=><fieldset key={question.id} className="cart-question">
          <legend><b>{index+1}</b>{question.prompt}{question.required&&<em>Required</em>}</legend>
          {question.helpText&&<p>{question.helpText}</p>}
          <div className="question-options">{question.options.map(option=>{
            const checked=(answers[question.id]||[]).includes(option.value);
            return <label key={option.value} className={checked?'selected':''}><input required={question.required&&question.responseType!=='MULTI_CHOICE'} type={question.responseType==='MULTI_CHOICE'?'checkbox':'radio'} name={question.id} value={option.value} checked={checked} onChange={()=>question.responseType==='MULTI_CHOICE'?toggle(question.id,option.value):setSingle(question.id,option.value)}/><span>{option.label}</span>{checked&&<Check/>}</label>;
          })}</div>
        </fieldset>)}
        {error&&<p className="form-error" role="alert"><AlertCircle/> {error}</p>}
        <footer><button type="button" className="btn btn-ghost" onClick={()=>setQuestionnaire(null)}>Not now</button><button disabled={saving} className="btn btn-primary">{saving?'Saving…':'Save answers and add to cart'}</button></footer>
      </form>}
    </section>
  </div>;
}

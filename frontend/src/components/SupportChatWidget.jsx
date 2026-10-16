import { useCallback,useEffect,useRef,useState } from 'react';
import { ArrowRight,CheckCheck,Headphones,LockKeyhole,MessageCircle,Send,X } from 'lucide-react';
import { Link,useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function SupportChatWidget(){
  const{user}=useApp();const{pathname}=useLocation();const[open,setOpen]=useState(false);const[data,setData]=useState(null);const[body,setBody]=useState('');const[loading,setLoading]=useState(false);const[sending,setSending]=useState(false);const[error,setError]=useState('');const endRef=useRef(null);
  const load=useCallback(async({markRead=false,silent=false}={})=>{if(!user)return;if(!silent)setLoading(true);try{const result=await api.chat();setData(result.data);setError('');if(markRead&&result.data.conversation?.customerUnreadCount){await api.markChatRead();setData(current=>current?{...current,conversation:{...current.conversation,customerUnreadCount:0}}:current)}}catch(err){setError(err.message)}finally{if(!silent)setLoading(false)}},[user]);
  useEffect(()=>{setData(null);setOpen(false);if(user)load({silent:true})},[user,load]);
  useEffect(()=>{if(!user)return;const timer=window.setInterval(()=>{if(document.visibilityState==='visible')load({markRead:open,silent:true})},open?10000:30000);return()=>window.clearInterval(timer)},[user,open,load]);
  useEffect(()=>{if(open&&user){load({markRead:true});window.setTimeout(()=>endRef.current?.scrollIntoView({block:'nearest'}),80)}},[open,user,load]);
  useEffect(()=>{const close=event=>{if(event.key==='Escape')setOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'})},[open,data?.messages?.length]);
  if(pathname==='/support/chat')return null;
  const unread=data?.conversation?.customerUnreadCount||0;
  const send=async event=>{event.preventDefault();const message=body.trim();if(!message||sending)return;setSending(true);setError('');try{const result=await api.sendChatMessage({body:message,clientMessageId:`widget_${crypto.randomUUID()}`});setBody('');setData(current=>({...current,conversation:result.data.conversation||current?.conversation,messages:[...(current?.messages||[]),result.data.message]}))}catch(err){setError(err.message)}finally{setSending(false)}};
  return <div className={`support-widget ${open?'support-widget--open':''}`}>
    {open&&<section className="support-widget-panel" role="dialog" aria-modal="false" aria-labelledby="support-widget-title">
      <header><span className="support-widget-agent"><Headphones/></span><div><strong id="support-widget-title">EMBODY Support</strong><small><i/> Human support team</small></div><button onClick={()=>setOpen(false)} aria-label="Close support chat"><X/></button></header>
      {!user?<div className="support-widget-login"><span><LockKeyhole/></span><h2>Sign in to start chatting</h2><p>Support chat is private and connected to your verified customer account.</p><Link className="btn btn-primary" to="/login" onClick={()=>setOpen(false)}>Sign in to chat <ArrowRight/></Link><small>No bots or AI replies.</small></div>:<>
        <div className="support-widget-messages" aria-live="polite">{loading&&!data?<WidgetLoading/>:data?.messages?.length?data.messages.slice(-30).map(message=><WidgetMessage key={message.id} message={message}/>):<div className="support-widget-empty"><MessageCircle/><h2>Welcome, {user.firstName}.</h2><p>Send a message and a member of our admin support team will reply here.</p></div>}<div ref={endRef}/></div>
        <form className="support-widget-compose" onSubmit={send}><label className="sr-only" htmlFor="support-widget-message">Message support</label><textarea id="support-widget-message" rows="2" maxLength="2000" value={body} onChange={event=>setBody(event.target.value)} placeholder="Type your message…"/><div><span>{body.length}/2000</span><button disabled={!body.trim()||sending} aria-label="Send message">{sending?<i className="support-widget-spinner"/>:<Send/>}</button></div>{error&&<p role="alert">{error}</p>}</form>
        <footer><LockKeyhole/><span>Secure account chat</span><Link to="/support/chat" onClick={()=>setOpen(false)}>Open full chat <ArrowRight/></Link></footer>
      </>}
    </section>}
    <button className="support-widget-launcher" onClick={()=>setOpen(value=>!value)} aria-label={open?'Close customer support chat':'Open customer support chat'} aria-expanded={open}>{open?<X/>:<MessageCircle/>}{unread>0&&!open&&<span>{unread>9?'9+':unread}</span>}</button>
  </div>;
}

function WidgetMessage({message}){const mine=message.senderType==='CUSTOMER';return <article className={`support-widget-message ${mine?'support-widget-message--mine':''}`}><div>{message.body}</div><small><span>{mine?'You':'EMBODY Support'}</span><time dateTime={message.createdAt}>{new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(message.createdAt))}</time>{mine&&message.readAt&&<CheckCheck aria-label="Read"/>}</small></article>}
function WidgetLoading(){return <div className="support-widget-loading"><span/><span/><span/></div>}

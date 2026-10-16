import { useCallback,useEffect,useRef,useState } from 'react';
import { ArrowRight,CheckCheck,Clock3,Headphones,LockKeyhole,MessageCircleMore,Send,ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function SupportChat(){
  const{user}=useApp();const[data,setData]=useState(null);const[body,setBody]=useState('');const[loading,setLoading]=useState(true);const[sending,setSending]=useState(false);const[error,setError]=useState('');const endRef=useRef(null);
  const load=useCallback(async(silent=false)=>{if(!user)return;try{const result=await api.chat();setData(result.data);setError('');if(result.data.conversation?.customerUnreadCount)api.markChatRead().catch(()=>{})}catch(err){setError(err.message)}finally{if(!silent)setLoading(false)}},[user]);
  useEffect(()=>{load();const timer=window.setInterval(()=>{if(document.visibilityState==='visible')load(true)},12000);return()=>window.clearInterval(timer)},[load]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'})},[data?.messages?.length]);
  if(!user)return <div className="empty-page support-auth"><span className="eyebrow">Private customer support</span><h1>Sign in to start a secure conversation.</h1><p>Your verified account keeps your messages connected to the right customer and protected from anonymous access.</p><Link className="btn btn-primary" to="/login">Sign in to chat <ArrowRight/></Link></div>;
  const send=async event=>{event.preventDefault();const message=body.trim();if(!message||sending)return;setSending(true);setError('');try{const result=await api.sendChatMessage({body:message,clientMessageId:`web_${crypto.randomUUID()}`});setBody('');setData(current=>({...current,conversation:result.data.conversation||current?.conversation,messages:[...(current?.messages||[]),result.data.message]}))}catch(err){setError(err.message)}finally{setSending(false)}};
  return <div className="page-shell support-chat-page">
    <header className="support-chat-hero"><div><span className="eyebrow">Human support</span><h1>Chat with the EMBODY team.</h1><p>A private, account-linked conversation with our support staff. No bot or AI sends replies here.</p></div><div className="support-presence"><span><i/> Support inbox</span><small>Replies appear here after a team member responds.</small></div></header>
    <div className="support-chat-layout"><section className="support-conversation" aria-label="Support conversation">
      <header><div className="support-avatar"><Headphones/></div><div><strong>EMBODY Customer Care</strong><span><LockKeyhole/> Secure account conversation</span></div><span className={`support-status support-status--${data?.conversation?.status?.toLowerCase()||'new'}`}>{data?.conversation?.status==='CLOSED'?'Resolved':'Open'}</span></header>
      <div className="message-stream" aria-live="polite">{loading?<ChatSkeleton/>:data?.messages?.length?data.messages.map(message=><Message key={message.id} message={message}/>):<div className="chat-empty"><MessageCircleMore/><h2>How can we help?</h2><p>Send your first message and a member of the admin support team can reply from the secure operations panel.</p></div>}<div ref={endRef}/></div>
      <form className="chat-composer" onSubmit={send}><label htmlFor="support-message">Message</label><textarea id="support-message" value={body} onChange={event=>setBody(event.target.value.slice(0,2000))} rows="3" placeholder="Write your message here…" disabled={sending}/><div><small>{body.length}/2000</small><button className="btn btn-primary" disabled={!body.trim()||sending}>{sending?'Sending…':<>Send message <Send/></>}</button></div>{error&&<p className="chat-error" role="alert">{error}</p>}</form>
    </section><aside className="support-chat-aside"><section><ShieldCheck/><h2>Your privacy matters</h2><p>Only authenticated staff with support permissions can open this conversation. Email alerts never include your message text.</p></section><section><Clock3/><h2>Not for urgent care</h2><p>This inbox is not monitored continuously. Do not send emergency or time-sensitive medical information. Call 911 for an emergency.</p></section><section><CheckCheck/><h2>Clear message history</h2><p>Your complete conversation stays together so you can return and read the team’s response from this page.</p></section></aside></div>
  </div>;
}

function Message({message}){const mine=message.senderType==='CUSTOMER';return <article className={`chat-message ${mine?'chat-message--mine':'chat-message--team'}`}><div>{message.body}</div><footer><span>{mine?'You':'EMBODY Support'}</span><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>{mine&&message.readAt&&<CheckCheck aria-label="Read"/>}</footer></article>}
function formatTime(value){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value))}
function ChatSkeleton(){return <div className="chat-loading"><span/><span/><span/></div>}

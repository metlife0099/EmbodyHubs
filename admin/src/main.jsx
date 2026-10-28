import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{BrowserRouter,NavLink,Navigate,Route,Routes,useLocation}from'react-router-dom';
import{Bell,BookOpen,Box,ChevronDown,CircleHelp,FileHeart,Handshake,Headphones,LayoutDashboard,LockKeyhole,LogOut,Mail,Menu,Package,PanelLeftClose,Route as RouteIcon,Scale,Search,Settings,ShieldCheck,ShoppingBag,SlidersHorizontal,Stethoscope,TriangleAlert,Truck,Users,X}from'lucide-react';
import'./styles.css';
import{AdminAuthProvider,useAdminAuth}from'./AdminAuth';
import AdminLogin from'./AdminLogin';
import ProductManager from'./ProductManager';
import ProductForm from'./ProductForm';
import QuestionManager from'./QuestionManager';
import Orders from'./Orders';
import Customers from'./Customers';
import CampaignCenter from'./CampaignCenter';
import Inventory from'./Inventory';
import Shipping from'./Shipping';
import ChatInbox from'./ChatInbox';
import HealthcareProfessionals from'./HealthcareProfessionals';
import CompareManager from'./CompareManager';
import Partnerships from'./Partnerships';
import HealthInfoManager from'./HealthInfoManager';
import ControlCenter from'./ControlCenter';
import PrescriptionOversight from'./PrescriptionOversight';
import PrivacyOperations from'./PrivacyOperations';
import PartnerRouting from'./PartnerRouting';
import JourneyOperations from'./JourneyOperations';
import'./refinement.css';
import{adminApi}from'./api';

const items=[['Overview','/',LayoutDashboard],['Journey operations','/journey-operations',TriangleAlert],['Control center','/control-center',SlidersHorizontal],['Prescription oversight','/prescriptions',FileHeart],['Partner routing','/partner-routing',RouteIcon],['Privacy requests','/privacy',LockKeyhole],['Orders','/orders',ShoppingBag],['Products & questionnaires','/products',Box],['Health information','/health-info',BookOpen],['Compare content','/compare',Scale],['Global questions','/questions',CircleHelp],['Inventory','/inventory',Package],['Shipping','/shipping',Truck],['Customers','/customers',Users],['Partnerships','/partnerships',Handshake],['Healthcare professionals','/professionals',Stethoscope],['Newsletter','/newsletter',Mail],['Support','/support',Headphones],['Settings','/settings',Settings]];

function Overview(){
  const[data,setData]=useState(null);const[error,setError]=useState('');
  useEffect(()=>{adminApi.metrics().then(result=>setData(result.data)).catch(err=>setError(err.message))},[]);
  if(error)return <div className="demo-banner">{error}</div>;
  const metrics=[['Total orders',data?.orders??'—'],['Customers',data?.customers??'—'],['Published products',data?.products??'—'],['Processed order value',data?`$${(data.revenueCents/100).toLocaleString('en-US',{minimumFractionDigits:2})}`:'—']];
  return <><section className="metric-grid">{metrics.map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong><small>Live API data</small></article>)}</section><div className="dash-grid"><section className="panel action-panel"><header><span>Commerce controls</span><h2>Manage the experience</h2></header><NavLink to="/products"><span>Products and add-to-cart questions</span><b>→</b></NavLink><NavLink to="/orders"><span>Paid orders and customer answers</span><b>→</b></NavLink><NavLink to="/customers"><span>Customer profiles and signup answers</span><b>→</b></NavLink><NavLink to="/questions"><span>Reusable global questions</span><b>→</b></NavLink></section><section className="panel action-panel"><header><span>Security posture</span><h2>Protected operations</h2></header>{['Fixed 24-hour admin sessions','Server-side role checks','CSRF-protected changes','Login lockout enforcement'].map(label=><div className="security-row" key={label}><ShieldCheck/>{label}</div>)}</section></div></>;
}

class AdminModuleBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return{error}}
  componentDidCatch(error,details){console.error('Admin module failed safely',error,details)}
  render(){
    if(this.state.error)return <section className="panel section-page"><div className="empty"><TriangleAlert/><h3>This module could not be opened</h3><p>{this.state.error.message||'An unexpected error occurred while loading this page.'}</p><button type="button" onClick={()=>this.setState({error:null})}>Try again</button></div></section>;
    return this.props.children;
  }
}

function Placeholder({title}){
  let content;
  if(title==='Journey operations')content=<JourneyOperations/>;
  else if(title==='Newsletter')content=<CampaignCenter/>;
  else if(title==='Control center')content=<ControlCenter/>;
  else if(title==='Prescription oversight')content=<PrescriptionOversight/>;
  else if(title==='Partner routing')content=<PartnerRouting/>;
  else if(title==='Privacy requests')content=<PrivacyOperations/>;
  else content=<section className="panel section-page"><header><div><span>Operations</span><h2>{title}</h2><p>This module remains permission-gated and ready for its approved provider integration.</p></div></header><div className="empty"><ShieldCheck/><h3>Secure module boundary</h3><p>No unverified production data or provider behavior is simulated here.</p></div></section>;
  return <AdminModuleBoundary key={title}>{content}</AdminModuleBoundary>;
}

function Dashboard(){
  const[side,setSide]=useState(()=>window.innerWidth>900);const[unread,setUnread]=useState(0);const{user,logout}=useAdminAuth();const location=useLocation();const title=location.pathname.startsWith('/products')?'Products & questionnaires':items.find(([,path])=>path===location.pathname)?.[0]||'Operations';
  useEffect(()=>{const refresh=()=>adminApi.chatSummary().then(result=>setUnread(result.data.unreadMessages||0)).catch(()=>{});refresh();const timer=window.setInterval(refresh,30000);return()=>window.clearInterval(timer)},[]);
  const routed=['/','/orders','/products','/health-info','/compare','/questions','/inventory','/shipping','/customers','/partnerships','/professionals','/support'];
  return <div className={`app ${side?'':'collapsed'}`}>
    <aside><div className="admin-brand"><b>E</b><span><strong>EMBODY</strong><small>OPERATIONS</small></span><button onClick={()=>setSide(false)} aria-label="Collapse sidebar"><PanelLeftClose/></button></div><nav>{items.map(([label,path,Icon])=><NavLink end={path==='/'} to={path} key={path} title={label} onClick={()=>{if(window.innerWidth<=900)setSide(false)}}><Icon/><span>{label}</span>{path==='/support'&&unread>0&&<i>{unread>99?'99+':unread}</i>}</NavLink>)}</nav><div className="user"><span>{user.firstName?.[0]}{user.lastName?.[0]}</span><div><b>{user.firstName} {user.lastName}</b><small>{user.role.replaceAll('_',' ')}</small></div><button onClick={logout} aria-label="Sign out"><LogOut/></button></div></aside>
    <main><header className="topbar"><button className="menu" onClick={()=>setSide(!side)} aria-label="Toggle sidebar">{side?<X/>:<Menu/>}</button><div className="search"><Search/><input placeholder="Search orders, customers, products…" aria-label="Global search"/></div><NavLink className="notification" to="/support" aria-label={`${unread} unread support messages`}><Bell/>{unread>0&&<i>{unread>9?'9+':unread}</i>}</NavLink><span className="environment">SECURE</span></header><div className="content"><header className="page-title"><div><span>Authenticated operations</span><h1>{title}</h1></div><button className="date">Live workspace <ChevronDown/></button></header><Routes><Route path="/" element={<Overview/>}/><Route path="/orders" element={<Orders/>}/><Route path="/products" element={<ProductManager/>}/><Route path="/products/new" element={<ProductForm/>}/><Route path="/products/:id/edit" element={<ProductForm/>}/><Route path="/health-info" element={<HealthInfoManager/>}/><Route path="/compare" element={<CompareManager/>}/><Route path="/questions" element={<QuestionManager/>}/><Route path="/inventory" element={<Inventory/>}/><Route path="/shipping" element={<Shipping/>}/><Route path="/customers" element={<Customers/>}/><Route path="/partnerships" element={<Partnerships/>}/><Route path="/professionals" element={<HealthcareProfessionals/>}/><Route path="/support" element={<ChatInbox onUnreadChange={setUnread}/>}/>{items.filter(([,path])=>!routed.includes(path)).map(([label,path])=><Route key={path} path={path} element={<Placeholder title={label}/>}/>) }<Route path="*" element={<Navigate replace to="/"/>}/></Routes></div></main>
  </div>;
}
function Gate(){const{user,checking}=useAdminAuth();if(checking)return <div className="admin-auth-loading"><ShieldCheck/><p>Verifying secure session…</p></div>;return user?<Dashboard/>:<AdminLogin/>}
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter basename="/admin"><AdminAuthProvider><Gate/></AdminAuthProvider></BrowserRouter></React.StrictMode>);

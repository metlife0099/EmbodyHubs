import { Bookmark,BookmarkCheck } from 'lucide-react';
import { useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function SaveToHubButton({type,sourceId,title,url,summary='',className=''}){
  const{user,setNotice}=useApp();const navigate=useNavigate();const location=useLocation();const[saved,setSaved]=useState(false);const[busy,setBusy]=useState(false);
  const save=async()=>{if(!user){setNotice({type:'error',message:'Sign in to save this item to My Health Hub.'});navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`);return}setBusy(true);try{const result=await api.saveToHealthHub({type,sourceId:String(sourceId),title,url,summary});setSaved(true);setNotice({type:'success',message:result.message})}catch(error){setNotice({type:'error',message:error.message})}finally{setBusy(false)}};
  return <button type="button" className={`save-to-hub ${saved?'is-saved':''} ${className}`.trim()} onClick={save} disabled={busy||saved} aria-pressed={saved}>{saved?<BookmarkCheck/>:<Bookmark/>}{busy?'Saving…':saved?'Saved to My Health Hub':'Save to My Health Hub'}</button>
}

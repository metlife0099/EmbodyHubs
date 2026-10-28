import { Compass } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function StartJourneyButton({type,title,sourceType,sourceId}){
  const{user,setNotice}=useApp();const[busy,setBusy]=useState(false);const[added,setAdded]=useState(false);const start=async()=>{setBusy(true);try{const payload={type,title,sourceType,sourceId:String(sourceId)};const result=user?await api.createHealthHubJourney(payload):await api.createGuestJourney(payload);setAdded(true);setNotice({type:'success',message:result.message})}catch(error){setNotice({type:'error',message:error.message})}finally{setBusy(false)}};
  return <button type="button" className={`start-hub-journey ${added?'is-added':''}`} onClick={start} disabled={busy||added}><Compass/>{busy?'Starting…':added?'Added to My Journey':'Start a journey'}</button>
}

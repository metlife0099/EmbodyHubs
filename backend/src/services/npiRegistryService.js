import { env } from '../config/env.js';

export function isValidNpi(value){
  const npi=String(value||'').trim();
  if(!/^\d{10}$/.test(npi))return false;
  const payload=`80840${npi.slice(0,9)}`;
  let sum=0;let double=true;
  for(let index=payload.length-1;index>=0;index-=1){
    let digit=Number(payload[index]);
    if(double){digit*=2;if(digit>9)digit-=9}
    sum+=digit;double=!double;
  }
  return (10-(sum%10))%10===Number(npi[9]);
}

export async function lookupNpi(npi){
  const checkedAt=new Date();
  if(!env.NPPES_LOOKUP_ENABLED)return{checkedAt,outcome:'DISABLED',found:false,errorCode:'LOOKUP_DISABLED'};
  try{
    const url=new URL(env.NPPES_API_URL);
    url.searchParams.set('version','2.1');
    url.searchParams.set('number',npi);
    const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw new Error(`NPPES_${response.status}`);
    const body=await response.json();
    const record=Array.isArray(body.results)?body.results[0]:null;
    if(!record)return{checkedAt,outcome:'NOT_FOUND',found:false};
    const basic=record.basic||{};
    const taxonomy=(record.taxonomies||[]).find(item=>item.primary)||(record.taxonomies||[])[0]||{};
    const address=(record.addresses||[]).find(item=>item.address_purpose==='LOCATION')||(record.addresses||[])[0]||{};
    const providerName=record.enumeration_type==='NPI-1'
      ?[basic.first_name,basic.middle_name,basic.last_name,basic.credential].filter(Boolean).join(' ')
      :basic.organization_name;
    return{checkedAt,outcome:'MATCHED',found:true,enumerationType:record.enumeration_type,providerName:String(providerName||'').slice(0,180),taxonomyDescription:String(taxonomy.desc||'').slice(0,180),practiceState:String(address.state||'').slice(0,2),registryLastUpdated:String(basic.last_updated||'').slice(0,20)};
  }catch(error){
    return{checkedAt,outcome:'UNAVAILABLE',found:false,errorCode:error?.name==='TimeoutError'?'REGISTRY_TIMEOUT':'REGISTRY_UNAVAILABLE'};
  }
}

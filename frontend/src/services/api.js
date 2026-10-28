const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';
let authGeneration=0;
let refreshPromise=null;
export const authSessionBarrier={current:()=>authGeneration,invalidate:()=>{authGeneration+=1}};

async function refreshSession(){
  if(!refreshPromise){
    const execute=()=>fetch(`${API}/auth/refresh`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','X-Client':'storefront',...csrfHeaders()}})
      .then(async response=>({response,data:await response.json().catch(()=>({success:false,message:'Unexpected server response.'}))}));
    const coordinated=typeof navigator!=='undefined'&&navigator.locks?.request?navigator.locks.request('embody-storefront-session-refresh',execute):execute();
    refreshPromise=coordinated.finally(()=>{refreshPromise=null});
  }
  return refreshPromise;
}

async function request(path, options = {}, mayRefresh = true) {
  const generation=authGeneration;
  const { headers = {}, ...rest } = options;
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...rest,
    headers: { 'Content-Type': 'application/json', 'X-Client': 'storefront', ...headers }
  });
  if(response.status===401&&mayRefresh&&!path.startsWith('/auth/')){
    const refreshed=await refreshSession().catch(()=>null);
    if(refreshed?.response.ok)return request(path,options,false);
  }
  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected server response.' }));
  if(generation!==authGeneration)throw new Error('This response belongs to a previous account session and was discarded.');
  if(response.status===401&&!path.startsWith('/auth/'))window.dispatchEvent(new CustomEvent('embody:auth-expired'));
  if (!response.ok) { const detail=Object.values(data.errors||{}).flat().find(Boolean); throw new Error(detail||data.message||'Request failed. Please try again.'); }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  resendOtp: (payload) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  refresh: async() => {const refreshed=await refreshSession();if(!refreshed.response.ok)throw new Error(refreshed.data.message||'Session expired. Please sign in again.');return refreshed.data},
  logout: async() => {await refreshSession().catch(()=>null);return request('/auth/logout',{method:'POST',headers:csrfHeaders()},false)},
  account: () => request('/account'),
  accountOrders: (page=1,limit=10) => request(`/account/orders?page=${page}&limit=${limit}`),
  updateProfile: (payload) => request('/account/profile', { method: 'PATCH', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  updatePreferences: (payload) => request('/account/preferences', { method: 'PATCH', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  changePassword: (payload) => request('/account/password', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  revokeOtherSessions: () => request('/account/sessions/revoke-others', { method: 'POST', headers: csrfHeaders() }),
  healthHubDashboard: () => request('/health-hub/dashboard'),
  healthHubJourneys: () => request('/health-hub/journeys'),
  createHealthHubJourney: payload => request('/health-hub/journeys',{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)}),
  updateHealthHubJourney: (journeyId,payload) => request(`/health-hub/journeys/${encodeURIComponent(journeyId)}`,{method:'PATCH',headers:csrfHeaders(),body:JSON.stringify(payload)}),
  removeHealthHubJourney: journeyId => request(`/health-hub/journeys/${encodeURIComponent(journeyId)}`,{method:'DELETE',headers:csrfHeaders()}),
  createGuestJourney: payload => request('/health-hub/guest/journeys',{method:'POST',body:JSON.stringify(payload)}),
  migrateGuestJourneys: () => request('/health-hub/journeys/migrate-guest',{method:'POST',headers:csrfHeaders()}),
  healthHubSaved: () => request('/health-hub/saved'),
  saveToHealthHub: payload => request('/health-hub/saved',{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)}),
  removeHealthHubSaved: savedId => request(`/health-hub/saved/${encodeURIComponent(savedId)}`,{method:'DELETE',headers:csrfHeaders()}),
  healthHubPreferences: () => request('/health-hub/preferences'),
  updateHealthHubPreferences: payload => request('/health-hub/preferences',{method:'PATCH',headers:csrfHeaders(),body:JSON.stringify(payload)}),
  healthHubLifecycle: () => request('/health-hub/data-lifecycle'),
  askEmbody: payload => request('/health-hub/assistant',{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)}),
  assistantMemory: () => request('/health-hub/assistant/memory'),
  deleteAssistantMemory: () => request('/health-hub/assistant/memory',{method:'DELETE',headers:csrfHeaders()}),
  products: (query = '') => request(`/products${query}`),
  productCategories: () => request('/products/categories'),
  comparisons: () => request('/comparisons'),
  healthInfo: () => request('/health-info'),
  healthInfoNavigation: () => request('/health-info/navigation'),
  healthInfoArticle: slug => request(`/health-info/${encodeURIComponent(slug)}`),
  cartQuestions: (productSlug) => request(`/questions/cart?productSlug=${encodeURIComponent(productSlug)}`),
  submitCartAnswers: (payload) => request('/questions/cart/responses', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  checkout: (payload,idempotencyKey) => request('/checkout', { method: 'POST', headers: { ...csrfHeaders(),'Idempotency-Key': idempotencyKey }, body: JSON.stringify(payload) }),
  priceQuote: payload => request('/pricing/quote',{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)}),
  contact: (payload) => request('/support', { method: 'POST', body: JSON.stringify(payload) }),
  trackShipment: (number) => request(`/shipping/tracking/${encodeURIComponent(number)}`),
  subscribeNewsletter: (payload) => request('/newsletter/subscribe', { method: 'POST', body: JSON.stringify(payload) }),
  chat: () => request('/chat'),
  sendChatMessage: (payload) => request('/chat/messages', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  markChatRead: () => request('/chat/read', { method: 'POST', headers: csrfHeaders() })
  ,professionalApplication: () => request('/professionals/me')
  ,submitProfessionalApplication: (payload) => request('/professionals/applications', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify(payload) })
  ,partnershipApplication:()=>request('/partnerships/me')
  ,partnerPortal:()=>request('/partnerships/portal')
  ,submitPartnershipApplication:payload=>request('/partnerships/applications',{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)})
  ,verifyPartnershipEmail:token=>request(`/partnerships/verify-email?token=${encodeURIComponent(token)}`)
  ,uploadPartnershipDocument:(id,file,documentType)=>request(`/partnerships/applications/${id}/documents`,{method:'POST',headers:{...csrfHeaders(),'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name),'X-Document-Type':documentType},body:file})
  ,prescriptionReadiness:(state,controlled=false)=>request(`/prescriptions/readiness?state=${encodeURIComponent(state)}&controlled=${controlled}`)
  ,prescriptions:()=>request('/prescriptions/me')
  ,submitPrescription:({file,state,type,controlled,productSlugs=[]})=>request('/prescriptions',{method:'POST',headers:{...csrfHeaders(),'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name),'X-Customer-State':state,'X-Prescription-Type':type,'X-Controlled-Substance':String(controlled),'X-Prescription-Consent':'true','X-Product-Slugs':productSlugs.join(',')},body:file})
  ,cancelPrescription:id=>request(`/prescriptions/${id}/cancel`,{method:'POST',headers:csrfHeaders()})
  ,respondPrescriptionClarification:(id,clarificationId,response)=>request(`/prescriptions/${id}/clarifications/${clarificationId}/respond`,{method:'POST',headers:csrfHeaders(),body:JSON.stringify({response})})
  ,privacyRequests:()=>request('/privacy/me')
  ,createPrivacyRequest:payload=>request('/privacy',{method:'POST',headers:csrfHeaders(),body:JSON.stringify({...payload,confirmation:'I UNDERSTAND'})})
  ,cancelPrivacyRequest:id=>request(`/privacy/${id}/cancel`,{method:'POST',headers:csrfHeaders()})
  ,supportCases:()=>request('/support-cases')
  ,supportCase:id=>request(`/support-cases/${id}`)
  ,createSupportCase:payload=>request('/support-cases',{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)})
  ,replySupportCase:(id,message)=>request(`/support-cases/${id}/messages`,{method:'POST',headers:csrfHeaders(),body:JSON.stringify({message})})
  ,membershipPlans:()=>request('/memberships/plans')
  ,membership:()=>request('/memberships/me')
  ,enrollMembership:payload=>request('/memberships/enroll',{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)})
  ,cancelMembership:()=>request('/memberships/cancel',{method:'POST',headers:csrfHeaders()})
  ,familyProfiles:()=>request('/family')
  ,inviteFamilyProfile:payload=>request('/family',{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)})
  ,acceptFamilyInvitation:(id,acceptedHealthScopes)=>request(`/family/${id}/accept`,{method:'POST',headers:csrfHeaders(),body:JSON.stringify({acceptedHealthScopes})})
  ,revokeFamilyProfile:id=>request(`/family/${id}/revoke`,{method:'POST',headers:csrfHeaders()})
  ,partnerPrescriptions:()=>request('/partnerships/portal/prescriptions')
  ,acknowledgePartnerPrescription:id=>request(`/partnerships/portal/prescriptions/${id}/acknowledge`,{method:'POST',headers:csrfHeaders()})
  ,startPartnerPrescriptionReview:id=>request(`/partnerships/portal/prescriptions/${id}/start-review`,{method:'POST',headers:csrfHeaders()})
  ,recordPartnerPrescriptionDecision:(id,payload)=>request(`/partnerships/portal/prescriptions/${id}/decision`,{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)})
  ,downloadPartnerPrescription:async id=>{const response=await fetch(`${API}/partnerships/portal/prescriptions/${id}/document`,{credentials:'include',headers:{'X-Client':'storefront','X-Access-Purpose':'professional-review'}});if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.message||'Secure document download failed.')}const disposition=response.headers.get('content-disposition')||'';return{name:disposition.match(/filename="([^"]+)"/)?.[1]||'prescription-document',blob:await response.blob()}}
};
function csrfHeaders(){const cookies=document.cookie.split('; ');const token=(cookies.find(v=>v.startsWith('storeCsrfToken='))||cookies.find(v=>v.startsWith('csrfToken=')))?.split('=')[1];return token?{'X-CSRF-Token':decodeURIComponent(token)}:{}}

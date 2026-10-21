const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(path, options = {}, mayRefresh = true) {
  const { headers = {}, ...rest } = options;
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...rest,
    headers: { 'Content-Type': 'application/json', 'X-Client': 'storefront', ...headers }
  });
  if(response.status===401&&mayRefresh&&!path.startsWith('/auth/')){
    const refreshed=await fetch(`${API}/auth/refresh`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','X-Client':'storefront',...csrfHeaders()}}).catch(()=>null);
    if(refreshed?.ok)return request(path,options,false);
  }
  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected server response.' }));
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
  refresh: () => request('/auth/refresh', { method: 'POST', headers: csrfHeaders() }),
  logout: () => request('/auth/logout', { method: 'POST', headers: csrfHeaders() }),
  account: () => request('/account'),
  accountOrders: (page=1,limit=10) => request(`/account/orders?page=${page}&limit=${limit}`),
  updateProfile: (payload) => request('/account/profile', { method: 'PATCH', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  updatePreferences: (payload) => request('/account/preferences', { method: 'PATCH', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  changePassword: (payload) => request('/account/password', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  revokeOtherSessions: () => request('/account/sessions/revoke-others', { method: 'POST', headers: csrfHeaders() }),
  products: (query = '') => request(`/products${query}`),
  productCategories: () => request('/products/categories'),
  cartQuestions: (productSlug) => request(`/questions/cart?productSlug=${encodeURIComponent(productSlug)}`),
  submitCartAnswers: (payload) => request('/questions/cart/responses', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  checkout: (payload,idempotencyKey) => request('/checkout', { method: 'POST', headers: { ...csrfHeaders(),'Idempotency-Key': idempotencyKey }, body: JSON.stringify(payload) }),
  contact: (payload) => request('/support', { method: 'POST', body: JSON.stringify(payload) }),
  trackShipment: (number) => request(`/shipping/tracking/${encodeURIComponent(number)}`),
  subscribeNewsletter: (payload) => request('/newsletter/subscribe', { method: 'POST', body: JSON.stringify(payload) }),
  chat: () => request('/chat'),
  sendChatMessage: (payload) => request('/chat/messages', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  markChatRead: () => request('/chat/read', { method: 'POST', headers: csrfHeaders() })
  ,professionalApplication: () => request('/professionals/me')
  ,submitProfessionalApplication: (payload) => request('/professionals/applications', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify(payload) })
};
function csrfHeaders(){const cookies=document.cookie.split('; ');const token=(cookies.find(v=>v.startsWith('storeCsrfToken='))||cookies.find(v=>v.startsWith('csrfToken=')))?.split('=')[1];return token?{'X-CSRF-Token':decodeURIComponent(token)}:{}}

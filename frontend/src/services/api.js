const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(path, options = {}) {
  const { headers = {}, ...rest } = options;
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...rest,
    headers: { 'Content-Type': 'application/json', 'X-Client': 'storefront', ...headers }
  });
  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected server response.' }));
  if (!response.ok) throw new Error(data.message || 'Request failed. Please try again.');
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
  products: (query = '') => request(`/products${query}`),
  cartQuestions: (productSlug) => request(`/questions/cart?productSlug=${encodeURIComponent(productSlug)}`),
  submitCartAnswers: (payload) => request('/questions/cart/responses', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify(payload) }),
  checkout: (payload,idempotencyKey) => request('/checkout', { method: 'POST', headers: { ...csrfHeaders(),'Idempotency-Key': idempotencyKey }, body: JSON.stringify(payload) }),
  contact: (payload) => request('/support', { method: 'POST', body: JSON.stringify(payload) })
};
function csrfHeaders(){const token=document.cookie.split('; ').find(v=>v.startsWith('csrfToken='))?.split('=')[1];return token?{'X-CSRF-Token':decodeURIComponent(token)}:{}}

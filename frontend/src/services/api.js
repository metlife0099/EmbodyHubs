const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Client': 'storefront', ...options.headers },
    ...options
  });
  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected server response.' }));
  if (!response.ok) throw new Error(data.message || 'Request failed. Please try again.');
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  products: (query = '') => request(`/products${query}`),
  submitConsultation: (payload) => request('/consultations', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(payload) }),
  checkout: (payload) => request('/checkout', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(payload) }),
  contact: (payload) => request('/support', { method: 'POST', body: JSON.stringify(payload) })
};

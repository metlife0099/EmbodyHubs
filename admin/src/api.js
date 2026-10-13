const API=import.meta.env.VITE_API_BASE_URL||'/api/v1';
export class ApiError extends Error{constructor(message,status,code){super(message);this.status=status;this.code=code}}
async function request(path,options={}){const response=await fetch(`${API}${path}`,{credentials:'include',...options,headers:{'Content-Type':'application/json','X-Client':'admin',...(options.mutate?csrfHeaders():{}),...(options.headers||{})}});const data=await response.json().catch(()=>({message:'Unexpected server response.'}));if(!response.ok)throw new ApiError(data.message||'Request failed.',response.status,data.code);return data}
function csrfHeaders(){const token=document.cookie.split('; ').find(value=>value.startsWith('csrfToken='))?.split('=')[1];return token?{'X-CSRF-Token':decodeURIComponent(token)}:{}}
export const adminApi={
  login:payload=>request('/auth/admin/login',{method:'POST',body:JSON.stringify(payload)}),verifyOtp:payload=>request('/auth/verify-otp',{method:'POST',body:JSON.stringify(payload)}),refresh:()=>request('/auth/refresh',{method:'POST',mutate:true}),logout:()=>request('/auth/logout',{method:'POST',mutate:true}),
  metrics:()=>request('/admin/metrics'),orders:()=>request('/admin/orders'),order:id=>request(`/admin/orders/${id}`),products:()=>request('/products/admin/list'),createProduct:payload=>request('/products',{method:'POST',mutate:true,body:JSON.stringify(payload)}),updateProduct:(id,payload)=>request(`/products/${id}`,{method:'PUT',mutate:true,body:JSON.stringify(payload)}),
  mediaSignature:payload=>request('/media/signature',{method:'POST',mutate:true,body:JSON.stringify(payload)}),
  questions:()=>request('/questions/admin'),createQuestion:payload=>request('/questions/admin',{method:'POST',mutate:true,body:JSON.stringify(payload)}),updateQuestion:(id,payload)=>request(`/questions/admin/${id}`,{method:'PATCH',mutate:true,body:JSON.stringify(payload)})
};

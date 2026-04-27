import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

// Android emulator  → 10.0.2.2
// Real device (Expo Go) → your machine IP e.g. 192.168.1.5
// Web → localhost
const BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.153.72.219:5000/api';

const api = axios.create({ baseURL:BASE_URL, headers:{'Content-Type':'application/json'}, timeout:10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('retailpro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI      = { 
  login:(d)=>api.post('/auth/login',d), 
  register:(d)=>api.post('/auth/register',d),
  forgotPassword:(email)=>api.post('/auth/forgot-password',{email}),
  resetPassword:(token,password)=>api.post(`/auth/reset-password/${token}`,{password}),
  googleLogin:(idToken)=>api.post('/auth/google-login',{idToken})
};
export const salesAPI     = { summary:()=>api.get('/sales/summary'), graph:(p)=>api.get(`/sales/graph?period=${p}`) };
export const invoiceAPI   = { getAll:(p)=>api.get('/invoices',{params:p}), create:(d)=>api.post('/invoices',d), update:(id,d)=>api.put(`/invoices/${id}`,d), delete:(id)=>api.delete(`/invoices/${id}`) };
export const inventoryAPI = { getAll:(p)=>api.get('/inventory',{params:p}), create:(d)=>api.post('/inventory',d), update:(id,d)=>api.put(`/inventory/${id}`,d), delete:(id)=>api.delete(`/inventory/${id}`), lowStock:()=>api.get('/inventory/low-stock'), search:(q)=>api.get(`/inventory/search?q=${q}`) };
export const customerAPI  = { getAll:(p)=>api.get('/customers',{params:p}), create:(d)=>api.post('/customers',d), update:(id,d)=>api.put(`/customers/${id}`,d), pending:()=>api.get('/customers/pending'), settle:(id,amt)=>api.post(`/customers/${id}/settle`,{amount:amt}), search:(q)=>api.get(`/customers/search?q=${encodeURIComponent(q)}`) };
export const dealerAPI    = { getAll:(p)=>api.get('/dealers',{params:p}),   create:(d)=>api.post('/dealers',d),   update:(id,d)=>api.put(`/dealers/${id}`,d), delete:(id)=>api.delete(`/dealers/${id}`), pending:()=>api.get('/dealers/pending'),   settle:(id,amt)=>api.post(`/dealers/${id}/settle`,{amount:amt}) };
export default api;

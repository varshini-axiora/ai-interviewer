import api from './api';

export async function requestOtp(email) {
  const { data } = await api.post('/auth/request-otp', { email });
  return data;
}

export async function verifyOtp(email, otp) {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function signup(email, password, fullName) {
  const { data } = await api.post('/auth/signup', { email, password, fullName });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function logout() {
  localStorage.removeItem('auth_token');
}

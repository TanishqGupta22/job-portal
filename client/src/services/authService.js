import { post, get } from './api';

export async function register(payload) {
  return post('/auth/register', payload);
}


export async function login(credentials) {
  return post('/auth/login', credentials);
}

export async function refreshToken() {
  const res = await post('/auth/refresh-token', {});
  return res.accessToken;
}


export async function logout() {
  return post('/auth/logout', {});
}

export async function getCurrentUser() {
  const res = await get('/auth/me');
  return res.user;
}




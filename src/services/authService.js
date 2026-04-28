//frontend to handle user authentication and attaching token

import axios from 'axios';

const BASE = 'http://localhost:5000/api/auth';

// login function
export const login = async (email, password) => {
  const { data } = await axios.post(`${BASE}/login`, { email, password });

  // save token to localStorage for future authenticated requests
  // local storage is a react thing, stores the token for some time
  localStorage.setItem('wt_token', data.token);
  return data;
};

// register function
export const register = async (email, password) => {
  const { data } = await axios.post(`${BASE}/register`, { email, password });
  localStorage.setItem('wt_token', data.token);
  return data;
};
// logout function
// removes token from localStorage to log user out
export const logout = () => localStorage.removeItem('wt_token');
//
export const getToken = () => localStorage.getItem('wt_token');

const authService = { login, register, logout, getToken };
export default authService;

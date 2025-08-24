import axios from "axios";

// Base Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000", // backend base URL
  withCredentials: true, // send cookies (express-session)
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Generic API functions
export const get = async (url, params = {}) => {
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const post = async (url, data = {}) => {
  try {
    const response = await api.post(url, data);
    return response.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const put = async (url, data = {}) => {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const del = async (url, data = {}) => {
  try {
    const response = await api.delete(url, { data });
    return response.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export default api;

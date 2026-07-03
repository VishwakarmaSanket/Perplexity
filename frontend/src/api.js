import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  timeout: 10000,
});

if (import.meta.env.DEV) {
  console.log("API URL:", import.meta.env.VITE_API_URL);
}

export default api;

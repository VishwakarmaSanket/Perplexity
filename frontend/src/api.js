import axios from "axios";

// Use the Vite proxy in development and the configured API origin in production.
// The relative fallback also keeps local development working without a .env file.
const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  // Model responses can legitimately take longer during provider load. Keep
  // the in-page thinking state alive instead of aborting an otherwise valid
  // request too early.
  timeout: 120000,
});

if (import.meta.env.DEV) {
  console.log("API URL:", apiBaseUrl);
}

export default api;

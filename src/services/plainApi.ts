import axios from "axios";

const plainAxios = axios.create({
  baseURL: import.meta.env.VITE_EXEC_PROC,
});

// OPTIONAL: minimal interceptor if needed
plainAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authtoken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const plainUniversalService = async (payload) => {
  return plainAxios.post("/executeprocedure", payload);
};

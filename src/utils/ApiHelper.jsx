// ApiHelper.js
import axios from "axios";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// --------------------------------------------
// Create a single Axios instance
// --------------------------------------------
const api = axios.create({
  baseURL: "/", // You use full URLs in service, so root base URL is fine
});

// --------------------------------------------
// REQUEST INTERCEPTOR → Auto attach token
// --------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authtoken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------
// RESPONSE INTERCEPTOR → Auto logout on 401
// --------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("401 Unauthorized → Logging out user");

      localStorage.removeItem("authtoken");
      localStorage.removeItem("EmployeeDetails");

      window.location.href = "/authentication/sign-in"; // Force redirect
    }
    return Promise.reject(error);
  }
);

// --------------------------------------------
// HOOK: useApiHelper
// --------------------------------------------
export const useApiHelper = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const cancelTokenSource = useRef(null);

  // Cancels pending request
  const cancelRequest = () => {
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel("Request was cancelled");
      cancelTokenSource.current = null;
    }
  };

  // Main request handler
  const apiRequest = async (method, url, data = null, config = {}) => {
    setLoading(true);

    // Create a cancel token for this request
    cancelTokenSource.current = axios.CancelToken.source();

    try {
      const response = await api({
        method,
        url,
        data,
        cancelToken: cancelTokenSource.current.token,
        ...config,
      });

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request cancelled:", error.message);
        throw new Error("Request was cancelled");
      }

      if (error?.code === "ERR_NETWORK") {
        console.error("Network Error: Check your internet connection");
        // navigate("/connection-lost");
      }

      console.error(`API ${method.toUpperCase()} failed:`, error);
      throw error;
    } finally {
      setLoading(false);
      cancelTokenSource.current = null;
    }
  };

  // CRUD wrappers
  const get = (url, config) => apiRequest("get", url, null, config);
  const post = (url, data, config) => apiRequest("post", url, data, config);
  const put = (url, data, config) => apiRequest("put", url, data, config);
  const del = (url, config) => apiRequest("delete", url, null, config);

  return { get, post, put, del, loading, cancelRequest };
};

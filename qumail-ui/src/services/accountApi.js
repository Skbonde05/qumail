import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getToken = () => {
  return localStorage.getItem("qumail_token") || localStorage.getItem("token");
};

// Create axios instance with interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("[WARN] No token found in localStorage");
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`[OK] ${response.config.method.toUpperCase()} ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(`[ERROR] ${error.config?.method?.toUpperCase() || 'REQUEST'} ${error.config?.url || 'unknown'}:`, 
      error.response?.status, 
      error.response?.data?.message || error.message
    );
    return Promise.reject(error);
  }
);

// [PROFILE] GET PROFILE - Use /api/auth/profile
export const getProfile = async () => {
  try {
    console.log("[PAGE] Fetching profile from /api/auth/profile...");
    const res = await api.get("/api/auth/profile");
    console.log("[OK] Profile response:", res.data);
    return res.data.user;
  } catch (error) {
    console.error("[ERROR] Get profile error:", error);
    throw error;
  }
};

// [PROFILE] UPDATE PROFILE - Use PUT /api/auth/profile
export const updateProfile = async (data) => {
  try {
    console.log("[INFO] Updating profile via PUT /api/auth/profile...", data);
    const res = await api.put("/api/auth/profile", data);
    console.log("[OK] Profile updated:", res.data);
    return res.data;
  } catch (error) {
    console.error("[ERROR] Update profile error:", error);
    throw error;
  }
};

// [AUTH] CHANGE PASSWORD - Use /api/auth/change-password
export const changePassword = async (payload) => {
  try {
    console.log("[AUTH] Changing password via /api/auth/change-password...");
    const res = await api.post("/api/auth/change-password", payload);
    console.log("[OK] Password changed:", res.data);
    return res.data;
  } catch (error) {
    console.error("[ERROR] Change password error:", error);
    throw error;
  }
};

// [UPLOAD] UPLOAD AVATAR - Use /api/auth/upload-avatar
export const uploadAvatar = async (base64Avatar) => {
  try {
    console.log("[INFO] Uploading avatar to /api/auth/upload-avatar...");
    const res = await api.post("/api/auth/upload-avatar", {
      avatar: base64Avatar
    });
    console.log("[OK] Avatar upload response:", res.data);
    return res.data;
  } catch (error) {
    console.error("[ERROR] Avatar upload error:", error);
    throw error;
  }
};

export default api;
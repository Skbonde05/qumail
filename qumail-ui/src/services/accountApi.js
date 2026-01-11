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
    console.warn("⚠️ No token found in localStorage");
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase() || 'REQUEST'} ${error.config?.url || 'unknown'}:`, 
      error.response?.status, 
      error.response?.data?.message || error.message
    );
    return Promise.reject(error);
  }
);

// ✅ GET PROFILE - This endpoint exists in server.js
export const getProfile = async () => {
  try {
    console.log("📋 Fetching profile from /api/profile...");
    const res = await api.get("/api/profile");
    console.log("✅ Profile response:", res.data);
    return res.data.user;
  } catch (error) {
    console.error("❌ Get profile error:", error);
    throw error;
  }
};

// ✅ UPDATE PROFILE - Use PUT /api/profile instead of POST /api/profile/update
export const updateProfile = async (data) => {
  try {
    console.log("📝 Updating profile via PUT /api/profile...", data);
    const res = await api.put("/api/profile", data);
    console.log("✅ Profile updated:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Update profile error:", error);
    throw error;
  }
};

// ✅ CHANGE PASSWORD - Use /api/change-password instead of /api/profile/change-password
export const changePassword = async (payload) => {
  try {
    console.log("🔐 Changing password via /api/change-password...");
    const res = await api.post("/api/change-password", payload);
    console.log("✅ Password changed:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Change password error:", error);
    throw error;
  }
};

// ✅ UPLOAD AVATAR (Base64) - Use /api/upload-avatar instead of /api/profile/upload-avatar
export const uploadAvatar = async (base64Avatar) => {
  try {
    console.log("📤 Uploading avatar to /api/upload-avatar...");
    console.log("Base64 length:", base64Avatar?.length);
    
    const res = await api.post("/api/upload-avatar", {
      avatar: base64Avatar
    });

    console.log("✅ Avatar upload response:", res.data);
    
    return res.data;
  } catch (error) {
    console.error("❌ Avatar upload error:", error);
    throw error;
  }
};

export default api;
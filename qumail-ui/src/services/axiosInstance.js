import axios from "axios";

const instance = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");

      try {
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const res = await axios.post(
          `${apiUrl}/api/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem("token", res.data.accessToken);

        error.config.headers["Authorization"] =
          "Bearer " + res.data.accessToken;

        return axios(error.config);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
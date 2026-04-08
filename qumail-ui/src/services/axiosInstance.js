import axios from "axios";
import config from "../config";

const instance = axios.create({
  baseURL: config.apiUrl + "/api",
});

instance.interceptors.request.use((configReq) => {
  const token = localStorage.getItem("token");
  if (token) {
    configReq.headers.Authorization = `Bearer ${token}`;
  }
  return configReq;
});

instance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");

      try {
        const res = await axios.post(
          `${config.apiUrl}/api/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem("token", res.data.accessToken);

        error.config.headers["Authorization"] =
          "Bearer " + res.data.accessToken;

        return axios(error.config);
      } catch (err) {
        localStorage.clear();
        if (window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
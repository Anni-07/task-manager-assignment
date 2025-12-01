import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000",
  withCredentials: true, // needed for refresh cookie
});

// refresh token automatically
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // refresh → returns new access token
        const refreshRes = await api.post("/auth/refresh");

        const newToken = refreshRes.data.accessToken;

        if (newToken) {
          api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          original.headers["Authorization"] = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {}
    }

    return Promise.reject(error);
  }
);

export default api;

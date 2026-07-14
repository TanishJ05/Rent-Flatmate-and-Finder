import axios from "axios";

axios.defaults.withCredentials = true;

const axiosInstance = axios.create({
  baseURL: '/api', //|| "http://localhost:5001/api",
  withCredentials: true,
});

// We will add the 401 interceptor inside the AuthProvider to avoid circular dependencies
// since the interceptor needs to call `logout` or update AuthContext state.
// Alternatively, we can just intercept and trigger a custom event or redirect.
// Let's implement the interceptor here to trigger a custom event, which AuthContext can listen to.

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch a custom event to notify the application that a 401 occurred
      window.dispatchEvent(new Event("unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

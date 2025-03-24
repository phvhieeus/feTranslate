import axios from "axios";

export const authService = {
  login: async (username, password) => {
    try {
      const response = await axios.post("/auth/login", { username, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await axios.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    } catch (error) {
      console.error("Logout error:", error);
      // Xóa dữ liệu local ngay cả khi API gặp lỗi
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await axios.get("/auth/account");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

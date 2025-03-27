// services/authService.js
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

  updateProfile: async (userData) => {
    try {
      const response = await axios.put("/auth/update-profile", userData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

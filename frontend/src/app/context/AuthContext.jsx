"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loading3D from "../../components/Loading3D";
import { apiHelpers } from "@/lib/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      try {
        const cartResponse = await apiHelpers.cart.get();
        const cart = cartResponse?.data?.cart || cartResponse?.data || {};
        const items = Array.isArray(cart.items) ? cart.items : [];
        localStorage.setItem("cartItems", JSON.stringify(items));
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (error) {
        console.warn("Cart sync failed", error);
        localStorage.removeItem("cartItems");
        window.dispatchEvent(new Event("cartUpdated"));
      }

      return userData; // just return user data, redirect will happen in page
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  };

  const register = async (...args) => {
    let payload;
    let options = { autoLogin: true };

    if (args.length && typeof args[0] === "object" && args[0] !== null && !Array.isArray(args[0])) {
      payload = args[0];
      if (args[1] && typeof args[1] === "object") {
        options = { ...options, ...args[1] };
      }
    } else {
      const [name, email, password, role] = args;
      payload = { name, email, password, role };
    }

    const body = {
      name: payload?.name,
      email: payload?.email,
      password: payload?.password,
    };

    if (payload?.role) {
      body.role = payload.role;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/users/register", body);
      const { token, user: userData } = response.data?.data || {};
      const message = response.data?.message || "Account created successfully";

      if (!token || !userData) {
        throw { message: response.data?.message || "Registration failed" };
      }

      if (options.autoLogin) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      return { success: true, user: userData, message };
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" };
    }
  };

  const logout = async () => {
    try {
      await apiHelpers.auth.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
      router.push("/login");
    }
  };

  const isAuthenticated = () => !!user;
  const isLoggedIn = !!user;

  const value = { user, loading, login, register, logout, isAuthenticated, isLoggedIn };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loading3D /> : children}
    </AuthContext.Provider>
  );
};

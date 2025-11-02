"use client";
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  const [isFetching, setIsFetching] = useState(false);
  const router = useRouter();
  
  // Keep track of the last fetch time to prevent too frequent updates
  const lastFetchTime = useRef(0);
  const FETCH_COOLDOWN = 30000; // 30 seconds

  // Centralized function to fetch user data
  const fetchUserData = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime.current < 10000) { // 10 second cooldown
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token || isFetching) return;
    
    setIsFetching(true);
    lastFetchTime.current = now;
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const userData = response.data?.data || {};
      if (Object.keys(userData).length > 0) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching]);
  
  // Initial load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      
      // Fetch fresh data if it's been more than 5 minutes
      const lastUpdated = localStorage.getItem('userLastUpdated');
      if (!lastUpdated || (Date.now() - parseInt(lastUpdated, 10)) > 5 * 60 * 1000) {
        fetchUserData();
      }
    }
    setLoading(false);
    
    // Set up interval to refresh user data every 5 minutes
    const interval = setInterval(fetchUserData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUserData]);

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

  // Function to update user data
  const updateUser = (updates) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const isAuthenticated = useCallback(() => !!user, [user]);
  const isLoggedIn = !!user;
  
  const value = { 
    user, 
    loading, 
    login, 
    register, 
    logout, 
    isAuthenticated, 
    isLoggedIn, 
    updateUser,
    refreshUser: fetchUserData // Expose refresh function
  };
  
  // Memoize the context value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => value, [
    user, 
    loading, 
    login, 
    register, 
    logout, 
    isAuthenticated, 
    isLoggedIn, 
    updateUser,
    fetchUserData
  ]);

  return (
    <AuthContext.Provider value={memoizedValue}>
      {loading ? <Loading3D /> : children}
    </AuthContext.Provider>
  );
};

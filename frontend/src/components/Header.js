"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCart, Home, User, Book } from "lucide-react";
import { useAuth } from "../app/context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import "../styles/Header.css";
import { getToken } from "../app/utils/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

export default function Header() {
  const [searchFocus, setSearchFocus] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [role, setRole] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [localLogged, setLocalLogged] = useState(false);

  const { isLoggedIn, logout, user } = useAuth();
  const router = useRouter();
  const effectiveLoggedIn = !!isLoggedIn || !!localLogged;

  useEffect(() => {
    const syncAuth = () => {
      try {
        const token = typeof window !== "undefined" ? (getToken ? getToken() : localStorage.getItem("token")) : null;
        const storedUserRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        const parsedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
        const logged = !!(token && parsedUser);
        setLocalLogged(logged);

        if (logged) {
          setStudentName(parsedUser?.name || parsedUser?.username || parsedUser?.email || user?.name || "");
          setRole(parsedUser?.role || user?.role || "");
        } else {
          setStudentName("");
          setEnrolledCourses([]);
          setRole("");
        }
      } catch {
        setLocalLogged(false);
        setStudentName("");
        setRole("");
      }
    };

    syncAuth();

    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user" || e.key === null) syncAuth();
    };

    const onAuthChanged = () => syncAuth();

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChanged", onAuthChanged);

    let lastToken = getToken ? getToken() : localStorage.getItem("token");
    const pollId = setInterval(() => {
      const t = getToken ? getToken() : localStorage.getItem("token");
      if (t !== lastToken) {
        lastToken = t;
        syncAuth();
      }
    }, 300);
    const stopPoll = setTimeout(() => clearInterval(pollId), 3000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChanged", onAuthChanged);
      clearInterval(pollId);
      clearTimeout(stopPoll);
    };
  }, [user]);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (!effectiveLoggedIn) {
        setEnrolledCourses([]);
        return;
      }
      if (role && role !== "student") {
        setEnrolledCourses([]);
        return;
      }
      try {
        setCoursesLoading(true);
        const token = getToken ? getToken() : localStorage.getItem("token");
        if (!token) {
          setStudentName(user?.name || "Student");
          setEnrolledCourses([]);
          return;
        }

        try {
          const profileRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/student/profile`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setStudentName(profileRes.data.student?.name || user?.name || "Student");
        } catch {
          const stored = localStorage.getItem("user");
          const parsed = stored ? JSON.parse(stored) : null;
          setStudentName(parsed?.name || user?.name || "Student");
        }

        try {
          const coursesRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/student/my-courses`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const courses = coursesRes.data?.courses || [];
          setEnrolledCourses(Array.isArray(courses) ? courses : []);
        } catch {
          setEnrolledCourses([]);
        }
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchStudentInfo();
  }, [effectiveLoggedIn, role, user]);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const stored = localStorage.getItem("cartItems");
        if (stored) {
          const items = JSON.parse(stored);
          const total = Array.isArray(items)
            ? items.reduce((sum, item) => sum + (item.quantity || 1), 0)
            : 0;
          setCartCount(total);
        } else setCartCount(0);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }

    window.dispatchEvent(new Event("authChanged"));
    router.push("/login");
    setShowLogoutConfirm(false);
  };

  const effectiveRole = role || user?.role || "";
  let profilePath = "/student/profile";
  let dashboardPath = "/student/dashboard";

  if (effectiveRole === "admin") {
    profilePath = "/admin";
    dashboardPath = "/admine";
  } else if (effectiveRole === "instructor") {
    profilePath = "/instructor/profile";
    dashboardPath = "/instructor/dashboard";
  }

  return (
    <>
      <header className="bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 relative">
          {/* Logo & Home */}
          <div className="flex items-center space-x-3 z-50">
            <Link
              href="/"
              className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 hover:scale-105 transition-transform duration-300 drop-shadow-lg"
            >
              CodeShelf
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-orange-600 hover:bg-yellow-400 hover:text-black transition-all duration-300 shadow-md hover:shadow-lg"
              title="Home"
            >
              <Home className="w-4 h-4" fill="currentColor" />
            </Link>
          </div>

          {/* Search */}
          <div
            className={`hidden md:flex max-w-md w-full mx-6 transition-all duration-300 ${searchFocus ? "shadow-lg ring-2 ring-yellow-400 rounded-md" : ""}`}
          >
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-300"
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
            />
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4 z-50">
            {/* Courses */}
            {effectiveLoggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 text-white font-medium text-lg cursor-pointer hover:text-yellow-400">
                  <Book className="w-5 h-5" />
                  <span>Courses</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="dropdown-menu-custom">
                  <DropdownMenuItem
                    onClick={() => router.push("/student/my-courses")}
                    className="dropdown-item-custom font-bold text-orange-600"
                  >
                    View All Courses
                  </DropdownMenuItem>
                  {coursesLoading ? (
                    <DropdownMenuItem disabled>Loading courses...</DropdownMenuItem>
                  ) : Array.isArray(enrolledCourses) && enrolledCourses.length > 0 ? (
                    enrolledCourses.slice(0, 5).map((course) => (
                      <DropdownMenuItem
                        key={course._id || course.id || Math.random()}
                        onClick={() =>
                          router.push(`/student/courses/${course._id || course.id}`)
                        }
                      >
                        {course.title || course.name || "Untitled Course"}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled className="italic">
                      No enrolled courses
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className={`relative flex items-center justify-center ${cartCount > 0
                ? "w-8 h-8 rounded-full bg-white text-orange-600 hover:bg-yellow-400 hover:text-black shadow-md hover:shadow-lg"
                : "text-white hover:text-yellow-300"
                } transition-all duration-300`}
              title="Cart"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User */}
            {effectiveLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 bg-white text-orange-600 px-3 py-2 rounded-full shadow-md hover:bg-yellow-400 hover:text-black">
                  <User className="w-4 h-4" />
                  <span className="font-medium text-sm md:truncate md:max-w-[140px]">
                    Hi, {studentName || user?.name || "Student"}
                  </span>

                </DropdownMenuTrigger>

                <DropdownMenuContent className="dropdown-menu-custom">
                  <DropdownMenuItem onClick={() => router.push(profilePath)}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(dashboardPath)}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowLogoutConfirm(true)}
                    className="text-red-600 font-medium"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="bg-white text-orange-600 px-5 py-2 rounded-full border border-orange-600 hover:bg-yellow-400 hover:text-black shadow-md font-medium text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Logout Modal with background blur */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-[999]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Are you sure you want to logout?
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              You'll need to log in again to access your account.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 shadow-md hover:scale-105"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-md hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

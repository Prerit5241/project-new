"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { getUserRole, getToken, isTokenExpired, removeToken } from "@/utils/auth";
import { apiHelpers } from "@/lib/api";

const navigationItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/categories", label: "Categories", icon: "🗂️" },
  { href: "/admin/courses", label: "Courses", icon: "🎓" },
  { href: "/admin/products", label: "Products", icon: "🛒" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/coins", label: "Coins", icon: "🪙" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Role guard
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();

      // No token → redirect to login
      if (!token) {
        router.replace("/login");
        return;
      }

      // Expired token → clear + redirect
      if (isTokenExpired(token)) {
        removeToken();
        router.replace("/login");
        return;
      }

      // Role check
      const role = getUserRole();
      if (role === "admin") {
        setAuthorized(true);
      } else if (role === "student") {
        router.replace("/student");
      } else if (role === "instructor") {
        router.replace("/instructor");
      } else {
        router.replace("/login");
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationOpen(false);
  }, [pathname]);

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setNotificationOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-container")) {
        setNotificationOpen(false);
      }
      if (!e.target.closest(".mobile-menu-container")) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiHelpers.auth.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    }

    removeToken();
    router.push("/login");
    setShowLogoutConfirm(false);
  };

  const toggleMobileMenu = (e) => {
    e.stopPropagation();
    setMobileMenuOpen(!mobileMenuOpen);
    setNotificationOpen(false);
  };

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setNotificationOpen(!notificationOpen);
    setMobileMenuOpen(false);
  };

  const handleNavigation = (href) => {
    setMobileMenuOpen(false);
    setNotificationOpen(false);
    router.push(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-3xl shadow-2xl animate-fade-in">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 rounded-full animate-spin">
              <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Loading Admin Panel
            </h3>
            <p className="text-gray-600 animate-pulse">
              Please wait while we prepare your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const currentPage = navigationItems.find((item) => item.href === pathname);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex flex-col min-h-screen w-full">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Navigation */}
              <nav className="flex items-center space-x-1 flex-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover-scale whitespace-nowrap ${
                        isActive
                          ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white shadow-lg shadow-orange-500/25"
                          : "text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-blue-50 hover:text-gray-900"
                      }`}
                      type="button"
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="hidden lg:inline">{item.label}</span>
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Right Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Notifications */}
                <div className="relative dropdown-container">
                  <button
                    onClick={toggleNotifications}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 hover-scale"
                    type="button"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      3
                    </span>
                  </button>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-3 py-1 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition-all duration-200"
                    type="button"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-fade-in-up w-full">{children}</div>
          </div>
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Are you sure you want to logout?
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              You'll need to log in again to access your admin account.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-blue-500 text-white hover:from-orange-600 hover:to-blue-600 shadow-md hover:scale-105"
                type="button"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-md hover:scale-105"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

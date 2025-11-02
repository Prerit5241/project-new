"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { getUserRole, getToken, isTokenExpired, removeToken } from "@/utils/auth";
import { apiHelpers } from "@/lib/api";

const navigationItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/student/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/student/my-courses", label: "My Courses", icon: "📚" },
  { href: "/student/coin", label: "My Coins", icon: "🪙" },
  { href: "/student/certificates", label: "Certificates", icon: "🎓" },
  { href: "/student/profile", label: "Profile", icon: "👤" },
];

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      if (isTokenExpired(token)) {
        removeToken();
        router.replace("/login");
        return;
      }

      const role = getUserRole();
      if (role === "student") {
        setAuthorized(true);
      } else if (role === "admin") {
        router.replace("/admin");
      } else if (role === "instructor") {
        router.replace("/instructor");
      } else {
        router.replace("/login");
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationOpen(false);
  }, [pathname]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-3xl shadow-xl">
          <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500"></div>
          <p className="text-sm text-gray-600">Preparing your learning space...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const currentPage = navigationItems.find((item) => item.href === pathname);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex flex-col min-h-screen w-full">
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
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

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative dropdown-container">
                  <button
                    onClick={toggleNotifications}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 hover-scale"
                    type="button"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-500 to-blue-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      2
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-3 py-1 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition-all duration-200"
                    type="button"
                  >
                    Logout
                  </button>
                </div>

                <button
                  onClick={toggleMobileMenu}
                  className="lg:hidden text-gray-500 hover:text-gray-900 p-2 rounded-lg transition mobile-menu-container"
                  type="button"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm">
            <div className="px-4 py-3 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  type="button"
                >
                  {item.icon} <span className="ml-2">{item.label}</span>
                </button>
              ))}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition"
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-fade-in-up w-full">{children}</div>
          </div>
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 text-center animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Are you sure you want to logout?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              You'll need to log in again to access your account.
            </p>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                type="button"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2.5 rounded-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
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

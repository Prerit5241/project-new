"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  BookOpen,
  TrendingUp,
  Award,
  BarChart3,
  Play,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

export default function StudentDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    averageProgress: 0,
  });
  const [courses, setCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check auth & fetch data
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (user?.role !== "student") {
      router.push("/login");
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const statsRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/student/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const coursesRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/student/my-courses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mockActivity = [
        { description: "Enrolled in React Course", time: "2 hours ago" },
        { description: "Completed JavaScript Basics", time: "1 day ago" },
        { description: "Started Python Programming", time: "3 days ago" },
      ];

      setStats(statsRes.data.stats || {});
      setCourses(coursesRes.data.courses || []);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const navigation = [
    { name: "Dashboard", href: "/student/dashboard", icon: BarChart3, current: true },
    { name: "My Courses", href: "/student/my-courses", icon: BookOpen, current: false },
    { name: "Browse Courses", href: "/student/browse", icon: Play, current: false },
    { name: "Certificates", href: "/student/certificates", icon: Award, current: false },
    { name: "Profile", href: "/student/profile", icon: User, current: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">EduPlatform</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-4 mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 px-2">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? "bg-blue-50 border-r-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <IconComponent
                    className={`${
                      item.current
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    } mr-3 flex-shrink-0 h-5 w-5`}
                  />
                  {item.name}
                </a>
              );
            })}
          </div>

          <div className="absolute bottom-0 w-full p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Sign out
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome back, {user?.name}!</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Courses" value={stats.total || 0} icon={<BookOpen className="w-6 h-6 text-blue-600" />} bg="bg-blue-100" />
            <StatCard title="In Progress" value={stats.active || 0} icon={<TrendingUp className="w-6 h-6 text-green-600" />} bg="bg-green-100" />
            <StatCard title="Completed" value={stats.completed || 0} icon={<Award className="w-6 h-6 text-purple-600" />} bg="bg-purple-100" />
            <StatCard title="Avg Progress" value={`${stats.averageProgress || 0}%`} icon={<BarChart3 className="w-6 h-6 text-orange-600" />} bg="bg-orange-100" />
          </div>

          {/* Courses Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {courses.length === 0 ? (
              <div className="text-center py-8 col-span-full">
                <p className="text-gray-500">No courses enrolled yet</p>
              </div>
            ) : (
              courses.map((course, idx) => (
                <CourseCard key={course._id || idx} course={course} />
              ))
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500">No recent activity</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <li key={idx} className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ✅ Helper Components
const StatCard = ({ title, value, icon, bg }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center">
      <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const CourseCard = ({ course }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
    <p className="text-sm text-gray-500">{course.instructor?.name}</p>
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Progress</span>
        <span className="text-xs text-gray-900">{course.enrollment?.progress || 0}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${course.enrollment?.progress || 0}%` }}
        />
      </div>
    </div>
    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
      Continue
    </button>
  </div>
);

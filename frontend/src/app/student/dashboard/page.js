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
} from "lucide-react";
import toast from "react-hot-toast";

export default function StudentDashboard() {
  const { user, isAuthenticated } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                Welcome back, {user?.name || "student"}!
                <span className="inline-block ml-2 animate-bounce">👋</span>
              </h2>
              <p className="text-white/90 text-lg max-w-2xl">
                Here's what's happening with your platform today. Everything looks great!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="bg-white/20 hover:bg-white hover:text-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 hover:scale-105">
                Continue Learning
              </button>
              <button className="bg-white/20 hover:bg-white hover:text-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 hover:scale-105">
                View Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Courses" value={stats.total || 0} icon={<BookOpen className="w-6 h-6 text-blue-600" />} bg="bg-blue-100" />
        <StatCard title="In Progress" value={stats.active || 0} icon={<TrendingUp className="w-6 h-6 text-green-600" />} bg="bg-green-100" />
        <StatCard title="Completed" value={stats.completed || 0} icon={<Award className="w-6 h-6 text-purple-600" />} bg="bg-purple-100" />
        <StatCard title="Avg Progress" value={`${stats.averageProgress || 0}%`} icon={<BarChart3 className="w-6 h-6 text-orange-600" />} bg="bg-orange-100" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Your Courses</h3>
                <p className="text-sm text-gray-500">Keep the momentum going with your active learning.</p>
              </div>
              <button className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-500 hover:text-blue-600">
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.length === 0 ? (
                <div className="text-center py-10 col-span-full">
                  <p className="text-gray-500">No courses enrolled yet.</p>
                </div>
              ) : (
                courses.map((course, idx) => (
                  <CourseCard key={course._id || idx} course={course} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500">No recent activity.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl text-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Need a boost?</h3>
            <p className="text-sm text-white/80 mb-4">
              Explore curated resources and tips to stay on track with your learning goals.
            </p>
            <button className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-blue-600">
              Discover Resources
            </button>
          </div>
        </div>
      </section>
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

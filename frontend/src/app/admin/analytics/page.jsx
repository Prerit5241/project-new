"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { apiHelpers } from "@/lib/api";
import { formatDistanceToNow, parseISO } from "date-fns";

const METRIC_CARDS = [
  { key: "totalUsers", label: "Total Users", icon: "👥", color: "from-blue-500 to-indigo-500" },
  { key: "newUsers", label: "New Users (7d)", icon: "🆕", color: "from-green-500 to-emerald-500" },
  { key: "activeUsers", label: "Active Users", icon: "⚡", color: "from-purple-500 to-violet-500" },
  { key: "revenue", label: "Revenue", icon: "💰", color: "from-orange-500 to-amber-500", format: "currency" }
];

const ACTIVITY_TYPE_META = {
  user_login: { label: "User Login", color: "bg-blue-100 text-blue-700", icon: "🔓" },
  user_signup: { label: "New User", color: "bg-green-100 text-green-700", icon: "✨" },
  user_logout: { label: "User Logout", color: "bg-slate-100 text-slate-700", icon: "🔒" },
  profile_update: { label: "Profile Updated", color: "bg-amber-100 text-amber-700", icon: "✏️" },
  product_created: { label: "Product Created", color: "bg-emerald-100 text-emerald-700", icon: "📦" },
  product_updated: { label: "Product Updated", color: "bg-amber-100 text-amber-700", icon: "🔄" },
  course_enrollment: { label: "Course Enrollment", color: "bg-purple-100 text-purple-700", icon: "📚" },
  purchase: { label: "Purchase", color: "bg-pink-100 text-pink-700", icon: "💳" },
  CART_ADD_ITEM: { label: "Cart Item Added", color: "bg-blue-100 text-blue-700", icon: "🛒" },
  coin_update: { 
    label: "Coin Transaction", 
    color: "bg-yellow-100 text-yellow-700",
    icon: "💰",
    format: (activity) => {
      const action = activity.details?.action === 'add' ? 'Added' : 'Subtracted';
      const amount = Math.abs(activity.details?.amount || 0);
      return `${action} ${amount} coins`;
    }
  }
};

function MetricCard({ icon, label, value, change, subText, color, format }) {
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) return "--";
    if (typeof value === "number") {
      return format === "currency"
        ? `₹${value.toLocaleString("en-IN")}`
        : value.toLocaleString("en-IN");
    }
    return value;
  }, [value, format]);

  const changeLabel = useMemo(() => {
    if (change === null || change === undefined || change === "") return null;
    if (typeof change === "number") {
      const sign = change > 0 ? "+" : "";
      return `${sign}${change}% vs last period`;
    }
    return change;
  }, [change]);

  const changeColor = useMemo(() => {
    if (typeof change !== "number") return "text-gray-400";
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-gray-400";
  }, [change]);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-r ${color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-2xl shadow-lg`}>
            {icon}
          </div>
          {changeLabel && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${changeColor} bg-gray-50`}>
              {typeof change === "number" && (
                <svg className={`w-3 h-3 ${change > 0 ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {changeLabel}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-4xl font-bold text-gray-900">{formattedValue}</p>
          {subText && <p className="mt-2 text-xs text-gray-500 font-medium">{subText}</p>}
        </div>
      </div>
    </div>
  );
}

function normalizeMetricValue(raw) {
  if (raw === undefined || raw === null) {
    return { value: null, change: null };
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const { total, value, change, label } = raw;
    return {
      value: total ?? value ?? label ?? "--",
      change: change ?? null,
    };
  }

  return { value: raw, change: null };
}

function ActivityRow({ activity }) {
  const meta = ACTIVITY_TYPE_META[activity.type] || { label: activity.type, color: "bg-gray-100 text-gray-700", icon: "📋" };
  const messageText = useMemo(() => {
    if (activity.type === "profile_update" && activity.details) {
      const changes = Array.isArray(activity.details.changes) ? activity.details.changes : [];

      if (changes.length === 1) {
        const change = changes[0];
        const previousDisplay = change?.previous || "—";
        const currentDisplay = change?.current || "—";
        const fieldLabel = (change?.field || "Field").replace(/_/g, " ");
        return `${fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1)} updated: "${previousDisplay}" → "${currentDisplay}"`;
      }

      if (changes.length > 1) {
        const summaries = changes.map((change) => {
          const fieldLabel = (change?.field || "Field").replace(/_/g, " ");
          const previousDisplay = change?.previous || "—";
          const currentDisplay = change?.current || "—";
          return `${fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1)}: "${previousDisplay}" → "${currentDisplay}"`;
        });
        return `Profile updated • ${summaries.join(" • ")}`;
      }
    }

    return activity.message;
  }, [activity]);

  const detailText = useMemo(() => {
    const details = activity.details;
    if (!details) return null;

    if (typeof details === "string") {
      return details;
    }

    if (Array.isArray(details)) {
      return details.join(" • ");
    }

    if (typeof details === "object") {
      if (Array.isArray(details.changes) && details.changes.length) {
        return details.changes
          .map((change) => {
            const fieldLabel = (change.field || "Field").replace(/_/g, " ");
            const previous = change.previous || "—";
            const current = change.current || "—";
            return `${fieldLabel}: ${previous} → ${current}`;
          })
          .join(" • ");
      }

      if (details.metadata) {
        try {
          return JSON.stringify(details.metadata);
        } catch {
          return String(details.metadata);
        }
      }

      if (details.email) {
        return `Email: ${details.email}`;
      }

      try {
        return JSON.stringify(details);
      } catch {
        return String(details);
      }
    }

    return null;
  }, [activity.details]);

  return (
    <div className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-blue-200 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.color} text-2xl shadow-sm`}>
            {meta.icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${meta.color}`}>
              {meta.label}
            </span>
            {activity.value && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                {activity.value}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">{messageText}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {activity.userName && (
              <span className="font-medium">{activity.userName}</span>
            )}
            {activity.userRole && (
              <>
                <span>•</span>
                <span className="capitalize">{activity.userRole}</span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {activity.timestamp ? formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true }) : activity.time}
            </span>
          </div>
          {detailText && (
            <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 break-words">{detailText}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [userMetrics, setUserMetrics] = useState({ totalUsers: 0, newUsers: 0, activeUsers: 0 });
  const [productMetrics, setProductMetrics] = useState({ revenue: 0 });
  const [activities, setActivities] = useState([]);
  const [activityStats, setActivityStats] = useState({
    totalActivities: 0,
    activitiesByType: {}
  });
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [filterDays, setFilterDays] = useState("7");
  const [filterType, setFilterType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const metrics = useMemo(() => ({
    totalUsers: userMetrics?.totalUsers || 0,
    newUsers: userMetrics?.newUsers || 0,
    activeUsers: userMetrics?.activeUsers || 0,
    revenue: productMetrics?.revenue || 0,
    totalActivities: activityStats?.totalActivities || 0,
    ...(activityStats?.activitiesByType || {})
  }), [userMetrics, productMetrics, activityStats]);

  const loadActivities = useCallback(async () => {
    setActivityLoading(true);
    try {
      const recentRes = await apiHelpers.activities.getRecent({
        limit: 20,
        ...(filterType !== "all" && { type: filterType })
      });

      const activitiesData = Array.isArray(recentRes?.data) 
        ? recentRes.data 
        : Array.isArray(recentRes?.data?.data) 
          ? recentRes.data.data 
          : [];

      setActivities(activitiesData);
      
      const stats = {
        totalActivities: activitiesData.length,
        activitiesByType: activitiesData.reduce((acc, activity) => {
          const type = activity.type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {})
      };
      
      setActivityStats(stats);
    } catch (error) {
      console.error("Failed to load activities:", error);
      toast.error(error.response?.data?.message || "Failed to load recent activities");
      setActivities([]);
      setActivityStats({
        totalActivities: 0,
        activitiesByType: {}
      });
    } finally {
      setActivityLoading(false);
    }
  }, [filterDays, filterType]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadActivities();
      toast.success("Activities refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh activities");
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [userRes, productRes] = await Promise.all([
          apiHelpers.users.list().catch(() => ({ data: [] })),
          apiHelpers.products.getAll().catch(() => ({ data: [] }))
        ]);

        const users = Array.isArray(userRes) ? userRes : (userRes?.data || []);
        const userMetrics = {
          totalUsers: users.length,
          newUsers: users.filter(user => {
            const createdAt = user.createdAt ? new Date(user.createdAt) : null;
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return createdAt && createdAt > weekAgo;
          }).length,
          activeUsers: users.length
        };

        const products = Array.isArray(productRes) ? productRes : 
                       (Array.isArray(productRes?.data) ? productRes.data : []);
        const productMetrics = {
          revenue: Array.isArray(products) ? 
            products.reduce((sum, product) => sum + (Number(product?.price) || 0), 0) : 0
        };

        setUserMetrics(userMetrics);
        setProductMetrics(productMetrics);
      } catch (error) {
        console.error("Failed to load analytics dashboard:", error);
        toast.error("Failed to load dashboard data");
        toast.error(error.response?.data?.message || "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  useEffect(() => {
    loadActivities();
  }, [filterDays, filterType, loadActivities]);

  const activityTotals = useMemo(() => {
    if (!activityStats.activitiesByType) return [];
    
    const activitiesArray = Object.entries(activityStats.activitiesByType).map(([type, count]) => ({
      type,
      count: Number(count) || 0
    }));
    
    const total = activitiesArray.reduce((sum, item) => sum + item.count, 0);
    
    return activitiesArray.map(item => ({
      ...item,
      percentage: total ? Math.round((item.count / total) * 100) : 0,
    }));
  }, [activityStats.activitiesByType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Track performance, monitor growth, and analyze platform activities in real-time</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-5 py-2.5 border-2 border-green-200">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
              </span>
              <span className="text-sm font-bold text-green-700">Live Updates</span>
            </div>
          </div>
        </div>

        {/* KPI Metrics */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">Key Performance Indicators</h2>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-40 animate-pulse rounded-2xl bg-white/60 backdrop-blur-sm" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {METRIC_CARDS.map((metric) => {
                const raw = dashboardMetrics?.[metric.key] ?? userMetrics?.[metric.key] ?? null;
                const normalized = normalizeMetricValue(raw);

                return (
                  <MetricCard
                    key={metric.key}
                    icon={metric.icon}
                    label={metric.label}
                    value={normalized.value}
                    change={normalized.change}
                    subText={metric.key === "revenue" ? "Last 30 days" : undefined}
                    color={metric.color}
                    format={metric.format}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* User & Product Trends */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">User Growth</h3>
                <p className="text-sm text-gray-600 mt-1">Platform user analytics and distribution</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">
                👥
              </div>
            </div>

            {loading ? (
              <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
            ) : userMetrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"></div>
                    <p className="relative text-xs font-bold uppercase tracking-wide text-blue-100">Students</p>
                    <p className="relative mt-2 text-3xl font-black text-white">{userMetrics.students || 0}</p>
                    <p className="relative text-xs text-blue-100 mt-1">Active learners</p>
                  </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"></div>
                    <p className="relative text-xs font-bold uppercase tracking-wide text-indigo-100">Instructors</p>
                    <p className="relative mt-2 text-3xl font-black text-white">{userMetrics.instructors || 0}</p>
                    <p className="relative text-xs text-indigo-100 mt-1">Content creators</p>
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-600">New Signups (30d)</p>
                  <p className="mt-2 text-3xl font-black text-gray-900">{userMetrics.newUsersLast30Days || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Recent platform growth</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No user analytics available.</p>
            )}
          </div>

          <div className="space-y-6 rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Product Performance</h3>
                <p className="text-sm text-gray-600 mt-1">Catalog overview and revenue metrics</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl shadow-lg">
                📦
              </div>
            </div>

            {loading ? (
              <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
            ) : productMetrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"></div>
                    <p className="relative text-xs font-bold uppercase tracking-wide text-emerald-100">Products</p>
                    <p className="relative mt-2 text-3xl font-black text-white">{productMetrics.totalProducts || 0}</p>
                    <p className="relative text-xs text-emerald-100 mt-1">In catalog</p>
                  </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"></div>
                    <p className="relative text-xs font-bold uppercase tracking-wide text-orange-100">Featured</p>
                    <p className="relative mt-2 text-3xl font-black text-white">{productMetrics.featuredProducts || 0}</p>
                    <p className="relative text-xs text-orange-100 mt-1">Highlighted</p>
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Revenue (30d)</p>
                  <p className="mt-2 text-3xl font-black text-gray-900">₹{productMetrics.revenueLast30Days?.toLocaleString("en-IN") || "0"}</p>
                  <p className="text-xs text-gray-500 mt-1">Recent gross sales</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No product analytics available.</p>
            )}
          </div>
        </section>

        {/* Activities */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl p-8 shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-1 w-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                  <h3 className="text-2xl font-bold text-gray-900">Recent Activities</h3>
                </div>
                <p className="text-sm text-gray-600">Real-time platform events and user actions</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="all">All types</option>
                  <option value="user_login">User Logins</option>
                  <option value="user_signup">New Users</option>
                  <option value="user_logout">User Logouts</option>
                  <option value="product_created">Products</option>
                  <option value="product_updated">Product Updates</option>
                  <option value="purchase">Purchases</option>
                </select>
                <select
                  value={filterDays}
                  onChange={(e) => setFilterDays(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </select>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="group relative flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg 
                    className={`h-5 w-5 relative z-10 transition-transform duration-500 ${
                      isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2.5" 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                  <span className="relative z-10">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No activities found</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <ActivityRow 
                    key={activity._id || `activity-${index}`} 
                    activity={activity} 
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl p-8 shadow-xl">
              <h4 className="text-xl font-bold text-gray-900 mb-6">Activity Breakdown</h4>
              {activityTotals.length === 0 ? (
                <p className="text-sm text-gray-500">No activity statistics available.</p>
              ) : (
                <div className="space-y-3">
                  {activityTotals.map((item) => {
                    const meta = ACTIVITY_TYPE_META[item.type] || { label: item.type, color: "bg-gray-100 text-gray-700" };
                    return (
                      <div key={item.type} className="group flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gradient-to-r from-white to-gray-50 p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-lg font-bold text-gray-900">{item.count}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-500">{item.percentage}%</span>
                          <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg">
                  💡
                </div>
                <h4 className="text-xl font-bold text-gray-900">Pro Tips</h4>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span>Monitor <span className="font-bold text-blue-600">user_signup</span> spikes to track marketing campaign effectiveness</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span>High <span className="font-bold text-indigo-600">product_updated</span> counts indicate active catalog management</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <span>Use filters to narrow down specific activities during platform audits</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

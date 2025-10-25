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
  user_login: { label: "User Login", color: "bg-blue-100 text-blue-700" },
  user_signup: { label: "New User", color: "bg-green-100 text-green-700" },
  user_logout: { label: "User Logout", color: "bg-slate-100 text-slate-700" },
  profile_update: { label: "Profile Updated", color: "bg-amber-100 text-amber-700" },
  product_created: { label: "Product Created", color: "bg-emerald-100 text-emerald-700" },
  product_updated: { label: "Product Updated", color: "bg-amber-100 text-amber-700" },
  course_enrollment: { label: "Course Enrollment", color: "bg-purple-100 text-purple-700" },
  purchase: { label: "Purchase", color: "bg-pink-100 text-pink-700" },
  CART_ADD_ITEM: { label: "Item added to card", color: "bg-blue-100 text-blue-700" }
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
    <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
      <div className={`absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-r ${color} opacity-10`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{formattedValue}</p>
          {changeLabel && <p className={`mt-1 text-xs font-semibold ${changeColor}`}>{changeLabel}</p>}
          {subText && <p className="mt-1 text-xs text-gray-400">{subText}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-2xl">
          {icon}
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
  const meta = ACTIVITY_TYPE_META[activity.type] || { label: activity.type, color: "bg-gray-100 text-gray-700" };
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
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-lg md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-start gap-3">
        <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
          {meta.label}
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900">{messageText}</p>
          <p className="mt-1 text-xs text-gray-500">
            {activity.userName ? `${activity.userName} • ` : ""}
            {activity.userRole ? `${activity.userRole}` : ""}
          </p>
          {detailText && (
            <p className="mt-2 text-xs text-gray-500 break-words">{detailText}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 md:mt-0">
        {activity.value && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
            {activity.value}
          </span>
        )}
        <span className="text-xs text-gray-400">
          {activity.timestamp ? formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true }) : activity.time}
        </span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);
  const [productMetrics, setProductMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityStats, setActivityStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [filterDays, setFilterDays] = useState("7");
  const [filterType, setFilterType] = useState("all");

  const loadActivities = useCallback(async () => {
    setActivityLoading(true);
    try {
      const params = {
        days: filterDays,
        ...(filterType !== "all" ? { type: filterType } : {}),
        limit: 20,
      };

      const [recentRes, statsRes] = await Promise.all([
        apiHelpers.activities.getRecent(params),
        apiHelpers.activities.getStats({ days: filterDays }),
      ]);

      setActivities(recentRes?.data?.data || recentRes?.data || []);
      setActivityStats(statsRes?.data?.data || statsRes?.data || []);
    } catch (error) {
      console.error("Failed to load activities:", error);
      toast.error(error.response?.data?.message || "Failed to load recent activities");
    } finally {
      setActivityLoading(false);
    }
  }, [filterDays, filterType]);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [dashboardRes, userRes, productRes] = await Promise.all([
          apiHelpers.analytics.getDashboard(),
          apiHelpers.analytics.getUsers(),
          apiHelpers.analytics.getProducts()
        ]);

        setDashboardMetrics(dashboardRes?.data?.data || dashboardRes?.data || dashboardRes);
        setUserMetrics(userRes?.data?.data || userRes?.data || userRes);
        setProductMetrics(productRes?.data?.data || productRes?.data || productRes);
      } catch (error) {
        console.error("Failed to load analytics dashboard:", error);
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
    const total = activityStats.reduce((sum, item) => sum + (item.count || 0), 0);
    return activityStats.map((item) => ({
      type: item._id,
      count: item.count,
      percentage: total ? Math.round((item.count / total) * 100) : 0,
    }));
  }, [activityStats]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500">Track product performance, user growth, and recent platform activities.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1 text-sm font-medium text-gray-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Live Updates
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Key Performance Indicators</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-32 animate-pulse rounded-3xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
              <p className="text-sm text-gray-500">Summary of user signups and roles distribution.</p>
            </div>
          </div>

          {loading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          ) : userMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Students</p>
                  <p className="mt-1 text-2xl font-bold text-blue-900">{userMetrics.students}</p>
                  <p className="text-xs text-blue-500">Active learners on the platform</p>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Instructors</p>
                  <p className="mt-1 text-2xl font-bold text-indigo-900">{userMetrics.instructors}</p>
                  <p className="text-xs text-indigo-500">Creators and mentors</p>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">New Signups (30d)</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{userMetrics.newUsersLast30Days}</p>
                <p className="text-xs text-gray-500">Students + instructors onboarded recently</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No user analytics available.</p>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
              <p className="text-sm text-gray-500">Overview of product catalog and sales.</p>
            </div>
          </div>

          {loading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          ) : productMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Products</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{productMetrics.totalProducts}</p>
                  <p className="text-xs text-emerald-500">Published in the catalog</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Featured</p>
                  <p className="mt-1 text-2xl font-bold text-orange-900">{productMetrics.featuredProducts}</p>
                  <p className="text-xs text-orange-500">Highlighted on storefront</p>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue (30d)</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">₹{productMetrics.revenueLast30Days?.toLocaleString("en-IN") || "0"}</p>
                <p className="text-xs text-gray-500">Gross sales generated recently</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No product analytics available.</p>
          )}
        </div>
      </section>

      {/* Activities */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <p className="text-sm text-gray-500">Login events, new users, product updates, and more.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
              <button
                onClick={loadActivities}
                disabled={activityLoading}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
              >
                {activityLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 114.582 9M20 12a8.001 8.001 0 01-8 8v0" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>

          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
              No recent activities found for the selected filters.
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl lg:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Activity Breakdown</h4>
            {activityTotals.length === 0 ? (
              <p className="text-sm text-gray-500">No activity stats available.</p>
            ) : (
              <div className="space-y-3">
                {activityTotals.map((item) => {
                  const meta = ACTIVITY_TYPE_META[item.type] || { label: item.type };
                  return (
                    <div key={item.type} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color || "bg-gray-100 text-gray-700"}`}>
                          {meta.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{item.percentage}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
            <h4 className="text-sm font-semibold text-gray-700">Tips</h4>
            <ul className="mt-2 space-y-2">
              <li>
                Monitor <span className="font-semibold">user_signup</span> spikes to keep track of marketing campaign success.
              </li>
              <li>
                Large counts of <span className="font-semibold">product_updated</span> indicate catalog refresh frequency.
              </li>
              <li>
                Use the filters above to narrow down activities during audits.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

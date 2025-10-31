"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/auth";
import { apiHelpers } from "@/lib/api";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CoursesAPI, ProductsAPI } from "@/utils/api";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentData, setRecentData] = useState({
    orders: [],
    users: [],
    products: [],
    activities: []
  });
  const [allSignupUsers, setAllSignupUsers] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const syncAdminName = () => {
      try {
        const token = typeof window !== "undefined" ? getToken?.() : null;
        const storedUserRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (!token || !storedUserRaw) {
          setAdminName("Admin");
          return;
        }

        const parsedUser = JSON.parse(storedUserRaw);
        const name = parsedUser?.name || parsedUser?.username || parsedUser?.email;
        setAdminName(name || "Admin");
      } catch (error) {
        console.error("Failed to load admin name", error);
        setAdminName("Admin");
      }
    };

    syncAdminName();
  }, []);

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const [activitiesRes, signupRes] = await Promise.all([
        apiHelpers.activities.getRecent({ limit: 10, days: 7 }),
        apiHelpers.activities.getRecent({ limit: 100, type: "user_signup" }),
      ]);

      const activitiesPayload = activitiesRes?.data?.data || activitiesRes?.data || [];
      const signupPayload = signupRes?.data?.data || signupRes?.data || [];

      const mappedUsers = Array.isArray(signupPayload)
        ? signupPayload.map((item) => ({
            id: item.id || item._id,
            name:
              formatActivityDetail(
                item.userName ||
                  item.details?.name ||
                  item.message?.split(": ")?.[1]
              ) || "New User",
            email:
              formatActivityDetail(item.details?.email || item.userEmail) || "",
            role: item.userRole || "student",
            joinDate: item.timestamp
              ? formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })
              : item.time || "Just now",
          }))
        : [];

      setAllSignupUsers(mappedUsers);

      setRecentData((prev) => ({
        ...prev,
        activities: Array.isArray(activitiesPayload) ? activitiesPayload : [],
        users: mappedUsers.slice(0, 4),
      }));
      setShowAllUsers(false);
    } catch (error) {
      console.error("Failed to load recent activities", error);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
    
    // Fetch total coins from the transactions
    const fetchTotalCoins = async () => {
      try {
        const response = await apiHelpers.activities.getRecent({ 
          type: 'coin_update',
          limit: 1000 // Get enough records to calculate total
        });
        const transactions = response?.data?.data || response?.data || [];
        const total = transactions.reduce((sum, tx) => {
          const amount = parseFloat(tx.details?.newValue) || 0;
          return sum + amount;
        }, 0);
        setTotalCoins(Math.round(total));
      } catch (error) {
        console.error('Error fetching total coins:', error);
      }
    };

    // Fetch total number of students
    const fetchTotalStudents = async () => {
      try {
        const users = await apiHelpers.users.list();
        const students = users.filter(user => user.role === 'student');
        setTotalStudents(students.length);
      } catch (error) {
        console.error('Error fetching total students:', error);
      }
    };
    
    // Fetch total number of courses
    const fetchTotalCourses = async () => {
      try {
        const response = await CoursesAPI.list();
        setTotalCourses(response?.data?.length || 0);
      } catch (error) {
        console.error('Error fetching total courses:', error);
      }
    };
    
    // Fetch total number of products
    const fetchTotalProducts = async () => {
      try {
        const response = await ProductsAPI.list({ page: 1, limit: 1000 }); // Fetch all products
        const products = response?.data || [];
        setTotalProducts(products.length);
      } catch (error) {
        console.error('Error fetching total products:', error);
      }
    };
    
    fetchTotalCoins();
    fetchTotalStudents();
    fetchTotalCourses();
    fetchTotalProducts();
  }, [loadActivities]);

  const formattedActivities = useMemo(() => {
    return (recentData.activities || []).map((activity) => {
      const type = activity.type || activity.activityType || "generic";
      const timestampRaw = activity.timestamp || activity.createdAt || activity.updatedAt;
      let timeLabel = activity.time || "Just now";

      if (timestampRaw) {
        try {
          const parsed = typeof timestampRaw === "string" ? parseISO(timestampRaw) : new Date(timestampRaw);
          if (!Number.isNaN(parsed?.getTime())) {
            timeLabel = formatDistanceToNow(parsed, { addSuffix: true });
          }
        } catch (error) {
          try {
            timeLabel = new Date(timestampRaw).toLocaleString();
          } catch (error) {
            timeLabel = activity.time || "Just now";
          }
        }
      }
      
      // Parse details for coin_update activities
      let details = {};
      try {
        if (activity.details) {
          details = typeof activity.details === 'string' 
            ? JSON.parse(activity.details) 
            : activity.details;
        }
      } catch (e) {
        console.error('Error parsing activity details:', e);
      }

      const normalizedType = type === "login" ? "user_login" : type === "logout" ? "user_logout" : type;
      
      // Handle coin_update specifically
      if (normalizedType === 'coin_update') {
        const amount = parseInt(details.amount) || 0;
        const isAdd = amount >= 0;
        const absAmount = Math.abs(amount);
        const action = isAdd ? 'add' : 'subtract';
        
        return {
          id: activity.id || activity._id || `coin-update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'coin_update',
          userName: activity.userName || details.userName || 'User',
          userId: activity.userId || details.userId || 'N/A',
          userRole: activity.userRole || details.userRole || 'user',
          action,
          amount: absAmount,
          newBalance: details.newValue || details.newBalance || 'N/A',
          time: timeLabel,
          details: details,
          icon: isAdd ? '💰' : '💸',
          title: `Coins ${isAdd ? 'added' : 'subtracted'}: ${absAmount}`,
          subtitle: [activity.userName, activity.userRole].filter(Boolean).join(' • '),
          description: `New balance: ${details.newValue || 'N/A'}`
        };
      }
      
      // Handle other activity types
      const rawTitle = activity.message || activity.action || "Platform activity";
      const rawDescription = activity.details || activity.description;
      const actorName =
        activity.userName ||
        activity.user ||
        activity.actor ||
        details.userName || 
        details.studentName || 
        details.name ||
        undefined;

      const parsePossibleJson = (value) => {
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
          try {
            return JSON.parse(trimmed);
          } catch {
            return undefined;
          }
        }
        return undefined;
      };

      const rawDetailsObject =
        typeof activity.details === "object" && activity.details
          ? activity.details
          : parsePossibleJson(activity.details) || undefined;
      const courseData =
        rawDetailsObject && typeof rawDetailsObject === "object"
          ? rawDetailsObject.course || rawDetailsObject.courseDetails || rawDetailsObject
          : undefined;
      const courseId =
        rawDetailsObject?.courseId ||
        courseData?.courseId ||
        courseData?._id ||
        courseData?.id ||
        rawDetailsObject?.courseCode ||
        rawDetailsObject?.course_id;
      const courseTitle =
        rawDetailsObject?.courseTitle ||
        courseData?.title ||
        courseData?.name ||
        rawDetailsObject?.title;

      return {
        id: activity.id || activity._id || `${normalizedType}-${activity.timestamp || activity.createdAt || Math.random()}`,
        type: normalizedType,
        icon: getActivityIcon(normalizedType),
        style: getActivityStyle(normalizedType),
        title: (() => {
          if ((normalizedType || "").toUpperCase() === "CART_ADD_ITEM") {
            if (courseTitle) {
              return `Item added to cart: ${courseTitle}`;
            }
            return "Item added to cart";
          }
          return formatActivityDetail(rawTitle) || "Platform activity";
        })(),
        subtitle: (() => {
          const baseParts = [actorName, activity.userRole].filter(Boolean);
          if ((normalizedType || "").toUpperCase() === "CART_ADD_ITEM") {
            const studentLabel = actorName ? `Student: ${actorName}` : undefined;
            const parts = [studentLabel, activity.userRole].filter(Boolean);
            return parts.length ? parts.join(" • ") : baseParts.join(" • ");
          }
          return baseParts.join(" • ");
        })(),
        description: (() => {
          if ((normalizedType || "").toUpperCase() === "CART_ADD_ITEM") {
            const descParts = [];
            if (courseId) {
              descParts.push(`Course ID: ${courseId}`);
            }
            if (!courseTitle && courseData?.category) {
              descParts.push(`Category: ${courseData.category}`);
            }
            const descString = descParts.join(" • ");
            if (descString) return descString;
          }
          return formatActivityDetail(rawDescription);
        })(),
        time: timeLabel,
      };
    });
  }, [recentData.activities]);

  useEffect(() => {
    // Simulate API calls - replace with real API endpoints
    const loadDashboardData = async () => {
      try {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Mock data - replace with actual API calls
        setStats({
          totalRevenue: 1284750,
          totalOrders: 1247,
          totalStudents: 8429,
          totalCourses: 127,
          monthlyGrowth: {
            revenue: 12.5,
            orders: 8.3,
            students: 15.7,
            courses: 5.2
          }
        });

        setRecentData((prev) => ({
          ...prev,
          orders: [
            { id: 'ORD-001', customer: 'Rahul Sharma', amount: 2999, status: 'completed', date: '2025-09-20' },
            { id: 'ORD-002', customer: 'Priya Singh', amount: 1499, status: 'pending', date: '2025-09-20' },
            { id: 'ORD-003', customer: 'Amit Kumar', amount: 3999, status: 'processing', date: '2025-09-19' },
            { id: 'ORD-004', customer: 'Sneha Patel', amount: 899, status: 'completed', date: '2025-09-19' },
            { id: 'ORD-005', customer: 'Vikram Rao', amount: 4999, status: 'pending', date: '2025-09-18' },
          ],
          products: [
            { id: 101, name: 'Complete JavaScript Course', price: 2999, stock: 'unlimited', sales: 234 },
            { id: 102, name: 'React Masterclass', price: 3999, stock: 'unlimited', sales: 189 },
            { id: 103, name: 'Node.js Backend Development', price: 2499, stock: 'unlimited', sales: 156 },
            { id: 104, name: 'Full Stack Web Development', price: 4999, stock: 'unlimited', sales: 298 },
          ]
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const displayedUsers = showAllUsers ? allSignupUsers : recentData.users;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                Welcome back, {adminName}! 
                <span className="inline-block ml-2 animate-bounce">👋</span>
              </h1>
              <p className="text-white/90 text-lg max-w-2xl">
                Here's what's happening with your platform today. Everything looks great!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="bg-white/20 hover:bg-white hover:text-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 hover:scale-105">
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Reports
              </button>
              <button className="bg-white/20 hover:bg-white hover:text-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 hover:scale-105">
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Quick Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Coins in System" 
          value={totalCoins.toLocaleString()}
          icon="🪙"
          bgColor="from-amber-50 to-yellow-50"
          iconColor="from-amber-500 to-yellow-600"
        />
        <StatsCard 
          title="Total Students" 
          value={totalStudents.toLocaleString()}
          icon="👨‍🎓"
          bgColor="from-blue-50 to-cyan-50"
          iconColor="from-blue-500 to-cyan-600"
        />
        <StatsCard 
          title="Total Courses" 
          value={totalCourses.toLocaleString()}
          icon="📚"
          bgColor="from-purple-50 to-indigo-50"
          iconColor="from-purple-500 to-indigo-600"
        />
        <StatsCard 
          title="Total Products" 
          value={totalProducts.toLocaleString()}
          icon="🛍️"
          bgColor="from-orange-50 to-red-50"
          iconColor="from-orange-500 to-red-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Coin Transaction History */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col" style={{ height: '600px' }}>
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Coin Transactions</h2>
                  <p className="text-gray-600">Recent coin credit/debit history</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={loadActivities}
                    className="bg-gradient-to-r from-orange-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:scale-105"
                    disabled={activitiesLoading}
                  >
                    {activitiesLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button 
                    onClick={() => router.push('/admin/coins')}
                    className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:scale-105"
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Action</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Old Balance</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">New Balance</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">By</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedActivities
                    .filter(activity => activity.type === 'coin_update')
                    .map((activity) => {
                      const details = activity.details || {};
                      const amount = parseInt(details.amount) || 0;
                      const isAdd = amount >= 0;
                      const absAmount = Math.abs(amount);
                      const newBalance = parseInt(details.newValue || details.newBalance) || 0;
                      const oldBalance = isAdd ? (newBalance - absAmount) : (newBalance + absAmount);
                      const adminNote = details.adminNote || '';

                      return (
                        <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-3">
                                {activity.userName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-medium">{activity.userName || 'User'}</div>
                                <div className="text-xs text-gray-500">id: {activity.userId || 'N/A'}</div>
                                <div className="text-xs text-purple-600 font-medium">
                                  {activity.userRole === 'admin' ? 'Admin' : 'Student'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isAdd ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isAdd ? 'Credited' : 'Debited'}
                            </span>
                          </td>
                          <td className={`py-4 px-4 font-bold ${isAdd ? 'text-green-600' : 'text-red-600'}`}>
                            {isAdd ? '+' : '-'}{absAmount}
                          </td>
                          <td className="py-4 px-4 font-mono">{oldBalance}</td>
                          <td className="py-4 px-4 font-mono">{newBalance}</td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {activity.details?.adminName || 'Admin'}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-500">
                            {activity.time || 'Just now'}
                          </td>
                        </tr>
                      );
                    })}
                  {!formattedActivities.some(a => a.type === 'coin_update') && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        No coin transactions found. Try refreshing the data.
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Recent Activity</h2>
                <p className="text-gray-600">Login events, new users, product updates, and more.</p>
              </div>
              <button
                onClick={loadActivities}
                disabled={activitiesLoading}
                className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
              >
                {activitiesLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <span className="text-lg leading-none">🔄</span>
                    Refresh
                  </>
                )}
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activitiesLoading ? (
                [...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                ))
              ) : formattedActivities.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                  No recent platform activities.
                </div>
              ) : (
                formattedActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-orange-50 hover:to-blue-50 transition-all duration-300 border border-gray-200/50"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-lg text-white ${activity.style}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate">{activity.subtitle || "System"}</p>
                      {activity.description && (
                        <p className="mt-1 text-xs text-gray-500 truncate">{activity.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 text-center">
              <button className="border-2 border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-blue-500 hover:text-white hover:border-transparent px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105">
                View All Activity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Quick Actions</h2>
            <p className="text-gray-600">Frequently used admin functions</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionCard 
              title="Add Course" 
              description="Create new course"
              icon="🎓"
              href="/admin/courses/new"
              gradient="from-blue-500 to-purple-600"
            />
            <QuickActionCard 
              title="Add Product" 
              description="Add new product"
              icon="🛒"
              href="/admin/products/new"
              gradient="from-green-500 to-emerald-600"
            />
            <QuickActionCard 
              title="Manage Users" 
              description="View all users"
              icon="👥"
              href="/admin/users"
              gradient="from-orange-500 to-red-600"
            />
            <QuickActionCard 
              title="View Analytics" 
              description="Detailed reports"
              icon="📈"
              href="/admin/analytics"
              gradient="from-purple-500 to-pink-600"
            />
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Top Products</h2>
              <p className="text-gray-600">Best performing products</p>
            </div>
            <button className="border-2 border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-blue-500 hover:text-white hover:border-transparent px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105">
              Manage Products
            </button>
          </div>
          <div className="space-y-4">
            {recentData.products.map(product => (
              <div key={product.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-orange-50 hover:to-blue-50 transition-all duration-300 border border-gray-200/50">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.sales} sales this month</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-green-600 text-lg">₹{product.price.toLocaleString()}</p>
                  <p className="text-xs text-green-500 font-semibold">✅ In Stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Recent Users</h2>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="bg-gradient-to-r from-orange-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:scale-105"
          >
            Manage Users
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedUsers.map(user => (
            <div key={user.id} className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-orange-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{user.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleStyle(user.role)}`}>
                  {user.role}
                </span>
                <span className="text-xs text-gray-500">{user.joinDate}</span>
              </div>
            </div>
          ))}
        </div>
        {allSignupUsers.length > 4 && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowAllUsers((prev) => !prev)}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-blue-500 hover:text-white hover:border-transparent px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105"
            >
              {showAllUsers ? "Show Less" : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Component: Stats Card                                     */
/* ────────────────────────────────────────────────────────── */
function StatsCard({ title, value, icon, bgColor, iconColor }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${bgColor} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/50 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-semibold mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-16 h-16 bg-gradient-to-br ${iconColor} rounded-2xl flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${iconColor} opacity-10 rounded-full -mr-16 -mt-16`}></div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Component: Quick Action Card                              */
/* ────────────────────────────────────────────────────────── */
function QuickActionCard({ title, description, icon, href, gradient }) {
  return (
    <a href={href} className={`group relative overflow-hidden bg-gradient-to-br ${gradient} rounded-xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 block`}>
      <div className="relative z-10 text-center">
        <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="font-bold text-sm mb-1">{title}</h3>
        <p className="text-xs text-white/80">{description}</p>
      </div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 transition-all duration-300 group-hover:scale-150"></div>
    </a>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Component: Dashboard Skeleton                             */
/* ────────────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="bg-gray-200 h-48 w-full rounded-2xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 h-32 rounded-2xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-gray-200 h-96 rounded-2xl"></div>
        <div className="bg-gray-200 h-96 rounded-2xl"></div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-gray-200 h-64 rounded-2xl"></div>
        <div className="bg-gray-200 h-64 rounded-2xl"></div>
      </div>
      <div className="bg-gray-200 h-40 rounded-2xl"></div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Helper Functions                                          */
/* ────────────────────────────────────────────────────────── */
function getStatusStyle(status) {
  const styles = {
    completed: 'bg-green-100 text-green-700 border border-green-200',
    pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    processing: 'bg-blue-100 text-blue-700 border border-blue-200',
    cancelled: 'bg-red-100 text-red-700 border border-red-200'
  };
  return styles[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
}

function getActivityIcon(type) {
  const icons = {
    order: '📦',  
    user: '👤',
    course: '🎓',
    product: '🛒',
    user_login: '🔓',
    user_logout: '🔒'
  };
  return icons[type] || '📋';
}

function getActivityStyle(type) {
  const styles = {
    order: 'bg-gradient-to-br from-green-400 to-emerald-500',
    user: 'bg-gradient-to-br from-blue-400 to-cyan-500', 
    course: 'bg-gradient-to-br from-purple-400 to-indigo-500',
    product: 'bg-gradient-to-br from-orange-400 to-red-500',
    user_login: 'bg-gradient-to-br from-emerald-400 to-green-500',
    user_logout: 'bg-gradient-to-br from-rose-400 to-red-500'
  };
  return styles[type] || 'bg-gradient-to-br from-gray-400 to-gray-500';
}

function getRoleStyle(role) {
  const styles = {
    admin: 'bg-red-100 text-red-700 border border-red-200',
    instructor: 'bg-blue-100 text-blue-700 border border-blue-200',
    student: 'bg-green-100 text-green-700 border border-green-200'
  };
  return styles[role] || 'bg-gray-100 text-gray-700 border border-gray-200';
}

function formatActivityDetail(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry) => formatActivityDetail(entry))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return "";
}

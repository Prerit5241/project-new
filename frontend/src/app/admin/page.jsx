"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentData, setRecentData] = useState({
    orders: [],
    users: [],
    products: [],
    activities: []
  });

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

        setRecentData({
          orders: [
            { id: 'ORD-001', customer: 'Rahul Sharma', amount: 2999, status: 'completed', date: '2025-09-20' },
            { id: 'ORD-002', customer: 'Priya Singh', amount: 1499, status: 'pending', date: '2025-09-20' },
            { id: 'ORD-003', customer: 'Amit Kumar', amount: 3999, status: 'processing', date: '2025-09-19' },
            { id: 'ORD-004', customer: 'Sneha Patel', amount: 899, status: 'completed', date: '2025-09-19' },
            { id: 'ORD-005', customer: 'Vikram Rao', amount: 4999, status: 'pending', date: '2025-09-18' },
          ],
          users: [
            { id: 1, name: 'Arjun Mehta', email: 'arjun@example.com', role: 'student', joinDate: '2025-09-19' },
            { id: 2, name: 'Kavya Reddy', email: 'kavya@example.com', role: 'instructor', joinDate: '2025-09-18' },
            { id: 3, name: 'Rohan Gupta', email: 'rohan@example.com', role: 'student', joinDate: '2025-09-17' },
            { id: 4, name: 'Anjali Sharma', email: 'anjali@example.com', role: 'student', joinDate: '2025-09-16' },
          ],
          products: [
            { id: 101, name: 'Complete JavaScript Course', price: 2999, stock: 'unlimited', sales: 234 },
            { id: 102, name: 'React Masterclass', price: 3999, stock: 'unlimited', sales: 189 },
            { id: 103, name: 'Node.js Backend Development', price: 2499, stock: 'unlimited', sales: 156 },
            { id: 104, name: 'Full Stack Web Development', price: 4999, stock: 'unlimited', sales: 298 },
          ],
          activities: [
            { action: 'New order placed', user: 'Rahul Sharma', time: '2 minutes ago', type: 'order' },
            { action: 'New user registered', user: 'Kavya Reddy', time: '15 minutes ago', type: 'user' },
            { action: 'Course updated', user: 'Admin', time: '1 hour ago', type: 'course' },
            { action: 'Product added', user: 'Admin', time: '2 hours ago', type: 'product' },
            { action: 'Payment processed', user: 'Priya Singh', time: '3 hours ago', type: 'order' },
            { action: 'Course completed', user: 'Amit Kumar', time: '5 hours ago', type: 'course' },
          ]
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

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
                Welcome back, Admin! 
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
          title="Total Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          growth={stats.monthlyGrowth.revenue}
          icon="💰"
          bgColor="from-emerald-50 to-green-50"
          iconColor="from-emerald-500 to-green-600"
        />
        <StatsCard 
          title="Total Orders" 
          value={stats.totalOrders.toLocaleString()}
          growth={stats.monthlyGrowth.orders}
          icon="📦"
          bgColor="from-blue-50 to-cyan-50"
          iconColor="from-blue-500 to-cyan-600"
        />
        <StatsCard 
          title="Students" 
          value={stats.totalStudents.toLocaleString()}
          growth={stats.monthlyGrowth.students}
          icon="👨‍🎓"
          bgColor="from-purple-50 to-indigo-50"
          iconColor="from-purple-500 to-indigo-600"
        />
        <StatsCard 
          title="Courses" 
          value={stats.totalCourses}
          growth={stats.monthlyGrowth.courses}
          icon="🎓"
          bgColor="from-orange-50 to-red-50"
          iconColor="from-orange-500 to-red-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Recent Orders</h2>
                <p className="text-gray-600">Latest customer orders and transactions</p>
              </div>
              <button className="bg-gradient-to-r from-orange-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:scale-105">
                View All Orders
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentData.orders.map(order => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-4 px-4 font-mono text-sm font-semibold text-blue-600">{order.id}</td>
                      <td className="py-4 px-4 font-medium text-gray-800">{order.customer}</td>
                      <td className="py-4 px-4 font-bold text-green-600">₹{order.amount.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">{order.date}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                            View
                          </button>
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium hover:bg-green-50 px-2 py-1 rounded transition-colors">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Recent Activity</h2>
              <p className="text-gray-600">Latest platform activities</p>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentData.activities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-orange-50 hover:to-blue-50 transition-all duration-300 border border-gray-200/50">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-lg text-white ${getActivityStyle(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{activity.action}</p>
                    <p className="text-sm text-gray-600 truncate">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
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
            <p className="text-gray-600">Newly registered users</p>
          </div>
          <button className="bg-gradient-to-r from-orange-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:scale-105">
            Manage Users
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentData.users.map(user => (
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
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Component: Stats Card                                     */
/* ────────────────────────────────────────────────────────── */
function StatsCard({ title, value, growth, icon, bgColor, iconColor }) {
  const isPositive = growth > 0;
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${bgColor} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/50 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-semibold mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mb-2">{value}</p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
              isPositive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isPositive ? '📈' : '📉'} {Math.abs(growth)}%
            </span>
            <span className="text-xs text-gray-500">vs last month</span>
          </div>
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
    product: '🛒'
  };
  return icons[type] || '📋';
}

function getActivityStyle(type) {
  const styles = {
    order: 'bg-gradient-to-br from-green-400 to-emerald-500',
    user: 'bg-gradient-to-br from-blue-400 to-cyan-500', 
    course: 'bg-gradient-to-br from-purple-400 to-indigo-500',
    product: 'bg-gradient-to-br from-orange-400 to-red-500'
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

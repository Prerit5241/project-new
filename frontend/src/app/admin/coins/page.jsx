"use client";
import { useEffect, useState } from "react";
import { apiHelpers } from "@/lib/api";
import { format } from "date-fns";

const CoinsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [dateRange, setDateRange] = useState('all');

  // Fetch all users and create a map of user data
  const fetchUsers = async () => {
    try {
      const usersList = await apiHelpers.users.list();
      const usersMap = {};
      usersList.forEach(user => {
        usersMap[user._id || user.id] = {
          email: user.email,
          role: user.role,
          name: user.name || user.email?.split('@')[0]
        };
      });
      return usersMap;
    } catch (error) {
      console.error('Error fetching users:', error);
      return {};
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [transactionsRes, usersMap] = await Promise.all([
          apiHelpers.activities.getRecent({ 
            type: 'coin_update',
            limit: 100
          }),
          fetchUsers()
        ]);
        
        let transactionsData = transactionsRes?.data?.data || transactionsRes?.data || [];
        
        transactionsData = transactionsData.map(tx => ({
          ...tx,
          userEmail: tx.userId ? (usersMap[tx.userId]?.email || 'N/A') : 'System',
          userName: tx.userId ? (usersMap[tx.userId]?.name || 'Unknown') : 'System',
          userRole: tx.userId ? (usersMap[tx.userId]?.role || 'N/A') : 'system'
        }));
        
        setTransactions(transactionsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getOldBalance = (tx) => {
    if (!tx.details) return 'N/A';
    const amount = parseFloat(tx.details.amount) || 0;
    const newValue = parseFloat(tx.details.newValue) || 0;
    const oldBalance = newValue - amount;
    return isNaN(oldBalance) ? 'N/A' : oldBalance;
  };

  const getTransactionType = (amount) => {
    return amount >= 0 ? 'credit' : 'debit';
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getFilteredAndSortedTransactions = () => {
    let filtered = transactions.filter(tx => {
      const amount = tx.details?.amount || 0;
      const type = getTransactionType(amount);
      const matchesFilter = filter === 'all' || type === filter;
      const matchesSearch = !searchTerm || 
        tx.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx._id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateRange !== 'all') {
        const txDate = new Date(tx.timestamp || tx.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now - txDate) / (1000 * 60 * 60 * 24));
        
        if (dateRange === 'today') matchesDate = daysDiff === 0;
        else if (dateRange === 'week') matchesDate = daysDiff <= 7;
        else if (dateRange === 'month') matchesDate = daysDiff <= 30;
      }
      
      return matchesFilter && matchesSearch && matchesDate;
    });

    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'date') {
        const dateA = new Date(a.timestamp || a.createdAt);
        const dateB = new Date(b.timestamp || b.createdAt);
        compareValue = dateB - dateA;
      } else if (sortBy === 'amount') {
        const amountA = Math.abs(parseFloat(a.details?.amount || 0));
        const amountB = Math.abs(parseFloat(b.details?.amount || 0));
        compareValue = amountB - amountA;
      } else if (sortBy === 'user') {
        compareValue = (a.userName || '').localeCompare(b.userName || '');
      }
      
      return sortOrder === 'desc' ? compareValue : -compareValue;
    });

    return filtered;
  };

  const filteredTransactions = getFilteredAndSortedTransactions();

  const stats = {
    total: transactions.length,
    credits: transactions
      .filter(tx => parseFloat(tx.details?.amount || 0) > 0)
      .reduce((sum, tx) => sum + parseFloat(tx.details?.amount || 0), 0),
    debits: Math.abs(transactions
      .filter(tx => parseFloat(tx.details?.amount || 0) < 0)
      .reduce((sum, tx) => sum + parseFloat(tx.details?.amount || 0), 0)),
    netFlow: transactions.reduce((sum, tx) => sum + parseFloat(tx.details?.amount || 0), 0),
    uniqueUsers: new Set(transactions.map(tx => tx.userId).filter(Boolean)).size
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-36 bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl"></div>
              ))}
            </div>
            <div className="h-[600px] bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl p-12 text-center max-w-md border border-white/40">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">{error}</h2>
          <p className="text-gray-600 mb-8 text-lg">Please try again later</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        
        {/* Beautiful Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-2xl p-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-xl opacity-60"></div>
                  <div className="relative p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Coin Transactions
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg font-medium">Monitor all platform transactions in real-time</p>
                </div>
              </div>
              
              {/* Enhanced Filters */}
              <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-initial lg:w-80 group">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm font-medium shadow-lg group-hover:shadow-xl"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-5 py-4 bg-white/80 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 cursor-pointer text-sm font-semibold shadow-lg hover:shadow-xl"
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credits Only</option>
                  <option value="debit">Debits Only</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-5 py-4 bg-white/80 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 cursor-pointer text-sm font-semibold shadow-lg hover:shadow-xl"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                <div className="flex gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-5 py-4 bg-white/80 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 cursor-pointer text-sm font-semibold shadow-lg hover:shadow-xl"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                    <option value="user">Sort by User</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-4 bg-white/80 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {sortOrder === 'desc' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful Stats Cards with Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Transactions */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm font-bold uppercase tracking-wider mb-2">Total Transactions</p>
              <p className="text-4xl font-black bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {stats.total.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Total Credits */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm font-bold uppercase tracking-wider mb-2">Total Credits</p>
              <p className="text-4xl font-black bg-gradient-to-br from-green-600 to-emerald-800 bg-clip-text text-transparent">
                +{stats.credits.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Total Debits */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm font-bold uppercase tracking-wider mb-2">Total Debits</p>
              <p className="text-4xl font-black bg-gradient-to-br from-red-600 to-rose-800 bg-clip-text text-transparent">
                -{stats.debits.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Net Flow */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm font-bold uppercase tracking-wider mb-2">Net Flow</p>
              <p className="text-4xl font-black bg-gradient-to-br from-amber-600 to-orange-800 bg-clip-text text-transparent">
                {stats.netFlow >= 0 ? '+' : ''}{stats.netFlow.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Unique Users */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-violet-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm font-bold uppercase tracking-wider mb-2">Unique Users</p>
              <p className="text-4xl font-black bg-gradient-to-br from-purple-600 to-violet-800 bg-clip-text text-transparent">
                {stats.uniqueUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Beautiful Transactions Table with Glassmorphism */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-2xl"></div>
          <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            {/* Table Header */}
            <div className="px-8 py-6 border-b border-gray-200/50 bg-white/40 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
                  <p className="text-gray-600 text-sm mt-1 font-medium">
                    Showing <span className="font-bold text-blue-600">{filteredTransactions.length}</span> of <span className="font-bold text-gray-800">{transactions.length}</span> transactions
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-xl sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-wider text-gray-700">
                      User Information
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-wider text-gray-700">
                      User ID
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-wider text-gray-700">
                      Type
                    </th>
                    <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-wider text-gray-700">
                      Amount
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-wider text-gray-700">
                      Balance Change
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-wider text-gray-700">
                      Transaction ID
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-wider text-gray-700">
                      Admin
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-wider text-gray-700">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => {
                      const amount = tx.details?.amount || 0;
                      const type = getTransactionType(amount);
                      const txId = tx._id || tx.id;
                      const userId = tx.userId || 'N/A';
                      
                      return (
                        <tr key={txId} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-lg opacity-40"></div>
                                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-xl">
                                  {tx.userName?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">
                                  {tx.userName || 'Unknown User'}
                                </div>
                                <div className="text-xs text-gray-600 font-medium">
                                  {tx.userEmail || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 group/id">
                              <div className="relative">
                                <div className="font-mono text-xs text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border-2 border-blue-200/50 max-w-[180px] truncate font-bold shadow-md">
                                  {userId}
                                </div>
                                <div className="absolute bottom-full left-0 mb-2 px-4 py-2 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover/id:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 shadow-2xl font-mono">
                                  {userId}
                                </div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(userId, `user-${txId}`)}
                                className="p-2 hover:bg-blue-100 rounded-xl transition-all duration-200 group-hover/id:scale-110"
                              >
                                {copiedId === `user-${txId}` ? (
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                          
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-lg ${
                              type === 'credit' 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                            }`}>
                              {type === 'credit' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                </svg>
                              )}
                              {type.toUpperCase()}
                            </span>
                          </td>
                          
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <div className={`text-xl font-black ${type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {type === 'credit' ? '+' : ''}{amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">coins</div>
                          </td>
                          
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="text-sm">
                                <div className="text-xs text-gray-500 font-medium">From</div>
                                <div className="font-bold text-gray-700">{getOldBalance(tx)}</div>
                              </div>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              <div className="text-sm">
                                <div className="text-xs text-gray-500 font-medium">To</div>
                                <div className="font-bold text-gray-900">{tx.details?.newValue || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 group/tx">
                              <div className="relative">
                                <div className="font-mono text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded-xl max-w-[140px] truncate font-medium shadow-sm">
                                  {txId || 'N/A'}
                                </div>
                                <div className="absolute bottom-full left-0 mb-2 px-4 py-2 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover/tx:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 shadow-2xl font-mono">
                                  {txId}
                                </div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(txId, txId)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                              >
                                {copiedId === txId ? (
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                          
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black shadow-lg">
                                {tx.details?.adminName?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                              <span className="text-sm text-gray-700 font-bold">
                                {tx.details?.adminName || 'System'}
                              </span>
                            </div>
                          </td>
                          
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm text-gray-700 font-bold">
                              {format(new Date(tx.timestamp || tx.createdAt), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {format(new Date(tx.timestamp || tx.createdAt), 'hh:mm a')}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-bold text-lg mb-2">No transactions found</p>
                          <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200/30">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const amount = tx.details?.amount || 0;
                  const type = getTransactionType(amount);
                  const txId = tx._id || tx.id;
                  const userId = tx.userId || 'N/A';
                  
                  return (
                    <div key={txId} className="p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-lg opacity-40"></div>
                            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-xl">
                              {tx.userName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          </div>
                          <div>
                            <div className="text-base font-bold text-gray-900">{tx.userName || 'Unknown'}</div>
                            <div className="text-xs text-gray-600 font-medium">{tx.userEmail || 'N/A'}</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-lg ${
                          type === 'credit' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                        }`}>
                          {type === 'credit' ? '↑' : '↓'} {type.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* User ID Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-200/50 mb-4 shadow-md">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs font-black text-blue-900 uppercase tracking-wide">User ID</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-blue-700 font-bold break-all">
                              {userId.length > 24 ? `${userId.substring(0, 24)}...` : userId}
                            </span>
                            <button
                              onClick={() => copyToClipboard(userId, `user-${txId}`)}
                              className="p-2 hover:bg-blue-200 rounded-xl transition-colors duration-200"
                            >
                              {copiedId === `user-${txId}` ? (
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-bold">Amount</span>
                          <div className={`text-xl font-black ${type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {type === 'credit' ? '+' : ''}{amount.toLocaleString()} <span className="text-xs">coins</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-bold">Balance</span>
                          <span className="text-sm font-bold text-gray-900">
                            {getOldBalance(tx)} → {tx.details?.newValue || 'N/A'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-bold">Admin</span>
                          <span className="text-sm font-bold text-gray-900">
                            {tx.details?.adminName || 'System'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200/50">
                          <span className="text-xs text-gray-500 font-medium">
                            {format(new Date(tx.timestamp || tx.createdAt), 'MMM dd, yyyy • hh:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-bold text-lg mb-2">No transactions found</p>
                    <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinsPage;

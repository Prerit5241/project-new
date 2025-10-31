"use client";
import { useEffect, useState } from "react";
import { apiHelpers } from "@/lib/api";
import { format } from "date-fns";

const CoinsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch all users and create a map of user data
  const fetchUsers = async () => {
    try {
      const usersList = await apiHelpers.users.list();
      const usersMap = {};
      usersList.forEach(user => {
        usersMap[user._id || user.id] = {
          email: user.email,
          role: user.role
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
            limit: 50
          }),
          fetchUsers()
        ]);
        
        let transactionsData = transactionsRes?.data?.data || transactionsRes?.data || [];
        
        transactionsData = transactionsData.map(tx => ({
          ...tx,
          userEmail: tx.userId ? (usersMap[tx.userId]?.email || 'N/A') : 'System',
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

  // Copy to clipboard function
  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const amount = tx.details?.amount || 0;
    const type = getTransactionType(amount);
    const matchesFilter = filter === 'all' || type === filter;
    const matchesSearch = !searchTerm || 
      tx.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx._id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: transactions.length,
    credits: transactions
      .filter(tx => parseFloat(tx.details?.amount || 0) > 0)
      .reduce((sum, tx) => sum + parseFloat(tx.details?.amount || 0), 0),
    debits: Math.abs(transactions
      .filter(tx => parseFloat(tx.details?.amount || 0) < 0)
      .reduce((sum, tx) => sum + parseFloat(tx.details?.amount || 0), 0)),
    netFlow: transactions.reduce((sum, tx) => sum + parseFloat(tx.details?.amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/60 backdrop-blur-sm rounded-2xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/60 backdrop-blur-sm rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-white/60 backdrop-blur-sm rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center max-w-md border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
          <p className="text-gray-600 mb-6">Please try again later</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Coin Transactions
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Track and manage all coin transactions in real-time</p>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 w-full sm:w-64 shadow-sm"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 cursor-pointer shadow-sm"
            >
              <option value="all">All Transactions</option>
              <option value="credit">Credits Only</option>
              <option value="debit">Debits Only</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Transactions */}
          <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</p>
            </div>
          </div>

          {/* Total Credits */}
          <div className="group relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Total Credits</p>
              <p className="text-3xl font-bold text-white">+{stats.credits.toLocaleString()}</p>
            </div>
          </div>

          {/* Total Debits */}
          <div className="group relative bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Total Debits</p>
              <p className="text-3xl font-bold text-white">-{stats.debits.toLocaleString()}</p>
            </div>
          </div>

          {/* Net Flow */}
          <div className="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Net Flow</p>
              <p className="text-3xl font-bold text-white">{stats.netFlow >= 0 ? '+' : ''}{stats.netFlow.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Transactions Table/Cards */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
            <p className="text-gray-600 text-sm mt-1">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Balance Change
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const amount = tx.details?.amount || 0;
                    const type = getTransactionType(amount);
                    const txId = tx._id || tx.id;
                    
                    return (
                      <tr key={txId} className="hover:bg-blue-50/30 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {tx.userName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {tx.userName || 'Unknown User'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {tx.userEmail || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            type === 'credit' 
                              ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20' 
                              : 'bg-red-100 text-red-700 ring-1 ring-red-600/20'
                          }`}>
                            {type === 'credit' ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                              </svg>
                            )}
                            {type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-lg font-bold ${type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {type === 'credit' ? '+' : ''}{amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <span className="text-gray-500">From:</span>
                            <span className="font-semibold text-gray-700 ml-1">{getOldBalance(tx)}</span>
                          </div>
                          <div className="text-sm mt-0.5">
                            <span className="text-gray-500">To:</span>
                            <span className="font-semibold text-gray-900 ml-1">{tx.details?.newValue || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded max-w-[140px] truncate">
                              {txId || 'N/A'}
                            </div>
                            <button
                              onClick={() => copyToClipboard(txId, txId)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200 group relative"
                              title="Copy Transaction ID"
                            >
                              {copiedId === txId ? (
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 font-medium">
                            {tx.details?.adminName || 'System'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {format(new Date(tx.timestamp || tx.createdAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(tx.timestamp || tx.createdAt), 'hh:mm a')}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No transactions found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200/50">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => {
                const amount = tx.details?.amount || 0;
                const type = getTransactionType(amount);
                const txId = tx._id || tx.id;
                
                return (
                  <div key={txId} className="p-6 hover:bg-blue-50/30 transition-colors duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {tx.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {tx.userName || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {tx.userEmail || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        type === 'credit' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {type === 'credit' ? '↑' : '↓'} {type.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Amount</span>
                        <span className={`text-lg font-bold ${type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {type === 'credit' ? '+' : ''}{amount.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Balance</span>
                        <span className="text-sm font-medium text-gray-900">
                          {getOldBalance(tx)} → {tx.details?.newValue || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm text-gray-600 flex-shrink-0">Transaction ID</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded max-w-[120px] truncate">
                            {txId || 'N/A'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(txId, txId)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          >
                            {copiedId === txId ? (
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Admin</span>
                        <span className="text-sm font-medium text-gray-900">
                          {tx.details?.adminName || 'System'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
                        <span className="text-xs text-gray-500">
                          {format(new Date(tx.timestamp || tx.createdAt), 'MMM dd, yyyy • hh:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No transactions found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinsPage;

"use client";

import { useState, useEffect } from "react";
import { Coins, ArrowUpRight, ArrowDownLeft, Plus, Gift, TrendingUp, Wallet, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { getToken } from "../../utils/auth";
import Link from "next/link";

export default function CoinPage() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchCoinData = async () => {
      if (!isLoggedIn) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = getToken ? getToken() : localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Fetch user profile to get coin balance
        const profileRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );

        const userData = profileRes.data?.data || {};
        setCoinBalance(userData.coins || userData.coinBalance || 0);
        setUserId(userData._id || userData.id);

        // Fetch all transactions
        const transactionsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/activities/recent`,
          {
            params: {
              type: 'coin_update',
              limit: 100
            },
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );

        const allTransactions = Array.isArray(transactionsRes.data?.data) 
          ? transactionsRes.data.data 
          : [];

        const currentUserId = userData._id || userData.id;

        const userTransactions = allTransactions
          .filter(tx => {
            const txUserId = tx.userId || (tx.details && tx.details.userId);
            return txUserId && txUserId.toString() === currentUserId.toString();
          })
          .map(tx => ({
            ...tx,
            _id: tx._id || tx.id,
            timestamp: tx.timestamp || tx.createdAt,
            details: {
              ...tx.details,
              amount: tx.details?.amount || 0,
              reason: tx.details?.reason || 'Coin transaction'
            }
          }));

        userTransactions.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB - dateA;
        });

        setTransactions(userTransactions);
      } catch (err) {
        console.error("Error fetching coin data:", err);
        setError("Failed to load coin data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
  }, [isLoggedIn]);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Calculate statistics
  const stats = {
    totalEarned: transactions.filter(tx => (tx.details?.amount || 0) > 0).reduce((sum, tx) => sum + tx.details.amount, 0),
    totalSpent: Math.abs(transactions.filter(tx => (tx.details?.amount || 0) < 0).reduce((sum, tx) => sum + tx.details.amount, 0)),
    transactionCount: transactions.length
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl blur-2xl opacity-40"></div>
              <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/40">
                <Wallet className="w-20 h-20 text-orange-500 mx-auto" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-4">
              Sign in to access your wallet
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              View your coin balance, track transactions, and manage your rewards.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <Wallet className="w-5 h-5" />
              Sign In Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl blur-xl opacity-50"></div>
              <div className="relative p-3 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl shadow-xl">
                <Wallet className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              My Wallet
            </h1>
          </div>
          <p className="text-lg text-gray-600 font-medium">Manage your coins and track your rewards</p>
        </div>

        {/* Main Balance Card with Glassmorphism */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
          <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-2xl overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-300 to-pink-400 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-300 to-pink-400 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative p-8 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Balance Section */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                      <Coins className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <p className="text-gray-600 text-sm font-bold uppercase tracking-wider">Total Balance</p>
                  </div>
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-6xl md:text-7xl font-black bg-gradient-to-br from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {coinBalance.toLocaleString()}
                    </span>
                    <span className="text-2xl font-bold text-gray-600 mb-3">coins</span>
                  </div>
                  
                  {/* User ID Badge */}
                  {userId && (
                    <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-white/40 px-4 py-2.5 rounded-2xl shadow-lg">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Your ID:</span>
                      <span className="font-mono text-sm font-bold text-gray-800 max-w-[150px] truncate">
                        {userId}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(userId, 'main-user-id')}
                        className="p-1.5 hover:bg-white/60 rounded-lg transition-all duration-200 group/copy"
                        title="Copy User ID"
                      >
                        {copiedId === 'main-user-id' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                        ) : (
                          <svg className="w-4 h-4 text-gray-600 group-hover/copy:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button className="group relative overflow-hidden bg-white/60 backdrop-blur-xl border-2 border-white/40 hover:border-orange-500/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg mb-3 inline-block">
                        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <p className="text-sm font-bold text-gray-800">Earn Coins</p>
                    </div>
                  </button>

                  <Link 
                    href="/courses"
                    className="group relative overflow-hidden bg-white/60 backdrop-blur-xl border-2 border-white/40 hover:border-purple-500/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg mb-3 inline-block">
                        <Gift className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <p className="text-sm font-bold text-gray-800">Redeem</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/30">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-xl mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Total Earned</p>
                  <p className="text-xl font-black text-green-600">+{stats.totalEarned.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-2 bg-red-100 rounded-xl mb-2">
                    <ArrowUpRight className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Total Spent</p>
                  <p className="text-xl font-black text-red-600">-{stats.totalSpent.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-xl mb-2">
                    <Clock className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Transactions</p>
                  <p className="text-xl font-black text-blue-600">{stats.transactionCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History with Beautiful Design */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-2xl"></div>
          <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            {/* Header */}
            <div className="px-6 md:px-8 py-6 bg-white/40 backdrop-blur-xl border-b border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">Transaction History</h2>
                  <p className="text-sm text-gray-600 font-medium mt-1">Track all your coin activities</p>
                </div>
                <Link 
                  href="/student/transactions"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm hover:opacity-90"
                >
                  View All
                </Link>
              </div>
            </div>
            
            {loading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-600 font-semibold">{error}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-40"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-xl">
                    <Clock className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-600 mb-6">Your transaction history will appear here once you start earning or spending coins</p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <Plus className="w-5 h-5" />
                  Start Earning
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/50">
                {transactions.map((tx) => {
                  const amount = tx.details?.amount || 0;
                  const type = amount >= 0 ? 'credit' : 'debit';
                  const description = tx.details?.reason || 'Coin transaction';
                  const date = tx.timestamp || tx.createdAt;
                  const txId = tx._id || tx.id;
                  
                  return (
                    <div key={tx._id} className="px-6 md:px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 group">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Icon */}
                          <div className="relative flex-shrink-0">
                            <div className={`absolute inset-0 ${type === 'credit' ? 'bg-green-400' : 'bg-red-400'} rounded-2xl blur-lg opacity-30`}></div>
                            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${
                              type === 'credit' 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                                : 'bg-gradient-to-br from-red-500 to-rose-500'
                            }`}>
                              {type === 'credit' ? (
                                <ArrowDownLeft className="w-7 h-7 text-white" strokeWidth={2.5} />
                              ) : (
                                <ArrowUpRight className="w-7 h-7 text-white" strokeWidth={2.5} />
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-gray-900 mb-1">{description}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                              <span className="text-gray-600 font-medium">
                                {new Date(date).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {tx.details?.adminName && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    {tx.details.adminName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-2xl font-black ${type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {type === 'credit' ? '+' : '-'}{Math.abs(amount).toLocaleString()}
                          </div>
                          <span className="text-sm font-medium text-gray-500">coins</span>
                        </div>
                      </div>
                      
                      {/* Transaction ID Card */}
                      <div className="relative group/id">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl blur-sm"></div>
                        <div className="relative bg-white/60 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transaction ID</p>
                              <div className="font-mono text-sm font-bold text-gray-800 truncate">
                                {txId}
                              </div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(txId, txId)}
                              className="flex-shrink-0 p-2.5 bg-white/80 hover:bg-blue-50 border border-gray-200 rounded-xl transition-all duration-200 hover:scale-110 group/copy"
                              title="Copy Transaction ID"
                            >
                              {copiedId === txId ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                              ) : (
                                <svg className="w-5 h-5 text-gray-600 group-hover/copy:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* About Coins */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/40 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Coins className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-gray-900">About Coins</h3>
              </div>
              <p className="text-gray-600 font-medium mb-4">
                Coins are your virtual currency on our platform. Use them to unlock premium features and content.
              </p>
              <div className="space-y-2">
                {[
                  'Complete courses and assignments',
                  'Participate in community challenges',
                  'Refer friends to the platform',
                  'Maintain learning streaks'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How to Use */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/40 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                  <Gift className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-gray-900">How to Use</h3>
              </div>
              <p className="text-gray-600 font-medium mb-4">
                Redeem your coins for exciting rewards and exclusive benefits.
              </p>
              <div className="space-y-2">
                {[
                  'Unlock premium course content',
                  'Purchase exclusive materials',
                  'Get special discounts',
                  'Access VIP community features'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

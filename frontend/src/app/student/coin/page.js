"use client";

import { useState, useEffect } from "react";
import { Coins, ArrowUpRight, ArrowDownLeft, Plus, Gift, TrendingUp, Wallet, Clock, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
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
      // Modern browsers with Clipboard API
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback to prompt if both methods fail
      try {
        window.prompt('Copy to clipboard: Ctrl+C, Enter', text);
      } catch (e) {
        console.error('Fallback copy method failed:', e);
      }
    }
  };

  const stats = {
    totalEarned: transactions.filter(tx => (tx.details?.amount || 0) > 0).reduce((sum, tx) => sum + tx.details.amount, 0),
    totalSpent: Math.abs(transactions.filter(tx => (tx.details?.amount || 0) < 0).reduce((sum, tx) => sum + tx.details.amount, 0)),
    transactionCount: transactions.length
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-orange-500 to-blue-500 rounded-3xl shadow-2xl mb-8 animate-bounce">
              <Wallet className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Your Coin Wallet
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Sign in to view your balance, track transactions, and manage your rewards.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover-scale"
            >
              <Wallet className="w-5 h-5" />
              Sign In to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-blue-500 rounded-xl shadow-lg">
            <Coins className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
            <p className="text-sm text-gray-600">Track your earnings and spending</p>
          </div>
        </div>

        {/* Main Balance Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-blue-500 p-8 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full transform -translate-x-1/3 translate-y-1/3"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Balance Info */}
                <div>
                  <p className="text-white/90 text-sm font-medium mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Total Balance
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-black text-white">
                      {coinBalance.toLocaleString()}
                    </span>
                    <span className="text-2xl font-semibold text-white/90 mb-2">coins</span>
                  </div>
                  
                  {/* User ID Badge */}
                  {userId && (
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl mt-4">
                      <span className="text-xs font-semibold text-white/80 uppercase">ID:</span>
                      <span className="font-mono text-sm font-bold text-white max-w-[150px] truncate">
                        {userId}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(userId, 'main-user-id')}
                        className="p-1 hover:bg-white/30 rounded-lg transition-all duration-200"
                        title="Copy User ID"
                      >
                        {copiedId === 'main-user-id' ? (
                          <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                        ) : (
                          <Copy className="w-4 h-4 text-white" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-xl transition-all duration-200 hover-scale border border-white/30">
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                    Earn Coins
                  </button>
                  <Link 
                    href="/courses"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-orange-500 hover:text-blue-500 font-semibold rounded-xl transition-all duration-200 hover-scale shadow-lg"
                  >
                    <Gift className="w-5 h-5" strokeWidth={2.5} />
                    Redeem
                  </Link>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/20">
                <div>
                  <p className="text-white/70 text-xs font-medium mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Total Earned
                  </p>
                  <p className="text-2xl font-bold text-white">+{stats.totalEarned.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium mb-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Total Spent
                  </p>
                  <p className="text-2xl font-bold text-white">-{stats.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Transactions
                  </p>
                  <p className="text-2xl font-bold text-white">{stats.transactionCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200/50 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              <p className="text-sm text-gray-600 mt-1">View all your coin activities</p>
            </div>
            <button className="px-4 py-2 text-sm font-semibold text-orange-500 hover:text-blue-500 hover:bg-gray-50 rounded-lg transition-all duration-200">
              View All
            </button>
          </div>
          
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
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
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Clock className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-600 mb-6">Start earning coins by completing courses and challenges</p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <Plus className="w-5 h-5" />
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const amount = tx.details?.amount || 0;
                const type = amount >= 0 ? 'credit' : 'debit';
                const description = tx.details?.reason || 'Coin transaction';
                const date = tx.timestamp || tx.createdAt;
                const txId = tx._id || tx.id;
                
                return (
                  <div key={tx._id} className="px-6 py-5 hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-blue-50/30 transition-all duration-200 group">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                          type === 'credit' 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-br from-red-400 to-rose-500'
                        }`}>
                          {type === 'credit' ? (
                            <ArrowDownLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
                          ) : (
                            <ArrowUpRight className="w-6 h-6 text-white" strokeWidth={2.5} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-gray-900 mb-1">{description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-gray-600">
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
                                <span className="text-gray-300">•</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-100 to-blue-100 text-orange-600 rounded-lg text-xs font-semibold">
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
                    
                    {/* Transaction ID */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Transaction ID</p>
                          <div className="font-mono text-sm text-gray-800 truncate">
                            {txId}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(txId, txId)}
                          className="flex-shrink-0 p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200 hover-scale"
                          title="Copy Transaction ID"
                        >
                          {copiedId === txId ? (
                            <Check className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* About Coins */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-blue-500 rounded-xl shadow-lg">
                <Coins className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">About Coins</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Earn coins by completing courses, assignments, and participating in challenges. Use them to unlock premium content.
            </p>
            <div className="space-y-3">
              {[
                'Complete courses and assignments',
                'Participate in challenges',
                'Refer friends to the platform',
                'Maintain learning streaks'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to Use */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Gift className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">How to Use</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Redeem your coins for exciting rewards, discounts, and exclusive features on our platform.
            </p>
            <div className="space-y-3">
              {[
                'Unlock premium courses',
                'Purchase exclusive materials',
                'Get special discounts',
                'Access VIP features'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

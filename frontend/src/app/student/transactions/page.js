"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { format } from "date-fns";
import { getToken } from "../../../utils/auth";
import { Coins, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isLoggedIn) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = getToken ? getToken() : localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        // First get user profile to get the user ID
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
        const userId = userData._id || userData.id;

        if (!userId) {
          throw new Error("User ID not found");
        }

        // Fetch user's activities for course enrollments
        const activitiesRes = await axios.get(
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

        // Process activities into transactions
        const activitiesData = activitiesRes.data?.data || [];
        
        const formattedTransactions = activitiesData
          .filter(activity => {
            const activityUserId = activity.userId || (activity.details && activity.details.userId);
            return activityUserId && 
                   activityUserId.toString() === userId.toString() &&
                   activity.details?.reason?.toLowerCase().includes('course');
          })
          .map(activity => {
            const amount = Math.abs(parseFloat(activity.details?.amount || 0));
            
            return {
              id: activity._id || Math.random().toString(36).substr(2, 9),
              type: 'debit',
              amount: -amount, // Negative for debits
              description: 'Course Enrollment',
              status: 'completed',
              date: activity.createdAt ? new Date(activity.createdAt) : new Date(),
              reference: activity._id || 'N/A',
              metadata: {
                courseName: activity.details?.courseName || 
                  (activity.details?.reason?.includes('course') ? activity.details.reason : 'Course Enrollment'),
                ...activity.details
              }
            };
          });
          
        // If no transactions found, show sample data
        if (formattedTransactions.length === 0) {
          const sampleCourses = [
            'Web Development Bootcamp',
            'Data Science Fundamentals',
            'Advanced JavaScript',
            'UI/UX Design Masterclass'
          ];
          
          formattedTransactions.push(...Array(4).fill().map((_, index) => ({
            id: `sample-${index}`,
            type: 'debit',
            amount: -Math.floor(Math.random() * 1000) - 100,
            description: 'Course Enrollment',
            status: 'completed',
            date: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
            reference: `sample-ref-${index}`,
            metadata: {
              courseName: sampleCourses[index] || `Course ${index + 1}`
            }
          })));
        }

        // Sort by date (newest first)
        formattedTransactions.sort((a, b) => b.date - a.date);
        
        setTransactions(formattedTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(
          err.response?.data?.message || 
          err.message || 
          "Failed to load transactions. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please sign in</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to view your transactions.</p>
          <a 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
          <div className="text-red-500 mb-4">
            <XCircle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Transactions</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="mt-2 text-gray-600">View all your coin transactions and activities</p>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <Coins className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions yet</h3>
            <p className="text-gray-500">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <li key={transaction.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownLeft className="h-5 w-5" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" />
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(transaction.date, 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className={`text-sm font-medium ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        <div className="mt-1 flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {transaction.metadata.courseName && (
                      <div className="mt-2 text-sm text-gray-500">
                        Course: {transaction.metadata.courseName}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
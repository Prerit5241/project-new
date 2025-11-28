"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import axios from "axios";

const CoinsTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchCoinTransactions = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/activities/recent', {
          params: {
            type: 'coin_update',
            limit: 1000
          }
        });

        // Process the response data
        const transactionsData = response.data?.data || response.data || [];
        
        const formattedTransactions = transactionsData.map(tx => ({
          id: tx._id || Math.random().toString(36).substr(2, 9),
          userId: tx.userId || tx.user?._id || 'N/A',
          userName: tx.user?.name || tx.userName || 'Unknown User',
          action: tx.details?.action || 'Credited',
          amount: Math.abs(parseFloat(tx.details?.amount) || 0),
          oldBalance: parseFloat(tx.details?.oldValue) || 0,
          newBalance: parseFloat(tx.details?.newValue) || 0,
          performedBy: tx.performedBy?.name || 'System',
          date: tx.createdAt ? new Date(tx.createdAt) : new Date(),
          reason: tx.details?.reason || 'N/A'
        }));

        // Sort by date descending (newest first)
        const sortedTransactions = [...formattedTransactions].sort((a, b) => b.date - a.date);
        
        setTransactions(sortedTransactions);
        setError(null);
      } catch (err) {
        console.error('Error fetching coin transactions:', err);
        setError('Failed to load coin transactions. Please try again later.');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoinTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    if (!tx) return false;
    if (!searchTerm.trim()) return true; // Show all if search is empty
    
    const searchLower = searchTerm.toLowerCase().trim();
    const searchableFields = [
      String(tx.id || '').toLowerCase(),
      String(tx.userName || '').toLowerCase(),
      String(tx.userId || '').toLowerCase(),
      String(tx.action || '').toLowerCase(),
      String(tx.amount || '').toLowerCase(),
      String(tx.reason || '').toLowerCase(),
      format(tx.date, 'MMM d, yyyy h:mm a').toLowerCase(),
      String(tx.performedBy || '').toLowerCase()
    ];
    
    // Search across all fields
    return searchableFields.some(field => field.includes(searchLower));
  });

  // Show all transactions without pagination
  const currentTransactions = filteredTransactions;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Coin Transactions</h1>
          <p className="text-gray-600">Recent coin credit/debit history</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <div className="px-4 py-2 text-sm text-gray-600">
            All transactions shown
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search by user, ID, or amount..."
              className="w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-[70vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Old Balance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">New Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTransactions.length > 0 ? (
                  currentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {tx.userName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {tx.userName}
                            </div>
                            <div className="text-sm text-gray-500">
                              id: {tx.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tx.action === 'Credited' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tx.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className={tx.action === 'Credited' ? 'text-green-600' : 'text-red-600'}>
                          {tx.action === 'Credited' ? '+' : '-'}{tx.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {tx.oldBalance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className="text-gray-900">{tx.newBalance}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.performedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(tx.date, 'MMM d, yyyy h:mm a')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Showing all {filteredTransactions.length} transactions
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinsTransactionsPage;
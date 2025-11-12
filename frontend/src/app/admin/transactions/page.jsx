"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [copiedId, setCopiedId] = useState(null);
  
  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
  };

  // Function to get the auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        const apiUrl = `${window.location.origin}/api/transactions?limit=100`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
        
        if (response.status === 401) {
          // Handle unauthorized (token expired or invalid)
          // Optionally redirect to login or refresh token
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch transactions');
        }
        
        let responseData;
        try {
          responseData = await response.json();
          console.log('API Response:', responseData); // Debug log
          
          // Handle different possible response formats
          let transactionsData = [];
          
          if (Array.isArray(responseData)) {
            // Case 1: Response is directly an array
            transactionsData = responseData;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            // Case 2: Response has a data property containing the array
            transactionsData = responseData.data;
          } else if (responseData.transactions && Array.isArray(responseData.transactions)) {
            // Case 3: Response has a transactions property
            transactionsData = responseData.transactions;
          } else {
            console.error('Unexpected response format:', responseData);
            throw new Error('Unexpected response format from server');
          }
          
          // Process the transactions
          const formattedTransactions = transactionsData.map(tx => {
            // Ensure we have all required fields with defaults
            const txData = {
              ...tx,
              id: tx._id || tx.id || Math.random().toString(36).substr(2, 9),
              date: tx.createdAt ? new Date(tx.createdAt) : new Date(),
              amount: Math.abs(parseFloat(tx.amount) || 0),
              userName: tx.user?.name || tx.userName || 'Unknown User',
              userEmail: tx.user?.email || tx.userEmail || 'unknown@example.com',
              courseName: tx.course?.title || tx.courseName || `Course ID: ${tx.courseId || tx.course?.id || 'N/A'}`,
              courseId: tx.courseId || tx.course?.id || 'N/A',
              status: tx.status || 'completed',
              referenceId: tx.referenceId || 'N/A',
              type: tx.type || 'debit',
              metadata: tx.metadata || {}
            };
            
            return txData;
          });
          
          // If we get here, the response was successfully processed
          const sortedTransactions = [...formattedTransactions].sort((a, b) => 
            sortOrder === 'desc' 
              ? b.date - a.date 
              : a.date - b.date
          );

          setTransactions(sortedTransactions);
          setError(null);
          return sortedTransactions;
          
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          const errorText = await response.text().catch(() => 'Could not read response text');
          console.error('Response text:', errorText);
          throw new Error('Error processing server response: ' + errorText);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions. Please try again later.');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [sortOrder]);

  const filteredTransactions = transactions.filter(tx => {
    if (!tx) return false;
    if (!searchTerm.trim()) return true; // Show all if search is empty
    
    const searchLower = searchTerm.toLowerCase().trim();
    const searchableFields = [
      String(tx.id || '').toLowerCase(),
      String(tx.userName || '').toLowerCase(),
      String(tx.userEmail || '').toLowerCase(),
      String(tx.courseName || '').toLowerCase(),
      String(tx.courseId || '').toLowerCase(),
      String(tx.reason || '').toLowerCase(),
      String(tx.referenceId || '').toLowerCase(),
      tx.amount?.toString() || '',
      format(tx.date, 'MMM d, yyyy h:mm a').toLowerCase(),
      String(tx.status || '').toLowerCase(),
      String(tx.transactionId || '').toLowerCase(),
    ];
    
    // Search across all fields
    return searchableFields.some(field => field.includes(searchLower));
  });

  // Get current transactions
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

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
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by ID, name, email, course, amount..."
                className="w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
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
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'} found
              {searchTerm && (
                <span className="text-gray-800 font-medium"> for "{searchTerm}"</span>
              )}
            </div>
            <select
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date & Time
                      {sortBy === 'date' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('userName')}
                  >
                    <div className="flex items-center">
                      User
                      {sortBy === 'userName' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Course
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Transaction ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTransactions.length > 0 ? (
                  currentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(transaction.date, 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {transaction.userName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.userName} (ID: {transaction.userId || 'N/A'})
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.userEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.reason || (transaction.courseName ? `Enrolled in course: ${transaction.courseName}` : 'No course information')}
                          {transaction.courseId && transaction.courseId !== 'N/A' && (
                            <div className="text-xs text-gray-500 mt-1">Course ID: {transaction.courseId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className="text-red-600">
                          -${transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative group">
                          <button
                            onClick={() => copyToClipboard(transaction.id)}
                            className="text-xs font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700 relative"
                            title="Click to copy Transaction ID"
                          >
                            {transaction.id.substring(0, 6)}...{transaction.id.substring(transaction.id.length - 4)}
                            {copiedId === transaction.id && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                Copied!
                                <svg className="absolute text-black h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                                  <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                                </svg>
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan="6" 
                    className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => paginate(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      >
                        «
                      </button>
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      >
                        ‹
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Show page numbers around current page
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => paginate(pageNum)}
                            className={`px-3 py-1 rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-100'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      >
                        ›
                      </button>
                      <button
                        onClick={() => paginate(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      >
                        »
                      </button>
                    </div>
                    <div className="text-center mt-2 text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
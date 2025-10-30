"use client";

import { useEffect, useMemo, useState } from "react";
import api, { apiHelpers } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FaCoins } from "react-icons/fa";
import { getToken } from "@/utils/auth";

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "instructor", label: "Instructor" },
  { value: "admin", label: "Admin" },
];

function RoleBadge({ role }) {
  const colors = {
    admin: "bg-purple-100 text-purple-700",
    instructor: "bg-blue-100 text-blue-700",
    student: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[role] || "bg-gray-100 text-gray-700"
      }`}
    >
      {role?.charAt(0).toUpperCase() + role?.slice(1) || "Unknown"}
    </span>
  );
}

function UserForm({ mode = 'create', initialData = {}, onSubmit, onCancel, loading: isLoading = false }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: initialData?.role || "student",
    password: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        role: initialData.role || "student",
        password: "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (mode === "create" && !formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="John Doe"
            disabled={isLoading}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="user@example.com"
            disabled={isLoading || mode === "edit"}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password {mode === "edit" && <span className="text-gray-400">(optional)</span>}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            placeholder={mode === "create" ? "••••••••" : "Leave blank to keep current password"}
            disabled={isLoading}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Saving...
            </span>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {mode === "create" ? "Create User" : "Update User"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function UserRow({ user, onEdit, onDelete, onManageCoins }) {
  return (
    <tr key={user.id} className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <RoleBadge role={user.role} />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <FaCoins className="text-yellow-500 mr-1" />
          <span className="font-medium">{user.coins || 0}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {new Date(user.createdAt || user.joined || Date.now()).toLocaleDateString()}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-3">
        <button
          onClick={() => onEdit(user)}
          className="text-blue-600 hover:text-blue-900"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(user)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
        <button
          onClick={() => onManageCoins(user)}
          className="text-yellow-600 hover:text-yellow-800"
          title="Manage Coins"
        >
          <FaCoins className="inline mr-1" />
          Manage
        </button>
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [coinDialog, setCoinDialog] = useState({ open: false, user: null, amount: '', action: 'add' });
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching users from:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
      
      // Log the exact URL being called
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/prerit`;
      console.log('Full API URL:', apiUrl);
      
      // Make the API call directly to see the raw response
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Log the raw response
      const responseData = await response.json();
      console.log('Raw API response:', responseData);
      
      // Use the helper function but with better error handling
      const usersData = await apiHelpers.users.list();
      console.log('Processed users data:', usersData);
      
      if (!usersData || !Array.isArray(usersData)) {
        console.error('Expected an array of users but got:', usersData);
        toast.error('Invalid response format from server');
        setUsers([]);
        return;
      }
      
      // Transform the data to ensure consistent structure
      const formattedUsers = usersData.map(user => {
        const formattedUser = {
          id: user._id || user.id,
          _id: user._id || user.id, // Keep _id for backend operations
          name: user.name || 'No Name',
          email: user.email || 'No Email',
          role: user.role || 'student',
          coins: user.coins || 0,
          preferences: user.preferences || {},
          ...user // Spread the rest of the user data
        };
        console.log('Formatted user:', formattedUser);
        return formattedUser;
      });
      
      console.log('Setting users state with:', formattedUsers.length, 'users');
      setUsers(formattedUsers);
      
      // Debug: Check if users are set in state after a small delay
      setTimeout(() => {
        console.log('Current users in state:', users);
      }, 1000);
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error(`Failed to load users: ${err.message}`);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.role?.toLowerCase().includes(term) ||
          user.coins?.toString().includes(term)
      );
    }
    
    // Apply role filter
    if (roleFilter && roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    return result;
  }, [users, searchTerm, roleFilter]);

  const handleCreate = async (data) => {
    setIsLoading(true);
    try {
      await apiHelpers.users.create(data);
      toast.success("User created successfully");
      setShowForm(false);
      setIsCreating(false);
      await loadUsers();
    } catch (err) {
      console.error("Create user error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const payload = { ...data };
      if (!payload.password) {
        delete payload.password;
      }
      await apiHelpers.users.update(currentUser._id || currentUser.id, payload);
      toast.success("User updated successfully");
      setCurrentUser(null);
      await loadUsers();
    } catch (err) {
      console.error("Update user error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    setIsLoading(true);
    try {
      const userId = deleteDialog.user._id || deleteDialog.user.id;
      if (!userId) {
        throw new Error('User ID is missing');
      }
      
      // Use the correct API helper method
      await apiHelpers.users.remove(userId);
      
      toast.success("User deleted successfully");
      setDeleteDialog({ open: false, user: null });
      await loadUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete user";
      console.error('Error details:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoinUpdate = async () => {
    if (!coinDialog.user || !coinDialog.amount || isNaN(coinDialog.amount)) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseInt(coinDialog.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      const userId = coinDialog?.user?._id || coinDialog?.user?.id;
      if (!userId) {
        throw new Error('Could not find user ID. Please refresh the page and try again.');
      }
      
      // Determine the final amount (positive for add, negative for subtract)
      const amountToUpdate = coinDialog.action === 'add' ? amount : -amount;
      
      // Use the API helper to update coins
      const response = await api.put(`/api/users/${userId}/coins`, {
        amount: amountToUpdate,
        reason: `Admin ${coinDialog.action}ed ${amount} coins`
      });

      if (response.data && response.data.success) {
        // Update the local state with the new coin balance
        const updatedUsers = users.map(user => {
          if (user._id === userId || user.id === userId) {
            return {
              ...user,
              coins: (user.coins || 0) + amountToUpdate
            };
          }
          return user;
        });
        
        setUsers(updatedUsers);
        toast.success(`Successfully ${coinDialog.action === 'add' ? 'added' : 'subtracted'} ${amount} coins`);
        setCoinDialog({ open: false, user: null, amount: '', action: 'add' });
      } else {
        throw new Error(response.data?.message || 'Failed to update coins');
      }
    } catch (error) {
      console.error('Error updating coins:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update coins';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-sm text-gray-600">View, create, edit, and delete users in the system.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              {users.length} total users
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setIsCreating(true);
                setCurrentUser(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:from-orange-600 hover:to-blue-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New User
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Search by name or email"
            />
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 112.5 9a7.5 7.5 0 0114.15 7.65z" />
            </svg>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="all">All roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}s
              </option>
            ))}
          </select>

          <button
            onClick={() => loadUsers()}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-blue-500 hover:text-blue-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 114.582 9M20 12a8.001 8.001 0 01-8 8v0" />
            </svg>
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500"></div>
              <p className="text-sm text-gray-500">Loading users...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-blue-100 text-blue-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No users found</h3>
              <p className="mt-2 text-sm text-gray-600">Try adjusting your search or add a new user.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coins
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user, index) => (
                  <UserRow
                    key={user._id ?? user.id ?? `user-${index}`}
                    user={user}
                    onEdit={(user) => {
                      setCurrentUser(user);
                      setShowForm(true);
                      setIsCreating(false);
                    }}
                    onDelete={(user) => setDeleteDialog({ open: true, user })}
                    onManageCoins={(user) => setCoinDialog({ open: true, user, amount: '', action: 'add' })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isCreating ? "Create New User" : "Edit User"}
              </h2>
              <p className="text-sm text-gray-500">
                {isCreating
                  ? "Fill out the details below to add a new user with the desired role."
                  : "Update the user details and role. Leave password blank to keep the current password."}
              </p>
            </div>

            <UserForm
              mode={isCreating ? "create" : "edit"}
              initialData={currentUser}
              onSubmit={isCreating ? handleCreate : handleUpdate}
              onCancel={() => {
                setShowForm(false);
                setCurrentUser(null);
                setIsCreating(false);
              }}
              loading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Coin Management Dialog */}
      {coinDialog.open && coinDialog.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-medium text-gray-900">Manage {coinDialog.user.name}'s Coins</h3>
            <p className="mt-2 text-sm text-gray-600">
              Current balance: <span className="font-medium">{coinDialog.user.coins || 0} coins</span>
            </p>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {coinDialog.action === 'add' ? 'Add' : 'Subtract'} Coins
                </label>
                <div className="flex rounded-md shadow-sm">
                  <div className="relative flex-grow focus-within:z-10">
                    <input
                      type="number"
                      min="1"
                      value={coinDialog.amount}
                      onChange={(e) => setCoinDialog({...coinDialog, amount: e.target.value})}
                      className="block w-full rounded-l-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter amount"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCoinDialog({...coinDialog, action: coinDialog.action === 'add' ? 'subtract' : 'add'})}
                    className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    {coinDialog.action === 'add' ? 'Add' : 'Subtract'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCoinDialog({ open: false, user: null, amount: '', action: 'add' })}
                disabled={isLoading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCoinUpdate}
                disabled={isLoading || !coinDialog.amount}
                className="rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Coins'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Dialog */}
      {deleteDialog.open && deleteDialog.user && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete {deleteDialog.user.name || 'this user'}? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteDialog({ open: false, user: null })}
                disabled={isLoading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

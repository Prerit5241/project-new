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
    admin: "bg-gradient-to-r from-purple-500 to-pink-500 text-white ring-2 ring-purple-200",
    instructor: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white ring-2 ring-blue-200",
    student: "bg-gradient-to-r from-green-500 to-emerald-500 text-white ring-2 ring-green-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`block w-full rounded-xl border-2 px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none ${
              errors.name ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
            }`}
            placeholder="John Doe"
            disabled={isLoading}
          />
          {errors.name && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`block w-full rounded-xl border-2 px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none ${
              errors.email ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
            } ${mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}
            placeholder="user@example.com"
            disabled={isLoading || mode === "edit"}
          />
          {errors.email && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.email}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none cursor-pointer"
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password {mode === "edit" && <span className="text-gray-400 font-normal">(optional)</span>}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`block w-full rounded-xl border-2 px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none ${
              errors.password ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
            }`}
            placeholder={mode === "create" ? "••••••••" : "Leave blank to keep current password"}
            disabled={isLoading}
          />
          {errors.password && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.password}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Saving...
            </span>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {mode === "create" ? "Create User" : "Update User"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function UserRow({ user, onEdit, onDelete, onManageCoins, copiedId, onCopyId }) {
  const userId = user._id || user.id;
  
  return (
    <tr className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
              <span className="text-white font-bold text-base">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 text-sm truncate">{user.name}</div>
            <div className="text-gray-500 text-xs truncate">{user.email}</div>
          </div>
        </div>
      </td>
      
      {/* User ID Column with Copy Functionality */}
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-2 group/id max-w-[180px]">
          <div className="relative flex-1">
            <div className="font-mono text-xs text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-lg border border-blue-200/50 truncate font-medium">
              {userId}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/id:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 shadow-xl">
              {userId}
              <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          <button
            onClick={() => onCopyId(userId)}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-all duration-200 flex-shrink-0"
            title="Copy User ID"
          >
            {copiedId === userId ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </td>
      
      <td className="whitespace-nowrap px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      
      <td className="whitespace-nowrap px-4 py-3">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 rounded-lg">
          <FaCoins className="text-amber-600 text-base" />
          <span className="font-bold text-amber-900 text-sm">{user.coins || 0}</span>
        </div>
      </td>
      
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
        {new Date(user.createdAt || user.joined || Date.now()).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </td>
      
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            onClick={() => onEdit(user)}
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all duration-200"
            title="Edit user"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onManageCoins(user)}
            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-all duration-200"
            title="Manage coins"
          >
            <FaCoins className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
            title="Delete user"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

// Mobile Card Component with User ID
function UserCard({ user, onEdit, onDelete, onManageCoins, copiedId, onCopyId }) {
  const userId = user._id || user.id;
  
  return (
    <div className="p-5 hover:bg-blue-50/30 transition-colors duration-200 border-b border-gray-200/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
        <RoleBadge role={user.role} />
      </div>
      
      {/* User ID Section - Prominent in Mobile */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200/50 mb-3">
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">User ID</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-blue-700 font-semibold break-all">
              {userId && (userId.length > 24 ? `${userId.substring(0, 24)}...` : userId) || 'N/A'}
            </span>
            <button
              onClick={() => onCopyId(userId)}
              className="p-1.5 hover:bg-blue-200 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              {copiedId === userId ? (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 font-medium">Coins</span>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1 rounded-lg">
            <FaCoins className="text-amber-600 text-sm" />
            <span className="font-bold text-amber-900 text-sm">{user.coins || 0}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 font-medium">Joined</span>
          <span className="text-sm text-gray-900">
            {new Date(user.createdAt || user.joined || Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        
        <div className="flex gap-2 pt-3 border-t border-gray-200/50">
          <button
            onClick={() => onEdit(user)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200 text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => onManageCoins(user)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all duration-200 text-sm font-semibold"
          >
            <FaCoins className="w-4 h-4" />
            Coins
          </button>
          <button
            onClick={() => onDelete(user)}
            className="px-4 py-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching users from:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/prerit`;
      console.log('Full API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const responseData = await response.json();
      console.log('Raw API response:', responseData);
      
      const usersData = await apiHelpers.users.list();
      console.log('Processed users data:', usersData);
      
      if (!usersData || !Array.isArray(usersData)) {
        console.error('Expected an array of users but got:', usersData);
        toast.error('Invalid response format from server');
        setUsers([]);
        return;
      }
      
      const formattedUsers = usersData.map(user => {
        const formattedUser = {
          id: user._id || user.id,
          _id: user._id || user.id,
          name: user.name || 'No Name',
          email: user.email || 'No Email',
          role: user.role || 'student',
          coins: user.coins || 0,
          preferences: user.preferences || {},
          ...user
        };
        console.log('Formatted user:', formattedUser);
        return formattedUser;
      });
      
      console.log('Setting users state with:', formattedUsers.length, 'users');
      setUsers(formattedUsers);
      
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUsers();
      toast.success("Users refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh users");
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleCopyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success("User ID copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error("Failed to copy ID");
    }
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.role?.toLowerCase().includes(term) ||
          user.coins?.toString().includes(term) ||
          String(user._id || user.id || '').toLowerCase().includes(term)
      );
    }
    
    if (roleFilter && roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    return result;
  }, [users, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    const totalCoins = users.reduce((sum, user) => sum + (user.coins || 0), 0);
    const roleCount = {};
    ROLE_OPTIONS.forEach(role => {
      roleCount[role.value] = users.filter(u => u.role === role.value).length;
    });
    
    return {
      total: users.length,
      totalCoins,
      roleCount
    };
  }, [users]);

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
      
      const amountToUpdate = coinDialog.action === 'add' ? amount : -amount;
      
      const response = await api.put(`/api/users/${userId}/coins`, {
        amount: amountToUpdate,
        reason: `Admin ${coinDialog.action}ed ${amount} coins`
      });

      if (response.data && response.data.success) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 md:p-6">
      {/* Full-width container with max-width constraint */}
      <div className="max-w-[1920px] mx-auto space-y-6">
        
        {/* Compact Header Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-5 md:p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                👥 User Management
              </h1>
              <p className="text-gray-600 text-sm md:text-base">Manage users, roles, and coin balances efficiently</p>
            </div>
            
            <button
              onClick={() => {
                setShowForm(true);
                setIsCreating(true);
                setCurrentUser(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>
        </div>

        {/* Compact Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-white/80 text-xs font-medium mb-1">Total Users</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{stats.total}</p>
            </div>
          </div>

          {/* Total Coins */}
          <div className="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                  <FaCoins className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-white/80 text-xs font-medium mb-1">Total Coins</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{stats.totalCoins.toLocaleString()}</p>
            </div>
          </div>

          {/* Admins */}
          <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <p className="text-white/80 text-xs font-medium mb-1">Admins</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{stats.roleCount.admin || 0}</p>
            </div>
          </div>

          {/* Students */}
          <div className="group relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <p className="text-white/80 text-xs font-medium mb-1">Students</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{stats.roleCount.student || 0}</p>
            </div>
          </div>
        </div>

        {/* Users Table - Full Width */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Compact Filters */}
          <div className="p-4 md:p-5 border-b border-gray-200/50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="relative md:col-span-8">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  placeholder="Search by name, email, role, ID, or coins..."
                />
                <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 112.5 9a7.5 7.5 0 0114.15 7.65z" />
                </svg>
              </div>

              <div className="md:col-span-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer transition-all duration-200"
                >
                  <option value="all">All Roles</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}s
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full group relative flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-70 disabled:cursor-not-allowed"
                  title="Refresh users"
                >
                  <svg 
                    className={`h-5 w-5 transition-transform duration-500 ${
                      isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2.5" 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="mt-3 text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> of <span className="font-semibold text-gray-900">{users.length}</span> users
            </div>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
                <p className="text-sm font-medium text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center p-8">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                  <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filters, or create a new user.</p>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setIsCreating(true);
                    setCurrentUser(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create First User
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className="bg-gray-50/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                        User ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                        Coins
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                        Joined
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50 bg-white">
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
                        copiedId={copiedId}
                        onCopyId={handleCopyId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {filteredUsers.map((user, index) => (
                  <UserCard
                    key={user._id ?? user.id ?? `user-${index}`}
                    user={user}
                    onEdit={(user) => {
                      setCurrentUser(user);
                      setShowForm(true);
                      setIsCreating(false);
                    }}
                    onDelete={(user) => setDeleteDialog({ open: true, user })}
                    onManageCoins={(user) => setCoinDialog({ open: true, user, amount: '', action: 'add' })}
                    copiedId={copiedId}
                    onCopyId={handleCopyId}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isCreating ? "Create New User" : "Edit User"}
              </h2>
              <p className="text-gray-600">
                {isCreating
                  ? "Fill out the details below to add a new user to your platform"
                  : "Update user information and manage their role"}
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

      {/* Coin Management Modal */}
      {coinDialog.open && coinDialog.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl">
                  <FaCoins className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Manage Coins</h3>
                  <p className="text-sm text-gray-600">{coinDialog.user.name}</p>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <div className="flex items-center gap-2">
                  <FaCoins className="text-amber-500 text-xl" />
                  <span className="text-2xl font-bold text-gray-900">{coinDialog.user.coins || 0}</span>
                  <span className="text-gray-500">coins</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={coinDialog.amount}
                    onChange={(e) => setCoinDialog({...coinDialog, amount: e.target.value})}
                    className="flex-1 block rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200"
                    placeholder="Enter amount"
                  />
                  <button
                    type="button"
                    onClick={() => setCoinDialog({...coinDialog, action: coinDialog.action === 'add' ? 'subtract' : 'add'})}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      coinDialog.action === 'add'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                        : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600'
                    }`}
                  >
                    {coinDialog.action === 'add' ? '+ Add' : '- Subtract'}
                  </button>
                </div>
              </div>

              {coinDialog.amount && !isNaN(coinDialog.amount) && parseInt(coinDialog.amount) > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">New Balance Preview</p>
                  <div className="flex items-center gap-2">
                    <FaCoins className="text-amber-500" />
                    <span className="text-lg font-bold text-gray-900">
                      {(coinDialog.user.coins || 0) + (coinDialog.action === 'add' ? parseInt(coinDialog.amount) : -parseInt(coinDialog.amount))}
                    </span>
                    <span className="text-gray-500 text-sm">coins</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCoinDialog({ open: false, user: null, amount: '', action: 'add' })}
                disabled={isLoading}
                className="rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCoinUpdate}
                disabled={isLoading || !coinDialog.amount}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Coins'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteDialog.open && deleteDialog.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-100">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Delete User</h3>
              <p className="text-gray-600 text-center">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteDialog.user.name}</span>? This action cannot be undone and will permanently remove all associated data.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteDialog({ open: false, user: null })}
                disabled={isLoading}
                className="rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

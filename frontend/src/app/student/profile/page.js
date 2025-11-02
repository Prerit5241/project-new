"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiHelpers } from "@/lib/api";
import { Mail, Hash, User, Clock, Shield, Award, Edit2, Save, X, Calendar, UserCircle } from "lucide-react";
import toast from "react-hot-toast";

function formatDate(date) {
  if (!date) return "—";
  try {
    const dateObj = new Date(date);
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "—";
    }
    const datePart = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const timePart = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} at ${timePart}`;
  } catch {
    return "—";
  }
}

export default function StudentProfilePage() {
  const { user, setUser } = useAuth();
  const [studentInfo, setStudentInfo] = useState({
    name: "",
    email: "",
    id: "",
    createdAt: "",
    updatedAt: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hydrateProfile = async () => {
      if (!user) {
        // If no user is logged in, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }

      try {
        setLoadingProfile(true);
        
        // First try to get profile from the API
        try {
          const response = await apiHelpers.users.getProfile();
          const payload = response?.data?.data || response?.data || {};
          
          if (payload && (payload.id || payload._id)) {
            const normalized = {
              name: payload.name || user?.name || "Student",
              email: payload.email || user?.email || "Not provided",
              id: payload.id || payload._id || user?.id || user?._id || "Unknown",
              // Only use existing timestamps, don't create new ones
              createdAt: payload.createdAt || user?.createdAt || null,
              updatedAt: payload.updatedAt || user?.updatedAt || null,
            };
            setStudentInfo(normalized);
            setFormData({ name: normalized.name, email: normalized.email });
            return;
          }
        } catch (apiError) {
          console.warn('Failed to fetch profile from API, falling back to auth context:', apiError);
          // Continue to fallback to auth context user data
        }

        // Fallback to user data from auth context
        if (user) {
          const normalized = {
            name: user.name || "Student",
            email: user.email || "Not provided",
            id: user.id || user._id || "Unknown",
            // Only use existing timestamps, don't create new ones
            createdAt: user.createdAt || user.dateJoined || null,
            updatedAt: user.updatedAt || null,
          };
          setStudentInfo(normalized);
          setFormData({ name: normalized.name, email: normalized.email });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        
        // Show specific error message based on error status
        if (error.response) {
          if (error.response.status === 403) {
            toast.error('You do not have permission to view this profile');
          } else if (error.response.status === 401) {
            toast.error('Please log in to view your profile');
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          } else {
            toast.error('Failed to load profile data');
          }
        } else {
          // Fallback to auth/local storage data if API fails
          const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              setStudentInfo({
                name: parsed?.name || "Student",
                email: parsed?.email || "Not provided",
                id: parsed?.id || parsed?._id || "Unknown",
                createdAt: parsed?.createdAt || null,
                updatedAt: parsed?.updatedAt || null,
              });
              return;
            } catch (e) {
              console.error('Error parsing stored user data:', e);
            }
          }
          toast.error('Failed to load profile data. Please try again.');
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    hydrateProfile();
  }, [user]);

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
    setFormData({ name: studentInfo.name, email: studentInfo.email });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    const payload = { 
      name: formData.name.trim(), 
      email: formData.email.trim() 
    };

    try {
      setSaving(true);
      
      // Try to update via API first
      let updated = { ...payload };
      try {
        const response = await apiHelpers.users.updateProfile(payload);
        updated = response?.data?.data || response?.data || payload;
      } catch (apiError) {
        console.warn('Failed to update profile via API, updating locally:', apiError);
        // Continue with local update
      }

      const normalized = {
        ...studentInfo,
        name: updated.name || payload.name,
        email: updated.email || payload.email,
        updatedAt: new Date().toISOString(),
      };

      // Update local state
      setStudentInfo(normalized);
      setFormData({ name: normalized.name, email: normalized.email });
      setIsEditing(false);

      // Update auth context
      if (setUser && typeof setUser === 'function') {
        setUser(prevUser => ({
          ...prevUser,
          name: normalized.name,
          email: normalized.email,
          updatedAt: normalized.updatedAt,
        }));
      }

      // Update localStorage
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...parsed,
                name: normalized.name,
                email: normalized.email,
                updatedAt: normalized.updatedAt,
              })
            );
          } catch (e) {
            console.error('Error updating local storage:', e);
          }
        }
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // More specific error messages
      if (error.response) {
        if (error.response.status === 403) {
          toast.error("You don't have permission to update this profile");
        } else if (error.response.status === 401) {
          toast.error("Please log in to update your profile");
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        } else {
          toast.error(error.response.data?.message || "Failed to update profile");
        }
      } else {
        toast.error("Network error. Changes saved locally but may not be synced with the server.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border-2 border-white/30">
                    <UserCircle className="w-12 h-12" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-indigo-600"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    {loadingProfile ? "Loading..." : studentInfo.name}
                  </h1>
                  <p className="text-white/80 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Student Account
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="group relative overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white border border-white/30 hover:bg-white/30 transition-all duration-200"
                      disabled={saving}
                    >
                      <span className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </span>
                    </button>
                    <button
                      type="submit"
                      form="student-profile-form"
                      className="group relative overflow-hidden rounded-xl bg-white text-indigo-600 px-5 py-2.5 text-sm font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-60"
                      disabled={saving}
                    >
                      <span className="flex items-center gap-2">
                        {saving ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="group relative overflow-hidden rounded-xl bg-white text-indigo-600 px-5 py-2.5 text-sm font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Personal Information
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Your profile details and account information
                </p>
              </div>
              
              <div className="p-6">
                {loadingProfile ? (
                  <ProfileSkeleton />
                ) : (
                  <form id="student-profile-form" onSubmit={handleSave} className="space-y-4">
                    <InfoRow
                      icon={<User className="w-5 h-5" />}
                      label="Full Name"
                      value={studentInfo.name}
                      isEditing={isEditing}
                      iconBg="from-blue-500 to-cyan-500"
                      inputProps={{
                        name: "name",
                        value: formData.name,
                        onChange: handleInputChange,
                        placeholder: "Enter your full name",
                      }}
                    />
                    <InfoRow
                      icon={<Mail className="w-5 h-5" />}
                      label="Email Address"
                      value={studentInfo.email}
                      isEditing={isEditing}
                      iconBg="from-purple-500 to-pink-500"
                      inputProps={{
                        name: "email",
                        value: formData.email,
                        onChange: handleInputChange,
                        placeholder: "your.email@example.com",
                        type: "email",
                      }}
                    />
                    <InfoRow 
                      icon={<Hash className="w-5 h-5" />} 
                      label="Student ID" 
                      value={studentInfo.id}
                      iconBg="from-orange-500 to-red-500"
                    />
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Timeline */}
          <div className="space-y-6">
            {/* Account Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Account Status
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Account Status</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Active</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Role</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Student</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Timeline
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {loadingProfile ? (
                  <TimelineSkeleton />
                ) : (
                  <>
                    <TimelineItem
                      icon={<Calendar className="w-4 h-4" />}
                      label="Account Created"
                      date={formatDate(studentInfo.createdAt)}
                      color="from-blue-500 to-cyan-500"
                    />
                    <TimelineItem
                      icon={<Clock className="w-4 h-4" />}
                      label="Last Updated"
                      date={formatDate(studentInfo.updatedAt)}
                      color="from-purple-500 to-pink-500"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, isEditing = false, inputProps = {}, iconBg = "from-indigo-500 to-purple-500" }) {
  return (
    <div className="group relative p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${iconBg} text-white shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {label}
          </p>
          {isEditing && inputProps.name ? (
            <input
              className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all"
              {...inputProps}
            />
          ) : (
            <p className="text-base font-semibold text-gray-900 dark:text-white break-all leading-relaxed">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ icon, label, date, color = "from-gray-500 to-gray-600" }) {
  return (
    <div className="relative flex items-start gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{date}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((key) => (
        <div key={key} className="animate-pulse p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((key) => (
        <div key={key} className="animate-pulse flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiHelpers } from "@/lib/api";
import { Mail, Hash, User, Clock } from "lucide-react";
import toast from "react-hot-toast";

function formatDate(date) {
  if (!date) return "—";
  try {
    const dateObj = new Date(date);
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
    return date;
  }
}

export default function StudentProfilePage() {
  const { user } = useAuth();
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
      try {
        setLoadingProfile(true);
        const response = await apiHelpers.users.getProfile();
        const payload = response?.data?.data || response?.data || {};
        if (payload) {
          const normalized = {
            name: payload.name || user?.name || "Student",
            email: payload.email || user?.email || "Not provided",
            id: payload.id || payload._id || user?.id || user?._id || "Unknown",
            createdAt: payload.createdAt || user?.createdAt || null,
            updatedAt: payload.updatedAt || user?.updatedAt || null,
          };
          setStudentInfo(normalized);
          setFormData({ name: normalized.name, email: normalized.email });
        }
      } catch (error) {
        // fallback to auth/local storage data
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
            setFormData({
              name: parsed?.name || "Student",
              email: parsed?.email || "Not provided",
            });
          } catch {
            setStudentInfo({ name: "Student", email: "Not provided", id: "Unknown", createdAt: null, updatedAt: null });
          }
        }
        console.error("Failed to load profile", error);
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

    try {
      setSaving(true);
      const payload = { name: formData.name.trim(), email: formData.email.trim() };
      const response = await apiHelpers.users.updateProfile(payload);
      const updated = response?.data?.data || response?.data || payload;

      const normalized = {
        name: updated.name || payload.name,
        email: updated.email || payload.email,
        id: updated.id || updated._id || studentInfo.id,
        createdAt: updated.createdAt || studentInfo.createdAt,
        updatedAt: updated.updatedAt || new Date().toISOString(),
      };

      setStudentInfo(normalized);
      setFormData({ name: normalized.name, email: normalized.email });
      setIsEditing(false);

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
          } catch {
            // ignore local storage update errors
          }
        }
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile", error);
      const message = error?.response?.data?.message || "Failed to update profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white/80 backdrop-blur-lg border border-gray-100 shadow-xl rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-blue-500 text-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Student Profile</h2>
            <p className="text-white/80 text-sm">Your account details and identifiers</p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="rounded-xl border border-white/60 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 transition"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="student-profile-form"
                  className="rounded-xl bg-white text-orange-600 px-4 py-2 text-sm font-semibold hover:bg-orange-100 transition"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEditToggle}
                className="rounded-xl bg-white text-orange-600 px-4 py-2 text-sm font-semibold hover:bg-orange-100 transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
        <div className="p-6 space-y-6">
          {loadingProfile ? (
            <ProfileSkeleton />
          ) : (
            <form id="student-profile-form" onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow
                  icon={<User className="w-5 h-5" />}
                  label="Name"
                  value={studentInfo.name}
                  isEditing={isEditing}
                  inputProps={{
                    name: "name",
                    value: formData.name,
                    onChange: handleInputChange,
                    placeholder: "Your name",
                  }}
                />
                <InfoRow
                  icon={<Mail className="w-5 h-5" />}
                  label="Email"
                  value={studentInfo.email}
                  isEditing={isEditing}
                  inputProps={{
                    name: "email",
                    value: formData.email,
                    onChange: handleInputChange,
                    placeholder: "you@example.com",
                    type: "email",
                  }}
                />
              </div>
              <InfoRow icon={<Hash className="w-5 h-5" />} label="Student ID" value={studentInfo.id} />
              <InfoRow icon={<Clock className="w-5 h-5" />} label="Joined" value={formatDate(studentInfo.createdAt)} />
              <InfoRow icon={<Clock className="w-5 h-5" />} label="Last Updated" value={formatDate(studentInfo.updatedAt)} />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, isEditing = false, inputProps = {} }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 shadow-sm bg-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 text-white">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {isEditing && inputProps.name ? (
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-semibold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            {...inputProps}
          />
        ) : (
          <p className="text-lg font-semibold text-gray-900 break-all">{value}</p>
        )}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((key) => (
        <div key={key} className="animate-pulse flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-orange-200 to-blue-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

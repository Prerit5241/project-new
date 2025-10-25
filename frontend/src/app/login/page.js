"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";


export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalMessage, setSignupModalMessage] = useState("");
  const { login, register } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};

    if (mode === "signup") {
      const trimmedName = formData.name.trim();
      if (!trimmedName) newErrors.name = "Full name is required";
      else if (trimmedName.length < 2) newErrors.name = "Name must be at least 2 characters";
    }

    const emailInput = formData.email.trim();
    if (!emailInput) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(emailInput)) newErrors.email = "Please enter a valid email";

    if (!formData.password) newErrors.password = "Password is required";
    else if (mode === "signup" && formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (mode === "signup") {
      if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;


    setLoading(true);
    setErrors({});
    setSuccessMessage("");


    try {
      let user;
      const email = formData.email.trim();

      if (mode === "login") {
        user = await login(email, formData.password);
        router.replace("/");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("authChanged"));
        }
      } else {
        const result = await register({
          name: formData.name.trim(),
          email,
          password: formData.password,
        }, { autoLogin: false });

        const signupMessage =
          result?.message || "Account created successfully. Please log in with your new credentials.";

        setMode("login");
        setFormData((prev) => ({
          ...prev,
          name: "",
          password: "",
          confirmPassword: "",
        }));
        setSuccessMessage(signupMessage);
        setSignupModalMessage(signupMessage);
        setShowSignupModal(true);
      }
    } catch (error) {
      setErrors({ submit: error.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };


  const handleModeChange = (nextMode) => {
    if (mode === nextMode) return;
    setMode(nextMode);
    setErrors({});
    setSuccessMessage("");
    setFormData((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
      ...(nextMode === "login" ? { name: "" } : {}),
    }));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Account Created</h3>
            <p className="mt-3 text-sm text-slate-600">{signupModalMessage}</p>
            <button
              type="button"
              onClick={() => setShowSignupModal(false)}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-blue-700 hover:to-indigo-700"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-5xl w-full grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
        <div className="hidden lg:flex relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-sky-500 p-10 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_55%)]" />
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col justify-between h-full">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs uppercase tracking-[0.3em]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Connected Campus
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="grid h-14 w-14 place-content-center rounded-2xl bg-white/15 backdrop-blur">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-4xl font-semibold leading-tight">One portal. Endless learning.</h1>
                  <p className="mt-3 text-sm text-blue-50/80 max-w-md">Sign in to continue where you left off or create a fresh account to explore new courses.</p>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 text-left text-sm">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-blue-50/70">Active learners</p>
                <p className="mt-2 text-2xl font-semibold">12k+</p>
                <p className="mt-1 text-blue-50/70">Complete lessons anywhere, anytime.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-blue-50/70">Daily sessions</p>
                <p className="mt-2 text-2xl font-semibold">4.8k</p>
                <p className="mt-1 text-blue-50/70">Stay in sync with personalized reminders.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-blue-50/70">Achievements</p>
                <p className="mt-2 text-2xl font-semibold">3.2k</p>
                <p className="mt-1 text-blue-50/70">Showcase your progress with badges.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-blue-50/70">Support</p>
                <p className="mt-2 text-2xl font-semibold">24/7</p>
                <p className="mt-1 text-blue-50/70">We’re here whenever you need a hand.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mb-6 flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            <div className="rounded-full border border-slate-200 bg-white/70 p-1 flex">
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  mode === "login"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("signup")}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-2xl border border-white/60 p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-semibold text-slate-900 mb-1">
                {mode === "login" ? "Welcome Back" : "Join the Campus"}
              </h2>
              <p className="text-slate-600">
                {mode === "login"
                  ? "Sign in to continue your learning journey."
                  : "Create your student account to access your personalized learning hub."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white/90 transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      errors.name ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-500"
                    }`}
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-2">{errors.name}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-white/90 transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    errors.email ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-500"
                  }`}
                  placeholder="Enter your email"
                  disabled={loading}
                />
                {errors.email && <p className="text-sm text-red-600 mt-2">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  {mode === "login" && (
                    <Link href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 bg-white/90 transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      errors.password ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-500"
                    }`}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600 mt-2">{errors.password}</p>}
              </div>

              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white/90 transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      errors.confirmPassword ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-500"
                    }`}
                    placeholder="Re-enter your password"
                    disabled={loading}
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-600 mt-2">{errors.confirmPassword}</p>}
                </div>
              )}

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-green-700 text-sm">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
              >
                {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

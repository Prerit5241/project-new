"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiHelpers } from "@/lib/api";
import toast from "react-hot-toast";
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Play,
  User,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

function formatDate(date) {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return "—";
  }
}

function computeStats(enrollments) {
  if (!enrollments.length) {
    return {
      total: 0,
      active: 0,
      completed: 0,
      averageProgress: 0,
    };
  }

  const totals = enrollments.reduce(
    (acc, enrollment) => {
      acc.total += 1;
      if (enrollment.status === "completed") acc.completed += 1;
      if (enrollment.status === "active") acc.active += 1;
      acc.progressSum += Number(enrollment.progress ?? 0);
      return acc;
    },
    { total: 0, active: 0, completed: 0, progressSum: 0 }
  );

  return {
    total: totals.total,
    active: totals.active,
    completed: totals.completed,
    averageProgress: Math.round(totals.progressSum / totals.total || 0),
  };
}

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role && user.role !== "student") {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiHelpers.users.getProfile();
        const payload = response?.data?.data || response?.data?.student || response?.data || {};
        const profile = payload?.student || payload;
        const enrollmentList = Array.isArray(profile?.enrolledCourses) ? profile.enrolledCourses : [];

        setEnrollments(enrollmentList);

        if (!enrollmentList.length) {
          setCourses([]);
          return;
        }

        const details = await Promise.all(
          enrollmentList.map(async (enrollment) => {
            const courseReference = typeof enrollment.course === "object" && enrollment.course !== null
              ? enrollment.course
              : typeof enrollment.courseId === "object" && enrollment.courseId !== null
              ? enrollment.courseId
              : null;

            const courseId = courseReference?._id || courseReference?.id || enrollment.courseId;

            const buildFromPayload = (payload = {}) => ({
              enrollment,
              course: {
                id: payload?._id || payload?.id || courseId || enrollment.courseId,
                title: payload?.title || `Course #${courseId || enrollment.courseId}`,
                description: payload?.description || "",
                level: payload?.level || "All levels",
                duration: payload?.duration || payload?.estimatedDuration || 0,
                modulesCount: Array.isArray(payload?.modules) ? payload.modules.length : payload?.modulesCount || 0,
                instructorName:
                  payload?.instructor?.name ||
                  payload?.instructorName ||
                  payload?.createdBy?.name ||
                  "Instructor",
              },
            });

            if (courseReference) {
              return buildFromPayload(courseReference);
            }

            if (!courseId) {
              return buildFromPayload();
            }

            try {
              const courseRes = await apiHelpers.courses.getById(courseId);
              const coursePayload = courseRes?.data?.data || courseRes?.data?.course || courseRes?.data || {};
              return buildFromPayload(coursePayload);
            } catch (courseError) {
              console.warn(`Failed to load course details for ${courseId}`, courseError);
              return buildFromPayload();
            }
          })
        );

        setCourses(details);
      } catch (err) {
        console.error("Failed to load profile", err);
        const message = err?.response?.data?.message || "Unable to load your courses right now.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, router, user]);

  const stats = useMemo(() => computeStats(enrollments), [enrollments]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-gray-500">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
        <p className="text-sm font-medium">Loading your courses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-sm text-gray-500">Review everything you are currently enrolled in.</p>
          </div>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-orange-600 hover:via-orange-700 hover:to-blue-700 hover:shadow-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </header>

        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard icon={<BookOpen className="h-5 w-5" />} label="Total Courses" value={stats.total} color="bg-blue-100 text-blue-700" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="In Progress" value={stats.active} color="bg-emerald-100 text-emerald-700" />
          <StatCard icon={<Award className="h-5 w-5" />} label="Completed" value={stats.completed} color="bg-purple-100 text-purple-700" />
          <StatCard icon={<Clock className="h-5 w-5" />} label="Average Progress" value={`${stats.averageProgress}%`} color="bg-orange-100 text-orange-700" />
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {!courses.length ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No courses found</h2>
            <p className="mt-2 text-sm text-gray-500">Enroll in a course to see it listed here.</p>
            <button
              onClick={() => router.push("/student/browse")}
              className="mt-6 inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-purple-700"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {courses.map(({ enrollment, course }) => (
              <article key={`${course.id}-${enrollment.enrolledAt}`} className="group flex h-full flex-col justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        enrollment.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : enrollment.status === "active"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {enrollment.status === "completed"
                        ? "Completed"
                        : enrollment.status === "active"
                        ? "In Progress"
                        : "Enrolled"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                      {course.level}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3">{course.description}</p>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{course.instructorName}</p>
                      <p className="text-xs text-gray-500">Instructor</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Enrolled {formatDate(enrollment.enrolledAt)}</span>
                    <span>Last accessed {formatDate(enrollment.lastAccessed)}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <span>Progress</span>
                      <span>{enrollment.progress ?? 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${Math.min(Number(enrollment.progress ?? 0), 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration ? `${course.duration} hrs` : "Flexible"}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.modulesCount} modules
                    </span>
                  </div>

                  <button
                    onClick={() => router.push(`/student/courses/${course.id}`)}
                    className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-purple-700"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Play className="h-4 w-4" />
                      Continue learning
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

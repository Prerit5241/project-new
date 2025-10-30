"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiHelpers } from "@/lib/api";
import { ArrowLeft, BookOpen, Clock, Star, Users, Layers, Award, TrendingUp, BarChart3 } from "lucide-react";

const formatPrice = (value) => {
  if (typeof value !== "number") return "Free";
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
};

const deriveAccentColor = (seed = "") => {
  if (!seed) return "hsl(14, 88%, 58%)";
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
};

export default function CategoryCoursesPage() {
  const params = useParams();
  const categoryId = params?.id;

  const [category, setCategory] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!categoryId) return;

    let isMounted = true;

    async function fetchCategoryData() {
      setLoading(true);
      setError("");

      try {
        const [categoryRes, coursesRes] = await Promise.all([
          apiHelpers.categories.getById(categoryId),
          apiHelpers.categories.getCourses(categoryId)
        ]);

        const categoryData = categoryRes?.data?.data || categoryRes?.data || null;
        const courseDataRaw = coursesRes?.data?.data || coursesRes?.data || [];
        const courseData = Array.isArray(courseDataRaw) ? courseDataRaw : [];

        if (isMounted) {
          setCategory(categoryData);
          setCourses(courseData);
        }
      } catch (err) {
        if (isMounted) {
          const message = err?.response?.data?.msg || err?.message || "Failed to load category";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCategoryData();

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  const categoryTitle = useMemo(() => {
    if (!category) return `Category ${categoryId}`;
    return category.name || category.title || `Category ${categoryId}`;
  }, [category, categoryId]);

  const categoryDescription = useMemo(() => {
    if (!category) return "Discover curated courses designed by experts";
    return category.description || "Discover curated courses designed by experts";
  }, [category]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Simplified Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-indigo-100 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200 mb-6"
          >
            <span className="pointer-events-none absolute inset-0 translate-y-[110%] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 transition-transform duration-500 ease-out group-hover:translate-y-0" />
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors duration-300 group-hover:bg-white group-hover:text-indigo-500 dark:bg-indigo-900 dark:text-indigo-200">
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span className="relative text-indigo-600 transition-colors duration-300 group-hover:text-white dark:text-indigo-200">
              Back to Home
            </span>
            <span className="relative ml-1 transition-transform duration-300 group-hover:translate-x-1"></span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <BookOpen className="w-3.5 h-3.5" />
                Category
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {categoryTitle}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
                {categoryDescription}
              </p>
            </div>

            {!loading && courses.length > 0 && (
              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {courses.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Courses</div>
                </div>
                <div className="h-12 w-px bg-gray-200 dark:bg-gray-800"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Students</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Courses</h3>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Courses Yet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                New courses are being added. Check back soon!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Browse Categories
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => {
              const priceLabel = formatPrice(course.price);
              const durationLabel = typeof course.duration === "number" && course.duration > 0
                ? `${course.duration} hours`
                : "Self-paced";
              const levelLabel = course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : "Beginner";
              const heroImage = Array.isArray(course.images) && course.images.length
                ? course.images[0]
                : course.image || course.imageUrl || "/images/course-placeholder.jpg";
              const accentColor = deriveAccentColor(heroImage || course.title || String(course._id || course.id));

              return (
                <Link
                  key={course._id || course.id}
                  href={`/courses/${course._id || course.id}`}
                  className="group block"
                >
                  <div className="flex flex-col md:flex-row gap-6 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all duration-200">
                    {/* Course Image */}
                    <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={heroImage}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 bg-white dark:bg-gray-900 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Award className="w-3.5 h-3.5" style={{ color: accentColor }} />
                        {levelLabel}
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {course.title}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                          {course.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {durationLabel}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4" />
                            {course.modules?.length || 0} Modules
                          </span>
                          {course.ratings?.average ? (
                            <span className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {course.ratings.average.toFixed(1)} ({course.ratings.totalReviews || 0})
                            </span>
                          ) : null}
                          {course.enrollmentCount > 0 && (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {course.enrollmentCount.toLocaleString()} students
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {priceLabel}
                        </div>
                        <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                          View Course
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiHelpers } from "@/lib/api";

const formatPrice = (value) => {
  if (typeof value !== "number") return "Free";
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-600">
            <span>Category</span>
            <span className="text-gray-500">#{categoryId}</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
            {categoryTitle}
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            {categoryDescription}
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center text-red-700">
            {error}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">No courses found</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Check back later as new courses are added to this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const priceLabel = formatPrice(course.price);
              const durationLabel = typeof course.duration === "number" && course.duration > 0
                ? `${course.duration} hrs`
                : "Self-paced";
              const levelLabel = course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : "Beginner";

              return (
                <div key={course._id || course.id} className="h-full">
                  <Link
                    href={`/courses/${course._id || course.id}`}
                    className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-800 cursor-pointer"
                  >
                    <div className="mb-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                        {levelLabel}
                      </span>
                      <span>{durationLabel}</span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                      {course.title}
                    </h2>

                    <p className="mt-3 flex-grow text-sm text-gray-600 dark:text-gray-300 line-clamp-4">
                      {course.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        {priceLabel}
                      </span>
                      {course.ratings?.average ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-yellow-500">
                          ★ {course.ratings.average.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No ratings</span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

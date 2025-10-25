"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiHelpers } from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { ShoppingCart, CheckCircle, Clock, Award, Users, Star, Play, BookOpen } from "lucide-react";
import { toast } from "react-toastify";

const formatPrice = (value) => {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "Free";
  return numericValue.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
};

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const persistCartItems = (items) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("cartItems", JSON.stringify(items));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Failed to persist cart items", error);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await apiHelpers.courses.getById(id);
        const courseData = response?.data?.data || response?.data?.course || response?.data;
        setCourse(courseData);
      } catch (err) {
        setError(err?.response?.data?.msg || "Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourse();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/courses/${id}`));
      return;
    }

    try {
      setIsAddingToCart(true);
      const response = await apiHelpers.cart.addItem({ courseId: id, quantity: 1 });
      const serverItems = response?.data?.cart?.items;

      if (Array.isArray(serverItems) && serverItems.length) {
        persistCartItems(serverItems);
      } else if (typeof window !== "undefined") {
        const existingRaw = localStorage.getItem("cartItems");
        const existingItems = existingRaw ? JSON.parse(existingRaw) : [];
        const targetCourseId = (course?._id ?? course?.id ?? id)?.toString();

        const findCourseId = (item) => {
          const fromCourse = item?.course;
          if (fromCourse && typeof fromCourse === "object") {
            return (
              fromCourse._id ??
              fromCourse.id ??
              fromCourse.courseId ??
              fromCourse._id?.toString()
            )?.toString();
          }
          return (item?.courseId ?? fromCourse ?? item?._id ?? item?.id)?.toString();
        };

        const index = Array.isArray(existingItems)
          ? existingItems.findIndex((item) => findCourseId(item) === targetCourseId)
          : -1;

        if (index > -1) {
          existingItems[index] = {
            ...existingItems[index],
            quantity: (existingItems[index]?.quantity || 1) + 1
          };
        } else {
          const priceValue = typeof course?.price === "number" ? course.price : Number(course?.price) || 0;
          existingItems.push({
            course: course || null,
            courseId: targetCourseId,
            title: course?.title || "Untitled Course",
            price: priceValue,
            quantity: 1
          });
        }

        persistCartItems(existingItems);
      }

      toast.success("Course added to cart!");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/courses/${id}`));
      return;
    }

    try {
      setIsEnrolling(true);
      // Replace with your actual enrollment API call
      await apiHelpers.enrollments.create({ courseId: id });
      toast.success("Enrollment successful!");
      router.push(`/learning/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to enroll in course");
    } finally {
      setIsEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">Error loading course</p>
          <p className="mt-2">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Course not found</p>
      </div>
    );
  }

  const {
    title,
    description,
    price,
    duration,
    level,
    instructor,
    category,
    ratings,
    modules: rawModules,
    imageUrl,
    learningOutcomes: rawOutcomes,
    enrollmentCount,
    studentsCount: rawStudentsCount
  } = course;

  const modules = Array.isArray(rawModules) ? rawModules : [];
  const learningOutcomes = Array.isArray(rawOutcomes) ? rawOutcomes : [];
  const totalLessons = modules.reduce((total, module) => total + (module?.lessons?.length || 0), 0);
  const categoryName = typeof category === "object" ? (category?.name || category?.title) : category;
  const instructorName = typeof instructor === "object"
    ? (instructor?.name || instructor?.fullName || instructor?.email)
    : instructor
    ? `Instructor #${instructor}`
    : "Expert Instructor";
  const averageRating = ratings?.average;
  const totalReviews = ratings?.totalReviews;
  const learnersCount = Number.isFinite(enrollmentCount)
    ? enrollmentCount
    : Number.isFinite(rawStudentsCount)
    ? rawStudentsCount
    : null;
  const ratingValue = Number.isFinite(averageRating) ? averageRating : 4.5;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="lg:flex">
            {/* Course Image */}
            <div className="lg:w-2/3 p-6 lg:p-8">
              <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={imageUrl || "/images/course-placeholder.jpg"}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>

              <h1 className="mt-8 text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                {categoryName && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-purple-600 dark:bg-purple-900/40 dark:text-purple-200">
                    <BookOpen className="h-4 w-4" />
                    {categoryName}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                  <Users className="h-4 w-4" />
                  {instructorName}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-green-600 dark:bg-green-900/40 dark:text-green-200">
                  <Clock className="h-4 w-4" />
                  {duration ? `${duration} hrs` : "Self-paced"}
                </span>
              </div>
              
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {description}
              </p>

              {learningOutcomes.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    What you'll learn
                  </h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {learningOutcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-12">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Course Content
                </h2>
                <div className="space-y-4">
                  {modules.length > 0 ? (
                    modules.map((module, modIndex) => (
                      <div key={`${module.title}-${modIndex}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 font-medium text-gray-900 dark:text-white">
                          Module {modIndex + 1}: {module.title}
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {module.lessons?.length ? (
                            module.lessons.map((lesson, lesIndex) => (
                              <div key={`${lesson.title}-${lesIndex}`} className="px-4 py-3 flex items-center gap-3">
                                <Play className="h-4 w-4 text-gray-400" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    Lesson {modIndex + 1}.{lesIndex + 1}: {lesson.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {lesson.contentType || "content"}
                                  </p>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {lesson.duration ? `${lesson.duration} min` : "Flexible"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              Lessons coming soon
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Modules will be published soon.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:w-1/3 bg-gray-50 dark:bg-gray-800 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
              <div className="sticky top-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(price)}
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                    
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      This course includes:
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <Play className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {totalLessons} on-demand lessons
                        </span>
                      </li>
                      <li className="flex items-center">
                        <BookOpen className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {modules.length} modules
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Clock className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {duration ? `${duration} hours of content` : 'Lifetime access'}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Award className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {learnersCount ? `${learnersCount.toLocaleString()} learners enrolled` : 'Certificate of completion'}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Course Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Instructor</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {instructor?.name || 'Expert Instructor'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Level</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                        {level || 'Beginner'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Students</p>
                      <div className="mt-1 flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {learnersCount ? learnersCount.toLocaleString() : '1,000+'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rating</p>
                      <div className="mt-1 flex items-center">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= Math.round(ratingValue) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill={star <= Math.round(ratingValue) ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {ratingValue.toFixed(1)} ({(totalReviews || learnersCount || 0).toString()})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiHelpers } from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { ShoppingCart, CheckCircle, Clock, Award, Users, Star, Play, BookOpen, ArrowLeft, X, CreditCard, Coins } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

// Animation keyframes for modal
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }

  /* Hide scrollbar but keep functionality */
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

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
  const { user, isAuthenticated, updateUser } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showCourseDetailsCard, setShowCourseDetailsCard] = useState(true);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('online'); // 'online' or 'credits'

  const persistCartItems = (items) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("cartItems", JSON.stringify(items));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Failed to persist cart items", error);
    }
  };

  // Use the centralized user data fetching from AuthContext
  // No need for local user data fetching here

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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleScroll = () => {
      if (window.innerWidth < 1024) {
        setShowCourseDetailsCard(true);
        return;
      }

      // Get the Special Price section element
      const specialPriceSection = document.querySelector('h2:has(+ div.flex.items-center.text-3xl)');
      if (!specialPriceSection) return;

      // Get the position of the Special Price section relative to the viewport
      const specialPriceRect = specialPriceSection.getBoundingClientRect();
      
      // Show/hide based on scroll position relative to the Special Price section
      const buffer = 20; // 20px buffer for smoother transition
      const shouldShow = specialPriceRect.top > window.innerHeight - buffer;
      
      setShowCourseDetailsCard(shouldShow);
    };

    // Initial check
    handleScroll();
    
    // Add event listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showEnrollmentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEnrollmentModal]);

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

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/courses/${id}`));
      return;
    }
    setShowEnrollmentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/courses/${id}`));
      return;
    }

    try {
      setIsEnrolling(true);
      
      if (selectedPaymentMethod === 'online') {
        // Handle online payment integration
        // This is where you would integrate with Razorpay/Stripe
        // For now, we'll proceed with direct enrollment
        await apiHelpers.enrollments.create({ 
          courseId: id,
          paymentMethod: 'online',
          amount: course.price
        });
      } else if (selectedPaymentMethod === 'credits') {
        // Handle credit points payment
        await apiHelpers.enrollments.create({ 
          courseId: id,
          paymentMethod: 'credits',
          amount: course.price
        });
      }
      
      toast.success("Enrollment successful!");
      setShowEnrollmentModal(false);
      router.push(`/learning/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to complete enrollment");
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
  const categoryIdValue =
    typeof category === "object"
      ? category?.slug || category?._id || category?.id || category?.categoryId
      : category;
  const categoryHref = categoryIdValue
    ? `/category/${encodeURIComponent(categoryIdValue)}`
    : "/category";
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
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2.1fr)_minmax(320px,1fr)]">
            {/* Course Image */}
            <div className="p-6 lg:p-12 xl:p-14">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={categoryHref}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-indigo-100 bg-white px-5 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200"
                >
                  <span className="pointer-events-none absolute inset-0 translate-y-[110%] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 transition-transform duration-500 ease-out group-hover:translate-y-0" />
                  <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors duration-300 group-hover:bg-white group-hover:text-indigo-500 dark:bg-indigo-900 dark:text-indigo-200">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                  <span className="relative text-indigo-600 transition-colors duration-300 group-hover:text-white dark:text-indigo-200">
                    Back to {categoryName || "Categories"}
                  </span>
                </Link>
              </div>

              <div className="mt-6 aspect-w-16 aspect-h-9 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Content</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {modules.reduce((total, mod) => total + (mod.lessons?.length || 0), 0)} lessons • {modules.length} modules
                    </p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {modules.length > 0 ? (
                    <div className="space-y-5">
                      {modules.map((module, modIndex) => (
                        <div 
                          key={`${module.title}-${modIndex}`} 
                          className="group border border-gray-100 dark:border-gray-700/50 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-500/30"
                        >
                          <div className="bg-gradient-to-r from-indigo-50/70 to-blue-50/70 dark:from-gray-800/80 dark:to-gray-800/60 px-6 py-4 border-b border-gray-100/50 dark:border-gray-700/50">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4 group-hover:bg-indigo-200/50 dark:group-hover:bg-indigo-900/50 transition-colors">
                                <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{modIndex + 1}</span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {module.title}
                              </h3>
                              <span className="ml-auto text-sm bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                                {module.lessons?.length || 0} lessons
                              </span>
                            </div>
                          </div>
                          
                          <div className="divide-y divide-gray-100/50 dark:divide-gray-700/50">
                            {module.lessons?.length ? (
                              module.lessons.map((lesson, lesIndex) => (
                                <div 
                                  key={`${lesson.title}-${lesIndex}`} 
                                  className="group/lesson px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                                >
                                  <div className={`flex-shrink-0 mt-0.5 flex items-center justify-center h-8 w-8 rounded-lg ${lesson.contentType === 'video' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'} group-hover/lesson:shadow-sm transition-all`}>
                                    {lesson.contentType === 'video' ? (
                                      <Play className="h-4 w-4" fill="currentColor" />
                                    ) : (
                                      <BookOpen className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center">
                                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                                        {modIndex + 1}.{lesIndex + 1}
                                      </p>
                                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {lesson.title}
                                      </p>
                                    </div>
                                    <div className="flex items-center mt-1.5 gap-2">
                                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 capitalize">
                                        {lesson.contentType || "content"}
                                      </span>
                                      {lesson.duration && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {lesson.duration} min
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button className="p-1.5 -mr-1.5 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </div>
                              ))
                            ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              Lessons coming soon
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Modules will be published soon.
                  </div>
                )}
              </div>
            </div>
            </div>
            
            {/* Sidebar */}
            <aside className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 lg:p-10 lg:border-l">
              <div className="mx-auto max-w-sm space-y-6 lg:max-w-none">
                <div className="sticky top-24">
                  <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg shadow-orange-100/60 dark:border-orange-500/20 dark:bg-gray-900/90 dark:shadow-none">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">Special Price</p>
                        <h2 className="mt-3 text-4xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(price)}
                        </h2>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Coins className="h-4 w-4 text-amber-500" />
                          <span>or {Math.round(price * 0.8)} coins</span>
                        </div>
                        {isAuthenticated && (
                          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                              <Coins className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              <span className="font-medium text-gray-700 dark:text-amber-100">Your Coins: <span className="font-bold text-amber-600 dark:text-amber-300">{(user?.coins || 0).toLocaleString()}</span></span>
                              {(user?.coins || 0) < Math.round(price * 0.8) && (
                                <Link href="/student/coin" className="ml-2 text-xs text-blue-600 hover:underline dark:text-blue-400 whitespace-nowrap">
                                  Get More
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                        Limited seats
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      <button
                        onClick={handleEnrollClick}
                        disabled={isEnrolling || showEnrollmentModal}
                        className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 px-6 py-3 text-base font-semibold text-black shadow-md transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isEnrolling ? "Enrolling..." : "Enroll Now"}
                      </button>
                      <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        className="group w-full rounded-2xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      >
                        <span className="inline-flex items-center justify-center gap-2">
                          <ShoppingCart className="h-5 w-5 text-orange-500 transition-transform group-hover:scale-105" />
                          {isAddingToCart ? "Adding..." : "Add to Cart"}
                        </span>
                      </button>
                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        This course includes:
                      </h3>
                      <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-3">
                          <Play className="h-5 w-5 text-green-500" />
                          <span>{totalLessons} on-demand lessons</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-green-500" />
                          <span>{modules.length} modules</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-green-500" />
                          <span>{duration ? `${duration} hours of content` : "Lifetime access"}</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Award className="h-5 w-5 text-green-500" />
                          <span>
                            {learnersCount
                              ? `${learnersCount.toLocaleString()} learners enrolled`
                              : "Certificate of completion"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div
                  className={`relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-purple-50/60 p-6 shadow-lg shadow-indigo-100/50 backdrop-blur transition-all duration-300 ease-out dark:border-indigo-500/25 dark:from-gray-900/95 dark:via-indigo-950/40 dark:to-purple-950/20 ${
                    showCourseDetailsCard
                      ? "opacity-100 translate-y-0"
                      : "pointer-events-none opacity-0 translate-y-2"
                  }`}
                  aria-hidden={!showCourseDetailsCard}
                >
                  <div className="pointer-events-none absolute -top-24 right-[-40px] h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-500/20" />
                  <div className="pointer-events-none absolute -bottom-20 left-[-48px] h-48 w-48 rounded-full bg-purple-200/25 blur-3xl dark:bg-purple-500/15" />
                  <div className="relative">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-200">
                      Course Details
                    </span>
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between rounded-2xl border border-indigo-100/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:shadow-md dark:border-indigo-500/25 dark:bg-gray-900/60">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
                            <BookOpen className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                              Instructor
                            </p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {instructor?.name || "Expert Instructor"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                          Trusted
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-indigo-100/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:shadow-md dark:border-indigo-500/25 dark:bg-gray-900/60">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-200">
                            <Award className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                              Level
                            </p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                              {level || "Beginner"}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200 max-w-[120px] truncate" title={level ? level.toString() : "Beginner"}>
                          {level ? (level.toString().length > 8 ? 'INTERM..' : level.toString().toUpperCase()) : "BEGINNER"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-indigo-100/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:shadow-md dark:border-indigo-500/25 dark:bg-gray-900/60">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-200">
                            <Users className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                              Students
                            </p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {learnersCount ? learnersCount.toLocaleString() : "1,000+"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-indigo-100/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:shadow-md dark:border-indigo-500/25 dark:bg-gray-900/60">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-200">
                            <Star className="h-5 w-5" fill="currentColor" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                              Rating
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= Math.round(ratingValue) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                                    }`}
                                    fill={star <= Math.round(ratingValue) ? "currentColor" : "none"}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {ratingValue.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-200">
                          {(totalReviews || learnersCount || 0).toString()} reviews
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Enhanced Enrollment Modal */}
      {showEnrollmentModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4 animate-fadeIn overflow-y-auto hide-scrollbar"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEnrollmentModal(false);
            }
          }}
        >
          <div className="min-h-full flex items-center justify-center py-8">
            <div 
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg transform transition-all animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient background */}
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 pb-12 rounded-t-3xl relative">
                <button 
                  onClick={() => setShowEnrollmentModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 hover:rotate-90"
                  disabled={isEnrolling}
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Complete Enrollment</h3>
                </div>
                <p className="text-white/90 text-sm">Choose your preferred payment method to start learning</p>
              </div>

              {/* Course Summary Card - Overlapping header */}
              <div className="px-6 -mt-8 relative z-20">
                <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-start gap-4">
                    {course.imageUrl && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600">
                        <img 
                          src={course.imageUrl} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-2 mb-2">
                        {course.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration ? `${course.duration} hrs` : "Self-paced"}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span className="capitalize">{course.level || "Beginner"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Display */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {formatPrice(course.price)}
                      </div>
                      {course.price > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">One-time payment</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-6 pb-8">
                {/* Payment Methods Section */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Select Payment Method</h4>
                    <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full font-medium">
                      Secure Payment
                    </span>
                  </div>
                  
                  {/* Online Payment Option */}
                  <label 
                    className={`relative block p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      selectedPaymentMethod === 'online' 
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg shadow-indigo-100 dark:shadow-none' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={selectedPaymentMethod === 'online'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${
                        selectedPaymentMethod === 'online' 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 dark:shadow-none' 
                          : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
                      }`}>
                        <CreditCard className={`h-6 w-6 transition-colors ${
                          selectedPaymentMethod === 'online' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900 dark:text-white">Online Payment</h5>
                          {selectedPaymentMethod === 'online' && (
                            <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Pay securely with your preferred method
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            💳 Cards
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            📱 UPI
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            🏦 Net Banking
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Credit Points Payment Option */}
                  <label 
                    className={`relative block p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      selectedPaymentMethod === 'coins' 
                        ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-lg shadow-amber-100 dark:shadow-none' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md'
                    } ${(user?.coins || 0) < Math.round(course.price * 0.8) ? 'opacity-60' : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="coins"
                      checked={selectedPaymentMethod === 'coins'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      disabled={(user?.coins || 0) < Math.round(course.price * 0.8)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${
                        selectedPaymentMethod === 'coins' 
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-200 dark:shadow-none' 
                          : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20'
                      }`}>
                        <Coins className={`h-6 w-6 transition-colors ${
                          selectedPaymentMethod === 'coins' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900 dark:text-white">Use Coins</h5>
                          {selectedPaymentMethod === 'coins' && (
                            <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                            <Coins className="h-3.5 w-3.5 mr-1" />
                            {(user?.coins || 0).toLocaleString()} coins available
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Required: {Math.round(course.price * 0.8)} coins
                          </span>
                        </div>
                        {(user?.coins || 0) >= Math.round(course.price * 0.8) ? (
                          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            You have enough coins to enroll!
                          </p>
                        ) : (
                          <p className="text-sm text-orange-600 dark:text-orange-400">
                            You need {Math.round(course.price * 0.8) - (user?.coins || 0)} more coins
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Security Badge */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Secure Payment</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Your payment information is encrypted and secure</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEnrollmentModal(false)}
                    disabled={isEnrolling}
                    className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEnrolling || (selectedPaymentMethod === 'coins' && (user?.coins || 0) < Math.round(course.price * 0.8))}
                    className="flex-1 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isEnrolling ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Award className="h-5 w-5" />
                        Confirm & Enroll
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

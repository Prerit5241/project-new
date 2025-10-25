"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  Clock, 
  Users, 
  Star, 
  Award, 
  BookOpen, 
  Play,
  ChevronLeft,
  CheckCircle
} from "lucide-react";

const CourseDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [courseModules, setCourseModules] = useState([]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const token = localStorage.getItem("token");
    const loggedIn = Boolean(isAuthenticated?.() || token);

    if (!loggedIn) {
      router.replace('/login');
      return;
    }

    fetchCourse();
    checkEnrollmentStatus();
  }, [authLoading, id, isAuthenticated, router]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCourse(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch course details");
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsEnrolled(false);
        return;
      }
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/student/enrollment/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (res.data.success) {
        setIsEnrolled(res.data.enrolled);
        if (res.data.enrolled) {
          fetchCourseModules();
        }
      }
    } catch (err) {
      console.error("Error checking enrollment:", err);
    }
  };

  const fetchCourseModules = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${id}/modules`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (res.data.success) {
        setCourseModules(res.data.modules || []);
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  };

  const handleEnroll = async () => {
    if (authLoading) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!(isAuthenticated?.() || user || token)) {
      toast.error('Please login to enroll in this course');
      router.push('/login');
      return;
    }

    setEnrolling(true);
    try {
      const authToken = token || localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/student/enroll/${id}`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      if (res.data.success) {
        toast.success('🎉 Successfully enrolled in the course!');
        setIsEnrolled(true);
        fetchCourseModules();
      } else {
        toast.error(res.data.message || 'Enrollment failed');
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonComplete = async (moduleIndex, lessonIndex) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${id}/modules/${moduleIndex}/lessons/${lessonIndex}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (res.data.success) {
        toast.success('Lesson completed! 🎉');
      }
    } catch (err) {
      console.error("Error marking lesson complete:", err);
      toast.error('Failed to mark lesson complete');
    }
  };

  const handleViewLesson = async (moduleIndex, lessonIndex) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${id}/modules/${moduleIndex}/lessons/${lessonIndex}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (res.data.success) {
        console.log("Lesson data:", res.data.lesson);
        toast.success(`Viewing: ${res.data.lesson.title}`);
      }
    } catch (err) {
      console.error("Error viewing lesson:", err);
      toast.error('Failed to load lesson');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-r-transparent"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-xl mb-4">{error}</p>
        <button
          onClick={() => router.push('/student/browse')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Courses
        </button>
      </div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h2>
        <button
          onClick={() => router.push('/student/browse')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Browse All Courses
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Courses
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
              <div className="h-64 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Play className="w-16 h-16 text-white opacity-80" />
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {course.level}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {course.status}
                  </span>
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {course.title}
                </h1>
                
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{course.enrollmentCount} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{course.ratings?.average || 0}/5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{courseModules.length} modules</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Modules - Only show if enrolled */}
            {isEnrolled && courseModules.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  Course Content
                </h2>
                
                <div className="space-y-6">
                  {courseModules.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-xl text-gray-800 mb-3">
                        Module {moduleIndex + 1}: {module.title}
                      </h3>
                      {module.description && (
                        <p className="text-gray-600 mb-4">{module.description}</p>
                      )}
                      
                      {/* Lessons */}
                      <div className="space-y-3">
                        {module.lessons?.map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <Play className="w-5 h-5 text-blue-600" />
                              <div>
                                <h4 className="font-medium text-gray-800">{lesson.title}</h4>
                                <p className="text-sm text-gray-500">{lesson.contentType} • {lesson.duration}s</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewLesson(moduleIndex, lessonIndex)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleLessonComplete(moduleIndex, lessonIndex)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                Complete
                              </button>
                            </div>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-center py-4">No lessons available in this module</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Instructor</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {course.instructor?.name?.charAt(0) || 'I'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {course.instructor?.name || 'Professional Instructor'}
                  </h3>
                  <p className="text-gray-600">{course.instructor?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  ₹{course.price?.toFixed(2) || '0.00'}
                </div>
                <p className="text-gray-500">One-time payment</p>
              </div>

              {/* Enrollment Button */}
              <div className="mb-6">
                {isEnrolled ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 px-4 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Enrolled</span>
                    </div>
                    <button
                      onClick={() => router.push('/student/my-courses')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                    >
                      Go to My Courses
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {enrolling ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-r-transparent"></div>
                        Enrolling...
                      </div>
                    ) : (
                      'Enroll Now'
                    )}
                  </button>
                )}
              </div>

              {/* Features */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-3 text-gray-600">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span>Certificate of completion</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Self-paced learning</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Lifetime access</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Play className="w-5 h-5 text-blue-600" />
                  <span>HD video content</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;

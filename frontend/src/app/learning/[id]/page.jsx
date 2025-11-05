"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { apiHelpers } from "@/lib/api";
import { BookOpen, ChevronDown, ChevronRight, CheckCircle, Play, Clock, Award } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function LearningPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is enrolled in the course
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/learning/${id}`);
      return;
    }

    const checkEnrollment = async () => {
      try {
        const response = await apiHelpers.courses.getEnrollmentStatus(id);
        if (response.data && response.data.isEnrolled) {
          setIsEnrolled(true);
          fetchCourse();
        } else {
          setError("You are not enrolled in this course");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error checking enrollment:", err);
        setError("Failed to verify course enrollment");
        setIsLoading(false);
      }
    };

    checkEnrollment();
  }, [id, isAuthenticated, router]);

  const fetchCourse = async () => {
    try {
      const response = await apiHelpers.courses.getById(id);
      const courseData = response?.data?.data || response?.data?.course || response?.data;
      setCourse(courseData);
      
      // Load completed lessons from user's progress
      if (user?.enrolledCourses) {
        const enrollment = user.enrolledCourses.find(ec => ec.courseId === (courseData?._id || courseData?.id || id));
        if (enrollment?.completedLessons) {
          const completed = new Set(
            enrollment.completedLessons.map(lesson => 
              `${lesson.moduleIndex}-${lesson.lessonIndex}`
            )
          );
          setCompletedLessons(completed);
        }
      }
    } catch (err) {
      console.error("Error fetching course:", err);
      setError("Failed to load course content");
    } finally {
      setIsLoading(false);
    }
  };

  const markLessonComplete = async (moduleIndex, lessonIndex) => {
    try {
      // Optimistic UI update
      const lessonKey = `${moduleIndex}-${lessonIndex}`;
      const newCompletedLessons = new Set(completedLessons);
      newCompletedLessons.add(lessonKey);
      setCompletedLessons(newCompletedLessons);

      // Call API to mark as complete
      await apiHelpers.courses.markLessonComplete(id, moduleIndex, lessonIndex);
      
      // Update local user data
      const updatedUser = { ...user };
      const enrollmentIndex = updatedUser.enrolledCourses.findIndex(
        ec => ec.courseId === (course?._id || course?.id || id)
      );
      
      if (enrollmentIndex !== -1) {
        updatedUser.enrolledCourses[enrollmentIndex].completedLessons = [
          ...(updatedUser.enrolledCourses[enrollmentIndex].completedLessons || []),
          { moduleIndex, lessonIndex, completedAt: new Date().toISOString() }
        ];
        // Update context
        updateUser(updatedUser);
      }

      toast.success("Lesson marked as complete!");
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      // Revert optimistic update on error
      const lessonKey = `${moduleIndex}-${lessonIndex}`;
      const newCompletedLessons = new Set(completedLessons);
      newCompletedLessons.delete(lessonKey);
      setCompletedLessons(newCompletedLessons);
      
      toast.error("Failed to mark lesson as complete");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/courses"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-200"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-6">The requested course could not be found.</p>
          <Link 
            href="/courses"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-200"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  const currentModule = course.modules?.[activeModule];
  const currentLesson = currentModule?.lessons?.[activeLesson];
  const isLessonCompleted = (moduleIdx, lessonIdx) => 
    completedLessons.has(`${moduleIdx}-${lessonIdx}`);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{course.title}</h1>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <span className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {course.modules?.length || 0} Modules
            </span>
          </div>
        </div>
        
        <nav className="p-2">
          {course.modules?.map((module, moduleIndex) => (
            <div key={moduleIndex} className="mb-2">
              <button
                onClick={() => setActiveModule(moduleIndex)}
                className={`w-full flex items-center justify-between p-3 rounded-md text-left ${
                  activeModule === moduleIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  {activeModule === moduleIndex ? (
                    <ChevronDown className="w-4 h-4 mr-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-2" />
                  )}
                  <span className="font-medium">{module.title}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {module.lessons?.length} lessons
                </span>
              </button>
              
              {activeModule === moduleIndex && (
                <div className="ml-6 mt-1 space-y-1">
                  {module.lessons?.map((lesson, lessonIndex) => {
                    const isCompleted = isLessonCompleted(moduleIndex, lessonIndex);
                    const isActive = activeLesson === lessonIndex && activeModule === moduleIndex;
                    
                    return (
                      <button
                        key={lessonIndex}
                        onClick={() => setActiveLesson(lessonIndex)}
                        className={`w-full flex items-center p-2 text-sm rounded-md ${
                          isActive 
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                        ) : (
                          <Play className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                        {lesson.duration && (
                          <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">
                            {Math.floor(lesson.duration / 60)}m {lesson.duration % 60}s
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentLesson ? (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentLesson.title}</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="flex items-center mr-4">
                    <Clock className="w-4 h-4 mr-1" />
                    {Math.floor(currentLesson.duration / 60) || 0}m {currentLesson.duration % 60 || 0}s
                  </span>
                  <span className="flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    {isLessonCompleted(activeModule, activeLesson) ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                {currentLesson.videoUrl ? (
                  <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden mb-6">
                    <video 
                      src={currentLesson.videoUrl} 
                      controls 
                      className="w-full h-full"
                    />
                  </div>
                ) : null}
                
                <div className="prose max-w-none">
                  {currentLesson.content && (
                    <div 
                      className="prose max-w-none" 
                      dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                    />
                  )}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => markLessonComplete(activeModule, activeLesson)}
                    disabled={isLessonCompleted(activeModule, activeLesson)}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      isLessonCompleted(activeModule, activeLesson)
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isLessonCompleted(activeModule, activeLesson) ? (
                      <>
                        <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
                        Completed
                      </>
                    ) : (
                      <>
                        <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
                        Mark as Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to {course.title}!</h2>
              <p className="text-gray-600 mb-6">
                Select a lesson from the sidebar to start learning.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    if (course.modules?.[0]?.lessons?.[0]) {
                      setActiveModule(0);
                      setActiveLesson(0);
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Play className="-ml-1 mr-2 h-4 w-4" />
                  Start First Lesson
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
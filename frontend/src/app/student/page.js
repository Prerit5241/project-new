"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function StudentPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 Student Page - isLoggedIn:', isLoggedIn, 'user:', user);
    
    if (!isLoggedIn) {
      console.log('❌ User not logged in, redirecting to login');
      router.push('/login');
      return;
    }

    if (user && user.role !== 'student') {
      console.log('❌ User is not a student, redirecting based on role:', user.role);
      switch (user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'instructor':
          router.push('/instructor');
          break;
        default:
          router.push('/login');
      }
      return;
    }

    if (user && user.role === 'student') {
      console.log('✅ Student authenticated, redirecting to dashboard');
      router.push('/student/dashboard');
    }
  }, [isLoggedIn, user, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-r-transparent mb-4"></div>
        <p className="text-slate-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}

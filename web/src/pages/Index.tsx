import React from 'react';
import { useProfile } from '@/hooks/api/useAuth';
import { Navigate, useLocation, Routes, Route } from 'react-router-dom';
import Login from './auth/Login';
import ForgotPassword from './auth/ForgotPassword';
import VerifyOTP from './auth/VerifyOTP';
import ResetPassword from './auth/ResetPassword';
import StudentLayout from './student/StudentLayout';

const Index = () => {
  const { data: profileData, isLoading, error } = useProfile();
  const location = useLocation();

  const isAuthenticated = !!profileData?.data;
  const userRole = profileData?.data?.role;

  // Extract the active tab from the URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/student/home')) return 'home';

    if (path.includes('/student/tests')) return 'tests';
    if (path.includes('/student/hub')) return 'hub';
    if (path.includes('/student/profile')) return 'profile';
    if (path.includes('/student/settings')) return 'settings';
    return 'home';
  };

  const activeTab = getActiveTab();

  // Handle auth routes that don't require authentication
  if (location.pathname === '/forgot-password') {
    return <ForgotPassword />;
  }

  if (location.pathname === '/verify-otp') {
    return <VerifyOTP />;
  }

  if (location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || error) {
    return <Login />;
  }

  // Redirect based on role
  if (userRole === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  // For student routes, use StudentLayout
  return <StudentLayout activeTab={activeTab} />;
};

export default Index;

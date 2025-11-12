import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import AdminSidebar from '@/containers/admin/AdminSidebar';
import AdminHeader from '@/containers/admin/AdminHeader';
import DashboardOverview from '@/containers/admin/DashboardOverviewNew';
import StudentManagement from '@/containers/admin/StudentManagement';
import ContentManagement from '@/containers/admin/ContentManagement';
import TestManagement from '@/containers/admin/TestManagement';
import Analytics from '@/containers/admin/Analytics';
import CourseManagement from '@/containers/admin/CourseManagement';
import QuestionBank from '@/containers/admin/QuestionBank';
import NotificationCenter from '@/containers/admin/NotificationCenter';
import StaffManagement from '@/containers/admin/StaffManagement';
import AdminSettings from '@/containers/admin/AdminSettings';
import TestReports from '@/containers/admin/TestReports';
import ProfileSection from '@/components/common/ProfileSection';
import { useProfile } from '@/hooks/api/useAuth';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profileData, isLoading } = useProfile();
  const userRole = profileData?.data?.role;

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
  if (userRole !== 'ADMIN') {
    return <Navigate to={userRole === 'STUDENT' ? '/student' : '/'} replace />;
  }

  // Sample admin user data
  const adminUser = {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@academy.com',
    phone: '+91 9876543210',
    avatar: '',
    role: 'admin' as const,
    joinDate: '2024-01-01',
    address: 'Academy Campus, Education City',
    bio: 'Experienced administrator managing academy operations and student success.',
    emergencyContact: '+91 9876543211'
  };

  const handleTabChange = (tab: string) => {
    navigate(`/admin/${tab}`);
    setSidebarOpen(false);
  };

  const handleProfileClick = () => {
    handleTabChange('profile');
  };


  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        activeTab={location.pathname.split('/').pop() || 'dashboard'}
        onTabChange={handleTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col lg:ml-64">
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          onProfileClick={handleProfileClick}
        />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

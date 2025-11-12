import React, { useEffect } from 'react';
import StudentHeader from '@/containers/student/StudentHeader';
import MotivationalVideo from '@/containers/student/MotivationalVideo';
import LatestVideos from '@/containers/student/LatestVideos';
import QuickStats from '@/containers/student/QuickStats';
import Announcements from '@/containers/student/Announcements';
import BottomNavigation from '@/components/common/BottomNavigation';
import { useStudentDashboard, useStudentMaterials } from '@/hooks/api/useStudent';
import { Card, CardContent } from '@/components/ui/card';
import { authService } from '@/services';


interface StudentDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab, onTabChange }) => {
  const { data: dashboardData, isLoading: dashboardLoading } = useStudentDashboard();
  const { data: materialsData, isLoading: materialsLoading } = useStudentMaterials();

  const student = dashboardData?.data?.student;
  const stats = dashboardData?.data?.stats;
 

  
  // Filter out null values before processing
  const validMaterials = materialsData?.data?.filter(material => material !== null) || [];
  
  const videos = validMaterials.length > 0
    ? validMaterials
        .filter((item: any) => item.file_type === 'VIDEO')
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    : [];

  if (dashboardLoading || materialsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      <div className="px-4 py-6 space-y-6">
        <StudentHeader student={student} />
        <MotivationalVideo />
        <LatestVideos videos={videos} />
        <Announcements />
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default StudentDashboard;
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';

import VideoLearning from './VideoLearning';
import Profile from './Profile';
import Settings from './Settings';
import TestCenter from './TestCenter';

interface StudentLayoutProps {
  activeTab: string;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'home':
        navigate('/student/home');
        break;
      
      case 'tests':
        navigate('/student/tests');
        break;
      case 'hub':
        navigate('/student/hub');
        break;
      case 'profile':
        navigate('/student/profile');
        break;
      case 'settings':
        navigate('/student/settings');
        break;
      default:
        navigate('/student/home');
    }
  };

  switch (activeTab) {
    case 'home':
      return <StudentDashboard activeTab={activeTab} onTabChange={handleTabChange} />;

    case 'tests':
      return <TestCenter activeTab={activeTab} onTabChange={handleTabChange} />;
    case 'hub':
      return <VideoLearning activeTab={activeTab} onTabChange={handleTabChange} />;
    case 'profile':
      return <Profile activeTab={activeTab} onTabChange={handleTabChange} />;
    case 'settings':
      return <Settings activeTab={activeTab} onTabChange={handleTabChange} />;
    default:
      return <StudentDashboard activeTab={activeTab} onTabChange={handleTabChange} />;
  }
};

export default StudentLayout; 
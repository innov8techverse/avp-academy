
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, useVideos, useQuizzes, useStudentDashboard } from '@/hooks/api';

interface ApiContextType {
  auth: ReturnType<typeof useAuth>;
  videos: ReturnType<typeof useVideos>;
  quizzes: ReturnType<typeof useQuizzes>;
  dashboard: ReturnType<typeof useStudentDashboard>;
} 



const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApiContext = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApiContext must be used within an ApiIntegrationProvider');
  }
  return context;
};

interface ApiIntegrationProviderProps {
  children: ReactNode;
}

export const ApiIntegrationProvider: React.FC<ApiIntegrationProviderProps> = ({ children }) => {
  const auth = useAuth();
  const videos = useVideos();
  const quizzes = useQuizzes();
  const dashboard = useStudentDashboard();

  const value = {
    auth,
    videos,
    quizzes,
    dashboard,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Student {
  id: string;
  name: string;
  email: string;
  batch: string;
  language: 'tamil' | 'english';
  avatar?: string;
}

interface Video {
  id: string;
  title: string;
  instructor: string;
  subject: string;
  topic: string;
  duration: string;
  views: number;
  thumbnail: string;
  level: string;
  uploadDate: string;
  isNew?: boolean;
  isDownloaded?: boolean;
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  questions: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  attempts: number;
  bestScore?: number;
}

interface StudentContextType {
  student: Student;
  videos: Video[];
  quizzes: Quiz[];
  language: 'tamil' | 'english';
  setLanguage: (lang: 'tamil' | 'english') => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};

export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'tamil' | 'english'>('english');

  const student: Student = {
    id: '1',
    name: 'Arjun Kumar',
    email: 'arjun@example.com',
    batch: 'NEET 2024',
    language: language,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  };

  const videos: Video[] = [
    {
      id: '1',
      title: 'Physics - Newton\'s Laws of Motion',
      instructor: 'Dr. Rajesh Kumar',
      subject: 'Physics',
      topic: 'Mechanics',
      duration: '45:30',
      views: 1250,
      thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop',
      level: 'Beginner',
      uploadDate: '2024-06-14',
      isNew: true,
      isDownloaded: false
    },
    {
      id: '2',
      title: 'Chemistry - Organic Compounds',
      instructor: 'Dr. Priya Sharma',
      subject: 'Chemistry',
      topic: 'Organic Chemistry',
      duration: '38:15',
      views: 980,
      thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=225&fit=crop',
      level: 'Intermediate',
      uploadDate: '2024-06-13',
      isDownloaded: true
    },
    {
      id: '3',
      title: 'Biology - Cell Structure',
      instructor: 'Dr. Ankit Verma',
      subject: 'Biology',
      topic: 'Cell Biology',
      duration: '52:20',
      views: 1650,
      thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=225&fit=crop',
      level: 'Advanced',
      uploadDate: '2024-06-12',
      isDownloaded: false
    }
  ];

  const quizzes: Quiz[] = [
    {
      id: '1',
      title: 'Physics Mock Test - Mechanics',
      subject: 'Physics',
      questions: 50,
      duration: 90,
      difficulty: 'medium',
      attempts: 2,
      bestScore: 78
    },
    {
      id: '2',
      title: 'Chemistry Daily Challenge',
      subject: 'Chemistry',
      questions: 20,
      duration: 30,
      difficulty: 'easy',
      attempts: 1,
      bestScore: 85
    },
    {
      id: '3',
      title: 'Biology Full Syllabus Test',
      subject: 'Biology',
      questions: 100,
      duration: 180,
      difficulty: 'hard',
      attempts: 0
    }
  ];

  return (
    <StudentContext.Provider value={{
      student,
      videos,
      quizzes,
      language,
      setLanguage
    }}>
      {children}
    </StudentContext.Provider>
  );
};

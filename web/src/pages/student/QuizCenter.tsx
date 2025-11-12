
import React, { useState } from 'react';
import QuizHeader from '@/containers/quiz/QuizHeader';
import QuizCategories from '@/containers/quiz/QuizCategories';
import QuizList from '@/containers/quiz/QuizList';
import EnhancedQuizInterface from '@/containers/quiz/EnhancedQuizInterface';
import BottomNavigation from '@/components/common/BottomNavigation';
import { useQuizzes, useQuizAttempts } from '@/hooks/api/useQuizzes';
import { Card, CardContent } from '@/components/ui/card';

interface QuizCenterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const QuizCenter: React.FC<QuizCenterProps> = ({ activeTab, onTabChange }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: quizzesData, isLoading: quizzesLoading } = useQuizzes({
    subject: activeCategory === 'all' ? undefined : activeCategory,
  });
  
  const { data: attemptsData, isLoading: attemptsLoading } = useQuizAttempts();

  const quizzes = quizzesData?.data || [];
  const attempts = attemptsData?.data || [];

  if (selectedQuiz) {
    return (
      <EnhancedQuizInterface
        quizId={selectedQuiz}
        onBack={() => setSelectedQuiz(null)}
      />
    );
  }

  if (quizzesLoading || attemptsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <QuizHeader />
      <div className="p-4 space-y-6">
        <QuizCategories activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes available</h3>
              <p className="text-gray-600">Check back later for new quizzes.</p>
            </CardContent>
          </Card>
        ) : (
          <QuizList 
            quizzes={quizzes} 
            category={activeCategory}
            onQuizSelect={setSelectedQuiz}
            attempts={attempts}
          />
        )}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default QuizCenter;

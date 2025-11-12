
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Award, Play, Users } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  subject: string;
  type: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  difficulty?: string;
  questionsCount?: number;
  attemptsCount?: number;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  completedAt: string;
}

interface QuizListProps {
  quizzes: Quiz[];
  category: string;
  onQuizSelect: (quizId: string) => void;
  attempts: QuizAttempt[];
}

const QuizList: React.FC<QuizListProps> = ({ quizzes, category, onQuizSelect, attempts }) => {
  const getDifficultyColor = (difficulty: string = 'medium') => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQuizAttempts = (quizId: string) => {
    return attempts.filter(attempt => attempt.quizId === quizId);
  };

  const getBestScore = (quizId: string) => {
    const quizAttempts = getQuizAttempts(quizId);
    return quizAttempts.length > 0 ? Math.max(...quizAttempts.map(a => a.score)) : null;
  };

  const filterQuizzes = () => {
    if (category === 'all') return quizzes;
    if (category === 'mock') return quizzes.filter(q => q.type === 'MOCK');
    if (category === 'daily') return quizzes.filter(q => q.type === 'DAILY');
    if (category === 'subject') return quizzes.filter(q => q.type === 'SUBJECT_WISE');
    return quizzes;
  };

  const filteredQuizzes = filterQuizzes();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Available Tests</h3>
        <Badge variant="outline">{filteredQuizzes.length} tests</Badge>
      </div>
      
      <div className="space-y-3">
        {filteredQuizzes.map((quiz) => {
          const userAttempts = getQuizAttempts(quiz.id);
          const bestScore = getBestScore(quiz.id);
          
          return (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{quiz.title}</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {quiz.subject}
                      </Badge>
                      {quiz.difficulty && (
                        <Badge className={`text-xs ${getDifficultyColor(quiz.difficulty)}`}>
                          {quiz.difficulty}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {quiz.type?.replace('_', ' ') || 'Quiz'}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => onQuizSelect(quiz.id)}
                    className="ml-4"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {userAttempts.length > 0 ? 'Retry' : 'Start'}
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {quiz.questionsCount || quiz.totalQuestions} Questions
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {quiz.duration} mins
                  </span>
                  {quiz.attemptsCount && (
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {quiz.attemptsCount} attempts
                    </span>
                  )}
                  {bestScore && (
                    <span className="flex items-center text-green-600">
                      <Award className="w-4 h-4 mr-1" />
                      Best: {bestScore}%
                    </span>
                  )}
                </div>
                
                {userAttempts.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Attempted {userAttempts.length} time{userAttempts.length > 1 ? 's' : ''}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {filteredQuizzes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tests available</h3>
              <p className="text-gray-600">Check back later for new {category === 'all' ? 'tests' : `${category} tests`}.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuizList;

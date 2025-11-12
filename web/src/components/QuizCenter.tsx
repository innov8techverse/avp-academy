
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Award, BookOpen, Play, Target } from 'lucide-react';
import QuizInterface from './QuizInterface';
import { useQuizzes, useQuizAttempts } from '@/hooks/api/useQuizzes';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

const QuizCenter = () => {
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  
  // Use the same endpoint as TestCenter for consistency with scheduled tests
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['student-practice-tests'],
    queryFn: async () => {
      const response = await apiClient.get('/tests/student/available');
      return response.data;
    },
  });
  
  const { data: attemptsData, isLoading: attemptsLoading } = useQuizAttempts();

  const quizzes = testsData?.data || [];
  const attempts = attemptsData?.data?.attempts || [];
  const stats = attemptsData?.data?.stats || {};

  if (selectedQuiz) {
    return <QuizInterface quizId={selectedQuiz} onBack={() => setSelectedQuiz(null)} />;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const mockTests = quizzes.filter((q: any) => q.type === 'MOCK');
  const dailyTests = quizzes.filter((q: any) => q.type === 'DAILY');
  const subjectTests = quizzes.filter((q: any) => q.type === 'SUBJECT_WISE');

  if (testsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading quizzes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Center</h1>
        <p className="text-gray-600">Test your knowledge and track your progress</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts || '0'}</p>
            <p className="text-sm text-gray-600">Tests Taken</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.avgScore || '0'}%</p>
            <p className="text-sm text-gray-600">Avg Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">#{stats.rank || 'N/A'}</p>
            <p className="text-sm text-gray-600">Rank</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.practiceTime || '0h'}</p>
            <p className="text-sm text-gray-600">Practice Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Categories */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="mock">Mock Exams</TabsTrigger>
          <TabsTrigger value="daily">Daily Tests</TabsTrigger>
          <TabsTrigger value="subject">Subject Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {quizzes.map((quiz: any) => (
              <Card key={quiz.quiz_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{quiz.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{quiz.subject?.name || 'General'}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {quiz.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {quiz.total_questions} Questions
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {quiz.time_limit_minutes} mins
                        </span>
                        {quiz.bestScore && (
                          <span className="flex items-center text-green-600">
                            <Award className="w-4 h-4 mr-1" />
                            Best: {quiz.bestScore}%
                          </span>
                        )}
                      </div>
                      
                      {/* Scheduling Information */}
                      {(quiz.start_time || quiz.end_time_scheduled) && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                          <div className="font-medium mb-1">📅 Schedule:</div>
                          {quiz.start_time && (
                            <div>🚀 {new Date(quiz.start_time).toLocaleString('en-IN', {timeZone: 'Asia/Kolkata', timeStyle: 'short', dateStyle: 'short'})} IST</div>
                          )}
                          {quiz.end_time_scheduled && (
                            <div>🏁 {new Date(quiz.end_time_scheduled).toLocaleString('en-IN', {timeZone: 'Asia/Kolkata', timeStyle: 'short', dateStyle: 'short'})} IST</div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button onClick={() => setSelectedQuiz(quiz.quiz_id)}>
                      <Play className="w-4 h-4 mr-2" />
                      {quiz.attempts_count > 0 ? 'Retry' : 'Start'}
                    </Button>
                  </div>
                  {quiz.attempts_count > 0 && (
                    <div className="text-sm text-gray-600">
                      Attempted {quiz.attempts_count} time{quiz.attempts_count > 1 ? 's' : ''}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mock" className="space-y-4">
          <div className="grid gap-4">
            {mockTests.map((quiz: any) => (
              <Card key={quiz.quiz_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{quiz.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{quiz.subject?.name || 'General'}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {quiz.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{quiz.total_questions} Questions</span>
                        <span>{quiz.time_limit_minutes} mins</span>
                      </div>
                    </div>
                    <Button onClick={() => setSelectedQuiz(quiz.quiz_id)}>
                      <Play className="w-4 h-4 mr-2" />
                      {quiz.attempts_count > 0 ? 'Retry' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid gap-4">
            {dailyTests.map((quiz: any) => (
              <Card key={quiz.quiz_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{quiz.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{quiz.subject?.name || 'General'}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {quiz.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{quiz.total_questions} Questions</span>
                        <span>{quiz.time_limit_minutes} mins</span>
                      </div>
                    </div>
                    <Button onClick={() => setSelectedQuiz(quiz.quiz_id)}>
                      <Play className="w-4 h-4 mr-2" />
                      {quiz.attempts_count > 0 ? 'Retry' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subject" className="space-y-4">
          <div className="grid gap-4">
            {subjectTests.map((quiz: any) => (
              <Card key={quiz.quiz_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{quiz.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{quiz.subject?.name || 'General'}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {quiz.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{quiz.total_questions} Questions</span>
                        <span>{quiz.time_limit_minutes} mins</span>
                      </div>
                    </div>
                    <Button onClick={() => setSelectedQuiz(quiz.quiz_id)}>
                      <Play className="w-4 h-4 mr-2" />
                      {quiz.attempts_count > 0 ? 'Retry' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizCenter;

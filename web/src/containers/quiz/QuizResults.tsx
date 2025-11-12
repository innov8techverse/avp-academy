
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Clock, BookOpen, TrendingUp, Award, Star, Home } from 'lucide-react';
import QuizLeaderboard from './QuizLeaderboard';
import TestHistory from './TestHistory';

interface QuizResultsProps {
  score: number; // Percentage score
  totalMarks?: number; // Raw marks obtained
  maxMarks?: number; // Maximum possible marks
  totalQuestions: number;
  timeSpent: number;
  correctAnswers: number;
  onBackToCenter: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalMarks,
  maxMarks,
  totalQuestions,
  timeSpent,
  correctAnswers,
  onBackToCenter
}) => {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const incorrectAnswers = totalQuestions - correctAnswers;
  
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { message: "Excellent! Outstanding performance!", color: "text-green-600", icon: Trophy };
    if (percentage >= 80) return { message: "Great job! You're doing well!", color: "text-blue-600", icon: Award };
    if (percentage >= 70) return { message: "Good work! Keep practicing!", color: "text-yellow-600", icon: Star };
    return { message: "Keep studying! You'll improve!", color: "text-orange-600", icon: Target };
  };

  const performance = getPerformanceMessage();
  const PerformanceIcon = performance.icon;

  // Mock leaderboard data
  const leaderboardEntries = [
    { rank: 1, name: "Alex Chen", score: 95, time: "12:45", avatar: "", badge: "Top Scorer" },
    { rank: 2, name: "Sarah Johnson", score: 92, time: "14:20", avatar: "" },
    { rank: 3, name: "Mike Wilson", score: 88, time: "13:15", avatar: "" },
    { rank: 4, name: "You", score: percentage, time: `${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}`, avatar: "" },
    { rank: 5, name: "Emma Davis", score: 82, time: "15:30", avatar: "" }
  ];

  // Mock test history data
  const testHistory = [
    {
      id: '1',
      title: 'Physics Mock Test 1',
      subject: 'Physics',
      score: 85,
      totalQuestions: 20,
      correctAnswers: 17,
      timeSpent: '25:30',
      date: '2024-06-10',
      rank: 3,
      totalParticipants: 150,
      status: 'completed' as const
    },
    {
      id: '2',
      title: 'Chemistry Daily Test',
      subject: 'Chemistry',
      score: 78,
      totalQuestions: 15,
      correctAnswers: 12,
      timeSpent: '18:45',
      date: '2024-06-08',
      rank: 8,
      totalParticipants: 120,
      status: 'completed' as const
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Results Card */}
        <Card className="text-center shadow-lg">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 flex items-center justify-center bg-blue-100 rounded-full">
              <PerformanceIcon className={`w-8 h-8 md:w-10 md:h-10 ${performance.color}`} />
            </div>
            <CardTitle className="text-xl md:text-2xl text-gray-900">Quiz Completed!</CardTitle>
            <p className={`text-base md:text-lg ${performance.color} font-medium`}>
              {performance.message}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center justify-center border-4 border-blue-200">
                {totalMarks !== undefined && maxMarks !== undefined ? (
                  <>
                    <div className="text-lg md:text-xl font-bold text-gray-900">
                      {totalMarks}/{maxMarks}
                    </div>
                    <div className="text-sm text-gray-600">marks</div>
                    <div className="text-xl md:text-2xl font-bold text-blue-600">
                      {percentage}%
                    </div>
                  </>
                ) : (
                  <div className="text-2xl md:text-3xl font-bold text-blue-600">{percentage}%</div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-red-600">{incorrectAnswers}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center pt-4">
              <Button onClick={onBackToCenter} className="flex items-center justify-center gap-2 px-8">
                <Home className="w-4 h-4" />
                Back to Quiz Center
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results Tabs */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-4">
            <QuizLeaderboard 
              quizTitle="Physics Mock Test"
              userRank={4}
              entries={leaderboardEntries}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {/* Performance Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Accuracy</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-sm text-gray-600">Time Spent</div>
                      <div className="font-medium">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="text-sm text-gray-600">Questions</div>
                      <div className="font-medium">{totalQuestions} total</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject-wise Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Subject Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Physics', 'Chemistry', 'Biology'].map((subject) => {
                    const subjectScore = Math.floor(Math.random() * 40) + 60;
                    return (
                      <div key={subject} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{subject}</span>
                          <span className="text-sm text-gray-600">{subjectScore}%</span>
                        </div>
                        <Progress value={subjectScore} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <TestHistory 
              entries={testHistory}
              onRetakeTest={(testId) => {}}
              onViewDetails={(testId) => {}}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QuizResults;

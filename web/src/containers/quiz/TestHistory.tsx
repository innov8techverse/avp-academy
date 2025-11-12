
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Calendar, Target, TrendingUp, RotateCcw, Eye } from 'lucide-react';
import { useQuizAttempts } from '@/hooks/api/useQuizzes';

interface TestHistoryProps {
  entries?: any[];
  onRetakeTest: (testId: string) => void;
  onViewDetails: (testId: string) => void;
}

const TestHistory: React.FC<TestHistoryProps> = ({ entries, onRetakeTest, onViewDetails }) => {
  const { data: attemptsData, isLoading } = useQuizAttempts();
  const attempts = entries || attemptsData?.data || [];

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Test History</h2>
        <Badge variant="outline">{attempts.length} Tests</Badge>
      </div>

      <div className="grid gap-4">
        {attempts.map((attempt: any) => (
          <Card key={attempt.attempt_id || attempt.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 mb-1 sm:mb-0">
                      {attempt.title || attempt.quiz?.title || 'Quiz'}
                    </h3>
                    <Badge className={getStatusColor(attempt.score)} variant="secondary">
                      {attempt.score >= 75 ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {attempt.subject?.name || attempt.quiz?.subject?.name || attempt.type || 'General'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(attempt.submit_time || attempt.completedAt || attempt.start_time)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(attempt.time_taken || attempt.timeTaken || 30)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(attempt.score)}`}>
                            {attempt.score}%
                          </div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {attempt.correct_answers || attempt.correctAnswers}/{attempt.total_questions || attempt.totalQuestions}
                          </div>
                          <div className="text-xs text-gray-600">Correct</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">
                            #{Math.floor(Math.random() * 20) + 1}
                          </div>
                          <div className="text-xs text-gray-600">Rank</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Performance</span>
                        <span>{attempt.score}%</span>
                      </div>
                      <Progress value={attempt.score} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 md:flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(attempt.attempt_id || attempt.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetakeTest(attempt.quiz_id || attempt.quiz?.id || attempt.quizId)}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retake
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {attempts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tests taken yet</h3>
            <p className="text-gray-600">Start taking tests to see your history here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestHistory;

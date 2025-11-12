import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Calendar,
  BookOpen,
  Timer,
  Zap
} from 'lucide-react';

interface TestAttempt {
  attempt_id: number;
  score: number; // Percentage score
  scorePercentage?: number; // Explicit percentage
  totalMarks?: number; // Raw marks obtained
  maxMarks?: number; // Maximum possible marks
  accuracy: number;
  correct_answers: number;
  wrong_answers: number;
  unattemptedQuestions?: number;
  total_questions: number;
  time_taken: number;
  created_at: string;
  submit_time: string;
  quiz: {
    title: string;
    type: string;
    total_marks: number;
    time_limit_minutes: number;
  };
}

interface QuestionAnalysis {
  question_id: number;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  marks_obtained: number;
  time_spent: number;
  difficulty: string;
  topic: string;
}

interface StudentTestAnalysisProps {
  attemptId: string;
  onBack: () => void;
}

const StudentTestAnalysis: React.FC<StudentTestAnalysisProps> = ({ attemptId, onBack }) => {
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questionAnalysis, setQuestionAnalysis] = useState<QuestionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tests/attempt/${attemptId}/analysis`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }

        const data = await response.json();
        setAttempt(data.data.attempt);
        setQuestionAnalysis(data.data.questions);
      } catch (error) {
        // Error fetching analysis
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load analysis.</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPerformanceInsights = () => {
    const insights = [];
    
    if (attempt.accuracy >= 90) {
      insights.push({ type: 'success', message: 'Excellent accuracy! You have a strong understanding of the concepts.' });
    } else if (attempt.accuracy >= 70) {
      insights.push({ type: 'warning', message: 'Good performance, but there\'s room for improvement in some areas.' });
    } else {
      insights.push({ type: 'error', message: 'Consider reviewing the topics where you struggled.' });
    }

    if (attempt.time_taken < (attempt.quiz.time_limit_minutes * 60 * 0.7)) {
      insights.push({ type: 'success', message: 'You completed the test efficiently with time to spare.' });
    } else if (attempt.time_taken > (attempt.quiz.time_limit_minutes * 60 * 0.9)) {
      insights.push({ type: 'warning', message: 'You used most of the available time. Consider improving time management.' });
    }

    const correctQuestions = questionAnalysis.filter(q => q.is_correct);
    const incorrectQuestions = questionAnalysis.filter(q => !q.is_correct);

    if (incorrectQuestions.length > 0) {
      const mostCommonTopic = incorrectQuestions.reduce((acc, q) => {
        acc[q.topic] = (acc[q.topic] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const weakestTopic = Object.entries(mostCommonTopic).sort((a, b) => b[1] - a[1])[0];
      if (weakestTopic) {
        insights.push({ 
          type: 'error', 
          message: `Focus on improving your ${weakestTopic[0]} knowledge - this was your weakest area.` 
        });
      }
    }

    return insights;
  };

  const insights = getPerformanceInsights();

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Analysis</h1>
            <p className="text-gray-600">{attempt.quiz.title}</p>
          </div>
          <Button variant="outline" onClick={onBack}>
            Back to Tests
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${getScoreColor(attempt.score)}`}>
                {attempt.totalMarks !== undefined && attempt.maxMarks !== undefined 
                  ? `${attempt.totalMarks}/${attempt.maxMarks}` 
                  : 'N/A'
                }
              </div>
              <div className={`text-lg font-semibold ${getScoreColor(attempt.score)}`}>
                {attempt.score}%
              </div>
              <div className="text-sm text-gray-600">Score (Marks/Percentage)</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${getAccuracyColor(attempt.accuracy)}`}>
                {attempt.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {attempt.correct_answers || questionAnalysis.filter(q => q.is_correct).length}/{attempt.total_questions}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatTime(attempt.time_taken)}
              </div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Question Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Score</span>
                    <span>{attempt.score}%</span>
                  </div>
                  <Progress value={attempt.score} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Accuracy</span>
                    <span>{attempt.accuracy.toFixed(1)}%</span>
                  </div>
                  <Progress value={attempt.accuracy} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{attempt.correct_answers || questionAnalysis.filter(q => q.is_correct).length}</div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{attempt.wrong_answers}</div>
                    <div className="text-sm text-gray-600">Incorrect</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Timer className="w-5 h-5 mr-2" />
                  Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {formatTime(attempt.time_taken)}
                    </div>
                    <div className="text-sm text-gray-600">Time Used</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {formatTime(attempt.quiz.time_limit_minutes * 60 - attempt.time_taken)}
                    </div>
                    <div className="text-sm text-gray-600">Time Remaining</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Time Efficiency</span>
                    <span>{((attempt.time_taken / (attempt.quiz.time_limit_minutes * 60)) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(attempt.time_taken / (attempt.quiz.time_limit_minutes * 60)) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question-by-Question Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questionAnalysis.map((question, index) => (
                  <div key={question.question_id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant={question.is_correct ? "default" : "destructive"}>
                          {question.is_correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </Badge>
                        <span className="font-medium">Question {index + 1}</span>
                        <Badge variant="outline">{question.topic}</Badge>
                        <Badge variant="outline">{question.difficulty}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {question.marks_obtained}/{question.marks} marks
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(question.time_spent)}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-900 mb-3">{question.question_text}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Your Answer:</span>
                        <span className={`ml-2 ${question.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                          {question.user_answer}
                        </span>
                      </div>
                      {!question.is_correct && (
                        <div>
                          <span className="font-medium text-gray-700">Correct Answer:</span>
                          <span className="ml-2 text-green-600">{question.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Performance by Topic
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const topicStats = questionAnalysis.reduce((acc, q) => {
                    if (!acc[q.topic]) {
                      acc[q.topic] = { correct: 0, total: 0 };
                    }
                    acc[q.topic].total++;
                    if (q.is_correct) acc[q.topic].correct++;
                    return acc;
                  }, {} as Record<string, { correct: number; total: number }>);

                  return (
                    <div className="space-y-3">
                      {Object.entries(topicStats).map(([topic, stats]) => (
                        <div key={topic}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{topic}</span>
                            <span>{stats.correct}/{stats.total} ({((stats.correct / stats.total) * 100).toFixed(1)}%)</span>
                          </div>
                          <Progress value={(stats.correct / stats.total) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Difficulty Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Performance by Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const difficultyStats = questionAnalysis.reduce((acc, q) => {
                    if (!acc[q.difficulty]) {
                      acc[q.difficulty] = { correct: 0, total: 0 };
                    }
                    acc[q.difficulty].total++;
                    if (q.is_correct) acc[q.difficulty].correct++;
                    return acc;
                  }, {} as Record<string, { correct: number; total: number }>);

                  return (
                    <div className="space-y-3">
                      {Object.entries(difficultyStats).map(([difficulty, stats]) => (
                        <div key={difficulty}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{difficulty}</span>
                            <span>{stats.correct}/{stats.total} ({((stats.correct / stats.total) * 100).toFixed(1)}%)</span>
                          </div>
                          <Progress value={(stats.correct / stats.total) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  insight.type === 'success' ? 'bg-green-50 border-green-200' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start">
                    {insight.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />}
                    {insight.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />}
                    {insight.type === 'error' && <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />}
                    <p className="text-sm">{insight.message}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentTestAnalysis; 
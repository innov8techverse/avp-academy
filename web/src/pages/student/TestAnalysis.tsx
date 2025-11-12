import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Calendar,
  User
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

interface Question {
  question_id: number;
  question_text: string;
  type: string;
  options?: string[] | Record<string, string>; // Support both array and object formats
  correct_answer: string;
  marks: number;
  user_answer?: string;
  is_correct?: boolean;
  marks_obtained: number;
  explanation?: string;
  topic?: string;
  difficulty?: string;
}

interface TestAttempt {
  attempt_id: number;
  score: number;
  total_marks: number;
  time_taken_minutes: number;
  completed_at: string;
  accuracy: number;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  quiz: {
    quiz_id: number;
    title: string;
    type: string;
    time_limit_minutes?: number;
    total_marks?: number;
    course?: {
      name: string;
    };
    subject?: {
      name: string;
    };
    settings?: {
      showCorrectAnswers?: boolean;
      resultReleaseTime?: string | null;
    };
  };
  questions: Question[];
}

const TestAnalysis: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const { data: attemptData, isLoading, error } = useQuery({
    queryKey: ['test-attempt', attemptId],
    queryFn: async () => {
      const response = await apiClient.get(`/tests/attempt/${attemptId}/analysis`);
      return response;
    },
    enabled: !!attemptId,
    retry: 2,
  });

  const attempt: TestAttempt = attemptData?.data;

  // Check if results should be shown based on test settings
  const shouldShowResults = () => {
    if (!attempt?.quiz?.settings) {
      return true;
    }
    
    const { showCorrectAnswers, resultReleaseTime } = attempt.quiz.settings;
    
    // If showCorrectAnswers is false, don't show results
    if (showCorrectAnswers === false) {
      return false;
    }
    
    // If resultReleaseTime is set, check if current time is after release time
    if (resultReleaseTime) {
      const releaseTime = new Date(resultReleaseTime);
      const currentTime = new Date();
      const isAfterRelease = currentTime >= releaseTime;
      return isAfterRelease;
    }
    
    return true;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return 'Excellent! Outstanding performance!';
    if (score >= 80) return 'Great job! You performed very well.';
    if (score >= 70) return 'Good work! You have a solid understanding.';
    if (score >= 60) return 'Fair performance. Keep practicing!';
    if (score >= 50) return 'You need more practice. Review the concepts.';
    return 'You need significant improvement. Consider retaking the test.';
  };

  // These calculations will be moved inside the component after null checks

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load test results</p>
          <p className="text-sm text-gray-600 mb-4">
            {error.message || 'Please try again later'}
          </p>
                      <Button onClick={() => navigate('/student/tests', { state: { fromTestCompletion: true } })}>Back to Test Center</Button>
        </div>
      </div>
    );
  }

  // Check if results should be shown
  if (!shouldShowResults()) {
    const releaseTime = attempt.quiz.settings?.resultReleaseTime;
    const showCorrectAnswers = attempt.quiz.settings?.showCorrectAnswers;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Results Pending</h2>
          
          {showCorrectAnswers === false ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your test has been completed successfully, but results and correct answers are not available for this test.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> This test is configured to not show results and correct answers to students.
                </p>
              </div>
            </div>
          ) : releaseTime ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your test results will be available after the instructor reviews and releases them.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Expected Release:</strong> {new Date(releaseTime).toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Results will be automatically available after this time.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              Your test results will be available after the instructor reviews and releases them.
            </p>
          )}
          
                      <Button onClick={() => navigate('/student/tests', { state: { fromTestCompletion: true } })} className="mt-4">
              Back to Test Center
            </Button>
        </div>
      </div>
    );
  }

  // Calculate counts for enhanced summary - now safely after null checks
  const correctCount = attempt.correct_answers || attempt.questions?.filter(q => q.is_correct).length || 0;
  const marksObtained = attempt.score || 0;
  const totalMarks = attempt.total_marks || 0;
  
  // Calculate wrong answers by checking questions that were answered but incorrect
  const wrongCount = attempt.questions?.filter(q => q.user_answer && q.user_answer.trim() !== '' && !q.is_correct).length || 0;
  
  // Calculate unanswered questions by checking if user actually provided an answer
  const answeredQuestions = attempt.questions?.filter(q => q.user_answer && q.user_answer.trim() !== '') || [];
  const unattemptedCount = (attempt.total_questions || 0) - answeredQuestions.length;
  
  // Calculate total negative marks from wrong answers
  const totalNegativeMarks = attempt.questions
    ?.filter(q => !q.is_correct && q.marks_obtained < 0)
    ?.reduce((sum, q) => sum + Math.abs(q.marks_obtained), 0) || 0;

  const percentage = Math.round((attempt.score / attempt.total_marks) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/student/tests', { state: { fromTestCompletion: true } })}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tests
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Test Results</h1>
                <p className="text-sm text-gray-600">{attempt.quiz.title}</p>
              </div>
            </div>
            <Badge className={getScoreBadge(attempt.accuracy)}>
              {attempt.accuracy}%
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Score Overview */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Performance Summary
            </CardTitle>
          </CardHeader>
                      <CardContent>
              {/* Test Summary */}
              <div className="mb-6">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-800 mb-1">
                    {attempt.total_questions} Questions
                  </div>
                  <p className="text-sm text-gray-600">Total questions in this test</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {correctCount}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Correct</p>
                    <p className="text-xs text-green-600">+{marksObtained} marks</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600 mb-2">
                      {wrongCount}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Wrong</p>
                    {totalNegativeMarks > 0 ? (
                      <p className="text-xs text-red-600">-{totalNegativeMarks} marks</p>
                    ) : (
                      <p className="text-xs text-red-600">No marks</p>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-600 mb-2">
                      {unattemptedCount}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Unanswered</p>
                    <p className="text-xs text-gray-600">Left blank</p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {marksObtained}
                  </div>
                  <p className="text-sm text-gray-600">Total Marks Obtained</p>
                  <p className="text-xs text-gray-500">Final Score</p>
                </div>
              </div>

              {/* Performance Progress and Message */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Performance</span>
                    <span className="text-sm font-medium text-gray-600">{Math.round(attempt.accuracy)}%</span>
                  </div>
                  <Progress value={attempt.accuracy} className="h-3" />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {attempt.accuracy >= 80 ? (
                        <Award className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : attempt.accuracy >= 60 ? (
                        <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-1">Performance Assessment</p>
                      <p className="text-sm text-gray-700">{getPerformanceMessage(attempt.accuracy)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
        </Card>

        {/* Test Details */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Test Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Type:</span>
                  <span className="font-medium">{attempt.quiz.type}</span>
                </div>
                {attempt.quiz.course && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium">{attempt.quiz.course.name}</span>
                  </div>
                )}
                {attempt.quiz.subject && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium">{attempt.quiz.subject.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Limit:</span>
                  <span className="font-medium">
                    {attempt.quiz.time_limit_minutes ? `${attempt.quiz.time_limit_minutes} minutes` : 'No limit'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Taken:</span>
                  <span className="font-medium">{attempt.time_taken_minutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium">
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium">
                    {Math.round(attempt.accuracy)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Analysis */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Question Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attempt.questions.map((question, index) => (
                <div key={question.question_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Q{index + 1}:</span>
                      <span className="text-gray-700">{question.question_text}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={question.is_correct ? 'default' : 'destructive'}>
                        {question.is_correct ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {question.marks_obtained}
                      </Badge>
                    </div>
                  </div>

                  {question.type === 'MCQ' && question.options && (
                    <div className="space-y-2">
                      {(() => {
                        // Handle both array and object formats for options
                        const isObjectFormat = !Array.isArray(question.options);
                        const optionsArray = Array.isArray(question.options) 
                          ? question.options 
                          : Object.entries(question.options).map(([key, value]) => `${key}: ${value}`);
                        
                        return optionsArray.map((option, optionIndex) => {
                          // Handle answer matching for both formats
                          let isCorrectAnswer = false;
                          let isUserAnswer = false;
                          
                          if (isObjectFormat) {
                            // For object format, extract the key (A, B, C, D)
                            const optionKey = option.split(':')[0].trim();
                            isCorrectAnswer = question.correct_answer === optionKey || question.correct_answer === option;
                            isUserAnswer = question.user_answer === optionKey || question.user_answer === option;
                          } else {
                            // For array format, direct comparison
                            isCorrectAnswer = option === question.correct_answer;
                            isUserAnswer = option === question.user_answer;
                          }
                          
                          return (
                            <div
                              key={optionIndex}
                              className={`p-2 rounded border ${isCorrectAnswer
                                  ? 'bg-green-50 border-green-200'
                                  : isUserAnswer && !question.is_correct
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm">
                                  {option}
                                  {attempt.quiz.settings?.showCorrectAnswers !== false && isCorrectAnswer && (
                                    <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                                  )}
                                  {isUserAnswer && !question.is_correct && (
                                    <XCircle className="w-4 h-4 text-red-600 inline ml-2" />
                                  )}
                                </span>
                                {isUserAnswer && (
                                  <Badge variant={question.is_correct ? "default" : "destructive"}>
                                    Your Answer
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {question.type === 'TRUE_FALSE' && (
                    <div className="space-y-2">
                      {['True', 'False'].map((option) => (
                        <div
                          key={option}
                          className={`p-2 rounded border ${option.toLowerCase() === question.correct_answer
                              ? 'bg-green-50 border-green-200'
                              : option.toLowerCase() === question.user_answer && !question.is_correct
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                          <span className="text-sm">
                            {option}
                            {attempt.quiz.settings?.showCorrectAnswers !== false && option.toLowerCase() === question.correct_answer && (
                              <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                            )}
                            {option.toLowerCase() === question.user_answer && !question.is_correct && (
                              <XCircle className="w-4 h-4 text-red-600 inline ml-2" />
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'FILL_IN_THE_BLANK' && (
                    <div className="space-y-2">
                      <div
                        className={`p-2 rounded border ${question.user_answer?.toLowerCase() === question.correct_answer?.toLowerCase()
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                          }`}
                      >
                        <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                        <span className="text-sm">{question.user_answer || 'No answer provided'}</span>

                        {question.user_answer?.toLowerCase() === question.correct_answer?.toLowerCase() ? (
                          <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600 inline ml-2" />
                            {attempt.quiz.settings?.showCorrectAnswers !== false && (
                              <p className="text-sm text-gray-600 mt-1">
                                Correct Answer: <span className="font-medium">{question.correct_answer}</span>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {question.type === 'Essay' && (
                    <div className="space-y-2">
                      <div className="p-2 rounded border bg-gray-50">
                        <p className="text-sm text-gray-600 mb-2">Your Answer:</p>
                        <p className="text-sm">{question.user_answer || 'No answer provided'}</p>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-2">
                        <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
                        <p className="text-sm font-medium text-blue-800">Explanation</p>
                      </div>
                      <p className="text-sm text-blue-700">{question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => navigate('/student/tests', { state: { fromTestCompletion: true } })}
            variant="outline"
          >
            Back to Test Center
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestAnalysis; 
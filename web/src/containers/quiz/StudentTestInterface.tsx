import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, ChevronLeft, ChevronRight, Flag, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
  type: string;
  options?: any;
  marks: number;
  order: number;
}

interface Test {
  quiz_id: number;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  total_marks?: number;
  questions: Question[];
}

interface TestAttempt {
  attempt_id: number;
  test: Test;
}

interface StudentTestInterfaceProps {
  testId: string;
  onBack: () => void;
}

const StudentTestInterface: React.FC<StudentTestInterfaceProps> = ({ testId, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Start test attempt
  const startTest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start test');
      }

      const data = await response.json();
      setTestAttempt(data.data);
      
      // Set timer if time limit exists
      if (data.data.test.time_limit_minutes) {
        setTimeLeft(data.data.test.time_limit_minutes * 60);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start test. Please try again.',
        variant: 'destructive',
      });
      onBack();
    } finally {
      setLoading(false);
    }
  }, [testId, toast, onBack]);

  // Submit answer
  const submitAnswer = async (questionId: number, answer: any) => {
    if (!testAttempt) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tests/attempt/${testAttempt.attempt_id}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          answer: answer.toString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      setAnswers(prev => ({ ...prev, [questionId]: answer }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit answer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Complete test
  const completeTest = async () => {
    if (!testAttempt) return;

    try {
      setSubmitting(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tests/attempt/${testAttempt.attempt_id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to complete test');
      }

      const data = await response.json();
      setResults(data.data);
      setShowResults(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || !testAttempt) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          toast({
            title: "Time's Up!",
            description: "Your test has been automatically submitted.",
            variant: "destructive"
          });
          completeTest();
          return 0;
        }
        if (prev === 300) { // 5 minutes warning
          toast({
            title: "5 Minutes Remaining",
            description: "Please complete your test soon.",
            variant: "destructive"
          });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testAttempt, toast]);

  // Start test on mount
  useEffect(() => {
    startTest();
  }, [startTest]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer: any) => {
    if (!testAttempt) return;
    
    const question = testAttempt.test.questions[currentQuestion];
    submitAnswer(question.id, answer);
  };

  const handleNext = () => {
    if (currentQuestion < (testAttempt?.test.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestion)) {
      newFlagged.delete(currentQuestion);
    } else {
      newFlagged.add(currentQuestion);
    }
    setFlaggedQuestions(newFlagged);
  };

  const getQuestionStatus = (index: number) => {
    if (!testAttempt) return 'unanswered';
    
    const question = testAttempt.test.questions[index];
    if (answers[question.id] !== undefined) {
      return 'answered';
    } else if (flaggedQuestions.has(index)) {
      return 'flagged';
    } else if (index === currentQuestion) {
      return 'current';
    }
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-500 text-white';
      case 'flagged': return 'bg-yellow-500 text-white';
      case 'current': return 'bg-blue-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const renderQuestion = () => {
    if (!testAttempt) return null;
    
    const question = testAttempt.test.questions[currentQuestion];
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'MCQ':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">Select your answer:</span>
              {currentAnswer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnswer('')}
                  className="text-xs"
                >
                  Clear Selection
                </Button>
              )}
            </div>
            {question.options && Object.entries(question.options).map(([key, value], index) => (
              <Button
                key={key}
                variant={currentAnswer === key ? "default" : "outline"}
                className="w-full text-left justify-start p-3 md:p-4 h-auto text-sm md:text-base"
                onClick={() => handleAnswer(key)}
              >
                <span className="flex-1">{value as string}</span>
              </Button>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
            <Button
              variant={currentAnswer === 'True' ? "default" : "outline"}
              className="flex-1 p-4 md:p-6 text-lg"
              onClick={() => handleAnswer('True')}
            >
              True
            </Button>
            <Button
              variant={currentAnswer === 'False' ? "default" : "outline"}
              className="flex-1 p-4 md:p-6 text-lg"
              onClick={() => handleAnswer('False')}
            >
              False
            </Button>
          </div>
        );

      case 'FILL_IN_THE_BLANK':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={currentAnswer || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Enter your answer..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      default:
        return (
          <div className="text-center p-8">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Question type not supported yet.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Starting test...</p>
        </div>
      </div>
    );
  }

  if (!testAttempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load test.</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {results?.totalMarks !== undefined && results?.maxMarks !== undefined 
                    ? `${results.totalMarks}/${results.maxMarks}` 
                    : 'N/A'
                  }
                </div>
                <div className="text-lg font-semibold text-blue-600">{results?.score || 0}%</div>
                <div className="text-sm text-gray-600">Score (Marks/Percentage)</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{results?.correctAnswers || 0}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{results?.wrongAnswers || 0}</div>
                <div className="text-sm text-gray-600">Wrong Answers</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{results?.totalQuestions || 0}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
                Back to Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{testAttempt.test.title}</h1>
            <p className="text-gray-600 mt-1">{testAttempt.test.description}</p>
          </div>
          <div className="flex items-center space-x-4">
            {timeLeft > 0 && (
              <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
                <span className="font-bold text-red-600">{formatTime(timeLeft)}</span>
              </div>
            )}
            <Button variant="outline" onClick={onBack}>
              Exit Test
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Object.keys(answers).length} / {testAttempt.test.questions.length} answered</span>
          </div>
          <Progress value={(Object.keys(answers).length / testAttempt.test.questions.length) * 100} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Question Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
                {testAttempt.test.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={`h-10 ${getStatusColor(getQuestionStatus(index))}`}
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Area */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">Question {currentQuestion + 1} of {testAttempt.test.questions.length}</Badge>
                  <Badge variant="outline">{testAttempt.test.questions[currentQuestion].marks} marks</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFlag}
                >
                  <Flag className={`w-4 h-4 ${flaggedQuestions.has(currentQuestion) ? 'text-yellow-600 fill-current' : ''}`} />
                </Button>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {testAttempt.test.questions[currentQuestion].text}
                </h3>
                {renderQuestion()}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex space-x-2">
                  {currentQuestion === testAttempt.test.questions.length - 1 ? (
                    <Button
                      onClick={() => setShowConfirmSubmit(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Submit Test
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Submit Dialog */}
      <Dialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to submit your test?</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowConfirmSubmit(false);
                  completeTest();
                }}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentTestInterface; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Clock,
  Target,
  Users,
  BookOpen,
  AlertCircle,
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Award,
  Minus,
  Plus,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Question {
  id: number;
  question_text: string;
  type: string;
  options?: Record<string, string> | string[];
  correct_answer?: string;
  left_side?: string;
  right_side?: string;
  marks?: number;
}

interface TestData {
  quiz_id: number;
  title: string;
  description?: string;
  type: string;
  time_limit_minutes: number;
  total_marks: number;
  total_questions?: number;
  marks_per_question?: number;
  has_negative_marking?: boolean;
  negative_marks?: number;
  passing_marks?:number;
  pass_percentage?: number;
  scheduled_at?: string;
  course?: { name: string };
  subject?: { name: string };
  batch?: { batch_name: string };
  questions: Question[];
  attempts?: Array<{
    attempt_id: number;
    score: number | null;
    is_completed: boolean;
    created_at: string;
    start_time: string;
    submit_time: string | null;
    time_taken: number | null;
    accuracy: number | null;
    correct_answers: number | null;
    wrong_answers: number | null;
  }>;
  settings?: {
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showImmediateResult?: boolean;
    negativeMarks?: boolean;
    negativeMarkValue?: number;
    allowRevisit?: boolean;
    showCorrectAnswers?: boolean;
    allowPreviousNavigation?: boolean;
    resultReleaseTime?: string | null;
    passPercentage?: number;
  };
}

interface Answer {
  questionId: number;
  answer: string | Record<string, string>;
}

const TestInterface: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [testData, setTestData] = useState<TestData | null>(null);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showQuestionNavigation, setShowQuestionNavigation] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<Record<number, string[]>>({});

  // Fetch test details (pre-test)
  const { data: fetchedTestData, isLoading: isLoadingTest, error: testError } = useQuery({
    queryKey: ['test-details', testId],
    queryFn: async () => {
      const response = await apiClient.get(`/tests/${testId}/student-details`);
      return response.data;
    },
    enabled: !!testId,
  });

  // Configuration loaded
  useEffect(() => {
    // Test data is loaded and ready
  }, [testData]);

  // Check for existing attempt and resume if available
  useEffect(() => {
    if (fetchedTestData && !testStarted) {
      setTestData(fetchedTestData);
      
      // Check if there's a completed attempt - redirect to results
      const completedAttempt = fetchedTestData.attempts?.find(attempt => attempt.is_completed);
      if (completedAttempt) {
        toast({
          title: 'Test Already Completed',
          description: 'You have already completed this test. Redirecting to results...',
        });
        navigate(`/student/test-analysis/${completedAttempt.attempt_id}`);
        return;
      }
      
      // Check if there's an existing incomplete attempt
      const existingAttempt = fetchedTestData.attempts?.[0];
      if (existingAttempt && !existingAttempt.is_completed) {
        // Found existing attempt to resume
        
        // Resume the existing attempt
        setAttemptId(existingAttempt.attempt_id);
        setTestStarted(true);
        setShowPreview(false);
        
        // Calculate remaining time
        const startTime = new Date(existingAttempt.start_time);
        const timeLimitMinutes = fetchedTestData.time_limit_minutes;
        const elapsedMinutes = (Date.now() - startTime.getTime()) / (1000 * 60);
        const remainingMinutes = Math.max(0, timeLimitMinutes - elapsedMinutes);
        const remainingSeconds = Math.floor(remainingMinutes * 60);
        
        // Resuming test with remaining time
        
        // Check if time has already run out
        if (remainingSeconds <= 0) {
          toast({
            title: 'Test Time Expired',
            description: 'Your test time has expired. Submitting automatically...',
            variant: 'destructive',
          });
          // Auto-submit the expired test
          setTimeout(() => {
            completeTestMutation.mutate();
          }, 2000);
          return;
        }
        
        setTimeLeft(remainingSeconds);
        
        // Map test data for resumption
        const mappedTest = {
          ...fetchedTestData,
          questions: (fetchedTestData.questions || []).map((q: any) => ({
            id: q.id,
            question_text: q.text || q.question_text, // Backend sends 'text', fallback to 'question_text'
            type: q.type,
            options: q.options,
            marks: q.marks,
            left_side: q.left_side,
            right_side: q.right_side,
            order: q.order
          })),
          settings: {
            shuffleQuestions: fetchedTestData.settings?.shuffleQuestions ?? false,
            shuffleOptions: fetchedTestData.settings?.shuffleOptions ?? false,
            showImmediateResult: fetchedTestData.settings?.showImmediateResult ?? false,
            negativeMarks: fetchedTestData.settings?.negativeMarks ?? false,
            negativeMarkValue: fetchedTestData.settings?.negativeMarkValue ?? 0,
            timeLimit: true,
            allowRevisit: fetchedTestData.settings?.allowRevisit ?? true,
            showCorrectAnswers: fetchedTestData.settings?.showCorrectAnswers ?? false,
            allowPreviousNavigation: fetchedTestData.settings?.allowPreviousNavigation ?? true,
            resultReleaseTime: fetchedTestData.settings?.resultReleaseTime ?? null,
            passPercentage: fetchedTestData.settings?.passPercentage ?? 40
          }
        };
        
        setTestData(mappedTest);
        // Use setTimeout to ensure state is properly set before shuffling
        setTimeout(() => {
          initializeShuffledTest(mappedTest.questions, mappedTest.settings);
        }, 0);
        
        // Load saved answers for the existing attempt
        loadSavedAnswers(existingAttempt.attempt_id);
        
        toast({
          title: 'Test Resumed',
          description: `Resuming your test with ${Math.floor(remainingMinutes)}:${(remainingMinutes % 1 * 60).toFixed(0).padStart(2, '0')} remaining`,
        });
      }
    }
  }, [fetchedTestData, testStarted]);

  // Ensure shuffled questions are properly initialized when test data changes
  useEffect(() => {
    if (testData && testData.questions && testData.settings && testStarted) {
      // Add a small delay to ensure state is properly set
      const timer = setTimeout(() => {
        initializeShuffledTest(testData.questions, testData.settings);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [testData, testStarted]);

  // Load saved answers for an existing attempt
  const loadSavedAnswers = async (attemptId: number) => {
    try {
      const response = await apiClient.get(`/tests/attempt/${attemptId}/saved-answers`);
      const savedData = response.data.data;
      
      if (savedData && savedData.saved_answers) {
        const answersMap: Record<number, Answer> = {};
        savedData.saved_answers.forEach((savedAnswer: any) => {
          if (savedAnswer.answer_text) {
            answersMap[savedAnswer.question_id] = {
              questionId: savedAnswer.question_id,
              answer: savedAnswer.answer_text
            };
          }
        });
        
        // Loaded saved answers successfully
        setAnswers(answersMap);
      }
    } catch (error) {
      // Failed to load saved answers
    }
  };

  // Shuffle array function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Shuffle questions and options based on test settings
  const initializeShuffledTest = (questions: Question[], settings: any) => {
    let processedQuestions = [...questions];
    
    // Shuffle questions if enabled
    if (settings?.shuffleQuestions) {
      processedQuestions = shuffleArray(questions);
    }
    
    setShuffledQuestions(processedQuestions);
    
    // Shuffle options for each question if enabled
    if (settings?.shuffleOptions) {
      const optionsMap: Record<number, string[]> = {};
      processedQuestions.forEach((question) => {
        if (question.options && Array.isArray(question.options)) {
          optionsMap[question.id] = shuffleArray(question.options as string[]);
        } else if (question.options && typeof question.options === 'object') {
          // Handle MCQ options as object
          const optionEntries = Object.entries(question.options);
          const shuffledEntries = shuffleArray(optionEntries);
          optionsMap[question.id] = shuffledEntries.map(([key, value]) => `${key}. ${value}`);
        }
      });
      setShuffledOptions(optionsMap);
    }
  };



  // Start test attempt
  const startTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/tests/${testId}/start`);
      return response;
    },
    onSuccess: (data) => {
      setAttemptId(data.data.attempt_id);
      setTimeLeft(data.data.test.time_limit_minutes * 60);
      setTestStarted(true);
      setShowPreview(false);
      
      // Map backend question fields to frontend shape
      const mappedTest = {
        ...data.data.test,
        questions: (data.data.test.questions || []).map((q: any) => {
          return {
            id: q.id,
            question_text: q.text || q.question_text, // Backend sends 'text', fallback to 'question_text'
            type: q.type,
            options: q.options,
            marks: q.marks,
            left_side: q.left_side,
            right_side: q.right_side,
            order: q.order
          };
        }),
        // Ensure settings are properly mapped
        settings: {
          shuffleQuestions: data.data.test.settings?.shuffleQuestions ?? false,
          shuffleOptions: data.data.test.settings?.shuffleOptions ?? false,
          showImmediateResult: data.data.test.settings?.showImmediateResult ?? false,
          negativeMarks: data.data.test.settings?.negativeMarks ?? false,
          negativeMarkValue: data.data.test.settings?.negativeMarkValue ?? 0,
          timeLimit: true,
          allowRevisit: data.data.test.settings?.allowRevisit ?? true,
          showCorrectAnswers: data.data.test.settings?.showCorrectAnswers ?? false,
          allowPreviousNavigation: data.data.test.settings?.allowPreviousNavigation ?? true,
          resultReleaseTime: data.data.test.settings?.resultReleaseTime ?? null,
          passPercentage: data.data.test.settings?.passPercentage ?? 40
        }
      };
      
      setTestData(mappedTest);
      
      // Initialize shuffled questions and options based on test settings
      // Use setTimeout to ensure state is properly set before shuffling
      setTimeout(() => {
        initializeShuffledTest(mappedTest.questions, mappedTest.settings);
      }, 0);
      
      toast({
        title: 'Test Started',
        description: 'Your test has begun. Good luck!',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to start test';
      
      // Handle specific error for already completed tests
      if (errorMessage.includes('already completed')) {
        toast({
          title: 'Test Already Completed',
          description: 'You have already completed this test. Redirecting to test center...',
          variant: 'destructive',
        });
        // Navigate back to test center after a short delay
        setTimeout(() => {
          navigate('/student/tests', { state: { fromTestCompletion: true } });
        }, 2000);
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // Submit answer
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string | Record<string, string> }) => {
      if (!attemptId) throw new Error('No attempt ID');
      
      const response = await apiClient.post(`/tests/attempt/${attemptId}/answer`, {
        questionId,
        answer: typeof answer === 'object' ? JSON.stringify(answer) : answer
      });
      return response;
    },
    onSuccess: (data, variables) => {
      // Answer saved successfully
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit answer',
        variant: 'destructive',
      });
    },
  });

  // Complete test
  const completeTestMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) throw new Error('No attempt ID');
      const response = await apiClient.post(`/tests/attempt/${attemptId}/complete`);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'Test Completed',
        description: 'Your test has been submitted successfully!',
      });
      navigate(`/student/test-analysis/${attemptId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to complete test',
        variant: 'destructive',
      });
    },
  });

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && testStarted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleCompleteTest();
            return 0;
          }
          
          // Show warning when 5 minutes remaining
          if (prev === 300) {
            toast({
              title: 'Time Warning',
              description: 'Only 5 minutes remaining! Please submit your test soon.',
              variant: 'destructive',
            });
          }
          
          // Show warning when 1 minute remaining
          if (prev === 60) {
            toast({
              title: 'Final Warning',
              description: 'Only 1 minute remaining! Submit your test now.',
              variant: 'destructive',
            });
          }
          
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, testStarted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && testStarted && !showSummary && !isSubmitting) {
      // Auto-submit the test
      completeTestMutation.mutate();
    }
  }, [timeLeft, testStarted, showSummary, isSubmitting]);

  // Prevent accidental page closure during test
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testStarted && !isSubmitting) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test progress will be saved.';
        return 'Are you sure you want to leave? Your test progress will be saved.';
      }
    };

    if (testStarted) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [testStarted, isSubmitting]);

  const handleStartTest = () => {
    if (!testData) return;
    startTestMutation.mutate();
  };

  const handleAnswerChange = (questionId: number, answer: string | Record<string, string>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { questionId, answer }
    }));

    // Auto-save answer
    if (testStarted && attemptId) {
      submitAnswerMutation.mutate({ questionId, answer });
    }
  };

  const handleNextQuestion = () => {
    const questionsToUse = shuffledQuestions.length > 0 ? shuffledQuestions : testData.questions;
    if (currentQuestionIndex < questionsToUse.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    // Check if previous navigation is allowed based on test settings
    if (!testData?.settings?.allowPreviousNavigation) {
      toast({
        title: 'Navigation Restricted',
        description: 'Previous navigation is not allowed in this test.',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionNavigation = (targetIndex: number) => {
    // Check if navigation to previous questions is allowed
    if (targetIndex < currentQuestionIndex && !testData?.settings?.allowPreviousNavigation) {
      toast({
        title: 'Navigation Restricted',
        description: 'Previous navigation is not allowed in this test.',
        variant: 'destructive',
      });
      return;
    }
    
    setCurrentQuestionIndex(targetIndex);
  };

  const handleCompleteTest = () => {
    setShowSummary(true);
  };

  const handleConfirmSubmit = () => {
    setShowSummary(false);
    setShowSubmitConfirmation(true);
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    completeTestMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const questionsToUse = shuffledQuestions.length > 0 ? shuffledQuestions : testData.questions;
    return ((currentQuestionIndex + 1) / questionsToUse.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getUnansweredCount = () => {
    const questionsToUse = shuffledQuestions.length > 0 ? shuffledQuestions : testData.questions;
    return questionsToUse.length - getAnsweredCount() || 0;
  };

  const getMarkedForReviewCount = () => {
    return markedForReview.size;
  };

  const getSummaryData = () => {
    const questionsToUse = shuffledQuestions.length > 0 ? shuffledQuestions : testData.questions;
    const total = questionsToUse.length || 0;
    const answered = getAnsweredCount();
    const unanswered = getUnansweredCount();
    const marked = getMarkedForReviewCount();

    return {
      total,
      answered,
      unanswered,
      marked,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0
    };
  };

  const renderQuestionByType = (question: Question) => {
    const currentAnswer = answers[question.id];
    const answerValue = currentAnswer && typeof currentAnswer === 'object' ? currentAnswer.answer : '';

    // Ensure question has required properties
    if (!question || !question.question_text) {

      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Question content is loading...</p>
          <p className="text-xs text-gray-400 mt-2">Question ID: {question?.id}</p>
        </div>
      );
    }

    switch (question.type?.toUpperCase()) {
      case 'MCQ':
      case 'CHOICE_BASED':
        // Use shuffled options if available, otherwise use original options
        const shuffledOpts = shuffledOptions[question.id];
        let options: string[] = [];
        let optionKeys: string[] = [];
        
        if (shuffledOpts) {
          // If shuffled options are available, use them
          options = shuffledOpts;
          optionKeys = shuffledOpts.map((_, index) => String.fromCharCode(97 + index)); // a, b, c, d (lowercase)
        } else if (Array.isArray(question.options)) {
          // If options is already an array, use it directly
          options = question.options;
          optionKeys = question.options.map((_, index) => String.fromCharCode(97 + index)); // a, b, c, d (lowercase)
        } else if (question.options && typeof question.options === 'object') {
          // If options is an object, extract keys and values
          const entries = Object.entries(question.options);
          optionKeys = entries.map(([key]) => key);
          options = entries.map(([, value]) => value as string);
        }
        
        // Ensure options are available
        if (!options || options.length === 0) {
          return (
            <div className="text-center py-8">
              <p className="text-gray-500">No options available for this question.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">Select your answer:</span>
              {answerValue && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnswerChange(question.id, '')}
                  className="text-xs"
                >
                  Clear Selection
                </Button>
              )}
            </div>
            <RadioGroup
              value={answerValue?.toString() || ''}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={optionKeys[index]} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 text-sm cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'FILL_IN_THE_BLANK':
      case 'FILL_IN_THE_BLANKS':
        const blanks = question.question_text.match(/_+/g) || ['_'];
        const fillAnswers = (typeof answerValue === 'string')
          ? { blank_0: answerValue }
          : (answerValue as Record<string, string>) || {};

        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {blanks.map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Label className="text-sm font-medium min-w-[80px]">
                    Blank {index + 1}:
                  </Label>
                  <Input
                    value={fillAnswers[`blank_${index}`] || ''}
                    onChange={(e) => {
                      const newAnswers = { ...fillAnswers, [`blank_${index}`]: e.target.value };
                      const singleAnswer = newAnswers[`blank_0`] || '';
                      handleAnswerChange(question.id, singleAnswer);
                    }}
                    placeholder={`Enter answer for blank ${index + 1}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={answerValue?.toString() || ''}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="flex-1 text-sm cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="flex-1 text-sm cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'MATCH':

        
        // For match questions, the options might be in a different format
        // Check if options exist and parse them properly
        let leftItems: string[] = [];
        let rightItems: string[] = [];
        
        if (question.left_side && question.right_side) {
          // If left_side and right_side are provided directly
          leftItems = question.left_side.split(',').map(item => item.trim());
          rightItems = question.right_side.split(',').map(item => item.trim());

        } else if (question.options && typeof question.options === 'object') {
          // If options are provided as an object with left and right sides
          const optionsObj = question.options as Record<string, string>;
          if (optionsObj.left && optionsObj.right) {
            leftItems = optionsObj.left.split(',').map(item => item.trim());
            rightItems = optionsObj.right.split(',').map(item => item.trim());

          } else {
            // Try to parse options as key-value pairs
            const entries = Object.entries(optionsObj);
            leftItems = entries.map(([key, value]) => key.trim());
            rightItems = entries.map(([key, value]) => value.trim());

          }
        } else if (Array.isArray(question.options)) {
          // If options are provided as an array, split them into left and right
          const midPoint = Math.ceil(question.options.length / 2);
          leftItems = question.options.slice(0, midPoint).map(item => String(item).trim());
          rightItems = question.options.slice(midPoint).map(item => String(item).trim());

        }
        
        const matchAnswers = (answerValue && typeof answerValue === 'object') ? answerValue as Record<string, string> : {};

        // If no items found, show error
        if (leftItems.length === 0 || rightItems.length === 0) {

          return (
            <div className="text-center py-8">
              <p className="text-gray-500">Match question data is not properly formatted.</p>
              <p className="text-xs text-gray-400 mt-2">Question ID: {question.id}</p>
              <p className="text-xs text-gray-400">Left side: {question.left_side || 'null'}</p>
              <p className="text-xs text-gray-400">Right side: {question.right_side || 'null'}</p>
              <p className="text-xs text-gray-400">Options: {JSON.stringify(question.options)}</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-gray-700">Column A</h4>
                <div className="space-y-2">
                  {leftItems.map((item, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded border text-sm">
                      {index + 1}. {item}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-gray-700">Column B</h4>
                <div className="space-y-2">
                  {rightItems.map((item, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded border text-sm">
                      {String.fromCharCode(65 + index)}. {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-3 text-gray-700">Your Matches</h4>
              <div className="space-y-3">
                {leftItems.map((leftItem, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-sm font-medium min-w-[100px]">
                      {index + 1}. {leftItem}
                    </span>
                    <span className="text-sm">matches with</span>
                    <select
                      value={matchAnswers[leftItem] || 'none'}
                      onChange={(e) => {
                        const newAnswers = {
                          ...matchAnswers,
                          [leftItem]: e.target.value === 'none' ? '' : e.target.value
                        };
                        handleAnswerChange(question.id, newAnswers);
                      }}
                      className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">Select match</option>
                      {rightItems.map((rightItem, rightIndex) => (
                        <option key={rightIndex} value={rightItem}>
                          {String.fromCharCode(65 + rightIndex)}. {rightItem}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <Textarea
              value={answerValue?.toString() || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer here..."
              rows={4}
              className="w-full"
            />
          </div>
        );
    }
  };

  // Loading state
  if (isLoadingTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (testError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load test</p>
          <Button onClick={() => navigate('/student/tests')}>Back to Tests</Button>
        </div>
      </div>
    );
  }

  // No test data
  if (!testData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Test not found</p>
          <Button onClick={() => navigate('/student/tests')}>Back to Tests</Button>
        </div>
      </div>
    );
  }

  // Test Preview Screen (Before Starting)
  if (showPreview && !testStarted) {
    const existingAttempt = testData?.attempts?.[0];
    const canResume = existingAttempt && !existingAttempt.is_completed;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/student/tests')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Button>
          </div>

          {/* Test Details Card */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl lg:text-2xl font-bold">{testData.title}</CardTitle>
                  <p className="text-blue-100 mt-1">{testData.description}</p>
                </div>
                <Badge className="bg-white/20 text-white border-white/30">
                  {testData.type}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Test Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="text-xl font-bold text-blue-600">{testData.total_marks/testData.marks_per_question}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-xl font-bold text-green-600">{testData.time_limit_minutes} min</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Total Marks</p>
                  <p className="text-xl font-bold text-purple-600">{testData.total_marks}</p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Important Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">Important Instructions</h3>
                    <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                      <li>Read each question carefully before answering</li>
                      <li>You can navigate between questions using the navigation buttons</li>
                      <li>Your answers are automatically saved</li>
                      {testData.has_negative_marking && (
                        <li className="font-medium text-red-600">
                          <Minus className="w-3 h-3 inline mr-1" />
                          Negative marking: -{testData.negative_marks || 0.25} marks for each wrong answers
                        </li>
                      )}
                      {testData.settings?.allowPreviousNavigation === false && (
                        <li className="font-medium text-orange-600">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Navigation: You cannot go back to previous questions
                        </li>
                      )}
                      {testData.settings?.allowPreviousNavigation !== false && (
                        <li className="font-medium text-green-600">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Navigation: You can revisit previous questions
                        </li>
                      )}
                      <li>Minimum {testData.passing_marks || 10}% required to pass</li>
                      <li>Submit your test before time runs out</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Start/Resume Test Button */}
              <div className="text-center">
                {canResume && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <Info className="w-4 h-4 inline mr-1" />
                      You have an incomplete attempt. You can resume your test with saved progress.
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={handleStartTest}
                  disabled={startTestMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold"
                >
                  {startTestMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {canResume ? 'Resuming Test...' : 'Starting Test...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      {canResume ? 'Resume Test' : 'Start Test'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Test Interface (During Test)
  const questions = (testData && Array.isArray(testData.questions)) ? testData.questions : [];
  if (!testStarted || !questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  const questionsToUse = shuffledQuestions.length > 0 ? shuffledQuestions : testData.questions;
  const currentQuestion = questionsToUse[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questionsToUse.length - 1;
  

  
  // Ensure we have a valid current question
  if (!currentQuestion && questionsToUse.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }
  
  const summaryData = getSummaryData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900">{testData.title}</h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {questionsToUse.length}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Answered</p>
                <p className="text-lg font-bold text-green-600">{getAnsweredCount()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Time Left</p>
                <p className={`text-lg font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuestionNavigation(!showQuestionNavigation)}
                >
                  {showQuestionNavigation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Progress value={getProgress()} className="w-full h-2" />
          </div>
        </div>
      </div>

      <div className={`max-w-6xl mx-auto p-4 ${isMobile ? '' : 'flex gap-6'}`}>
        {/* Main Content */}
        <div className={`${isMobile ? '' : 'flex-1'} space-y-6`}>
          {/* Question Card */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-3">
                  Q{currentQuestionIndex + 1}
                </span>
                <span className="flex-1">
                  {currentQuestion.question_text || 'Question text not available'}
                </span>
                {currentQuestion.marks && (
                  <Badge variant="outline" className="ml-auto">
                    {currentQuestion.marks} marks
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderQuestionByType(currentQuestion)}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
            {isMobile ? (
              // Mobile Navigation - Centered buttons
              <div className="flex flex-col space-y-3">
                <div className="flex justify-center space-x-4">
                                  <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0 || !testData?.settings?.allowPreviousNavigation}
                  className="flex-1 max-w-32"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                  <Button
                    onClick={handleNextQuestion}
                    disabled={isLastQuestion}
                    className="flex-1 max-w-32"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <div className="flex justify-center space-x-2">
                  <Button
                    variant={markedForReview.has(currentQuestionIndex) ? "default" : "outline"}
                    onClick={() => {
                      setMarkedForReview(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(currentQuestionIndex)) {
                          newSet.delete(currentQuestionIndex);
                        } else {
                          newSet.add(currentQuestionIndex);
                        }
                        return newSet;
                      });
                    }}
                    size="sm"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    {markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark for Review'}
                  </Button>

                  {isLastQuestion && (
                    <Button
                      onClick={handleCompleteTest}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Test'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              // Desktop Navigation
              <>
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0 || !testData?.settings?.allowPreviousNavigation}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant={markedForReview.has(currentQuestionIndex) ? "default" : "outline"}
                    onClick={() => {
                      setMarkedForReview(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(currentQuestionIndex)) {
                          newSet.delete(currentQuestionIndex);
                        } else {
                          newSet.add(currentQuestionIndex);
                        }
                        return newSet;
                      });
                    }}
                    size="sm"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    {markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark for Review'}
                  </Button>

                  {isLastQuestion && (
                    <Button
                      onClick={handleCompleteTest}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Test'
                      )}
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleNextQuestion}
                  disabled={isLastQuestion}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Question Navigation Panel */}
        {(!isMobile || showQuestionNavigation) && (
          <div className={`${isMobile ? 'mt-6' : 'w-80'}`}>
            <Card className="shadow-lg border-0 sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm">Question Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {questionsToUse.map((_, index) => {
                    const isAnswered = answers[questionsToUse[index].id];
                    const isMarked = markedForReview.has(index);
                    const isCurrent = currentQuestionIndex === index;

                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                        size="sm"
                        className={`w-8 h-8 p-0 text-xs ${isMarked ? 'ring-2 ring-yellow-400' : ''}`}
                        onClick={() => handleQuestionNavigation(index)}
                        disabled={index < currentQuestionIndex && !testData?.settings?.allowPreviousNavigation}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>

                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-gray-400 rounded"></div>
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-yellow-400 rounded"></div>
                    <span>Marked for Review</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Summary Modal */}
      <AlertDialog open={showSummary} onOpenChange={setShowSummary}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Test Summary</AlertDialogTitle>
            <AlertDialogDescription>
              Review your test progress before submitting
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm text-gray-600">Answered</p>
                <p className="text-xl font-bold text-green-600">{summaryData.answered}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <p className="text-sm text-gray-600">Left</p>
                <p className="text-xl font-bold text-red-600">{summaryData.unanswered}</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <Flag className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Marked for Review</p>
              <p className="text-xl font-bold text-yellow-600">{summaryData.marked}</p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <Target className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-xl font-bold text-blue-600">{summaryData.percentage}%</p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} className="bg-green-600 hover:bg-green-700">
              Submit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Modal */}
      <AlertDialog open={showSubmitConfirmation} onOpenChange={setShowSubmitConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Test Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your test? This action cannot be undone.
              {summaryData.unanswered > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 inline mr-1" />
                  You have {summaryData.unanswered} unanswered questions.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalSubmit} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Test'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestInterface; 
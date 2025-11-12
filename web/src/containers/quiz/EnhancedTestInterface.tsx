import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { testService } from '@/services/tests/testService';
import { Clock, Save, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  question_id: number;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  marks: number;
  explanation?: string;
}

interface TestAttempt {
  attempt_id: number;
  quiz_id: number;
  start_time: string;
  is_completed: boolean;
}

interface TimeStatus {
  remainingTime: number;
  remainingMinutes: number;
  remainingSeconds: number;
  graceRemainingTime: number;
  graceRemainingMinutes: number;
  graceRemainingSeconds: number;
  warningLevel: 'none' | 'notice' | 'warning' | 'critical' | 'ended';
  warningMessage: string | null;
  isInGracePeriod: boolean;
  testEnded: boolean;
}

interface EnhancedTestInterfaceProps {
  testId: number;
  attemptId: number;
  questions: Question[];
  onComplete: (attemptId: number) => void;
}

export const EnhancedTestInterface: React.FC<EnhancedTestInterfaceProps> = ({
  testId,
  attemptId,
  questions,
  onComplete
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeStatus, setTimeStatus] = useState<TimeStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const { toast } = useToast();

  // Auto-save interval (every 30 seconds)
  const AUTO_SAVE_INTERVAL = 30000;
  // Time status check interval (every 10 seconds)
  const TIME_CHECK_INTERVAL = 10000;

  // Get time status from server
  const fetchTimeStatus = useCallback(async () => {
    try {
      const response = await testService.getTestTimeStatus(attemptId);
      if (response.success) {
        setTimeStatus(response.data);
        
        // Auto-submit if test has ended
        if (response.data.testEnded && !isSubmitting) {
          handleAutoSubmit();
        }
      }
    } catch (error) {
      // Error fetching time status
    }
  }, [attemptId, isSubmitting]);

  // Auto-save progress
  const autoSaveProgress = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setAutoSaveStatus('saving');
      
      const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId: parseInt(questionId),
        selectedOption,
        isCorrect: questions.find(q => q.question_id === parseInt(questionId))?.correct_answer === selectedOption || false,
        marksObtained: questions.find(q => q.question_id === parseInt(questionId))?.correct_answer === selectedOption 
          ? questions.find(q => q.question_id === parseInt(questionId))?.marks || 0 
          : 0
      }));

      const response = await testService.autoSaveTestProgress(attemptId, answersArray);
      
      if (response.success) {
        setAutoSaveStatus('saved');
        setLastAutoSave(new Date());
        
        // Show warning if time is running out
        if (response.data.shouldWarn) {
          toast({
            title: "Time Warning",
            description: response.data.warningMessage,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      setAutoSaveStatus('error');
    }
  }, [answers, attemptId, questions, isSubmitting, toast]);

  // Handle auto-submission when test ends
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    toast({
      title: "Test Ended",
      description: "Submitting your answers automatically...",
      variant: "destructive"
    });

    try {
      await testService.completeTestAttempt(attemptId);
      onComplete(attemptId);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit test automatically. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, isSubmitting, onComplete, toast]);

  // Manual submission
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await testService.completeTestAttempt(attemptId);
      onComplete(attemptId);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: number, selectedOption: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  // Set up intervals
  useEffect(() => {
    // Initial fetch
    fetchTimeStatus();
    autoSaveProgress();

    // Set up intervals
    const timeInterval = setInterval(fetchTimeStatus, TIME_CHECK_INTERVAL);
    const autoSaveInterval = setInterval(autoSaveProgress, AUTO_SAVE_INTERVAL);

    return () => {
      clearInterval(timeInterval);
      clearInterval(autoSaveInterval);
    };
  }, [fetchTimeStatus, autoSaveProgress]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeStatus?.testEnded && !isSubmitting) {
      handleAutoSubmit();
    }
  }, [timeStatus?.testEnded, isSubmitting, handleAutoSubmit]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'warning': return 'bg-orange-500 text-white';
      case 'notice': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with time and progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Test in Progress
            </CardTitle>
            <div className="flex items-center gap-4">
              {/* Auto-save status */}
              <div className="flex items-center gap-2">
                {autoSaveStatus === 'saving' && <Save className="h-4 w-4 animate-spin text-blue-500" />}
                {autoSaveStatus === 'saved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {autoSaveStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                <span className="text-sm text-gray-600">
                  {autoSaveStatus === 'saved' && lastAutoSave && 
                    `Saved ${lastAutoSave.toLocaleTimeString()}`
                  }
                </span>
              </div>

              {/* Time remaining */}
              {timeStatus && (
                <Badge className={getWarningColor(timeStatus.warningLevel)}>
                  {timeStatus.isInGracePeriod 
                    ? `Grace: ${formatTime(timeStatus.graceRemainingMinutes, timeStatus.graceRemainingSeconds)}`
                    : `Time: ${formatTime(timeStatus.remainingMinutes, timeStatus.remainingSeconds)}`
                  }
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Time warning */}
          {timeStatus?.warningMessage && (
            <Alert className={`mt-4 ${timeStatus.warningLevel === 'critical' ? 'border-red-500 bg-red-50' : 
              timeStatus.warningLevel === 'warning' ? 'border-orange-500 bg-orange-50' : 
              'border-yellow-500 bg-yellow-50'}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                {timeStatus.warningMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Question text */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Question {currentQuestionIndex + 1}
              </h3>
              <p className="text-gray-700">{currentQuestion.question_text}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <label
                  key={key}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    answers[currentQuestion.question_id] === value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.question_id}`}
                    value={key}
                    checked={answers[currentQuestion.question_id] === key}
                    onChange={() => handleAnswerSelect(currentQuestion.question_id, key)}
                    className="mr-3"
                  />
                  <span className="flex-1">{value}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          )}
        </div>
      </div>

      {/* Question navigation */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">Question Navigation</h4>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={answers[questions[index].question_id] ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className={currentQuestionIndex === index ? "ring-2 ring-blue-500" : ""}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
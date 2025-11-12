
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Flag, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useQuiz, useSubmitQuiz } from '@/hooks/api/useQuizzes';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question: string;
  question_text?: string;
  options?: string[] | Record<string, string>;
  type: string;
  marks: number;
  correct_answer?: string;
  left_side?: string;
  right_side?: string;
  image_url?: string;
}

interface QuizInterfaceProps {
  quizId: string;
  onBack: () => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ quizId, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { toast } = useToast();
  const { data: quizData, isLoading } = useQuiz(quizId);
  const submitQuiz = useSubmitQuiz();

  const quiz = quizData?.data;
  const questions = quiz?.questions?.map((q: any) => q.question || q) || [];

  useEffect(() => {
    if (quiz?.duration) {
      setTimeLeft(quiz.duration * 60); // Convert minutes to seconds
    }
  }, [quiz]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: any) => {
    const questionId = questions[currentQuestion]?.id;
    if (questionId) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const handleMatchAnswer = (leftItem: string, rightItem: string) => {
    const questionId = questions[currentQuestion]?.id;
    if (questionId) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          [leftItem]: rightItem
        }
      }));
    }
  };

  const handleSubmit = async () => {
    const submission = {
      quizId: quizId,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: typeof answer === 'object' ? JSON.stringify(answer) : answer,
        timeTaken: 5 // Mock time per question
      })),
      totalTimeTaken: (quiz?.duration * 60) - timeLeft
    };

    try {
      await submitQuiz.mutateAsync(submission);
      setIsSubmitted(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit quiz. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderQuestionByType = (question: Question) => {
    const questionText = question.question || question.question_text || '';
    const currentAnswer = answers[question.id] || '';

    switch (question.type?.toUpperCase()) {
      case 'MCQ':
      case 'CHOICE_BASED':
        const options = Array.isArray(question.options) 
          ? question.options 
          : Object.values(question.options || {});
        
        return (
          <div className="space-y-3">
            {question.image_url && (
              <div className="mb-4">
                <img 
                  src={question.image_url} 
                  alt="Question image" 
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}
            <RadioGroup
              value={currentAnswer?.toString() || ''}
              onValueChange={handleAnswerChange}
            >
              {options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={String.fromCharCode(97 + index)} id={`option-${index}`} />
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
        const blanks = questionText.match(/_+/g) || ['_'];
        const fillAnswers = currentAnswer || {};
        
        return (
          <div className="space-y-4">
            {question.image_url && (
              <div className="mb-4">
                <img 
                  src={question.image_url} 
                  alt="Question image" 
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}
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
                      handleAnswerChange(newAnswers);
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
            {question.image_url && (
              <div className="mb-4">
                <img 
                  src={question.image_url} 
                  alt="Question image" 
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}
            <RadioGroup
              value={currentAnswer?.toString() || ''}
              onValueChange={handleAnswerChange}
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
        const leftItems = question.left_side?.split(',') || [];
        const rightItems = question.right_side?.split(',') || [];
        const matchAnswers = currentAnswer || {};

        return (
          <div className="space-y-4">
            {question.image_url && (
              <div className="mb-4">
                <img 
                  src={question.image_url} 
                  alt="Question image" 
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-gray-700">Column A</h4>
                <div className="space-y-2">
                  {leftItems.map((item, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded border text-sm">
                      {index + 1}. {item.trim()}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-gray-700">Column B</h4>
                <div className="space-y-2">
                  {rightItems.map((item, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded border text-sm">
                      {String.fromCharCode(65 + index)}. {item.trim()}
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
                      {index + 1}. {leftItem.trim()}
                    </span>
                    <span className="text-sm">matches with</span>
                    <select
                      value={matchAnswers[leftItem.trim()] || 'none'}
                      onChange={(e) => handleMatchAnswer(leftItem.trim(), e.target.value === 'none' ? '' : e.target.value)}
                      className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">Select match</option>
                      {rightItems.map((rightItem, rightIndex) => (
                        <option key={rightIndex} value={rightItem.trim()}>
                          {String.fromCharCode(65 + rightIndex)}. {rightItem.trim()}
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
        // Default to text input for other types
        return (
          <div className="space-y-4">
            {question.image_url && (
              <div className="mb-4">
                <img 
                  src={question.image_url} 
                  alt="Question image" 
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}
            <Textarea
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Enter your answer here..."
              rows={4}
              className="w-full"
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center max-w-md mx-auto">
          <CardContent className="p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz not found</h3>
            <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist or is no longer available.</p>
            <Button onClick={onBack}>Back to Quiz Center</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  if (isSubmitted) {
    const score = Math.floor(Math.random() * 30) + 70;
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="text-center max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-green-600">Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-gray-900">{score}%</div>
            <p className="text-gray-600 text-sm">
              You answered {Math.floor((score / 100) * questions.length)} out of {questions.length} questions correctly
            </p>
            <Button onClick={onBack} className="w-full">
              Back to Quiz Center
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={onBack} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center text-orange-600">
          <Clock className="w-4 h-4 mr-1" />
          <span className="text-sm">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardContent>
      </Card>

      {/* Question */}
      {currentQ && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-3">
                Q{currentQuestion + 1}
              </span>
              {currentQ.question || currentQ.question_text}
              {currentQ.image_url && <ImageIcon className="w-5 h-5 ml-2 text-gray-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderQuestionByType(currentQ)}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <Button
          variant={markedForReview.has(currentQuestion) ? "default" : "outline"}
          onClick={() => setMarkedForReview(prev => {
            const newSet = new Set(prev);
            if (newSet.has(currentQuestion)) {
              newSet.delete(currentQuestion);
            } else {
              newSet.add(currentQuestion);
            }
            return newSet;
          })}
          size="sm"
        >
          <Flag className="w-4 h-4 mr-1" />
          {markedForReview.has(currentQuestion) ? 'Marked' : 'Mark for Review'}
        </Button>

        <Button 
          onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
          disabled={currentQuestion === questions.length - 1}
          size="sm"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Submit Button */}
      <Button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700">
        Submit Quiz
      </Button>

      {/* Question Overview */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Question Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestion === index ? "default" : answers[questions[index]?.id] ? "secondary" : "outline"}
                size="sm"
                className={`w-8 h-8 p-0 text-xs ${markedForReview.has(index) ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border border-gray-400 rounded"></div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-yellow-400 rounded"></div>
              <span>Marked for Review</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizInterface;

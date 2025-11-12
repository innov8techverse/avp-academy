
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { EnhancedTestInterface } from '@/containers/quiz/EnhancedTestInterface';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  type: 'single' | 'multiple' | 'boolean';
}

interface QuizInterfaceProps {
  quizId: string;
  onBack: () => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ quizId, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testAttempt, setTestAttempt] = useState<{ attemptId: number; questions: any[] } | null>(null);

  const questions: Question[] = [
    {
      id: '1',
      text: 'What is Newton\'s First Law of Motion?',
      options: [
        'An object at rest stays at rest unless acted upon by a force',
        'Force equals mass times acceleration',
        'For every action, there is an equal and opposite reaction',
        'Energy cannot be created or destroyed'
      ],
      correctAnswer: 0,
      type: 'single'
    },
    {
      id: '2',
      text: 'Which of the following are characteristics of living organisms? (Select all that apply)',
      options: [
        'Growth and development',
        'Reproduction',
        'Response to environment',
        'Magnetic properties'
      ],
      correctAnswer: 0,
      type: 'multiple'
    },
    {
      id: '3',
      text: 'The pH scale ranges from 0 to 14. True or False?',
      options: ['True', 'False'],
      correctAnswer: 0,
      type: 'boolean'
    }
  ];

  useEffect(() => {
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
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: value
    }));
  };

  const handleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Calculate results and show score
  };

  const handleStartTest = async () => {
    try {
      // Start test attempt
      const response = await fetch(`/api/tests/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestAttempt({
          attemptId: data.attempt_id,
          questions: data.questions || []
        });
      }
    } catch (error) {
      // Error starting test
    }
  };

  const handleTestComplete = (attemptId: number) => {
    setIsSubmitted(true);
    setTestAttempt(null);
    // Handle test completion
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // If test attempt is active, use enhanced interface
  if (testAttempt) {
    return (
      <EnhancedTestInterface
        testId={parseInt(quizId)}
        attemptId={testAttempt.attemptId}
        questions={testAttempt.questions}
        onComplete={handleTestComplete}
      />
    );
  }

  if (isSubmitted) {
    const score = Math.floor(Math.random() * 30) + 70; // Mock score
    return (
      <div className="space-y-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-gray-900">{score}%</div>
            <p className="text-gray-600">
              You answered {Math.floor((score / 100) * questions.length)} out of {questions.length} questions correctly
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{Math.floor((score / 100) * questions.length)}</p>
                <p className="text-sm text-gray-600">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{questions.length - Math.floor((score / 100) * questions.length)}</p>
                <p className="text-sm text-gray-600">Incorrect</p>
              </div>
            </div>
            <Button onClick={onBack} className="mt-6">
              Back to Quiz Center
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-orange-600">
            <Clock className="w-4 h-4 mr-1" />
            {formatTime(timeLeft)}
          </div>
          <Button onClick={handleStartTest} className="bg-blue-600 hover:bg-blue-700">
            Start Test
          </Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            Submit Quiz
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {questions[currentQuestion].text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={answers[currentQuestion] || ''}
            onValueChange={handleAnswerChange}
          >
            {questions[currentQuestion].options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          variant={markedForReview.has(currentQuestion) ? "default" : "outline"}
          onClick={handleMarkForReview}
        >
          <Flag className="w-4 h-4 mr-2" />
          {markedForReview.has(currentQuestion) ? 'Marked' : 'Mark for Review'}
        </Button>

        <Button 
          onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
          disabled={currentQuestion === questions.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestion === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 p-0 ${
                  answers[index] ? 'bg-green-100 border-green-300' : ''
                } ${
                  markedForReview.has(index) ? 'bg-yellow-100 border-yellow-300' : ''
                }`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          <div className="flex justify-center space-x-4 mt-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
              Answered
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-1"></div>
              Marked
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-white border border-gray-300 rounded mr-1"></div>
              Not Answered
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizInterface;

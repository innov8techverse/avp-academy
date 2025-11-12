import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronLeft, ChevronRight, Flag, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QuizResults from './QuizResults';

interface Question {
  id: string;
  type: 'mcq' | 'true-false' | 'drag-drop' | 'match' | 'fill-blank';
  text: string;
  options?: string[];
  correctAnswer: number | string | string[];
  explanation?: string;
  matchPairs?: { left: string; right: string }[];
}

interface EnhancedQuizInterfaceProps {
  quizId: string;
  onBack: () => void;
}

const EnhancedQuizInterface: React.FC<EnhancedQuizInterfaceProps> = ({ quizId, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [showResults, setShowResults] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Mock questions data
  const questions: Question[] = [
    {
      id: '1',
      type: 'mcq',
      text: 'What is Newton\'s First Law of Motion?',
      options: [
        'An object at rest stays at rest unless acted upon by a force',
        'Force equals mass times acceleration',
        'For every action there is an equal and opposite reaction',
        'Energy cannot be created or destroyed'
      ],
      correctAnswer: 0,
      explanation: 'Newton\'s First Law states that an object at rest will remain at rest, and an object in motion will remain in motion at constant velocity, unless acted upon by an external force.'
    },
    {
      id: '2',
      type: 'true-false',
      text: 'The Earth revolves around the Sun.',
      options: ['True', 'False'],
      correctAnswer: 0,
      explanation: 'The Earth orbits around the Sun, which takes approximately 365.25 days to complete one revolution.'
    },
    {
      id: '3',
      type: 'fill-blank',
      text: 'The chemical formula for water is ____.',
      correctAnswer: 'H2O',
      explanation: 'Water is composed of two hydrogen atoms and one oxygen atom, hence H2O.'
    },
    {
      id: '4',
      type: 'match',
      text: 'Match the following scientists with their discoveries:',
      matchPairs: [
        { left: 'Einstein', right: 'Theory of Relativity' },
        { left: 'Newton', right: 'Laws of Motion' },
        { left: 'Darwin', right: 'Theory of Evolution' },
        { left: 'Mendel', right: 'Laws of Inheritance' }
      ],
      correctAnswer: ['Einstein-Theory of Relativity', 'Newton-Laws of Motion', 'Darwin-Theory of Evolution', 'Mendel-Laws of Inheritance'],
      explanation: 'Each scientist made groundbreaking contributions to their respective fields of study.'
    },
    {
      id: '5',
      type: 'drag-drop',
      text: 'Arrange the following planets in order from the Sun:',
      options: ['Mars', 'Earth', 'Venus', 'Mercury'],
      correctAnswer: ['Mercury', 'Venus', 'Earth', 'Mars'],
      explanation: 'The order from the Sun is: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          toast({
            title: "Time's Up!",
            description: "Your quiz has been automatically submitted.",
            variant: "destructive"
          });
          setShowResults(true);
          return 0;
        }
        if (prev === 300) {
          toast({
            title: "5 Minutes Remaining",
            description: "Please complete your quiz soon.",
            variant: "destructive"
          });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
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
    if (answers[index] !== undefined) {
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
    const question = questions[currentQuestion];
    const currentAnswer = answers[currentQuestion];

    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <Button
                key={index}
                variant={currentAnswer === index ? "default" : "outline"}
                className="w-full text-left justify-start p-3 md:p-4 h-auto text-sm md:text-base"
                onClick={() => handleAnswer(index)}
              >
                <span className="mr-2 md:mr-3 font-bold text-sm">{String.fromCharCode(65 + index)}.</span>
                <span className="flex-1">{option}</span>
              </Button>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
            <Button
              variant={currentAnswer === 0 ? "default" : "outline"}
              className="flex-1 p-4 md:p-6 text-lg"
              onClick={() => handleAnswer(0)}
            >
              True
            </Button>
            <Button
              variant={currentAnswer === 1 ? "default" : "outline"}
              className="flex-1 p-4 md:p-6 text-lg"
              onClick={() => handleAnswer(1)}
            >
              False
            </Button>
          </div>
        );

      case 'fill-blank':
        return (
          <div className="space-y-4">
            <input
              type="text"
              className="w-full p-4 border border-gray-300 rounded-lg"
              placeholder="Enter your answer here..."
              value={currentAnswer || ''}
              onChange={(e) => handleAnswer(e.target.value)}
            />
          </div>
        );

      case 'match':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Scientists</h4>
              {question.matchPairs?.map((pair, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded border">
                  {pair.left}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Discoveries</h4>
              {question.matchPairs?.map((pair, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const newMatches = { ...(currentAnswer || {}) };
                    newMatches[pair.left] = pair.right;
                    handleAnswer(newMatches);
                  }}
                >
                  {pair.right}
                </Button>
              ))}
            </div>
          </div>
        );

      case 'drag-drop':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Drag to reorder:</p>
            <div className="space-y-2">
              {(currentAnswer || question.options || []).map((item: string, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded border cursor-move hover:bg-gray-100"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const newOrder = [...(currentAnswer || question.options || [])];
                    const draggedItem = newOrder[draggedIndex];
                    newOrder.splice(draggedIndex, 1);
                    newOrder.splice(index, 0, draggedItem);
                    handleAnswer(newOrder);
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showResults) {
    const correctAnswers = questions.filter((question, index) => {
      const userAnswer = answers[index];
      if (question.type === 'mcq' || question.type === 'true-false') {
        return userAnswer === question.correctAnswer;
      }
      if (question.type === 'fill-blank') {
        return userAnswer?.toLowerCase() === (question.correctAnswer as string).toLowerCase();
      }
      if (question.type === 'drag-drop' || question.type === 'match') {
        return JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
      }
      return false;
    }).length;

    return (
      <QuizResults 
        score={Math.round((correctAnswers / questions.length) * 100)}
        totalQuestions={questions.length}
        timeSpent={3600 - timeLeft}
        correctAnswers={correctAnswers}
        onBackToCenter={onBack}
      />
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white border-b p-3 md:p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} size="sm">
            <ChevronLeft className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-1 md:space-x-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm md:text-base">{formatTime(timeLeft)}</span>
            </div>
            <Badge variant="outline" className="text-xs md:text-sm">
              {currentQuestion + 1}/{questions.length}
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1 md:h-2" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)]">
        {/* Main Question Area */}
        <div className="flex-1 p-3 md:p-6">
          {/* Question Card */}
          <Card className="mb-4 md:mb-6">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <span className="flex-1 text-base md:text-lg leading-relaxed">{question.text}</span>
                <div className="flex items-center justify-between md:justify-end space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {question.type.replace('-', ' ').toUpperCase()}
                  </Badge>
                  <Button
                    variant={flaggedQuestions.has(currentQuestion) ? "default" : "outline"}
                    size="sm"
                    onClick={handleFlag}
                    className={flaggedQuestions.has(currentQuestion) ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {renderQuestion()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4 md:mb-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Desktop Ledger Sidebar */}
        {showLedger && (
          <div className="hidden lg:block w-80 border-l bg-white">
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Question Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Status Legend */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Status Legend:</h4>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>Answered</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span>Flagged</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>Current</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-gray-200 rounded"></div>
                          <span>Unanswered</span>
                        </div>
                      </div>
                    </div>

                    {/* Question Navigator */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Questions:</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {questions.map((_, index) => {
                          const status = getQuestionStatus(index);
                          return (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className={`w-full h-10 ${getStatusColor(status)} border-0`}
                              onClick={() => setCurrentQuestion(index)}
                            >
                              {index + 1}
                              {flaggedQuestions.has(index) && (
                                <Flag className="w-3 h-3 ml-1" />
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-2 pt-4 border-t">
                      <h4 className="font-medium text-sm">Quick Stats:</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Answered:</span>
                          <span className="font-medium text-green-600">
                            {Object.keys(answers).length}/{questions.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Flagged:</span>
                          <span className="font-medium text-yellow-600">
                            {flaggedQuestions.size}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining:</span>
                          <span className="font-medium text-gray-600">
                            {questions.length - Object.keys(answers).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Ledger at Bottom */}
      <div className="lg:hidden bg-white border-t p-3 md:p-4 sticky bottom-0">
        <Button
          variant="outline"
          onClick={() => setShowLedger(!showLedger)}
          className="w-full mb-3 flex items-center justify-center space-x-2"
          size="sm"
        >
          {showLedger ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>Question Overview</span>
        </Button>
        
        {showLedger && (
          <Card>
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Status Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Flagged</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <span>Unanswered</span>
                  </div>
                </div>

                {/* Question Navigator */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Questions:</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {questions.map((_, index) => {
                      const status = getQuestionStatus(index);
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className={`w-full h-8 ${getStatusColor(status)} border-0 text-xs`}
                          onClick={() => setCurrentQuestion(index)}
                        >
                          {index + 1}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t text-center">
                  <div>
                    <div className="text-sm font-bold text-green-600">{Object.keys(answers).length}</div>
                    <div className="text-xs text-gray-600">Answered</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-yellow-600">{flaggedQuestions.size}</div>
                    <div className="text-xs text-gray-600">Flagged</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-600">{questions.length - Object.keys(answers).length}</div>
                    <div className="text-xs text-gray-600">Remaining</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedQuizInterface;

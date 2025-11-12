import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Target,
  Award,
  Clock,
  Calendar,
  History,
  Search,
  AlertCircle,
  Loader2,
  Play,
  BarChart3,
  RefreshCw,
  Trophy,
  Eye
} from 'lucide-react';
import { apiClient } from '@/services/api';
import BottomNavigation from '@/components/common/BottomNavigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Status utility functions for enhanced test display
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'DRAFT': return 'bg-gray-100 text-gray-800';
    case 'NOT_STARTED': return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS': return 'bg-green-100 text-green-800';
    case 'COMPLETED': return 'bg-purple-100 text-purple-800';
    case 'ARCHIVED': return 'bg-red-100 text-red-800';
    // Legacy support
    case 'Published': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'DRAFT': return '📝';
    case 'NOT_STARTED': return '⏰';
    case 'IN_PROGRESS': return '▶️';
    case 'COMPLETED': return '✅';
    case 'ARCHIVED': return '📦';
    // Legacy support
    case 'Published': return '▶️';
    default: return '🎯';
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'DRAFT': return 'Draft';
    case 'NOT_STARTED': return 'Scheduled';
    case 'IN_PROGRESS': return 'Available';
    case 'COMPLETED': return 'Completed';
    case 'ARCHIVED': return 'Archived';
    // Legacy support  
    case 'Published': return 'Available';
    default: return 'Available';
  }
};

interface Test {
  quiz_id: number;
  title: string;
  description?: string;
  type: string;
  status?: string;          // New status field
  start_time?: string;      // New scheduling fields
  end_time?: string;
  auto_start?: boolean;
  auto_end?: boolean;
  grace_period_minutes?: number;
  end_time_scheduled?: string;
  time_limit_minutes?: number;
  duration?: number;
  total_questions?:number;
  marks_per_question?:number;
  total_marks?: number;
  scheduled_at?: string;
  question_count?:number;
  leaderboard_enabled?: boolean;
  total_attempts?: number;
  course?: {
    name: string;
  };
  subject?: {
    name: string;
  };
  batch?: {
    batch_name: string;
  };
  attempts: Array<{
    attempt_id: number;
    score: number;
    is_completed: boolean;
    created_at: string;
    start_time: string;
    submit_time?: string;
    time_taken?: number;
    accuracy?: number;
    correct_answers?: number;
    wrong_answers?: number;
    total_questions?: number;
  }>;
}

interface TestHistory {
  attempt_id: number;
  quiz_id: number;
  title: string;
  type: string;
  score: number;
  is_completed: boolean;
  is_unattended?: boolean;
  start_time: string;
  submit_time?: string;
  time_taken?: number;
  accuracy?: number;
  correct_answers?: number;
  wrong_answers?: number;
  total_questions?: number;
  course?: {
    name: string;
  };
  subject?: {
    name: string;
  };
  batch?: {
    batch_name: string;
  };
}

interface TestCenterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TestCenter: React.FC<TestCenterProps> = ({ activeTab, onTabChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [selectedTestForLeaderboard, setSelectedTestForLeaderboard] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Refresh data when navigating back from test completion
  useEffect(() => {
    // Check if we're coming back from a test analysis page (completed test)
    if (location.pathname === '/student/tests' && location.state?.fromTestCompletion) {
      queryClient.invalidateQueries({ queryKey: ['student-tests'] });
      queryClient.invalidateQueries({ queryKey: ['student-test-history'] });
      
      // Clear the state to prevent infinite refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, queryClient, navigate]);

  // Fetch available tests for student
  const { data: testsData, isLoading: testsLoading, error: testsError, refetch: refetchTests } = useQuery({
    queryKey: ['student-tests'],
    queryFn: async () => {
      const response = await apiClient.get('/tests/student/available');
      return response.data?.data || response.data;
    },
  });

  // Fetch test history
  const { data: historyData, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['student-test-history'],
    queryFn: async () => {
      const response = await apiClient.get('/tests/student/history');
      return response.data?.data || response.data || response;
    },
  });

  const tests: Test[] = testsData || [];
  const testHistory: TestHistory[] = historyData || [];

  const handleStartTest = (testId: number) => {
    navigate(`/student/test/${testId}`);
  };

  const handleViewResults = (attemptId: number) => {
    navigate(`/student/test-analysis/${attemptId}`);
  };

  const handleContinueTest = (testId: number) => {
    navigate(`/student/test/${testId}`);
  };

  const handleViewLeaderboard = async (testOrId: any, testTitle?: string) => {
    try {
      let testId: number;
      let title: string;
      
      if (typeof testOrId === 'object') {
        testId = testOrId.quiz_id;
        title = testOrId.title;
        setSelectedTestForLeaderboard(testOrId);
      } else {
        testId = testOrId;
        title = testTitle || 'Test';
        setSelectedTestForLeaderboard({ id: testId, title });
      }
      
      const response = await apiClient.get(`/tests/${testId}/leaderboard`);
      setLeaderboardData(response.data.leaderboard || []);
      setIsLeaderboardOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch leaderboard or leaderboard is not enabled for this test',
        variant: 'destructive',
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Mock Test': return 'bg-blue-100 text-blue-800';
      case 'Daily Test': return 'bg-green-100 text-green-800';
      case 'Weekly Test': return 'bg-purple-100 text-purple-800';
      case 'Monthly Test': return 'bg-orange-100 text-orange-800';
  
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getUnattendedBadge = (isUnattended?: boolean) => {
    if (isUnattended) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Unattended</Badge>;
    }
    return null;
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.subject?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || test.type === filterType;

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'completed' && test.attempts.some(a => a.is_completed)) ||
      (filterStatus === 'not-attempted' && test.attempts.length === 0) ||
      (filterStatus === 'in-progress' && test.attempts.some(a => !a.is_completed));

    return matchesSearch && matchesType && matchesStatus;
  });

  const getBestScore = (test: Test) => {
    const completedAttempts = test.attempts.filter(a => a.is_completed);
    if (completedAttempts.length === 0) return null;
    return Math.max(...completedAttempts.map(a => a.score));
  };

  const getLatestAttempt = (test: Test) => {
    return test.attempts.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  const getTestStatus = (test: Test) => {
    const completedAttempts = test.attempts.filter(a => a.is_completed);
    const inProgressAttempts = test.attempts.filter(a => !a.is_completed);

    if (completedAttempts.length > 0) return 'completed';
    if (inProgressAttempts.length > 0) return 'in-progress';
    return 'not-attempted';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '⏳';
      case 'not-attempted': return '📝';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not-attempted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (testsLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tests...</p>
        </div>
      </div>
    );
  }

  if (testsError || historyError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load tests</p>
          <div className="space-x-2">
            <Button onClick={() => refetchTests()}>Retry Tests</Button>
            <Button onClick={() => refetchHistory()}>Retry History</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Center</h1>
              <p className="text-gray-600">Take tests and track your progress</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchTests();
                  refetchHistory();
                  toast({
                    title: 'Refreshed',
                    description: 'Test data has been refreshed',
                  });
                }}
                className="flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
              <div className="bg-blue-100 p-3 rounded-lg text-center">
                <Target className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-blue-800">
                  {tests.filter(t => t.attempts.length === 0).length} Available
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg text-center">
                <Award className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">
                  {tests.filter(t => t.attempts.some(a => a.is_completed)).length} Completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available" >Available Tests</TabsTrigger>
            <TabsTrigger value="history">Test History</TabsTrigger>
          </TabsList>

          {/* Available Tests Tab */}
          <TabsContent value="available" className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search Test / Course ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="MOCK">Mock Test</SelectItem>
                      <SelectItem value="DAILY">Daily Test</SelectItem>
                      <SelectItem value="WEEKLY">Weekly Test</SelectItem>
                      <SelectItem value="MONTHLY">Monthly Test</SelectItem>
              

                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="not-attempted">Not Attempted</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tests Grid */}
            <div className="grid gap-4">
              {filteredTests.length === 0 ? (
                <Card className="shadow-lg border-0">
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests found</h3>
                    <p className="text-gray-600">
                      {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'No tests are currently available for your batch and course'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTests.map((test) => {
                  const bestScore = getBestScore(test);
                  const latestAttempt = getLatestAttempt(test);
                  const status = getTestStatus(test);

                  return (
                    <Card key={test.quiz_id} className="shadow-lg border-0 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" >
                      <CardContent className="p-4 lg:p-6">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-bold text-lg text-gray-900">{test.title}</h3>
                              <Badge className={getTypeColor(test.type)}>
                                🎯 {test.type}
                              </Badge>
                              {/* Test Status Badge */}
                              <Badge className={getStatusColor(test.status)}>
                                {getStatusIcon(test.status)} {getStatusLabel(test.status)}
                              </Badge>
                              <Badge className={getStatusColor(status)}>
                                {getStatusIcon(status)} {status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In Progress' : 'Not Attempted'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {test.course && <Badge variant="outline">{test.course.name}</Badge>}
                              {test.subject && <Badge variant="outline">{test.subject.name}</Badge>}
                              {test.batch && <Badge variant="outline">{test.batch.batch_name}</Badge>}
                            </div>
                            {test.description && (
                              <p className="text-gray-600 mb-3">{test.description}</p>
                            )}
                            
                            {/* Scheduling Information */}
                            {(test.start_time || test.end_time_scheduled) && (
                              <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg mb-3">
                                <div className="font-semibold mb-2 flex items-center">
                                  📅 Test Schedule
                                  {test.auto_start && <span className="ml-2 text-green-600 text-xs bg-green-100 px-1.5 py-0.5 rounded">⚡ Auto-start</span>}
                                  {test.auto_end && <span className="ml-1 text-purple-600 text-xs bg-purple-100 px-1.5 py-0.5 rounded">⚡ Auto-end</span>}
                                </div>
                                <div className="space-y-1">
                                  {test.start_time && (
                                    <div className="flex items-center">
                                      <span className="text-green-600">🚀 Start:</span>
                                      <span className="ml-2 font-medium">
                                        {new Date(test.start_time).toLocaleString('en-IN', {
                                          timeZone: 'Asia/Kolkata',
                                          dateStyle: 'medium',
                                          timeStyle: 'short'
                                        })} IST
                                      </span>
                                    </div>
                                  )}
                                  {test.end_time_scheduled && (
                                    <div className="flex items-center">
                                      <span className="text-red-600">🏁 End:</span>
                                      <span className="ml-2 font-medium">
                                        {new Date(test.end_time_scheduled).toLocaleString('en-IN', {
                                          timeZone: 'Asia/Kolkata',
                                          dateStyle: 'medium',
                                          timeStyle: 'short'
                                        })} IST
                                      </span>
                                    </div>
                                  )}
                                  {test.grace_period_minutes && (
                                    <div className="text-orange-600 text-xs">
                                      ⏳ Grace period: {test.grace_period_minutes} minutes
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2">
                            {status === 'not-attempted' && (
                              <Button
                                onClick={() => handleStartTest(test.quiz_id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Test
                              </Button>
                            )}
                            {status === 'in-progress' && (
                              <Button
                                onClick={() => handleContinueTest(test.quiz_id)}
                                variant="outline"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Continue
                              </Button>
                            )}
                            {status === 'completed' && latestAttempt && (
                              <Button
                                onClick={() => handleViewResults(latestAttempt.attempt_id)}
                                variant="outline"
                              >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                View Results
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 lg:gap-4">
                          <div className="text-center p-2 lg:p-3 bg-blue-50 rounded-lg">
                            <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Questions</p>
                            <p className="text-sm lg:text-base font-bold text-blue-600">{test.total_questions}</p>
                          </div>
                          <div className="text-center p-2 lg:p-3 bg-green-50 rounded-lg">
                            <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-green-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Duration</p>
                            <p className="text-sm lg:text-base font-bold text-green-600">
                              {test.time_limit_minutes ? `${test.time_limit_minutes}m` : '-'}
                            </p>
                          </div>
                          <div className="text-center p-2 lg:p-3 bg-purple-50 rounded-lg">
                            <Target className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Max Marks</p>
                            <p className="text-sm lg:text-base font-bold text-purple-600">
                              {test.total_marks || '-'}
                            </p>
                          </div>
                          <div className="text-center p-2 lg:p-3 bg-orange-50 rounded-lg">
                            <History className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Attempts</p>
                            <p className="text-sm lg:text-base font-bold text-orange-600">
                              {test.attempts.length}
                            </p>
                          </div>
                          <div className="text-center p-2 lg:p-3 bg-red-50 rounded-lg">
                            <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-red-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Scheduled</p>
                            <p className="text-xs lg:text-sm font-bold text-red-600">
                              {test.scheduled_at ? new Date(test.scheduled_at).toLocaleDateString() : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Best Score Display */}
                        {bestScore !== null && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Award className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Best Score</span>
                              </div>
                              <span className={`text-lg font-bold ${getScoreColor(bestScore)}`}>
                                {bestScore}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Test History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="grid gap-4">
              {testHistory.length === 0 ? (
                <Card className="shadow-lg border-0">
                  <CardContent className="p-8 text-center">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No test history</h3>
                    <p className="text-gray-600">You haven't taken any tests yet.</p>
                  </CardContent>
                </Card>
              ) : (
                testHistory.map((attempt) => (
                  <Card key={attempt.attempt_id} className="shadow-lg border-0 overflow-hidden hover:shadow-xl transition-shadow">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-lg text-gray-900">{attempt.title}</h3>
                            <Badge className={getTypeColor(attempt.type)}>{attempt.type}</Badge>
                            <Badge className={getScoreBadge(attempt.score)}>
                              {attempt.score}%
                            </Badge>
                            {getUnattendedBadge(attempt.is_unattended)}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {attempt.course && <Badge variant="outline">{attempt.course.name}</Badge>}
                            {attempt.subject && <Badge variant="outline">{attempt.subject.name}</Badge>}
                            {attempt.batch && <Badge variant="outline">{attempt.batch.batch_name}</Badge>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Accuracy:</span>
                              <span className="ml-2 font-medium">{attempt.accuracy?.toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Correct:</span>
                              <span className="ml-2 font-medium">{attempt.correct_answers}/{attempt.total_questions}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Time:</span>
                              <span className="ml-2 font-medium">{formatTime(attempt.time_taken)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <span className="ml-2 font-medium">
                                {new Date(attempt.start_time).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center lg:justify-end gap-2">
                          <Button
                            onClick={() => handleViewResults(attempt.attempt_id)}
                            variant="outline"
                            className="w-full lg:w-auto"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Analysis
                          </Button>
                          <Button
                            onClick={() => handleViewLeaderboard(attempt.quiz_id, attempt.title)}
                            variant="outline"
                            className="w-full lg:w-auto"
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            Leaderboard
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <div className="grid gap-4">
              {tests.filter(test => test.leaderboard_enabled).length === 0 ? (
                <Card className="shadow-lg border-0">
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No leaderboards available</h3>
                    <p className="text-gray-600">Complete some tests to see leaderboards here.</p>
                  </CardContent>
                </Card>
              ) : (
                tests
                  .filter(test => test.leaderboard_enabled)
                  .map((test) => (
                    <Card key={test.quiz_id} className="shadow-lg border-0 overflow-hidden hover:shadow-xl transition-shadow">
                      <CardContent className="p-4 lg:p-6">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-5 h-5 text-yellow-600" />
                              <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="outline">{test.type}</Badge>
                              {test.course && (
                                <Badge variant="secondary">{test.course.name}</Badge>
                              )}
                              {test.subject && (
                                <Badge variant="secondary">{test.subject.name}</Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-blue-600">{test.total_marks}</div>
                                <div className="text-gray-600">Total Marks</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-green-600">{test.total_questions}</div>
                                <div className="text-gray-600">Questions</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-purple-600">{test.duration}m</div>
                                <div className="text-gray-600">Duration</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-orange-600">{test.total_attempts || 0}</div>
                                <div className="text-gray-600">Attempts</div>
                              </div>
                            </div>
                          </div>

                          <div className="lg:text-right space-y-2">
                            <Button
                              onClick={() => handleViewLeaderboard(test)}
                              className="w-full lg:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                            >
                              <Trophy className="w-4 h-4 mr-2" />
                              View Leaderboard
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Leaderboard Dialog */}
      <Dialog open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {selectedTestForLeaderboard?.title} - Leaderboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {leaderboardData.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No leaderboard data available</p>
              </div>
            ) : (
              leaderboardData.map((entry, index) => (
                <div key={entry.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {entry.rank}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.user_avatar} />
                      <AvatarFallback>{entry.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{entry.user_name}</div>
                      <div className="text-sm text-gray-600">
                        {entry.correct_answers}/{entry.total_questions} correct
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor((entry.score / entry.total_marks) * 100)}`}>
                      {entry.score}/{entry.total_marks}
                    </div>
                    <div className="text-sm text-gray-600">
                      {((entry.score / entry.total_marks) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.floor(entry.time_taken / 60)}m {entry.time_taken % 60}s
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default TestCenter; 
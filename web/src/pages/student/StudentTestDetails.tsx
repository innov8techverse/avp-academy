import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testService } from '@/services/tests/testService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Clock, Target, Users, Calendar, Award, ShieldCheck, ChevronLeft, AlertTriangle, CheckCircle, XCircle, Info, Play, RefreshCw, BarChart3 } from 'lucide-react';

const typeColors: Record<string, string> = {
  'Mock Test': 'bg-blue-100 text-blue-800',
  'Daily Test': 'bg-green-100 text-green-800',
  'Weekly Test': 'bg-purple-100 text-purple-800',
  'Monthly Test': 'bg-orange-100 text-orange-800',

  'CUSTOM': 'bg-pink-100 text-pink-800',

  'MOCK': 'bg-blue-100 text-blue-800',
  'DAILY': 'bg-green-100 text-green-800',
};

const statusColors: Record<string, string> = {
  'Active': 'bg-green-100 text-green-800',
  'Draft': 'bg-yellow-100 text-yellow-800',
};

const difficultyColors: Record<string, string> = {
  'EASY': 'bg-green-100 text-green-800',
  'MEDIUM': 'bg-yellow-100 text-yellow-800',
  'HARD': 'bg-red-100 text-red-800',
  'Easy': 'bg-green-100 text-green-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'Hard': 'bg-red-100 text-red-800',
};

const StudentTestDetails: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<any>(null);
  const [myAttempts, setMyAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    testService.getStudentTestDetails(Number(testId))
      .then(res => {
        setTest(res.data);
        // If attempts for this user are included, filter them
        if (res.data.attempts && Array.isArray(res.data.attempts)) {
          setMyAttempts(res.data.attempts.filter((a: any) => a.user));
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err?.response?.data?.message || 'Failed to fetch test details');
        setLoading(false);
      });
  }, [testId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span>Loading test details...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-600 text-center mt-8">{error}</div>;
  }
  if (!test) {
    return <div className="text-gray-600 text-center mt-8">No test data found.</div>;
  }

  // Helper: get badge color
  const getTypeColor = (type: string) => typeColors[type] || 'bg-gray-100 text-gray-800';
  const getStatusColor = (status: string) => statusColors[status] || 'bg-gray-100 text-gray-800';
  const getDifficultyColor = (diff: string) => difficultyColors[diff] || 'bg-gray-100 text-gray-800';

  // Prefer names if available
  const courseName = test.course?.name || test.course_name || test.course_id || 'All Courses';
  const subjectName = test.subject?.name || test.subject_name || test.subject_id || 'All Subjects';
  const batchNames = test.batches || (test.batch ? [test.batch.batch_name] : []);

  // Student submission logic
  const hasCompleted = myAttempts.some(a => a.is_completed);
  const inProgress = myAttempts.find(a => !a.is_completed);
  const latestAttempt = myAttempts.length > 0 ? myAttempts[0] : null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-2">
      <Button variant="ghost" className="mb-4 flex items-center" onClick={() => navigate(-1)}>
        <ChevronLeft className="w-5 h-5 mr-1" /> Back
      </Button>
      <Card className="mb-6 shadow-xl border-0">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                {test.title}
                <Badge className={getTypeColor(test.type)}>{test.type}</Badge>
                <Badge className={getStatusColor(test.is_published ? 'Active' : 'Draft')}>{test.is_published ? 'Active' : 'Draft'}</Badge>
                {test.has_negative_marking && (
                  <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Negative Marking</Badge>
                )}
              </CardTitle>
              <div className="text-gray-500 mt-1 text-base">{test.description}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">Scheduled:</span>
                <span className="font-semibold text-red-600">{test.scheduled_at ? new Date(test.scheduled_at).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">Duration:</span>
                <span className="font-semibold text-blue-700">{test.time_limit_minutes} min</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                <span className="text-gray-600">Course:</span>
                <span className="font-semibold text-gray-900">{courseName}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-500" />
                <span className="text-gray-600">Subject:</span>
                <span className="font-semibold text-gray-900">{subjectName}</span>
              </div>
              {batchNames && batchNames.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Users className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-600">Batches:</span>
                  {batchNames.map((b: string, i: number) => (
                    <Badge key={i} className="bg-blue-50 text-blue-700 text-xs ml-1">{b}</Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-500" />
                <span className="text-gray-600">Max Marks:</span>
                <span className="font-semibold text-pink-700">{test.total_marks}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-600">Passing Marks:</span>
                <span className="font-semibold text-yellow-700">{test.passing_marks}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span className="text-gray-600">Negative Marking:</span>
                <span className={test.has_negative_marking ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                  {test.has_negative_marking ? `Yes (-${test.negative_marks})` : 'No'}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 border">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <span className="text-gray-600">Total Attempts:</span>
                <span className="font-bold text-indigo-700">{test.statistics?.total_attempts ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-600">Completed Attempts:</span>
                <span className="font-bold text-green-700">{test.statistics?.completed_attempts ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-600">Average Score:</span>
                <span className="font-bold text-yellow-700">{test.statistics?.average_score?.toFixed(1) ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="text-gray-600">Pass %:</span>
                <span className="font-bold text-blue-700">{test.statistics?.pass_percentage?.toFixed(1) ?? 0}%</span>
              </div>
            </div>
          </div>

          {/* Student Submission Section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-lg">Your Submissions</span>
            </div>
            {myAttempts.length === 0 ? (
              <div className="text-gray-500 mb-4">You have not attempted this test yet.</div>
            ) : (
              <div className="grid gap-3">
                {myAttempts.map((a, idx) => (
                  <Card key={a.attempt_id || idx} className="border bg-white/80">
                    <CardContent className="py-3 px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="font-medium text-gray-900">Attempt {idx + 1}</div>
                        <div className="text-xs text-gray-500">Started: {a.start_time ? new Date(a.start_time).toLocaleString() : '-'}</div>
                        <div className="text-xs text-gray-500">Score: <span className="font-semibold text-blue-700">{a.score ?? '-'}</span></div>
                        <div className="text-xs text-gray-500">Status: {a.is_completed ? <span className="text-green-600 font-semibold">Completed</span> : <span className="text-yellow-600 font-semibold">In Progress</span>}</div>
                      </div>
                      <div className="flex gap-2">
                        {a.is_completed ? (
                          <Button variant="outline" onClick={() => navigate(`/student/test-analysis/${a.attempt_id}`)}>
                            <BarChart3 className="w-4 h-4 mr-1" /> View Result
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => navigate(`/student/test/${test.quiz_id}`)}>
                            <RefreshCw className="w-4 h-4 mr-1" /> Continue
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Start/Continue Button */}
            {!hasCompleted && (
              <div className="mt-4">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/student/test/${test.quiz_id}`)}>
                  <Play className="w-4 h-4 mr-2" /> {inProgress ? 'Continue Test' : 'Start Test'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTestDetails; 
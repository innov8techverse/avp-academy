import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testService } from '@/services/tests/testService';
import { Loader2, BookOpen, Clock, Target, Users, Calendar, Award, ShieldCheck, ChevronLeft, AlertTriangle } from 'lucide-react';

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

const TestDetails: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<any>(null);

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    testService.getTestDetails(Number(testId))
      .then(res => {
        setTest(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err?.response?.data?.message || 'Failed to fetch test details');
        setLoading(false);
      });
  }, [testId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-gray-600" />
        <span className="text-gray-600">Loading test details...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center mt-8 text-lg">{error}</div>;
  }

  if (!test) {
    return <div className="text-gray-600 text-center mt-8 text-lg">No test data found.</div>;
  }

  const getTypeColor = (type: string) => typeColors[type] || 'bg-gray-100 text-gray-800';
  const getStatusColor = (status: string) => statusColors[status] || 'bg-gray-100 text-gray-800';
  const getDifficultyColor = (diff: string) => difficultyColors[diff] || 'bg-gray-100 text-gray-800';

  const courseName = test.course?.name || test.course_name || test.course_id || 'All Courses';
  const subjectName = test.subject?.name || test.subject_name || test.subject_id || 'All Subjects';
  const batchNames = test.batches || (test.batch ? [test.batch.batch_name] : []);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Back
      </button>

      <div className="bg-white shadow-md rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{test.title}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(test.type)}`}>
                  {test.type}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(test.is_published ? 'Active' : 'Draft')}`}>
                  {test.is_published ? 'Active' : 'Draft'}
                </span>
                {test.has_negative_marking && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Negative Marking
                  </span>
                )}
              </div>
              <p className="mt-2 text-gray-600">{test.description}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span className="text-gray-600">Scheduled:</span>
                <span className="font-medium text-gray-900">
                  {test.scheduled_at ? new Date(test.scheduled_at).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{test.time_limit_minutes} min</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">Course:</span>
                <span className="font-medium text-gray-900">{courseName}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Subject:</span>
                <span className="font-medium text-gray-900">{subjectName}</span>
              </div>
              {batchNames.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-600">Batches:</span>
                  {batchNames.map((b: string, i: number) => (
                    <span key={i} className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {b}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-pink-500" />
                <span className="text-gray-600">Max Marks:</span>
                <span className="font-medium text-gray-900">{test.total_marks}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600">Passing Marks:</span>
                <span className="font-medium text-gray-900">{test.passing_marks}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Negative Marking:</span>
                <span className={test.has_negative_marking ? 'text-red-600 font-medium' : 'text-gray-600'}>
                  {test.has_negative_marking ? `Yes (-${test.negative_marks})` : 'No'}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span className="text-gray-600">Total Attempts:</span>
                  <span className="font-medium text-gray-900">{test.statistics?.total_attempts ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Completed Attempts:</span>
                  <span className="font-medium text-gray-900">{test.statistics?.completed_attempts ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600">Average Score:</span>
                  <span className="font-medium text-gray-900">{test.statistics?.average_score?.toFixed(1) ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">Pass %:</span>
                  <span className="font-medium text-gray-900">{test.statistics?.pass_percentage?.toFixed(1) ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              Questions ({test.question_analysis?.length || 0})
            </h2>
            <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
              {test.question_analysis?.map((q: any, idx: number) => (
                <div key={q.question_id || idx} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-gray-900">{q.question_text}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Correct: {q.correct_answers}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Accuracy: {q.accuracy?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!test.question_analysis || test.question_analysis.length === 0) && (
                <p className="text-gray-500">No questions found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetails;
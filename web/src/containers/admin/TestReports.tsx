import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Trophy, 
  Users, 
  Clock, 
  Target, 
  TrendingUp, 
  Eye,
  Award,
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Crown,
  Download,
  FileText
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}
import * as Papa from 'papaparse';

interface TestReport {
  quiz_id?: number;
  id?: number; // Alternative ID field
  title: string;
  type: string;
  status?: string;
  total_attempts?: number;
  completed_attempts?: number;
  average_score?: number;
  pass_percentage?: number;
  total_questions?: number;
  questions?: number; // Alternative field name
  total_marks?: number;
  maxMarks?: number; // Alternative field name
  leaderboard_enabled?: boolean;
  course?: string | {
    name: string;
  };
  subject?: string | {
    name: string;
  };
  attempts?: number; // Direct attempts count
}

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  score: number;
  total_marks: number;
  accuracy: number;
  time_taken: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
}

interface StudentAnalysis {
  user_id: number;
  user_name: string;
  user_avatar?: string;
  score: number;
  total_marks: number;
  accuracy: number;
  time_taken: number;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  completed_at: string;
  questions?: QuestionAnalysis[];
  question_analysis?: QuestionAnalysis[];
}

interface QuestionAnalysis {
  question_id: number;
  question_text: string;
  type: string;
  correct_answer: string;
  user_answer?: string;
  is_correct: boolean;
  marks: number;
  marks_obtained: number;
  explanation?: string;
  topic?: string;
  difficulty?: string;
  options?: string[];
}

const TestReports: React.FC = () => {
  const [selectedTest, setSelectedTest] = useState<TestReport | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalysis | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [enhancedLeaderboardData, setEnhancedLeaderboardData] = useState<any>({});
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isEnhancedLeaderboardOpen, setIsEnhancedLeaderboardOpen] = useState(false);
  const [isStudentAnalysisOpen, setIsStudentAnalysisOpen] = useState(false);
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState('all');
  const [leaderboardFilter, setLeaderboardFilter] = useState('all');
  const { toast } = useToast();

  // Fetch all tests with their reports
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['test-reports'],
    queryFn: async () => {
      const response = await apiClient.get('/tests/reports');
      return response.data || response;
    },
  });

  const tests: TestReport[] = testsData || [];

  const handleViewLeaderboard = async (testId: number) => {
    try {
      const response = await apiClient.get(`/tests/${testId}/leaderboard`);
      
      // Handle different response structures
      let leaderboard = [];
      if (Array.isArray(response)) {
        leaderboard = response;
      } else if (response && Array.isArray((response as any).leaderboard)) {
        leaderboard = (response as any).leaderboard;
      } else if (response && Array.isArray((response as any).data)) {
        leaderboard = (response as any).data;
      } else if (response && response.data && Array.isArray(response.data.leaderboard)) {
        leaderboard = response.data.leaderboard;
      } else if (response && response.data && Array.isArray(response.data)) {
        leaderboard = response.data;
      }
      
      setLeaderboardData(leaderboard);
      setIsLeaderboardOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch leaderboard or leaderboard is not enabled for this test',
        variant: 'destructive',
      });
    }
  };

  const handleViewEnhancedLeaderboard = async (test: TestReport) => {
    try {
      const response = await apiClient.get(`/tests/${test.quiz_id || test.id}/leaderboard/enhanced?status=${leaderboardFilter}`);
      
      // Handle response structure
      const data = (response as any).data || response;
      setEnhancedLeaderboardData(data);
      setSelectedTest(test);
      setIsEnhancedLeaderboardOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch enhanced leaderboard',
        variant: 'destructive',
      });
    }
  };

  const handleViewStudents = async (test: TestReport) => {
    try {
      const response = await apiClient.get(`/tests/${test.quiz_id || test.id}/students`);
      
      // Handle different response structures
      let students = [];
      if (Array.isArray(response)) {
        students = response;
      } else if (response && Array.isArray((response as any).students)) {
        students = (response as any).students;
      } else if (response && Array.isArray((response as any).data)) {
        students = (response as any).data;
      }
      
      setStudentsData(students);
      setSelectedTest(test);
      setIsStudentListOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch students data',
        variant: 'destructive',
      });
    }
  };

  const handleViewStudentAnalysis = async (testId: number, studentId: number) => {
    try {
      const response = await apiClient.get(`/tests/${testId}/students/${studentId}/report`);
      setSelectedStudent(response.data);
      setIsStudentAnalysisOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch student analysis',
        variant: 'destructive',
      });
    }
  };

  const toggleLeaderboard = async (testId: number) => {
    try {
      const response = await apiClient.patch(`/tests/${testId}/leaderboard/toggle`);
      toast({
        title: 'Success',
        description: response.data.message,
      });
      // Refetch tests to update the leaderboard status
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle leaderboard',
        variant: 'destructive',
      });
    }
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

  // Debug logging - remove in production
  // Export functions
  const exportToCSV = async (test: TestReport) => {
    try {
      // Fetch student data for the specific test
      const response = await apiClient.get(`/tests/${test.quiz_id || test.id}/students`);
      
      // Handle different response structures
      let students = [];
      if (Array.isArray(response)) {
        students = response;
      } else if (response && Array.isArray((response as any).students)) {
        students = (response as any).students;
      } else if (response && Array.isArray((response as any).data)) {
        students = (response as any).data;
      } else if (response && response.data && Array.isArray(response.data)) {
        students = response.data;
      }
      
      if (students.length === 0) {
        toast({
          title: 'No Data',
          description: 'No student data available for this test',
          variant: 'destructive',
        });
        return;
      }
      
      const studentData = students.map((student: any) => ({
        'Test Title': test.title,
        'Test Type': test.type,
        'Course/Subject': typeof test.course === 'string' ? test.course : test.course?.name || 'N/A',
        'Student Name': student.full_name || 'Unknown',
        'Student Email': student.email || 'N/A',
        'Batch': student.batch_name || 'N/A',
        'Status': student.is_completed ? 'Completed' : 'Not Started',
        'Total Questions': student.total_questions || 0,
        'Correct Answers': student.correct_answers || 0,
        'Wrong Answers': student.wrong_answers || 0,
        'Not Attempted': (student.total_questions || 0) - (student.correct_answers || 0) - (student.wrong_answers || 0),
        'Score': student.score || 0,
        'Total Marks': test.maxMarks || test.total_marks || 0,
        'Percentage': student.score && (test.maxMarks || test.total_marks) 
          ? ((student.score / (test.maxMarks || test.total_marks)) * 100).toFixed(2) + '%'
          : '0%',
        'Time Taken (seconds)': student.time_taken || 0,
        'Time Taken (formatted)': student.time_taken ? `${Math.floor(student.time_taken / 60)}m ${student.time_taken % 60}s` : 'N/A',
        'Started At': student.start_time ? new Date(student.start_time).toLocaleString() : 'N/A',
        'Completed At': student.submit_time ? new Date(student.submit_time).toLocaleString() : 'N/A'
      }));
      
      const csv = Papa.unparse(studentData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${test.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: 'Success',
        description: `${test.title} report exported to CSV successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to export CSV: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const exportToPDF = async (test: TestReport) => {
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Title
      pdf.setFontSize(18);
      pdf.text(`${test.title} - Test Report`, 20, 20);
      
      // Date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Test details
      pdf.setFontSize(12);
      pdf.text(`Test Type: ${test.type}`, 20, 45);
      pdf.text(`Course/Subject: ${typeof test.course === 'string' ? test.course : test.course?.name || 'N/A'}`, 20, 55);
      
      let yPosition = 70;
      
      try {
        const response = await apiClient.get(`/tests/${test.quiz_id || test.id}/students`);
        
        // Handle different response structures
        let students = [];
        if (Array.isArray(response)) {
          students = response;
        } else if (response && Array.isArray((response as any).students)) {
          students = (response as any).students;
        } else if (response && Array.isArray((response as any).data)) {
          students = (response as any).data;
        } else if (response && response.data && Array.isArray(response.data)) {
          students = response.data;
        }
        
        if (students.length === 0) {
          pdf.setFontSize(12);
          pdf.text('No students found for this test', 20, yPosition);
        } else {
          // Table data
          const tableData = students.map((student: any) => [
            student.full_name || 'Unknown',
            student.is_completed ? 'Completed' : 'Not Started',
            student.correct_answers || 0,
            student.wrong_answers || 0,
            (student.total_questions || 0) - (student.correct_answers || 0) - (student.wrong_answers || 0),
            student.score || 0,
            test.maxMarks || test.total_marks || 0,
            student.score && (test.maxMarks || test.total_marks) 
              ? ((student.score / (test.maxMarks || test.total_marks)) * 100).toFixed(1) + '%'
              : '0%',
            student.time_taken ? `${Math.floor(student.time_taken / 60)}m ${student.time_taken % 60}s` : 'N/A'
          ]);
          
          // Add table
          try {
            if (typeof pdf.autoTable === 'function') {
              pdf.autoTable({
                startY: yPosition,
                head: [['Student', 'Status', 'Correct', 'Wrong', 'Not Attempted', 'Score', 'Total', 'Percentage', 'Time Taken']],
                body: tableData,
                margin: { left: 20, right: 20 },
                styles: { 
                  fontSize: 8,
                  cellPadding: 2,
                  overflow: 'linebreak',
                  halign: 'left'
                },
                headStyles: { 
                  fillColor: [66, 139, 202],
                  textColor: [255, 255, 255],
                  fontStyle: 'bold'
                },
                columnStyles: {
                  0: { cellWidth: 25 }, // Student name
                  1: { cellWidth: 15 }, // Status
                  2: { cellWidth: 12 }, // Correct
                  3: { cellWidth: 12 }, // Wrong
                  4: { cellWidth: 15 }, // Not Attempted
                  5: { cellWidth: 10 }, // Score
                  6: { cellWidth: 10 }, // Total
                  7: { cellWidth: 15 }, // Percentage
                  8: { cellWidth: 15 }  // Time Taken
                }
              });
            } else {
              // Fallback: Create a simple table manually
              console.warn('autoTable plugin not available, using fallback table');
              pdf.setFontSize(8);
              pdf.text('Student Data:', 20, yPosition);
              yPosition += 8;
              
              // Add headers
              const headers = ['Student', 'Status', 'Correct', 'Wrong', 'Not Attempted', 'Score', 'Total', 'Percentage', 'Time Taken'];
              const columnWidths = [30, 15, 12, 12, 15, 10, 10, 15, 15]; // Adjusted for landscape
              let xPos = 20;
              headers.forEach((header, index) => {
                pdf.text(header, xPos, yPosition);
                xPos += columnWidths[index];
              });
              yPosition += 8;
              
              // Add data rows
              tableData.forEach((row: any[]) => {
                xPos = 20;
                row.forEach((cell: any, index) => {
                  // Truncate long text to fit column width
                  const cellText = String(cell).length > 15 ? String(cell).substring(0, 15) + '...' : String(cell);
                  pdf.text(cellText, xPos, yPosition);
                  xPos += columnWidths[index];
                });
                yPosition += 8;
                
                // Check if we need a new page (landscape has more height)
                if (yPosition > 180) {
                  pdf.addPage();
                  yPosition = 20;
                }
              });
            }
          } catch (tableError) {
            pdf.setFontSize(10);
            pdf.text('Error creating table. Raw data:', 20, yPosition);
            yPosition += 10;
            pdf.text(JSON.stringify(tableData, null, 2), 20, yPosition);
          }
        }
        
      } catch (error) {
        pdf.setFontSize(12);
        pdf.text(`Error: ${error.message || 'Failed to fetch student data'}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`Test ID: ${test.quiz_id || test.id}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`Status: ${error.response?.status || 'Unknown'}`, 20, yPosition);
      }
      
      pdf.save(`${test.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'Success',
        description: `${test.title} report exported to PDF successfully`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive',
      });
    }
  };

  if (testsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Test Reports</h2>
            <p className="text-gray-600">Comprehensive analysis of all tests and student performance</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading test reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Test Reports</h2>
          <p className="text-sm sm:text-base text-gray-600">Comprehensive analysis of all tests and student performance</p>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests found</h3>
          <p className="text-gray-600">Create some tests to see their reports here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {tests.map((test) => (
          <Card key={test.quiz_id || test.id} className="shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleViewStudents(test)}>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">{test.title}</span>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{test.type}</Badge>
                    {test.course && (
                      <Badge variant="secondary" className="text-xs">
                        {typeof test.course === 'string' ? test.course : test.course.name}
                      </Badge>
                    )}
                    {test.subject && (
                      <Badge variant="secondary" className="text-xs">
                        {typeof test.subject === 'string' ? test.subject : test.subject.name}
                      </Badge>
                    )}
                    <Badge 
                      variant={test.status === 'PUBLISHED' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {test.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewLeaderboard(test.quiz_id || test.id);
                    }}
                  >
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Leaderboard</span>
                    <span className="sm:hidden">Board</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewEnhancedLeaderboard(test);
                    }}
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">All Students</span>
                    <span className="sm:hidden">All</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportToCSV(test);
                    }}
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportToPDF(test);
                    }}
                  >
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                  <Button
                    variant={test.leaderboard_enabled ? "default" : "outline"}
                    size="sm"
                    className="w-full sm:w-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLeaderboard(test.quiz_id || test.id);
                    }}
                  >
                    <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden lg:inline">{test.leaderboard_enabled ? 'Disable' : 'Enable'} Leaderboard</span>
                    <span className="lg:hidden">{test.leaderboard_enabled ? 'Disable' : 'Enable'}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                    {test.total_attempts || test.attempts || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                    {test.completed_attempts || test.attempts || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Completed</div>
                </div>
               
              </div>

                            <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Completion Rate</span>
                  <span>
                    {(test.total_attempts || test.attempts || 0) > 0 
                      ? (((test.completed_attempts || test.attempts || 0) / (test.total_attempts || test.attempts || 1)) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={(test.total_attempts || test.attempts || 0) > 0 
                    ? ((test.completed_attempts || test.attempts || 0) / (test.total_attempts || test.attempts || 1)) * 100 
                    : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Leaderboard Dialog */}
      <Dialog open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Test Leaderboard
            </DialogTitle>
            <DialogDescription>
              View the leaderboard for this test showing student rankings and scores.
            </DialogDescription>
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
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full font-bold">
                    {entry.rank}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.user_avatar} />
                    <AvatarFallback>{entry.user_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{entry.user_name || 'Unknown User'}</div>
                    <div className="text-sm text-gray-600">
                      {entry.correct_answers}/{entry.total_questions} correct
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getScoreColor((entry.score / entry.total_marks) * 100)}`}>
                     {entry.score}/{entry.total_marks}
                  </div>
                  {/* <div className="text-sm text-gray-600">
                    {((entry.score / entry.total_marks) * 100).toFixed(1)}%
                  </div> //*/}
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

      {/* Student Analysis Dialog */}
      <Dialog open={isStudentAnalysisOpen} onOpenChange={setIsStudentAnalysisOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              Student Analysis
            </DialogTitle>
            <DialogDescription>
              Detailed analysis of student performance including question-by-question breakdown.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto sm:mx-0">
                  <AvatarImage src={selectedStudent.user_avatar} />
                  <AvatarFallback>{selectedStudent.user_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <div className="font-medium text-base sm:text-lg">{selectedStudent.user_name || 'Unknown Student'}</div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Score: {selectedStudent.score}/{selectedStudent.total_marks} ({((selectedStudent.score / selectedStudent.total_marks) * 100).toFixed(1)}%)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{(selectedStudent.accuracy || 0).toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedStudent.correct_answers}</div>
                      <div className="text-sm text-gray-600">Correct Answers</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{selectedStudent.wrong_answers}</div>
                      <div className="text-sm text-gray-600">Wrong Answers</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Question Analysis - Exact copy from student TestAnalysis.tsx */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Question Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(selectedStudent.questions || selectedStudent.question_analysis || []).map((question, index) => {
                      return (
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
                              {question.marks_obtained || 0}
                            </Badge>
                          </div>
                        </div>

                        {/* Student's Chosen Answer Display */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-blue-800">Student's Answer:</span>
                            <span className="ml-2 text-sm font-semibold text-blue-900">
                              {question.user_answer || 'No answer provided'}
                            </span>
                            {question.is_correct ? (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 ml-2" />
                            )}
                          </div>
                          <div className="text-xs text-blue-700">
                            Correct Answer: {question.correct_answer}
                          </div>
                        </div>

                        {question.options && question.options.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">Available Options:</p>
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded border ${
                                  option === question.correct_answer
                                    ? 'bg-green-50 border-green-200'
                                    : option === question.user_answer && !question.is_correct
                                      ? 'bg-red-50 border-red-200'
                                      : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <span className="text-sm">
                                  {option}
                                  {option === question.correct_answer && (
                                    <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                                  )}
                                  {option === question.user_answer && !question.is_correct && (
                                    <XCircle className="w-4 h-4 text-red-600 inline ml-2" />
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'TRUE_FALSE' && (
                          <div className="space-y-2">
                            {['True', 'False'].map((option) => (
                              <div
                                key={option}
                                className={`p-2 rounded border ${
                                  option.toLowerCase() === question.correct_answer
                                    ? 'bg-green-50 border-green-200'
                                    : option.toLowerCase() === question.user_answer && !question.is_correct
                                      ? 'bg-red-50 border-red-200'
                                      : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <span className="text-sm">
                                  {option}
                                  {option.toLowerCase() === question.correct_answer && (
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
                              className={`p-2 rounded border ${
                                question.user_answer?.toLowerCase() === question.correct_answer?.toLowerCase()
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
                                  <p className="text-sm text-gray-600 mt-1">
                                    Correct Answer: <span className="font-medium">{question.correct_answer}</span>
                                  </p>
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
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student List Dialog */}
      <Dialog open={isStudentListOpen} onOpenChange={setIsStudentListOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedTest?.title} - Student Management
            </DialogTitle>
            <DialogDescription>
              View all students who have attempted this test with their performance details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-4">
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="ml-auto">
                {studentsData.filter(student => {
                  if (studentFilter === 'all') return true;
                  if (studentFilter === 'not-started') return !student.attempt_id;
                  if (studentFilter === 'in-progress') return student.attempt_id && !student.is_completed;
                  if (studentFilter === 'completed') return student.is_completed;
                  return true;
                }).length} students
              </Badge>
            </div>

            {/* Students List */}
            <div className="grid gap-4">
              {studentsData.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No students found for this test</p>
                </div>
              ) : (
                studentsData
                  .filter(student => {
                    if (studentFilter === 'all') return true;
                    if (studentFilter === 'not-started') return !student.attempt_id;
                    if (studentFilter === 'in-progress') return student.attempt_id && !student.is_completed;
                    if (studentFilter === 'completed') return student.is_completed;
                    return true;
                  })
                  .map((student) => {
                    const getStatusColor = () => {
                      if (!student.attempt_id) return 'bg-gray-100 text-gray-800';
                      if (!student.is_completed) return 'bg-yellow-100 text-yellow-800';
                      return 'bg-green-100 text-green-800';
                    };

                    const getStatusText = () => {
                      if (!student.attempt_id) return 'Not Started';
                      if (!student.is_completed) return 'In Progress';
                      return 'Completed';
                    };

                    const getScoreColor = (score: number) => {
                      if (score >= 80) return 'text-green-600';
                      if (score >= 60) return 'text-yellow-600';
                      return 'text-red-600';
                    };

                    return (
                      <Card 
                        key={student.user_id} 
                        className={`hover:shadow-lg transition-shadow ${
                          student.is_completed ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => {
                          if (student.is_completed && student.attempt_id) {
                            handleViewStudentAnalysis(selectedTest?.quiz_id || selectedTest?.id, student.user_id);
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={student.avatar} />
                                <AvatarFallback className="font-medium">
                                  {student.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {student.full_name || 'Unknown Student'}
                                </div>
                                <div className="text-sm text-gray-600">{student.email}</div>
                                {student.batch_name && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {student.batch_name}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="text-right space-y-2">
                              <Badge className={getStatusColor()}>
                                {getStatusText()}
                              </Badge>
                              
                              {student.is_completed && (
                                <>
                                  {/* <div className={`text-lg font-bold ${getScoreColor(student.score || 0)}`}>
                                    {student.score || 0}%
                                  </div> */}
                                  <div className="text-sm text-gray-600">
                                    {student.correct_answers || 0}/{student.total_questions || 0} correct
                                  </div>
                                  {student.time_taken && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {Math.floor(student.time_taken / 60)}m {student.time_taken % 60}s
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {student.attempt_id && !student.is_completed && (
                                <div className="text-sm text-yellow-600">
                                  Started: {new Date(student.start_time).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Leaderboard Dialog */}
      <Dialog open={isEnhancedLeaderboardOpen} onOpenChange={setIsEnhancedLeaderboardOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {selectedTest?.title} - Enhanced Leaderboard
            </DialogTitle>
            <DialogDescription>
              Enhanced leaderboard with detailed student status and performance metrics.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-4">
              <Select value={leaderboardFilter} onValueChange={(value) => {
                setLeaderboardFilter(value);
                if (selectedTest) {
                  handleViewEnhancedLeaderboard(selectedTest);
                }
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="completed">Completed Only</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Stats Cards */}
              {enhancedLeaderboardData.stats && (
                <div className="flex gap-4 ml-auto">
                  <Badge variant="outline" className="bg-green-50">
                    ✓ {enhancedLeaderboardData.stats.completed} Completed
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50">
                    ⏳ {enhancedLeaderboardData.stats.in_progress} In Progress
                  </Badge>
                  <Badge variant="outline" className="bg-gray-50">
                    ⭕ {enhancedLeaderboardData.stats.not_started} Not Started
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50">
                    👥 {enhancedLeaderboardData.stats.total_students} Total
                  </Badge>
                </div>
              )}
            </div>

            {/* Enhanced Leaderboard List */}
            <div className="space-y-3">
              {enhancedLeaderboardData.students?.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No students found for the selected filter</p>
                </div>
              ) : (
                enhancedLeaderboardData.students?.map((student: any, index: number) => {
                  const getStatusColor = () => {
                    switch (student.status) {
                      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
                      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      case 'not-started': return 'bg-gray-100 text-gray-800 border-gray-200';
                      default: return 'bg-gray-100 text-gray-800 border-gray-200';
                    }
                  };

                  const getScoreColor = (score: number) => {
                    if (score >= 80) return 'text-green-600';
                    if (score >= 60) return 'text-yellow-600';
                    return 'text-red-600';
                  };

                  const getRankBadge = () => {
                    if (!student.rank) return null;
                    if (student.rank === 1) return (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold">
                        <Crown className="w-4 h-4" />
                      </div>
                    );
                    if (student.rank === 2) return (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-gray-300 to-gray-500 text-white font-bold">
                        2
                      </div>
                    );
                    if (student.rank === 3) return (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold">
                        3
                      </div>
                    );
                    return (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                        {student.rank}
                      </div>
                    );
                  };

                  return (
                    <Card 
                      key={student.user_id} 
                      className={`border-l-4 ${
                        student.status === 'completed' ? 'border-l-green-500' :
                        student.status === 'in-progress' ? 'border-l-yellow-500' :
                        'border-l-gray-300'
                      } ${student.is_completed ? 'cursor-pointer hover:shadow-lg' : ''} transition-shadow`}
                      onClick={() => {
                        if (student.is_completed && student.attempt_id) {
                          handleViewStudentAnalysis(selectedTest?.quiz_id || selectedTest?.id, student.user_id);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Rank Badge */}
                            {getRankBadge()}
                            
                            {/* Student Info */}
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={student.avatar} />
                              <AvatarFallback className="font-medium">
                                {student.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {student.full_name || 'Unknown Student'}
                              </div>
                              <div className="text-sm text-gray-600">{student.email}</div>
                              {student.batch_name && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {student.batch_name}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="text-right space-y-2">
                            {/* Status Badge */}
                            <Badge className={getStatusColor()}>
                              {student.status === 'completed' && '✓ Completed'}
                              {student.status === 'in-progress' && '⏳ In Progress'}
                              {student.status === 'not-started' && '⭕ Not Started'}
                            </Badge>
                            
                            {/* Score and Performance */}
                            {student.is_completed && (
                              <>
                                <div className={`text-2xl font-bold ${getScoreColor(student.score || 0)}`}>
                                  {student.score || 0}%
                                </div>
                                <div className="text-sm text-gray-600">
                                  {student.correct_answers || 0}/{student.total_questions || 0} correct
                                </div>
                                <div className="text-sm text-gray-600">
                                  {((student.accuracy || 0)).toFixed(1)}% accuracy
                                </div>
                                {student.time_taken && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {Math.floor(student.time_taken / 60)}m {student.time_taken % 60}s
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* In Progress Info */}
                            {student.status === 'in-progress' && student.start_time && (
                              <div className="text-sm text-yellow-600">
                                Started: {new Date(student.start_time).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestReports;

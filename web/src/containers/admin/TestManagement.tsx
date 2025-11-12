import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Clock, Users, MoreHorizontal, Calendar, Target, BookOpen, Edit, Trash2, Search, Settings, Database, Loader2, Eye, CheckCircle, XCircle, Copy, Image as ImageIcon, Info, FileText } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTests } from '@/hooks/api/useTests';
import { useCourses } from '@/hooks/api/useAdmin';
import { useQPCodes } from '@/hooks/api/useQPCodes';
import { useQuestionsByQPCode, useQuestionPaperQuestions } from '@/hooks/api/useQuestionPapers';
import { CreateTestData, QuestionBankItem } from '@/services/tests/testService';
import { testService } from '@/services/tests/testService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF, exportToCSV, exportToDetailedPDF, exportToQuestionPaperPDF, TestExportData, QuestionExportData } from '@/utils/exportUtils';
//test management
const TestManagement = () => {
  const {
    tests,
    subjects,
    batches,
    questionBank,
    loading,
    error,
    fetchTests,
    fetchSubjectsByCourse,
    fetchBatchesByCourse,
    fetchQuestionBank,
    fetchQuestionBankByCourse,
    fetchQuestionBankByQPCode,
    createTest,
    updateTest,
    deleteTest,
    
    publishTest,
    archiveTest,
    draftTest,
    startTest,        // New status management
    completeTest,     // New status management
    publishTestResults, // Publish test results
    addQuestionsToTest,
    getTestQuestions,
  } = useTests();

  const { data: coursesData } = useCourses();
  const courses = coursesData?.data || [];
  
  const { data: qpCodesResponse } = useQPCodes();
  const qpCodes = (qpCodesResponse as any)?.data || [];

  const navigate = useNavigate();
  const { toast } = useToast();

  // Enhanced status management utilities
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'NOT_STARTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ARCHIVED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return '📝';
      case 'NOT_STARTED': return '⏰';
      case 'IN_PROGRESS': return '▶️';
      case 'COMPLETED': return '✅';
      case 'ARCHIVED': return '📦';
      default: return '❓';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'DRAFT';
      case 'NOT_STARTED': return 'NOT_STARTED';
      case 'IN_PROGRESS': return 'IN_PROGRESS';
      case 'COMPLETED': return 'COMPLETED';
      case 'ARCHIVED': return 'ARCHIVED';
      default: return status;
    }
  };

  const canStartTest = (test: any) => {
    return ['DRAFT', 'NOT_STARTED'].includes(test.status);
  };

  const canCompleteTest = (test: any) => {
    return ['NOT_STARTED', 'IN_PROGRESS'].includes(test.status);
  };

  const isTestScheduled = (test: any) => {
    return test.startTime && test.endTime;
  };

  const [newTest, setNewTest] = useState<CreateTestData>({
    title: '',
    type: 'Mock Test',
    courseId: undefined,
    subjectId: undefined,
    batchIds: [],
    questions: '', // changed to string
    duration: '', // changed to string
    maxMarks: '', // changed to string
    marksPerQuestion:'',
    scheduledDate: '',
    // New scheduling fields
    startTime: '',
    endTime: '',
    autoStart: true,
    autoEnd: true,
    gracePeriod: 5,
    description: '',
    isCommon: false,
    questionSource: 'questionBank',
    selectedQuestions: [],
    manualQuestions: '',
    settings: {
      shuffleQuestions: true,
      shuffleOptions: false,
      showImmediateResult: false,
      negativeMarks: true,
      negativeMarkValue: '', // changed to string
      timeLimit: true,
      allowRevisit: true,
      showCorrectAnswers: true,
      allowPreviousNavigation: true,
      resultReleaseTime: null,
      passPercentage: '' // changed to string
    }
  });

  // QP Code selection state
  const [selectedQPCode, setSelectedQPCode] = useState<string>('all');
  const [selectedQuestionPaper, setSelectedQuestionPaper] = useState<string>('all');
  const [selectedQPQuestions, setSelectedQPQuestions] = useState<any[]>([]);

  // Hook to get questions for a specific question paper
  const { data: questionPaperQuestionsResponse } = useQuestionPaperQuestions(
    selectedQuestionPaper !== 'all' ? selectedQuestionPaper : '',
    { limit: 300 }
  );

   useEffect(() => {
     // Configuration tracking
   }, [newTest]);

   const [filters, setFilters] = useState({
    search: '',
    course: 'all',
    subject: 'all',
    type: 'all',
    status: 'all'
  });

  // Question Bank Modal State
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [questionPreview, setQuestionPreview] = useState<QuestionBankItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Question Bank Search/Filter State
  const [questionBankSearch, setQuestionBankSearch] = useState('');
  const [questionBankDifficulty, setQuestionBankDifficulty] = useState('all');
  const [questionBankType, setQuestionBankType] = useState('all');
  const [questionBankPaperCode, setQuestionBankPaperCode] = useState('all');
  const [questionBankTopic, setQuestionBankTopic] = useState('all');

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [editMode, setEditMode] = useState<number | null>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Handle course selection
  const handleCourseChange = (courseId: string) => {
    setNewTest({
      ...newTest,
      courseId: courseId !== 'none' ? parseInt(courseId) : undefined,
      subjectId: undefined,
      batchIds: []
    });
    if (courseId !== 'none') {
      fetchSubjectsByCourse(parseInt(courseId));
      fetchBatchesByCourse(parseInt(courseId));
      // Also fetch question bank for the course (if subject is not selected)
      fetchQuestionBankByCourse(parseInt(courseId));
    }
  };

  // Handle subject selection
  const handleSubjectChange = (subjectId: string) => {
    setNewTest({
      ...newTest,
      subjectId: subjectId !== 'all' ? parseInt(subjectId) : undefined
    });
    if (subjectId !== 'all') {
      fetchQuestionBank(parseInt(subjectId));
    } else if (newTest.courseId) {
      // If subject is cleared, fetch question bank for the course
      fetchQuestionBankByCourse(newTest.courseId);
    }
  };

  // Handle QP Code selection
  const handleQPCodeSelection = (qpCodeId: string) => {
    setSelectedQPCode(qpCodeId);
    setSelectedQuestionPaper('all'); // Reset question paper selection
    
    if (qpCodeId !== 'all') {
      // Get the selected QP Code data
      const selectedQPCodeData = qpCodes.find(q => q.qp_code_id.toString() === qpCodeId);
      
      // Fetch questions for this QP Code
      fetchQuestionBankByQPCode(parseInt(qpCodeId));
      
      if (selectedQPCodeData?.question_papers && selectedQPCodeData.question_papers.length > 0) {
        // If QP Code has question papers, show them for selection
        setSelectedQPQuestions([]);
        setNewTest(prev => ({
          ...prev,
          questions: '',
          maxMarks: '',
          selectedQuestions: []
        }));
      } else {
        // If no question papers, the questions will be available in questionBank after fetch
        setSelectedQPQuestions([]);
        setNewTest(prev => ({
          ...prev,
          questions: '',
          maxMarks: '',
          selectedQuestions: []
        }));
      }
    } else {
      // Reset everything when "All QP Codes" is selected
      setSelectedQPQuestions([]);
      setQuestionBank([]); // Clear question bank
      setNewTest(prev => ({
        ...prev,
        questions: '',
        maxMarks: '',
        selectedQuestions: []
      }));
    }
  };

  // Handle Question Paper selection
  const handleQuestionPaperSelection = (paperId: string) => {
    setSelectedQuestionPaper(paperId);
    
    // Reset questions and test data when changing papers
    setNewTest(prev => ({
      ...prev,
      questions: '',
      maxMarks: '',
      selectedQuestions: []
    }));
  };

  // Update selectedQPQuestions when questionPaperQuestionsResponse changes
  useEffect(() => {
    if (questionPaperQuestionsResponse?.data) {
      setSelectedQPQuestions(questionPaperQuestionsResponse.data);
    } else if (selectedQuestionPaper === 'all') {
      setSelectedQPQuestions([]);
    }
  }, [questionPaperQuestionsResponse, selectedQuestionPaper]);

  // Calculate total marks when marks per question or question count changes
  useEffect(() => {
    if (newTest.marksPerQuestion && newTest.questions) {
      const marksPerQ = typeof newTest.marksPerQuestion === 'string' ? parseInt(newTest.marksPerQuestion) || 0 : newTest.marksPerQuestion;
      const questionCount = typeof newTest.questions === 'string' ? parseInt(newTest.questions) || 0 : newTest.questions;
      
      setNewTest(prev => ({
        ...prev,
        maxMarks: marksPerQ * questionCount
      }));
    }
  }, [newTest.marksPerQuestion, newTest.questions]);

  const handleCreateTest = async () => {
    // Comprehensive validation with specific error messages
    const errors: string[] = [];
    
    if (!newTest.title?.trim()) {
      errors.push('Test title is required');
    } else if (newTest.title.length < 3) {
      errors.push('Test title must be at least 3 characters long');
    }
    
    if (!newTest.questions || parseInt(newTest.questions as string) <= 0) {
      errors.push('Number of questions must be greater than 0');
    } else if (parseInt(newTest.questions as string) > 200) {
      errors.push('Number of questions cannot exceed 200');
    }
    
    if (!newTest.duration || parseInt(newTest.duration as string) <= 0) {
      errors.push('Test duration must be greater than 0 minutes');
    } else if (parseInt(newTest.duration as string) > 480) {
      errors.push('Test duration cannot exceed 8 hours (480 minutes)');
    }
    
    if (!newTest.marksPerQuestion || parseFloat(newTest.marksPerQuestion as string) <= 0) {
      errors.push('Marks per question must be greater than 0');
    } else if (parseFloat(newTest.marksPerQuestion as string) > 10) {
      errors.push('Marks per question cannot exceed 10');
    }
    
    if (!newTest.isCommon && !newTest.courseId) {
      errors.push('Course selection is required for non-common tests');
    }
    
    if (newTest.isCommon && !newTest.subjectId) {
      errors.push('Subject selection is required for common tests');
    }
    
    if (newTest.startTime && newTest.endTime) {
      const startTime = new Date(newTest.startTime);
      const endTime = new Date(newTest.endTime);
      if (startTime >= endTime) {
        errors.push('End time must be after start time');
      }
      
      // Check if test duration is reasonable compared to scheduled time
      const scheduledDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
      if (scheduledDuration < parseInt(newTest.duration as string)) {
        errors.push('Scheduled test duration is shorter than the test time limit');
      }
    }
    
    if (newTest.settings?.resultReleaseTime) {
      const resultReleaseTime = new Date(newTest.settings.resultReleaseTime);
      if (newTest.endTime && resultReleaseTime < new Date(newTest.endTime)) {
        errors.push('Result release time must be after test end time');
      }
    }
    
    if (newTest.settings.negativeMarkValue && parseFloat(newTest.settings.negativeMarkValue as string) < 0) {
      errors.push('Negative mark value cannot be negative');
    }
    
    if (newTest.settings.passPercentage && (parseInt(newTest.settings.passPercentage as string) < 0 || parseInt(newTest.settings.passPercentage as string) > 100)) {
      errors.push('Pass percentage must be between 0 and 100');
    }

    // Validate question selection for questionBank source
    if (newTest.questionSource === 'questionBank' && (!newTest.selectedQuestions || newTest.selectedQuestions.length === 0)) {
      errors.push('Please select questions from the question bank using the "Select Questions" button');
    }
    
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const preparedTest = {
        ...newTest,
        questions: parseInt(newTest.questions as string) || 0,
        duration: parseInt(newTest.duration as string) || 0,
        maxMarks: parseInt(newTest.maxMarks as string) || 0,
        // Only send selectedQuestions if they were manually selected
        selectedQuestions: newTest.questionSource === 'questionBank' ? (newTest.selectedQuestions || []) : [],
        settings: {
          ...newTest.settings,
          negativeMarkValue: parseFloat(newTest.settings.negativeMarkValue as string) || 0,
          passPercentage: parseInt(newTest.settings.passPercentage as string) || 0,
        }
      };

             if (editMode) {
         await testService.updateTest(editMode, preparedTest);
         setEditMode(null);
         toast({
           title: "Success",
           description: "Test updated successfully",
         });
       } else {
         const result = await createTest(preparedTest);
       }
      
      // Reset form only after successful create/update
      setNewTest({
        title: '',
        type: 'Mock Test',
        courseId: undefined,
        subjectId: undefined,
        batchIds: [],
        questions: '',
        duration: '',
        maxMarks: '',
        marksPerQuestion:'',
        // Reset new scheduling fields
        startTime: '',
        endTime: '',
        autoStart: true,
        autoEnd: true,
        gracePeriod: 5,
        description: '',
        isCommon: false,
        questionSource: 'questionBank',
        selectedQuestions: [],
        manualQuestions: '',
        settings: {
          shuffleQuestions: true,
          shuffleOptions: false,
          showImmediateResult: false,
          negativeMarks: true,
          negativeMarkValue: '',
          timeLimit: true,
          allowRevisit: true,
          showCorrectAnswers: true,
          allowPreviousNavigation: true,
          resultReleaseTime: null,
          passPercentage: ''
        }
      });

      // Switch to manage tab to see the result
      setActiveTab('manage');
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || 'Failed to save test',
        variant: "destructive",
      });
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await deleteTest(testId);
      } catch (error) {
        // Error deleting test
      }
    }
  };

  const handleViewQuestions = async (testId: number) => {
    try {
      setQuestionsLoading(true);
      const questionsData = await getTestQuestions(testId, { includeAnswers: true });
      setTestQuestions(questionsData.questions || []);
      setIsQuestionsModalOpen(true);
    } catch (error) {
      // Error fetching test questions
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleExportQuestions = async (testId: number, includeAnswers: boolean, format: 'csv' | 'pdf' | 'detailed-pdf' | 'question-paper') => {
    try {
      setQuestionsLoading(true);
      
      // Get the test data first
      const test = tests.find(t => t.id === testId);
      if (!test) {
        throw new Error('Test not found');
      }
      
      // Get questions data
      const questionsData = await getTestQuestions(testId, { includeAnswers: true, format: 'json' });
      const questions = questionsData.questions || [];
      
      // Prepare export data
      const exportData: TestExportData = {
        testName: test.title,
        courseName: test.course || 'Unknown Course',
        subjectName: test.subject || 'Unknown Subject',
        scheduledDate: test.scheduledDate || test.startTime || new Date().toISOString().split('T')[0],
        questions: questions.map((q: any) => ({
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          type: q.type,
          difficulty: q.difficulty,
          topic: q.topic,
          marks: q.marks,
          options: q.options || [],
          correctAnswer: includeAnswers ? q.correctAnswer : undefined,
          explanation: includeAnswers ? q.explanation : undefined,
        }))
      };
      
      if (format === 'csv') {
        // Use frontend CSV export
        exportToCSV(exportData, includeAnswers);
        toast({
          title: "Success",
          description: "Questions exported to CSV successfully",
        });
      } else if (format === 'pdf') {
        // Use frontend PDF export with table format
        exportToPDF(exportData, includeAnswers);
        toast({
          title: "Success",
          description: "Questions exported to PDF successfully",
        });
      } else if (format === 'detailed-pdf') {
        // Use frontend PDF export with detailed format
        exportToDetailedPDF(exportData, includeAnswers);
        toast({
          title: "Success",
          description: "Questions exported to detailed PDF successfully",
        });
      } else if (format === 'question-paper') {
        // Use frontend PDF export with question paper format
        exportToQuestionPaperPDF(exportData, includeAnswers);
        toast({
          title: "Success",
          description: "Questions exported to question paper PDF successfully",
        });
      }
    } catch (error) {
      console.error('Failed to export questions:', error);
      toast({
        title: "Error",
        description: "Failed to export questions",
        variant: "destructive",
      });
    } finally {
      setQuestionsLoading(false);
    }
  };



  const handleCloneTest = (test: any) => {
    // Support both array of objects (with question_id) and array of IDs
    let selectedQuestions: number[] = [];
    if (Array.isArray(test.selectedQuestions) && test.selectedQuestions.length > 0) {
      // If selectedQuestions is an array of objects (sample provided)
      if (typeof test.selectedQuestions[0] === 'object' && test.selectedQuestions[0] !== null) {
        selectedQuestions = test.selectedQuestions.map((q: any) => q.question_id).filter(Boolean);
      } else {
        selectedQuestions = test.selectedQuestions;
      }
    } else if (Array.isArray(test.questions) && test.questions.length > 0) {
      // If questions is an array of objects (from backend)
      if (typeof test.questions[0] === 'object' && test.questions[0] !== null) {
        selectedQuestions = test.questions.map((q: any) => q.question_id || (q.question && q.question.question_id)).filter(Boolean);
      }
    }
    setNewTest({
      ...test,
      title: `${test.title} (Copy)`,
      description: test.description || '',
      batchIds: [],
      isCommon: false,
      marksPerQuestion: test.marksPerQuestion || 4,
      questionSource: test.questionSource || 'questionBank',
      selectedQuestions,
      manualQuestions: test.manualQuestions || '',
      settings: { ...test.settings },
    });
    setActiveTab('create');
    // Open question bank modal and fetch questions if needed
    if ((test.questionSource || 'questionBank') === 'questionBank') {
      if (test.subjectId) {
        fetchQuestionBank(test.subjectId);
      } else if (test.courseId) {
        fetchQuestionBankByCourse(test.courseId);
      }
      setIsQuestionBankOpen(true);
    }
  };

  const handleEditTest = (test: any) => {
    // Extract selected question IDs as in clone
    let selectedQuestions: number[] = [];
    if (Array.isArray(test.selectedQuestions) && test.selectedQuestions.length > 0) {
      if (typeof test.selectedQuestions[0] === 'object' && test.selectedQuestions[0] !== null) {
        selectedQuestions = test.selectedQuestions.map((q: any) => q.question_id).filter(Boolean);
      } else {
        selectedQuestions = test.selectedQuestions;
      }
    } else if (Array.isArray(test.questions) && test.questions.length > 0) {
      if (typeof test.questions[0] === 'object' && test.questions[0] !== null) {
        selectedQuestions = test.questions.map((q: any) => q.question_id || (q.question && q.question.question_id)).filter(Boolean);
      }
    }
    
    

    // Format datetime-local values
    const formatDateTimeLocal = (dateString: string | null) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };
    
    setNewTest({
      ...test,
      title: test.title || '',
       type: test.type || 'Mock Test',
      courseId: test.courseId || undefined,
      subjectId: test.subjectId || undefined,
      batchIds: test.batchIds || [],
      isCommon: test.isCommon || false,
      marksPerQuestion: test.marksPerQuestion || Math.ceil(test.maxMarks / test.questions) || 4,
      questionSource: test.questionSource || 'questionBank',
      selectedQuestions,
      manualQuestions: test.manualQuestions || '',
      // Map scheduling fields
      
      startTime: formatDateTimeLocal(test.startTime),
      endTime: formatDateTimeLocal(test.endTime),
      autoStart: test.autoStart !== undefined ? test.autoStart : true,
      autoEnd: test.autoEnd !== undefined ? test.autoEnd : true,
      gracePeriod: test.gracePeriod || 5,
      // Map settings with proper defaults
      settings: {
        shuffleQuestions: test.settings?.shuffleQuestions ?? true,
        shuffleOptions: test.settings?.shuffleOptions ?? false,
        showImmediateResult: test.settings?.showImmediateResult ?? false,
        negativeMarks: test.settings?.negativeMarks ?? false,
        negativeMarkValue: test.settings?.negativeMarkValue?.toString() || '0.25',
        timeLimit: test.settings?.timeLimit ?? true,
        allowRevisit: test.settings?.allowRevisit ?? true,
        showCorrectAnswers: test.settings?.showCorrectAnswers ?? true,
        allowPreviousNavigation: test.settings?.allowPreviousNavigation ?? true,
        resultReleaseTime: formatDateTimeLocal(test.settings?.resultReleaseTime),
        passPercentage: test.settings?.passPercentage?.toString() || '40'
      }
    });
    setEditMode(test.id);
    setActiveTab('create');
    
    // Fetch related data for editing
    if (test.courseId) {
      fetchSubjectsByCourse(test.courseId);
      fetchBatchesByCourse(test.courseId);
    }
    
    if ((test.questionSource || 'questionBank') === 'questionBank') {
      if (test.subjectId) {
        fetchQuestionBank(test.subjectId);
      } else if (test.courseId) {
        fetchQuestionBankByCourse(test.courseId);
      }
    }
  };

  // Apply filters to tests
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(filters.search.toLowerCase());
     const matchesCourse = filters.course === 'all' || 
       (filters.course === '0' && test.isCommon) || 
       (filters.course !== '0' && test.courseId === parseInt(filters.course));
     const matchesSubject = filters.subject === 'all' || 
       (test.subjectId && test.subjectId === parseInt(filters.subject));
    const matchesType = filters.type === 'all' || test.type === filters.type;
    const matchesStatus = filters.status === 'all' || test.status === filters.status;
    
    return matchesSearch && matchesCourse && matchesSubject && matchesType && matchesStatus;
  });

  // Pagination calculations
  const totalTests = filteredTests.length;
  const totalPages = Math.ceil(totalTests / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTests);
  const paginatedTests = filteredTests.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.course, filters.subject, filters.type, filters.status]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Mock Test': return 'bg-blue-100 text-blue-800';
      case 'Daily Test': return 'bg-green-100 text-green-800';
      case 'Weekly Test': return 'bg-purple-100 text-purple-800';
      case 'Monthly Test': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  // Update filters and refetch tests
  // Fetch all tests with high limit for client-side pagination
  useEffect(() => {
    fetchTests({ ...filters, limit: 10000, page: 1 });
  }, [filters]);

   // Load subjects when course filter changes
   useEffect(() => {
     if (filters.course && filters.course !== 'all' && filters.course !== '0') {
       fetchSubjectsByCourse(parseInt(filters.course));
     }
   }, [filters.course]);

  // Add useEffect to sync number of questions with selectedQuestions length for question bank mode
  useEffect(() => {
    if (newTest.questionSource === 'questionBank' && newTest.selectedQuestions) {
      setNewTest(prev => ({
        ...prev,
        questions: prev.selectedQuestions ? String(prev.selectedQuestions.length) : ''
      }));
    }
  }, [newTest.selectedQuestions, newTest.questionSource]);

  // Handle question bank updates when QP Code is selected
  useEffect(() => {
    if (selectedQPCode !== 'all' && questionBank.length > 0) {
      const selectedQPCodeData = qpCodes.find(q => q.qp_code_id.toString() === selectedQPCode);
      
      if (selectedQPCodeData && !selectedQPCodeData.question_papers?.length) {
        // If no question papers, filter questions by QP Code
        const qpQuestions = questionBank.filter(q => q.qp_code_id === selectedQPCodeData.qp_code_id);
        
        setSelectedQPQuestions(qpQuestions);
        
        // Don't auto-fill the test data - let user choose
        setNewTest(prev => ({
          ...prev,
          // Reset question selection when changing QP codes
          questions: '',
          maxMarks: '',
          selectedQuestions: []
        }));
      }
    }
  }, [questionBank, selectedQPCode, qpCodes]);

  // Filter question bank based on search and filters
  // Use questions from selected question paper if available, otherwise use all questions
  const baseQuestions = selectedQPQuestions.length > 0 ? selectedQPQuestions : questionBank;
  
  const filteredQuestionBank = baseQuestions.filter(q => {
    const matchesSearch = questionBankSearch === '' || 
      (q.question_text?.toLowerCase?.().includes(questionBankSearch.toLowerCase()) ||
       q.topic?.toLowerCase?.().includes(questionBankSearch.toLowerCase()));
    const matchesDifficulty = questionBankDifficulty === 'all' || q.difficulty === questionBankDifficulty;
    const matchesType = questionBankType === 'all' || q.type === questionBankType;
    const matchesPaperCode = questionBankPaperCode === 'all' || q.question_paper_code === questionBankPaperCode;
    const matchesTopic = questionBankTopic === 'all' || q.topic === questionBankTopic;
    
    return matchesSearch && matchesDifficulty && matchesType && matchesPaperCode && matchesTopic;
  });

  if (loading && tests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading tests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Test Management
            </h1>
            <p className="text-gray-600 mt-2">Create and manage quizzes, mock tests, and assessments</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-100 p-3 lg:p-4 rounded-lg text-center">
              <Target className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 mx-auto mb-1" />
               <p className="text-xs lg:text-sm font-medium text-blue-800">{tests.filter(t => ['IN_PROGRESS'].includes(t.status)).length} Active</p>
            </div>
            <div className="bg-green-100 p-3 lg:p-4 rounded-lg text-center">
              <Users className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs lg:text-sm font-medium text-green-800">{tests.reduce((sum, t) => sum + t.attempts, 0)} Attempts</p>
            </div>
            <div className="bg-purple-100 p-3 lg:p-4 rounded-lg text-center">
              <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 mx-auto mb-1" />
               <p className="text-xs lg:text-sm font-medium text-purple-800">{tests.filter(t => ['DRAFT'].includes(t.status)).length} Drafts</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'create' | 'manage')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
          <TabsTrigger value="create" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
            {editMode ? 'Edit Test' : 'Create Test'}
          </TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Manage Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-50 to-indigo-100">
            <CardHeader className="bg-indigo-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg lg:text-xl">
                <Plus className="w-5 h-5 mr-2" />
                {editMode ? 'Edit Test' : 'Create New Test'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6 space-y-6">
              {/* Basic Test Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <Label htmlFor="testTitle" className="text-indigo-700 font-medium">Test Title *</Label>
                  <Input
                    id="testTitle"
                    value={newTest.title}
                    onChange={(e) => setNewTest({...newTest, title: e.target.value})}
                    placeholder="e.g., Physics Mock Test - Laws of Motion"
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <Label htmlFor="testType" className="text-indigo-700 font-medium">Test Type *</Label>
                  <Select value={newTest.type} onValueChange={(value) => setNewTest({...newTest, type: value as any})}>
                    <SelectTrigger className="border-indigo-200 focus:border-indigo-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mock Test">Mock Test</SelectItem>
                      <SelectItem value="Daily Test">Daily Test</SelectItem>
                      <SelectItem value="Weekly Test">Weekly Test</SelectItem>
                      <SelectItem value="Monthly Test">Monthly Test</SelectItem>
              
                    </SelectContent>
                  </Select>
                </div>

                {!newTest.isCommon && (
                  <>
                    <div>
                      <Label htmlFor="testCourse" className="text-indigo-700 font-medium">Course *</Label>
                      <Select 
                        value={newTest.courseId?.toString() || 'none'} 
                        onValueChange={handleCourseChange}
                      >
                        <SelectTrigger className="border-indigo-200 focus:border-indigo-500">
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select Course</SelectItem>
                          {courses.map((course) => (
                            <SelectItem key={course.course_id} value={course.course_id.toString()}>
                              {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="testSubject" className="text-indigo-700 font-medium">Subject</Label>
                      <Select 
                        value={newTest.subjectId?.toString() || 'all'} 
                        onValueChange={handleSubjectChange}
                        disabled={!newTest.courseId}
                      >
                        <SelectTrigger className="border-indigo-200 focus:border-indigo-500">
                          <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects</SelectItem>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="marksPerQuestion" className="text-indigo-700 font-medium">Marks per Question *</Label>
                  <Input
                    id="marksPerQuestion"
                    type="number"
                    value={newTest.marksPerQuestion}
                    onChange={(e) => setNewTest({...newTest, marksPerQuestion: parseInt(e.target.value) || 4})}
                    placeholder="0"
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <Label htmlFor="testQuestions" className="text-indigo-700 font-medium">Number of Questions ( Import from Question Bank)</Label>
                  <Input
                    id="testQuestions"
                    type="number"
                    value={newTest.questions}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setNewTest({...newTest, questions: value});
                      }
                    }}
                    placeholder="50"
                    className="border-indigo-200 focus:border-indigo-500"
                    disabled={newTest.questionSource === 'questionBank'}
                  />
                  
                </div>
                <div>
                  <Label htmlFor="testDuration" className="text-indigo-700 font-medium">Duration (minutes) *</Label>
                  <Input
                    id="testDuration"
                    type="number"
                    value={newTest.duration}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setNewTest({...newTest, duration: value});
                      }
                    }}
                    placeholder="90"
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <Label htmlFor="testMarks" className="text-indigo-700 font-medium">Total Marks (Auto-calculated)</Label>
                  <Input
                    id="testMarks"
                    type="number"
                    value={newTest.maxMarks}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setNewTest({...newTest, maxMarks: value});
                      }
                    }}
                    placeholder="0"
                    disabled={newTest.questionSource === 'questionBank'}
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                
              </div>

              {/* QP Code Selection Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">QP Code Selection</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Auto-Fill Available
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-green-700 font-medium">Select QP Code</Label>
                    <Select value={selectedQPCode} onValueChange={handleQPCodeSelection}>
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue placeholder="Choose a QP Code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All QP Codes</SelectItem>
                        {qpCodes.map((qpCode) => (
                          <SelectItem key={qpCode.qp_code_id} value={qpCode.qp_code_id.toString()}>
                            {qpCode.code}{qpCode.description?` - ${qpCode.description}`:""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedQPCode !== 'all' && qpCodes.find(q => q.qp_code_id.toString() === selectedQPCode)?.question_papers && qpCodes.find(q => q.qp_code_id.toString() === selectedQPCode)?.question_papers!.length > 0 && (
                    <div>
                      <Label className="text-green-700 font-medium">Select Question Paper</Label>
                      <Select value={selectedQuestionPaper} onValueChange={handleQuestionPaperSelection}>
                        <SelectTrigger className="border-green-200 focus:border-green-500">
                          <SelectValue placeholder="Choose a Question Paper" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Question Papers</SelectItem>
                          {qpCodes.find(q => q.qp_code_id.toString() === selectedQPCode)?.question_papers?.map((paper) => (
                            <SelectItem key={paper.paper_id} value={paper.paper_id.toString()}>
                              {paper.paper_name} ({paper.paper_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {selectedQPCode !== 'all' && selectedQPQuestions.length > 0 && (
                    <div className="p-4 bg-white border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-green-800">
                          {selectedQuestionPaper !== 'all' 
                            ? qpCodes.find(q => q.qp_code_id.toString() === selectedQPCode)?.question_papers?.find(p => p.paper_id.toString() === selectedQuestionPaper)?.paper_name
                            : qpCodes.find(q => q.qp_code_id.toString() === selectedQPCode)?.description
                          }
                        </h4>
                        <Badge className="bg-green-100 text-green-800">
                          {selectedQPQuestions.length} questions
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-green-700 font-medium">QP Code:</span>
                          <span className="ml-2 text-green-600">
                            {qpCodes.find(q => q.qp_code_id.toString() === selectedQPCode)?.code}
                          </span>
                        </div>
                        {selectedQuestionPaper !== 'all' && (
                          <div>
                            <span className="text-green-700 font-medium">Paper Code:</span>
                            <span className="ml-2 text-green-600">
                              {qpCodes.find(q => q.qp_code_id.toString() === selectedQPCode)?.question_papers?.find(p => p.paper_id.toString() === selectedQuestionPaper)?.paper_code}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-green-700 font-medium">Total Marks:</span>
                          <span className="ml-2 text-green-600">
                            {selectedQPQuestions.reduce((sum, q) => sum + (q.marks || 1), 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedQPQuestions.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-green-200 rounded-lg p-3 bg-white">
                      <div className="text-sm text-green-700 font-medium mb-2">
                        {selectedQuestionPaper !== 'all' 
                          ? `Questions from selected Question Paper:`
                          : `Questions from selected QP Code:`
                        }
                      </div>
                      {selectedQPQuestions.map((question) => (
                        <div key={question.question_id} className="flex items-center justify-between mb-2 p-2 bg-green-50 rounded border border-green-100">
                          <div className="flex items-center space-x-2 flex-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-700 flex-1">
                              {question.question_text ? (question.question_text.includes('_!_!_') ? question.question_text.split('_!_!_')[0] : question.question_text) : 'No question text'}...
                            </span>
                            <Badge variant="outline" className="text-xs">Question difficulty: {question.difficulty}</Badge>
                            {question.type && <Badge variant="outline" className="text-xs">Question Type: {question.type}</Badge>}
                            
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setQuestionPreview(question);
                              setIsPreviewOpen(true);
                            }}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <div className="mt-4 pt-3 border-t border-green-200">
                        <Button
                          type="button"
                          onClick={() => {
                            if (newTest.subjectId) {
                              fetchQuestionBank(newTest.subjectId);
                            } else if (newTest.courseId) {
                              fetchQuestionBankByCourse(newTest.courseId);
                            }
                            setIsQuestionBankOpen(true);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          disabled={!newTest.courseId && !newTest.subjectId}
                        >
                          <Database className="w-4 h-4 mr-2" />
                          Select Questions from This Paper
                        </Button>
                        <p className="text-xs text-green-600 mt-2 text-center">
                          Click to manually choose which questions to include in your test
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Scheduling Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-800">Test Scheduling</h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Auto-Management Available
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {/* Start Time */}
                  <div>
                    <Label htmlFor="startTime" className="text-blue-700 font-medium">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={newTest.startTime}
                      onChange={(e) => setNewTest({...newTest, startTime: e.target.value})}
                      className="border-blue-200 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-600 mt-1">When test becomes available to students</p>
                  </div>

                  {/* End Time */}
                  <div>
                    <Label htmlFor="endTime" className="text-blue-700 font-medium">
                      End Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={newTest.endTime}
                      onChange={(e) => setNewTest({...newTest, endTime: e.target.value})}
                      className="border-blue-200 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-600 mt-1">When test automatically closes</p>
                  </div>

                  {/* Grace Period */}
                  <div>
                    <Label htmlFor="gracePeriod" className="text-blue-700 font-medium">
                      Grace Period (minutes)
                    </Label>
                    <Input
                      id="gracePeriod"
                      type="number"
                      min="0"
                      max="60"
                      value={newTest.gracePeriod}
                      onChange={(e) => setNewTest({...newTest, gracePeriod: parseInt(e.target.value) || 5})}
                      className="border-blue-200 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-600 mt-1">Extra time for late submissions</p>
                  </div>
                </div>

                {/* Auto-Management Toggles */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                    <div>
                      <Label htmlFor="autoStart" className="text-blue-700 font-medium">Auto-Start</Label>
                      <p className="text-xs text-blue-600">Automatically start test at scheduled time</p>
                    </div>
                    <Switch
                      id="autoStart"
                      checked={newTest.autoStart}
                      onCheckedChange={(checked) => setNewTest({...newTest, autoStart: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                    <div>
                      <Label htmlFor="autoEnd" className="text-blue-700 font-medium">Auto-End</Label>
                      <p className="text-xs text-blue-600">Automatically end test at scheduled time</p>
                    </div>
                    <Switch
                      id="autoEnd"
                      checked={newTest.autoEnd}
                      onCheckedChange={(checked) => setNewTest({...newTest, autoEnd: checked})}
                    />
                  </div>
                </div>

                                 {/* Scheduling Preview */}
                 {newTest.startTime && newTest.endTime && (
                   <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
                     <h4 className="font-medium text-blue-800 mb-2">Scheduling Preview</h4>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-sm">
                       <div>
                         <span className="text-blue-600">Starts:</span> 
                         <span className="ml-1 font-medium">
                           {new Date(newTest.startTime).toLocaleString()}
                         </span>
                       </div>
                       <div>
                         <span className="text-blue-600">Ends:</span>
                         <span className="ml-1 font-medium">
                           {new Date(newTest.endTime).toLocaleString()}
                         </span>
                       </div>
                       <div>
                         <span className="text-blue-600">Duration:</span>
                         <span className="ml-1 font-medium">
                           {(() => {
                             const durationMs = new Date(newTest.endTime).getTime() - new Date(newTest.startTime).getTime();
                             const hours = Math.floor(durationMs / (1000 * 60 * 60));
                             const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                             return `${hours}h ${minutes}m`;
                           })()}
                         </span>
                       </div>
                     </div>
                   </div>
                 )}
              </div>

              {/* Question Input Based on Source */}
             

              {/* Test Configuration Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <Settings className="w-5 h-5 mr-2 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Test Configuration</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shuffleQuestions" className="text-sm font-medium">Shuffle Questions</Label>
                      <Switch
                        id="shuffleQuestions"
                        checked={newTest.settings.shuffleQuestions}
                        onCheckedChange={(checked) => setNewTest({
                          ...newTest,
                          settings: {...newTest.settings, shuffleQuestions: checked}
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {/* <Label htmlFor="shuffleOptions" className="text-sm font-medium">Shuffle Answer Options</Label>
                      <Switch
                        id="shuffleOptions"
                        checked={newTest.settings.shuffleOptions}
                        onCheckedChange={(checked) => setNewTest({
                          ...newTest,
                          settings: {...newTest.settings, shuffleOptions: checked}
                        })}
                      /> */}
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="allowPreviousNavigation" className="text-sm font-medium">Allow Previous Navigation</Label>
                      <Switch
                        id="allowPreviousNavigation"
                        checked={newTest.settings.allowPreviousNavigation}
                        onCheckedChange={(checked) => setNewTest({
                          ...newTest,
                          settings: {...newTest.settings, allowPreviousNavigation: checked}
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showImmediateResult" className="text-sm font-medium">Show Immediate Result</Label>
                      <Switch
                        id="showImmediateResult"
                        checked={newTest.settings.showImmediateResult}
                        onCheckedChange={(checked) => setNewTest({
                          ...newTest,
                          settings: {...newTest.settings, showImmediateResult: checked}
                        })}
                      />
                    </div>
                    
                    
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="negativeMarks" className="text-sm font-medium">Negative Marking</Label>
                      <Switch
                        id="negativeMarks"
                        checked={newTest.settings.negativeMarks}
                        onCheckedChange={(checked) => setNewTest({
                          ...newTest,
                          settings: {...newTest.settings, negativeMarks: checked}
                        })}
                      />
                    </div>
                    
                    {newTest.settings.negativeMarks && (
                      <div>
                        <Label htmlFor="negativeMarkValue" className="text-sm font-medium">Negative Mark Value</Label>
                        <Input
                          id="negativeMarkValue"
                          type="number"
                          step="0.1"
                          value={newTest.settings.negativeMarkValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d*$/.test(value)) {
                              setNewTest({
                                ...newTest,
                                settings: {...newTest.settings, negativeMarkValue: value}
                              });
                            }
                          }}
                          className="mt-1"
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="passPercentage" className="text-sm font-medium">Pass Percentage</Label>
                      <Input
                        id="passPercentage"
                        type="number"
                        value={newTest.settings.passPercentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            setNewTest({
                              ...newTest,
                              settings: {...newTest.settings, passPercentage: value}
                            });
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showCorrectAnswers" className="text-sm font-medium">Show Correct Answers After Test</Label>
                      <Switch
                        id="showCorrectAnswers"
                        checked={newTest.settings.showCorrectAnswers}
                        onCheckedChange={(checked) => setNewTest({
                          ...newTest,
                          settings: {...newTest.settings, showCorrectAnswers: checked}
                        })}
                      />
                    </div>
                    
                    
                    
                    <div>
                      <Label htmlFor="resultReleaseTime" className="text-sm font-medium">Result Release Time</Label>
                      <Input
                        id="resultReleaseTime"
                        type="datetime-local"
                        value={newTest.settings.resultReleaseTime || ''}
                        onChange={(e) => setNewTest({
                          ...newTest,
                          settings: {...newTest.settings, resultReleaseTime: e.target.value || null}
                        })}
                        className="mt-1"
                        placeholder="Leave empty for immediate results"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Students can see results and correct answers after this time. 
                        {newTest.settings.resultReleaseTime && (
                          <span className="block mt-1">
                            <strong>Status:</strong> {
                              new Date(newTest.settings.resultReleaseTime) <= new Date() 
                                ? '✅ Results will be published immediately' 
                                : `⏰ Results will be published on ${new Date(newTest.settings.resultReleaseTime).toLocaleString()}`
                            }
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!newTest.isCommon && (
                <div>
                  <Label className="text-indigo-700 font-medium">Target Batches</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                    {batches.map((batch) => (
                      <div key={batch.batch_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`test-batch-${batch.batch_id}`}
                          checked={newTest.batchIds.includes(batch.batch_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewTest({
                                ...newTest, 
                                batchIds: [...newTest.batchIds, batch.batch_id]
                              });
                            } else {
                              setNewTest({
                                ...newTest, 
                                batchIds: newTest.batchIds.filter(id => id !== batch.batch_id)
                              });
                            }
                          }}
                          className="border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={`test-batch-${batch.batch_id}`} className="text-sm text-gray-700">
                          {batch.batch_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="testDescription" className="text-indigo-700 font-medium">Description</Label>
                <Textarea
                  id="testDescription"
                  value={newTest.description}
                  onChange={(e) => setNewTest({...newTest, description: e.target.value})}
                  placeholder="Describe the test objectives and instructions..."
                  rows={3}
                  className="border-indigo-200 focus:border-indigo-500"
                />
              </div>

              {/* Configuration Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Configuration Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Test Info:</span>
                    <div className="text-gray-600 mt-1">
                      <div>• {newTest.questions || 0} questions</div>
                      <div>• {newTest.duration || 0} minutes duration</div>
                      <div>• {newTest.maxMarks || 0} total marks</div>
                      <div>• {newTest.type}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Scheduling:</span>
                    <div className="text-gray-600 mt-1">
                      {newTest.startTime && newTest.endTime ? (
                        <>
                          <div>• Starts: {new Date(newTest.startTime).toLocaleString()}</div>
                          <div>• Ends: {new Date(newTest.endTime).toLocaleString()}</div>
                          <div>• Auto-start: {newTest.autoStart ? '✅' : '❌'}</div>
                          <div>• Auto-end: {newTest.autoEnd ? '✅' : '❌'}</div>
                        </>
                      ) : (
                        <div>• No scheduling configured</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Results:</span>
                    <div className="text-gray-600 mt-1">
                      {newTest.settings?.resultReleaseTime ? (
                        <>
                          <div>• Release: {new Date(newTest.settings.resultReleaseTime).toLocaleString()}</div>
                          <div>• Status: {new Date(newTest.settings.resultReleaseTime) <= new Date() ? '✅ Immediate' : '⏰ Scheduled'}</div>
                        </>
                      ) : (
                        <div>• Results will be immediate</div>
                      )}
                      <div>• Pass %: {newTest.settings?.passPercentage || 40}%</div>
                      <div>• Negative marks: {newTest.settings?.negativeMarks ? '✅' : '❌'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleCreateTest} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editMode ? 'Updating Test...' : 'Creating Test...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {editMode ? 'Update Test' : 'Create Test'}
                    </>
                  )}
                </Button>
                {editMode && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditMode(null);
                      setNewTest({
                        title: '',
                        type: 'Mock Test',
                        courseId: undefined,
                        subjectId: undefined,
                        batchIds: [],
                        questions: 0,
                        duration: 0,
                        maxMarks: 0,
                        marksPerQuestion: 4,
                        description: '',
                        isCommon: false,
                        questionSource: 'questionBank',
                        selectedQuestions: [],
                        manualQuestions: '',
                        settings: {
                          shuffleQuestions: true,
                          shuffleOptions: true,
                          showImmediateResult: false,
                          negativeMarks: true,
                          negativeMarkValue: 0.25,
                          timeLimit: true,
                          allowRevisit: true,
                          showCorrectAnswers: true,
                          allowPreviousNavigation: true,
                          resultReleaseTime: null,
                          passPercentage: 40
                        }
                      });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Filters */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search tests..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={filters.course} onValueChange={(value) => setFilters({...filters, course: value})}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      <SelectItem value="0">Common Tests</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.course_id} value={course.course_id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   <Select value={filters.subject} onValueChange={(value) => setFilters({...filters, subject: value})}>
                     <SelectTrigger className="w-[140px]">
                       <SelectValue placeholder="Subject" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">All Subjects</SelectItem>
                       {subjects.map((subject) => (
                         <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                           {subject.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                  <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Mock Test">Mock Test</SelectItem>
                      <SelectItem value="Daily Test">Daily Test</SelectItem>
                      <SelectItem value="Weekly Test">Weekly Test</SelectItem>
                      <SelectItem value="Monthly Test">Monthly Test</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                       <SelectItem value="DRAFT">📝 DRAFT</SelectItem>
                       <SelectItem value="NOT_STARTED">⏰ NOT_STARTED</SelectItem>
                       <SelectItem value="IN_PROGRESS">▶️ IN_PROGRESS</SelectItem>
                                               <SelectItem value="COMPLETED">✅ COMPLETED</SelectItem>
                        <SelectItem value="ARCHIVED">📦 ARCHIVED</SelectItem>
                    </SelectContent>
                  </Select>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setFilters({
                       search: '',
                       course: 'all',
                       subject: 'all',
                       type: 'all',
                       status: 'all'
                     })}
                     className="px-3"
                   >
                     Clear Filters
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading tests...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Table View */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduling
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTests.map((test) => (
                      <tr 
                        key={test.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedTest(test)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                  {test.title}
                                </h3>
                        {test.isCommon && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    Common
                          </Badge>
                        )}
                      </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                        <Badge className={getTypeColor(test.type)}>{test.type}</Badge>
                                <Badge variant="outline" className="text-xs">{test.course}</Badge>
                                {!test.isCommon && <Badge variant="outline" className="text-xs">{test.subject}</Badge>}
                              </div>
                              {!test.isCommon && test.batches.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {test.batches.slice(0, 2).map((batch, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                      {batch}
                                    </Badge>
                                  ))}
                                  {test.batches.length > 2 && (
                                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                                      +{test.batches.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                        <Badge className={getStatusColor(test.status)}>
                          {getStatusIcon(test.status)}
                          <span className="ml-1">{getStatusLabel(test.status)}</span>
                        </Badge>
                        {test.settings?.resultReleaseTime && (
                          <Badge 
                            variant="outline" 
                            className={
                              new Date(test.settings.resultReleaseTime) <= new Date() 
                                    ? "border-green-300 text-green-700 bg-green-50 text-xs" 
                                    : "border-orange-300 text-orange-700 bg-orange-50 text-xs"
                            }
                          >
                            {new Date(test.settings.resultReleaseTime) <= new Date() ? '✅ Results Published' : '⏰ Results Scheduled'}
                          </Badge>
                        )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1 text-xs">
                            {isTestScheduled(test) ? (
                              <>
                                <div className="text-gray-600">
                                  <span className="font-medium">Start:</span> {new Date(test.startTime!).toLocaleString()}
                      </div>
                                <div className="text-gray-600">
                                  <span className="font-medium">End:</span> {new Date(test.endTime!).toLocaleString()}
                        </div>
                                <div className="flex gap-1">
                                  {test.autoStart && <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Auto-start</Badge>}
                                  {test.autoEnd && <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Auto-end</Badge>}
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-500">No scheduling</div>
                      )}
                    </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="font-semibold text-blue-600">{test.questions}</div>
                              <div className="text-blue-500">Questions</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-semibold text-green-600">{test.duration}m</div>
                              <div className="text-green-500">Duration</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <div className="font-semibold text-purple-600">{test.maxMarks}</div>
                              <div className="text-purple-500">Marks</div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 rounded">
                              <div className="font-semibold text-orange-600">{test.attempts}</div>
                              <div className="text-orange-500">Attempts</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col space-y-1">
                            {/* Status Management Buttons */}
                            <div className="flex space-x-1">
                        {canStartTest(test) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="default"
                                size="sm"
                                      className="text-xs px-2 py-1 h-7 bg-green-600 hover:bg-green-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startTest(test.id);
                                }}
                              >
                                      ▶️
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                    Start test
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {canCompleteTest(test) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline"
                                size="sm"
                                      className="text-xs px-2 py-1 h-7 border-purple-300 text-purple-700 hover:bg-purple-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  completeTest(test.id);
                                }}
                              >
                                      ✅
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                    Complete test
                            </TooltipContent>
                          </Tooltip>
                        )}

                              {test.settings?.resultReleaseTime && new Date(test.settings.resultReleaseTime) > new Date() && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost"
                                size="sm"
                                      className="text-xs px-2 py-1 h-7 bg-green-50 text-green-700 hover:bg-green-100"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await publishTestResults(test.id);
                                        } catch (error: any) {
                                          // Error handling is done in the hook
                                        }
                                      }}
                                    >
                                      🚀
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Publish results now
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>

                            {/* Manual Status Change Buttons */}
                            <div className="flex space-x-1">
                              {/* Show all available status change options based on current status */}
                              {test.status === 'DRAFT' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      className="text-xs px-2 py-1 h-7 border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  publishTest(test.id);
                                }}
                              >
                                      📤
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                    Publish test
                            </TooltipContent>
                          </Tooltip>
                        )}

                              {test.status === 'NOT_STARTED' && (
                                <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                        variant="outline"
                                size="sm"
                                        className="text-xs px-2 py-1 h-7 border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                          publishTest(test.id);
                                }}
                              >
                                        📤
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                      Publish test
                            </TooltipContent>
                          </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-2 py-1 h-7 border-orange-300 text-orange-700 hover:bg-orange-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          archiveTest(test.id);
                                        }}
                                      >
                                        📦
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Archive test
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}

                              {test.status === 'IN_PROGRESS' && (
                                <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                        variant="outline"
                                size="sm"
                                        className="text-xs px-2 py-1 h-7 border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  archiveTest(test.id);
                                }}
                              >
                                        📦
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                      Archive test
                            </TooltipContent>
                          </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-2 py-1 h-7 border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          draftTest(test.id);
                                        }}
                                      >
                                        📝
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Move to draft
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}

                              {test.status === 'COMPLETED' && (
                                <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                        variant="outline"
                                size="sm"
                                        className="text-xs px-2 py-1 h-7 border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                          archiveTest(test.id);
                                        }}
                                      >
                                        📦
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                      Archive test
                            </TooltipContent>
                          </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-2 py-1 h-7 border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          draftTest(test.id);
                                        }}
                                      >
                                        📝
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Move to draft
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}

                              {test.status === 'ARCHIVED' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                      variant="outline"
                                size="sm"
                                      className="text-xs px-2 py-1 h-7 border-gray-300 text-gray-700 hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                        draftTest(test.id);
                                      }}
                                    >
                                      📝
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                    Move to draft
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="px-2 py-1 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewQuestions(test.id);
                              }}
                            >
                              <BookOpen className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            View questions
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="px-2 py-1 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTest(test);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Edit test
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="px-2 py-1 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                      handleCloneTest(test);
                              }}
                            >
                                    <Copy className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                                  Clone test
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="px-2 py-1 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                      handleDeleteTest(test.id);
                              }}
                            >
                                    <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                                  Delete test
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  </div>
                  
              {filteredTests.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No tests found</p>
                    <p className="text-sm">Try adjusting your filters or create a new test</p>
                      </div>
                      </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && filteredTests.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t px-4 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {endIndex} of {totalTests} tests
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="itemsPerPage" className="text-sm text-gray-600">Items per page:</Label>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {/* Show page 1 with ellipsis when on last pages */}
                      {totalPages > 5 && currentPage >= totalPages - 2 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className={currentPage === 1 
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                              : ""}
                          >
                            1
                          </Button>
                          <span className="text-gray-600">...</span>
                        </>
                      )}
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum 
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                              : ""}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {/* Show ellipsis and last page when on first pages */}
                      {totalPages > 5 && currentPage <= 3 && (
                        <>
                          <span className="text-gray-600">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className={currentPage === totalPages 
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                              : ""}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
                </CardContent>
              </Card>
        </TabsContent>
      </Tabs>

      {/* Question Bank Modal */}
      <Dialog 
        open={isQuestionBankOpen} 
        onOpenChange={(open) => {
          setIsQuestionBankOpen(open);
          if (open) {
            if (newTest.subjectId) {
              fetchQuestionBank(newTest.subjectId);
            } else if (newTest.courseId) {
              fetchQuestionBankByCourse(newTest.courseId);
            }
          }
        }}
      >
        <DialogContent className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl h-[80vh] max-h-[90vh] p-2 sm:p-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Question Bank - {subjects.find(s => s.subject_id === newTest.subjectId)?.name || 'All Subjects'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[calc(90vh-4rem)] overflow-y-auto">
            {/* Search and Filter UI */}
            <div className="flex flex-col md:flex-row md:items-end gap-2 mb-2">
              <Input
                placeholder="Search questions..."
                value={questionBankSearch}
                onChange={e => setQuestionBankSearch(e.target.value)}
                className="md:w-1/2"
              />
              <Select value={questionBankDifficulty} onValueChange={setQuestionBankDifficulty}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulty</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={questionBankType} onValueChange={setQuestionBankType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MCQ">MCQ</SelectItem>
                  <SelectItem value="FILL_IN_THE_BLANK">Fill in Blanks</SelectItem>
                  <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                  <SelectItem value="MATCH">Match</SelectItem>
                </SelectContent>
              </Select>
              <Select value={questionBankPaperCode} onValueChange={setQuestionBankPaperCode}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Paper Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Codes</SelectItem>
                  {Array.from(new Set(questionBank.map(q => q.question_paper_code).filter(Boolean))).map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={questionBankTopic} onValueChange={setQuestionBankTopic}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {Array.from(new Set(questionBank.map(q => q.topic).filter(Boolean))).map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {newTest.selectedQuestions?.length || 0} questions selected
                </span>
                <span className="text-sm text-blue-600">
                  Showing {filteredQuestionBank.length} of {questionBank.length} questions
                </span>
                {/* Active Filters Display */}
                {(questionBankSearch || questionBankDifficulty !== 'all' || questionBankType !== 'all' || questionBankPaperCode !== 'all' || questionBankTopic !== 'all') && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Active filters:</span>
                    {questionBankSearch && (
                      <Badge variant="outline" className="text-xs">
                        Search: "{questionBankSearch}"
                      </Badge>
                    )}
                    {questionBankDifficulty !== 'all' && (
                      <Badge variant="outline" className="text-xs">
                        Difficulty: {questionBankDifficulty}
                      </Badge>
                    )}
                    {questionBankType !== 'all' && (
                      <Badge variant="outline" className="text-xs">
                        Type: {questionBankType}
                      </Badge>
                    )}
                    {questionBankPaperCode !== 'all' && (
                      <Badge variant="outline" className="text-xs">
                        Code: {questionBankPaperCode}
                      </Badge>
                    )}
                    {questionBankTopic !== 'all' && (
                      <Badge variant="outline" className="text-xs">
                        Topic: {questionBankTopic}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewTest({
                      ...newTest,
                      selectedQuestions: filteredQuestionBank.map(q => q.question_id)
                    });
                  }}
                >
                  Select All Filtered
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewTest({
                      ...newTest,
                      selectedQuestions: []
                    });
                  }}
                >
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuestionBankSearch('');
                    setQuestionBankDifficulty('all');
                    setQuestionBankType('all');
                    setQuestionBankPaperCode('all');
                    setQuestionBankTopic('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
            {selectedQPQuestions.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800 font-medium">
                    Showing questions from selected question paper ({selectedQPQuestions.length} questions available)
                  </span>
                </div>
              </div>
            )}
            <ScrollArea className="h-[60vh] max-h-[60vh] w-full">
              <div className="space-y-3">
                {filteredQuestionBank.map((question) => {
                    const questionTextRaw = question.question_text || '';
                    const [questionText, questionImage] = questionTextRaw.includes('_!_!_') 
                      ? questionTextRaw.split('_!_!_') 
                      : [questionTextRaw, ''];
                    return (
                      <div key={question.question_id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Checkbox
                              checked={newTest.selectedQuestions?.includes(question.question_id) || false}
                              onCheckedChange={(checked) => {
                                const selectedQuestions = newTest.selectedQuestions || [];
                                if (checked) {
                                  setNewTest({
                                    ...newTest,
                                    selectedQuestions: [...selectedQuestions, question.question_id]
                                  });
                                } else {
                                  setNewTest({
                                    ...newTest,
                                    selectedQuestions: selectedQuestions.filter(id => id !== question.question_id)
                                  });
                                }
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-2">
                                {questionText}
                              </p>
                              {questionImage && (
                                <div className="mb-3">
                                  <img
                                    src={questionImage}
                                    alt="Question preview"
                                    className="max-w-[200px] max-h-[200px] object-contain rounded-lg border border-emerald-200"
                                  />
                                </div>
                              )}
                              {question.options && (
                                <div className="space-y-1">
                                  {Object.entries(question.options).map(([key, value]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500 w-4">{key}.</span>
                                      <span className="text-xs text-gray-700">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline" className="text-xs">{question.difficulty}</Badge>
                                {question.type && <Badge variant="outline" className="text-xs">{question.type}</Badge>}
                                {question.topic && <Badge variant="outline" className="text-xs">{question.topic}</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setQuestionPreview(question);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
          </DialogHeader>
          {questionPreview && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Question</Label>
                <p className="text-gray-900 mt-1">{questionPreview.question_text ? (questionPreview.question_text.includes('_!_!_') ? questionPreview.question_text.split('_!_!_')[0] : questionPreview.question_text) : 'No question text'}</p>
                {questionPreview.question_text && questionPreview.question_text.includes('_!_!_') && questionPreview.question_text.split('_!_!_')[1] && (
                  <div className="mb-3">
                    <img
                      src={questionPreview.question_text.split('_!_!_')[1]}
                      alt="Question preview"
                      className="max-w-[200px] max-h-[200px] object-contain rounded-lg border border-emerald-200"
                    />
                  </div>
                )}
              </div>
              
              {questionPreview.options && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Options</Label>
                  <div className="space-y-2 mt-1">
                    {Object.entries(questionPreview.options || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 p-2 border rounded">
                        <span className="text-sm font-medium text-gray-500 w-6">{key}.</span>
                        <span className="text-sm text-gray-700">{value}</span>
                        {key === questionPreview.correct_answer && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Difficulty</Label>
                  <Badge variant="outline" className="mt-1">{questionPreview.difficulty}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Type</Label>
                  <Badge variant="outline" className="mt-1">{questionPreview.type || 'MCQ'}</Badge>
                </div>
              </div>
              
              {questionPreview.explanation && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Explanation</Label>
                  <p className="text-sm text-gray-600 mt-1">{questionPreview.explanation}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detailed Test View Modal */}
      <Dialog open={!!selectedTest} onOpenChange={(open) => !open && setSelectedTest(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Test Details: {selectedTest?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Test Title</Label>
                    <p className="text-gray-900 mt-1">{selectedTest.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Test Type</Label>
                    <Badge className={getTypeColor(selectedTest.type)}>{selectedTest.type}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Status</Label>
                    <Badge className={getStatusColor(selectedTest.status)}>
                      {getStatusIcon(selectedTest.status)} {getStatusLabel(selectedTest.status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Course</Label>
                    <p className="text-gray-900 mt-1">{selectedTest.course || 'Common Test'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Subject</Label>
                    <p className="text-gray-900 mt-1">{selectedTest.subject || 'All Subjects'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Description</Label>
                    <p className="text-gray-900 mt-1">{selectedTest.description || 'No description provided'}</p>
                  </div>
                </div>
              </div>

              {/* Test Statistics */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Test Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{selectedTest.questions}</div>
                    <div className="text-sm text-blue-600">Questions</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{selectedTest.duration}m</div>
                    <div className="text-sm text-green-600">Duration</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{selectedTest.maxMarks}</div>
                    <div className="text-sm text-purple-600">Max Marks</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Users className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">{selectedTest.attempts}</div>
                    <div className="text-sm text-orange-600">Attempts</div>
                  </div>
                </div>
              </div>

              {/* Scheduling Information */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Scheduling Information
                </h3>
                {isTestScheduled(selectedTest) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-purple-700">Start Time</Label>
                      <p className="text-gray-900 mt-1">{new Date(selectedTest.startTime).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-purple-700">End Time</Label>
                      <p className="text-gray-900 mt-1">{new Date(selectedTest.endTime).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-purple-700">Auto-Start</Label>
                      <Badge variant="outline" className={selectedTest.autoStart ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}>
                        {selectedTest.autoStart ? '✅ Enabled' : '❌ Disabled'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-purple-700">Auto-End</Label>
                      <Badge variant="outline" className={selectedTest.autoEnd ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}>
                        {selectedTest.autoEnd ? '✅ Enabled' : '❌ Disabled'}
                      </Badge>
                    </div>
                    {selectedTest.gracePeriod && (
                      <div>
                        <Label className="text-sm font-medium text-purple-700">Grace Period</Label>
                        <p className="text-gray-900 mt-1">{selectedTest.gracePeriod} minutes</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">No scheduling configured for this test.</p>
                )}
              </div>

              {/* Test Configuration */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Test Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-700">Question Settings</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Shuffle Questions</span>
                        <Badge variant="outline" className={selectedTest.settings?.shuffleQuestions ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}>
                          {selectedTest.settings?.shuffleQuestions ? '✅ Enabled' : '❌ Disabled'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Shuffle Answer Options</span>
                        <Badge variant="outline" className={selectedTest.settings?.shuffleOptions ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}>
                          {selectedTest.settings?.shuffleOptions ? '✅ Enabled' : '❌ Disabled'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Allow Question Revisit</span>
                        <Badge variant="outline" className={selectedTest.settings?.allowRevisit ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}>
                          {selectedTest.settings?.allowRevisit ? '✅ Enabled' : '❌ Disabled'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Allow Previous Navigation</span>
                        <Badge variant="outline" className={selectedTest.settings?.allowPreviousNavigation ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}>
                          {selectedTest.settings?.allowPreviousNavigation ? '✅ Enabled' : '❌ Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-700">Scoring & Results</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pass Percentage</span>
                        <span className="text-sm font-medium">{selectedTest.settings?.passPercentage || 40}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Negative Marking</span>
                        <Badge variant="outline" className={selectedTest.settings?.negativeMarks ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}>
                          {selectedTest.settings?.negativeMarks ? '✅ Enabled' : '❌ Disabled'}
                        </Badge>
                      </div>
                      {selectedTest.settings?.negativeMarks && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Negative Mark Value</span>
                          <span className="text-sm font-medium">{selectedTest.settings?.negativeMarkValue || 0.25}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Show Immediate Result</span>
                        <Badge variant="outline" className={selectedTest.settings?.showImmediateResult ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}>
                          {selectedTest.settings?.showImmediateResult ? '✅ Enabled' : '❌ Disabled'}
                        </Badge>  
                      
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Show Correct Answers After Test</span>
                        <Badge variant="outline" className={selectedTest.settings?.showCorrectAnswers ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}>
                          {selectedTest.settings?.showCorrectAnswers ? '✅ Enabled' : '❌ Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Release Information */}
              {selectedTest.settings?.resultReleaseTime && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Result Release Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-orange-700">Result Release Time</Label>
                      <p className="text-gray-900 mt-1">{new Date(selectedTest.settings.resultReleaseTime).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-orange-700">Status</Label>
                      <Badge variant="outline" className={
                        new Date(selectedTest.settings.resultReleaseTime) <= new Date() 
                          ? "border-green-300 text-green-700 bg-green-50" 
                          : "border-orange-300 text-orange-700 bg-orange-50"
                      }>
                        {new Date(selectedTest.settings.resultReleaseTime) <= new Date() ? '✅ Results Published' : '⏰ Results Scheduled'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Batches */}
              {!selectedTest.isCommon && selectedTest.batches && selectedTest.batches.length > 0 && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-indigo-800 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Target Batches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTest.batches.map((batch: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
                        {batch}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Status Change Buttons */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Manual Status Management
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTest.status === 'DRAFT' && (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        publishTest(selectedTest.id);
                        setSelectedTest(null);
                      }}
                    >
                      📤 Publish Test
                    </Button>
                  )}

                  {selectedTest.status === 'NOT_STARTED' && (
                    <>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          publishTest(selectedTest.id);
                          setSelectedTest(null);
                        }}
                      >
                        📤 Publish Test
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          archiveTest(selectedTest.id);
                          setSelectedTest(null);
                        }}
                      >
                        📦 Archive Test
                      </Button>
                    </>
                  )}

                  {selectedTest.status === 'IN_PROGRESS' && (
                    <>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          archiveTest(selectedTest.id);
                          setSelectedTest(null);
                        }}
                      >
                        📦 Archive Test
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          draftTest(selectedTest.id);
                          setSelectedTest(null);
                        }}
                      >
                        📝 Move to Draft
                      </Button>
                    </>
                  )}

                  {selectedTest.status === 'COMPLETED' && (
                    <>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          archiveTest(selectedTest.id);
                          setSelectedTest(null);
                        }}
                      >
                        📦 Archive Test
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          draftTest(selectedTest.id);
                          setSelectedTest(null);
                        }}
                      >
                        📝 Move to Draft
                      </Button>
                    </>
                  )}

                  {selectedTest.status === 'ARCHIVED' && (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        draftTest(selectedTest.id);
                        setSelectedTest(null);
                      }}
                    >
                      📝 Move to Draft
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    handleEditTest(selectedTest);
                    setSelectedTest(null);
                  }}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Test
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleCloneTest(selectedTest);
                    setSelectedTest(null);
                  }}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Clone Test
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleViewQuestions(selectedTest.id);
                  }}
                  className="flex-1"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Questions
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedTest(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Questions Modal */}
      <Dialog open={isQuestionsModalOpen} onOpenChange={setIsQuestionsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Test Questions: {selectedTest?.title}
            </DialogTitle>
          </DialogHeader>
          
          {questionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Export Options */}
              {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  Export Options
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportQuestions(selectedTest?.id, false, 'csv')}
                    disabled={questionsLoading}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Export CSV (No Answers)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportQuestions(selectedTest?.id, true, 'csv')}
                    disabled={questionsLoading}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Export CSV (With Answers)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportQuestions(selectedTest?.id, false, 'detailed-pdf')}
                    disabled={questionsLoading}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Export Detailed PDF (No Answers)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportQuestions(selectedTest?.id, true, 'detailed-pdf')}
                    disabled={questionsLoading}
                    className="border-pink-300 text-pink-700 hover:bg-pink-50"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Export Detailed PDF (With Answers)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportQuestions(selectedTest?.id, false, 'question-paper')}
                    disabled={questionsLoading}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export Question Paper (No Answers)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportQuestions(selectedTest?.id, true, 'question-paper')}
                    disabled={questionsLoading}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export Question Paper (With Answers)
                  </Button>
                </div>
              </div> */}

              {/* Questions List - Question Paper Format */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-800 flex items-center mb-2">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Question Paper Format ({testQuestions.length} questions)
                  </h3>
                  <p className="text-sm text-gray-600">Questions displayed in traditional question paper format</p>
                </div>
                
                {testQuestions.map((question, index) => (
                  <div key={question.questionId} className="border-l-4 border-blue-500 bg-white p-6 rounded-r-lg shadow-sm">
                    {/* Question Header */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-blue-600">Q{question.questionNumber}.</span>
                        <span className="text-sm font-medium text-gray-600">({question.marks} marks)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                          {question.type}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                          {question.difficulty}
                        </Badge>
                        {question.topic && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                            {question.topic}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Question Text */}
                    <div className="mb-4">
                      <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">{question.questionText}</p>
                    </div>
                    
                    {/* Options */}
                    {question.options && Object.keys(question.options).length > 0 && (
                      <div className="mb-4">
                        <div className="space-y-2">
                          {Object.entries(question.options).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                              <span className="font-bold text-gray-600 w-6 text-center">{key}.</span>
                              <span className="text-gray-700 flex-1">{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Answer and Explanation (if available) */}
                    {(question.correctAnswer || question.explanation) && (
                      <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 p-4 rounded">
                        {question.correctAnswer && (
                          <div className="mb-3">
                            <h4 className="font-medium text-green-700 mb-2 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Correct Answer:
                            </h4>
                            <p className="text-green-600 font-medium bg-green-50 p-2 rounded">{question.correctAnswer}</p>
                          </div>
                        )}
                        
                        {question.explanation && (
                          <div>
                            <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                              <Info className="w-4 h-4 mr-2" />
                              Explanation:
                            </h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-blue-50 p-2 rounded text-sm">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {testQuestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No questions found</p>
                    <p className="text-sm">This test doesn't have any questions assigned yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestManagement;

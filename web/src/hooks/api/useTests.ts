import { useState, useEffect } from 'react';
import { testService, Test, CreateTestData, TestFilters, Course, Subject, Batch, QuestionBankItem } from '@/services/tests/testService';
import { useToast } from '@/hooks/use-toast';

export const useTests = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch tests
  const fetchTests = async (filters: TestFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await testService.getTests(filters);
      setTests(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tests');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch tests',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await testService.getCourses();
      setCourses(response.data || []);
    } catch (err: any) {
      // Failed to fetch courses
    }
  };

  // Fetch subjects by course
  const fetchSubjectsByCourse = async (courseId: number) => {
    try {
      const response = await testService.getSubjectsByCourse(courseId);
      setSubjects(response.data || []);
    } catch (err: any) {
      setSubjects([]);
    }
  };

  // Fetch batches by course
  const fetchBatchesByCourse = async (courseId: number) => {
    try {
      const response = await testService.getBatchesByCourse(courseId);
      setBatches(response.data || []);
    } catch (err: any) {
      setBatches([]);
    }
  };

  // Fetch question bank by subject
  const fetchQuestionBank = async (subjectId: number) => {
    try {
      const response = await testService.getQuestionBank(subjectId);
      setQuestionBank(response.data || []);
    } catch (err: any) {
      setQuestionBank([]);
    }
  };

  // Fetch question bank by course
  const fetchQuestionBankByCourse = async (courseId: number) => {
    try {
      const response = await testService.getQuestionBankByCourse(courseId);
      setQuestionBank(response.data || []);
    } catch (err: any) {
      setQuestionBank([]);
    }
  };

  // Fetch question bank by QP Code
  const fetchQuestionBankByQPCode = async (qpCodeId: number) => {
    try {
      const response = await testService.getQuestionBankByQPCode(qpCodeId);
      setQuestionBank(response.data || []);
    } catch (err: any) {
      setQuestionBank([]);
    }
  };

  // Create test
  const createTest = async (testData: CreateTestData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await testService.createTest(testData);
      
      toast({
        title: "Success",
        description: "Test created successfully",
      });

      // Refresh tests list
      await fetchTests();
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to create test');
      toast({
        title: "Error",
        description: err.message || 'Failed to create test',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update test
  const updateTest = async (id: number, testData: Partial<CreateTestData>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await testService.updateTest(id, testData);
      
      toast({
        title: "Success",
        description: "Test updated successfully",
      });

      // Force refresh tests list with current filters
      await fetchTests();
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to update test');
      toast({
        title: "Error",
        description: err.message || 'Failed to update test',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete test
  const deleteTest = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await testService.deleteTest(id);
      
      toast({
        title: "Success",
        description: "Test deleted successfully",
      });

      // Refresh tests list
      await fetchTests();
    } catch (err: any) {
      setError(err.message || 'Failed to delete test');
      toast({
        title: "Error",
        description: err.message || 'Failed to delete test',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle test status (legacy)
  const toggleTestStatus = async (id: number, status: 'Active' | 'Draft' | 'Published' | 'Archived') => {
    try {
      setLoading(true);
      setError(null);
      await testService.toggleTestStatus(id, status);
      
      toast({
        title: "Success",
        description: `Test ${status.toLowerCase()} successfully`,
      });

      // Refresh tests list
      await fetchTests();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle test status');
      toast({
        title: "Error",
        description: err.message || 'Failed to toggle test status',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Publish test with validation
  const publishTest = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Find the test to validate
      const test = tests.find(t => t.id === id);
      if (!test) {
        throw new Error('Test not found');
      }
      
      // Client-side validation before publishing
      if (test.questions === 0) {
        throw new Error('Cannot publish test: Test must have at least one question');
      }
      
      if (!test.title?.trim()) {
        throw new Error('Cannot publish test: Test must have a title');
      }
      
      if (!test.duration || test.duration <= 0) {
        throw new Error('Cannot publish test: Test must have a valid duration');
      }
      
      if (!test.maxMarks || test.maxMarks <= 0) {
        throw new Error('Cannot publish test: Test must have valid maximum marks');
      }
      
      await testService.publishTest(id);
      
      // Refresh tests list
      await fetchTests();
      
      toast({
        title: "Success",
        description: "Test published successfully",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to publish test');
      toast({
        title: "Error",
        description: err.message || 'Failed to publish test',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Archive test
  const archiveTest = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await testService.archiveTest(id);
      
      // Refresh tests list
      await fetchTests();
      
      toast({
        title: "Success",
        description: "Test archived successfully",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to archive test');
      toast({
        title: "Error",
        description: err.message || 'Failed to archive test',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Move test to draft
  const draftTest = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await testService.draftTest(id);
      
      // Refresh tests list
      await fetchTests();
      
      toast({
        title: "Success",
        description: "Test moved to draft successfully",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to move test to draft');
      toast({
        title: "Error",
        description: err.message || 'Failed to move test to draft',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Start test (manual transition to IN_PROGRESS)
  const startTest = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await testService.startTest(id);
      
      // Refresh tests list
      await fetchTests();
      
      toast({
        title: "Success",
        description: "Test started successfully",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start test');
      toast({
        title: "Error",
        description: err.message || 'Failed to start test',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete test (manual transition to COMPLETED)
  const completeTest = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await testService.completeTest(id);
      
      // Refresh tests list
      await fetchTests();
      
      toast({
        title: "Success",
        description: "Test completed successfully",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete test');
      toast({
        title: "Error",
        description: err.message || 'Failed to complete test',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Publish test results
  const publishTestResults = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await testService.publishTestResults(id);
      
      // Refresh tests list
      await fetchTests();
      
      toast({
        title: "Success",
        description: "Test results published successfully",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to publish test results');
      toast({
        title: "Error",
        description: err.message || 'Failed to publish test results',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add questions to test
  const addQuestionsToTest = async (testId: number, questionIds: number[]) => {
    try {
      setLoading(true);
      setError(null);
      await testService.addQuestionsToTest(testId, questionIds);
      
      toast({
        title: "Success",
        description: "Questions added to test successfully",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add questions to test');
      toast({
        title: "Error",
        description: err.message || 'Failed to add questions to test',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get test questions with export options
  const getTestQuestions = async (testId: number, options?: { includeAnswers?: boolean; format?: 'json' | 'csv' | 'pdf' }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await testService.getTestQuestions(testId, options);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch test questions');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch test questions',
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchTests({ limit: 10000, page: 1 }); // Fetch all tests for client-side pagination
    fetchCourses();
  }, []);

  return {
    tests,
    courses,
    subjects,
    batches,
    questionBank,
    loading,
    error,
    fetchTests,
    fetchCourses,
    fetchSubjectsByCourse,
    fetchBatchesByCourse,
    fetchQuestionBank,
    fetchQuestionBankByCourse,
    fetchQuestionBankByQPCode,
    createTest,
    updateTest,
    deleteTest,
    toggleTestStatus,
    publishTest,
    archiveTest,
    draftTest,
    startTest,        // New status management
    completeTest,     // New status management
    publishTestResults, // Publish test results
    addQuestionsToTest,
    getTestQuestions,
  };
};

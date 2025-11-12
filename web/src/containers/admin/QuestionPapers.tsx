import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, FileText, X, Upload, Eye, PlusCircle, MinusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import CsvImport from '@/components/CsvImport';
import PaperPreview from '@/components/PaperPreview';
import { 
  useQuestionPapers, 
  useQuestionPaper,
  useCreateQuestionPaper, 
  useUpdateQuestionPaper, 
  useDeleteQuestionPaper,
  useRemoveQuestionFromPaper,
  useQuestionsByQPCode,
  useAllQuestions
} from '@/hooks/api/useQuestionPapers';
import { useUpdateQuestion, useCreateQuestion } from '@/hooks/api/useQuestionBank';
import { useQPCodes } from '@/hooks/api/useQPCodes';
import { QuestionPaper, CreateQuestionPaperData } from '@/services/questionPapers';
import { QPCode } from '@/services/qpCodes';

interface Question {
  question_id?: number;
  question_text: string;
  type: 'MCQ' | 'FILL_IN_THE_BLANK' | 'TRUE_FALSE' | 'MATCH' | 'CHOICE_BASED';
  options?: any;
  correct_answer: string;
  explanation?: string;
  marks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
  left_side?: string;
  right_side?: string;
  tags?: string[];
  qp_code_id?: number;
}

const QuestionPapers = () => {
  const { toast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQPCode, setSelectedQPCode] = useState('all');
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showEditQuestions, setShowEditQuestions] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  
  const [newPaper, setNewPaper] = useState<CreateQuestionPaperData>({
    paper_name: '',
    qp_code_id: undefined,
    total_marks: 0,
    total_questions: 0,
    duration_minutes: undefined,
    description: '',
    difficulty_distribution: ''
  });

  const [paperQuestions, setPaperQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedQuestionsForModal, setSelectedQuestionsForModal] = useState<Question[]>([]);
  const [existingPapers, setExistingPapers] = useState<QuestionPaper[]>([]);
  const [showExistingPapers, setShowExistingPapers] = useState(false);
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);
  const [existingPaperNames, setExistingPaperNames] = useState<string[]>([]);
  const [selectedPaperName, setSelectedPaperName] = useState<string>('');
  const [isNewPaperName, setIsNewPaperName] = useState(false);
  const [questionSelectionType, setQuestionSelectionType] = useState<'same' | 'other' | null>(null);
  const [selectionSearch, setSelectionSearch] = useState('');
  const [selectionType, setSelectionType] = useState<'all' | 'MCQ' | 'FILL_IN_THE_BLANK' | 'TRUE_FALSE' | 'MATCH' | 'CHOICE_BASED'>('all');
  const [selectionDifficulty, setSelectionDifficulty] = useState<'all' | 'EASY' | 'MEDIUM' | 'HARD'>('all');
  const [selectionQPFilter, setSelectionQPFilter] = useState<string>('all');

  // New state for improved question addition
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: '',
    type: 'MCQ',
    options: { A: '', B: '', C: '', D: '' },
    correct_answer: '',
    explanation: '',
    marks: 1,
    difficulty: 'MEDIUM',
    topic: '',
    tags: [],
    qp_code_id: newPaper.qp_code_id
  });
  const [showQuestionAdded, setShowQuestionAdded] = useState(false);
  const [questionsPerPage, setQuestionsPerPage] = useState(10);
  const [currentQuestionsPage, setCurrentQuestionsPage] = useState(1);

  // Data
  const { data: papersResponse, isLoading } = useQuestionPapers({ 
    page: currentPage, 
    limit: itemsPerPage,
    search: searchTerm || undefined,
    qp_code_id: selectedQPCode && selectedQPCode !== 'all' ? parseInt(selectedQPCode) : undefined
  });
  
  const { data: qpCodesResponse } = useQPCodes();
  
  // Hook to fetch paper with questions for preview
  const { data: paperWithQuestionsResponse } = useQuestionPaper(
    selectedPaper?.paper_id?.toString() || ''
  );
  
  // Mutations
  const createPaperMutation = useCreateQuestionPaper();
  const updatePaperMutation = useUpdateQuestionPaper();
  const deletePaperMutation = useDeleteQuestionPaper();
  const removeQuestionMutation = useRemoveQuestionFromPaper();
  const updateQuestionMutation = useUpdateQuestion();
  const createQuestionMutation = useCreateQuestion();

  const papers = (papersResponse as any)?.data || [];
  const paginationMeta = (papersResponse as any)?.meta;
  const qpCodes = (qpCodesResponse as any)?.data || [];
  
  // Pagination calculations
  const totalPapers = paginationMeta?.total || papers.length;
  const totalPages = paginationMeta?.totalPages || Math.ceil(totalPapers / itemsPerPage);
  const papersStartIndex = paginationMeta ? (currentPage - 1) * itemsPerPage : 0;
  const papersEndIndex = paginationMeta 
    ? Math.min(papersStartIndex + itemsPerPage, totalPapers)
    : Math.min(papersStartIndex + itemsPerPage, papers.length);
  
  // Reset to page 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedQPCode]);
  

  // Data for question selection modal
  const { data: sameQPQuestionsResponse } = useQuestionsByQPCode(
    newPaper.qp_code_id?.toString() || '',
    { limit: 100 }
  );

  const { data: allQuestionsResponse } = useAllQuestions({
    // For 'other' selection, fetch broadly and exclude current QP in-memory
    limit: 100
  });

  // Get available questions based on selection type
  const availableQuestions = questionSelectionType === 'same' 
    ? (sameQPQuestionsResponse as any)?.data || []
    : questionSelectionType === 'other'
    ? ((allQuestionsResponse as any)?.data || []).filter(q => q.qp_code_id !== newPaper.qp_code_id)
    : [];

  const filteredAvailableQuestions = (availableQuestions as Question[]).filter((q) => {
    if (selectionSearch) {
      const haystack = `${q.question_text} ${q.topic || ''}`.toLowerCase();
      if (!haystack.includes(selectionSearch.toLowerCase())) return false;
    }
    if (selectionType !== 'all' && q.type !== selectionType) return false;
    if (selectionDifficulty !== 'all' && q.difficulty !== selectionDifficulty) return false;
    if (questionSelectionType === 'other' && selectionQPFilter !== 'all') {
      if (q.qp_code_id?.toString() !== selectionQPFilter) return false;
    }
    return true;
  });


  // Auto-populate description when QP Code is selected
  useEffect(() => {
    if (newPaper.qp_code_id) {
      const selectedQPCode = qpCodes.find(qp => qp.qp_code_id === newPaper.qp_code_id);
      if (selectedQPCode && selectedQPCode.description !== newPaper.description) {
        setNewPaper(prev => ({
          ...prev,
          description: selectedQPCode.description || ''
        }));
      }
      
      // Update current question's qp_code_id
      setCurrentQuestion(prev => ({
        ...prev,
        qp_code_id: newPaper.qp_code_id
      }));
    }
  }, [newPaper.qp_code_id, qpCodes]);

  // Pagination helpers
  const totalQuestionsPages = Math.ceil(paperQuestions.length / questionsPerPage);
  const startIndex = (currentQuestionsPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentPageQuestions = paperQuestions.slice(startIndex, endIndex);

  const handleQuestionsPageChange = (page: number) => {
    setCurrentQuestionsPage(page);
  };

  const handleQuestionsPerPageChange = (perPage: number) => {
    setQuestionsPerPage(perPage);
    setCurrentQuestionsPage(1);
  };

  // Check for existing papers when QP code or papers change
  useEffect(() => {
    if (newPaper.qp_code_id && papers.length > 0) {
      const existing = papers.filter(paper => paper.qp_code_id === newPaper.qp_code_id);
      setExistingPapers(existing);
      setShowExistingPapers(existing.length > 0);
      
      // Get unique paper names for this QP code
      const paperNames = [...new Set(existing.map(paper => paper.paper_name))] as string[];
      setExistingPaperNames(paperNames);
    } else {
      setExistingPapers([]);
      setShowExistingPapers(false);
      setExistingPaperNames([]);
    }
  }, [newPaper.qp_code_id, papers.length]);

  const handleCreatePaper = async () => {
    if (!newPaper.paper_name?.trim() || !newPaper.qp_code_id) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (paperQuestions.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one question', variant: 'destructive' });
      return;
    }

    try {
      const paperData = {
        ...newPaper,
        questions: paperQuestions,
        total_questions: paperQuestions.length,
        total_marks: paperQuestions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      const result = await createPaperMutation.mutateAsync(paperData);
      
      toast({ title: 'Success', description: 'Question paper created successfully' });
      setNewPaper({
        paper_name: '',
        qp_code_id: undefined,
        total_marks: 0,
        total_questions: 0,
        duration_minutes: undefined,
        description: '',
        difficulty_distribution: ''
      });
      setPaperQuestions([]);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create question paper';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdatePaper = async () => {
    if (!selectedPaper) return;

    try {
      const result = await updatePaperMutation.mutateAsync({
        id: selectedPaper.paper_id.toString(),
        data: selectedPaper
      });
      
      toast({ title: 'Success', description: 'Question paper updated successfully' });
      setSelectedPaper(null);
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update question paper';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };

  const handleDeletePaper = async (id: number) => {
    try {
      const result = await deletePaperMutation.mutateAsync(id.toString());
      toast({ title: 'Success', description: 'Question paper deleted successfully' });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete question paper';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };

  const handleRemoveQuestionFromPaper = async (paperId: number, questionId: number) => {
    try {
      const result = await removeQuestionMutation.mutateAsync({
        paperId: paperId.toString(),
        questionId: questionId.toString()
      });
      toast({ title: 'Success', description: 'Question removed from paper successfully' });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to remove question from paper';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateQuestionInModal = async (e?: React.MouseEvent) => {
    if (!editingQuestion) return;

    try {
      // Filter out read-only fields before sending to API
      const {
        question_id,
        created_at,
        updated_at,
        qp_code,
        question_paper_questions,
        quiz_questions,
        user_answers,
        ...updateData
      } = editingQuestion;
      
      const result = await updateQuestionMutation.mutateAsync({
        id: editingQuestion.question_id.toString(),
        data: updateData
      });
      
      toast({ title: 'Success', description: 'Question updated successfully' });
      
      // Close the modal
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      setEditingQuestionIndex(null);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update question';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };

  const handleAddNewQuestionToPaper = async () => {
    if (!selectedPaper || !editingQuestion) return;

    try {
      // Create the question data
      const questionData = {
        question_text: editingQuestion.question_text,
        type: editingQuestion.type,
        qp_code_id: selectedPaper.qp_code_id,
        topic: editingQuestion.topic,
        difficulty: editingQuestion.difficulty,
        options: editingQuestion.options,
        correct_answer: editingQuestion.correct_answer,
        explanation: editingQuestion.explanation,
        marks: editingQuestion.marks,
        left_side: editingQuestion.left_side,
        right_side: editingQuestion.right_side,
        tags: editingQuestion.tags || []
      };
      
      const result = await createQuestionMutation.mutateAsync(questionData);
      
      toast({ title: 'Success', description: 'Question added to paper successfully' });
      
      // Close the modal
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      setEditingQuestionIndex(null);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add question to paper';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };

  const handleAddQuestion = () => {
    if (!newPaper.qp_code_id) {
      toast({ 
        title: 'Error', 
        description: 'Please select a QP Code first', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate required fields
    if (!currentQuestion.question_text.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Please enter question text', 
        variant: 'destructive' 
      });
      return;
    }

    if (!currentQuestion.correct_answer.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Please enter correct answer', 
        variant: 'destructive' 
      });
      return;
    }

    if (currentQuestion.type === 'MCQ') {
      const hasEmptyOptions = Object.values(currentQuestion.options || {}).some(option => !String(option).trim());
      if (hasEmptyOptions) {
        toast({ 
          title: 'Error', 
          description: 'Please fill all MCQ options', 
          variant: 'destructive' 
        });
        return;
      }
    }

    // Add the current question to the paper
    const questionToAdd = { ...currentQuestion, qp_code_id: newPaper.qp_code_id };
    const updatedQuestions = [...paperQuestions, questionToAdd];
    setPaperQuestions(updatedQuestions);
    
    // Show success message
    setShowQuestionAdded(true);
    setTimeout(() => setShowQuestionAdded(false), 3000);
    
    // Reset form for next question
    setCurrentQuestion({
      question_text: '',
      type: 'MCQ',
      options: { A: '', B: '', C: '', D: '' },
      correct_answer: '',
      explanation: '',
      marks: 1,
      difficulty: 'MEDIUM',
      topic: '',
      tags: [],
      qp_code_id: newPaper.qp_code_id
    });
    
    toast({ 
      title: 'Question Added!', 
      description: `Total questions: ${updatedQuestions.length}. Form reset for next question.` 
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setPaperQuestions(paperQuestions.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...paperQuestions];
    newQuestions[index] = updatedQuestion;
    setPaperQuestions(newQuestions);
  };

  const handleImportCSV = () => {
    if (!newPaper.qp_code_id) {
      toast({ 
        title: 'Error', 
        description: 'Please select a QP Code first', 
        variant: 'destructive' 
      });
      return;
    }
    setShowCsvImport(true);
  };

  const handleCsvImportComplete = (questions: Question[]) => {
    setPaperQuestions([...paperQuestions, ...questions]);
    setShowCsvImport(false);
    toast({ 
      title: 'Success', 
      description: `Successfully imported ${questions.length} questions` 
    });
  };

  const handleCsvImportCancel = () => {
    setShowCsvImport(false);
  };

  const handleSelectFromSameQPCode = () => {
    if (!newPaper.qp_code_id) {
      toast({ 
        title: 'Error', 
        description: 'Please select a QP Code first', 
        variant: 'destructive' 
      });
      return;
    }
    
    setQuestionSelectionType('same');
    setShowQuestionSelection(true);
    toast({ 
      title: 'Info', 
      description: 'Loading questions from same QP code...' 
    });
  };

  const handleSelectFromOtherQPCodes = () => {
    if (!newPaper.qp_code_id) {
      toast({ 
        title: 'Error', 
        description: 'Please select a QP Code first', 
        variant: 'destructive' 
      });
      return;
    }
    
    setQuestionSelectionType('other');
    setShowQuestionSelection(true);
    toast({ 
      title: 'Info', 
      description: 'Loading questions from other QP codes...' 
    });
  };

  const handlePaperNameSelect = (value: string) => {
    if (value === 'new') {
      setIsNewPaperName(true);
      setSelectedPaperName('');
      setNewPaper(prev => ({ ...prev, paper_name: '' }));
    } else {
      setIsNewPaperName(false);
      setSelectedPaperName(value);
      setNewPaper(prev => ({ ...prev, paper_name: value }));
      
      // Check if this QP code + name combination already exists
      const existingPaper = existingPapers.find(paper => 
        paper.paper_name === value && paper.qp_code_id === newPaper.qp_code_id
      );
      
      if (existingPaper) {
        setShowExistingPapers(true);
        setExistingPapers([existingPaper]);
      }
    }
  };

  const handleAddSelectedQuestion = (question: Question) => {
    // Check if question already exists in paper
    const exists = paperQuestions.some(q => q.question_text === question.question_text);
    if (exists) {
      toast({
        title: 'Warning',
        description: 'This question is already in the paper',
        variant: 'destructive'
      });
      return;
    }

    // Add question to paper
    const newQuestion: Question = {
      ...question,
      qp_code_id: newPaper.qp_code_id!
    };
    
    setPaperQuestions([...paperQuestions, newQuestion]);
    
    toast({
      title: 'Success',
      description: 'Question added to paper',
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...paperQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      setPaperQuestions(newQuestions);
    }
  };

  const handleEditMarks = (index: number, marks: number) => {
    const newQuestions = [...paperQuestions];
    newQuestions[index] = { ...newQuestions[index], marks };
    setPaperQuestions(newQuestions);
  };

  const handleFullPreview = () => {
    if (paperQuestions.length === 0) {
      toast({ 
        title: 'Error', 
        description: 'Please add some questions before previewing', 
        variant: 'destructive' 
      });
      return;
    }
    setShowFullPreview(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Question Papers
            </h1>
            <p className="text-gray-600 mt-2">Manage question papers with QP Code based structure</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-800">{papers.length} Papers</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
          <TabsTrigger value="create" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Create Paper</TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Manage Papers</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardHeader className="bg-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Question Paper
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Step 1: Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-800">Step 1: Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="qp_code_id" className="text-blue-700 font-medium">QP Code *</Label>
                    <Select 
                      value={newPaper.qp_code_id?.toString() || ''} 
                      onValueChange={(value) => setNewPaper({...newPaper, qp_code_id: value ? parseInt(value) : undefined})}
                    >
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="Select QP Code" />
                      </SelectTrigger>
                      <SelectContent>
                        {qpCodes.map((qpCode) => (
                          <SelectItem key={qpCode.qp_code_id} value={qpCode.qp_code_id.toString()}>
                            {qpCode.code} - {qpCode.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paper_name" className="text-blue-700 font-medium">Paper Name *</Label>
                    {existingPaperNames.length > 0 ? (
                      <Select value={selectedPaperName} onValueChange={handlePaperNameSelect}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-500">
                          <SelectValue placeholder="Select or add new paper name" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingPaperNames.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            <span className="text-blue-600 font-medium">+ Add New Paper Name</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="paper_name"
                        value={newPaper.paper_name}
                        onChange={(e) => setNewPaper({...newPaper, paper_name: e.target.value})}
                        placeholder="e.g., Mathematics Midterm 2024"
                        className="border-blue-200 focus:border-blue-500"
                      />
                    )}
                    {isNewPaperName && (
                      <Input
                        id="new_paper_name"
                        value={newPaper.paper_name}
                        onChange={(e) => setNewPaper({...newPaper, paper_name: e.target.value})}
                        placeholder="Enter new paper name"
                        className="border-blue-200 focus:border-blue-500 mt-2"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="text-blue-700 font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={newPaper.description || ''}
                    onChange={(e) => setNewPaper({...newPaper, description: e.target.value})}
                    placeholder="Enter paper description..."
                    rows={3}
                    className="border-blue-200 focus:border-blue-500"
                  />
                                  </div>
                </div>

                {/* Existing Papers Warning */}
                {showExistingPapers && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-yellow-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-800 mb-2">
                          Existing Papers Found for this QP Code
                        </h4>
                        <p className="text-yellow-700 text-sm mb-3">
                          The following papers already exist for the selected QP Code. You can view, edit, or create a new paper.
                        </p>
                        <div className="space-y-2">
                          {existingPapers.map((paper) => (
                            <div key={paper.paper_id} className="flex items-center justify-between bg-white p-4 rounded border shadow-sm">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <p className="font-medium text-gray-900">{paper.paper_name}</p>
                                  <Badge className="bg-blue-100 text-blue-800">Code: {paper.paper_code}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>Questions: {paper.total_questions}</span>
                                  <span>Marks: {paper.total_marks}</span>
                                  <span>Status: {paper.is_active ? 'Active' : 'Inactive'}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPaper(paper);
                                    setShowPreview(true);
                                  }}
                                  className="text-blue-600 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Preview
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPaper(paper);
                                    setIsEditing(true);
                                  }}
                                  className="text-green-600 hover:bg-green-50"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePaper(paper.paper_id)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Question Management */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-800">Step 2: Question Management</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {paperQuestions.length} Questions Added
                    </Badge>
                    <Badge variant="outline">
                      {paperQuestions.reduce((sum, q) => sum + q.marks, 0)} Total Marks
                    </Badge>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    onClick={handleImportCSV}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import from CSV
                  </Button>
                  <Button 
                    onClick={handleSelectFromSameQPCode}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    From Same QP Code
                  </Button>
                  <Button 
                    onClick={handleSelectFromOtherQPCodes}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    From Other QP Codes
                  </Button>
                            <Button
                    onClick={handleFullPreview}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={paperQuestions.length === 0}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Paper
                            </Button>
                          </div>
                          
                {/* Add New Question Form */}
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader className="bg-blue-100">
                    <CardTitle className="text-blue-800 flex items-center">
                      <PlusCircle className="w-5 h-5 mr-2" />
                      Add New Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Question Added Success Message */}
                    {showQuestionAdded && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                        <span className="font-medium">Question Added Successfully!</span>
                      </div>
                    )}

                            {/* Question Text */}
                            <div>
                      <Label className="text-blue-700 font-medium">Question Text *</Label>
                              <Textarea
                        value={currentQuestion.question_text}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
                                placeholder="Enter your question here..."
                        className="border-blue-200 focus:border-blue-500 min-h-[100px]"
                        rows={4}
                              />
                            </div>

                    {/* Question Type and Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                        <Label className="text-blue-700 font-medium">Question Type *</Label>
                              <Select 
                          value={currentQuestion.type} 
                          onValueChange={(value: any) => setCurrentQuestion({...currentQuestion, type: value})}
                              >
                          <SelectTrigger className="border-blue-200 focus:border-blue-500">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MCQ">MCQ</SelectItem>
                                  <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                                  <SelectItem value="FILL_IN_THE_BLANK">Fill in the Blank</SelectItem>
                                  {/* <SelectItem value="MATCH">Match</SelectItem>
                                  <SelectItem value="CHOICE_BASED">Choice Based</SelectItem> */}
                                </SelectContent>
                              </Select>
                      </div>
                      <div>
                        <Label className="text-blue-700 font-medium">Difficulty *</Label>
                        <Select 
                          value={currentQuestion.difficulty} 
                          onValueChange={(value: any) => setCurrentQuestion({...currentQuestion, difficulty: value})}
                        >
                          <SelectTrigger className="border-blue-200 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EASY">Easy</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HARD">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-blue-700 font-medium">Marks *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={currentQuestion.marks}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, marks: parseInt(e.target.value) || 1})}
                          className="border-blue-200 focus:border-blue-500"
                        />
                      </div>
                            </div>

                    {/* MCQ Options */}
                    {currentQuestion.type === 'MCQ' && (
                              <div>
                        <Label className="text-blue-700 font-medium">Options *</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {['A', 'B', 'C', 'D'].map((option) => (
                                    <div key={option} className="flex items-center gap-2">
                                      <span className="font-medium text-blue-600 w-6">{option})</span>
                                      <Input
                                value={currentQuestion.options?.[option] || ''}
                                        onChange={(e) => {
                                  const newOptions = { ...currentQuestion.options, [option]: e.target.value };
                                  setCurrentQuestion({...currentQuestion, options: newOptions});
                                        }}
                                        placeholder={`Option ${option}`}
                                className="border-blue-200 focus:border-blue-500"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Match Questions */}
                    {currentQuestion.type === 'MATCH' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                          <Label className="text-blue-700 font-medium">Left Side *</Label>
                                  <Textarea
                            value={currentQuestion.left_side || ''}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, left_side: e.target.value})}
                                    placeholder="Enter left side items (one per line)..."
                            className="border-blue-200 focus:border-blue-500 min-h-[100px]"
                            rows={4}
                                  />
                                </div>
                                <div>
                          <Label className="text-blue-700 font-medium">Right Side *</Label>
                                  <Textarea
                            value={currentQuestion.right_side || ''}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, right_side: e.target.value})}
                                    placeholder="Enter right side items (one per line)..."
                            className="border-blue-200 focus:border-blue-500 min-h-[100px]"
                            rows={4}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Correct Answer */}
                            <div>
                      <Label className="text-blue-700 font-medium">Correct Answer *</Label>
                      {currentQuestion.type === 'MCQ' ? (
                                <Select 
                          value={currentQuestion.correct_answer} 
                          onValueChange={(value) => setCurrentQuestion({...currentQuestion, correct_answer: value})}
                                >
                          <SelectTrigger className="border-blue-200 focus:border-blue-500">
                                    <SelectValue placeholder="Select correct option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                  </SelectContent>
                                </Select>
                      ) : currentQuestion.type === 'TRUE_FALSE' ? (
                                <Select 
                          value={currentQuestion.correct_answer} 
                          onValueChange={(value) => setCurrentQuestion({...currentQuestion, correct_answer: value})}
                                >
                          <SelectTrigger className="border-blue-200 focus:border-blue-500">
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="True">True</SelectItem>
                                    <SelectItem value="False">False</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                          value={currentQuestion.correct_answer}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, correct_answer: e.target.value})}
                                  placeholder="Enter correct answer..."
                          className="border-blue-200 focus:border-blue-500"
                                />
                              )}
                            </div>

                    {/* Explanation and Topic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                        <Label className="text-blue-700 font-medium">Explanation</Label>
                              <Textarea
                          value={currentQuestion.explanation || ''}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                                placeholder="Enter explanation for the answer (optional)..."
                          className="border-blue-200 focus:border-blue-500 min-h-[80px]"
                          rows={3}
                              />
                            </div>
                            <div>
                        <Label className="text-blue-700 font-medium">Topic</Label>
                              <Input
                          value={currentQuestion.topic || ''}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, topic: e.target.value})}
                                placeholder="Enter topic (optional)..."
                          className="border-blue-200 focus:border-blue-500"
                              />
                            </div>
                          </div>

                    {/* Add Question Button */}
                    <div className="flex justify-center pt-4">
                      <Button 
                        onClick={handleAddQuestion}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
                        size="lg"
                      >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Add Question to Paper
                      </Button>
                          </div>
                        </CardContent>
                      </Card>

                {/* Questions Preview with Pagination */}
                {paperQuestions.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="bg-green-100">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-green-800 flex items-center">
                          <FileText className="w-5 h-5 mr-2" />
                          Questions Preview ({paperQuestions.length} questions)
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-green-700">Show:</Label>
                          <Select value={questionsPerPage.toString()} onValueChange={(value) => handleQuestionsPerPageChange(parseInt(value))}>
                            <SelectTrigger className="w-20 h-8 text-sm">
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
                    </CardHeader>
                    <CardContent className="p-4">
                      {/* Questions List */}
                      <div className="space-y-3">
                        {currentPageQuestions.map((question, index) => {
                          const actualIndex = startIndex + index;
                          return (
                            <Card key={actualIndex} className="border-green-200 bg-white">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-800">
                                      Q{actualIndex + 1}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {question.type}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {question.difficulty}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {question.marks} marks
                                    </Badge>
                                    {question.topic && (
                                      <Badge variant="outline" className="text-xs">
                                        {question.topic}
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveQuestion(actualIndex)}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <MinusCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-gray-800 font-medium line-clamp-2">
                                    {question.question_text}
                                  </p>
                                  
                                  {question.type === 'MCQ' && question.options && (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">Options:</span>
                                      {Object.entries(question.options).map(([key, value]) => (
                                        <span key={key} className="ml-2">
                                          {key}) {String(value)}
                                        </span>
                    ))}
                  </div>
                )}
                                  
                                  {question.type === 'MATCH' && (
                                    <div className="text-sm text-gray-600">
                                      <div><span className="font-medium">Left:</span> {question.left_side}</div>
                                      <div><span className="font-medium">Right:</span> {question.right_side}</div>
              </div>
                                  )}
                                  
                                  <div className="text-sm">
                                    <span className="font-medium text-green-600">Answer:</span>
                                    <span className="ml-2 text-gray-700">{question.correct_answer}</span>
                                  </div>
                                  
                                  {question.explanation && (
                                    <div className="text-sm text-gray-600 line-clamp-1">
                                      <span className="font-medium">Explanation:</span> {question.explanation}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      {totalQuestionsPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-green-200">
                          <div className="text-sm text-green-700">
                            Showing {startIndex + 1} to {Math.min(endIndex, paperQuestions.length)} of {paperQuestions.length} questions
                          </div>
                          <div className="flex items-center gap-2">
                  <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuestionsPageChange(currentQuestionsPage - 1)}
                              disabled={currentQuestionsPage === 1}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                            >
                              Previous
                  </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalQuestionsPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                  <Button 
                                    key={pageNum}
                                    variant={currentQuestionsPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleQuestionsPageChange(pageNum)}
                                    className={currentQuestionsPage === pageNum 
                                      ? "bg-green-600 hover:bg-green-700" 
                                      : "border-green-200 text-green-600 hover:bg-green-50"
                                    }
                                  >
                                    {pageNum}
                  </Button>
                                );
                              })}
                              {totalQuestionsPages > 5 && (
                                <>
                                  <span className="text-green-600">...</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuestionsPageChange(totalQuestionsPages)}
                                    className="border-green-200 text-green-600 hover:bg-green-50"
                                  >
                                    {totalQuestionsPages}
                                  </Button>
                                </>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuestionsPageChange(currentQuestionsPage + 1)}
                              disabled={currentQuestionsPage === totalQuestionsPages}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                </div>

              {/* Step 3: Save Paper */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-800">Step 3: Save Question Paper</h3>
                <div className="flex justify-center">
                  <Button 
                    onClick={handleCreatePaper} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
                    disabled={createPaperMutation.isPending || paperQuestions.length === 0}
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {createPaperMutation.isPending ? 'Creating...' : `Create Question Paper (${paperQuestions.length} questions)`}
                  </Button>
                </div>
                {paperQuestions.length === 0 && (
                  <p className="text-center text-gray-500 text-sm">
                    Add at least one question to create the paper
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search papers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedQPCode} onValueChange={setSelectedQPCode}>
                    <SelectTrigger className="w-[200px] border-blue-200 focus:border-blue-500">
                      <SelectValue placeholder="All QP Codes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All QP Codes</SelectItem>
                      {qpCodes.map((qpCode) => (
                        <SelectItem key={qpCode.qp_code_id} value={qpCode.qp_code_id.toString()}>
                          {qpCode.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setSelectedQPCode('all');
                  }} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {papers.map((paper) => (
              <Card key={paper.paper_id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{paper.paper_name}</h3>
                        <Badge className={paper.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {paper.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">Code: {paper.paper_code}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {paper.qp_code && (
                          <Badge className="bg-blue-100 text-blue-800">{paper.qp_code.code}</Badge>
                        )}
                        {paper.total_marks > 0 && (
                          <Badge variant="outline">{paper.total_marks} marks</Badge>
                        )}
                        {paper.total_questions > 0 && (
                          <Badge variant="outline">{paper.total_questions} questions</Badge>
                        )}
                      </div>
                      {paper.description && (
                        <p className="text-gray-600 text-sm">{paper.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-purple-600 hover:bg-purple-50"
                        onClick={() => {
                          setSelectedPaper(paper);
                          setShowPreview(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedPaper(paper);
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeletePaper(paper.paper_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {papers.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No question papers found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters or create some question papers to get started.</p>
                  <Button onClick={() => setNewPaper({
                    paper_name: '',
                    qp_code_id: undefined,
                    total_marks: 0,
                    total_questions: 0,
                    duration_minutes: undefined,
                    description: '',
                    difficulty_distribution: ''
                  })} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Paper
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && papers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t px-4 pb-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {papersStartIndex + 1} to {papersEndIndex} of {totalPapers} papers
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
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
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
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
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
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
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
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
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
        </TabsContent>
      </Tabs>

      {/* CSV Import Modal */}
      {showCsvImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CsvImport
              onImport={handleCsvImportComplete}
              onCancel={handleCsvImportCancel}
              qpCodeId={newPaper.qp_code_id}
            />
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <PaperPreview
                paper={{
                  paper_code: `QP-${newPaper.qp_code_id}-${Date.now()}`,
                  paper_name: newPaper.paper_name,
                  description: newPaper.description,
                  total_marks: paperQuestions.reduce((sum, q) => sum + q.marks, 0),
                  total_questions: paperQuestions.length,
                  duration_minutes: newPaper.duration_minutes,
                  qp_code: qpCodes.find(qp => qp.qp_code_id === newPaper.qp_code_id)
                }}
                questions={paperQuestions}
                onEditQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleRemoveQuestion}
                onMoveQuestion={handleMoveQuestion}
                onEditMarks={handleEditMarks}
                onClose={() => setShowFullPreview(false)}
                onSave={() => {
                  setShowFullPreview(false);
                  handleCreatePaper();
                }}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedPaper && isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                Edit Question Paper
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Paper Code: {selectedPaper.paper_code}
                  </p>
                </div>
              <Button
                  variant="outline"
                onClick={() => {
                  setSelectedPaper(null);
                  setIsEditing(false);
                }}
                  className="text-gray-600 hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
              </Button>
              </div>

              <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-paper_code" className="text-blue-700 font-medium">Paper Code *</Label>
                <Input
                  id="edit-paper_code"
                  value={selectedPaper.paper_code}
                  onChange={(e) => setSelectedPaper({...selectedPaper, paper_code: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-paper_name" className="text-blue-700 font-medium">Paper Name *</Label>
                <Input
                  id="edit-paper_name"
                  value={selectedPaper.paper_name}
                  onChange={(e) => setSelectedPaper({...selectedPaper, paper_name: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-blue-700 font-medium">Description</Label>
              <Textarea
                id="edit-description"
                value={selectedPaper.description || ''}
                onChange={(e) => setSelectedPaper({...selectedPaper, description: e.target.value})}
                rows={3}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={selectedPaper.is_active}
                onCheckedChange={(checked) => setSelectedPaper({...selectedPaper, is_active: checked})}
              />
              <Label htmlFor="edit-is_active" className="text-blue-700 font-medium">Active</Label>
            </div>
                
                {/* Edit Questions Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setShowEditQuestions(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Questions in Paper
                  </Button>
                </div>
                
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedPaper(null);
                  setIsEditing(false);
                }}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdatePaper}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updatePaperMutation.isPending}
              >
                {updatePaperMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Selection Modal */}
      {showQuestionSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Select Questions {questionSelectionType === 'same' ? 'from Same QP Code' : 'from Other QP Codes'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {availableQuestions.length} questions available
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQuestionSelection(false);
                    setQuestionSelectionType(null);
                  }}
                  className="text-gray-600 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                {/* Filters for selection modal */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input
                      placeholder="Search questions..."
                      value={selectionSearch}
                      onChange={(e) => setSelectionSearch(e.target.value)}
                      className="border-blue-200 focus:border-blue-500"
                    />
                    <Select value={selectionType} onValueChange={(v: any) => setSelectionType(v)}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="MCQ">MCQ</SelectItem>
                        <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                        <SelectItem value="FILL_IN_THE_BLANK">Fill in the Blank</SelectItem>
                        {/* <SelectItem value="MATCH">Match</SelectItem>
                        <SelectItem value="CHOICE_BASED">Choice Based</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <Select value={selectionDifficulty} onValueChange={(v: any) => setSelectionDifficulty(v)}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="All Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Difficulty</SelectItem>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectionQPFilter}
                      onValueChange={(v: any) => setSelectionQPFilter(v)}
                      disabled={questionSelectionType !== 'other'}
                    >
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="All QP Codes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All QP Codes</SelectItem>
                        {qpCodes
                          .filter((q) => q.qp_code_id !== newPaper.qp_code_id)
                          .map((q) => (
                            <SelectItem key={q.qp_code_id} value={q.qp_code_id.toString()}>
                              {q.code}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectionSearch('');
                        setSelectionType('all');
                        setSelectionDifficulty('all');
                        setSelectionQPFilter('all');
                      }}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {filteredAvailableQuestions && filteredAvailableQuestions.length > 0 ? (
                  filteredAvailableQuestions.map((question, index) => (
                    <Card key={question.question_id || index} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                Q{question.question_id || index + 1}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800">
                                {question.type}
                              </Badge>
                              <Badge variant="outline">
                                {question.marks} marks
                              </Badge>
                              {question.topic && (
                                <Badge variant="outline" className="text-xs">
                                  {question.topic}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-700 mb-2">{question.question_text}</p>
                            {question.type === 'MCQ' && question.options && (
                              <div className="text-sm text-gray-600 mb-2">
                                <div className="space-y-1">
                                  {Object.entries(question.options).map(([key, value]) => (
                                    <div key={key} className="flex items-center">
                                      <span className="font-medium text-blue-600 w-4">{key}:</span>
                                      <span className="ml-2 text-gray-700">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p className="text-sm text-green-600 font-medium">
                              Answer: {question.correct_answer}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSelectedQuestion(question)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Paper
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No questions available for selection</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paper Preview Modal */}
      {showPreview && selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedPaper.paper_name} - Preview
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Paper Code: {selectedPaper.paper_code}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedPaper(null);
                  }}
                  className="text-gray-600 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>

              <PaperPreview
                paper={{
                  paper_code: selectedPaper.paper_code,
                  paper_name: selectedPaper.paper_name,
                  description: selectedPaper.description,
                  total_marks: selectedPaper.total_marks,
                  total_questions: selectedPaper.total_questions,
                  duration_minutes: selectedPaper.duration_minutes,
                  qp_code: selectedPaper.qp_code
                }}
                questions={(paperWithQuestionsResponse as any)?.data?.question_paper_questions?.map((pq: any) => ({
                  question_id: pq.questions?.question_id,
                  question_text: pq.questions?.question_text,
                  type: pq.questions?.type,
                  options: pq.questions?.options,
                  correct_answer: pq.questions?.correct_answer,
                  explanation: pq.questions?.explanation,
                  marks: pq.marks || pq.questions?.marks,
                  difficulty: pq.questions?.difficulty,
                  topic: pq.questions?.topic,
                  left_side: pq.questions?.left_side,
                  right_side: pq.questions?.right_side,
                  tags: pq.questions?.tags
                })) || []}
                onEditQuestion={() => {}}
                onDeleteQuestion={() => {}}
                onMoveQuestion={() => {}}
                onEditMarks={() => {}}
                onClose={() => {
                  setShowPreview(false);
                  setSelectedPaper(null);
                }}
                onSave={() => {}}
                isEditing={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Questions Modal */}
      {showEditQuestions && selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Questions in {selectedPaper.paper_name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Paper Code: {selectedPaper.paper_code}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setEditingQuestion({
                        question_text: '',
                        type: 'MCQ',
                        options: { A: '', B: '', C: '', D: '' },
                        correct_answer: '',
                        explanation: '',
                        marks: 1,
                        difficulty: 'MEDIUM',
                        topic: '',
                        tags: []
                      });
                      setEditingQuestionIndex(null);
                      setShowEditQuestionModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Question
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditQuestions(false);
                      setEditingQuestionIndex(null);
                    }}
                    className="text-gray-600 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {(paperWithQuestionsResponse as any)?.data?.question_paper_questions?.map((pq: any, index: number) => (
                  <Card key={index} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            Q{index + 1}
                          </Badge>
                          <Badge className="bg-green-100 text-green-800">
                            {pq.questions?.type}
                          </Badge>
                          <Badge variant="outline">
                            {pq.marks || pq.questions?.marks} marks
                          </Badge>
                          {pq.questions?.topic && (
                            <Badge variant="outline" className="text-xs">
                              {pq.questions.topic}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingQuestion(pq.questions);
                              setEditingQuestionIndex(index);
                              setShowEditQuestionModal(true);
                            }}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (selectedPaper && pq.questions?.question_id) {
                                handleRemoveQuestionFromPaper(selectedPaper.paper_id, pq.questions.question_id);
                              }
                            }}
                            className="text-red-600 hover:bg-red-50"
                            disabled={removeQuestionMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {removeQuestionMutation.isPending ? 'Removing...' : 'Remove'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-800 font-medium">
                          {pq.questions?.question_text}
                        </p>
                        
                        {pq.questions?.type === 'MCQ' && pq.questions?.options && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Options:</span>
                            {Object.entries(pq.questions.options).map(([key, value]) => (
                              <span key={key} className="ml-2">
                                {key}) {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-sm">
                          <span className="font-medium text-green-600">Answer:</span>
                          <span className="ml-2 text-gray-700">{pq.questions?.correct_answer}</span>
                        </div>
                        
                        {pq.questions?.explanation && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Explanation:</span> {pq.questions.explanation}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )) || []}
                
                {(paperWithQuestionsResponse as any)?.data?.question_paper_questions?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No questions found in this paper</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditQuestionModal && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingQuestion?.question_id ? 'Edit Question' : 'Add New Question'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {editingQuestion?.question_id ? `Question ID: ${editingQuestion.question_id}` : 'Create a new question for this paper'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditQuestionModal(false);
                    setEditingQuestion(null);
                    setEditingQuestionIndex(null);
                  }}
                  className="text-gray-600 hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-blue-700 font-medium">Question Text *</Label>
                  <Textarea
                    value={editingQuestion.question_text || ''}
                    onChange={(e) => setEditingQuestion({...editingQuestion, question_text: e.target.value})}
                    placeholder="Enter your question here..."
                    className="border-blue-200 focus:border-blue-500 min-h-[100px]"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-blue-700 font-medium">Question Type *</Label>
                    <Select 
                      value={editingQuestion.type || 'MCQ'} 
                      onValueChange={(value: any) => setEditingQuestion({...editingQuestion, type: value})}
                    >
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MCQ">MCQ</SelectItem>
                        <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                        <SelectItem value="FILL_IN_THE_BLANK">Fill in the Blank</SelectItem>
                        {/* <SelectItem value="MATCH">Match</SelectItem>
                        <SelectItem value="CHOICE_BASED">Choice Based</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-blue-700 font-medium">Difficulty *</Label>
                    <Select 
                      value={editingQuestion.difficulty || 'MEDIUM'} 
                      onValueChange={(value: any) => setEditingQuestion({...editingQuestion, difficulty: value})}
                    >
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-blue-700 font-medium">Marks *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editingQuestion.marks || 1}
                      onChange={(e) => setEditingQuestion({...editingQuestion, marks: parseInt(e.target.value) || 1})}
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* MCQ Options */}
                {editingQuestion.type === 'MCQ' && (
                  <div>
                    <Label className="text-blue-700 font-medium">Options *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <span className="font-medium text-blue-600 w-6">{option})</span>
                          <Input
                            value={editingQuestion.options?.[option] || ''}
                            onChange={(e) => {
                              const newOptions = { ...editingQuestion.options, [option]: e.target.value };
                              setEditingQuestion({...editingQuestion, options: newOptions});
                            }}
                            placeholder={`Option ${option}`}
                            className="border-blue-200 focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correct Answer */}
                <div>
                  <Label className="text-blue-700 font-medium">Correct Answer *</Label>
                  {editingQuestion.type === 'MCQ' ? (
                    <Select 
                      value={editingQuestion.correct_answer || ''} 
                      onValueChange={(value) => setEditingQuestion({...editingQuestion, correct_answer: value})}
                    >
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : editingQuestion.type === 'TRUE_FALSE' ? (
                    <Select 
                      value={editingQuestion.correct_answer || ''} 
                      onValueChange={(value) => setEditingQuestion({...editingQuestion, correct_answer: value})}
                    >
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="True">True</SelectItem>
                        <SelectItem value="False">False</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={editingQuestion.correct_answer || ''}
                      onChange={(e) => setEditingQuestion({...editingQuestion, correct_answer: e.target.value})}
                      placeholder="Enter correct answer..."
                      className="border-blue-200 focus:border-blue-500"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-blue-700 font-medium">Explanation</Label>
                    <Textarea
                      value={editingQuestion.explanation || ''}
                      onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                      placeholder="Enter explanation for the answer (optional)..."
                      className="border-blue-200 focus:border-blue-500 min-h-[80px]"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-blue-700 font-medium">Topic</Label>
                    <Input
                      value={editingQuestion.topic || ''}
                      onChange={(e) => setEditingQuestion({...editingQuestion, topic: e.target.value})}
                      placeholder="Enter topic (optional)..."
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowEditQuestionModal(false);
                      setEditingQuestion(null);
                      setEditingQuestionIndex(null);
                    }}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingQuestion?.question_id ? handleUpdateQuestionInModal : handleAddNewQuestionToPaper}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={updateQuestionMutation.isPending || createQuestionMutation.isPending}
                  >
                    {updateQuestionMutation.isPending || createQuestionMutation.isPending 
                      ? 'Saving...' 
                      : editingQuestion?.question_id 
                        ? 'Save Changes' 
                        : 'Add Question'
                    }
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPapers;
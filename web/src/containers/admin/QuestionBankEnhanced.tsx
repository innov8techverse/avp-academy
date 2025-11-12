import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, HelpCircle, Upload, Download, Filter, Eye, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useQuestions, 
  useCreateQuestion, 
  useUpdateQuestion, 
  useDeleteQuestion 
} from '@/hooks/api/useQuestions';
import { useSubjects } from '@/hooks/api/useSubjects';
import { CreateQuestionData } from '@/services/questionBank';

const QuestionBankEnhanced = () => {
  const { toast } = useToast();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  
  const [newQuestion, setNewQuestion] = useState<CreateQuestionData>({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: '',
    explanation: '',
    difficulty_level: 'medium',
    subject_id: undefined,
    marks: 1
  });

  // Data
  const { data: questionsResponse, isLoading } = useQuestions({ 
    page: currentPage, 
    limit: 20,
    search: searchTerm || undefined,
    subject_id: selectedSubject && selectedSubject !== 'all' ? parseInt(selectedSubject) : undefined,
    difficulty_level: selectedDifficulty && selectedDifficulty !== 'all' ? selectedDifficulty : undefined
  });
  
  const { data: subjectsResponse } = useSubjects();
  
  // Mutations
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const questions = (questionsResponse as any)?.data || [];
  const subjects = subjectsResponse || [];

  const handleCreateQuestion = async () => {
    if (!newQuestion.question_text?.trim() || !newQuestion.correct_answer?.trim()) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      await createQuestionMutation.mutateAsync(newQuestion);
      toast({ title: 'Success', description: 'Question created successfully' });
      setNewQuestion({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: '',
        explanation: '',
        difficulty_level: 'medium',
        subject_id: undefined,
        marks: 1
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create question', variant: 'destructive' });
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      await updateQuestionMutation.mutateAsync({
        id: selectedQuestion.question_id.toString(),
        data: selectedQuestion
      });
      toast({ title: 'Success', description: 'Question updated successfully' });
      setSelectedQuestion(null);
      setIsEditing(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update question', variant: 'destructive' });
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      await deleteQuestionMutation.mutateAsync(id.toString());
      toast({ title: 'Success', description: 'Question deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete question', variant: 'destructive' });
    }
  };

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvFile(file);
    } else {
      toast({ title: 'Error', description: 'Please select a valid CSV file', variant: 'destructive' });
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        return {
          question: values[0]?.replace(/"/g, '') || '',
          option1: values[1]?.replace(/"/g, '') || '',
          option2: values[2]?.replace(/"/g, '') || '',
          option3: values[3]?.replace(/"/g, '') || '',
          option4: values[4]?.replace(/"/g, '') || '',
          answer: values[5]?.replace(/"/g, '') || ''
        };
      });
      setCsvPreview(data);
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!csvPreview.length) return;

    try {
      const importPromises = csvPreview.map(async (row) => {
        const questionData = {
          question_text: row.question,
          option_a: row.option1,
          option_b: row.option2,
          option_c: row.option3,
          option_d: row.option4,
          correct_answer: row.answer,
          explanation: '',
          difficulty_level: 'medium' as const,
          subject_id: undefined,
          marks: 1
        };
        return createQuestionMutation.mutateAsync(questionData);
      });

      await Promise.all(importPromises);
      toast({ title: 'Success', description: `${csvPreview.length} questions imported successfully` });
      setCsvFile(null);
      setCsvPreview([]);
      setShowCsvPreview(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to import questions', variant: 'destructive' });
    }
  };

  const toggleQuestionSelection = (questionId: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const getSelectedQuestions = () => {
    return questions.filter(q => selectedQuestions.has(q.question_id));
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
              Question Bank
            </h1>
            <p className="text-gray-600 mt-2">Manage and browse questions for tests and exams</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <HelpCircle className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-800">{questions.length} Questions</p>
            </div>
            {isBrowsing && (
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <Check className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">{selectedQuestions.size} Selected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-md">
          <TabsTrigger value="create" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Create Question</TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Import CSV</TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
            {isBrowsing ? 'Browse Questions' : 'Manage Questions'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardHeader className="bg-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Question
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="question_text" className="text-blue-700 font-medium">Question Text *</Label>
                  <Textarea
                    id="question_text"
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    placeholder="Enter your question here..."
                    rows={3}
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="subject_id" className="text-blue-700 font-medium">Subject</Label>
                  <Select 
                    value={newQuestion.subject_id?.toString() || ''} 
                    onValueChange={(value) => setNewQuestion({...newQuestion, subject_id: value ? parseInt(value) : undefined})}
                  >
                    <SelectTrigger className="border-blue-200 focus:border-blue-500">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty_level" className="text-blue-700 font-medium">Difficulty Level</Label>
                  <Select 
                    value={newQuestion.difficulty_level} 
                    onValueChange={(value) => setNewQuestion({...newQuestion, difficulty_level: value as any})}
                  >
                    <SelectTrigger className="border-blue-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="marks" className="text-blue-700 font-medium">Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    value={newQuestion.marks}
                    onChange={(e) => setNewQuestion({...newQuestion, marks: parseInt(e.target.value) || 1})}
                    placeholder="e.g., 1"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="correct_answer" className="text-blue-700 font-medium">Correct Answer *</Label>
                  <Input
                    id="correct_answer"
                    value={newQuestion.correct_answer}
                    onChange={(e) => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                    placeholder="Enter correct answer"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="option_a" className="text-blue-700 font-medium">Option A</Label>
                  <Input
                    id="option_a"
                    value={newQuestion.option_a}
                    onChange={(e) => setNewQuestion({...newQuestion, option_a: e.target.value})}
                    placeholder="Enter option A"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="option_b" className="text-blue-700 font-medium">Option B</Label>
                  <Input
                    id="option_b"
                    value={newQuestion.option_b}
                    onChange={(e) => setNewQuestion({...newQuestion, option_b: e.target.value})}
                    placeholder="Enter option B"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="option_c" className="text-blue-700 font-medium">Option C</Label>
                  <Input
                    id="option_c"
                    value={newQuestion.option_c}
                    onChange={(e) => setNewQuestion({...newQuestion, option_c: e.target.value})}
                    placeholder="Enter option C"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="option_d" className="text-blue-700 font-medium">Option D</Label>
                  <Input
                    id="option_d"
                    value={newQuestion.option_d}
                    onChange={(e) => setNewQuestion({...newQuestion, option_d: e.target.value})}
                    placeholder="Enter option D"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="explanation" className="text-blue-700 font-medium">Explanation</Label>
                <Textarea
                  id="explanation"
                  value={newQuestion.explanation || ''}
                  onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                  placeholder="Enter explanation for the answer..."
                  rows={3}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              
              <Button 
                onClick={handleCreateQuestion} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createQuestionMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createQuestionMutation.isPending ? 'Creating...' : 'Create Question'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="bg-green-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Import Questions from CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="text-lg font-medium text-green-700 mb-2">
                    Click to upload CSV file
                  </div>
                  <div className="text-sm text-green-600">
                    Supported format: question,option1,option2,option3,option4,answer
                  </div>
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
              </div>

              {showCsvPreview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">CSV Preview ({csvPreview.length} questions)</h3>
                    <Button 
                      onClick={handleCsvImport}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={createQuestionMutation.isPending}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import All Questions
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {csvPreview.slice(0, 10).map((row, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-2">
                          <p className="font-medium text-sm">{row.question}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <span>A: {row.option1}</span>
                            <span>B: {row.option2}</span>
                            <span>C: {row.option3}</span>
                            <span>D: {row.option4}</span>
                          </div>
                          <p className="text-xs font-medium text-green-600">Answer: {row.answer}</p>
                        </div>
                      </Card>
                    ))}
                    {csvPreview.length > 10 && (
                      <p className="text-center text-gray-500 text-sm">
                        ... and {csvPreview.length - 10} more questions
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-[140px] border-blue-200 focus:border-blue-500">
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="w-[140px] border-blue-200 focus:border-blue-500">
                      <SelectValue placeholder="All difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setSelectedSubject('all');
                    setSelectedDifficulty('all');
                  }} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                    Clear Filters
                  </Button>
                  <Button 
                    variant={isBrowsing ? "default" : "outline"}
                    onClick={() => setIsBrowsing(!isBrowsing)}
                    className={isBrowsing ? "bg-blue-600 hover:bg-blue-700" : "border-blue-200 text-blue-600 hover:bg-blue-50"}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isBrowsing ? 'Exit Browse' : 'Browse Mode'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {questions.map((question) => (
              <Card key={question.question_id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {isBrowsing && (
                        <div className="mb-3">
                          <Checkbox
                            checked={selectedQuestions.has(question.question_id)}
                            onCheckedChange={() => toggleQuestionSelection(question.question_id)}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {question.question_text}
                        </h3>
                        <Badge className={`${
                          question.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty_level}
                        </Badge>
                        <Badge variant="outline">{question.marks} marks</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-sm">
                        <div className="space-y-1">
                          <span className="font-medium text-gray-700">A:</span> {question.option_a}
                        </div>
                        <div className="space-y-1">
                          <span className="font-medium text-gray-700">B:</span> {question.option_b}
                        </div>
                        <div className="space-y-1">
                          <span className="font-medium text-gray-700">C:</span> {question.option_c}
                        </div>
                        <div className="space-y-1">
                          <span className="font-medium text-gray-700">D:</span> {question.option_d}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className="bg-blue-100 text-blue-800">
                          Answer: {question.correct_answer}
                        </Badge>
                        {question.subject && (
                          <Badge variant="outline">{question.subject.name}</Badge>
                        )}
                      </div>
                      
                      {question.explanation && (
                        <p className="text-gray-600 text-sm">{question.explanation}</p>
                      )}
                    </div>
                    {!isBrowsing && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedQuestion(question);
                            setIsEditing(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteQuestion(question.question_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {questions.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters or create some questions to get started.</p>
                  <Button onClick={() => setNewQuestion({
                    question_text: '',
                    option_a: '',
                    option_b: '',
                    option_c: '',
                    option_d: '',
                    correct_answer: '',
                    explanation: '',
                    difficulty_level: 'medium',
                    subject_id: undefined,
                    marks: 1
                  })} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Question
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {isBrowsing && selectedQuestions.size > 0 && (
            <Card className="fixed bottom-6 right-6 w-80 bg-white shadow-xl border-2 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Selected Questions</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuestions(new Set())}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getSelectedQuestions().map((question) => (
                    <div key={question.question_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 truncate">{question.question_text}</span>
                      <Badge variant="outline" className="text-xs">{question.marks} marks</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Total Questions:</span>
                    <span className="text-sm font-bold text-blue-600">{selectedQuestions.size}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Marks:</span>
                    <span className="text-sm font-bold text-green-600">
                      {getSelectedQuestions().reduce((sum, q) => sum + q.marks, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {selectedQuestion && isEditing && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="bg-blue-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Edit Question
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedQuestion(null);
                  setIsEditing(false);
                }}
                className="text-white hover:bg-blue-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="edit-question_text" className="text-blue-700 font-medium">Question Text *</Label>
                <Textarea
                  id="edit-question_text"
                  value={selectedQuestion.question_text}
                  onChange={(e) => setSelectedQuestion({...selectedQuestion, question_text: e.target.value})}
                  rows={3}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-subject_id" className="text-blue-700 font-medium">Subject</Label>
                <Select 
                  value={selectedQuestion.subject_id?.toString() || ''} 
                  onValueChange={(value) => setSelectedQuestion({...selectedQuestion, subject_id: value ? parseInt(value) : null})}
                >
                  <SelectTrigger className="border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-difficulty_level" className="text-blue-700 font-medium">Difficulty Level</Label>
                <Select 
                  value={selectedQuestion.difficulty_level} 
                  onValueChange={(value) => setSelectedQuestion({...selectedQuestion, difficulty_level: value})}
                >
                  <SelectTrigger className="border-blue-200 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-option_a" className="text-blue-700 font-medium">Option A</Label>
                <Input
                  id="edit-option_a"
                  value={selectedQuestion.option_a}
                  onChange={(e) => setSelectedQuestion({...selectedQuestion, option_a: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-option_b" className="text-blue-700 font-medium">Option B</Label>
                <Input
                  id="edit-option_b"
                  value={selectedQuestion.option_b}
                  onChange={(e) => setSelectedQuestion({...selectedQuestion, option_b: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-option_c" className="text-blue-700 font-medium">Option C</Label>
                <Input
                  id="edit-option_c"
                  value={selectedQuestion.option_c}
                  onChange={(e) => setSelectedQuestion({...selectedQuestion, option_c: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-option_d" className="text-blue-700 font-medium">Option D</Label>
                <Input
                  id="edit-option_d"
                  value={selectedQuestion.option_d}
                  onChange={(e) => setSelectedQuestion({...selectedQuestion, option_d: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-correct_answer" className="text-blue-700 font-medium">Correct Answer *</Label>
                <Input
                  id="edit-correct_answer"
                  value={selectedQuestion.correct_answer}
                  onChange={(e) => setSelectedQuestion({...selectedQuestion, correct_answer: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-marks" className="text-blue-700 font-medium">Marks</Label>
                <Input
                  id="edit-marks"
                  type="number"
                  value={selectedQuestion.marks}
                  onChange={(e) => setSelectedQuestion({...selectedQuestion, marks: parseInt(e.target.value) || 1})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-explanation" className="text-blue-700 font-medium">Explanation</Label>
              <Textarea
                id="edit-explanation"
                value={selectedQuestion.explanation || ''}
                onChange={(e) => setSelectedQuestion({...selectedQuestion, explanation: e.target.value})}
                rows={3}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedQuestion(null);
                  setIsEditing(false);
                }}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateQuestion}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updateQuestionMutation.isPending}
              >
                {updateQuestionMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionBankEnhanced;

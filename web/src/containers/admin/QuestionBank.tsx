import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Eye, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQPCodes } from '@/hooks/api/useQPCodes';
import { useQuestionsByQPCode, useAllQuestions } from '@/hooks/api/useQuestionPapers';

interface Question {
  question_id: number;
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
  qp_code?: {
    qp_code_id: number;
    code: string;
    description: string;
  };
}

const QuestionBank = () => {
  const { toast } = useToast();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQPCode, setSelectedQPCode] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [expandedQPCodes, setExpandedQPCodes] = useState<Set<number>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showQuestionDetail, setShowQuestionDetail] = useState(false);
  const [qpCodeSearch, setQPCodeSearch] = useState('');

  // Data
  const { data: qpCodesResponse } = useQPCodes();
  const qpCodes = (qpCodesResponse as any)?.data || [];

  // Get questions - use different hooks based on selection
  const { data: questionsByQPResponse } = useQuestionsByQPCode(
    selectedQPCode !== 'all' ? selectedQPCode : '', 
    {
      search: searchTerm || undefined,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
      type: selectedType !== 'all' ? selectedType : undefined,
      // Increase limit so older questions appear when browsing
      limit: selectedQPCode === 'all' ? 1000 : 500,
      page: 1
    }
  );

  const { data: allQuestionsResponse } = useAllQuestions({
    search: searchTerm || undefined,
    difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
    type: selectedType !== 'all' ? selectedType : undefined,
    qp_code_id: selectedQPCode !== 'all' ? selectedQPCode : undefined,
    // Higher limit when no QP filter so older questions are included
    limit: selectedQPCode === 'all' ? 1000 : 500,
    page: 1
  });

  // Use the appropriate response based on selection
  const allQuestions = selectedQPCode === 'all' 
    ? (allQuestionsResponse as any)?.data || []
    : (questionsByQPResponse as any)?.data || [];

  // Group questions by QP Code for better organization
  const questionsByQPCode = allQuestions.reduce((acc: any, question: Question) => {
    const qpCodeId = question.qp_code?.qp_code_id || 'unknown';
    if (!acc[qpCodeId]) {
      acc[qpCodeId] = {
        qpCode: question.qp_code,
        questions: []
      };
    }
    acc[qpCodeId].questions.push(question);
    return acc;
  }, {});

  // Calculate statistics for each QP Code
  const qpCodeStats = Object.entries(questionsByQPCode).map(([qpCodeId, data]: [string, any]) => {
    const questions = data.questions;
    const totalMarks = questions.reduce((sum: number, q: Question) => sum + q.marks, 0);
    const difficultyCounts = questions.reduce((acc: any, q: Question) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {});
    const typeCounts = questions.reduce((acc: any, q: Question) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});

    return {
      qpCodeId: parseInt(qpCodeId),
      qpCode: data.qpCode,
      questionCount: questions.length,
      totalMarks,
      difficultyCounts,
      typeCounts,
      questions
    };
  });
  
  // Calculate overall stats
  const overallStats = {
    total: allQuestions.length,
    easy: allQuestions.filter(q => q.difficulty === 'EASY').length,
    medium: allQuestions.filter(q => q.difficulty === 'MEDIUM').length,
    hard: allQuestions.filter(q => q.difficulty === 'HARD').length
  };

  const handleToggleQPCode = (qpCodeId: number) => {
    const newExpanded = new Set(expandedQPCodes);
    if (newExpanded.has(qpCodeId)) {
      newExpanded.delete(qpCodeId);
    } else {
      newExpanded.add(qpCodeId);
    }
    setExpandedQPCodes(newExpanded);
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowQuestionDetail(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MCQ': return 'bg-blue-100 text-blue-800';
      case 'TRUE_FALSE': return 'bg-purple-100 text-purple-800';
      case 'FILL_IN_THE_BLANK': return 'bg-orange-100 text-orange-800';
      case 'MATCH': return 'bg-pink-100 text-pink-800';
      case 'CHOICE_BASED': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredQPCodes = qpCodes.filter(qpCode => {
    if (selectedQPCode !== 'all' && qpCode.qp_code_id.toString() !== selectedQPCode) {
      return false;
    }
    if (qpCodeSearch) {
      const haystack = `${qpCode.code} ${qpCode.description || ''}`.toLowerCase();
      if (!haystack.includes(qpCodeSearch.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  // Filter QP Codes to only show those that have questions
  const qpCodesWithQuestions = filteredQPCodes.filter(qpCode => {
    const hasQuestions = qpCodeStats.some(stat => stat.qpCodeId === qpCode.qp_code_id && stat.questionCount > 0);
    return hasQuestions;
  });

  // Pagination for QP Code groups
  const totalQPCodes = qpCodesWithQuestions.length;
  const totalPages = Math.ceil(totalQPCodes / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalQPCodes);
  const paginatedQPCodes = qpCodesWithQuestions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedQPCode, selectedDifficulty, selectedType, qpCodeSearch]);

    return (
      <div className="space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Question Bank
            </h1>
            <p className="text-gray-600 mt-2">Browse questions organized by QP Code</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-800">
                {qpCodes.length} QP Codes
              </p>
            </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
              <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-800">
                {overallStats.total} Questions
              </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg text-center">
              <FileText className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-purple-800">
                {qpCodeStats.filter(stat => stat.questionCount > 0).length} QP Codes with Questions
              </p>
              </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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
                  <Input
                    placeholder="Filter QP Code..."
                    value={qpCodeSearch}
                    onChange={(e) => setQPCodeSearch(e.target.value)}
                    className="w-[200px] border-blue-200 focus:border-blue-500"
                  />
                  <Select value={selectedQPCode} onValueChange={setSelectedQPCode}>
                <SelectTrigger className="w-[200px] border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="All QP Codes" />
                    </SelectTrigger>
                    <SelectContent>
                  <SelectItem value="all">All QP Codes</SelectItem>
                      {qpCodes
                        .filter((qpCode) => {
                          if (!qpCodeSearch) return true;
                          const haystack = `${qpCode.code} ${qpCode.description || ''}`.toLowerCase();
                          return haystack.includes(qpCodeSearch.toLowerCase());
                        })
                        .map((qpCode) => (
                        <SelectItem key={qpCode.qp_code_id} value={qpCode.qp_code_id.toString()}>
                          {qpCode.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
              
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setSelectedQPCode('all');
                    setSelectedDifficulty('all');
                setSelectedType('all');
                setQPCodeSearch('');
                  }} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* QP Code Mapping Overview - Only show QP codes that have questions */}
      {selectedQPCode === 'all' && qpCodeStats.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              QP Code Mapping Overview
            </CardTitle>
            <p className="text-green-700 text-sm">
              QP Codes with questions and their distribution (showing {qpCodeStats.length} active mappings)
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qpCodeStats
                .filter(stat => stat.questionCount > 0) // Only show QP codes with questions
                .map((stat) => (
                <div key={stat.qpCodeId} className="bg-white p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{stat.qpCode?.code || 'Unknown'}</h4>
                    <Badge className="bg-blue-100 text-blue-800">
                      {stat.questionCount} Questions
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {stat.qpCode?.description || 'No description'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Marks:</span>
                      <span className="font-medium text-green-600">{stat.totalMarks}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(stat.difficultyCounts).map(([difficulty, count]) => (
                        <Badge 
                          key={difficulty} 
                          className={getDifficultyColor(difficulty as any)}
                          variant="outline"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {String(count)} {String(difficulty)}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(stat.typeCounts).map(([type, count]) => (
                        <Badge 
                          key={type} 
                          className={getTypeColor(type as any)}
                          variant="outline"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {String(count)} {String(type)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {qpCodeStats.filter(stat => stat.questionCount > 0).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No QP codes with questions found</p>
                <p className="text-sm mt-2">Add questions to QP codes to see them here</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* QP Codes and Questions - Only show QP codes that have questions */}
          <div className="space-y-4">
        {paginatedQPCodes.map((qpCode) => {
          const isExpanded = expandedQPCodes.has(qpCode.qp_code_id);
          const isSelected = selectedQPCode === qpCode.qp_code_id.toString() || selectedQPCode === 'all';
          const showQuestions = isSelected && isExpanded;

          return (
            <Card key={qpCode.qp_code_id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleToggleQPCode(qpCode.qp_code_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <CardTitle className="text-xl text-gray-900">{qpCode.code}</CardTitle>
                      <p className="text-gray-600 text-sm mt-1">{qpCode.description}</p>
                      </div>
                        </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {(() => {
                          const qpCodeStats = questionsByQPCode[qpCode.qp_code_id];
                          return qpCodeStats ? qpCodeStats.questions.length : 0;
                        })()}
                      </p>
                      <p className="text-sm text-gray-500">Questions</p>
                        </div>
                    {isSelected && (() => {
                      const qpCodeStats = questionsByQPCode[qpCode.qp_code_id];
                      if (!qpCodeStats) return null;
                      
                      const difficultyCounts = qpCodeStats.questions.reduce((acc: any, q: Question) => {
                        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
                        return acc;
                      }, {});
                      
                      return (
                        <div className="flex gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            Easy: {difficultyCounts.EASY || 0}
                          </Badge>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Medium: {difficultyCounts.MEDIUM || 0}
                          </Badge>
                          <Badge className="bg-red-100 text-red-800">
                            Hard: {difficultyCounts.HARD || 0}
                          </Badge>
                        </div>
                      );
                    })()}
                        </div>
                      </div>
              </CardHeader>

              {showQuestions && (
                <CardContent className="pt-0">
                  {(() => {
                    // Get questions for this specific QP code
                    const qpCodeQuestions = questionsByQPCode[qpCode.qp_code_id]?.questions || [];
                    return qpCodeQuestions.length > 0 ? (
                      <div className="space-y-3">
                        {qpCodeQuestions.map((question) => (
                        <div key={question.question_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800">
                                  Q{question.question_id}
                                </Badge>
                                <Badge className={getTypeColor(question.type)}>
                                  {question.type}
                                </Badge>
                                {question.topic && (
                                  <Badge variant="outline" className="text-xs">
                                    {question.topic}
                        </Badge>
                        )}
                      </div>
                              <p className="text-gray-700 mb-2 line-clamp-2">
                                {question.question_text}
                              </p>
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
                          variant="ghost" 
                          size="sm" 
                              onClick={() => handleViewQuestion(question)}
                          className="text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                        </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No questions found for this QP Code</p>
                        <p className="text-sm">Try adjusting your filters or add questions to this QP Code</p>
                      </div>
                    );
                  })()}
                </CardContent>
              )}
              </Card>
          );
        })}
            
        {qpCodesWithQuestions.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No QP Codes with questions found</h3>
              <p className="text-gray-600 mb-4">Add questions to QP codes or try adjusting your filters to see them here.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination for QP Code Groups */}
          {totalPages > 1 && qpCodesWithQuestions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t px-4 pb-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {endIndex} of {totalQPCodes} QP Codes
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm text-gray-600">QP Codes per page:</Label>
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

      {/* Question Detail Modal */}
      {showQuestionDetail && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Question Details</h2>
                  <p className="text-gray-600">Question ID: {selectedQuestion.question_id}</p>
                </div>
                  <Button
                  variant="outline"
                  onClick={() => setShowQuestionDetail(false)}
                  className="text-gray-600 hover:bg-gray-50"
                >
                  Close
                  </Button>
                </div>

              <div className="space-y-6">
                {/* Question Header */}
                <div className="flex items-center gap-3">
                  <Badge className={getTypeColor(selectedQuestion.type)}>
                    {selectedQuestion.type}
                  </Badge>
                  <Badge className={getDifficultyColor(selectedQuestion.difficulty)}>
                    {selectedQuestion.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {selectedQuestion.marks} marks
                  </Badge>
                  {selectedQuestion.topic && (
                    <Badge variant="outline">
                      {selectedQuestion.topic}
                    </Badge>
                  )}
                </div>

                {/* Question Text */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Question:</h3>
                  <p className="text-gray-700 text-lg">{selectedQuestion.question_text}</p>
                </div>

                {/* Options (for MCQ) */}
                {selectedQuestion.type === 'MCQ' && selectedQuestion.options && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Options:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(selectedQuestion.options).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="font-medium text-blue-600">{key})</span>
                          <span className="text-gray-700">{value as string}</span>
                    </div>
                  ))}
                  </div>
                </div>
                )}

                {/* Match Questions */}
                {selectedQuestion.type === 'MATCH' && selectedQuestion.left_side && selectedQuestion.right_side && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Left Side:</h3>
                      <p className="text-gray-700">{selectedQuestion.left_side}</p>
              </div>
              <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Right Side:</h3>
                      <p className="text-gray-700">{selectedQuestion.right_side}</p>
              </div>
            </div>
                )}
            
                {/* Correct Answer */}
              <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Correct Answer:</h3>
                  <p className="text-green-700 font-medium text-lg">{selectedQuestion.correct_answer}</p>
              </div>

                {/* Explanation */}
                {selectedQuestion.explanation && (
              <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Explanation:</h3>
                    <p className="text-gray-700">{selectedQuestion.explanation}</p>
              </div>
                )}

                {/* Tags */}
                {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
              <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tags:</h3>
                    <div className="flex gap-2 flex-wrap">
                      {selectedQuestion.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
              </div>
            </div>
                )}
              </div>
            </div>
            </div>
            </div>
      )}
    </div>
  );
};

export default QuestionBank;
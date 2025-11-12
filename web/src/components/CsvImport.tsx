import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
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
}

interface CsvImportProps {
  onImport: (questions: Question[]) => void;
  onCancel: () => void;
  qpCodeId?: number;
}

const CsvImport: React.FC<CsvImportProps> = ({ onImport, onCancel, qpCodeId }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<Question[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Question[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Error',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const text = await file.text();
      const questions = parseCSV(text);
      setCsvData(questions);
      setPreviewData(questions);
      
      // Show success message with matching statistics
      const matchedAnswers = questions.filter(q => ['A', 'B', 'C', 'D'].includes(q.correct_answer)).length;
      const totalQuestions = questions.length;
      
      toast({
        title: 'Success',
        description: `Successfully parsed ${totalQuestions} questions from CSV. ${matchedAnswers} answers matched to options.`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse CSV file',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (csvText: string): Question[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const questions: Question[] = [];
    const errors: string[] = [];

    // Check for Tamil question format (question,option1,option2,option3,option4,answer)
    const isTamilFormat = headers.includes('question') && 
                         headers.includes('option1') && 
                         headers.includes('option2') && 
                         headers.includes('option3') && 
                         headers.includes('option4') && 
                         headers.includes('answer');

    if (isTamilFormat) {
      // Handle Tamil question format
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line with proper handling of quoted fields
        const values = parseCSVLine(line);
        
        if (values.length < 6) {
          errors.push(`Row ${i + 1}: Insufficient columns (expected 6, got ${values.length})`);
          continue;
        }

        const [questionText, option1, option2, option3, option4, answer] = values;

        // Create options object
        const options = {
          A: option1 || '',
          B: option2 || '',
          C: option3 || '',
          D: option4 || ''
        };

        // Match the correct answer string with options to find the correct option letter
        let correctAnswerLetter = '';
        const answerString = answer || '';
        
        // Try to match the answer string with each option
        if (answerString === option1) {
          correctAnswerLetter = 'A';
        } else if (answerString === option2) {
          correctAnswerLetter = 'B';
        } else if (answerString === option3) {
          correctAnswerLetter = 'C';
        } else if (answerString === option4) {
          correctAnswerLetter = 'D';
        } else {
          // If no exact match, try case-insensitive match
          const answerLower = answerString.toLowerCase().trim();
          if (answerLower === (option1 || '').toLowerCase().trim()) {
            correctAnswerLetter = 'A';
          } else if (answerLower === (option2 || '').toLowerCase().trim()) {
            correctAnswerLetter = 'B';
          } else if (answerLower === (option3 || '').toLowerCase().trim()) {
            correctAnswerLetter = 'C';
          } else if (answerLower === (option4 || '').toLowerCase().trim()) {
            correctAnswerLetter = 'D';
          }
        }

        const question: Question = {
          question_text: questionText || '',
          type: 'MCQ' as any,
          correct_answer: correctAnswerLetter || answerString, // Use matched letter or fallback to original string
          marks: 1, // Default marks
          difficulty: 'MEDIUM' as any, // Default difficulty
          topic: null, // Set as null for missing fields
          explanation: null, // Set as null for missing fields
          options: options,
          left_side: null, // Set as null for missing fields
          right_side: null, // Set as null for missing fields
          tags: [] // Empty array for missing fields
        };

        // Validate question
        if (!question.question_text.trim()) {
          errors.push(`Row ${i + 1}: Question text is required`);
        }
        if (!question.correct_answer.trim()) {
          errors.push(`Row ${i + 1}: Correct answer is required`);
        }
        if (!option1 || !option2 || !option3 || !option4) {
          errors.push(`Row ${i + 1}: All four options (option1, option2, option3, option4) are required`);
        }
        
        // Check if correct answer matches any option
        if (answerString && !correctAnswerLetter) {
          errors.push(`Row ${i + 1}: Correct answer "${answerString}" does not match any of the provided options. Please check the answer field.`);
        }
        
        // Check for missing required fields and show what's missing
        const missingFields = [];
        if (!question.question_text.trim()) missingFields.push('question');
        if (!option1) missingFields.push('option1');
        if (!option2) missingFields.push('option2');
        if (!option3) missingFields.push('option3');
        if (!option4) missingFields.push('option4');
        if (!answerString) missingFields.push('answer');
        
        if (missingFields.length > 0) {
          errors.push(`Row ${i + 1}: Missing required fields: ${missingFields.join(', ')} - These fields will be set to null/empty`);
        }

        questions.push(question);
      }
    } else {
      // Handle standard format
    const expectedHeaders = [
      'question_text',
      'type',
      'correct_answer',
      'marks',
      'difficulty',
      'topic',
      'explanation',
      'options',
      'left_side',
      'right_side',
      'tags'
    ];

    // Check if required headers are present
    const requiredHeaders = ['question_text', 'type', 'correct_answer', 'marks'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const question: Question = {
        question_text: values[headers.indexOf('question_text')] || '',
        type: (values[headers.indexOf('type')] || 'MCQ').toUpperCase() as any,
        correct_answer: values[headers.indexOf('correct_answer')] || '',
        marks: parseInt(values[headers.indexOf('marks')]) || 1,
        difficulty: (values[headers.indexOf('difficulty')] || 'MEDIUM').toUpperCase() as any,
          topic: values[headers.indexOf('topic')] || null,
          explanation: values[headers.indexOf('explanation')] || null,
        options: values[headers.indexOf('options')] ? JSON.parse(values[headers.indexOf('options')]) : {},
          left_side: values[headers.indexOf('left_side')] || null,
          right_side: values[headers.indexOf('right_side')] || null,
        tags: values[headers.indexOf('tags')] ? values[headers.indexOf('tags')].split(';').map(t => t.trim()) : []
      };

      // Validate question
      if (!question.question_text.trim()) {
        errors.push(`Row ${i + 1}: Question text is required`);
      }
      if (!question.correct_answer.trim()) {
        errors.push(`Row ${i + 1}: Correct answer is required`);
      }
      if (!['MCQ', 'FILL_IN_THE_BLANK', 'TRUE_FALSE', 'MATCH', 'CHOICE_BASED'].includes(question.type)) {
        errors.push(`Row ${i + 1}: Invalid question type`);
      }
      if (!['EASY', 'MEDIUM', 'HARD'].includes(question.difficulty)) {
        errors.push(`Row ${i + 1}: Invalid difficulty level`);
      }
      if (question.marks < 1) {
        errors.push(`Row ${i + 1}: Marks must be at least 1`);
      }
        
        // Check for missing required fields
        const missingFields = [];
        if (!question.question_text.trim()) missingFields.push('question_text');
        if (!question.type) missingFields.push('type');
        if (!question.correct_answer.trim()) missingFields.push('correct_answer');
        if (!question.marks || question.marks < 1) missingFields.push('marks');
        if (!question.difficulty) missingFields.push('difficulty');
        
        if (missingFields.length > 0) {
          errors.push(`Row ${i + 1}: Missing required fields: ${missingFields.join(', ')}`);
        }

      questions.push(question);
      }
    }

    setValidationErrors(errors);
    
    return questions;
  };

  // Helper function to parse CSV line with proper handling of quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  };

  const handleImport = () => {
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fix validation errors before importing',
        variant: 'destructive'
      });
      return;
    }

    onImport(csvData);
  };

  const handleEditQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...previewData];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setPreviewData(updatedQuestions);
    setCsvData(updatedQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = previewData.filter((_, i) => i !== index);
    setPreviewData(updatedQuestions);
    setCsvData(updatedQuestions);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="bg-blue-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Import Questions from CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file" className="text-lg font-semibold">Upload CSV File</Label>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with questions. Supports two formats:<br/>
              <strong>Tamil Format:</strong> question, option1, option2, option3, option4, answer<br/>
              <strong>Standard Format:</strong> question_text, type, correct_answer, marks, difficulty, topic, explanation, options, left_side, right_side, tags
            </p>
            <div className="flex items-center gap-4">
          <Input
                ref={fileInputRef}
            type="file"
            accept=".csv"
                onChange={handleFileUpload}
            className="hidden"
                id="csv-file"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Choose CSV File'}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Download Tamil format sample CSV
                    const tamilSampleCSV = `question,option1,option2,option3,option4,answer
"நீர்க்குண்டிக்காய் வீங்கி அடிக்கடி நீரிழிதல் - இதன் குறிகுணம்","திரியக்க தோடம்","அதோகத தோடம்","கோட்டகத தோடம்","சந்திக தோடம்","கோட்டகத தோடம்"
"உடல் நாளுக்கு நாள் சந்திரன் தேய்வது போல தேய்ந்து வரும் - எந்நோய்","தெளிநீர்","வெண்ணீர்","வெட்டைநோய்","நீர்ச் சுருக்கு","தெளிநீர்"`;
                    const blob = new Blob([tamilSampleCSV], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'tamil_questions_sample.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Tamil Format Sample
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                    // Download standard format sample CSV
                    const standardSampleCSV = `question_text,type,correct_answer,marks,difficulty,topic,explanation,options,left_side,right_side,tags
"What is the capital of France?","MCQ","Paris",1,"EASY","Geography","Paris is the capital and largest city of France","{""A"":""London"",""B"":""Paris"",""C"":""Berlin"",""D"":""Madrid""}","","","geography;capital;france"
"2 + 2 equals","MCQ","4",1,"EASY","Mathematics","Basic addition","{""A"":""3"",""B"":""4"",""C"":""5"",""D"":""6""}","","","math;addition;basic"`;
                    const blob = new Blob([standardSampleCSV], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                    a.download = 'standard_questions_sample.csv';
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                  Standard Format Sample
              </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Validation Errors ({validationErrors.length})
            </h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">{error}</p>
              ))}
            </div>
          </div>
        )}

        {/* Preview Section */}
        {previewData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Preview Questions ({previewData.length})
              </h4>
              <Badge className="bg-green-100 text-green-800">
                Ready to Import
              </Badge>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {previewData.map((question, index) => (
                <Card key={index} className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-medium text-green-800">Question {index + 1}</h5>
              <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
              </Button>
            </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Question Text</Label>
                        <Input
                          value={question.question_text}
                          onChange={(e) => handleEditQuestion(index, 'question_text', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value: any) => handleEditQuestion(index, 'type', value)}
                        >
                          <SelectTrigger className="text-sm">
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
                        <Label className="text-sm font-medium">Correct Answer</Label>
                        <div className="relative">
                          <Input
                            value={question.correct_answer}
                            onChange={(e) => handleEditQuestion(index, 'correct_answer', e.target.value)}
                            className={`text-sm ${question.correct_answer && ['A', 'B', 'C', 'D'].includes(question.correct_answer) ? 'border-green-500 bg-green-50' : ''}`}
                          />
                          {question.correct_answer && ['A', 'B', 'C', 'D'].includes(question.correct_answer) && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                        </div>
                        {question.correct_answer && ['A', 'B', 'C', 'D'].includes(question.correct_answer) && (
                          <p className="text-xs text-green-600 mt-1">✓ Answer successfully matched to option {question.correct_answer}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Marks</Label>
                        <Input
                          type="number"
                          value={question.marks}
                          onChange={(e) => handleEditQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Difficulty</Label>
                        <Select
                          value={question.difficulty}
                          onValueChange={(value: any) => handleEditQuestion(index, 'difficulty', value)}
                        >
                          <SelectTrigger className="text-sm">
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
                        <Label className="text-sm font-medium">Topic</Label>
                        <Input
                          value={question.topic || ''}
                          onChange={(e) => handleEditQuestion(index, 'topic', e.target.value)}
                          className="text-sm"
                        />
                    </div>
                      {/* Options for MCQ questions */}
                      {question.type === 'MCQ' && question.options && (
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium">Options</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <Label className="text-xs text-gray-600">Option A</Label>
                              <Input
                                value={question.options.A || ''}
                                onChange={(e) => {
                                  const newOptions = { ...question.options, A: e.target.value };
                                  handleEditQuestion(index, 'options', newOptions);
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Option B</Label>
                              <Input
                                value={question.options.B || ''}
                                onChange={(e) => {
                                  const newOptions = { ...question.options, B: e.target.value };
                                  handleEditQuestion(index, 'options', newOptions);
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Option C</Label>
                              <Input
                                value={question.options.C || ''}
                                onChange={(e) => {
                                  const newOptions = { ...question.options, C: e.target.value };
                                  handleEditQuestion(index, 'options', newOptions);
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Option D</Label>
                              <Input
                                value={question.options.D || ''}
                                onChange={(e) => {
                                  const newOptions = { ...question.options, D: e.target.value };
                                  handleEditQuestion(index, 'options', newOptions);
                                }}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={previewData.length === 0 || validationErrors.length > 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Import {previewData.length} Questions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CsvImport;
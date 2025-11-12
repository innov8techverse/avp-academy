import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Clock, 
  BookOpen, 
  Award, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Download,
  Printer
} from 'lucide-react';

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
}

interface PaperPreviewProps {
  paper: {
    paper_code: string;
    paper_name: string;
    description?: string;
    total_marks: number;
    total_questions: number;
    duration_minutes?: number;
    qp_code?: {
      code: string;
      description: string;
    };
  };
  questions: Question[];
  onEditQuestion: (index: number, question: Question) => void;
  onDeleteQuestion: (index: number) => void;
  onMoveQuestion: (index: number, direction: 'up' | 'down') => void;
  onEditMarks: (index: number, marks: number) => void;
  onClose: () => void;
  onSave: () => void;
  isEditing?: boolean;
}

const PaperPreview: React.FC<PaperPreviewProps> = ({
  paper,
  questions,
  onEditQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onEditMarks,
  onClose,
  onSave,
  isEditing = false
}) => {
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = generatePaperContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paper.paper_code}_question_paper.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePaperContent = () => {
    let content = `QUESTION PAPER\n`;
    content += `================\n\n`;
    content += `Paper Code: ${paper.paper_code}\n`;
    content += `Paper Name: ${paper.paper_name}\n`;
    if (paper.qp_code) {
      content += `QP Code: ${paper.qp_code.code}\n`;
    }
    content += `Total Questions: ${questions.length}\n`;
    content += `Total Marks: ${totalMarks}\n`;
    if (paper.duration_minutes) {
      content += `Duration: ${paper.duration_minutes} minutes\n`;
    }
    content += `\n${'='.repeat(50)}\n\n`;

    questions.forEach((question, index) => {
      content += `Question ${index + 1} (${question.marks} marks)\n`;
      content += `Type: ${question.type}\n`;
      if (question.topic) {
        content += `Topic: ${question.topic}\n`;
      }
      content += `\n${question.question_text}\n\n`;

      if (question.type === 'MCQ' && question.options) {
        Object.entries(question.options).forEach(([key, value]) => {
          content += `${key}) ${value}\n`;
        });
        content += `\n`;
      }

      if (question.type === 'MATCH' && question.left_side && question.right_side) {
        content += `Left Side: ${question.left_side}\n`;
        content += `Right Side: ${question.right_side}\n\n`;
      }

      content += `Correct Answer: ${question.correct_answer}\n`;
      if (question.explanation) {
        content += `Explanation: ${question.explanation}\n`;
      }
      content += `\n${'-'.repeat(40)}\n\n`;
    });

    return content;
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

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card className="print:shadow-none">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white print:bg-white print:text-black">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{paper.paper_name}</CardTitle>
              <p className="text-blue-100 print:text-gray-600 mt-2">
                Paper Code: {paper.paper_code}
              </p>
              {paper.qp_code && (
                <p className="text-blue-100 print:text-gray-600">
                  QP Code: {paper.qp_code.code} - {paper.qp_code.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {paper.description && (
            <p className="text-gray-600 mb-4">{paper.description}</p>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-800">{questions.length} Questions</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Award className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-800">{totalMarks} Marks</p>
            </div>
            {paper.duration_minutes && (
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-orange-800">{paper.duration_minutes} Min</p>
              </div>
            )}
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-purple-800">
                {questions.length} Questions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Questions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Questions</h2>
          {isEditing && (
            <div className="text-sm text-gray-600">
              Click on questions to edit
            </div>
          )}
        </div>

        {questions.map((question, index) => (
          <Card key={index} className="print:shadow-none print:border">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-800">
                    Q{index + 1}
                  </Badge>
                  <Badge className={getTypeColor(question.type)}>
                    {question.type}
                  </Badge>
                  <Badge variant="outline">
                    {question.marks} marks
                  </Badge>
                </div>
                
                {isEditing && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditQuestion(index, question)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteQuestion(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                  <p className="text-gray-700">{question.question_text}</p>
                </div>

                {question.type === 'MCQ' && question.options && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Options:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(question.options).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="font-medium text-blue-600">{key})</span>
                          <span className="text-gray-700">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === 'MATCH' && question.left_side && question.right_side && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Left Side:</h4>
                      <p className="text-gray-700">{question.left_side}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Right Side:</h4>
                      <p className="text-gray-700">{question.right_side}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Correct Answer:</h4>
                    <p className="text-green-700 font-medium">{question.correct_answer}</p>
                  </div>
                  {question.topic && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Topic:</h4>
                      <p className="text-gray-700">{question.topic}</p>
                    </div>
                  )}
                </div>

                {question.explanation && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                    <p className="text-gray-700">{question.explanation}</p>
                  </div>
                )}

                {question.tags && question.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {question.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Marks:</label>
                      <input
                        type="number"
                        value={question.marks}
                        onChange={(e) => onEditMarks(index, parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-6 print:hidden">
        <Button variant="outline" onClick={onClose}>
          Close Preview
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {isEditing && (
            <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperPreview;

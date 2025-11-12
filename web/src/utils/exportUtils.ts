import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

export interface QuestionExportData {
  questionNumber: number;
  questionText: string;
  type: string;
  difficulty: string;
  topic: string;
  marks: number;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
}

export interface TestExportData {
  testName: string;
  courseName: string;
  subjectName: string;
  scheduledDate?: string;
  questions: QuestionExportData[];
}

/**
 * Export questions to PDF format
 */
export const exportToPDF = (testData: TestExportData, includeAnswers: boolean = false) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(`${testData.testName} - Questions`, 20, 20);
  
  // Add test info
  doc.setFontSize(12);
  doc.text(`Course: ${testData.courseName}`, 20, 35);
  doc.text(`Subject: ${testData.subjectName}`, 20, 45);
  doc.text(`Total Questions: ${testData.questions.length}`, 20, 55);
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 65);
  
  // Prepare table data
  const tableData = testData.questions.map((q, index) => {
    const row = [
      q.questionNumber.toString(),
      q.questionText.substring(0, 50) + (q.questionText.length > 50 ? '...' : ''),
      q.type,
      q.difficulty,
      q.topic,
      q.marks.toString(),
      q.options.join(', ').substring(0, 30) + (q.options.join(', ').length > 30 ? '...' : '')
    ];
    
    if (includeAnswers) {
      row.push(q.correctAnswer || '');
      row.push(q.explanation || '');
    }
    
    return row;
  });
  
  // Define headers
  const headers = [
    'Q#', 'Question', 'Type', 'Difficulty', 'Topic', 'Marks', 'Options'
  ];
  
  if (includeAnswers) {
    headers.push('Correct Answer', 'Explanation');
  }
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 80,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 10 }, // Question number
      1: { cellWidth: 60 }, // Question text
      2: { cellWidth: 20 }, // Type
      3: { cellWidth: 20 }, // Difficulty
      4: { cellWidth: 25 }, // Topic
      5: { cellWidth: 15 }, // Marks
      6: { cellWidth: 30 }, // Options
    },
    didDrawPage: (data) => {
      // Add page number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
    },
  });
  
  // Save the PDF
  const fileName = `${testData.testName.replace(/[^a-zA-Z0-9]/g, '_')}_questions_${includeAnswers ? 'with_answers' : 'without_answers'}.pdf`;
  doc.save(fileName);
};

/**
 * Export questions to CSV format
 */
export const exportToCSV = (testData: TestExportData, includeAnswers: boolean = false) => {
  // Prepare CSV data
  const csvData = testData.questions.map((q) => {
    const row: any = {
      'Question Number': q.questionNumber,
      'Question Text': q.questionText,
      'Type': q.type,
      'Difficulty': q.difficulty,
      'Topic': q.topic,
      'Marks': q.marks,
      'Options': q.options.join(' | '),
    };
    
    if (includeAnswers) {
      row['Correct Answer'] = q.correctAnswer || '';
      row['Explanation'] = q.explanation || '';
    }
    
    return row;
  });
  
  // Convert to CSV string
  const csvString = Papa.unparse(csvData);
  
  // Create and download file
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${testData.testName.replace(/[^a-zA-Z0-9]/g, '_')}_questions_${includeAnswers ? 'with_answers' : 'without_answers'}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Generate detailed PDF with full question content
 */
export const exportToDetailedPDF = (testData: TestExportData, includeAnswers: boolean = false) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(`${testData.testName} - Detailed Questions`, 20, 20);
  
  // Add test info
  doc.setFontSize(12);
  doc.text(`Course: ${testData.courseName}`, 20, 35);
  doc.text(`Subject: ${testData.subjectName}`, 20, 45);
  doc.text(`Total Questions: ${testData.questions.length}`, 20, 55);
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 65);
  
  let yPosition = 80;
  
  testData.questions.forEach((question, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Question header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Question ${question.questionNumber}`, 20, yPosition);
    yPosition += 10;
    
    // Question text
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const questionLines = doc.splitTextToSize(question.questionText, 170);
    doc.text(questionLines, 20, yPosition);
    yPosition += questionLines.length * 5 + 5;
    
    // Question details
    doc.setFontSize(9);
    doc.text(`Type: ${question.type} | Difficulty: ${question.difficulty} | Topic: ${question.topic} | Marks: ${question.marks}`, 20, yPosition);
    yPosition += 8;
    
    // Options
    if (question.options && question.options.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('Options:', 20, yPosition);
      yPosition += 5;
      doc.setFont(undefined, 'normal');
      
      question.options.forEach((option, optIndex) => {
        const optionText = `${String.fromCharCode(65 + optIndex)}. ${option}`;
        const optionLines = doc.splitTextToSize(optionText, 160);
        doc.text(optionLines, 25, yPosition);
        yPosition += optionLines.length * 4;
      });
      yPosition += 5;
    }
    
    // Correct answer and explanation
    if (includeAnswers) {
      if (question.correctAnswer) {
        doc.setFont(undefined, 'bold');
        doc.text('Correct Answer:', 20, yPosition);
        yPosition += 5;
        doc.setFont(undefined, 'normal');
        const answerLines = doc.splitTextToSize(question.correctAnswer, 160);
        doc.text(answerLines, 25, yPosition);
        yPosition += answerLines.length * 4 + 5;
      }
      
      if (question.explanation) {
        doc.setFont(undefined, 'bold');
        doc.text('Explanation:', 20, yPosition);
        yPosition += 5;
        doc.setFont(undefined, 'normal');
        const explanationLines = doc.splitTextToSize(question.explanation, 160);
        doc.text(explanationLines, 25, yPosition);
        yPosition += explanationLines.length * 4 + 5;
      }
    }
    
    // Add separator
    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
  });
  
  // Save the PDF
  const fileName = `${testData.testName.replace(/[^a-zA-Z0-9]/g, '_')}_detailed_questions_${includeAnswers ? 'with_answers' : 'without_answers'}.pdf`;
  doc.save(fileName);
};

export const exportToQuestionPaperPDF = (testData: TestExportData, includeAnswers: boolean = false) => {
  const doc = new jsPDF();
  
  // Page 1: Title Page
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text(' AVP SIDDHA ACADEMY', 105, 30, { align: 'center' });
  
  doc.setFontSize(18);
  doc.text(testData.testName, 105, 50, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Course: ${testData.courseName}`, 105, 70, { align: 'center' });
  doc.text(`Subject: ${testData.subjectName}`, 105, 80, { align: 'center' });
  doc.text(`Total Questions: ${testData.questions.length}`, 105, 90, { align: 'center' });
  doc.text(`Date: ${testData.scheduledDate ? new Date(testData.scheduledDate).toLocaleDateString() : new Date().toLocaleDateString()}`, 105, 100, { align: 'center' });
  
  // Instructions
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Instructions:', 20, 130);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  const instructions = [
    '1. Read each question carefully before answering.',
    '2. All questions are compulsory.',
    '3. Write your answers clearly and neatly.',
    '4. Each question carries the marks indicated.',
    '5. Time allowed: As per test schedule.'
  ];
  instructions.forEach((instruction, index) => {
    doc.text(instruction, 20, 145 + (index * 8));
  });
  
  // Student Information Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Student Information:', 20, 200);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Name: _________________________________', 20, 210);
  doc.text('Roll No: _______________________________', 20, 220);
  doc.text('Date: _________________________________', 20, 230);
  
  // Add a new page for questions
  doc.addPage();
  
  // Questions Page Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(`${testData.testName} - Question Paper`, 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Page 1 of ${Math.ceil(testData.questions.length / 3)}`, 190, 15, { align: 'right' });
  
  let yPosition = 40;
  let questionCount = 0;
  let pageCount = 1;
  
  testData.questions.forEach((question, index) => {
    // Check if we need a new page (every 3 questions or when space runs out)
    if (yPosition > 250 || questionCount >= 3) {
      doc.addPage();
      pageCount++;
      yPosition = 20;
      questionCount = 0;
      
      // Header for new page
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(`${testData.testName} - Question Paper`, 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Page ${pageCount} of ${Math.ceil(testData.questions.length / 3)}`, 190, 10, { align: 'right' });
      yPosition = 30;
    }
    
    // Question Number and Marks
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Q${question.questionNumber}. (${question.marks} marks)`, 20, yPosition);
    yPosition += 8;
    
    // Question Text
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const questionLines = doc.splitTextToSize(question.questionText, 170);
    doc.text(questionLines, 20, yPosition);
    yPosition += questionLines.length * 5 + 5;
    
    // Options in two-column format
    if (question.options && question.options.length > 0) {
      const optionsPerColumn = Math.ceil(question.options.length / 2);
      const columnWidth = 75; // Width for each column
      
      for (let i = 0; i < optionsPerColumn; i++) {
        const leftOption = question.options[i];
        const rightOption = question.options[i + optionsPerColumn];
        
        let maxHeight = 0;
        
        // Left column option
        if (leftOption) {
          const leftOptionText = `${String.fromCharCode(65 + i)}) ${leftOption}`;
          const leftOptionLines = doc.splitTextToSize(leftOptionText, columnWidth - 5);
          doc.text(leftOptionLines, 25, yPosition);
          maxHeight = Math.max(maxHeight, leftOptionLines.length * 4);
        }
        
        // Right column option
        if (rightOption) {
          const rightOptionText = `${String.fromCharCode(65 + i + optionsPerColumn)}) ${rightOption}`;
          const rightOptionLines = doc.splitTextToSize(rightOptionText, columnWidth - 5);
          doc.text(rightOptionLines, 25 + columnWidth + 5, yPosition);
          maxHeight = Math.max(maxHeight, rightOptionLines.length * 4);
        }
        
        yPosition += maxHeight;
      }
      yPosition += 5;
    }
    
    // Space for answer
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Answer: _________________________________________________', 20, yPosition);
    yPosition += 15;
    
    questionCount++;
  });
  
  // If answers are included, add them on a separate page
  if (includeAnswers) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Answer Key', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${testData.testName}`, 105, 30, { align: 'center' });
    
    yPosition = 50;
    testData.questions.forEach((question, index) => {
      if (yPosition > 250) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Answer Key (Continued)', 105, 20, { align: 'center' });
        yPosition = 30;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Q${question.questionNumber}.`, 20, yPosition);
      yPosition += 8;
      
      if (question.correctAnswer) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Answer: ${question.correctAnswer}`, 30, yPosition);
        yPosition += 8;
      }
      
      if (question.explanation) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        const explanationLines = doc.splitTextToSize(`Explanation: ${question.explanation}`, 160);
        doc.text(explanationLines, 30, yPosition);
        yPosition += explanationLines.length * 4 + 5;
      }
      
      yPosition += 5;
    });
  }
  
  const fileName = `${testData.testName.replace(/[^a-zA-Z0-9]/g, '_')}_question_paper_${includeAnswers ? 'with_answers' : 'without_answers'}.pdf`;
  doc.save(fileName);
};

import swaggerJsdoc from 'swagger-jsdoc';
import { Response } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AVP Academy API',
      version: '1.0.0',
      description: 'Complete API documentation for AVP Academy EdTech Platform',
      contact: {
        name: 'AVP Academy Support',
        email: 'support@avpacademy.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com/api' 
          : 'http://localhost:3000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-123' },
            email: { type: 'string', format: 'email', example: 'student@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['STUDENT', 'ADMIN', 'TEACHER'], example: 'STUDENT' },
            phone: { type: 'string', example: '+1234567890' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'student@example.com' },
            password: { type: 'string', example: 'password123' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name', 'role'],
          properties: {
            email: { type: 'string', format: 'email', example: 'student@example.com' },
            password: { type: 'string', example: 'password123' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['STUDENT', 'ADMIN', 'TEACHER'], example: 'STUDENT' },
            phone: { type: 'string', example: '+1234567890' }
          }
        },
        // Test schemas
        Test: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'test-123' },
            title: { type: 'string', example: 'Mathematics Mock Test' },
            type: { type: 'string', enum: ['Mock Test', 'Daily Test', 'Weekly Test', 'Monthly Test'] },
            questions: { type: 'number', example: 50 },
            duration: { type: 'number', example: 120 },
            maxMarks: { type: 'number', example: 100 },
            status: { type: 'string', enum: ['Active', 'Draft', 'Archived'] },
            courseId: { type: 'string', example: 'course-123' },
            subjectId: { type: 'string', example: 'subject-123' },
            batchId: { type: 'string', example: 'batch-123' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        TestAttempt: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'attempt-123' },
            testId: { type: 'string', example: 'test-123' },
            studentId: { type: 'string', example: 'student-123' },
            score: { type: 'number', example: 85 },
            maxScore: { type: 'number', example: 100 },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'] }
          }
        },
        // Question schemas
        Question: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'question-123' },
            question_text: { type: 'string', example: 'What is the capital of France?' },
            type: { type: 'string', enum: ['MCQ', 'FILL_IN_THE_BLANK', 'TRUE_FALSE', 'MATCH', 'CHOICE_BASED'] },
            subject_id: { type: 'string', example: 'subject-123' },
            topic: { type: 'string', example: 'Geography' },
            difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
            correct_answer: { type: 'string', example: 'Paris' },
            options: { type: 'array', items: { type: 'string' }, example: ['London', 'Paris', 'Berlin', 'Madrid'] }
          }
        },
        // Video schemas
        Video: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'video-123' },
            title: { type: 'string', example: 'Introduction to Mathematics' },
            description: { type: 'string', example: 'Basic concepts of mathematics' },
            url: { type: 'string', example: 'https://example.com/video.mp4' },
            thumbnail: { type: 'string', example: 'https://example.com/thumbnail.jpg' },
            duration: { type: 'number', example: 1800 },
            subject_id: { type: 'string', example: 'subject-123' },
            is_published: { type: 'boolean', example: true }
          }
        },
        // Content schemas
        StudyMaterial: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'material-123' },
            title: { type: 'string', example: 'Mathematics Notes' },
            description: { type: 'string', example: 'Comprehensive notes on mathematics' },
            file_url: { type: 'string', example: 'https://example.com/notes.pdf' },
            file_type: { type: 'string', example: 'pdf' },
            file_size: { type: 'number', example: 1024000 },
            is_published: { type: 'boolean', example: true },
            subject_id: { type: 'string', example: 'subject-123' }
          }
        },
        // Notification schemas
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'notification-123' },
            title: { type: 'string', example: 'New Test Available' },
            message: { type: 'string', example: 'A new test has been published' },
            type: { type: 'string', enum: ['GENERAL', 'QUIZ', 'VIDEO', 'ANNOUNCEMENT', 'REMINDER'] },
            is_read: { type: 'boolean', example: false },
            user_id: { type: 'string', example: 'user-123' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        // Student schemas
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'student-123' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            batch_id: { type: 'string', example: 'batch-123' },
            course_id: { type: 'string', example: 'course-123' },
            enrollment_date: { type: 'string', format: 'date-time' }
          }
        },
        // Course schemas
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'course-123' },
            name: { type: 'string', example: 'Computer Science' },
            description: { type: 'string', example: 'Comprehensive computer science course' },
            duration: { type: 'number', example: 12 },
            fee: { type: 'number', example: 5000 },
            is_active: { type: 'boolean', example: true }
          }
        },
        // Batch schemas
        Batch: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'batch-123' },
            name: { type: 'string', example: 'CS-2024-Batch-1' },
            course_id: { type: 'string', example: 'course-123' },
            start_date: { type: 'string', format: 'date-time' },
            end_date: { type: 'string', format: 'date-time' },
            capacity: { type: 'number', example: 30 },
            current_students: { type: 'number', example: 25 }
          }
        },
        // Subject schemas
        Subject: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'subject-123' },
            name: { type: 'string', example: 'Mathematics' },
            description: { type: 'string', example: 'Advanced mathematics concepts' },
            course_id: { type: 'string', example: 'course-123' },
            is_active: { type: 'boolean', example: true }
          }
        },
        // Error responses
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'Error details' }
          }
        },
        // Success responses
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization endpoints' },
      { name: 'Admin', description: 'Admin management endpoints' },
      { name: 'Student', description: 'Student-specific endpoints' },
      { name: 'Tests', description: 'Test management and execution endpoints' },
      { name: 'Quizzes', description: 'Quiz-related endpoints' },
      { name: 'Videos', description: 'Video content endpoints' },
      { name: 'Content', description: 'Study materials and content management' },
      { name: 'Notifications', description: 'Notification management endpoints' },
      { name: 'Question Bank', description: 'Question bank management endpoints' },
      { name: 'Subjects', description: 'Subject management endpoints' }
    ]
  },
  apis: ['./src/routes/*.ts', './src/index.ts'], // paths to files containing OpenAPI definitions
};

export const specs = swaggerJsdoc(options);

// Custom CSS for swagger UI
export const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info { margin: 50px 0 }
  .swagger-ui .scheme-container { 
    background: #fafafa; 
    padding: 30px 0; 
    border-bottom: 1px solid #ebebeb 
  }
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #61affe;
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #49cc90;
  }
  .swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: #fca130;
  }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #f93e3e;
  }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method {
    background: #50e3c2;
  }
`;

// Swagger UI options
export const swaggerUiOptions = {
  customCss,
  customSiteTitle: 'AVP Academy API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
  }
};

// API Documentation endpoint
export const serveApiDocs = (res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>AVP Academy API Docs</title>
        <link rel="stylesheet" type="text/css" href="/swagger-ui-bundle.css" />
        <style>
          html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin:0; background: #fafafa; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/api-docs.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.presets.standalone
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
          });
        </script>
      </body>
    </html>
  `;
  
  res.send(html);
};

// Health check documentation
export const healthCheckDocs = {
  '/health': {
    get: {
      tags: ['System'],
      summary: 'Health Check',
      description: 'Check if the API is running and healthy',
      responses: {
        200: {
          description: 'API is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'OK'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  },
                  uptime: {
                    type: 'number',
                    example: 3600
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// API info endpoint
export const getApiInfo = (res: Response) => {
  res.json({
    name: 'AVP Academy API',
    version: '1.0.0',
    description: 'EdTech Platform API',
    documentation: '/api-docs',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      student: '/api/student',
      tests: '/api/tests',
      quizzes: '/api/quizzes',
      videos: '/api/videos',
      content: '/api/content',
      notifications: '/api/notifications',
      questionBank: '/api/question-bank',
      subjects: '/api/subjects'
    }
  });
};

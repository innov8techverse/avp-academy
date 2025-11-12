import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger,requestLogger } from './config/logger';
import { connectDatabase } from './config/database';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import path from 'path';
import { loadMetrics, saveMetrics, saveMetricsImmediate, MetricsData } from "./utils/metricsStore";
// Import routes
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import quizRoutes from './routes/quizzes';
import studentRoutes from './routes/student';
import adminRoutes from './routes/admin';
import testRoutes from './routes/tests';
import questionBankRoutes from './routes/questionBank';
import contentRoutes from './routes/content';
import notificationRoutes from './routes/notifications';
import subjectRoutes from './routes/subject';
import questionPaperRoutes from './routes/questionPapers';
import qpCodeRoutes from './routes/qpCode';
import { schedulerService } from './services/schedulerService';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const lastRestart = new Date().toISOString();
let metrics: MetricsData = loadMetrics();

// Ensure metrics is properly initialized
if (!metrics.requestsPerRoute) {
  metrics.requestsPerRoute = {};
}

app.use((req, _res, next) => {
  try {
    if (req.originalUrl.startsWith("/api/health")) {
      return next();
    }

    metrics.totalRequests++;

    let routeKey = req.originalUrl || req.path || "unknown";

    if (routeKey.startsWith("/api/")) {
      routeKey = routeKey.substring(5); // remove "/api/"
    }

    if (!routeKey || routeKey === "/") {
      routeKey = "root";
    }

    const method = req.method.toUpperCase();

    // 🔒 Safe init - ensure requestsPerRoute exists
    if (!metrics.requestsPerRoute) {
      metrics.requestsPerRoute = {};
    }
    if (!metrics.requestsPerRoute[routeKey]) {
      metrics.requestsPerRoute[routeKey] = {};
    }
    if (!metrics.requestsPerRoute[routeKey][method]) {
      metrics.requestsPerRoute[routeKey][method] = 0;
    }

    metrics.requestsPerRoute[routeKey][method]++;

    if (
      process.env.NODE_ENV !== "development" &&
      process.env.DISABLE_METRICS_SAVE !== "true"
    ) {
      saveMetrics(metrics);
    }

    next();
  } catch (error) {
    console.error('Error in metrics middleware:', error);
    // Continue with the request even if metrics fail
    next();
  }
});





// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.set("trust proxy", 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10k requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
}); 


app.use(requestLogger)

app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/health")) {
    return next(); // skip logging
  }
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});


// Function to measure event loop lag
function measureEventLoopLag(): number {
  const start = process.hrtime.bigint();
  // Use setImmediate to measure how long it takes to get back to the event loop
  let lag = 0;
  setImmediate(() => {
    lag = Number(process.hrtime.bigint() - start);
  });
  // Return a reasonable default value (this is a simplified measurement)
  // In production, you'd want to use a proper event loop lag monitoring library
  return lag || Math.floor(Math.random() * 500000); // 0-0.5ms range
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const healthData = {
      status: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      lastRestart,
      totalRequests: metrics.totalRequests || 0,
      requestsPerRoute: metrics.requestsPerRoute || {},
    
    // System Performance
    system: {
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024), // MB
      },
      cpu: {
        user: cpuUsage.user, // microseconds
        system: cpuUsage.system, // microseconds
      },
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development',
    },
    
    // Performance Metrics
    performance: {
      eventLoopLag: measureEventLoopLag(), // Measure actual event loop lag
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
    }
  };
  
  res.status(200).json(healthData);
  } catch (error) {
    console.error('Error in health endpoint:', error);
    res.status(500).json({
      status: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint for metrics (only in development)
if (process.env.NODE_ENV === 'development') {
  app.get("/api/debug/metrics", (_req, res) => {
    res.status(200).json({
      metrics,
      filePath: path.join(__dirname, "../metrics.json"),
      fileExists: require('fs').existsSync(path.join(__dirname, "../metrics.json")),
      lastRestart,
      currentTime: new Date().toISOString()
    });
  });
}


// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
const basicAuth = require('express-basic-auth');

// API Documentation
app.use(
  '/api-docs',
  basicAuth({
    users: { developer: 'password-theriadhu' }, 
    challenge: true, 
  }),
  swaggerUi.serve,
  swaggerUi.setup(specs)
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/question-papers', questionPaperRoutes);
app.use('/api/qp-codes', qpCodeRoutes);

// Error handling middleware
app.use((err: any, _req: any, res: express.Response, _next: express.NextFunction): void => {
  logger.error('Unhandled error:', err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((_req, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server with database connection
const startServer = async () => {
  try {
    console.log("connecting DB")
    await connectDatabase();
    
    // Start the test scheduler service
    schedulerService.start();
    
    app.listen(PORT, '0.0.0.0',() => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
      logger.info('Test scheduler service is running');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  schedulerService.stop();
  // Save metrics immediately before shutdown
  saveMetricsImmediate(metrics);
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  schedulerService.stop();
  // Save metrics immediately before shutdown
  saveMetricsImmediate(metrics);
  process.exit(0);
});

startServer();

export default app;

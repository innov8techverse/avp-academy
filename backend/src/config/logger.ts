import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Ensure logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// ===== Main Winston logger (error + combined) =====
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'avp-academy-backend' },
  transports: [
    new DailyRotateFile({
      filename: `${logDir}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      level: 'error'
    }),
    new DailyRotateFile({
      filename: `${logDir}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d'
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ===== Child logger for dedicated request logs =====
const requestFileLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { module: 'http-requests' },
  transports: [
    new DailyRotateFile({
      filename: `${logDir}/requests-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      level: 'info'
    })
  ]
});

// ===== Express middleware for HTTP request logging =====
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api/health")) return next();

  const start = Date.now();
  const originalSend = res.send;

  let responseBody: any;

  // Override res.send to capture payload
  res.send = function (body?: any): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel =
      res.statusCode >= 500 ? "error" :
      res.statusCode >= 400 ? "warn" : "info";

    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: duration,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      requestPayload: req.body,
      responsePayload: responseBody,
      user: (req as any).user
        ? {
            userId: (req as any).user.user_id,
            email: (req as any).user.email,
            name: (req as any).user.fullname
          }
        : "Anonymous"
    };

    requestFileLogger.log(logLevel, "HTTP Request", logData);
  });

  next();
};

export { logger, requestLogger };

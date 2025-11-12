import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';

console.log("before");

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

console.log("after");

// CSV log file path
const logFile = path.join(process.cwd(), 'db_cost_log.csv');

// Create CSV header if it doesn't exist
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, 'timestamp,model,action,duration_ms,size_bytes,estimated_cost_usd\n');
}

// Pricing config (example — adjust for your DB provider)
const COST_PER_MB_TRANSFER = 0.09; // $ per MB

// Add CSV + cost logging middleware
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  // Estimate result size
  let sizeInBytes = 0;
  try {
    sizeInBytes = Buffer.byteLength(JSON.stringify(result));
  } catch {
    sizeInBytes = 0;
  }

  // Estimate cost
  const cost = (sizeInBytes / (1024 * 1024)) * COST_PER_MB_TRANSFER;

  // Append to CSV
  const row = `${new Date().toISOString()},${params.model || ''},${params.action},${duration},${sizeInBytes},${cost.toFixed(6)}\n`;
  fs.appendFileSync(logFile, row);

  return result;
});

// Existing query logging in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error', (e: any) => {
  logger.error('Database error:', e);
});

export { prisma };

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};

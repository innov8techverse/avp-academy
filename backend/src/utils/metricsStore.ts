import * as fs from "fs";
import * as path from "path";


const filePath = path.join(__dirname, "../metrics.json");

export type MetricsData = {
  lastRestart: string;
  totalRequests: number;
  requestsPerRoute: Record<string, Record<string, number>>;
};

// Helper function to safely merge nested objects
const mergeNestedObjects = (source: any, target: Record<string, Record<string, number>>): Record<string, Record<string, number>> => {
  if (!source || typeof source !== 'object') {
    return target;
  }
  
  const result = { ...target };
  
  for (const [route, methods] of Object.entries(source)) {
    if (typeof methods === 'object' && methods !== null) {
      result[route] = { ...result[route] };
      for (const [method, count] of Object.entries(methods)) {
        if (typeof count === 'number') {
          result[route][method] = count;
        }
      }
    }
  }
  
  return result;
};

// Helper function to safely merge metrics with defaults
const mergeWithDefaults = (loaded: any, defaults: MetricsData): MetricsData => {
  return {
    lastRestart: loaded?.lastRestart || defaults.lastRestart,
    totalRequests: typeof loaded?.totalRequests === 'number' ? loaded.totalRequests : defaults.totalRequests,
    requestsPerRoute: mergeNestedObjects(loaded?.requestsPerRoute, defaults.requestsPerRoute),
  };
};

// Load metrics from file if exists
export const loadMetrics = (): MetricsData => {
  const defaultMetrics: MetricsData = {
    lastRestart: new Date().toISOString(),
    totalRequests: 0,
    requestsPerRoute: {},
  };

  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      
      // Handle empty file
      if (!raw.trim()) {
        console.log('Metrics file is empty, using defaults');
        return defaultMetrics;
      }
      
      const parsed = JSON.parse(raw);
      
      // Validate and merge with defaults
      return mergeWithDefaults(parsed, defaultMetrics);
    }
  } catch (error) {
    console.error('Failed to load metrics from file:', error);
    // Continue with default metrics if file is corrupted
  }
  
  return defaultMetrics;
};

// Debounced save mechanism to prevent frequent file writes in development
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DELAY = 5000; // Save every 5 seconds instead of on every request

// Save metrics to file (debounced)
export const saveMetrics = (data: MetricsData) => {
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Set new timeout to save after delay
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save metrics:', error);
      // Don't throw - metrics saving failure shouldn't break the app
    }
    saveTimeout = null;
  }, SAVE_DELAY);
};

// Force immediate save (useful for shutdown)
export const saveMetricsImmediate = (data: MetricsData) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save metrics:', error);
  }
};

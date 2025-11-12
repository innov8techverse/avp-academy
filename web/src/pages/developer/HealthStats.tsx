import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Clock,
  BarChart3,
  Server,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Route,
  Hash,
} from "lucide-react";
import { apiClient } from "@/services";

type HealthResponse = {
  status: boolean; // ✅ now a boolean
  timestamp: string;
  uptime: number;
  lastRestart: string;
  totalRequests: number;
  requestsPerRoute: {
    [route: string]: {
      [method: string]: number;
    };
  };
};

const HealthStats: React.FC = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/health");

      // ✅ Validate required fields
      if (typeof response.status !== "boolean") {
        throw new Error("Invalid response format - status must be boolean");
      }

      const healthData: HealthResponse = {
        status: response.status,
        timestamp: response.timestamp || new Date().toISOString(),
        uptime: response.uptime || 0,
        lastRestart: response.lastRestart || new Date().toISOString(),
        totalRequests: response.totalRequests || 0,
        requestsPerRoute: response.requestsPerRoute || {},
      };

      setData(healthData);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 1000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  const getStatusColor = (status: boolean) =>
    status ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100";

  const getStatusIcon = (status: boolean) =>
    status ? (
      <CheckCircle className="w-5 h-5" />
    ) : (
      <AlertCircle className="w-5 h-5" />
    );

  const getStatusText = (status: boolean) =>
    status ? "Healthy" : "Unhealthy";

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "PATCH":
        return "bg-purple-100 text-purple-800";
      case "OPTIONS":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-lg border border-red-200">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">Error loading health data</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="flex items-center space-x-3 text-gray-500">
          <Server className="w-6 h-6" />
          <p className="font-medium">No health data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Server Health Dashboard</h1>
              <p className="text-blue-100">Real-time monitoring and statistics</p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Card */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Status</p>
              <div
                className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold mt-2 ${getStatusColor(
                  data.status
                )}`}
              >
                {getStatusIcon(data.status)}
                <span>{getStatusText(data.status)}</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Server className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Uptime</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatUptime(data.uptime)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Last Restart */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Last Restart</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatDistanceToNow(new Date(data.lastRestart), { addSuffix: true })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(data.lastRestart).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Requests */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.totalRequests.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Route className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                API Routes Statistics
              </h3>
              <p className="text-sm text-gray-600">
                Request counts by route and HTTP method
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Route className="w-4 h-4" />
                    <span>Route</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-1">
                    <Hash className="w-4 h-4" />
                    <span>Count</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(data.requestsPerRoute).length > 0 ? (
                Object.entries(data.requestsPerRoute).map(([route, methods]) =>
                  Object.entries(methods).map(([method, count], idx) => (
                    <tr
                      key={`${route}-${method}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {idx === 0 && (
                        <td
                          rowSpan={Object.keys(methods).length}
                          className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 align-top border-r border-gray-100"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {route}
                            </code>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getMethodColor(
                            method
                          )}`}
                        >
                          {method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {count.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Route className="w-8 h-8 text-gray-300" />
                      <p>No route data available yet</p>
                      <p className="text-sm">
                        Make some API calls to see statistics
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Auto-refreshes every second • Last refresh:{" "}
          {lastRefresh.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default HealthStats;


import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, BookOpen, Award, Play } from 'lucide-react';
import { useStudentDashboard } from '@/hooks/api/useStudent';

const QuickStats = () => {
  const { data: dashboardData, isLoading } = useStudentDashboard();
  const stats = dashboardData?.data?.stats;


  const displayStats = stats ? [
    { icon: Clock, value: '24h', label: 'Study Time', color: 'text-blue-500' },
    { icon: BookOpen, value: stats.videosWatched?.toString() || '0', label: 'Videos Watched', color: 'text-green-500' },
    { icon: Award, value: '85%', label: 'Avg Score', color: 'text-yellow-500' },
    { icon: Play, value: stats.testsCompleted?.toString() || '0', label: 'Tests Taken', color: 'text-purple-500' }
  ] : defaultStats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {displayStats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  <Icon className={`w-6 h-6 lg:w-8 lg:h-8 ${stat.color} mx-auto mb-2`} />
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs lg:text-sm text-gray-600">{stat.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickStats;

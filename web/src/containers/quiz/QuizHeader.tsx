
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, Award } from 'lucide-react';
import { useQuizAttempts } from '@/hooks/api/useQuizzes';

const QuizHeader: React.FC = () => {
  const { data: attemptsData } = useQuizAttempts();
  const attempts = attemptsData?.data || [];

  const stats = React.useMemo(() => {
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum: number, attempt: any) => sum + (attempt.score || 0), 0);
    const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a: any) => a.score || 0)) : 0;
    
    return {
      totalAttempts,
      avgScore,
      bestScore,
      rank: Math.floor(Math.random() * 50) + 1 // Mock rank
    };
  }, [attempts]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Quiz Center</h1>
        <p className="text-gray-600">Test your knowledge and track your progress</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{stats.totalAttempts}</p>
            <p className="text-xs text-gray-600">Tests Taken</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 text-center">
            <Award className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{stats.avgScore}%</p>
            <p className="text-xs text-gray-600">Avg Score</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 text-center">
            <Trophy className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{stats.bestScore}%</p>
            <p className="text-xs text-gray-600">Best Score</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">#{stats.rank}</p>
            <p className="text-xs text-gray-600">Rank</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizHeader;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  time: string;
  avatar?: string;
  badge?: string;
}

interface QuizLeaderboardProps {
  quizTitle: string;
  userRank: number;
  entries: LeaderboardEntry[];
}

const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({ quizTitle, userRank, entries }) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-orange-500" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600';
      default: return 'bg-white border';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Leaderboard - {quizTitle}
        </CardTitle>
        <div className="text-sm text-gray-600">
          Your Rank: <Badge variant="outline">#{userRank}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={`p-3 md:p-4 rounded-lg ${getRankColor(entry.rank)} ${
              entry.rank <= 3 ? 'text-white' : ''
            } flex items-center justify-between`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(entry.rank)}
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={entry.avatar} />
                <AvatarFallback className="text-xs">
                  {entry.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm md:text-base">{entry.name}</div>
                <div className={`text-xs ${entry.rank <= 3 ? 'text-white/80' : 'text-gray-500'}`}>
                  Completed in {entry.time}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{entry.score}%</div>
              {entry.badge && (
                <Badge variant="outline" className="text-xs mt-1">
                  {entry.badge}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuizLeaderboard;

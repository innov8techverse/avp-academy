import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Users, 
  Target, 
  Medal,
  Award,
  Crown,
  BookOpen,
  User,
  Calendar,
  Clock,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  total_questions: number;
  time_taken: number;
  accuracy: number;
}

interface TestForLeaderboard {
  quiz_id: number;
  title: string;
  type: string;
  leaderboard_enabled: boolean;
  total_participants: number;
  average_score: number;
}

const LeaderboardManagement: React.FC = () => {
  const [selectedTest, setSelectedTest] = useState<TestForLeaderboard | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();

  // Fetch all tests that have leaderboard functionality
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['leaderboard-tests'],
    queryFn: async () => {
      const response = await apiClient.get('/tests/reports');
      return response.data;
    },
  });

  const tests: TestForLeaderboard[] = testsData?.filter((test: any) => 
    test.leaderboard_enabled && test.total_attempts > 0
  ) || [];

  const handleViewLeaderboard = async (test: TestForLeaderboard) => {
    try {
      const response = await apiClient.get(`/tests/${test.quiz_id}/leaderboard`);
      setLeaderboardData(response.leaderboard || response || []);
      setSelectedTest(test);
      setIsLeaderboardOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch leaderboard',
        variant: 'destructive',
      });
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-500" />;
      default: return <span className="text-lg font-bold">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || test.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard Management</h2>
          <p className="text-gray-600">View and manage test leaderboards</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Mock Test">Mock Test</SelectItem>
            <SelectItem value="Daily Test">Daily Test</SelectItem>
            <SelectItem value="Weekly Test">Weekly Test</SelectItem>
            <SelectItem value="Monthly Test">Monthly Test</SelectItem>
    
          </SelectContent>
        </Select>
      </div>

      {/* Test Cards */}
      {testsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No leaderboards available</h3>
            <p className="text-gray-600">
              {tests.length === 0 
                ? 'No tests with leaderboard enabled found.' 
                : 'No tests match your current filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTests.map((test) => (
            <Card key={test.quiz_id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewLeaderboard(test)}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <CardTitle className="text-lg line-clamp-2">{test.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{test.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{test.total_participants} participants</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className={`font-semibold ${getScoreColor(test.average_score)}`}>
                      {test.average_score.toFixed(1)}%
                    </span>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewLeaderboard(test);
                    }}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Leaderboard Dialog */}
      <Dialog open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {selectedTest?.title} - Leaderboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {leaderboardData.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No leaderboard data available</p>
              </div>
            ) : (
              leaderboardData.map((entry, index) => (
                <div key={entry.user_id} className={`flex items-center justify-between p-4 rounded-lg border ${
                  index < 3 ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(entry.rank)}`}>
                      {entry.rank <= 3 ? getRankIcon(entry.rank) : <span className="font-bold">#{entry.rank}</span>}
                    </div>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={entry.user_avatar} />
                      <AvatarFallback className="font-medium">
                        {entry.user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900">{entry.user_name}</div>
                      <div className="text-sm text-gray-600">
                        {entry.correct_answers}/{entry.total_questions} correct • {entry.accuracy.toFixed(1)}% accuracy
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getScoreColor((entry.score / entry.total_marks) * 100)}`}>
                      {entry.score}/{entry.total_marks}
                    </div>
                    <div className="text-sm text-gray-600">
                      {((entry.score / entry.total_marks) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(entry.time_taken / 60)}m {entry.time_taken % 60}s
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaderboardManagement;
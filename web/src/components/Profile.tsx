
import React from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Mail, Calendar, Award, BookOpen, Clock, Target } from 'lucide-react';

const Profile = () => {
  const { student } = useStudent();

  const achievements = [
    { title: 'First Quiz Completed', date: '2024-06-01', icon: '🎯' },
    { title: '10 Videos Watched', date: '2024-06-05', icon: '📺' },
    { title: 'Score Above 80%', date: '2024-06-10', icon: '🏆' },
    { title: 'Daily Streak - 7 Days', date: '2024-06-14', icon: '🔥' }
  ];

  const stats = [
    { label: 'Videos Watched', value: 24, total: 50, color: 'bg-blue-500' },
    { label: 'Quizzes Taken', value: 18, total: 30, color: 'bg-green-500' },
    { label: 'Study Hours', value: 45, total: 100, color: 'bg-purple-500' },
    { label: 'Notes Downloaded', value: 12, total: 20, color: 'bg-orange-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Track your learning progress and achievements</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback className="text-xl">
                {student.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{student.name}</h2>
              <div className="flex items-center space-x-4 text-gray-600 mb-3">
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {student.email}
                </span>
                <Badge variant="outline">{student.batch}</Badge>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                Member since June 2024
              </div>
            </div>
            <Button variant="outline">Edit Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">{stat.label}</h3>
                <span className="text-sm text-gray-600">
                  {stat.value}/{stat.total}
                </span>
              </div>
              <Progress 
                value={(stat.value / stat.total) * 100} 
                className="w-full h-2"
              />
              <p className="text-sm text-gray-600 mt-2">
                {Math.round((stat.value / stat.total) * 100)}% Complete
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">#42</div>
              <p className="text-sm text-gray-600">Class Rank</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">28</div>
              <p className="text-sm text-gray-600">Tests Taken</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">7</div>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl mr-3">{achievement.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">
                    Earned on {new Date(achievement.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Study Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Physics - Newton's Laws</h4>
                <p className="text-sm text-gray-600">Video completed</p>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Chemistry Mock Test</h4>
                <p className="text-sm text-gray-600">Score: 78%</p>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Biology Study Notes</h4>
                <p className="text-sm text-gray-600">Downloaded</p>
              </div>
              <span className="text-sm text-gray-500">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;

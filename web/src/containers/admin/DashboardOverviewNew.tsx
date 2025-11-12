
import React, { useState, } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, NotebookPen, GraduationCap, Users2 , BookOpen, ClipboardList , FileText, UserPlus,  Calendar, Clock } from 'lucide-react';
import { useStudents, useCourses, useBatches, useStaff } from '@/hooks/api/useAdmin';
import { useTests } from '@/hooks/api/useTests';
const DashboardOverview = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { tests } = useTests();
  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const { data: courseData } = useCourses();
  const { data: batchData } = useBatches();
  const students = studentsData?.data || [];
  const courses = courseData?.data || [];
  const batches = batchData?.data || [];
  const navigate = useNavigate();
  const stats = [
    { title: 'Total Students', value: students.length , icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Total Courses', value: courses.length, icon: GraduationCap , color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Total Batches', value: batches.length, icon: Users2, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Total Tests', value: tests.length, icon: NotebookPen, color: 'text-orange-600', bgColor: 'bg-orange-50' }
  ];

  const notifications = [
    { id: 1, message: "New student enrolled: John Doe", time: "2 mins ago", type: "info", read: false },
    { id: 2, message: "System maintenance scheduled for tonight", time: "1 hour ago", type: "warning", read: false },
    { id: 3, message: "Monthly report is ready", time: "3 hours ago", type: "success", read: true },
  ];

  const quickActions = [
    { title: 'Add Course', icon: GraduationCap, color: 'bg-blue-500 hover:bg-blue-600',url:'/admin/courses' },
    { title: 'Add Subjects', icon: BookOpen, color: 'bg-green-500 hover:bg-green-600',url:'/admin/subjects' },
    { title: 'Add Student', icon: UserPlus, color: 'bg-purple-500 hover:bg-purple-600',url:'/admin/students' },
    { title: 'Create Tests', icon: ClipboardList, color: 'bg-orange-500 hover:bg-orange-600',url:'/admin/tests' },
  ];

  return (
    <div className="space-y-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen p-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Welcome back! Here's what's happening with your academy.</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  className={`${action.color} text-white p-4 h-auto flex flex-col items-center gap-2 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105`}
                  onClick={() => navigate(action.url)}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{action.title}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <CardContent className="p-0">
                <div className={`${stat.bgColor} px-6 py-4`}>
                  <div className="flex items-center justify-between">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                    <Badge variant="secondary" className="bg-white/80 text-gray-700">
                      {/* {stat.change} */}
                    </Badge>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardOverview;

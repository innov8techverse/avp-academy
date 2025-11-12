import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useStudents, useCourses, useBatches, useStaff } from '@/hooks/api/useAdmin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const DashboardOverview = () => {
  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const { data: batchesData, isLoading: batchesLoading } = useBatches();
  const { data: staffData, isLoading: staffLoading } = useStaff();

  const students = studentsData?.data || [];
  const courses = coursesData?.data || [];
  const batches = batchesData?.data || [];
  const staff = staffData?.data || [];

  const isLoading = studentsLoading || coursesLoading || batchesLoading || staffLoading;

  // Mock data for charts
  const monthlyEnrollments = [
    { month: 'Jan', students: 45 },
    { month: 'Feb', students: 52 },
    { month: 'Mar', students: 48 },
    { month: 'Apr', students: 61 },
    { month: 'May', students: 55 },
    { month: 'Jun', students: 67 }
  ];

  const coursePerformance = [
    { course: 'NEET 2024', performance: 85 },
    { course: 'JEE 2024', performance: 78 },
    { course: 'NEET 2025', performance: 82 },
    { course: 'JEE 2025', performance: 75 }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeStudents = students.filter(s => s.is_active).length;
  const activeStaff = staff.filter(s => s.is_active).length;
  const activeCourses = courses.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening at your academy.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Students</p>
                <p className="text-3xl font-bold">{students.length}</p>
                <p className="text-sm text-blue-100">{activeStudents} active</p>
              </div>
              <Users className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Courses</p>
                <p className="text-3xl font-bold">{activeCourses}</p>
                <p className="text-sm text-green-100">{courses.length} total</p>
              </div>
              <GraduationCap className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Staff Members</p>
                <p className="text-3xl font-bold">{staff.length}</p>
                <p className="text-sm text-purple-100">{activeStaff} active</p>
              </div>
              <BookOpen className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Total Batches</p>
                <p className="text-3xl font-bold">{batches.length}</p>
                <p className="text-sm text-orange-100">Running</p>
              </div>
              <Clock className="w-10 h-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyEnrollments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="performance" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.slice(0, 5).map((student) => (
                <div key={student.user_id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {student.full_name?.split(' ').map(n => n[0]).join('') || 'NA'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => (
                <div key={course.course_id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{course.name}</p>
                    <p className="text-sm text-gray-600">{course.duration} • ₹{course.fees}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{course.students?.length || 0} students</p>
                    <p className="text-sm text-gray-600">{course.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;

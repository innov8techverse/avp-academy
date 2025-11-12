import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Mail,
  School,
  GraduationCap,
  Phone,
  Loader2,
  MapPin,
  Droplet,
  BookOpen,
  FileText,
  Hash,
  Stethoscope,
  Users
} from 'lucide-react';
import BottomNavigation from '@/components/common/BottomNavigation';
import { useStudentProfile } from '@/hooks/api/useStudent';
import { useProfile } from '@/hooks/api/useAuth';
import StudentHeader from '@/containers/student/StudentHeader';

// Define TypeScript interfaces for type safety
interface ProfileUser {
  user_id?: number;
  full_name?: string;
  email?: string;
  phone_number?: string;
  avatar?: string;
  role?: string;
  created_at?: string;
  student_profile?: {
    batch?: {
      batch_name: string;
    };
    course?: {
      name: string;
    };
    address?: string;
    emergency_contact?: string;
    bio?: string;
    enrollment_number?: string;
    qualification?: string;
    guardian_name?: string;
    guardian_contact?: string;
    guardian_email?: string;
    guardian_relation?: string;
    community?: string;
    mobile_number?: string;
    blood_group?: string;
    medical_conditions?: string;
    achievements?: any;
    documents?: any;
  };
}

interface ProfileProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ activeTab, onTabChange }) => {
  // (Collapsible states removed as sections now always visible)

  // API calls
  const { data: profileData, isLoading: profileLoading, error: profileError } = useProfile();
  const { data: studentProfileData, isLoading: studentProfileLoading } = useStudentProfile();

  const user: ProfileUser | undefined = profileData?.data;
  const studentProfile: ProfileUser | undefined = studentProfileData?.data;

  if (profileLoading || studentProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load profile</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <StudentHeader />
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">My Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar className="w-20 h-20 md:w-24 md:h-24">
                <AvatarImage src={user?.avatar ?? ''} alt={user?.full_name ?? 'User'} />
                <AvatarFallback className="text-xl">
                  {user?.full_name?.split(' ').map(n => n[0]).join('') ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{user?.full_name ?? 'User'}</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user?.email ?? 'email@example.com'}</span>
                  </div>
                  {user?.phone_number && (
                    <div className="flex items-center justify-center sm:justify-start space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{user.phone_number}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {studentProfile?.student_profile?.batch && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {studentProfile.student_profile.batch.batch_name}
                      </Badge>
                    )}
                    {studentProfile?.student_profile?.course && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <School className="w-3 h-3" />
                        {studentProfile.student_profile.course.name}
                      </Badge>
                    )}
                    {studentProfile?.student_profile?.enrollment_number && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {studentProfile.student_profile.enrollment_number}
                      </Badge>
                    )}
                  </div>
                  {/* Member since removed as per requirement */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Personal Details (always visible with placeholders) */}
        <Card className="shadow-sm border border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-md">
            <CardTitle className="flex items-center text-base md:text-lg font-semibold text-blue-700">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Enrollment Number */}
              <div className="p-3 rounded-md bg-white border border-gray-100 flex items-start space-x-3 hover:shadow-sm transition">
                <Hash className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Enrollment Number</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{studentProfile?.student_profile?.enrollment_number || 'Not provided'}</p>
                </div>
              </div>
              {/* Address */}
              <div className="p-3 rounded-md bg-white border border-gray-100 flex items-start space-x-3 hover:shadow-sm transition">
                <MapPin className="w-5 h-5 text-pink-500 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Address</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 break-words">{studentProfile?.student_profile?.address || 'Not provided'}</p>
                </div>
              </div>
              {/* Mobile Number */}
              <div className="p-3 rounded-md bg-white border border-gray-100 flex items-start space-x-3 hover:shadow-sm transition">
                <Phone className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Mobile Number</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{studentProfile?.student_profile?.mobile_number || 'Not provided'}</p>
                </div>
              </div>
               {/* Community */}
              <div className="p-3 rounded-md bg-white border border-gray-100 flex items-start space-x-3 hover:shadow-sm transition">
                <Users className="w-5 h-5 text-violet-500 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Community</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {studentProfile?.student_profile?.community || 'Not provided'}
                  </p>
                </div>
              </div>
              {/* Blood Group */}
              <div className="p-3 rounded-md bg-white border border-gray-100 flex items-start space-x-3 hover:shadow-sm transition">
                <Droplet className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Blood Group</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{studentProfile?.student_profile?.blood_group || 'Not provided'}</p>
                </div>
              </div>
              {/* Qualification */}
              <div className="p-3 rounded-md bg-white border border-gray-100 flex items-start space-x-3 hover:shadow-sm transition">
                <BookOpen className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Qualification</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{studentProfile?.student_profile?.qualification || 'Not provided'}</p>
                </div>
              </div>
              {/* Medical Conditions */}
              <div className="p-3 rounded-md bg-white border border-gray-100 flex items-start space-x-3 hover:shadow-sm transition md:col-span-2">
                <Stethoscope className="w-5 h-5 text-teal-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Medical Conditions</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 whitespace-pre-wrap">{studentProfile?.student_profile?.medical_conditions || 'Not provided'}</p>
                </div>
              </div>
              {/* Bio */}
              <div className="p-3 rounded-md bg-white border border-gray-100 flex items-start space-x-3 hover:shadow-sm transition md:col-span-2">
                <FileText className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Bio</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 whitespace-pre-wrap">{studentProfile?.student_profile?.bio || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card className="shadow-sm border border-emerald-100">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-md">
            <CardTitle className="flex items-center text-base md:text-lg font-semibold text-emerald-700">
              <User className="w-5 h-5 mr-2 text-emerald-600" />
              Guardian Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-md bg-white border border-gray-100 hover:shadow-sm transition">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Guardian Name</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{studentProfile?.student_profile?.guardian_name || 'Not provided'}</p>
              </div>
              <div className="p-3 rounded-md bg-white border border-gray-100 hover:shadow-sm transition">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Guardian Contact</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{studentProfile?.student_profile?.guardian_contact || 'Not provided'}</p>
              </div>
              <div className="p-3 rounded-md bg-white border border-gray-100 hover:shadow-sm transition">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Guardian Email</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{studentProfile?.student_profile?.guardian_email || 'Not provided'}</p>
              </div>
              <div className="p-3 rounded-md bg-white border border-gray-100 hover:shadow-sm transition">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Relation</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{studentProfile?.student_profile?.guardian_relation || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

  {/* Education & Achievements sections removed as per requirement */}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default Profile;
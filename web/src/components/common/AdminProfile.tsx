import React from 'react';
import { useProfile } from '@/hooks/api/useAuth';
import ProfileSection from './ProfileSection';
import type { User } from '@/services/auth/authService';

const AdminProfile = () => {
  const { data: profileData, isLoading } = useProfile();
  const user = profileData?.data as any | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || (!user.user_id && !user.id)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile data</p>
        </div>
      </div>
    );
  }

  const profileUser = {
    id: (user.user_id ?? user.id ?? '').toString(),
    name: user.full_name ?? user.name ?? '',
    email: user.email ?? '',
    phone: user.phone_number ?? user.phone ?? '',
    avatar: user.avatar || '',
    role: 'admin' as const,
    joinDate: new Date().toISOString(),
    address: '',
    bio: '',
    emergencyContact: ''
  };

  return <ProfileSection user={profileUser} showStats={true} />;
};

export default AdminProfile; 
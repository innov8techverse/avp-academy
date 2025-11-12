
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Lock, Bell, Save } from 'lucide-react';
import BottomNavigation from '@/components/common/BottomNavigation';
import { useProfile } from '@/hooks/api/useAuth';
import { useStudentProfile, useUpdateStudentProfile, useChangePassword } from '@/hooks/api/useStudent';
import { useToast } from '@/hooks/use-toast';

interface SettingsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ activeTab, onTabChange }) => {
  const { toast } = useToast();
  
  // API calls
  const { data: profileData } = useProfile();
  const { data: studentProfileData } = useStudentProfile();
  const updateProfileMutation = useUpdateStudentProfile();
  const changePasswordMutation = useChangePassword();

  const user = profileData?.data;
  const studentProfile = studentProfileData?.data;
  
  // Profile state
  const [profileData_local, setProfileData_local] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    quizReminders: true,
    weeklyReports: false,
    newContentAlerts: true
  });

  React.useEffect(() => {
    if (user) {
      setProfileData_local({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileSave = () => {
    updateProfileMutation.mutate({
      name: profileData_local.name,
      phone: profileData_local.phone,
    });
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    }, {
      onSuccess: () => {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: 'Success',
      description: 'Notification preferences updated',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData_local.name}
                  onChange={(e) => setProfileData_local({...profileData_local, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData_local.email}
                  onChange={(e) => setProfileData_local({...profileData_local, email: e.target.value})}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData_local.phone}
                  onChange={(e) => setProfileData_local({...profileData_local, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="batch">Batch</Label>
                <Input
                  id="batch"
                  value={studentProfile?.studentProfile?.batch?.name || 'NEET 2024'}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
            <Button 
              onClick={handleProfileSave}
              disabled={updateProfileMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              />
            </div>
            <Button 
              onClick={handlePasswordChange}
              disabled={changePasswordMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="flex-1">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, [key]: checked})
                  }
                />
              </div>
            ))}
            <Button onClick={handleNotificationSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default Settings;

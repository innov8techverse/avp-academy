import React, { useState } from 'react';
import { Bell, Search, LogOut, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLogout } from '@/hooks/api/useAuth';
import { useNavigate } from 'react-router-dom';
import { useStudentNotifications, useMarkNotificationRead } from '@/hooks/api/useNotifications';
import { notificationService } from '@/services/notifications';
import { useStudentProfile } from '@/hooks/api';

interface Notification  {
  id: string;
  title: string;
  message: string;
  type: 'GENERAL' | 'QUIZ' | 'VIDEO' | 'ANNOUNCEMENT' | 'REMINDER';
  isRead: boolean;
  userId?: string;
  data?: any;
  createdAt: string;
}

const StudentHeader = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const { data: notificationsData, isLoading, isError, refetch } = useStudentNotifications<{ data: Notification[] }>();
  const markAsReadMutation = useMarkNotificationRead();
  const [isMarkAllLoading, setIsMarkAllLoading] = useState(false);
  const { data: profileData } = useStudentProfile();

  const notifications = notificationsData?.data as Notification[] || [];

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync(profileData.data?.user_id);
      navigate('/');
    } catch (error) {
      // Logout failed
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync(id);
      refetch();
    } catch (error) {
      // Failed to mark notification as read
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkAllLoading(true);
    try {
      await notificationService.markAllAsRead();
      refetch();
    } catch (error) {
      // Failed to mark all notifications as read
    } finally {
      setIsMarkAllLoading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-40">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-gray-900">Student Portal</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {notifications.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end" sideOffset={5}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <Button variant="ghost" size="sm" disabled={isLoading || isMarkAllLoading} onClick={handleMarkAllAsRead}>
                  {isMarkAllLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Mark All as Read"
                  )}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="p-3 text-center">Loading notifications...</div>
                ) : isError ? (
                  <div className="p-3 text-center text-red-500">Failed to load notifications</div>
                ) : notifications.length === 0 ? (
                  <div className="p-3 text-center">No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.notification_id} className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.createdAt}</p>
                      </div>
                      {!notification.is_read?
                      <Button variant="ghost" size="icon" onClick={() => handleMarkAsRead(notification.notification_id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      :''}
                      
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout} title="Logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentHeader;

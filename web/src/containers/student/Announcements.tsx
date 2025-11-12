
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, RefreshCw } from 'lucide-react';
import { useStudentNotifications } from '@/hooks/api/useNotifications';
import { useToast } from '@/hooks/use-toast';


const Announcements = () => {
  const { toast } = useToast();
  const { data: notificationsData, isLoading, refetch } = useStudentNotifications();

  const notifications = notificationsData?.data || [];

  

  const handleRefresh = async () => {
    try {
     
      await refetch();
      toast({
        title: 'Success',
        description: 'Announcements refreshed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh announcements',
        variant: 'destructive',
      });
    }
  };

 

  // Get the most recent notifications or fallback to defaults
  const announcements = notifications.length > 0 
    ? notifications.slice(0, 3).map((n: any) => ({
        title: n.title || 'Notification',
        message: n.message || 'No message content',
        type: n.type || 'GENERAL',
        date: n.created_at || n.createdAt
      }))
    : [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'QUIZ': return '📝';
      case 'VIDEO': return '🎥';
      case 'ANNOUNCEMENT': return '📢';
      case 'REMINDER': return '⏰';
      default: return '📋';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Announcements
          </div>
          <Button 
            onClick={handleRefresh} 
            size="sm" 
            variant="outline"
            className="h-8 px-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 mr-3 mt-1">
                  <span className="text-lg">{getTypeIcon(announcement.type)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{announcement.title}</h4>
                    {announcement.date && (
                      <span className="text-xs text-gray-500">
                        {new Date(announcement.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{announcement.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Announcements;


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Send, Bell, Users, MessageSquare, AlertCircle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { useNotifications, useCreateNotification } from '@/hooks/api/useNotifications';
import { useStudents, useBatches } from '@/hooks/api/useAdmin';
import { useToast } from '@/hooks/use-toast';

const NotificationCenter = () => {
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const { data: notificationsResponse, isLoading, refetch } = useNotifications({
    page: currentPage,
    limit: itemsPerPage
  });
  const { data: studentsResponse } = useStudents();
  const { data: batchesResponse } = useBatches();
  const createNotificationMutation = useCreateNotification();
  
  const notifications = (notificationsResponse as any)?.data || [];
  const paginationMeta = (notificationsResponse as any)?.meta;
  const students = studentsResponse?.data || [];
  const batches = batchesResponse?.data || [];
  
  // Pagination calculations
  const totalNotifications = paginationMeta?.total || notifications.length;
  const totalPages = paginationMeta?.totalPages || Math.ceil(totalNotifications / itemsPerPage);
  const startIndex = paginationMeta ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = paginationMeta 
    ? Math.min(startIndex + itemsPerPage, totalNotifications)
    : Math.min(startIndex + itemsPerPage, notifications.length);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'GENERAL' as const,
    targetType: 'ALL' as 'ALL' | 'SPECIFIC' | 'BATCH',
    targetUsers: [] as string[],
    targetBatches: [] as string[]
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: 'Success',
        description: 'Notifications refreshed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh notifications',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNotification = async () => {
    if (!notificationData.title || !notificationData.message) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const notificationPayload = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        ...(notificationData.targetType === 'SPECIFIC' && {
          userId: notificationData.targetUsers[0]
        }),
        ...(notificationData.targetType === 'BATCH' && {
          batchIds: notificationData.targetBatches
        })
      };

      // Use the actual API call
      if (notificationData.targetType === 'ALL') {
        await createNotificationMutation.mutateAsync({
          ...notificationPayload,
          broadcast: true
        });
      } else {
        await createNotificationMutation.mutateAsync(notificationPayload);
      }
      
      setIsCreateDialogOpen(false);
      setNotificationData({
        title: '',
        message: '',
        type: 'GENERAL',
        targetType: 'ALL',
        targetUsers: [],
        targetBatches: []
      });
    } catch (error) {
      // Error handling is already done in the mutation
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'QUIZ': return <MessageSquare className="w-4 h-4" />;
      case 'VIDEO': return <Bell className="w-4 h-4" />;
      case 'ANNOUNCEMENT': return <AlertCircle className="w-4 h-4" />;
      case 'REMINDER': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'QUIZ': return 'bg-blue-100 text-blue-800';
      case 'VIDEO': return 'bg-purple-100 text-purple-800';
      case 'ANNOUNCEMENT': return 'bg-orange-100 text-orange-800';
      case 'REMINDER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const notificationTypes = [
    { value: 'GENERAL', label: 'General' },
    { value: 'QUIZ', label: 'Quiz' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'ANNOUNCEMENT', label: 'Announcement' },
    { value: 'REMINDER', label: 'Reminder' }
  ];

  // Get students in selected batches
  const getStudentsInBatches = () => {
    if (notificationData.targetBatches.length === 0) return [];
    return students.filter(student => 
      notificationData.targetBatches.includes(
        (student.student_profile?.batch?.batch_id || student.studentProfile?.batchId)?.toString() || ''
      )
    );
  };

  const selectedBatchStudents = getStudentsInBatches();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600 mt-1">Send and manage notifications to students</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} className="bg-gray-200 hover:bg-gray-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Notification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={notificationData.title}
                      onChange={(e) => setNotificationData({...notificationData, title: e.target.value})}
                      placeholder="Notification title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={notificationData.type} onValueChange={(value: any) => setNotificationData({...notificationData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={notificationData.message}
                    onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                    placeholder="Enter your notification message..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="all-students"
                        name="target"
                        checked={notificationData.targetType === 'ALL'}
                        onChange={() => setNotificationData({...notificationData, targetType: 'ALL', targetUsers: [], targetBatches: []})}
                      />
                      <Label htmlFor="all-students">All Students</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="specific-students"
                        name="target"
                        checked={notificationData.targetType === 'SPECIFIC'}
                        onChange={() => setNotificationData({...notificationData, targetType: 'SPECIFIC', targetBatches: []})}
                      />
                      <Label htmlFor="specific-students">Specific Students</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="batch-students"
                        name="target"
                        checked={notificationData.targetType === 'BATCH'}
                        onChange={() => setNotificationData({...notificationData, targetType: 'BATCH', targetUsers: []})}
                      />
                      <Label htmlFor="batch-students">Students by Batch</Label>
                    </div>
                  </div>
                  
                  {/* Specific Students Selection */}
                  {notificationData.targetType === 'SPECIFIC' && (
                    <div className="mt-2">
                      <Select value={notificationData.targetUsers[0] || ''} onValueChange={(value) => setNotificationData({...notificationData, targetUsers: [value]})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students && students.length > 0 ? students.map((student) => (
                            <SelectItem 
                              key={student.user_id || student.id} 
                              value={(student.user_id || student.id)?.toString() || ''}
                            >
                              {student.full_name || student.name} ({student.email})
                            </SelectItem>
                          )) : (
                            <SelectItem value="" disabled>
                              No students available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Batch Selection */}
                  {notificationData.targetType === 'BATCH' && (
                    <div className="mt-2 space-y-3">
                      <div>
                        <Select 
                          value="" 
                          onValueChange={(value) => {
                            if (value && !notificationData.targetBatches.includes(value)) {
                              setNotificationData({
                                ...notificationData, 
                                targetBatches: [...notificationData.targetBatches, value]
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select batches" />
                          </SelectTrigger>
                          <SelectContent>
                            {batches && batches.length > 0 ? batches.map((batch) => (
                              <SelectItem 
                                key={batch.batch_id || batch.id} 
                                value={(batch.batch_id || batch.id)?.toString() || ''}
                              >
                                {batch.batch_name || batch.name} ({batch.course?.name || 'No Course'})
                              </SelectItem>
                            )) : (
                              <SelectItem value="" disabled>
                                No batches available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Selected Batches */}
                      {notificationData.targetBatches.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Selected Batches:</Label>
                          <div className="flex flex-wrap gap-2">
                            {notificationData.targetBatches.map((batchId) => {
                              const batch = batches.find(b => (b.batch_id || b.id)?.toString() === batchId);
                              return (
                                <Badge key={batchId} variant="secondary" className="flex items-center gap-1">
                                  {batch?.batch_name || batch?.name || 'Unknown Batch'}
                                  <button
                                    onClick={() => setNotificationData({
                                      ...notificationData,
                                      targetBatches: notificationData.targetBatches.filter(id => id !== batchId)
                                    })}
                                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Students in Selected Batches */}
                      {selectedBatchStudents.length > 0 && (
                        <div className="mt-3">
                          <Label className="text-sm font-medium">
                            Students in Selected Batches ({selectedBatchStudents.length}):
                          </Label>
                          <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                            {selectedBatchStudents.map((student) => (
                              <div key={student.user_id || student.id} className="text-sm text-gray-600 py-1">
                                {student.full_name || student.name} ({student.email})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateNotification}
                  disabled={createNotificationMutation.isPending}
                >
                  {createNotificationMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold">{totalNotifications}</p>
              </div>
              <Send className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{notifications.filter(n => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(n.created_at || n.createdAt) > weekAgo;
                }).length}</p>
              </div>
              <Bell className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Read Rate</p>
                <p className="text-2xl font-bold">
                  {notifications.length > 0 
                    ? Math.round((notifications.filter(n => n.is_read || n.isRead).length / notifications.length) * 100)
                    : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{students.filter(s => s.is_active || s.isActive).length}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length > 0 ? notifications.map((notification) => (
              <div key={notification.notification_id || notification.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(notification.created_at || notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>To: {notification.user_id || notification.userId ? 
                      (notification.user?.full_name || 'Specific User') : 'All Students'}</span>
                    <span>•</span>
                    <span>Status: {notification.is_read || notification.isRead ? 'Read' : 'Unread'}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No notifications sent yet</p>
                <p className="text-sm">Create your first notification to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && notifications.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t px-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {endIndex} of {totalNotifications} notifications
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="itemsPerPage" className="text-sm text-gray-600">Items per page:</Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {/* Show page 1 with ellipsis when on last pages */}
              {totalPages > 5 && currentPage >= totalPages - 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    className={currentPage === 1 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : ""}
                  >
                    1
                  </Button>
                  <span className="text-gray-600">...</span>
                </>
              )}
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {/* Show ellipsis and last page when on first pages */}
              {totalPages > 5 && currentPage <= 3 && (
                <>
                  <span className="text-gray-600">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className={currentPage === totalPages 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : ""}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

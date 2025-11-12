import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Users, Clock, GraduationCap, UserPlus, Phone, Download, Ban } from 'lucide-react';
import { useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch } from '@/hooks/api/useAdmin';
import { useCourses } from '@/hooks/api/useAdmin';
import { useStudents } from '@/hooks/api/useAdmin';
import { CreateBatchData } from '@/services/admin';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import apiClient from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin/adminService';

const BatchManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(12); // Items per page
  const { data: batchesResponse, isLoading } = useBatches({ page: currentPage, limit });
  const { data: coursesResponse } = useCourses();
  const { data: studentsResponse } = useStudents();
  const createBatchMutation = useCreateBatch();
  const updateBatchMutation = useUpdateBatch();
  const deleteBatchMutation = useDeleteBatch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const batches = batchesResponse?.data?.data || batchesResponse?.data || [];
  const courses = coursesResponse?.data || [];
  const students = studentsResponse?.data || [];
  const paginationMeta = batchesResponse?.data?.meta;

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isManageStudentsDialogOpen, setIsManageStudentsDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const [newBatch, setNewBatch] = useState<CreateBatchData>({
    batch_name: '',
    timing: '', // kept for API contract but hidden from UI
    capacity: 0,
    course_id: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    description: '',
    is_active: true,
  });
  const [fieldErrors, setFieldErrors] = useState<{ batch_name?: string; course_id?: string; start_date?: string; end_date?: string; date_range?: string }>({});
  // Separate capacity field for user-friendly input (allow empty string instead of forcing 0)
  const [capacityField, setCapacityField] = useState<string>('');

  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  // Pending single student action confirmation (add/remove)
  const [pendingStudentAction, setPendingStudentAction] = useState<{ action: 'add' | 'remove'; student: any } | null>(null);
  const [isDisablingAll, setIsDisablingAll] = useState(false);

  // Filter batches based on search term
  const filteredBatches = batches.filter((batch: any) => {
    return (
      batch.batch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination calculations
  const totalBatches = paginationMeta?.total || filteredBatches.length;
  const totalPages = paginationMeta?.totalPages || Math.ceil(filteredBatches.length / limit);
  
  // Client-side pagination (if backend doesn't support it)
  const startIndex = paginationMeta ? (currentPage - 1) * limit : (currentPage - 1) * limit;
  const endIndex = paginationMeta 
    ? Math.min(startIndex + limit, totalBatches)
    : Math.min(startIndex + limit, filteredBatches.length);
  
  const paginatedBatches = paginationMeta 
    ? filteredBatches // Backend handles pagination
    : filteredBatches.slice(startIndex, endIndex); // Client-side pagination

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddBatch = async () => {
    const errs: { batch_name?: string; course_id?: string; start_date?: string; end_date?: string; date_range?: string } = {};
    if (!newBatch.batch_name.trim()) errs.batch_name = 'Batch name is required';
    if (!newBatch.course_id) errs.course_id = 'Course is required';
    if (!newBatch.start_date) errs.start_date = 'Start date is required';
    if (!newBatch.end_date) errs.end_date = 'End date is required';
    if (newBatch.start_date && newBatch.end_date && new Date(newBatch.start_date) > new Date(newBatch.end_date)) {
      errs.date_range = 'Start date must be before or equal to end date';
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast({ title: 'Validation Error', description: Object.values(errs).join(', '), variant: 'destructive' });
      return;
    }
    try {
      await createBatchMutation.mutateAsync({ ...newBatch, timing: '' });
      setNewBatch({
        batch_name: '',
        timing: '',
        capacity: 0,
        course_id: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        description: '',
        is_active: true,
      });
  setCapacityField('');
      setFieldErrors({});
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error creating batch
    }
  };

  const openEditDialog = (batch: any) => {
    setSelectedBatch(batch);
    setNewBatch({
      batch_name: batch.batch_name || '',
      timing: batch.timing || '',
      capacity: batch.capacity || 0,
      course_id: batch.course_id || 0,
      start_date: batch.start_date ? new Date(batch.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: batch.end_date ? new Date(batch.end_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: batch.description || '',
      is_active: batch.is_active !== false,
    });
  setCapacityField(batch.capacity ? String(batch.capacity) : '');
    setFieldErrors({});
    setIsEditDialogOpen(true);
  };

  const handleEditBatch = async () => {
    if (!selectedBatch) return;
    const errs: { batch_name?: string; course_id?: string; start_date?: string; end_date?: string; date_range?: string } = {};
    if (!newBatch.batch_name.trim()) errs.batch_name = 'Batch name is required';
    if (!newBatch.course_id) errs.course_id = 'Course is required';
    if (!newBatch.start_date) errs.start_date = 'Start date is required';
    if (!newBatch.end_date) errs.end_date = 'End date is required';
    if (newBatch.start_date && newBatch.end_date && new Date(newBatch.start_date) > new Date(newBatch.end_date)) {
      errs.date_range = 'Start date must be before or equal to end date';
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast({ title: 'Validation Error', description: Object.values(errs).join(', '), variant: 'destructive' });
      return;
    }
    await updateBatchMutation.mutateAsync({ id: selectedBatch.batch_id.toString(), data: { ...newBatch, timing: '' } });
    setIsEditDialogOpen(false);
  };

  const handleDeleteBatch = async () => {
    if (!selectedBatch) return;
    await deleteBatchMutation.mutateAsync(selectedBatch.batch_id.toString());
    setIsDeleteDialogOpen(false);
  };

  const openManageStudentsDialog = (batch: any) => {
    setSelectedBatch(batch);
    setSelectedStudents(batch.students?.map((s: any) => s.user_id) || []);
    setIsManageStudentsDialogOpen(true);
  };

  const handleManageStudents = async () => {
    if (!selectedBatch) return;
    try {
      const res: any = await apiClient.put(`/admin/batches/${selectedBatch.batch_id}/students`, { student_ids: selectedStudents });
      if (res?.success) {
        toast({ title: 'Success', description: res.message || 'Students updated successfully' });
        setIsManageStudentsDialogOpen(false);
        // Refresh batches data
        queryClient.invalidateQueries({ queryKey: ['batches'] });
        queryClient.invalidateQueries({ queryKey: ['students'] });
      } else {
        throw new Error('No success flag');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to update students', variant: 'destructive' });
    }
  };

  const handleDisableAllStudents = async () => {
    if (!selectedBatch) return;
    
    const enrolledIds = new Set(selectedBatch.students?.map((s: any) => s.user_id) || []);
    const enrolledStudents = students.filter((s: any) => enrolledIds.has(s.user_id));
    
    if (enrolledStudents.length === 0) {
      toast({ title: 'No students', description: 'There are no students enrolled in this batch to disable.', variant: 'destructive' });
      return;
    }

    setIsDisablingAll(true);
    try {
      // Get all student IDs
      const studentIds = enrolledStudents.map((student: any) => student.user_id);
      
      // Use bulk disable endpoint
      const response: any = await adminService.bulkDisableStudents(studentIds);
      
      if (response?.success) {
        toast({ 
          title: 'Success', 
          description: response.message || `Successfully disabled ${response.data?.disabled_count || enrolledStudents.length} student(s).` 
        });
      } else {
        throw new Error(response?.message || 'Failed to disable students');
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error?.response?.data?.message || error?.message || 'Failed to disable students', 
        variant: 'destructive' 
      });
    } finally {
      setIsDisablingAll(false);
    }
  };

  const handleExportStudents = () => {
    if (!selectedBatch) return;
    
    const enrolledIds = new Set(selectedBatch.students?.map((s: any) => s.user_id) || []);
    const enrolledStudents = students.filter((s: any) => enrolledIds.has(s.user_id));
    
    if (enrolledStudents.length === 0) {
      toast({ title: 'No students', description: 'There are no students enrolled in this batch to export.', variant: 'destructive' });
      return;
    }

    // Helper function to escape CSV values
    const escapeCSV = (value: string): string => {
      if (!value) return '';
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // CSV header
    const csvHeader = 'name,enrollment number,contact number,mail id,batch\n';
    
    // Format the export data as CSV
    const csvRows = enrolledStudents.map((student: any) => {
      const name = escapeCSV(student.full_name || 'N/A');
      const enrollmentNumber = escapeCSV(student.student_profile?.enrollment_number || 'N/A');
      const contactNumber = escapeCSV(student.phone_number || 'N/A');
      const mailId = escapeCSV(student.email || 'N/A');
      const batch = escapeCSV(selectedBatch.batch_name || 'N/A');
      
      return `${name},${enrollmentNumber},${contactNumber},${mailId},${batch}`;
    });

    const csvContent = csvHeader + csvRows.join('\n');

    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_${selectedBatch.batch_name}_students_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ 
      title: 'Success', 
      description: `Exported ${enrolledStudents.length} student(s) successfully.` 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-600 mt-1">Manage academy batches and student assignments</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Batch</DialogTitle>
              <DialogDescription>
                Fill in the batch details below. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batch_name">Batch Name *</Label>
                  <Input
                    id="batch_name"
                    value={newBatch.batch_name}
                    onChange={(e) => setNewBatch({...newBatch, batch_name: e.target.value})}
                    placeholder="Batch name"
                  />
                </div>
                <div>
                  <Label htmlFor="course_id">Course *</Label>
                  <Select 
                    value={newBatch.course_id?.toString() || ''} 
                    onValueChange={(value) => setNewBatch({...newBatch, course_id: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.course_id} value={course.course_id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="text"
                    value={capacityField}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setCapacityField(val);
                        setNewBatch({ ...newBatch, capacity: val === '' ? 0 : parseInt(val, 10) });
                      }
                    }}
                    placeholder="Maximum students"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
          <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newBatch.start_date}
                    onChange={(e) => setNewBatch({...newBatch, start_date: e.target.value})}
                  />
          {fieldErrors.start_date && <p className="text-sm text-red-500 mt-1">{fieldErrors.start_date}</p>}
                </div>
                <div>
          <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newBatch.end_date}
                    onChange={(e) => setNewBatch({...newBatch, end_date: e.target.value})}
                  />
          {fieldErrors.end_date && <p className="text-sm text-red-500 mt-1">{fieldErrors.end_date}</p>}
                </div>
              </div>
        {fieldErrors.date_range && <p className="text-sm text-red-500">{fieldErrors.date_range}</p>}

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newBatch.description}
                  onChange={(e) => setNewBatch({...newBatch, description: e.target.value})}
                  placeholder="Batch description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={newBatch.is_active}
                  onCheckedChange={(checked) => setNewBatch({...newBatch, is_active: checked})}
                />
                <Label htmlFor="is_active">Active Batch</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddBatch}
                disabled={createBatchMutation.isPending || !newBatch.batch_name.trim() || !newBatch.course_id || !newBatch.start_date || !newBatch.end_date}
              >
                {createBatchMutation.isPending ? 'Adding...' : 'Add Batch'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold">{batches.length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Batches</p>
                <p className="text-2xl font-bold">{batches.filter(b => b.is_active).length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{batches.reduce((acc, batch) => acc + (batch.students?.length || 0), 0)}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Capacity</p>
                <p className="text-2xl font-bold">
                  {batches.length > 0
                    ? Math.round(batches.reduce((acc, batch) => acc + (batch.capacity || 0), 0) / batches.length)
                    : 0}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch List */}
      <div className="flex items-center mb-4">
        <div className="relative w-full max-w-xs">
          <Input
            type="text"
            placeholder="Search batches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedBatches.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No batches found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search term.' : 'Create your first batch to get started.'}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          paginatedBatches.map((batch: any) => (
          <Card key={batch.batch_id} className="flex flex-col">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {batch.batch_name?.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{batch.batch_name}</h3>
                    <Badge variant={batch.is_active ? "default" : "secondary"}>
                      {batch.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(batch)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openManageStudentsDialog(batch)}
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedBatch(batch);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{(batch.start_date || '').slice(0,10)} - {(batch.end_date || '').slice(0,10)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{batch.students?.length || 0} / {batch.capacity} students</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span>{courses.find(c => c.course_id === batch.course_id)?.name || 'Unknown Course'}</span>
                </div>
              </div>
              {batch.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">{batch.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {endIndex} of {totalBatches} batches
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Update batch information below.
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-batch_name">Batch Name *</Label>
                  <Input
                    id="edit-batch_name"
                    value={newBatch.batch_name}
                    onChange={(e) => setNewBatch({...newBatch, batch_name: e.target.value})}
                    placeholder="Batch name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-course_id">Course *</Label>
                  <Select 
                    value={newBatch.course_id?.toString() || ''} 
                    onValueChange={(value) => setNewBatch({...newBatch, course_id: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.course_id} value={course.course_id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-capacity">Capacity</Label>
                  <Input
                    id="edit-capacity"
                    type="text"
                    value={capacityField}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setCapacityField(val);
                        setNewBatch({ ...newBatch, capacity: val === '' ? 0 : parseInt(val, 10) });
                      }
                    }}
                    placeholder="Maximum students"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
          <Label htmlFor="edit-start_date">Start Date *</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={newBatch.start_date}
                    onChange={(e) => setNewBatch({...newBatch, start_date: e.target.value})}
                  />
          {fieldErrors.start_date && <p className="text-sm text-red-500 mt-1">{fieldErrors.start_date}</p>}
                </div>
                <div>
          <Label htmlFor="edit-end_date">End Date *</Label>
                  <Input
                    id="edit-end_date"
                    type="date"
                    value={newBatch.end_date}
                    onChange={(e) => setNewBatch({...newBatch, end_date: e.target.value})}
                  />
          {fieldErrors.end_date && <p className="text-sm text-red-500 mt-1">{fieldErrors.end_date}</p>}
                </div>
              </div>
        {fieldErrors.date_range && <p className="text-sm text-red-500">{fieldErrors.date_range}</p>}

              <div>
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={newBatch.description}
                  onChange={(e) => setNewBatch({...newBatch, description: e.target.value})}
                  placeholder="Batch description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={newBatch.is_active}
                  onCheckedChange={(checked) => setNewBatch({...newBatch, is_active: checked})}
                />
                <Label htmlFor="edit-is_active">Active Batch</Label>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBatch} disabled={updateBatchMutation.isPending || !newBatch.batch_name.trim() || !newBatch.course_id || !newBatch.start_date || !newBatch.end_date}>
              {updateBatchMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      <Dialog open={isManageStudentsDialogOpen} onOpenChange={setIsManageStudentsDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Students - {selectedBatch?.batch_name}</DialogTitle>
            <DialogDescription>
              Add or remove students for this batch. Left shows currently enrolled students. Right shows eligible students (same course, not yet enrolled).
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && (() => {
            const enrolledIds = new Set(selectedBatch.students?.map((s: any) => s.user_id) || []);
            const enrolledStudents = students.filter((s: any) => enrolledIds.has(s.user_id));
            const eligibleStudents = students.filter((s: any) => !enrolledIds.has(s.user_id) && s.student_profile?.course_id === selectedBatch.course_id);
            const atCapacity = selectedBatch.capacity && enrolledStudents.length >= selectedBatch.capacity;
            const allStudentsDisabled = enrolledStudents.length > 0 && enrolledStudents.every((s: any) => s.is_active === false);
            
            return (
              <>
                <div className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Enrolled Students */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">Enrolled ({enrolledStudents.length}{selectedBatch.capacity ? ` / ${selectedBatch.capacity}` : ''})</h4>
                        {selectedBatch.capacity ? (
                          <span className={`text-xs px-2 py-0.5 rounded ${atCapacity ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{atCapacity ? 'Full' : 'Space Available'}</span>
                        ) : null}
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {enrolledStudents.length === 0 && <p className="text-sm text-gray-500">No students enrolled yet.</p>}
                        {enrolledStudents.map((student: any) => {
                          const inSelection = selectedStudents.includes(student.user_id); // should be true
                          return (
                            <div key={student.user_id} className="p-3 border rounded-lg flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{student.full_name}</p>
                                <p className="text-xs text-gray-600 truncate">{student.email}</p>
                                {student.phone_number && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{student.phone_number}</p>}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => setPendingStudentAction({ action: 'remove', student })}
                              >Remove</Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Eligible Students */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">Eligible ({eligibleStudents.length})</h4>
                        {atCapacity && <span className="text-xs text-red-600">Batch full</span>}
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {eligibleStudents.length === 0 && <p className="text-sm text-gray-500">No eligible students available.</p>}
                        {eligibleStudents.map((student: any) => {
                          const willBeEnrolled = selectedStudents.includes(student.user_id);
                          return (
                            <div key={student.user_id} className="p-3 border rounded-lg flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{student.full_name}</p>
                                <p className="text-xs text-gray-600 truncate">{student.email}</p>
                                {student.phone_number && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{student.phone_number}</p>}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={atCapacity && !willBeEnrolled}
                                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                onClick={() => setPendingStudentAction({ action: 'add', student })}
                              >Add</Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 pt-4 border-t">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleDisableAllStudents}
                disabled={isDisablingAll || !selectedBatch?.students?.length || allStudentsDisabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Ban className="w-4 h-4 mr-2" />
                {isDisablingAll ? 'Disabling...' : allStudentsDisabled ? 'All Disabled' : 'Disable All'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportStudents}
                disabled={!selectedBatch?.students?.length}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsManageStudentsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleManageStudents}>
                Save Changes
              </Button>
            </div>
          </div>
          </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirm Add/Remove Student Dialog */}
      <AlertDialog open={!!pendingStudentAction} onOpenChange={(open) => { if (!open) setPendingStudentAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStudentAction?.action === 'add' ? 'Add Student to Batch' : 'Remove Student from Batch'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStudentAction && (
                <span>
                  Are you sure you want to {pendingStudentAction.action === 'add' ? 'add' : 'remove'}
                  {' '}
                  <strong>{pendingStudentAction.student.full_name}</strong>
                  {' '}({pendingStudentAction.student.email}) {pendingStudentAction.action === 'add' ? 'to' : 'from'} this batch?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStudentAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingStudentAction || !selectedBatch) return;
                const student = pendingStudentAction.student;
                if (pendingStudentAction.action === 'remove') {
                  setSelectedStudents(prev => prev.filter(id => id !== student.user_id));
                  setSelectedBatch((prev: any) => prev ? { ...prev, students: prev.students.filter((s: any) => s.user_id !== student.user_id) } : prev);
                } else if (pendingStudentAction.action === 'add') {
                  // Capacity guard just in case
                  const currentCount = (selectedBatch.students?.length) || 0;
                  if (selectedBatch.capacity && currentCount >= selectedBatch.capacity && !selectedStudents.includes(student.user_id)) {
                    toast({ title: 'Capacity reached', description: 'Cannot add more students to this batch.', variant: 'destructive' });
                    setPendingStudentAction(null);
                    return;
                  }
                  setSelectedStudents(prev => prev.includes(student.user_id) ? prev : [...prev, student.user_id]);
                  setSelectedBatch((prev: any) => prev ? { ...prev, students: prev.students.some((s: any) => s.user_id === student.user_id) ? prev.students : [...prev.students, student] } : prev);
                }
                setPendingStudentAction(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the batch
              and remove all student assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBatch} disabled={deleteBatchMutation.isPending}>
              {deleteBatchMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BatchManagement; 
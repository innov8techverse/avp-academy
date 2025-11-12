import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, BookOpen, Users, Clock, GraduationCap } from 'lucide-react';
import { useCourses, useCreateCourse } from '@/hooks/api/useAdmin';
import { CreateCourseData, adminService } from '@/services/admin';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CourseManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(12); // Items per page
  const { data: coursesResponse, isLoading } = useCourses({ page: currentPage, limit });
  const createCourseMutation = useCreateCourse();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const courses = coursesResponse?.data?.data || coursesResponse?.data || [];
  const paginationMeta = coursesResponse?.data?.meta;
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  // Form state including all required backend fields (UI only exposes a subset)
  const [newCourse, setNewCourse] = useState<CreateCourseData>({
    name: '',
    description: '',
    duration: '0',
    category: '',
    fees: 0,
    max_students: 0,
    start_date: '',
    end_date: '',
    status: true,
    instructor_id: '',
    location: '',
    mode: 'ONLINE',
    language: '',
    enrollment_count: 0,
    completion_rate: 0,
    tags: [],
    metadata: {},
  });
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
  // Separate string field for fees so user can clear input without it snapping back to 0
  const [feesField, setFeesField] = useState<string>('');

  const editCourseMutation = useMutation({
    mutationFn: async (data: { id: string; values: Partial<CreateCourseData> }) => {
      return adminService.updateCourse(data.id, data.values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: 'Success', description: 'Course updated successfully' });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update course', variant: 'destructive' });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminService.deleteCourse(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: 'Success', description: 'Course deleted successfully' });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete course', variant: 'destructive' });
    },
  });

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => {
    return (course.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
           (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
  });

  // Pagination calculations
  const totalCourses = paginationMeta?.total || filteredCourses.length;
  const totalPages = paginationMeta?.totalPages || Math.ceil(filteredCourses.length / limit);
  
  // Client-side pagination (if backend doesn't support it)
  const startIndex = paginationMeta ? (currentPage - 1) * limit : (currentPage - 1) * limit;
  const endIndex = paginationMeta 
    ? Math.min(startIndex + limit, totalCourses)
    : Math.min(startIndex + limit, filteredCourses.length);
  
  const paginatedCourses = paginationMeta 
    ? filteredCourses // Backend handles pagination
    : filteredCourses.slice(startIndex, endIndex); // Client-side pagination

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const validate = (values: CreateCourseData) => {
    const errs: { name?: string } = {};
    if (!values.name.trim()) errs.name = 'Name is required';
    return errs;
  };

  const handleAddCourse = async () => {
    const errs = validate(newCourse);
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast({ title: 'Validation Error', description: Object.values(errs).join(', '), variant: 'destructive' });
      return;
    }
    try {
      await createCourseMutation.mutateAsync(newCourse);
      setNewCourse({
        name: '',
        description: '',
        duration: '0',
        category: '',
        fees: 0,
        max_students: 0,
        start_date: '',
        end_date: '',
        status: true,
        instructor_id: '',
        location: '',
        mode: 'ONLINE',
        language: '',
        enrollment_count: 0,
        completion_rate: 0,
        tags: [],
        metadata: {},
      });
      setFeesField('');
      setFieldErrors({});
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error creating course
    }
  };

  const openEditDialog = (course: any) => {
    setSelectedCourse(course);
    setNewCourse({
      name: course.name || '',
      description: course.description || '',
      duration: (course.duration != null ? String(course.duration) : '0'),
      category: course.category || '',
      fees: course.fees != null ? course.fees : 0,
      max_students: course.max_students != null ? course.max_students : 0,
      start_date: course.start_date || '',
      end_date: course.end_date || '',
      status: course.status === 'ACTIVE' ? true : !!course.status,
      instructor_id: course.instructor_id || '',
      location: course.location || '',
      mode: course.mode || 'ONLINE',
      language: course.language || '',
      enrollment_count: course.enrollment_count != null ? course.enrollment_count : 0,
      completion_rate: course.completion_rate != null ? course.completion_rate : 0,
      tags: course.tags || [],
      metadata: course.metadata || {},
    });
    setFeesField(course.fees != null && course.fees !== 0 ? String(course.fees) : (course.fees === 0 ? '0' : ''));
    setIsEditDialogOpen(true);
  };

  const handleEditCourse = async () => {
    if (!selectedCourse) return;
    const errs = validate(newCourse);
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast({ title: 'Validation Error', description: Object.values(errs).join(', '), variant: 'destructive' });
      return;
    }
    await editCourseMutation.mutateAsync({ id: selectedCourse.course_id.toString(), values: newCourse });
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    await deleteCourseMutation.mutateAsync(selectedCourse.course_id.toString());
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
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-1">Manage academy courses and programs</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
              <DialogDescription>
                Fill in the course details below. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    value={newCourse.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCourse({ ...newCourse, name: val });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                    }}
                    placeholder="Course name"
                    aria-invalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>}
                </div>
                
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewCourse({ ...newCourse, description: val });
                    if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: undefined });
                  }}
                  placeholder="Course description"
                  rows={3}
                  aria-invalid={!!fieldErrors.description}
                />
                {fieldErrors.description && <p className="text-sm text-red-500 mt-1">{fieldErrors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (Months)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                    placeholder="Course duration"
                  />
                </div>
                <div>
                  <Label htmlFor="fees">Fees</Label>
                  <Input
                    id="fees"
                    type="text"
                    value={feesField}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow empty, digits and optional decimal part
                      if (/^\d*(\.\d*)?$/.test(val) || val === '') {
                        setFeesField(val);
                        if (val === '' || val === '.') {
                          // Don't update numeric fees yet; keep previous or set to 0
                          if (val === '') setNewCourse({ ...newCourse, fees: 0 });
                        } else {
                          const num = parseFloat(val);
                          if (!isNaN(num)) setNewCourse({ ...newCourse, fees: num });
                        }
                      }
                    }}
                    placeholder="Course fees"
                  />
                </div>
              </div>

             
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="status"
                  checked={newCourse.status}
                  onChange={(e) => setNewCourse({...newCourse, status: e.target.checked})}
                />
                <Label htmlFor="status">Active Course</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddCourse}
                disabled={createCourseMutation.isPending || !newCourse.name.trim() || !newCourse.description.trim()}
              >
                {createCourseMutation.isPending ? 'Adding...' : 'Add Course'}
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
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold">{courses.filter(c => c.status).length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <div className="flex items-center mb-4">
        <div className="relative w-full max-w-xs">
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {paginatedCourses.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search term.' : 'Create your first course to get started.'}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          paginatedCourses.map((course) => (
          <Card key={course.course_id || course.id} className="flex flex-col h-full">
            <CardContent className="p-6 flex flex-col flex-grow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {course.name?.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{course.name}</h3>
                    <Badge variant={course.status ? "default" : "secondary"} className="mt-1">
                      {course.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(course)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedCourse(course);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-grow space-y-2">
                <div className="text-sm text-gray-600 line-clamp-2">
                  {course.description}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{course.duration} Months</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>{course?.students?.length || 0} students</span>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {endIndex} of {totalCourses} courses
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
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information below.
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Course Name *</Label>
                  <Input
                    id="edit-name"
                    value={newCourse.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCourse({ ...newCourse, name: val });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                    }}
                    placeholder="Course name"
                    aria-invalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>}
                </div>
                
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={newCourse.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewCourse({ ...newCourse, description: val });
                    if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: undefined });
                  }}
                  placeholder="Course description"
                  rows={3}
                  aria-invalid={!!fieldErrors.description}
                />
                {fieldErrors.description && <p className="text-sm text-red-500 mt-1">{fieldErrors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-duration">Duration (Months)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                    placeholder="Course duration"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fees">Fees</Label>
                  <Input
                    id="edit-fees"
                    type="text"
                    value={feesField}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*(\.\d*)?$/.test(val) || val === '') {
                        setFeesField(val);
                        if (val === '' || val === '.') {
                          if (val === '') setNewCourse({ ...newCourse, fees: 0 });
                        } else {
                          const num = parseFloat(val);
                          if (!isNaN(num)) setNewCourse({ ...newCourse, fees: num });
                        }
                      }
                    }}
                    placeholder="Course fees"
                  />
                </div>
              </div>

             
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-active"
                  checked={newCourse.status}
                  onChange={(e) => setNewCourse({...newCourse, status: e.target.checked})}
                />
                <Label htmlFor="edit-is-active">Active Course</Label>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCourse} disabled={!newCourse.name.trim() || !newCourse.description.trim()}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseManagement;

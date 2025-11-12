import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, BookOpen } from 'lucide-react';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/api/useSubjects';
import { useCourses } from '@/hooks/api/useAdmin';
import { CreateSubjectData } from '@/services/subject/subjectService';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog as RelatedCoursesDialog, DialogContent as RelatedCoursesDialogContent, DialogHeader as RelatedCoursesDialogHeader, DialogTitle as RelatedCoursesDialogTitle } from '@/components/ui/dialog';
import apiClient from '@/services/api';




const SubjectManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(12); // Items per page
  const { data: subjectsResponse, isLoading } = useSubjects({ page: currentPage, limit });
  const { data: coursesResponse } = useCourses();
  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();
  const { toast } = useToast();

  // Defensive array handling for subjects
  const subjects = Array.isArray(subjectsResponse?.data?.data)
    ? subjectsResponse.data.data
    : Array.isArray(subjectsResponse?.data)
      ? subjectsResponse.data
      : Array.isArray(subjectsResponse)
        ? subjectsResponse
        : [];

  const courses = coursesResponse?.data || [];
  const paginationMeta = subjectsResponse?.data?.meta;

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  const [newSubject, setNewSubject] = useState<CreateSubjectData & { course_id?: number }>({
    name: '',
    description: '',
    course_id: undefined,
  });
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; course_id?: string }>({});

  const [showCoursesDialog, setShowCoursesDialog] = useState(false);
  const [coursesForSubject, setCoursesForSubject] = useState<any[]>([]);
  const [coursesDialogSubject, setCoursesDialogSubject] = useState<any>(null);

  const [showCourseDetailDialog, setShowCourseDetailDialog] = useState(false);
  const [courseDetail, setCourseDetail] = useState<any>(null);

  // Filter subjects based on search term
  const filteredSubjects = subjects.filter((subject: any) => {
    return (
      subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination calculations
  const totalSubjects = paginationMeta?.total || filteredSubjects.length;
  const totalPages = paginationMeta?.totalPages || Math.ceil(filteredSubjects.length / limit);
  
  // Client-side pagination (if backend doesn't support it)
  const startIndex = paginationMeta ? (currentPage - 1) * limit : (currentPage - 1) * limit;
  const endIndex = paginationMeta 
    ? Math.min(startIndex + limit, totalSubjects)
    : Math.min(startIndex + limit, filteredSubjects.length);
  
  const paginatedSubjects = paginationMeta 
    ? filteredSubjects // Backend handles pagination
    : filteredSubjects.slice(startIndex, endIndex); // Client-side pagination

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddSubject = async () => {
    const errs: { name?: string; course_id?: string } = {};
    if (!newSubject.name.trim()) errs.name = 'Subject name is required';
    if (!newSubject.course_id) errs.course_id = 'Course is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast({
        title: 'Validation Error',
        description: Object.values(errs).join(', '),
        variant: 'destructive',
      });
      return;
    }
    try {
      const result = await createSubjectMutation.mutateAsync(newSubject);
      setNewSubject({ name: '', description: '', course_id: undefined });
      setFieldErrors({});
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error creating subject
    }
  };

  const openEditDialog = (subject: any) => {
    setSelectedSubject(subject);
    setNewSubject({
      name: subject.name || '',
      description: subject.description || '',
      course_id: subject.course_id || undefined,
    });
  setFieldErrors({});
    setIsEditDialogOpen(true);
  };

  const handleEditSubject = async () => {
    if (!selectedSubject) return;
    const errs: { name?: string; course_id?: string } = {};
    if (!newSubject.name.trim()) errs.name = 'Subject name is required';
    if (!newSubject.course_id) errs.course_id = 'Course is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast({
        title: 'Validation Error',
        description: Object.values(errs).join(', '),
        variant: 'destructive',
      });
      return;
    }
    try {
      const result = await updateSubjectMutation.mutateAsync({ id: selectedSubject.subject_id, values: newSubject });
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error updating subject
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    try {
      const result = await deleteSubjectMutation.mutateAsync(selectedSubject.subject_id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      // Error deleting subject
    }
  };

  const handleShowCourses = async (subject: any) => {
    setCoursesDialogSubject(subject);
    setShowCoursesDialog(true);
    // Fetch courses for this subject
    try {
      const res = await apiClient.get(`/subjects/${subject.subject_id}/courses`);
      setCoursesForSubject(res.data || []);
    } catch (e) {
      setCoursesForSubject([]);
    }
  };

  const handleShowCourseDetail = async (course: any) => {
    try {
      const res = await apiClient.get(`/admin/courses/${course.course_id}`);
      setCourseDetail(res.data.data || course);
    } catch (e) {
      setCourseDetail(course);
    }
    setShowCourseDetailDialog(true);
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
          <h1 className="text-3xl font-bold text-gray-900">Subject Management</h1>
          <p className="text-gray-600 mt-1">Manage academy subjects</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                Fill in the subject details below. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="course">Course *</Label>
                <Select 
                  value={newSubject.course_id?.toString() || ''} 
                  onValueChange={(value) => setNewSubject({ ...newSubject, course_id: parseInt(value) })}
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
                {fieldErrors.course_id && <p className="text-sm text-red-500 mt-1">{fieldErrors.course_id}</p>}
              </div>
              <div>
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="Subject name"
                />
                {fieldErrors.name && <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  placeholder="Subject description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSubject} disabled={createSubjectMutation.isPending || !newSubject.name.trim() || !newSubject.course_id}>
                {createSubjectMutation.isPending ? 'Adding...' : 'Add Subject'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold">{subjects.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject List */}
      <div className="flex items-center mb-4">
        <div className="relative w-full max-w-xs">
          <Input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedSubjects.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No subjects found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search term.' : 'Create your first subject to get started.'}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          paginatedSubjects.map((subject: any) => (
          <Card key={subject.subject_id} className="flex flex-col cursor-pointer" onClick={() => handleShowCourses(subject)}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {subject.name?.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <p className="text-sm text-gray-600">
                      {subject.courses && subject.courses.length > 0 
                        ? subject.courses.map((c: any) => c.name).join(', ')
                        : 'No course assigned'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(subject);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSubject(subject);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-sm text-gray-600">
                  {subject.description}
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
            Showing {startIndex + 1} to {endIndex} of {totalSubjects} subjects
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
        <DialogContent className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject information below.
            </DialogDescription>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-course">Course *</Label>
                <Select 
                  value={newSubject.course_id?.toString() || ''} 
                  onValueChange={(value) => setNewSubject({ ...newSubject, course_id: parseInt(value) })}
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
        {fieldErrors.course_id && <p className="text-sm text-red-500 mt-1">{fieldErrors.course_id}</p>}
              </div>
              <div>
                <Label htmlFor="edit-name">Subject Name *</Label>
                <Input
                  id="edit-name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="Subject name"
                />
        {fieldErrors.name && <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
        <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  placeholder="Subject description"
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
      <Button onClick={handleEditSubject} disabled={updateSubjectMutation.isPending || !newSubject.name.trim() || !newSubject.course_id}>
              {updateSubjectMutation.isPending ? 'Saving...' : 'Save Changes'}
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
              This action cannot be undone. This will permanently delete the subject.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubject} disabled={deleteSubjectMutation.isPending}>
              {deleteSubjectMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RelatedCoursesDialog open={showCoursesDialog} onOpenChange={setShowCoursesDialog}>
        <RelatedCoursesDialogContent>
          <RelatedCoursesDialogHeader>
            <RelatedCoursesDialogTitle>Courses for {coursesDialogSubject?.name}</RelatedCoursesDialogTitle>
          </RelatedCoursesDialogHeader>
          <div className="space-y-2 mt-4">
            {coursesForSubject.length === 0 ? (
              <div className="text-gray-500">No courses found for this subject.</div>
            ) : (
              coursesForSubject.map((course: any) => (
                <div
                  key={course.course_id}
                  className="p-2 border rounded bg-gray-50 cursor-pointer hover:bg-blue-100"
                  onClick={() => handleShowCourseDetail(course)}
                >
                  {course.name}
                </div>
              ))
            )}
          </div>
        </RelatedCoursesDialogContent>
      </RelatedCoursesDialog>

      <RelatedCoursesDialog open={showCourseDetailDialog} onOpenChange={setShowCourseDetailDialog}>
        <RelatedCoursesDialogContent>
          <RelatedCoursesDialogHeader>
            <RelatedCoursesDialogTitle>Course Details</RelatedCoursesDialogTitle>
          </RelatedCoursesDialogHeader>
          {courseDetail ? (
            <div className="space-y-2 mt-4">
              <div><strong>Name:</strong> {courseDetail.name}</div>
              <div><strong>Description:</strong> {courseDetail.description}</div>
              <div><strong>Duration:</strong> {courseDetail.duration}</div>
              <div><strong>Fees:</strong> {courseDetail.fees}</div>
              {courseDetail.subjects && courseDetail.subjects.length > 0 && (
                <div>
                  <strong>Subjects:</strong>
                  <ul className="list-disc ml-6">
                    {courseDetail.subjects.map((subj: any) => (
                      <li key={subj.subject_id}>{subj.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </RelatedCoursesDialogContent>
      </RelatedCoursesDialog>
    </div>
  );
};

export default SubjectManagement; 
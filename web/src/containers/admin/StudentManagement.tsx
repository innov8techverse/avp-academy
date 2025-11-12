
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Users, UserCheck, GraduationCap, Phone, Mail, BookOpen } from 'lucide-react';
import { useStudents, useCreateStudent, useCourses, useBatches } from '@/hooks/api/useAdmin';
import { CreateStudentData } from '@/services/admin';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin';


interface Student {
  id: number;
  name: string;
  fatherName: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  dateOfJoining: string;
  avatar?: string;
}

const StudentManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(12); // Items per page
  const { data: studentsResponse, isLoading } = useStudents({ page: currentPage, limit });
  const { data: coursesResponse } = useCourses();
  const { data: batchesResponse } = useBatches();
  const createStudentMutation = useCreateStudent();
  const { toast } = useToast();

  const students = studentsResponse?.data?.data || studentsResponse?.data || [];
  const courses = coursesResponse?.data || [];
  const batches = batchesResponse?.data || [];
  const paginationMeta = studentsResponse?.data?.meta;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const [newStudent, setNewStudent] = useState<CreateStudentData>({
    email: '',
    full_name: '',
    phone_number: '',
    batch_id: '',
    course_id: '',
    address: '',
    emergency_contact: '',
    date_of_birth: '',
    gender: '',
    city: '',
    state: '',
    pincode: '',
    adhaar_num: '',
    enrollment_number: '',
    qualification: '',
    guardian_name: '',
    guardian_contact: '',
    guardian_email: '',
    guardian_relation: '',
    mobile_number: '',
    bio: '',
    blood_group: '',
    medical_conditions: '',
    achievements: {},
    documents: {}
  ,community: ''
  });

  const [editStudent, setEditStudent] = useState<CreateStudentData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ full_name?: string; email?: string; phone_number?: string; course_id?: string; batch_id?: string; date_of_birth?: string; gender?: string }>({});
  const [editFieldErrors, setEditFieldErrors] = useState<{ full_name?: string; email?: string; phone_number?: string; course_id?: string; batch_id?: string; date_of_birth?: string; gender?: string }>({});

  const queryClient = useQueryClient();

  const editStudentMutation = useMutation({
    mutationFn: async (data: { id: string; values: Partial<CreateStudentData> }) => {
      const response = await adminService.updateStudent(data.id, data.values);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'Success', description: 'Student updated successfully' });
      setIsEditDialogOpen(false);
      setEditStudent(null);
      setEditFieldErrors({}); // Clear edit validation errors on success
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error?.response?.data?.message || 'Failed to update student', 
        variant: 'destructive' 
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminService.deleteStudent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'Success', description: 'Student deleted successfully' });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete student', variant: 'destructive' });
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditDialog = (student: any) => {
    setSelectedStudent(student);
    
    setEditStudent({
      email: student.email || '',
      full_name: student.full_name || '',
      phone_number: student.phone_number || '',
      batch_id: student.student_profile?.batch?.batch_id?.toString() || student.student_profile?.batch_id?.toString() || '',
      course_id: student.student_profile?.course?.course_id?.toString() || student.student_profile?.course_id?.toString() || '',
      address: student.student_profile?.address || '',
      emergency_contact: student.student_profile?.emergency_contact || '',
      date_of_birth: student.student_profile?.date_of_birth ? new Date(student.student_profile.date_of_birth).toISOString().split('T')[0] : '',
      gender: student.gender || '',
      city: student.city || '',
      state: student.state || '',
      pincode: student.pincode || '',
      avatar: student.avatar || '',
      role: student.role || 'STUDENT',
      is_active: student.is_active,
      adhaar_num: student.student_profile?.adhaar_num || '',
      enrollment_number: student.student_profile?.enrollment_number || '',
      qualification: student.student_profile?.qualification || '',
      guardian_name: student.student_profile?.guardian_name || '',
      guardian_contact: student.student_profile?.guardian_contact || '',
      guardian_email: student.student_profile?.guardian_email || '',
      guardian_relation: student.student_profile?.guardian_relation || '',
      mobile_number: student.student_profile?.mobile_number || '',
      bio: student.student_profile?.bio || '',
      blood_group: student.student_profile?.blood_group || '',
      medical_conditions: student.student_profile?.medical_conditions || '',
      achievements: student.student_profile?.achievements || {},
      documents: student.student_profile?.documents || {}
  ,community: student.student_profile?.community || ''
    });
    setEditFieldErrors({}); // Clear edit validation errors when opening dialog
    setIsEditDialogOpen(true);
  };

  const handleEditStudent = async () => {
    if (!selectedStudent || !editStudent) return;
    const errs: { full_name?: string; email?: string; phone_number?: string; course_id?: string; batch_id?: string; date_of_birth?: string; gender?: string } = {};
    if (!editStudent.full_name?.trim()) errs.full_name = 'Name required'; else if (editStudent.full_name.length < 2) errs.full_name = 'Min 2 chars';
    if (!editStudent.email?.trim()) errs.email = 'Email required'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editStudent.email)) errs.email = 'Invalid email';
    if (!editStudent.phone_number?.trim()) errs.phone_number = 'Phone required'; else if (!/^\d{10}$/.test(editStudent.phone_number.replace(/\D/g, ''))) errs.phone_number = '10 digits';
    if (!editStudent.course_id) errs.course_id = 'Course required';
    if (!editStudent.batch_id) errs.batch_id = 'Batch required';
    if (!editStudent.date_of_birth) errs.date_of_birth = 'DOB required';
    if (!editStudent.gender) errs.gender = 'Gender required';
    setEditFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast({ title: 'Validation Error', description: Object.values(errs).join(', '), variant: 'destructive' });
      return;
    }

    // Email uniqueness check (exclude current student id)
    const emailClash = students.some((s: any) => s.user_id !== selectedStudent.user_id && s.email?.toLowerCase() === editStudent.email.toLowerCase());
    if (emailClash) {
      toast({ title: 'Email already exists', description: 'This email already exists, try another email', variant: 'destructive' });
      return;
    }

    try {
      // Prepare the data for sending to backend - only include defined fields
      const updateData: any = {};
      
      // Core user fields
      if (editStudent.full_name !== undefined) updateData.full_name = editStudent.full_name;
      if (editStudent.email !== undefined) updateData.email = editStudent.email;
      if (editStudent.phone_number !== undefined) updateData.phone_number = editStudent.phone_number;
      if (editStudent.gender !== undefined) updateData.gender = editStudent.gender;
      if (editStudent.city !== undefined) updateData.city = editStudent.city;
      if (editStudent.state !== undefined) updateData.state = editStudent.state;
      if (editStudent.pincode !== undefined) updateData.pincode = editStudent.pincode;
      if (editStudent.is_active !== undefined) updateData.is_active = editStudent.is_active;
      
      // Student profile fields
      if (editStudent.batch_id !== undefined) updateData.batch_id = editStudent.batch_id || null;
      if (editStudent.course_id !== undefined) updateData.course_id = editStudent.course_id || null;
      if (editStudent.address !== undefined) updateData.address = editStudent.address;
      if (editStudent.emergency_contact !== undefined) updateData.emergency_contact = editStudent.emergency_contact;
      if (editStudent.date_of_birth !== undefined) updateData.date_of_birth = editStudent.date_of_birth;
      if (editStudent.adhaar_num !== undefined) updateData.adhaar_num = editStudent.adhaar_num;
      if (editStudent.enrollment_number !== undefined) updateData.enrollment_number = editStudent.enrollment_number;
      if (editStudent.qualification !== undefined) updateData.qualification = editStudent.qualification;
      if (editStudent.guardian_name !== undefined) updateData.guardian_name = editStudent.guardian_name;
      if (editStudent.guardian_contact !== undefined) updateData.guardian_contact = editStudent.guardian_contact;
      if (editStudent.guardian_email !== undefined) updateData.guardian_email = editStudent.guardian_email;
      if (editStudent.guardian_relation !== undefined) updateData.guardian_relation = editStudent.guardian_relation;
      if (editStudent.mobile_number !== undefined) updateData.mobile_number = editStudent.mobile_number;
      if (editStudent.bio !== undefined) updateData.bio = editStudent.bio;
      if (editStudent.blood_group !== undefined) updateData.blood_group = editStudent.blood_group;
      if (editStudent.medical_conditions !== undefined) updateData.medical_conditions = editStudent.medical_conditions;
      if (editStudent.achievements !== undefined) updateData.achievements = editStudent.achievements;
      if (editStudent.documents !== undefined) updateData.documents = editStudent.documents;
  if (editStudent.community !== undefined) updateData.community = editStudent.community;
      
      await editStudentMutation.mutateAsync({ 
        id: selectedStudent.user_id.toString(), 
        values: updateData 
      });
    } catch (error) {
      // Error in handleEditStudent
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    await deleteStudentMutation.mutateAsync(selectedStudent.user_id.toString());
  };

  // Filter students based on search term and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = (student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (student.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCourse = !selectedCourse || student.student_profile?.course_id === parseInt(selectedCourse);
    const matchesBatch = !selectedBatch || student.student_profile?.batch_id === parseInt(selectedBatch);
    return matchesSearch && matchesCourse && matchesBatch;
  });

  // Pagination calculations
  const totalStudents = paginationMeta?.total || filteredStudents.length;
  const totalPages = paginationMeta?.totalPages || Math.ceil(filteredStudents.length / limit);
  
  // Client-side pagination (if backend doesn't support it)
  const startIndex = paginationMeta ? (currentPage - 1) * limit : (currentPage - 1) * limit;
  const endIndex = paginationMeta 
    ? Math.min(startIndex + limit, totalStudents)
    : Math.min(startIndex + limit, filteredStudents.length);
  
  const paginatedStudents = paginationMeta 
    ? filteredStudents // Backend handles pagination
    : filteredStudents.slice(startIndex, endIndex); // Client-side pagination

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCourse, selectedBatch]);

  const handleAddStudent = async () => {
    const errs: { full_name?: string; email?: string; phone_number?: string; course_id?: string; batch_id?: string; date_of_birth?: string; gender?: string } = {};
    if (!newStudent.full_name?.trim()) errs.full_name = 'Name is required'; else if (newStudent.full_name.length < 2) errs.full_name = 'Min 2 chars';
    if (!newStudent.email?.trim()) errs.email = 'Email required'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) errs.email = 'Invalid email';
    if (!newStudent.phone_number?.trim()) errs.phone_number = 'Phone required'; else if (!/^\d{10}$/.test(newStudent.phone_number.replace(/\D/g, ''))) errs.phone_number = '10 digits';
    if (!newStudent.course_id) errs.course_id = 'Course required';
    if (!newStudent.batch_id) errs.batch_id = 'Batch required';
    if (!newStudent.date_of_birth) errs.date_of_birth = 'DOB required'; else {
      const dob = new Date(newStudent.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
    }
    if (!newStudent.gender) errs.gender = 'Gender required';
    // Additional non-inline validations (do not store) using toast
    const extraErrors: string[] = [];
    if (newStudent.adhaar_num && !/^\d{12}$/.test(newStudent.adhaar_num.replace(/\D/g, ''))) extraErrors.push('Aadhaar must be 12 digits');
    if (newStudent.guardian_contact && !/^\d{10}$/.test(newStudent.guardian_contact.replace(/\D/g, ''))) extraErrors.push('Guardian contact 10 digits');
    if (newStudent.guardian_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.guardian_email)) extraErrors.push('Guardian email invalid');
    setFieldErrors(errs);
    // Email uniqueness for add
    const emailExists = students.some((s: any) => s.email?.toLowerCase() === newStudent.email.toLowerCase());
    if (emailExists) {
      toast({ title: 'Email already exists', description: 'This email already exists, try another email', variant: 'destructive' });
      return;
    }
    if (Object.keys(errs).length || extraErrors.length) {
      toast({
        title: 'Validation Error',
        description: [...Object.values(errs), ...extraErrors].join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      const studentData: CreateStudentData = {
        ...newStudent,
        batch_id: newStudent.batch_id || undefined,
  course_id: newStudent.course_id || undefined,
  community: newStudent.community || undefined
      };

      await createStudentMutation.mutateAsync(studentData);
      setNewStudent({
        email: '',
        full_name: '',
        phone_number: '',
        batch_id: '',
        course_id: '',
        address: '',
        emergency_contact: '',
        date_of_birth: '',
        gender: '',
        city: '',
        state: '',
        pincode: '',
        adhaar_num: '',
        enrollment_number: '',
        qualification: '',
        guardian_name: '',
        guardian_contact: '',
        guardian_email: '',
        guardian_relation: '',
        mobile_number: '',
        bio: '',
        blood_group: '',
        medical_conditions: '',
        achievements: {},
        documents: {}
      });
  setFieldErrors({});
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create student. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Auto-generate enrollment number when batch changes (and add dialog is open)
  useEffect(() => {
    if (!isAddDialogOpen) return; // Only when dialog open
    if (!newStudent.batch_id || !newStudent.course_id) {
      // Need both course & batch to build the new format
      setNewStudent(prev => ({ ...prev, enrollment_number: '' }));
      return;
    }
    const batch = batches.find(b => b.batch_id.toString() === newStudent.batch_id);
    const course = courses.find(c => c.course_id.toString() === newStudent.course_id);
    if (!batch || !course) return;
    const year = new Date().getFullYear();
    // Sanitize: remove all non-alphanumeric characters (periods, symbols) & limit length to keep ID manageable
    const sanitizedCourse = (course.name || '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 15);
    const sanitizedBatch = (batch.batch_name || '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 15);
    if (!sanitizedCourse || !sanitizedBatch) {
      setNewStudent(prev => ({ ...prev, enrollment_number: '' }));
      return;
    }
    // New format: AVP<year><COURSENAME><BATCHNAME><NNN> (no hyphens, 3-digit padded sequence)
    const newPrefix = `AVP${year}${sanitizedCourse}${sanitizedBatch}`;
    // Legacy formats (previous without course name) we still recognize for sequence continuity
    const legacyBatchOnlyNoDash = `AVP${year}${sanitizedBatch}`;           // AVP2025NEETBATCH1
    const legacyBatchOnlyWithDash = `AVP${year}-${sanitizedBatch}`;        // AVP2025-NEETBATCH1
    const legacyBatchOnlyWithDashAndNum = `${legacyBatchOnlyWithDash}-`;   // AVP2025-NEETBATCH1-1
    // Collect existing enrollment numbers across new + legacy prefixes
    const related = students
      .map(s => s.student_profile?.enrollment_number || s.enrollment_number)
      .filter((en: string | undefined) => en && (
        en.startsWith(newPrefix) ||
        en.startsWith(legacyBatchOnlyWithDashAndNum) ||
        en.startsWith(legacyBatchOnlyWithDash) ||
        en.startsWith(legacyBatchOnlyNoDash)
      )) as string[];
    let maxSeq = 0;
    related.forEach(en => {
      if (en.startsWith(newPrefix)) {
        const seqPart = en.slice(newPrefix.length); // part after full prefix
        if (/^\d{3}$/.test(seqPart)) {
          const val = parseInt(seqPart, 10);
            if (val > maxSeq) maxSeq = val;
        }
      } else {
        // Legacy formats (without course or with dash). Extract digits AFTER the legacy prefix only.
        const legacyPrefixes = [legacyBatchOnlyWithDashAndNum, legacyBatchOnlyWithDash, legacyBatchOnlyNoDash];
        for (const lp of legacyPrefixes) {
          if (en.startsWith(lp)) {
            const remainder = en.slice(lp.length).replace(/^-/, '');
            const seqDigitsMatch = remainder.match(/^(\d{1,3})$/); // up to 3 digits
            if (seqDigitsMatch) {
              const val = parseInt(seqDigitsMatch[1], 10);
              if (val > maxSeq) maxSeq = val;
            } else if (/^\d+$/.test(remainder)) {
              // Fallback: take last 3 digits only if longer
              const chunk = remainder.slice(-3);
              const val = parseInt(chunk, 10);
              if (!isNaN(val) && val > maxSeq) maxSeq = val;
            }
            break;
          }
        }
      }
    });
    const next = maxSeq + 1;
    const nextStr = String(next).padStart(3, '0');
    const enrollment_number = `${newPrefix}${nextStr}`; // AVP<year><COURSE><BATCH><NNN>
    setNewStudent(prev => ({ ...prev, enrollment_number }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newStudent.batch_id, newStudent.course_id, isAddDialogOpen, students, courses, batches]);

  // Auto-generate enrollment number for edit dialog if batch changes (readonly field)
  useEffect(() => {
    if (!isEditDialogOpen || !editStudent?.batch_id || !editStudent?.course_id) return;
    const batch = batches.find(b => b.batch_id.toString() === editStudent.batch_id);
    const course = courses.find(c => c.course_id.toString() === editStudent.course_id);
    if (!batch || !course) return;
    const year = new Date().getFullYear();
    const sanitizedCourse = (course.name || '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 15);
    const sanitizedBatch = (batch.batch_name || '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 15);
    if (!sanitizedCourse || !sanitizedBatch) return;
    const newPrefix = `AVP${year}${sanitizedCourse}${sanitizedBatch}`;
    const legacyBatchOnlyNoDash = `AVP${year}${sanitizedBatch}`;
    const legacyBatchOnlyWithDash = `AVP${year}-${sanitizedBatch}`;
    const legacyBatchOnlyWithDashAndNum = `${legacyBatchOnlyWithDash}-`;
    const related = students
      .map(s => s.student_profile?.enrollment_number || s.enrollment_number)
      .filter((en: string | undefined) => en && (
        en.startsWith(newPrefix) ||
        en.startsWith(legacyBatchOnlyWithDashAndNum) ||
        en.startsWith(legacyBatchOnlyWithDash) ||
        en.startsWith(legacyBatchOnlyNoDash)
      )) as string[];
    let maxSeq = 0;
    related.forEach(en => {
      if (en.startsWith(newPrefix)) {
        const seqPart = en.slice(newPrefix.length);
        if (/^\d{3}$/.test(seqPart)) {
          const val = parseInt(seqPart, 10);
          if (val > maxSeq) maxSeq = val;
        }
      } else {
        const legacyPrefixes = [legacyBatchOnlyWithDashAndNum, legacyBatchOnlyWithDash, legacyBatchOnlyNoDash];
        for (const lp of legacyPrefixes) {
          if (en.startsWith(lp)) {
            const remainder = en.slice(lp.length).replace(/^-/, '');
            const seqDigitsMatch = remainder.match(/^(\d{1,3})$/);
            if (seqDigitsMatch) {
              const val = parseInt(seqDigitsMatch[1], 10);
              if (val > maxSeq) maxSeq = val;
            } else if (/^\d+$/.test(remainder)) {
              const chunk = remainder.slice(-3);
              const val = parseInt(chunk, 10);
              if (!isNaN(val) && val > maxSeq) maxSeq = val;
            }
            break;
          }
        }
      }
    });
    const next = maxSeq + 1;
    const nextStr = String(next).padStart(3, '0');
    const enrollment_number = `${newPrefix}${nextStr}`;
    setEditStudent(prev => prev ? { ...prev, enrollment_number } : prev);
  }, [editStudent?.batch_id, editStudent?.course_id, isEditDialogOpen, students, batches, courses]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCourseColor = (course: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-teal-100 text-teal-800 border-teal-200'
    ];
    return colors[course.length % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">Manage student enrollment and details</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Fill in the student details below. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-4 -mr-4">
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <Label htmlFor="full_name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="full_name"
                    value={newStudent.full_name}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, full_name: e.target.value });
                      if (fieldErrors.full_name) setFieldErrors(prev => ({ ...prev, full_name: undefined }));
                    }}
                    placeholder="Student name"
                  />
                  {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="student@example.com"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone_number"
                    value={newStudent.phone_number}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setNewStudent({ ...newStudent, phone_number: val });
                      if (fieldErrors.phone_number) setFieldErrors(prev => ({ ...prev, phone_number: undefined }));
                    }}
                    placeholder="+91 9876543210"
                  />
                  {fieldErrors.phone_number && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone_number}</p>}
                </div>
                <div>
                  <Label htmlFor="course">Course <span className="text-red-500">*</span></Label>
                  <Select value={newStudent.course_id} onValueChange={(value) => {
                    setNewStudent({ ...newStudent, course_id: value });
                    if (fieldErrors.course_id) setFieldErrors(prev => ({ ...prev, course_id: undefined }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.course_id} value={course.course_id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.course_id && <p className="text-xs text-red-500 mt-1">{fieldErrors.course_id}</p>}
                </div>
                <div>
                  <Label htmlFor="batch">Batch <span className="text-red-500">*</span></Label>
                  <Select value={newStudent.batch_id} onValueChange={(value) => {
                    setNewStudent({ ...newStudent, batch_id: value });
                    if (fieldErrors.batch_id) setFieldErrors(prev => ({ ...prev, batch_id: undefined }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches
                        .filter((batch: any) => batch.is_active && (!newStudent.course_id || batch.course_id?.toString() === newStudent.course_id))
                        .map((batch: any) => (
                          <SelectItem key={batch.batch_id} value={batch.batch_id.toString()}>
                            {batch.batch_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.batch_id && <p className="text-xs text-red-500 mt-1">{fieldErrors.batch_id}</p>}
                </div>
                <div>
                  <Label htmlFor="enrollment_number">Enrollment Number</Label>
                 <input
                  type="text"
                  id="enrollment_number"
                  value={newStudent.enrollment_number}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, enrollment_number: e.target.value })
                  }
                  className="bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Enrollment Number"
                />

                </div>
                <div>
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={newStudent.emergency_contact}
                    onChange={(e) => setNewStudent({ ...newStudent, emergency_contact: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth <span className="text-red-500">*</span></Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={newStudent.date_of_birth}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, date_of_birth: e.target.value });
                      if (fieldErrors.date_of_birth) setFieldErrors(prev => ({ ...prev, date_of_birth: undefined }));
                    }}
                  />
                  {fieldErrors.date_of_birth && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_of_birth}</p>}
                </div>
                <div>
                  <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                  <Select value={newStudent.gender} onValueChange={(value) => {
                    setNewStudent({ ...newStudent, gender: value });
                    if (fieldErrors.gender) setFieldErrors(prev => ({ ...prev, gender: undefined }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.gender && <p className="text-xs text-red-500 mt-1">{fieldErrors.gender}</p>}
                </div>
                <div>
                  <Label htmlFor="community">Community</Label>
                  <Select value={newStudent.community} onValueChange={(value) => setNewStudent({ ...newStudent, community: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select community" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OC">OC</SelectItem>
                      <SelectItem value="BC">BC</SelectItem>
                      <SelectItem value="MBC">MBC</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newStudent.address}
                    onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                    placeholder="Student address"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newStudent.city}
                    onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newStudent.state}
                    onChange={(e) => setNewStudent({ ...newStudent, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={newStudent.pincode}
                    onChange={(e) => setNewStudent({ ...newStudent, pincode: e.target.value })}
                    placeholder="Pincode"
                  />
                </div>
                <div>
                  <Label htmlFor="adhaar_num">Aadhaar Number</Label>
                  <Input
                    id="adhaar_num"
                    type='number'
                    maxLength={12}
                    minLength={12 }
                    value={newStudent.adhaar_num}
                    onChange={(e) => setNewStudent({ ...newStudent, adhaar_num: e.target.value })}
                    placeholder="Aadhaar Number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={newStudent.qualification}
                    onChange={(e) => setNewStudent({ ...newStudent, qualification: e.target.value })}
                    placeholder="Qualification"
                  />
                </div>
                <div>
                  <Label htmlFor="guardian_name">Guardian Name</Label>
                  <Input
                    id="guardian_name"
                    value={newStudent.guardian_name}
                    onChange={(e) => setNewStudent({ ...newStudent, guardian_name: e.target.value })}
                    placeholder="Guardian Name"
                  />
                </div>
                <div>
                  <Label htmlFor="guardian_contact">Guardian Contact</Label>
                  <Input
                    id="guardian_contact"
                    value={newStudent.guardian_contact}
                    onChange={(e) => setNewStudent({ ...newStudent, guardian_contact: e.target.value })}
                    placeholder="Guardian Contact"
                  />
                </div>
                <div>
                  <Label htmlFor="guardian_email">Guardian Email</Label>
                  <Input
                    id="guardian_email"
                    type="email"
                    value={newStudent.guardian_email}
                    onChange={(e) => setNewStudent({ ...newStudent, guardian_email: e.target.value })}
                    placeholder="Guardian Email"
                  />
                </div>
                <div>
                  <Label htmlFor="guardian_relation">Guardian Relation</Label>
                  <Input
                    id="guardian_relation"
                    value={newStudent.guardian_relation}
                    onChange={(e) => setNewStudent({ ...newStudent, guardian_relation: e.target.value })}
                    placeholder="Guardian Relation"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile_number">Mobile Number</Label>
                  <Input
                    id="mobile_number"
                    type='tel'
                    value={newStudent.mobile_number}
                    onChange={(e) => setNewStudent({ ...newStudent, mobile_number: e.target.value })}
                    placeholder="Mobile Number"
                  />
                </div>
                <div>
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select value={newStudent.blood_group} onValueChange={(value) => setNewStudent({ ...newStudent, blood_group: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="medical_conditions">Medical Conditions</Label>
                  <Textarea
                    id="medical_conditions"
                    value={newStudent.medical_conditions}
                    onChange={(e) => setNewStudent({ ...newStudent, medical_conditions: e.target.value })}
                    placeholder="Medical Conditions"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={newStudent.bio}
                    onChange={(e) => setNewStudent({ ...newStudent, bio: e.target.value })}
                    placeholder="Student Bio"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setFieldErrors({}); // Clear validation errors when closing
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={createStudentMutation.isPending || !newStudent.full_name || !newStudent.email || !newStudent.phone_number || !newStudent.course_id || !newStudent.batch_id || !newStudent.date_of_birth || !newStudent.gender || Object.keys(fieldErrors).length > 0}
              >
                {createStudentMutation.isPending ? 'Adding...' : 'Add Student'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Students</p>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Students</p>
                <p className="text-3xl font-bold">{students.filter(s => s.is_active).length}</p>
              </div>
              <GraduationCap className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Enrolled Courses</p>
                <p className="text-3xl font-bold">{students.filter(s => s.student_profile?.course_id).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">This Month</p>
                <p className="text-3xl font-bold">{students.filter(s => {
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return new Date(s.created_at) > monthAgo;
                }).length}</p>
              </div>
              <Users className="w-10 h-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.course_id} value={course.course_id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="All batches" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.batch_id} value={batch.batch_id.toString()}>
                    {batch.batch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedCourse('');
              setSelectedBatch('');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedStudents.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCourse || selectedBatch 
                    ? 'Try adjusting your filters or search term.' 
                    : 'Create your first student to get started.'}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          paginatedStudents.map((student) => (
          <Card key={student.user_id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {student.full_name?.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(student)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedStudent(student);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{student.email}</span>
                </div>

                {student.phone_number && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{student.phone_number}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {student.student_profile?.course && (
                    <Badge className={getCourseColor(student.student_profile.course.name)}>
                      {student.student_profile.course.name}
                    </Badge>
                  )}
                  {student.student_profile?.batch && (
                    <Badge variant="outline">
                      {student.student_profile.batch.batch_name}
                    </Badge>
                  )}
                  <Badge variant={student.is_active ? "default" : "secondary"}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    size="sm"
                    variant={student.is_active ? "destructive" : "default"}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await adminService.updateStudent(student.user_id.toString(), { is_active: !student.is_active });
                      queryClient.invalidateQueries({ queryKey: ['students'] });
                    }}
                  >
                    {student.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Joined:</span>
                  <span className="font-medium">
                    {new Date(student.created_at).toLocaleDateString()}
                  </span>
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
            Showing {startIndex + 1} to {endIndex} of {totalStudents} students
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
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditStudent(null);
          setEditFieldErrors({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information below.
            </DialogDescription>
          </DialogHeader>
          {editStudent && (
            <div className="flex-grow overflow-y-auto pr-4 -mr-4">
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <Label htmlFor="edit-name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-name"
                    value={editStudent.full_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditStudent({ ...editStudent, full_name: val });
                      if (editFieldErrors.full_name) setEditFieldErrors(p => ({ ...p, full_name: undefined }));
                    }}
                    placeholder="Full name"
                  />
                  {editFieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{editFieldErrors.full_name}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editStudent.email}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, email: e.target.value });
                      if (editFieldErrors.email) setEditFieldErrors(p => ({ ...p, email: undefined }));
                    }}
                    placeholder="Email address"
                  />
                  {editFieldErrors.email && <p className="text-xs text-red-500 mt-1">{editFieldErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-phone"
                    value={editStudent.phone_number}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setEditStudent({ ...editStudent, phone_number: val });
                      if (editFieldErrors.phone_number) setEditFieldErrors(p => ({ ...p, phone_number: undefined }));
                    }}
                    placeholder="Phone number"
                  />
                  {editFieldErrors.phone_number && <p className="text-xs text-red-500 mt-1">{editFieldErrors.phone_number}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-course">Course <span className="text-red-500">*</span></Label>
                  <Select value={editStudent.course_id || ''} onValueChange={(value) => {
                    setEditStudent({ ...editStudent, course_id: value });
                    if (editFieldErrors.course_id) setEditFieldErrors(p => ({ ...p, course_id: undefined }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.course_id} value={course.course_id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editFieldErrors.course_id && <p className="text-xs text-red-500 mt-1">{editFieldErrors.course_id}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-batch">Batch <span className="text-red-500">*</span></Label>
                  <Select value={editStudent.batch_id || ''} onValueChange={(value) => {
                    setEditStudent({ ...editStudent, batch_id: value });
                    if (editFieldErrors.batch_id) setEditFieldErrors(p => ({ ...p, batch_id: undefined }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches
                        .filter((batch: any) => batch.is_active && (!editStudent.course_id || batch.course_id?.toString() === editStudent.course_id))
                        .map((batch: any) => (
                          <SelectItem key={batch.batch_id} value={batch.batch_id.toString()}>
                            {batch.batch_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {editFieldErrors.batch_id && <p className="text-xs text-red-500 mt-1">{editFieldErrors.batch_id}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-enrollment">Enrollment Number</Label>
                 <Input
                  id="edit-enrollment"
                  value={editStudent.enrollment_number}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, enrollment_number: e.target.value })
                  }
                  className="bg-white border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Enter Enrollment Number"
                />

                </div>
                <div>
                  <Label htmlFor="edit-dob">Date of Birth <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={(editStudent.date_of_birth)}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, date_of_birth: e.target.value });
                      if (editFieldErrors.date_of_birth) setEditFieldErrors(p => ({ ...p, date_of_birth: undefined }));
                    }}
                  />
                  {editFieldErrors.date_of_birth && <p className="text-xs text-red-500 mt-1">{editFieldErrors.date_of_birth}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-gender">Gender <span className="text-red-500">*</span></Label>
                  <Select value={editStudent.gender || ''} onValueChange={(value) => {
                    setEditStudent({ ...editStudent, gender: value });
                    if (editFieldErrors.gender) setEditFieldErrors(p => ({ ...p, gender: undefined }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {editFieldErrors.gender && <p className="text-xs text-red-500 mt-1">{editFieldErrors.gender}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-community">Community</Label>
                  <Select value={editStudent.community || ''} onValueChange={(value) => setEditStudent({ ...editStudent, community: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select community" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OC">OC</SelectItem>
                      <SelectItem value="BC">BC</SelectItem>
                      <SelectItem value="MBC">MBC</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-adhaar">Aadhaar Number</Label>
                  <Input
                    id="edit-adhaar"
                    value={editStudent.adhaar_num}
                    onChange={(e) => setEditStudent({ ...editStudent, adhaar_num: e.target.value })}
                    placeholder="Aadhaar number"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-qualification">Qualification</Label>
                  <Input
                    id="edit-qualification"
                    value={editStudent.qualification}
                    onChange={(e) => setEditStudent({ ...editStudent, qualification: e.target.value })}
                    placeholder="Qualification"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-guardian-name">Guardian Name</Label>
                  <Input
                    id="edit-guardian-name"
                    value={editStudent.guardian_name}
                    onChange={(e) => setEditStudent({ ...editStudent, guardian_name: e.target.value })}
                    placeholder="Guardian name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-guardian-contact">Guardian Contact</Label>
                  <Input
                    id="edit-guardian-contact"
                    value={editStudent.guardian_contact}
                    onChange={(e) => setEditStudent({ ...editStudent, guardian_contact: e.target.value })}
                    placeholder="Guardian contact"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-guardian-email">Guardian Email</Label>
                  <Input
                    id="edit-guardian-email"
                    type="email"
                    value={editStudent.guardian_email}
                    onChange={(e) => setEditStudent({ ...editStudent, guardian_email: e.target.value })}
                    placeholder="Guardian email"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-guardian-relation">Guardian Relation</Label>
                  <Input
                    id="edit-guardian-relation"
                    value={editStudent.guardian_relation}
                    onChange={(e) => setEditStudent({ ...editStudent, guardian_relation: e.target.value })}
                    placeholder="Guardian relation"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-mobile">Mobile Number</Label>
                  <Input
                    id="edit-mobile"
                    value={editStudent.mobile_number}
                    onChange={(e) => setEditStudent({ ...editStudent, mobile_number: e.target.value })}
                    placeholder="Mobile number"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-bio">Bio</Label>
                  <Textarea
                    id="edit-bio"
                    value={editStudent.bio}
                    onChange={(e) => setEditStudent({ ...editStudent, bio: e.target.value })}
                    placeholder="Student bio"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-blood-group">Blood Group</Label>
                  <Select value={editStudent.blood_group || ''} onValueChange={(value) => setEditStudent({ ...editStudent, blood_group: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-medical">Medical Conditions</Label>
                  <Textarea
                    id="edit-medical"
                    value={editStudent.medical_conditions}
                    onChange={(e) => setEditStudent({ ...editStudent, medical_conditions: e.target.value })}
                    placeholder="Medical conditions"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Textarea
                    id="edit-address"
                    value={editStudent.address}
                    onChange={(e) => setEditStudent({ ...editStudent, address: e.target.value })}
                    placeholder="Address"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={editStudent.city}
                    onChange={(e) => setEditStudent({ ...editStudent, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-state">State</Label>
                  <Input
                    id="edit-state"
                    value={editStudent.state}
                    onChange={(e) => setEditStudent({ ...editStudent, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-pincode">Pincode</Label>
                  <Input
                    id="edit-pincode"
                    value={editStudent.pincode}
                    onChange={(e) => setEditStudent({ ...editStudent, pincode: e.target.value })}
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex-shrink-0 flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditStudent(null);
              setEditFieldErrors({}); // Clear validation errors when closing
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditStudent} disabled={editStudentMutation.isPending || Object.keys(editFieldErrors).length > 0}>
              {editStudentMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student's account
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentManagement;

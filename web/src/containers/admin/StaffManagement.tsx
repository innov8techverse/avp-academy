import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users, UserCheck, GraduationCap, Phone, Mail, BookOpen } from 'lucide-react';
import { useStaff, useCreateStaff, useStudents } from '@/hooks/api/useAdmin';
import { CreateStaffData, adminService } from '@/services/admin';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const StaffManagement = () => {
  const { data: staffResponse, isLoading } = useStaff();
  // Fetch students to validate email uniqueness across both tables
  const { data: studentsResponse } = useStudents();
  const createStaffMutation = useCreateStaff();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newDocKey, setNewDocKey] = useState("");
  const [newAward, setNewAward] = useState("");

  const [newAchievement] = useState("");
  const [newDocValue, setNewDocValue] = useState("");


  const staff = staffResponse?.data || [];
  const students = studentsResponse?.data || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [newDocumentKey, setNewDocumentKey] = useState("");
const [newDocumentValue, setNewDocumentValue] = useState("");

  const [newStaff, setNewStaff] = useState<CreateStaffData>({
    email: '',
    full_name: '',
    phone_number: '',
    role: 'TEACHER',
    department: '',
    designation: '',
    qualifications: [],
    years_of_experience: 0,
    specialization: [],
    subjects: [],
    salary: 0,
    bank_details: staff.staff?.bank_details ||{
  "bank_name": "",
  "ifsc_code": "",
  "account_number": ""
},
    documents: {},
    emergency_contact: '',
    blood_group: '',
    medical_conditions: '',
  achievements:{ awards: [], publications: undefined },
  performance_rating: 0,
  office_location: ''
  });
  // Working hours JSON editable text (Add)
  // removed working hours fields per schema update

  // field level errors for add & edit
  const [fieldErrors, setFieldErrors] = useState<{ full_name?: string; email?: string; phone_number?: string; role?: string }>({});
  const [editFieldErrors, setEditFieldErrors] = useState<{ full_name?: string; email?: string; phone_number?: string; role?: string }>({});

  const editStaffMutation = useMutation({
    mutationFn: async (data: { id: string; values: Partial<CreateStaffData> }) => {
      return adminService.updateStaff(data.id, data.values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Success', description: 'Staff updated successfully' });
      setIsEditDialogOpen(false);
      setEditFieldErrors({});
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to update staff';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminService.deleteStaff(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Success', description: 'Staff deleted successfully' });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete staff', variant: 'destructive' });
    },
  });

  const filteredStaff = staff.filter(staff => {
    return (staff.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
           (staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
  });

  const handleAddStaff = async () => {
    // validations
    const errs: { full_name?: string; email?: string; phone_number?: string; role?: string } = {};
    if (!newStaff.full_name?.trim()) errs.full_name = 'Name required'; else if (newStaff.full_name.length < 2) errs.full_name = 'Min 2 chars';
    if (!newStaff.email?.trim()) errs.email = 'Email required'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStaff.email)) errs.email = 'Invalid email';
    if (!newStaff.phone_number?.trim()) errs.phone_number = 'Phone required'; else if (!/^\d{10}$/.test(newStaff.phone_number.replace(/\D/g, ''))) errs.phone_number = '10 digits';
    if (!newStaff.role) errs.role = 'Role required';
    setFieldErrors(errs);

    // email uniqueness across staff & students
    const lowerEmail = newStaff.email.toLowerCase();
    const emailExists = staff.some((s: any) => s.email?.toLowerCase() === lowerEmail) ||
      students.some((stu: any) => stu.email?.toLowerCase() === lowerEmail);
    if (emailExists) {
      toast({ title: 'Email already exists', description: 'This email already exists, try another email', variant: 'destructive' });
      return;
    }
    if (Object.keys(errs).length) {
      toast({ title: 'Validation Error', description: Object.values(errs).join(', '), variant: 'destructive' });
      return;
    }

    try {
      await createStaffMutation.mutateAsync(newStaff);
  setNewStaff({
        email: '',
        full_name: '',
        phone_number: '',
        role: 'TEACHER',
        department: '',
        designation: '',
        qualifications: [],
        years_of_experience: 0,
        specialization: [],
        subjects: [],
        salary: 0,
    bank_details: {bank:"",ac:""},
        documents: {},
        emergency_contact: '',
        blood_group: '',
        medical_conditions: '',
  achievements: { awards: [], publications: undefined },
  performance_rating: 0,
  office_location: ''
      });
  setFieldErrors({});
  setIsAddDialogOpen(false);
    } catch (error) {
      // Error creating staff
    }
  };

 const openEditDialog = (staff: any) => {
  setSelectedStaff(staff);

  const details = staff?.staff || {};

  const achievementsData = {
    awards: details.achievements?.awards || [],
    publications: details.achievements?.publications,
  };

  setNewStaff({
    email: staff.email || '',
    full_name: staff.full_name || '',
    phone_number: staff.phone_number || '',
    role: staff.role || 'TEACHER',

    department: details.department || '',
    designation: details.designation || '',
    qualifications: details.qualifications || [],
    years_of_experience: details.years_of_experience || 0,
    specialization: details.specialization || [],
    subjects: details.subjects || [],
    salary: details.salary || 0,

    bank_details: {
      bank_name: details.bank_details?.bank_name || '',
      ifsc_code: details.bank_details?.ifsc_code || '',
      account_number: details.bank_details?.account_number || '',
    },

    documents: details.documents || {},

    emergency_contact: details.emergency_contact || '',
    blood_group: details.blood_group || '',
    medical_conditions: details.medical_conditions || '',

  achievements: achievementsData,

  performance_rating: details.performance_rating || 0,
  office_location: details.office_location || ''
  });
  setEditFieldErrors({});

  setIsEditDialogOpen(true);
};


  const handleEditStaff = async () => {
  if (!selectedStaff) return;

  const errs: { full_name?: string; email?: string; phone_number?: string; role?: string } = {};
  if (!newStaff.full_name?.trim()) errs.full_name = 'Name required'; else if (newStaff.full_name.length < 2) errs.full_name = 'Min 2 chars';
  if (!newStaff.email?.trim()) errs.email = 'Email required'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStaff.email)) errs.email = 'Invalid email';
  if (!newStaff.phone_number?.trim()) errs.phone_number = 'Phone required'; else if (!/^\d{10}$/.test(newStaff.phone_number.replace(/\D/g, ''))) errs.phone_number = '10 digits';
  if (!newStaff.role) errs.role = 'Role required';
  setEditFieldErrors(errs);
  if (Object.keys(errs).length) {
    toast({ title: 'Validation Error', description: Object.values(errs).join(', '), variant: 'destructive' });
    return;
  }
  // email uniqueness exclude current
  const emailClash = staff.some((s: any) => s.user_id !== selectedStaff.user_id && s.email?.toLowerCase() === newStaff.email.toLowerCase()) ||
    students.some((stu: any) => stu.email?.toLowerCase() === newStaff.email.toLowerCase());
  if (emailClash) {
    toast({ title: 'Email already exists', description: 'This email already exists, try another email', variant: 'destructive' });
    return;
  }

  // Parse edit working hours JSON before send
  const staffData: Partial<CreateStaffData> = {
    full_name: newStaff.full_name,
  email: newStaff.email,
    phone_number: newStaff.phone_number,
    role: newStaff.role,
    department: newStaff.department,
    designation: newStaff.designation,
    qualifications: newStaff.qualifications,
    years_of_experience: newStaff.years_of_experience,
    specialization: newStaff.specialization,
    subjects: newStaff.subjects,
    salary: newStaff.salary,
    bank_details: newStaff.bank_details,
    documents: newStaff.documents,
    emergency_contact: newStaff.emergency_contact,
    blood_group: newStaff.blood_group,
    medical_conditions: newStaff.medical_conditions,
    achievements: newStaff.achievements,
  performance_rating: newStaff.performance_rating,
  office_location: newStaff.office_location
  };

  await editStaffMutation.mutateAsync({ id: selectedStaff.user_id.toString(), values: staffData });
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    await deleteStaffMutation.mutateAsync(selectedStaff.user_id.toString());
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
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage teaching and administrative staff</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add New Staff</DialogTitle>
              <DialogDescription>
                Fill in the staff member's details below. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-4 -mr-4">
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Basic Information */}
                <div>
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={newStaff.full_name}
                    onChange={(e) => {
                      setNewStaff({...newStaff, full_name: e.target.value});
                      if (fieldErrors.full_name) setFieldErrors(prev => ({ ...prev, full_name: undefined }));
                    }}
                    placeholder="Staff name"
                  />
                  {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => {
                      setNewStaff({...newStaff, email: e.target.value});
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="staff@example.com"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    type='tel'
                    maxLength={10}
                    minLength={10}
                    value={newStaff.phone_number}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setNewStaff({...newStaff, phone_number: val});
                      if (fieldErrors.phone_number) setFieldErrors(prev => ({ ...prev, phone_number: undefined }));
                    }}
                    placeholder="Staff phone number"
                  />
                  {fieldErrors.phone_number && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone_number}</p>}
                </div>
                <div>
                  <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                  <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value as 'ADMIN' | 'TEACHER'})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.role && <p className="text-xs text-red-500 mt-1">{fieldErrors.role}</p>}
                </div>

                {/* Professional Information */}
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                    placeholder="Department"
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={newStaff.designation}
                    onChange={(e) => setNewStaff({...newStaff, designation: e.target.value})}
                    placeholder="Designation"
                  />
                </div>
                <div>
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Input
                    id="qualifications"
                    value={newStaff.qualifications?.join(', ')}
                    onChange={(e) => setNewStaff({...newStaff, qualifications: e.target.value.split(',').map(q => q.trim())})}
                    placeholder="Enter qualifications (comma-separated)"
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={newStaff.specialization?.join(', ')}
                    onChange={(e) => setNewStaff({...newStaff, specialization: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="Enter specializations (comma-separated)"
                  />
                </div>
                <div>
                  <Label htmlFor="subjects">Subjects</Label>
                  <Input
                    id="subjects"
                    value={newStaff.subjects?.join(', ')}
                    onChange={(e) => setNewStaff({...newStaff, subjects: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="Enter subjects (comma-separated)"
                  />
                </div>
                <div>
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    value={newStaff.years_of_experience}
                    onChange={(e) => setNewStaff({...newStaff, years_of_experience: parseInt(e.target.value)})}
                    placeholder="Years of Experience"
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={newStaff.salary}
                    onChange={(e) => setNewStaff({...newStaff, salary: parseFloat(e.target.value)})}
                    placeholder="Salary"
                  />
                </div>
             

                {/* Location and Hours */}
                <div>
                  <Label htmlFor="office_location">Office Location</Label>
                  <Input
                    id="office_location"
                    value={newStaff.office_location}
                    onChange={(e) => setNewStaff({...newStaff, office_location: e.target.value})}
                    placeholder="Office Location"
                  />
                </div>
                {/* working_hours removed */}

                {/* Leave Management */}
              

                {/* Personal Information */}
                <div>
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={newStaff.emergency_contact}
                    onChange={(e) => setNewStaff({...newStaff, emergency_contact: e.target.value})}
                    placeholder="Emergency Contact"
                  />
                </div>
                <div>
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select value={newStaff.blood_group} onValueChange={(value) => setNewStaff({...newStaff, blood_group: value})}>
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
                    value={newStaff.medical_conditions}
                    onChange={(e) => setNewStaff({...newStaff, medical_conditions: e.target.value})}
                    placeholder="Medical Conditions"
                  />
                </div>

                {/* Staff Type removed */}

                {/* Additional Information */}
              <div className="col-span-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={newStaff.bank_details?.bank_name || ''}
                  onChange={(e) => setNewStaff({
                    ...newStaff,
                    bank_details: { ...newStaff.bank_details, bank_name: e.target.value }
                  })}
                  placeholder="Bank Name"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  value={newStaff.bank_details?.ifsc_code || ''}
                  onChange={(e) => setNewStaff({
                    ...newStaff,
                    bank_details: { ...newStaff.bank_details, ifsc_code: e.target.value }
                  })}
                  placeholder="IFSC Code"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={newStaff.bank_details?.account_number || ''}
                  onChange={(e) => setNewStaff({
                    ...newStaff,
                    bank_details: { ...newStaff.bank_details, account_number: e.target.value }
                  })}
                  placeholder="Account Number"
                />
              </div>
              <div className="col-span-2">
                <Label>Documents</Label>
                {Object.entries(newStaff.documents || {}).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-2 mb-2 items-center">
                    <Input value={key} disabled className="bg-gray-100" />
                    <div className="flex gap-2">
                      <Input
                        value={value as string}
                        onChange={(e) => {
                          const updatedDocs = { ...newStaff.documents } as any;
                          updatedDocs[key] = e.target.value;
                          setNewStaff({ ...newStaff, documents: updatedDocs });
                        }}
                        placeholder={`Link for ${key}`}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          const updatedDocs = { ...newStaff.documents } as any;
                          delete updatedDocs[key];
                          setNewStaff({ ...newStaff, documents: updatedDocs });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2 items-center mt-2">
                  <Input
                    value={newDocKey}
                    onChange={(e) => setNewDocKey(e.target.value)}
                    placeholder="Document Name"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newDocValue}
                      onChange={(e) => setNewDocValue(e.target.value)}
                      placeholder="Document Link"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (!newDocKey.trim() || !newDocValue.trim()) return;
                        setNewStaff({
                          ...newStaff,
                          documents: { ...newStaff.documents, [newDocKey.trim()]: newDocValue.trim() },
                        });
                        setNewDocKey('');
                        setNewDocValue('');
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <Label htmlFor="publications">Publications</Label>
                <Input
                  id="publications"
                  type="number"
                  value={newStaff.achievements?.publications ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewStaff({
                      ...newStaff,
                      achievements: { ...newStaff.achievements, publications: val === '' ? undefined : (parseInt(val) || 0) }
                    });
                  }}
                  placeholder="Number of Publications"
                />
              </div>
              <div className="col-span-2">
                <Label>Awards</Label>
                {Array.isArray(newStaff.achievements?.awards) && newStaff.achievements.awards.map((award, idx) => (
                  <div key={idx} className="flex gap-2 my-1">
                    <Input
                      value={award}
                      onChange={(e) => {
                        const updated = [...newStaff.achievements.awards];
                        updated[idx] = e.target.value;
                        setNewStaff({
                          ...newStaff,
                          achievements: { ...newStaff.achievements, awards: updated }
                        });
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        const updated = newStaff.achievements.awards.filter((_, i) => i !== idx);
                        setNewStaff({
                          ...newStaff,
                          achievements: { ...newStaff.achievements, awards: updated }
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2 items-center mt-2">
                  <Input
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    placeholder="New Award Title"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (!newAward.trim()) return;
                      const existing = Array.isArray(newStaff.achievements?.awards) ? newStaff.achievements.awards : [];
                      setNewStaff({
                        ...newStaff,
                        achievements: { ...newStaff.achievements, awards: [...existing, newAward.trim()] }
                      });
                      setNewAward('');
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
            <div className="flex-shrink-0 flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setFieldErrors({}); }}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff} disabled={createStaffMutation.isPending || !newStaff.full_name || !newStaff.email || !newStaff.phone_number || !newStaff.role || Object.keys(fieldErrors).length>0}>
                {createStaffMutation.isPending ? 'Adding...' : 'Add Staff'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats (simplified) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold">{staff.filter((s: any) => s.is_active).length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teachers (Role)</p>
                <p className="text-2xl font-bold">{staff.filter((s: any) => s.role === 'TEACHER').length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins (Role)</p>
                <p className="text-2xl font-bold">{staff.filter((s: any) => s.role === 'ADMIN').length}</p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
  </div>

  {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staff) => (
          <Card key={staff.user_id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {staff.full_name?.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{staff.full_name}</h3>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <Badge variant={staff.is_active ? "default" : "secondary"}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant={staff.is_active ? "secondary" : "default"}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await adminService.updateStaff(staff.user_id.toString(), { is_active: !staff.is_active });
                          queryClient.invalidateQueries({ queryKey: ['staff'] });
                        }}
                      >
                        {staff.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Badge variant="outline">
                        {staff.role === 'ADMIN' ? 'Admin' : staff.role === 'TEACHER' ? 'Teacher' : staff.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(staff)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedStaff(staff);
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
                  <span>{staff.email}</span>
                </div>
                {staff.phone_number && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{staff.phone_number}</span>
                  </div>
                )}
                {staff.department && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{staff.department}</span>
                  </div>
                )}
                {staff.designation && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4" />
                    <span>{staff.designation}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Joined:</span>
                  <span className="font-medium">{new Date(staff.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Staff</DialogTitle>
            <DialogDescription>
              Update staff information below.
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="flex-grow overflow-y-auto pr-4 -mr-4">
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Basic Information */}
                <div>
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={newStaff.full_name}
                    onChange={(e) => {
                      setNewStaff({...newStaff, full_name: e.target.value});
                      if (editFieldErrors.full_name) setEditFieldErrors(prev => ({ ...prev, full_name: undefined }));
                    }}
                    placeholder="Staff name"
                  />
                  {editFieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{editFieldErrors.full_name}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => {
                      setNewStaff({...newStaff, email: e.target.value});
                      if (editFieldErrors.email) setEditFieldErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="staff@example.com"
                  />
                  {editFieldErrors.email && <p className="text-xs text-red-500 mt-1">{editFieldErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={newStaff.phone_number}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setNewStaff({...newStaff, phone_number: val});
                      if (editFieldErrors.phone_number) setEditFieldErrors(prev => ({ ...prev, phone_number: undefined }));
                    }}
                    placeholder="Staff phone number"
                  />
                  {editFieldErrors.phone_number && <p className="text-xs text-red-500 mt-1">{editFieldErrors.phone_number}</p>}
                </div>
                <div>
                  <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                  <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value as 'ADMIN' | 'TEACHER'})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {editFieldErrors.role && <p className="text-xs text-red-500 mt-1">{editFieldErrors.role}</p>}
                </div>

                {/* Professional Information */}
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                    placeholder="Department"
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={newStaff.designation}
                    onChange={(e) => setNewStaff({...newStaff, designation: e.target.value})}
                    placeholder="Designation"
                  />
                </div>
                <div>
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Input
                    id="qualifications"
                    value={newStaff.qualifications?.join(', ')}
                    onChange={(e) => setNewStaff({...newStaff, qualifications: e.target.value.split(',').map(q => q.trim())})}
                    placeholder="Enter qualifications (comma-separated)"
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={newStaff.specialization?.join(', ')}
                    onChange={(e) => setNewStaff({...newStaff, specialization: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="Enter specializations (comma-separated)"
                  />
                </div>
                <div>
                  <Label htmlFor="subjects">Subjects</Label>
                  <Input
                    id="subjects"
                    value={newStaff.subjects?.join(', ')}
                    onChange={(e) => setNewStaff({...newStaff, subjects: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="Enter subjects (comma-separated)"
                  />
                </div>
                <div>
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    value={newStaff.years_of_experience}
                    onChange={(e) => setNewStaff({...newStaff, years_of_experience: parseInt(e.target.value)})}
                    placeholder="Years of Experience"
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={newStaff.salary}
                    onChange={(e) => setNewStaff({...newStaff, salary: parseFloat(e.target.value)})}
                    placeholder="Salary"
                  />
                </div>
                <div>
                  <Label htmlFor="performance_rating">Performance Rating</Label>
                  <Input
                    id="performance_rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={newStaff.performance_rating}
                    onChange={(e) => setNewStaff({...newStaff, performance_rating: parseFloat(e.target.value)})}
                    placeholder="Performance Rating (0-5)"
                  />
                </div>

                {/* Location and Hours */}
                <div>
                  <Label htmlFor="office_location">Office Location</Label>
                  <Input
                    id="office_location"
                    value={newStaff.office_location}
                    onChange={(e) => setNewStaff({...newStaff, office_location: e.target.value})}
                    placeholder="Office Location"
                  />
                </div>
                {/* working_hours removed */}

                {/* Leave Management */}
              
                {/* Personal Information */}
                <div>
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={newStaff.emergency_contact}
                    onChange={(e) => setNewStaff({...newStaff, emergency_contact: e.target.value})}
                    placeholder="Emergency Contact"
                  />
                </div>
                <div>
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select value={newStaff.blood_group} onValueChange={(value) => setNewStaff({...newStaff, blood_group: value})}>
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
                    value={newStaff.medical_conditions}
                    onChange={(e) => setNewStaff({...newStaff, medical_conditions: e.target.value})}
                    placeholder="Medical Conditions"
                  />
                </div>

                {/* Staff Type removed */}

                {/* Additional Information */}
               <div className="col-span-2">
  <Label htmlFor="bank_name">Bank Name</Label>
  <Input
    id="bank_name"
    value={newStaff.bank_details?.bank_name || ""}
    onChange={(e) =>
      setNewStaff({
        ...newStaff,
        bank_details: {
          ...newStaff.bank_details,
          bank_name: e.target.value,
        },
      })
    }
    placeholder="Bank Name"
  />
</div>

<div className="col-span-2">
  <Label htmlFor="ifsc_code">IFSC Code</Label>
  <Input
    id="ifsc_code"
    value={newStaff.bank_details?.ifsc_code || ""}
    onChange={(e) =>
      setNewStaff({
        ...newStaff,
        bank_details: {
          ...newStaff.bank_details,
          ifsc_code: e.target.value,
        },
      })
    }
    placeholder="IFSC Code"
  />
</div>

<div className="col-span-2">
  <Label htmlFor="account_number">Account Number</Label>
  <Input
    id="account_number"
    value={newStaff.bank_details?.account_number || ""}
    onChange={(e) =>
      setNewStaff({
        ...newStaff,
        bank_details: {
          ...newStaff.bank_details,
          account_number: e.target.value,
        },
      })
    }
    placeholder="Account Number"
  />
</div>

                <div className="col-span-2">
  <Label>Documents</Label>
  {Object.entries(newStaff.documents || {}).map(([key, value], index) => (
    <div key={index} className="grid grid-cols-2 gap-2 mb-2 items-center">
      <Input value={key} disabled className="bg-gray-100" />
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => {
            const updatedDocs = { ...newStaff.documents };
            updatedDocs[key] = e.target.value;
            setNewStaff({ ...newStaff, documents: updatedDocs });
          }}
          placeholder={`Link for ${key}`}
        />
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            const updatedDocs = { ...newStaff.documents };
            delete updatedDocs[key];
            setNewStaff({ ...newStaff, documents: updatedDocs });
          }}
        >
          Remove
        </Button>
      </div>
    </div>
  ))}

  {/* Add new document */}
  <div className="grid grid-cols-2 gap-2 items-center mt-2">
    <Input
      value={newDocumentKey}
      onChange={(e) => setNewDocumentKey(e.target.value)}
      placeholder="Document Name"
    />
    <div className="flex gap-2">
      <Input
        value={newDocumentValue}
        onChange={(e) => setNewDocumentValue(e.target.value)}
        placeholder="Document Link"
      />
      <Button
        type="button"
        onClick={() => {
          if (!newDocumentKey.trim() || !newDocumentValue.trim()) return;
          setNewStaff({
            ...newStaff,
            documents: {
              ...newStaff.documents,
              [newDocumentKey.trim()]: newDocumentValue.trim(),
            },
          });
          setNewDocumentKey("");
          setNewDocumentValue("");
        }}
      >
        +
      </Button>
    </div>
  </div>
</div>

                <div className="col-span-2">
  <Label htmlFor="publications">Publications</Label>
  <Input
    id="publications"
    type="number"
    value={newStaff.achievements?.publications ?? ''}
    onChange={(e) => {
      const val = e.target.value;
      setNewStaff({
        ...newStaff,
        achievements: {
          ...newStaff.achievements,
          publications: val === '' ? undefined : (parseInt(val) || 0),
        },
      });
    }}
    placeholder="Number of Publications"
  />
</div>

<div className="col-span-2">
  <Label>Awards</Label>
  {Array.isArray(newStaff.achievements?.awards) &&
    newStaff.achievements.awards.map((award, index) => (
      <div key={index} className="flex gap-2 my-1">
        <Input
          value={award}
          onChange={(e) => {
            const updated = [...newStaff.achievements.awards];
            updated[index] = e.target.value;
            setNewStaff({
              ...newStaff,
              achievements: {
                ...newStaff.achievements,
                awards: updated,
              },
            });
          }}
        />
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            const updated = newStaff.achievements.awards.filter((_, i) => i !== index);
            setNewStaff({
              ...newStaff,
              achievements: {
                ...newStaff.achievements,
                awards: updated,
              },
            });
          }}
        >
          Remove
        </Button>
      </div>
    ))}

  {/* Add new award */}
  <div className="flex gap-2 mt-2">
    <Input
      value={newAward}
      onChange={(e) => setNewAward(e.target.value)}
      placeholder="New Award Title"
    />
    <Button
      type="button"
      onClick={() => {
        if (!newAward.trim()) return;
        const updated = [...(newStaff.achievements?.awards || []), newAward.trim()];
        setNewStaff({
          ...newStaff,
          achievements: {
            ...newStaff.achievements,
            awards: updated,
          },
        });
        setNewAward("");
      }}
    >
      +
    </Button>
  </div>
</div>

              </div>
            </div>
          )}
          <div className="flex-shrink-0 flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedStaff(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditStaff} disabled={editStaffMutation.isPending || !newStaff.full_name || !newStaff.email || !newStaff.phone_number || !newStaff.role || Object.keys(editFieldErrors).length>0}>
              {editStaffMutation.isPending ? 'Saving...' : 'Save Changes'}
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
              This action cannot be undone. This will permanently delete the staff member: {selectedStaff?.full_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffManagement;
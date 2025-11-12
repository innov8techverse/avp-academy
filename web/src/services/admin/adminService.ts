import { apiClient } from '../api';
import axios from 'axios';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  studentProfile?: {
    batchId?: string;
    courseId?: string;
    address?: string;
    emergencyContact?: string;
    batch?: any;
    course?: any;
  };
  createdAt: string;
}

export interface CreateStudentData {
  email: string;
  full_name: string;
  phone_number?: string;
  batch_id?: string;
  course_id?: string;
  address?: string;
  emergency_contact?: string;
  date_of_birth?: string;
  gender?: string;
  city?: string;
  state?: string;
  pincode?: string;
  avatar?: string;
  role?: 'STUDENT';
  is_active?: boolean;
  adhaar_num?: string;
  enrollment_number?: string;
  qualification?: string;
  guardian_name?: string;
  guardian_contact?: string;
  guardian_email?: string;
  guardian_relation?: string;
  mobile_number?: string;
  bio?: string;
  blood_group?: string;
  medical_conditions?: string;
  achievements?: any;
  documents?: any;
  community?: string; // oc, bc, mbc, sc, st
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  duration: number;
  fees: number;
  status: string;
  createdAt: string;
  subjects?: { subject_id: number; name: string; description: string }[];
}

export interface CreateCourseData {
  name: string;
  description: string;
  duration: string;
  category: string;
  fees: number;
  max_students: number;
  start_date: string;
  end_date: string;
  status: boolean;
  instructor_id: string;
  location: string;
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  language: string;
  enrollment_count: number;
  completion_rate: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface Batch {
  batch_id: number;
  batch_name: string;
  timing: string;
  capacity: number;
  course_id: number;
  start_date?: string;
  end_date?: string;
  description?: string;
  is_active: boolean;
  course?: Course;
  students?: any[];
  created_at: string;
}

export interface CreateBatchData {
  batch_name: string;
  timing: string;
  capacity: number;
  course_id: number;
  start_date?: string;
  end_date?: string;
  description?: string;
  is_active?: boolean;
}

export interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStaffData {
  email: string;
  full_name: string;
  phone_number: string;
  role: 'ADMIN' | 'TEACHER';
  department?: string;
  designation?: string;
  qualifications?: string[];
  years_of_experience?: number;
  specialization?: string[];
  subjects?: string[];
  salary?: number;
  bank_details?: Record<string, any>;
  documents?: Record<string, any>;
  emergency_contact?: string;
  blood_group?: string;
  medical_conditions?: string;
  achievements?: Record<string, any>;
  performance_rating?: number;
  office_location?: string;
  working_hours?: Record<string, any>;
  leaves_taken?: number;
  leaves_remaining?: number;
  is_active?: boolean;
}

export interface User {
  user_id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar?: string;
  role: string;
  is_active: boolean;
  student_profile?: {
    batch?: {
      batch_name: string;
    };
    course?: {
      name: string;
    };
  };
}

export const adminService = {
  // Student Management
  getStudents: async (params: any = {}) => {
    return await apiClient.get('/admin/students', { params });
  },

  createStudent: async (data: CreateStudentData) => {
    return await apiClient.post('/admin/students', data);
  },

  updateStudent: async (id: string, data: Partial<CreateStudentData>) => {
    return await apiClient.put(`/admin/students/${id}`, data);
  },

  deleteStudent: async (id: string) => {
    return await apiClient.delete(`/admin/students/${id}`);
  },

  bulkDisableStudents: async (student_ids: number[]) => {
    return await apiClient.post('/admin/students/bulk-disable', { student_ids });
  },

  // Course Management
  getCourses: async (params: any = {}) => {
    return await apiClient.get('/admin/courses', { params });
  },

  createCourse: async (data: CreateCourseData) => {
    return await apiClient.post('/admin/courses', data);
  },

  updateCourse: async (id: string, data: Partial<CreateCourseData>) => {
    return await apiClient.put(`/admin/courses/${id}`, data);
  },

  deleteCourse: async (id: string) => {
    return await apiClient.delete(`/admin/courses/${id}`);
  },

  // Batch Management
  getBatches: async (params: any = {}) => {
    return await apiClient.get('/admin/batches', { params });
  },

  createBatch: async (data: CreateBatchData) => {
    return await apiClient.post('/admin/batches', data);
  },

  updateBatch: async (id: string, data: Partial<CreateBatchData>) => {
    return await apiClient.put(`/admin/batches/${id}`, data);
  },

  deleteBatch: async (id: string) => {
    return await apiClient.delete(`/admin/batches/${id}`);
  },

  // Staff Management
  getStaff: async () => {
    return await apiClient.get('/admin/staff');
  },

  createStaff: async (data: CreateStaffData) => {
    return await apiClient.post('/admin/staff', data);
  },

  updateStaff: async (id: string, data: Partial<CreateStaffData>) => {
    return await apiClient.put(`/admin/staff/${id}`, data);
  },

  deleteStaff: async (id: string) => {
    return await apiClient.delete(`/admin/staff/${id}`);
  },

  // Settings
  getAdminSettings: async () => {
    return await apiClient.get('/admin/settings');
  }
};

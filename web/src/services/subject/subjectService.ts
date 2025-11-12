import axios from 'axios';
import apiClient from '../api';

export interface Subject {
  subject_id: number;
  name: string;
  description: string;
}

export interface CreateSubjectData {
  name: string;
  description: string;
}

const API_BASE = '/subjects';

export const subjectService = {
  getSubjects: async (params: any = {}) => {
    const { data } = await apiClient.get(API_BASE, { params });
    return data;
  },
  createSubject: async (subject: CreateSubjectData) => {
    const { data } = await apiClient.post(API_BASE, subject);
    return data;
  },
  updateSubject: async (id: number, subject: Partial<CreateSubjectData>) => {
    const { data } = await apiClient.put(`${API_BASE}/${id}`, subject);
    return data;
  },
  deleteSubject: async (id: number) => {
    const { data } = await apiClient.delete(`${API_BASE}/${id}`);
    return data;
  },
}; 
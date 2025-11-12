import { apiClient } from '../api';

export interface StudyMaterial {
  id: string;
  title: string;
  description?: string;
  subject: string;
  topic: string;
  type: 'PDF' | 'PPT' | 'DOC' | 'IMAGE' | 'OTHER';
  fileUrl: string;
  fileName: string;
  fileSize: string;
  isPublished: boolean;
  courseId: string;
  course?: any;
  createdAt: string;
}

export interface MaterialQuery {
  page?: number;
  limit?: number;
  search?: string;
  subject?: string;
  type?: string;
  courseId?: string;
  batchId?: string;
}

export interface BatchAssignment {
  material_batch_id: number;
  material_id: number;
  batch_id: number;
  assigned_at: string;
  batch: {
    batch_id: number;
    batch_name: string;
    course: {
      course_id: number;
      name: string;
    };
  };
}

export const contentService = {
  getStudyMaterials: async (params: MaterialQuery = {}) => {
    return await apiClient.get('/content', { params });
  },

  uploadStudyMaterial: async (formData: FormData) => {
    return await apiClient.post('/content', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadVideo: async (formData: FormData) => {
    return await apiClient.post('/content/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  toggleMaterialPublish: async (id: string, isPublished: boolean) => {
    return await apiClient.patch(`/content/${id}/publish`, { isPublished });
  },

  getFile: async (filename: string) => {
    return await apiClient.get(`/content/files/${filename}`, {
      responseType: 'blob',
    });
  },

  // Get material by ID
  getMaterialById: async (id: string) => {
    return await apiClient.get(`/content/${id}`);
  },

  // Update material
  updateMaterial: async (id: string, data: Partial<StudyMaterial>) => {
    return await apiClient.put(`/content/${id}`, data);
  },

  // Delete material
  deleteMaterial: async (id: string) => {
    return await apiClient.delete(`/content/${id}`);
  },

  // Batch assignment methods
  assignMaterialToBatches: async (materialId: string, batchIds: number[]) => {
    return await apiClient.post(`/content/${materialId}/assign-batches`, { batchIds });
  },

  getMaterialBatchAssignments: async (materialId: string) => {
    return await apiClient.get(`/content/${materialId}/batch-assignments`);
  },

  getBatchesForMaterialAssignment: async (courseId?: string) => {
    const params = courseId ? { courseId } : {};
    return await apiClient.get('/content/batches/for-assignment', { params });
  }
};

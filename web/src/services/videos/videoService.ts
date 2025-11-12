
import { apiClient } from '../api';

export interface Video {
  id: string;
  title: string;
  description?: string;
  subject: string;
  topic: string;
  videoUrl: string;
  thumbnail?: string;
  duration?: string;
  views: number;
  isPublished: boolean;
  courseId: string;
  course?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface VideoQuery {
  page?: number;
  limit?: number;
  subject?: string;
  search?: string;
}

export interface VideoResponse {
  success: boolean;
  data: Video[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const videoService = {
  getVideos: async (params: VideoQuery = {}): Promise<VideoResponse> => {
    return await apiClient.get('/videos', { params });
  },

  getVideoById: async (id: string): Promise<{ success: boolean; data: Video }> => {
    return await apiClient.get(`/videos/${id}`);
  },

  downloadVideo: async (id: string) => {
    return await apiClient.post(`/videos/${id}/download`);
  },

  getVideoSubjects: async (): Promise<{ success: boolean; data: string[] }> => {
    return await apiClient.get('/videos/subjects');
  }
};

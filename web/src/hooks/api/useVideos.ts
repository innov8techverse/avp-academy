
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videoService, VideoQuery } from '@/services/videos';
import { useToast } from '@/hooks/use-toast';

export const useVideos = (params: VideoQuery = {}) => {
  return useQuery({
    queryKey: ['videos', params],
    queryFn: () => videoService.getVideos(params),
  });
};

export const useVideo = (id: string) => {
  return useQuery({
    queryKey: ['video', id],
    queryFn: () => videoService.getVideoById(id),
    enabled: !!id,
  });
};

export const useVideoSubjects = () => {
  return useQuery({
    queryKey: ['video-subjects'],
    queryFn: videoService.getVideoSubjects,
  });
};

export const useDownloadVideo = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => videoService.downloadVideo(id),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Video download authorized',
      });
      // Handle download URL
      if (data.data.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Download failed',
        variant: 'destructive',
      });
    },
  });
};

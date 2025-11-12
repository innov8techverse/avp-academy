
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Eye, Download } from 'lucide-react';
import { useVideos } from '@/hooks/api/useVideos';
import { useDownloadVideo } from '@/hooks/api/useVideos';

interface Video {
  id: string;
  title: string;
  instructor: string;
  subject: string;
  duration: string;
  views: number;
  thumbnail: string;
  level: string;
  isDownloaded?: boolean;
}

interface VideoListProps {
  videos?: Video[];
  onVideoSelect?: (videoId: string) => void;
}

const VideoList: React.FC<VideoListProps> = ({ videos: propVideos, onVideoSelect }) => {
  const { data: videosData, isLoading } = useVideos({ limit: 10 });
  const downloadVideo = useDownloadVideo();
  
  const videos = propVideos || videosData?.data || [];

  const handleDownload = (videoId: string) => {
    downloadVideo.mutate(videoId);
  };

  const handlePlay = (videoId: string) => {
    onVideoSelect?.(videoId);
  };

  const defaultVideos = [
    {
      id: '1',
      title: 'Physics - Newton\'s Laws of Motion',
      instructor: 'Dr. Ravi Sharma',
      subject: 'Physics',
      duration: '45:30',
      views: 1234,
      thumbnail: '',
      level: 'Intermediate'
    },
    {
      id: '2',
      title: 'Mathematics - Calculus Fundamentals',
      instructor: 'Dr. Priya Singh',
      subject: 'Mathematics',
      duration: '38:15',
      views: 987,
      thumbnail: '',
      level: 'Beginner'
    }
  ];

  const displayVideos = videos.length > 0 ? videos : defaultVideos;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Recent Videos</h3>
        <Button variant="outline" size="sm">View All</Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <div className="w-24 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayVideos.map((video) => (
            <Card key={video.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  {/* Video Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                      {video.duration}
                    </div>
                    {video.isDownloaded && (
                      <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                        <Download className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{video.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{video.instructor || 'Instructor'}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {video.subject}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-blue-100 text-blue-800"
                      >
                        {video.level || 'Intermediate'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {video.views?.toLocaleString() || '0'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {video.duration}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      className="h-8"
                      onClick={() => handlePlay(video.id)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8"
                      onClick={() => handleDownload(video.id)}
                      disabled={downloadVideo.isPending}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;

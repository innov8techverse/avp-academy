import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Download } from 'lucide-react';
import { useStudentVideos } from '@/hooks/api/useStudent';
import { useDownloadVideo } from '@/hooks/api/useVideos';
import { useNavigate } from 'react-router-dom';

interface Video {
  id: string;
  title: string;
  subject: {
    name: string;
    description: string;
  } | null;
  topic: string;
  duration: string;
  thumbnail: string;
  isNew?: boolean;
  updated_at: string;
  file_url: string;
  description?: string;
}

interface LatestVideosProps {
  videos?: Video[];
}

const decodeVideoId = (hashedId: string): string => {
  try {
    return atob(hashedId);
  } catch (error) {
    return hashedId;
  }
};

const getYouTubeThumbnail = (encodedVideoId: string, quality: string = 'hqdefault'): string => {
  try {
    const videoId = decodeVideoId(encodedVideoId);
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  } catch (error) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=';
  }
};

const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const updatedDate = new Date(dateString);
  const diffInMs = now.getTime() - updatedDate.getTime();
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? 'just now' : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  } else if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
  } else if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  } else {
    return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
  }
};

const LatestVideos: React.FC<LatestVideosProps> = ({ videos: propVideos }) => {
  const { data: videosData, isLoading } = useStudentVideos();
  const videos = propVideos || videosData?.data?.slice(0, 5) || [];
 
  const displayVideos = videos;
  const navigate = useNavigate();
 
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Latest Lectures</h2>
        <Button variant="ghost" size="sm" onClick={()=> navigate('/student/hub')}>View All</Button>
      </div>
             
      {isLoading ? (
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[1, 2].map((i) => (
            <Card key={i} className="flex-shrink-0 w-72 lg:w-80 animate-pulse">
              <CardContent className="p-0">
                <div className="h-40 lg:h-44 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayVideos.length === 0 ? (
          <div className="h-40 flex items-center justify-center w-full text-gray-500 text-lg">
            No videos available
          </div>
        ) : (
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {displayVideos.map((video) => (
            <Card key={video.id} className="flex-shrink-0 w-72 lg:w-80 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={getYouTubeThumbnail(video.file_url, 'hqdefault')}
                    alt={video.title}
                    className="w-full h-40 lg:h-44 object-cover rounded-t-lg"
                    onError={(e) => {
                      // Fallback to medium quality if high quality fails
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('hqdefault')) {
                        target.src = getYouTubeThumbnail(video.file_url, 'mqdefault');
                      } else if (target.src.includes('mqdefault')) {
                        target.src = getYouTubeThumbnail(video.file_url, 'default');
                      }
                    }}
                  />
                  {video.isNew && (
                    <Badge className="absolute top-2 left-2 bg-green-500">New</Badge>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {video.duration}
                  </div>
                  {/* YouTube play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-t-lg">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {video.subject?.name || 'No Subject'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(video.updated_at)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm lg:text-base">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {video.subject?.description || video.description || 'No description available'}
                  </p>
                  <Button 
                    className="w-full" 
                    size="sm" 
                    onClick={() => {navigate(`/student/video-viewer/${video.file_url}`)}}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestVideos;

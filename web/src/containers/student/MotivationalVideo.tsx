import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudentMaterials } from '@/hooks/api/useStudent';
const MotivationalVideo = () => {
  const navigate = useNavigate();
  const { data: materialsData, isLoading } = useStudentMaterials();

  // Get YouTube thumbnail helper function
  const getYouTubeThumbnail = (encodedVideoId, quality = 'hqdefault') => {
    try {
      const videoId = atob(encodedVideoId); // Decode the video ID
      return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    } catch (error) {
      return 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=225&fit=crop';
    }
  };

  // Filter out null values and check for motivational video
  const validMaterials = materialsData?.data?.filter(material => material !== null) || [];
  
  const motivationalVideo = validMaterials.length > 0 
    ? validMaterials
        .map((material) => ({
          id: material.id,
          title: material.title,
          type: material.type || material.file_type,
          fileUrl: material.file_url,
        }))
        .find((material) => material.type === 'MOTIVATIONAL')
    : null;

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Loading motivational video...</p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={motivationalVideo 
              ? getYouTubeThumbnail(motivationalVideo.fileUrl)
              : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&q=80'
            }
            alt={motivationalVideo?.title || 'Stay Motivated'}
            className="w-full h-40 lg:h-48 object-cover opacity-70"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {motivationalVideo ? (
              <Button
                size="lg"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                onClick={() => navigate(`/student/video-viewer/${motivationalVideo.fileUrl}`)}
              >
                <Play className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
                Watch Daily Motivation
              </Button>
            ) : (
              <div className="text-center px-4">
                <h3 className="text-lg lg:text-xl font-bold mb-2">Stay Motivated!</h3>
                <p className="text-sm lg:text-base opacity-90">
                  Your daily motivation video will appear here soon
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MotivationalVideo;

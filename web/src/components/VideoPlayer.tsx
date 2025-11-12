
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, Settings, ArrowLeft } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  onBack: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);

  const video = {
    id: videoId,
    title: 'Physics - Newton\'s Laws of Motion',
    subject: 'Physics',
    topic: 'Mechanics',
    duration: '45:30',
    description: 'Comprehensive explanation of Newton\'s three laws of motion with real-world examples and applications.',
    instructor: 'Dr. Ravi Sharma',
    uploadDate: '2024-06-14'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Videos
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Video Player */}
      <Card className="overflow-hidden bg-black">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gray-900">
            {/* Video placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </div>
                <p className="text-lg font-medium">DRM Protected Content</p>
                <p className="text-sm opacity-75">Video playback is secure and protected</p>
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <span className="text-white text-sm">15:30 / 45:30</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    className={`text-white hover:bg-white/20 ${showSubtitles ? 'bg-white/20' : ''}`}
                  >
                    CC
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-white/30 rounded-full h-1 mt-2">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: '34%' }}></div>
              </div>
            </div>

            {/* Subtitle overlay */}
            {showSubtitles && (
              <div className="absolute bottom-16 left-0 right-0 text-center">
                <div className="inline-block bg-black/80 text-white px-4 py-2 rounded">
                  Newton's first law states that an object at rest will remain at rest...
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
              <div className="flex gap-2 mb-3">
                <Badge variant="outline">{video.subject}</Badge>
                <Badge variant="outline">{video.topic}</Badge>
              </div>
              <p className="text-gray-600 mb-4">{video.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Instructor: {video.instructor}</span>
                <span>Duration: {video.duration}</span>
                <span>Uploaded: {new Date(video.uploadDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Videos */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Related Videos</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <img 
                  src={`https://images.unsplash.com/photo-148859052850${i}-98d2b5aba04b?w=120&h=68&fit=crop`}
                  alt="Related video"
                  className="w-20 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Physics - Motion in a Straight Line</h4>
                  <p className="text-sm text-gray-600">Dr. Ravi Sharma • 38:15</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoPlayer;

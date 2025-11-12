
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, PlayCircle, Download } from 'lucide-react';
import { useStudentVideos } from '@/hooks/api/useStudent';

const VideoHeader = () => {
  const { data: videosData } = useStudentVideos();
  const downloadedCount = videosData?.data?.filter((video: any) => video.isDownloaded)?.length || 5;

  return (
    <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold flex items-center">
          <Video className="w-6 h-6 mr-2" />
          Learning Hub
        </CardTitle>
        <p className="text-green-100">Master concepts with expert video lectures</p>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <PlayCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">Continue watching: Physics - Chapter 5</span>
          </div>
          <div className="flex items-center text-sm bg-white/20 px-3 py-1 rounded-full">
            <Download className="w-4 h-4 mr-1" />
            {downloadedCount} Downloaded
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoHeader;

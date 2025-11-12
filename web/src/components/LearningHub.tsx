
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, BookOpen, FileText, Download, Clock, File, Presentation, FileImage } from 'lucide-react';
import { useStudentVideos } from '@/hooks/api/useStudent';
import { useStudyMaterials, useDownloadFile } from '@/hooks/api/useContent';
import { useDownloadVideo } from '@/hooks/api/useVideos';

const LearningHub = () => {
  const { data: videosData, isLoading: videosLoading } = useStudentVideos();
  const { data: materialsData, isLoading: materialsLoading } = useStudyMaterials();
  const downloadVideo = useDownloadVideo();
  const downloadFile = useDownloadFile();

  const videos = videosData?.data?.videos || [];
  const studyMaterials = materialsData?.data?.materials || [];

  const getFileIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PDF': return { icon: FileText, color: 'text-red-600 bg-red-50' };
      case 'PPT': return { icon: Presentation, color: 'text-orange-600 bg-orange-50' };
      case 'DOC': return { icon: File, color: 'text-blue-600 bg-blue-50' };
      case 'IMAGE': return { icon: FileImage, color: 'text-green-600 bg-green-50' };
      default: return { icon: File, color: 'text-gray-600 bg-gray-50' };
    }
  };

  const handleVideoWatch = (videoId: string) => {
    // Navigate to video player
  };

  const handleVideoDownload = (videoId: string) => {
    downloadVideo.mutate(videoId);
  };

  const handleMaterialDownload = (filename: string) => {
    downloadFile.mutate(filename);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Hub</h1>
        <p className="text-gray-600">Access all your study materials in one place</p>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="videos">Video Lectures</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Study Notes</TabsTrigger>
  
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          {videosLoading ? (
            <div className="text-center py-8">Loading videos...</div>
          ) : (
            <div className="grid gap-4">
              {videos.map((video: any) => (
                <Card key={video.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="relative">
                        <img 
                          src={video.thumbnail || 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=225&fit=crop'} 
                          alt={video.title}
                          className="w-48 h-32 object-cover rounded-l-lg"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-l-lg">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                          {video.duration || '45:00'}
                        </div>
                        {video.isNew && (
                          <Badge className="absolute top-2 left-2 bg-green-500">New</Badge>
                        )}
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                              {video.title}
                            </h3>
                            <div className="flex gap-2 mb-3">
                              <Badge variant="outline">{video.subject}</Badge>
                              <Badge variant="outline">{video.topic}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                              Uploaded on {new Date(video.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleVideoDownload(video.id)}
                              disabled={downloadVideo.isPending}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleVideoWatch(video.id)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Watch
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {materialsLoading ? (
            <div className="text-center py-8">Loading materials...</div>
          ) : (
            <div className="grid gap-4">
              {studyMaterials.map((material: any) => {
                const { icon: IconComponent, color } = getFileIcon(material.type);
                return (
                  <Card key={material.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`p-3 rounded-lg ${color}`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                              {material.title}
                            </h3>
                            <div className="flex gap-2 mb-2">
                              <Badge variant="outline">{material.subject}</Badge>
                              <Badge variant="outline">{material.type}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{material.fileSize}</span>
                              <span>Topic: {material.topic}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Preview
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleMaterialDownload(material.fileName)}
                            disabled={downloadFile.isPending}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="grid gap-4">
            {studyMaterials.filter((material: any) => material.type === 'PDF').map((note: any) => (
              <Card key={note.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {note.title}
                        </h3>
                        <div className="flex gap-2 mb-2">
                          <Badge variant="outline">{note.subject}</Badge>
                          <Badge variant="outline">{note.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{note.fileSize}</span>
                          <span>Topic: {note.topic}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Preview
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleMaterialDownload(note.fileName)}
                        disabled={downloadFile.isPending}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default LearningHub;

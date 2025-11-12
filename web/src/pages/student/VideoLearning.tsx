import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoHeader from '@/containers/video/VideoHeader';
import BottomNavigation from '@/components/common/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  FileText, 
  Image, 
  Download, 
  Search, 
  Book,
  Video,
  File,
  Clock,
  Eye
} from 'lucide-react';
import { useStudentVideos, useStudentMaterials } from '@/hooks/api/useStudent';
import { useDownloadVideo } from '@/hooks/api/useVideos';
import { useToast } from '@/hooks/use-toast';
import { useStudentProfile } from '@/hooks/api/useStudent';
// PDF Viewer
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin,ToolbarSlot, ToolbarProps } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface VideoLearningProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Helper to normalize file type
function getNormalizedType(type: string, fileName = ''): string {
  if (!type && fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (["pdf"].includes(ext)) return "pdf";
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "image";
    if (["ppt", "pptx"].includes(ext)) return "ppt";
    if (["doc", "docx"].includes(ext)) return "doc";
    if (["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(ext)) return "video";
  }
  if (!type) return '';
  const t = type.toString().toLowerCase();
  if (t === 'pdf' || t === 'application/pdf') return 'pdf';
  if (t === 'image' || t.startsWith('image/')) return 'image';
  if (t === 'doc' || t === 'application/msword' || t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'doc';
  if (t === 'ppt' || t === 'application/vnd.ms-powerpoint' || t === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'ppt';
  if (t === 'video' || t.startsWith('video/')) return 'video';
  return t;
}

// Helper to get absolute URL for files
const getAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // Remove trailing /api if present
  return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '')}${url}`;
};

// Helper to format duration
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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

const VideoLearning: React.FC<VideoLearningProps> = ({ activeTab, onTabChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const { toast } = useToast();
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: materialsData, isLoading: materialsLoading } = useStudentMaterials();
  const downloadVideoMutation = useDownloadVideo();
  const { data: studentProfileData, isLoading: studentProfileLoading } = useStudentProfile();

  const materials = materialsData?.data || [];

  // Combine materials and videos for display
  const learningMaterials = [
    // Add other materials - Filter out null/undefined materials and add null checks
    ...materials
      .filter((material: any) => material != null) // Remove null/undefined items
      .map((material: any) => {
        // Additional safety checks for material properties
        if (!material) return null;
        
        const materialType = material.type || material.file_type || '';
        const materialFileName = material.fileName || material.file_name || material.title || '';
        const normalizedType = getNormalizedType(materialType, materialFileName);
        const absFileUrl = getAbsoluteUrl(material.type === 'video' ? material.fileUrl : (material.fileUrl || material.url || material.file_url));
        
        return {
          id: material.id || Math.random().toString(36).substr(2, 9), // Fallback ID if missing
          title: material.title || 'Untitled',
          type: normalizedType,
          subject: material.subject?.name || material.subject || 'General',
          topic: material.topic || 'General',
          size: material.fileSize || material.size || material.file_size || '1.0 MB',
          thumbnail: normalizedType === 'image' && absFileUrl ? absFileUrl : 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=225&fit=crop',
          url: absFileUrl,
          fileUrl: normalizedType === 'video' ?  (material.fileUrl || material.file_url) : absFileUrl,
          fileName: material.fileName || material.title || 'Unknown',
          description: material.description || 'Study material description',
          uploadDate: material.createdAt || material.created_at || new Date().toISOString(),
          views: material.views || 0,
          isNew: false,
          isVideo: false
        };
      })
      .filter(Boolean) // Remove any null results from the mapping
  ];

  const filteredMaterials = learningMaterials.filter(material => {
    if (!material) return false; // Additional safety check
    
    const matchesSearch = (material.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'ppt': return <File className="w-4 h-4" />;
      case 'doc': return <Book className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'pdf': return 'bg-blue-100 text-blue-800';
      case 'ppt': return 'bg-orange-100 text-orange-800';
      case 'doc': return 'bg-green-100 text-green-800';
      case 'image': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMaterialClick = (material: any) => {
    if (!material) return;
    
    if (material.type === 'video') {
      navigate(`/student/video-viewer/${material.fileUrl}`);
    } else if (["pdf", "ppt", "doc"].includes(material.type)) {
      window.open(material.fileUrl, '_blank', 'noopener');
    } else if (material.type === 'image') {
      setPreviewMaterial(material);
    } else {
      toast({
        title: 'Download',
        description: `Downloading ${material.title}`,
      });
      window.open(material.fileUrl, '_blank', 'noopener');
    }
  };

  const handlePreview = (material: any) => {
    if (!material) return;
    
    if (material.type === 'video') {
      navigate(`/student/video-viewer/${material.fileUrl}`);
      return;
    }

    setPreviewMaterial(material);
    // For PDF, fetch as blob and create object URL
    if (material.type === 'pdf') {
      setPreviewUrl(getAbsoluteUrl(material.fileUrl));
    } else if (material.type === 'doc' || material.type === 'ppt') {
      // Use Office Online Viewer
      const encoded = encodeURIComponent(getAbsoluteUrl(material.fileUrl));
      setPreviewUrl(`https://view.officeapps.live.com/op/view.aspx?src=${encoded}`);
    } else if (material.type === 'image') {
      setPreviewUrl(getAbsoluteUrl(material.fileUrl));
    } else {
      setPreviewUrl(null);
    }
  };

  const subjects = ['all', ...Array.from(new Set(learningMaterials.filter(Boolean).map(m => m?.subject).filter(Boolean)))];

  React.useEffect(() => {
    
  }, [studentProfileData, materialsData]);

  const defaultLayoutPluginInstance =  defaultLayoutPlugin({
    renderToolbar: (Toolbar: (props: ToolbarProps) => React.ReactElement) => (
      <Toolbar>
        {(slots: ToolbarSlot) => {
          const {
            CurrentPageInput,
            EnterFullScreen,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            ShowSearchPopover,
            Zoom,
            ZoomIn,
            ZoomOut,
          } = slots;
          return (
            <div style={{ alignItems: 'center', display: 'flex', width: '100%' }}>
              <div style={{ padding: '0px 2px' }}><ShowSearchPopover /></div>
              <div style={{ padding: '0px 2px' }}><ZoomOut /></div>
              <div style={{ padding: '0px 2px' }}><Zoom /></div>
              <div style={{ padding: '0px 2px' }}><ZoomIn /></div>
              <div style={{ padding: '0px 2px', }}><GoToPreviousPage /></div>
              <div style={{ padding: '0px 2px' }}>

                <CurrentPageInput /> </div>
                
                 <div style={{ padding: '0px 2px' }}>/<NumberOfPages />  </div> 
              <div style={{ padding: '0px 2px' }}><GoToNextPage /></div>
              
            </div>
          );
        }}
      </Toolbar>
    ),
    sidebarTabs: (defaultTabs) => [defaultTabs[0]], // Only show thumbnails tab
  });;

  if (materialsLoading || studentProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading learning materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Learning Hub</h1>
          <p className="text-blue-100">Access all your learning materials in one place</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Enhanced Search and Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {subjects.map(subject => (
                  <Button
                    key={subject}
                    variant={selectedSubject === subject ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSubject(subject)}
                    className="whitespace-nowrap"
                  >
                    {subject === 'all' ? 'All' : subject}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material Type Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Book className="w-4 h-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              PDFs
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredMaterials.map((material) => material && material.type !== 'motivational' && ( 
                <Card key={material.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img 
                      src={material.type === 'video' ? getYouTubeThumbnail(material.fileUrl, 'hqdefault') : material.thumbnail} 
                      alt={material.title}
                      className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {material.isNew && (
                      <Badge className="absolute top-2 left-2 bg-green-500">New</Badge>
                    )}
                    <Badge className={`absolute top-2 right-2 ${getTypeColor(material.type)}`}>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(material.type)}
                        {material.type.toUpperCase()}
                      </span>
                    </Badge>
                    {material.type === 'video' && material.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(material.duration)}
                      </div>
                    )}
                    {material.type !== 'video' && material.size && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                        {material.size}
                      </div>
                    )}
                    {material.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <div className="bg-white/90 rounded-full p-3">
                          <Play className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">{material.subject}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                        onClick={() => handleMaterialClick(material)}
                      >
                        {material.type === 'video' ? <Play className="w-4 h-4" /> :<> </>}
                      </Button>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base">
                      {material.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {material.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="truncate">{material.topic}</span>
                      <div className="flex items-center gap-1 ml-2">
                        <Eye className="w-3 h-3" />
                        {material.views}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handlePreview(material)}
                    >
                      {material.type === 'video' ? <Play className="w-4 h-4" /> : getTypeIcon(material.type)}
                      <span className="ml-2">
                        {material.type === 'video' ? 'Watch' : 'Preview'}
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {["video", "pdf", "ppt", "doc", "image"].map(type => (
            <TabsContent key={type} value={type} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredMaterials.filter(m => m && m.type === type).map((material) => material && material.type !== 'motivational' && (
                  <Card key={material.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img 
                        src={material.type === 'video' ? getYouTubeThumbnail(material.fileUrl, 'hqdefault') : material.thumbnail} 
                        alt={material.title}
                        className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {material.isNew && (
                        <Badge className="absolute top-2 left-2 bg-green-500">New</Badge>
                      )}
                      <Badge className={`absolute top-2 right-2 ${getTypeColor(material.type)}`}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(material.type)}
                          {material.type.toUpperCase()}
                        </span>
                      </Badge>
                      {material.type === 'video' && material.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(material.duration)}
                        </div>
                      )}
                      {material.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                          <div className="bg-white/90 rounded-full p-3">
                            <Play className="w-6 h-6 text-red-600" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {material.title}
                      </h3>
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => handlePreview(material)}
                      >
                        {material.type === 'video' ? <Play className="w-4 h-4" /> : getTypeIcon(material.type)}
                        <span className="ml-2">
                          {material.type === 'video' ? 'Watch' : 'Preview'}
                        </span>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Preview Modal */}
        {previewMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => { setPreviewMaterial(null); setPreviewUrl(null); }}>
            <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl w-full relative min-h-[300px] max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <Button className="absolute top-2 right-2" size="sm" onClick={() => { setPreviewMaterial(null); setPreviewUrl(null); }}>Close</Button>
              <h2 className="text-lg font-semibold mb-2">{previewMaterial.title}</h2>
              {previewMaterial.type === 'pdf' && previewUrl ? (
                <div style={{ height: '70vh', background: '#fff' }}>
                  <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                    <Viewer fileUrl={previewUrl} plugins={[defaultLayoutPluginInstance]} />
                  </Worker>
                </div>
              ) : previewMaterial.type === 'image' && previewUrl ? (
                <img src={previewUrl} alt={previewMaterial.title} className="max-w-full max-h-[70vh] mx-auto" />
              ) : (previewMaterial.type === 'doc' || previewMaterial.type === 'ppt') && previewUrl ? (
                <iframe src={previewUrl} title="Office Viewer" className="w-full" style={{ minHeight: 500, border: 0 }}></iframe>
              ) : (!['pdf', 'image', 'doc', 'ppt', 'video'].includes(previewMaterial.type)) ? (
                <div className="text-center mt-8">
                  <p>Preview not available for this file type.</p>
                  <Button asChild className="mt-4">
                    <a href={previewMaterial.fileUrl} target="_blank" rel="noopener noreferrer">Download/Open</a>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredMaterials.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
             
            </CardContent>
          </Card>
        )}
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default VideoLearning;
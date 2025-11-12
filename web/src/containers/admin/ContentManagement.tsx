import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';  
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Upload, Download, Video, FileText, Image, File, Eye, AlertCircle } from 'lucide-react';
import { useContent } from '@/hooks/api/useContent';
import { useCourses } from '@/hooks/api/useAdmin';
import { useBatches } from '@/hooks/api/useAdmin';
import { useSubjects } from '@/hooks/api/useSubjects';
import { useToast } from '@/hooks/use-toast';
import { MaterialType, MaterialStatus } from '@/types/content';
import { compressImage, compressPDF, compressDocument, convertToPDF } from '@/utils/compression';
import { useNavigate } from 'react-router-dom';
import { contentService } from '@/services/content/contentService';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sub } from 'date-fns';

// Update UploadData interface for type safety
interface UploadData {
  title: string;
  description: string;
  subjectId?: string;
  topic?: string;
  courseId?: string;
  batchIds?: string[];
  type: MaterialType;
  status: MaterialStatus;
  youtubeUrl?: string;
}

interface EditData {
  title: string;
  description: string;
  subjectId?: string;
  topic?: string;
  courseId?: string;
  batchIds?: string[];
  type: MaterialType;
  status: MaterialStatus;
}

const ContentManagement = () => {
  const { toast } = useToast();
  const { data: materialsResponse, isLoading: materialsLoading, refetch } = useContent();
  const { data: coursesResponse } = useCourses();
  const { data: batchesResponse } = useBatches();
  const { data: subjectsResponse } = useSubjects();

  const navigate = useNavigate();


  const materials = materialsResponse?.data || [];
  const courses = coursesResponse?.data || [];
  const batches = batchesResponse?.data || [];
  const subjects = subjectsResponse || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBatches, setSelectedBatches] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Items per page
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showConversionAlert, setShowConversionAlert] = useState(false);
  const [uploadData, setUploadData] = useState<UploadData>({
    title: '',
    description: '',
    type: MaterialType.PDF,
    status: MaterialStatus.DRAFT,
    courseId: undefined,
    batchIds: [],
    subjectId: '',
    youtubeUrl: '',
  });
  const [editData, setEditData] = useState<EditData>({
    title: '',
    description: '',
    type: MaterialType.PDF,
    status: MaterialStatus.DRAFT,
    courseId: undefined,
    batchIds: [],
    subjectId: '',
  });

  const handleCourseChange = (courseId: string) => {
    setUploadData({
      ...uploadData,
      courseId,
      subjectId: '',
      batchIds: []
    });
  };

  const hashVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    match ? match[1] : '';
    try {
      return btoa(match[1]);
    } catch (error) {
      return match[1];
    }
  };

  const handleEditCourseChange = (courseId: string) => {
    setEditData({
      ...editData,
      courseId,
      subjectId: '',
      batchIds: []
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `File size must be less than 5MB. Current size: ${formatFileSize(file.size)}`,
        variant: 'destructive',
      });
      return;
    }

    setIsCompressing(true);
    setShowConversionAlert(false);

    try {
      let compressedFile = file;
      const fileType = getFileType(file.name);
      const originalType = fileType;

      // Check if file needs conversion
      if (fileType === MaterialType.DOC || fileType === MaterialType.PPT) {
        setShowConversionAlert(true);
        // Convert Word/PPT files to PDF
        compressedFile = await convertToPDF(file);
      } else if (fileType === MaterialType.IMAGE) {
        compressedFile = await compressImage(file);
      } else if (fileType === MaterialType.PDF) {
        compressedFile = await compressPDF(file);
      }

      setUploadFile(compressedFile);
      setUploadData({
        ...uploadData,
        type: originalType === MaterialType.DOC || originalType === MaterialType.PPT ? MaterialType.PDF : fileType,
        subjectId: uploadData.courseId ? subjects.find(s => s.courses?.some(c => String(c.course_id) === String(uploadData.courseId)))?.subject_id : ''
      });
    } catch (error) {
      setUploadFile(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const getFileType = (filename: string): MaterialType => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return MaterialType.PDF;
      case 'doc':
      case 'docx': return MaterialType.DOC;
      case 'ppt':
      case 'pptx': return MaterialType.PPT;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return MaterialType.IMAGE;
      default: return MaterialType.OTHER;
    }
  };

  const handleUpload = async (isVideo: boolean = false, isMotivational: boolean = false) => {
    if (!uploadData.title || (!isVideo && !isMotivational && !uploadFile) || ((isVideo || isMotivational) && !uploadData.youtubeUrl)) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields' + ((isVideo || isMotivational) ? ' and provide a YouTube URL' : ' and select a file'),
        variant: 'destructive',
      });
      return;
    }
    if (isMotivational && materials.some(m => m.type === MaterialType.MOTIVATIONAL)) {
      toast({
        title: 'Error',
        description: 'A motivational video already exists. Only one motivational video is allowed.',
        variant: 'destructive',
      });
      return;
    }

    try {

      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('courseId', isMotivational ? '' : uploadData.courseId.toString());
      formData.append('type', isMotivational ? MaterialType.MOTIVATIONAL : isVideo ? MaterialType.VIDEO : uploadData.type);
      formData.append('is_published', (isMotivational ? true : (uploadData.status === MaterialStatus.PUBLISHED)).toString());
      if (!isMotivational) {

        if (uploadData.batchIds && uploadData.batchIds.length > 0) {
          formData.append('batchIds', uploadData.batchIds.join(','));
        }

        if (uploadData.subjectId) {
          formData.append('subjectId', uploadData.subjectId);
        }
      }
      if (isVideo || isMotivational) {
        const hashed = hashVideoId(uploadData.youtubeUrl);
        formData.append('youtubeUrl', hashed);
      } else {
        formData.append('file', uploadFile!);
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Material uploaded successfully',
        });

        // Refresh the materials list
        refetch();
      } else {
        throw new Error(result.message || 'Upload failed');
      }

      setIsUploadDialogOpen(false);
      setUploadFile(null);
      setShowConversionAlert(false);
      setUploadData({
        title: '',
        description: '',
        type: MaterialType.PDF,
        status: MaterialStatus.DRAFT,
        courseId: undefined,
        batchIds: [],
        subjectId: '',
        youtubeUrl: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload material',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    
    // Extract subject ID - handle both string and object structures
    let subjectId = '';
    if (typeof material.subject === 'object' && material.subject?.subject_id) {
      // Subject is an object with subject_id
      subjectId = String(material.subject.subject_id);
    } else if (typeof material.subject === 'string' && material.subject) {
      // Subject is a string - look up subject_id from subjects list
      const matchedSubject = subjects.find(sub => 
        sub.name && sub.name.trim() === material.subject.trim()
      );
      if (matchedSubject) {
        subjectId = String(matchedSubject.subject_id);
      }
    } else if (material.subject_id) {
      // Subject ID directly on material
      subjectId = String(material.subject_id);
    } else if (material.subjectId) {
      // Subject ID with camelCase
      subjectId = String(material.subjectId);
    }
    
    setEditData({
      title: material.title || '',
      description: material.description || '',
      subjectId: subjectId,
      topic: material.topic || '',
      courseId: material.courseId || '',
      batchIds: material.batch_materials?.map((bm: any) => {
        // Handle flat structure (batch_id directly on bm)
        if (bm.batch_id !== undefined) {
          return String(bm.batch_id);
        }
        // Handle nested structure (batch_id on nested batch object)
        if (bm.batch?.batch_id !== undefined) {
          return String(bm.batch.batch_id);
        }
        return null;
      }).filter(Boolean) || [],
      type: material.type || MaterialType.PDF,
      status: material.isPublished ? MaterialStatus.PUBLISHED : MaterialStatus.DRAFT,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMaterial || !editData.title) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updateData = {
        title: editData.title,
        description: editData.description,
        subject_id: editData.subjectId ? parseInt(editData.subjectId) : null,
        course_id: editData.courseId ? parseInt(editData.courseId) : null,
        is_published: editData.status === MaterialStatus.PUBLISHED
      };

      await contentService.updateMaterial(editingMaterial.id, updateData);

      // Update batch assignments if batchIds are provided
      if (editData.batchIds && editData.batchIds.length > 0) {
        const batchIds = editData.batchIds.map(id => parseInt(id));
        await contentService.assignMaterialToBatches(editingMaterial.id, batchIds);
      }

      toast({
        title: 'Success',
        description: 'Material updated successfully',
      });

      setIsEditDialogOpen(false);
      setEditingMaterial(null);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update material',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (material: any) => {
    try {
      await contentService.deleteMaterial(material.id);
      toast({
        title: 'Success',
        description: 'Material deleted successfully',
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete material',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'VIDEO':
        return <Video className="w-6 h-6 text-purple-500" />;
      case 'MOTIVATIONAL':
        return <Video className="w-6 h-6 text-blue-500" />;
      case 'IMAGE':
        return <Image className="w-6 h-6 text-green-500" />;
      default:
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const fileTypes = ['PDF', 'DOC', 'PPT', 'IMAGE', 'VIDEO', 'MOTIVATIONAL', 'OTHER'];

  // Universal text search function that works with any language including Tamil
  const universalTextSearch = (text: string, searchTerm: string): boolean => {
    if (!text || !searchTerm) return true;
    
    // Normalize text for better matching across languages
    const normalizedText = text.toLowerCase().trim();
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // Direct match
    if (normalizedText.includes(normalizedSearch)) return true;
    
    // Remove extra spaces and try again
    const cleanText = normalizedText.replace(/\s+/g, ' ');
    const cleanSearch = normalizedSearch.replace(/\s+/g, ' ');
    if (cleanText.includes(cleanSearch)) return true;
    
    // Split search term and check if all parts exist
    const searchParts = cleanSearch.split(' ').filter(part => part.length > 0);
    if (searchParts.length > 1) {
      return searchParts.every(part => cleanText.includes(part));
    }
    
    return false;
  };

  const filteredMaterials = materials.filter(material => {
    // Universal search that works with any language including Tamil
    // Handle both string subject (material.subject = "சிறப்பு மருத்துவம்") 
    // and object subject (material.subject = { subject_id: 92, name: "..." })
    const subjectNameForSearch = typeof material.subject === 'string' 
      ? material.subject 
      : material.subject?.name;
    
    const matchesSearch = !searchTerm || 
      universalTextSearch(material.title, searchTerm) ||
      universalTextSearch(material.description, searchTerm) ||
      (subjectNameForSearch && universalTextSearch(subjectNameForSearch, searchTerm));
    
    // Subject filter - handle both subject IDs and subject names
    // Works with string subject structure: material.subject = "சிறப்பு மருத்துவம்"
    // Also handles nested object structure: material.subject = { subject_id: 92, name: "..." }
    let matchesSubject = true;
    if (selectedSubject) {
      // Get selected subject data for name comparison
      const selectedSubjectData = subjects.find(sub => String(sub.subject_id) === selectedSubject);
      const selectedSubjectName = selectedSubjectData?.name;
      
      // First try to match by subject ID (if material has subject_id)
      const possibleSubjectIds = [
        // Check if subject is an object with subject_id
        typeof material.subject === 'object' ? material.subject?.subject_id : undefined,
        typeof material.subject === 'object' ? material.subject?.id : undefined,
        // Check direct fields on material
        material.subject_id,
        material.subjectId,
        // Check from course
        material.course?.subject_id,
        material.course?.id
      ].filter(Boolean);
      
      const matchesById = possibleSubjectIds.some(id => String(id) === selectedSubject);
      
      // If no ID match, try to match by subject name
      let matchesByName = false;
      if (!matchesById) {
        // Handle string subject (material.subject = "சிறப்பு மருத்துவம்")
        if (typeof material.subject === 'string' && selectedSubjectName) {
          matchesByName = material.subject.trim() === selectedSubjectName.trim();
        }
        // Handle object subject (material.subject = { name: "..." })
        else if (typeof material.subject === 'object' && material.subject?.name && selectedSubjectName) {
          matchesByName = material.subject.name.trim() === selectedSubjectName.trim();
        }
      }
      
      matchesSubject = matchesById || matchesByName;
    }
    
    // Type filter
    const matchesType = !selectedType || material.type === selectedType;
    
    // Batch filter - handle different data structures
    // Works with flat batch_materials structure: { batch_id: number, ... }
    // Also handles nested structure: { batch_id: number, batch: { batch_id: number, ... } }
    const matchesBatch = !selectedBatches || 
      (material.batch_materials && Array.isArray(material.batch_materials) && material.batch_materials.length > 0 && 
        material.batch_materials.some((bm: any) => {
          // Handle flat structure (batch_id directly on bm)
          if (bm.batch_id !== undefined) {
            return String(bm.batch_id) === selectedBatches;
          }
          // Handle nested structure (batch_id on nested batch object)
          if (bm.batch?.batch_id !== undefined) {
            return String(bm.batch.batch_id) === selectedBatches;
          }
          return false;
        })) ||
      // Fallback: check alternative structure if it exists
      (material.batches && Array.isArray(material.batches) && material.batches.length > 0 && 
        material.batches.some((batch: any) => {
          const batchId = batch.batch_id ?? batch.id;
          return batchId !== undefined && String(batchId) === selectedBatches;
        }));

    return matchesSearch && matchesSubject && matchesType && matchesBatch;
  });

  // Pagination calculations
  const totalMaterials = filteredMaterials.length;
  const totalPages = Math.ceil(totalMaterials / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalMaterials);
  const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedType, selectedBatches]);

  // Filter batches and subjects by selected course for upload
  const filteredBatches = uploadData.courseId
    ? batches.filter(batch => String(batch.course_id) === String(uploadData.courseId))
    : [];

  const [open, setOpen] = useState(false);

  const filteredSubjects = uploadData.courseId
    ? subjects.filter(subject =>
      subject.courses.some(course => String(course.course_id) === String(uploadData.courseId))
    )
    : subjects;

  // Filter batches and subjects by selected course for edit
  const filteredEditBatches = editData.courseId
    ? batches.filter(batch => String(batch.course_id) === String(editData.courseId))
    : [];
  const filteredEditSubjects = editData.courseId
    ? subjects.filter(subject => {
      if (!Array.isArray(subject.courses) || subject.courses.length === 0) {
        return true;
      }
      return subject.courses.some(course => String(course.course_id) === String(editData.courseId));
    })
    : subjects;

  if (materialsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-1">Upload and manage study materials</p>
        </div>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Content
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-4 sm:p-6 sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Upload Study Material</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="document" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="document">Upload Document</TabsTrigger>
                <TabsTrigger value="video">Upload Video</TabsTrigger>
                <TabsTrigger value="motivational">Motivational Video</TabsTrigger>
              </TabsList>
              <TabsContent value="document">
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="file">Select File * (Max 5MB)</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, GIF
                    </p>
                  </div>

                  {showConversionAlert && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>File Conversion Notice:</strong> Your Word or PowerPoint file will be automatically converted to PDF format.
                        Please review the converted file after upload to ensure formatting is preserved.
                        For best results, consider uploading files directly in PDF format.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={uploadData.title}
                        onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="course">Course</Label>
                      <Select
                        value={uploadData.courseId || ''}
                        onValueChange={handleCourseChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.filter((course) => course.status === "ACTIVE").length > 0 ? (
                            courses
                              .filter((course) => course.status === "ACTIVE")
                              .map((course) => {
                                const courseId = (course.course_id || course.id).toString();
                                return (
                                  <SelectItem key={courseId} value={courseId}>
                                    {course.name}
                                  </SelectItem>
                                );
                              })
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No active courses
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Select
                        value={uploadData.subjectId || 'none'}
                        onValueChange={(value) => setUploadData({
                          ...uploadData,
                          subjectId: value === 'none' ? '' : value
                        })}
                        
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={uploadData.courseId ? (filteredSubjects.length ? "Select subject" : "No subjects for course") : "Select course first"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {filteredSubjects.map((subject) => (
                            <SelectItem key={subject.subject_id} value={String(subject.subject_id)}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="batches">Target Batches</Label>
                      <div
                        className="relative w-full"
                        tabIndex={0} // make it focusable
                        onFocus={() => setOpen(true)}
                        onBlur={(e) => {
                          // Close only if focus leaves the whole dropdown
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            setOpen(false);
                          }
                        }}
                      >
                        {/* Dropdown button */}
                        <button
                          type="button"
                          disabled={!uploadData.courseId || filteredBatches.filter((b) => b.is_active)}
                          className="w-full border rounded-md px-3 py-2 bg-white text-sm text-gray-700 text-left disabled:opacity-50"
                        >
                          {filteredBatches.filter((b) => b.is_active).length === 0
                            ? "No active batch available"
                            : uploadData.batchIds?.length
                              ? `${uploadData.batchIds.length} Batch Selected`
                              : "Select Batches"}
                        </button>
                        {/* Dropdown content */}
                        {open && (
                          <div className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10 p-3 max-h-60 overflow-auto">
                            {/* Select All */}
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="checkbox"
                                id="selectAll"
                                checked={
                                  filteredBatches.filter((b) => b.is_active).length > 0 &&
                                  uploadData.batchIds?.length === filteredBatches.filter((b) => b.is_active).length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setUploadData({
                                      ...uploadData,
                                      batchIds: filteredBatches
                                        .filter((b) => b.is_active)
                                        .map((b) => String(b.batch_id)),
                                    });
                                  } else {
                                    setUploadData({ ...uploadData, batchIds: [] });
                                  }
                                }}
                                disabled={
                                  !uploadData.courseId ||
                                  filteredBatches.filter((b) => b.is_active).length === 0
                                }
                              />
                              <label htmlFor="selectAll" className="cursor-pointer text-sm">
                                Select All
                              </label>
                            </div>


                            {/* Batch list */}
                            {filteredBatches
                              .filter((batch) => batch.is_active).map((batch) => (
                                <div
                                  key={batch.batch_id}
                                  className="flex items-center space-x-2 mb-1"
                                >
                                  <input
                                    type="checkbox"
                                    id={`batch-${batch.batch_id}`}
                                    checked={
                                      uploadData.batchIds?.includes(String(batch.batch_id)) || false
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setUploadData({
                                          ...uploadData,
                                          batchIds: [
                                            ...(uploadData.batchIds || []),
                                            String(batch.batch_id),
                                          ],
                                        });
                                      } else {
                                        setUploadData({
                                          ...uploadData,
                                          batchIds: (uploadData.batchIds || []).filter(
                                            (id) => id !== String(batch.batch_id)
                                          ),
                                        });
                                      }
                                    }}
                                    disabled={!uploadData.courseId}
                                  />
                                  <label
                                    htmlFor={`batch-${batch.batch_id}`}
                                    className="cursor-pointer text-sm"
                                  >
                                    {batch.batch_name}
                                  </label>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={uploadData.description}
                      onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                      />
                    </div>
                    {/* <div>
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={uploadData.type} 
                      onValueChange={(value) => setUploadData({...uploadData, type: value as MaterialType})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MaterialType.PDF}>PDF</SelectItem>
                        <SelectItem value={MaterialType.PPT}>PPT</SelectItem>
                        <SelectItem value={MaterialType.DOC}>DOC</SelectItem>
                        <SelectItem value={MaterialType.IMAGE}>Image</SelectItem>
                        <SelectItem value={MaterialType.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={uploadData.status}
                        onValueChange={(value) => setUploadData({ ...uploadData, status: value as MaterialStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={MaterialStatus.DRAFT}>Draft</SelectItem>
                          <SelectItem value={MaterialStatus.PUBLISHED}>Published</SelectItem>
                          <SelectItem value={MaterialStatus.ARCHIVED}>Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleUpload(false)}>
                    Upload Document
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="video">
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="youtubeUrl">YouTube URL *</Label>
                    <Input
                      id="youtubeUrl"
                      placeholder="https://youtu.be/azdcsadcsdc"
                      value={uploadData.youtubeUrl || ''}
                      onChange={(e) => setUploadData({ ...uploadData, youtubeUrl: e.target.value })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter a valid YouTube URL (e.g., https://youtu.be/ls5YUpk4_mw)
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={uploadData.title}
                        onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="course">Course</Label>
                      <Select
                        value={uploadData.courseId || ''}
                        onValueChange={handleCourseChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => {
                            const courseId = (course.course_id || course.id).toString();
                            return (
                              <SelectItem key={courseId} value={courseId}>
                                {course.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Select
                        value={uploadData.subjectId || 'none'}
                        onValueChange={(value) => setUploadData({
                          ...uploadData,
                          subjectId: value === 'none' ? '' : value
                        })}
                        disabled={!uploadData.courseId || filteredSubjects.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={uploadData.courseId ? (filteredSubjects.length ? "Select subject" : "No subjects for course") : "Select course first"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {filteredSubjects.map((subject) => (
                            <SelectItem key={subject.subject_id} value={String(subject.subject_id)}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="batches">Target Batches</Label>
                      <div
                        className="relative w-full"
                        tabIndex={0} // make it focusable
                        onFocus={() => setOpen(true)}
                        onBlur={(e) => {
                          // Close only if focus leaves the whole dropdown
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            setOpen(false);
                          }
                        }}
                      >
                        {/* Dropdown button */}
                        <button
                          type="button"
                          disabled={!uploadData.courseId || filteredBatches.filter((b) => b.is_active)}
                          className="w-full border rounded-md px-3 py-2 bg-white text-sm text-gray-700 text-left disabled:opacity-50"
                        >
                          {filteredBatches.filter((b) => b.is_active).length === 0
                            ? "No active batch available"
                            : uploadData.batchIds?.length
                              ? `${uploadData.batchIds.length} Batch Selected`
                              : "Select Batches"}
                        </button>
                        {/* Dropdown content */}
                        {open && (
                          <div className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10 p-3 max-h-60 overflow-auto">
                            {/* Select All */}
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="checkbox"
                                id="selectAll"
                                checked={
                                  filteredBatches.filter((b) => b.is_active).length > 0 &&
                                  uploadData.batchIds?.length === filteredBatches.filter((b) => b.is_active).length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setUploadData({
                                      ...uploadData,
                                      batchIds: filteredBatches
                                        .filter((b) => b.is_active)
                                        .map((b) => String(b.batch_id)),
                                    });
                                  } else {
                                    setUploadData({ ...uploadData, batchIds: [] });
                                  }
                                }}
                                disabled={
                                  !uploadData.courseId ||
                                  filteredBatches.filter((b) => b.is_active).length === 0
                                }
                              />
                              <label htmlFor="selectAll" className="cursor-pointer text-sm">
                                Select All
                              </label>
                            </div>


                            {/* Batch list */}
                            {filteredBatches
                              .filter((batch) => batch.is_active).map((batch) => (
                                <div
                                  key={batch.batch_id}
                                  className="flex items-center space-x-2 mb-1"
                                >
                                  <input
                                    type="checkbox"
                                    id={`batch-${batch.batch_id}`}
                                    checked={
                                      uploadData.batchIds?.includes(String(batch.batch_id)) || false
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setUploadData({
                                          ...uploadData,
                                          batchIds: [
                                            ...(uploadData.batchIds || []),
                                            String(batch.batch_id),
                                          ],
                                        });
                                      } else {
                                        setUploadData({
                                          ...uploadData,
                                          batchIds: (uploadData.batchIds || []).filter(
                                            (id) => id !== String(batch.batch_id)
                                          ),
                                        });
                                      }
                                    }}
                                    disabled={!uploadData.courseId}
                                  />
                                  <label
                                    htmlFor={`batch-${batch.batch_id}`}
                                    className="cursor-pointer text-sm"
                                  >
                                    {batch.batch_name}
                                  </label>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={uploadData.description}
                        onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={uploadData.status}
                        onValueChange={(value) => setUploadData({ ...uploadData, status: value as MaterialStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={MaterialStatus.DRAFT}>Draft</SelectItem>
                          <SelectItem value={MaterialStatus.PUBLISHED}>Published</SelectItem>
                          <SelectItem value={MaterialStatus.ARCHIVED}>Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleUpload(true)}>
                    Upload Video
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="motivational">
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="motivationalUrl">YouTube URL *</Label>
                    <Input
                      id="motivationalUrl"
                      placeholder="https://youtu.be/azdcsadcsdc"
                      value={uploadData.youtubeUrl || ''}
                      onChange={(e) => setUploadData({...uploadData, youtubeUrl: e.target.value})}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter a valid YouTube URL for the motivational video (visible to all batches and courses)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadData.description}
                      onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleUpload(true, true)}>
                    Upload Motivational Video
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-4 sm:p-6 sm:rounded-lg">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-course">Course</Label>
                <Select
                  value={editData.courseId || ''}
                  onValueChange={handleEditCourseChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => {
                      const courseId = (course.course_id || course.id).toString();
                      return (
                        <SelectItem key={courseId} value={courseId}>
                          {course.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-subject">Subject</Label>
                <Select
                  value={editData.subjectId || 'none'}
                  onValueChange={(value) => setEditData({
                    ...editData,
                    subjectId: value === 'none' ? '' : value
                  })}
                  disabled={!editData.courseId || filteredEditSubjects.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editData.courseId ? (filteredEditSubjects.length ? "Select subject" : "No subjects for course") : "Select course first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredEditSubjects.map((subject) => (
                      <SelectItem key={subject.subject_id} value={String(subject.subject_id)}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-batches">Target Batches</Label>
                <div
                  className="relative w-full"
                  tabIndex={0} // make it focusable
                  onFocus={() => setOpen(true)}
                  onBlur={(e) => {
                    // Close only if focus leaves the whole dropdown
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setOpen(false);
                    }
                  }}
                >
                  {/* Dropdown button */}
                  <button
                    type="button"
                    disabled={!editData.courseId || filteredEditBatches.filter((b) => b.is_active).length === 0}
                    className="w-full border rounded-md px-3 py-2 bg-white text-sm text-gray-700 text-left disabled:opacity-50"
                  >
                    {filteredEditBatches.filter((b) => b.is_active).length === 0
                      ? "No active batch available"
                      : editData.batchIds?.length
                        ? `${editData.batchIds.length} Batch Selected`
                        : "Select Batches"}
                  </button>
                  {/* Dropdown content */}
                  {open && (
                    <div className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10 p-3 max-h-60 overflow-auto">
                      {/* Select All */}
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          id="selectAll"
                          checked={
                            filteredEditBatches.filter((b) => b.is_active).length > 0 &&
                            editData.batchIds?.length === filteredEditBatches.filter((b) => b.is_active).length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditData({
                                ...editData,
                                batchIds: filteredEditBatches
                                  .filter((b) => b.is_active)
                                  .map((b) => String(b.batch_id)),
                              });
                            } else {
                              setEditData({ ...editData, batchIds: [] });
                            }
                          }}
                          disabled={
                            !editData.courseId ||
                            filteredEditBatches.filter((b) => b.is_active).length === 0
                          }
                        />
                        <label htmlFor="selectAll" className="cursor-pointer text-sm">
                          Select All
                        </label>
                      </div>


                      {/* Batch list */}
                      {filteredEditBatches
                        .filter((batch) => batch.is_active).map((batch) => (
                          <div
                            key={batch.batch_id}
                            className="flex items-center space-x-2 mb-1"
                          >
                            <input
                              type="checkbox"
                              id={`edit-batch-${batch.batch_id}`}
                              checked={
                                editData.batchIds?.includes(String(batch.batch_id)) || false
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditData({
                                    ...editData,
                                    batchIds: [
                                      ...(editData.batchIds || []),
                                      String(batch.batch_id),
                                    ],
                                  });
                                } else {
                                  setEditData({
                                    ...editData,
                                    batchIds: (editData.batchIds || []).filter(
                                      (id) => id !== String(batch.batch_id)
                                    ),
                                  });
                                }
                              }}
                              disabled={!editData.courseId}
                            />
                            <label
                              htmlFor={`edit-batch-${batch.batch_id}`}
                              className="cursor-pointer text-sm"
                            >
                              {batch.batch_name}
                            </label>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editData.type}
                  onValueChange={(value) => setEditData({ ...editData, type: value as MaterialType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MaterialType.PDF}>PDF</SelectItem>
                    <SelectItem value={MaterialType.PPT}>PPT</SelectItem>
                    <SelectItem value={MaterialType.DOC}>DOC</SelectItem>
                    <SelectItem value={MaterialType.IMAGE}>Image</SelectItem>
                    <SelectItem value={MaterialType.VIDEO}>Video</SelectItem>
                    <SelectItem value={MaterialType.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editData.status}
                  onValueChange={(value) => setEditData({ ...editData, status: value as MaterialStatus })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MaterialStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={MaterialStatus.PUBLISHED}>Published</SelectItem>
                    <SelectItem value={MaterialStatus.ARCHIVED}>Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Materials</p>
                <p className="text-2xl font-bold">{materials.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold">{materials.filter(m => m.isPublished).length}</p>
              </div>
              <Upload className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Videos</p>
                <p className="text-2xl font-bold">{materials.filter(m => m.type === 'VIDEO').length}</p>
              </div>
              <Video className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PDFs</p>
                <p className="text-2xl font-bold">{materials.filter(m => m.type === 'PDF').length}</p>
              </div>
              <FileText className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <Input
                 placeholder="Search materials... (தேடல்)"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10"
               />
             </div>
            <Select
              value={selectedSubject || 'all'}
              onValueChange={(value) => {
                setSelectedSubject(value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.subject_id} value={String(subject.subject_id)}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedType || 'all'}
              onValueChange={(value) => {
                setSelectedType(value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {fileTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedBatches || 'all'}
              onValueChange={(value) => {
                setSelectedBatches(value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.batch_id} value={batch.batch_id.toString()}>
                    {batch.batch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
                         <Button
               variant="outline"
               onClick={() => {
                 setSearchTerm('');
                 setSelectedSubject('');
                 setSelectedType('');
                 setSelectedBatches('');
               }}
             >
               Clear Filters
             </Button>
           </div>
           {/* Debug info */}
         
         </CardContent>
       </Card>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedMaterials.map((material) => (
          <Card key={String(material.id ?? Math.random())} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(material.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{material.title}</h3>
                    <Badge variant={material.isPublished ? 'default' : 'secondary'}>
                      {material.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {(material.type === "VIDEO" || material.type === "MOTIVATIONAL") ?
                    (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if ((material.type === "VIDEO" || material.type === "MOTIVATIONAL") && material.fileUrl) {
                            navigate(`/admin/video-viewer/${material.fileUrl}`)
                          }
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/content-viewer/${material.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                  </Button> )
                  }
                  {material.type !== "MOTIVATIONAL" &&
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(material)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  }
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-4 sm:p-6 sm:rounded-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Material</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{material.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(material)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {material.description || 'No description available'}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-medium">
                    {typeof material.subject === 'string' 
                      ? material.subject 
                      : material.subject?.name || material.subject_id || 'No subject'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{material.type}</span>
                </div>
             
                {material.batch_materials && material.batch_materials.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Batches:</span>
                    <span className="font-medium">
                      {material.batch_materials.map(bm => {
                        // Handle nested structure: bm.batch.batch_name
                        if (bm.batch?.batch_name) {
                          return bm.batch.batch_name;
                        }
                        // Handle flat structure: look up batch name from batches list
                        if (bm.batch_id !== undefined) {
                          const batch = batches.find(b => b.batch_id === bm.batch_id);
                          return batch?.batch_name || `Batch ${bm.batch_id}`;
                        }
                        return '';
                      }).filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {totalMaterials === 0 ? 0 : startIndex + 1} to {endIndex} of {totalMaterials} materials
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {/* Show page 1 with ellipsis when on last pages */}
              {totalPages > 5 && currentPage >= totalPages - 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    className={currentPage === 1 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : ""}
                  >
                    1
                  </Button>
                  <span className="text-gray-600">...</span>
                </>
              )}
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {/* Show ellipsis and last page when on first pages */}
              {totalPages > 5 && currentPage <= 3 && (
                <>
                  <span className="text-gray-600">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className={currentPage === totalPages 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : ""}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;

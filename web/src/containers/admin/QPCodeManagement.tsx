import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Hash, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useQPCodes, 
  useCreateQPCode,
  useUpdateQPCode,
  useDeleteQPCode
} from '@/hooks/api/useQPCodes';
import { QPCode, CreateQPCodeData } from '@/services/qpCodes';

const QPCodeManagement = () => {
  const { toast } = useToast();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQPCode, setSelectedQPCode] = useState<QPCode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [newQPCode, setNewQPCode] = useState<CreateQPCodeData>({
    code: '',
    description: ''
  });

  // Data
  const { data: qpCodesResponse, isLoading } = useQPCodes({ 
    page: currentPage, 
    limit: itemsPerPage,
    search: searchTerm || undefined
  });
  
  // Mutations
  const createQPCodeMutation = useCreateQPCode();
  const updateQPCodeMutation = useUpdateQPCode();
  const deleteQPCodeMutation = useDeleteQPCode();

  const qpCodes = (qpCodesResponse as any)?.data || [];
  const paginationMeta = (qpCodesResponse as any)?.meta;

  // Pagination calculations
  const totalQPCodes = paginationMeta?.total || 0;
  const totalPages = paginationMeta?.totalPages || Math.ceil(totalQPCodes / itemsPerPage);
  const startIndex = paginationMeta ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = paginationMeta 
    ? Math.min(startIndex + itemsPerPage, totalQPCodes)
    : Math.min(startIndex + itemsPerPage, qpCodes.length);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleCreateQPCode = async () => {
    if (!newQPCode.code?.trim()) {
      toast({ title: 'Error', description: 'QP code is required', variant: 'destructive' });
      return;
    }

    try {
      await createQPCodeMutation.mutateAsync(newQPCode);
      toast({ title: 'Success', description: 'QP code created successfully' });
      setNewQPCode({
        code: '',
        description: ''
      });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to create QP code', 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateQPCode = async () => {
    if (!selectedQPCode) return;

    try {
      await updateQPCodeMutation.mutateAsync({
        id: selectedQPCode.qp_code_id.toString(),
        data: {
          code: selectedQPCode.code,
          description: selectedQPCode.description
        }
      });
      toast({ title: 'Success', description: 'QP code updated successfully' });
      setSelectedQPCode(null);
      setIsEditing(false);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to update QP code', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteQPCode = async (id: number) => {
    try {
      await deleteQPCodeMutation.mutateAsync(id.toString());
      toast({ title: 'Success', description: 'QP code deleted successfully' });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to delete QP code', 
        variant: 'destructive' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              QP Code Management
            </h1>
            <p className="text-gray-600 mt-2">Manage question paper codes for organizing questions</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <Hash className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-800">{qpCodes.length} QP Codes</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
          <TabsTrigger value="create" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Create QP Code</TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Manage QP Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardHeader className="bg-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New QP Code
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code" className="text-blue-700 font-medium">QP Code *</Label>
                  <Input
                    id="code"
                    value={newQPCode.code}
                    onChange={(e) => setNewQPCode({...newQPCode, code: e.target.value})}
                    placeholder="e.g., MATH101, PHY201"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-blue-700 font-medium">Description</Label>
                  <Input
                    id="description"
                    value={newQPCode.description || ''}
                    onChange={(e) => setNewQPCode({...newQPCode, description: e.target.value})}
                    placeholder="Optional description"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCreateQPCode} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createQPCodeMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createQPCodeMutation.isPending ? 'Creating...' : 'Create QP Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search QP codes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                  }} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {qpCodes.map((qpCode) => (
              <Card key={qpCode.qp_code_id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{qpCode.code}</h3>
                        <Badge className="bg-blue-100 text-blue-800">
                          {qpCode._count?.questions || 0} questions
                        </Badge>
                      </div>
                      
                      {qpCode.description && (
                        <p className="text-gray-600 mb-3">{qpCode.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        <span>Created: {new Date(qpCode.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Updated: {new Date(qpCode.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedQPCode(qpCode);
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteQPCode(qpCode.qp_code_id)}
                        disabled={deleteQPCodeMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {qpCodes.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No QP codes found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters or create some QP codes to get started.</p>
                  <Button onClick={() => setNewQPCode({
                    code: '',
                    description: ''
                  })} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First QP Code
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && qpCodes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t px-4 pb-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {endIndex} of {totalQPCodes} QP codes
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm text-gray-600">Items per page:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {selectedQPCode && isEditing && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="bg-blue-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Edit QP Code
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedQPCode(null);
                  setIsEditing(false);
                }}
                className="text-white hover:bg-blue-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code" className="text-blue-700 font-medium">QP Code *</Label>
                <Input
                  id="edit-code"
                  value={selectedQPCode.code}
                  onChange={(e) => setSelectedQPCode({...selectedQPCode, code: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-blue-700 font-medium">Description</Label>
                <Input
                  id="edit-description"
                  value={selectedQPCode.description || ''}
                  onChange={(e) => setSelectedQPCode({...selectedQPCode, description: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedQPCode(null);
                  setIsEditing(false);
                }}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateQPCode}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updateQPCodeMutation.isPending}
              >
                {updateQPCodeMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QPCodeManagement;

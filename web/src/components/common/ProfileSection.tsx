import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Edit, 
  Save, 
  X, 
  Camera,
  Shield,
  Book,
  Award,
  Clock,
  Target
} from 'lucide-react';

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'student';
  joinDate: string;
  address?: string;
  bio?: string;
  batch?: string;
  course?: string;
  parentName?: string;
  parentPhone?: string;
  emergencyContact?: string;
}

interface ProfileSectionProps {
  user: ProfileUser;
  onUpdate?: (updatedUser: Partial<ProfileUser>) => void;
  showStats?: boolean;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ 
  user, 
  onUpdate, 
  showStats = true 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<ProfileUser>(user);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedUser);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const stats = user.role === 'student' ? [
    { label: 'Tests Taken', value: '24', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Average Score', value: '85%', color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Study Hours', value: '120h', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { label: 'Class Rank', value: '#12', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ] : [
    { label: 'Students Managed', value: '1,234', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Courses Created', value: '12', color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Tests Published', value: '89', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { label: 'Years Experience', value: '5+', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-32"></div>
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={editedUser.avatar} alt={editedUser.name} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
                    {editedUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 bg-white"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="sm:mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{editedUser.name}</h1>
                  <Badge 
                    variant="secondary" 
                    className={`${user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                  >
                    {user.role === 'admin' ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Administrator
                      </>
                    ) : (
                      <>
                        <Book className="w-3 h-3 mr-1" />
                        Student
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {editedUser.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(editedUser.joinDate).toLocaleDateString()}
                  </span>
                  {user.role === 'student' && editedUser.batch && (
                    <Badge variant="outline">
                      {editedUser.batch}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 sm:mt-0">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button onClick={handleCancel} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className={`${stat.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  {user.role === 'student' ? (
                    index === 0 ? <Target className={`w-6 h-6 ${stat.color}`} /> :
                    index === 1 ? <Award className={`w-6 h-6 ${stat.color}`} /> :
                    index === 2 ? <Clock className={`w-6 h-6 ${stat.color}`} /> :
                    <User className={`w-6 h-6 ${stat.color}`} />
                  ) : (
                    index === 0 ? <User className={`w-6 h-6 ${stat.color}`} /> :
                    index === 1 ? <Book className={`w-6 h-6 ${stat.color}`} /> :
                    index === 2 ? <Target className={`w-6 h-6 ${stat.color}`} /> :
                    <Award className={`w-6 h-6 ${stat.color}`} />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Profile Details */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Details</TabsTrigger>
              <TabsTrigger value="additional">
                {user.role === 'student' ? 'Academic Info' : 'Professional Info'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{editedUser.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{editedUser.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedUser.phone || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{editedUser.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={editedUser.address || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{editedUser.address || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={editedUser.bio || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded min-h-[80px]">
                    <span className="text-gray-700">
                      {editedUser.bio || 'No bio provided'}
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="additional" className="space-y-6 mt-6">
              {user.role === 'student' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Book className="w-4 h-4 text-gray-500" />
                      <span>{editedUser.course || 'Not assigned'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Batch</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{editedUser.batch || 'Not assigned'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent/Guardian Name</Label>
                    {isEditing ? (
                      <Input
                        id="parentName"
                        value={editedUser.parentName || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, parentName: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{editedUser.parentName || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                    {isEditing ? (
                      <Input
                        id="parentPhone"
                        value={editedUser.parentPhone || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, parentPhone: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{editedUser.parentPhone || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span>Administration</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>EMP{editedUser.id.slice(-4)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    {isEditing ? (
                      <Input
                        id="emergencyContact"
                        value={editedUser.emergencyContact || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, emergencyContact: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{editedUser.emergencyContact || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Access Level</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span>Full Administrative Access</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSection;

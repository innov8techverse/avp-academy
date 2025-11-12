import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Video, 
  ClipboardList, 
  HelpCircle, 
  BarChart3, 
  Bell, 
  Settings, 
  X,
  User,
  UserCheck,
  Users2,
  Trophy,
  Shield,
  FileText,
  Hash
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'batches', label: 'Batches', icon: Users2 },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'content', label: 'Content', icon: Video },
  { id: 'tests', label: 'Tests', icon: ClipboardList },
  { id: 'qp-codes', label: 'QP Codes', icon: Hash },
  { id: 'questions', label: 'Question Bank', icon: HelpCircle },
  { id: 'question-papers', label: 'Question Papers', icon: FileText },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  // { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'staff', label: 'Staff', icon: UserCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'sessions', label: 'Sessions', icon: Shield },
  // { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'profile', label: 'Profile', icon: User },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="mt-4 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id;

            return (
              <Link
                key={item.id}
                to={`/admin/${item.id}`}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar;

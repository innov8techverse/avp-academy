
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, Clock, Trophy } from 'lucide-react';

interface QuizCategoriesProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const QuizCategories: React.FC<QuizCategoriesProps> = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', label: 'All Tests', icon: BookOpen, color: 'bg-blue-500' },
    { id: 'mock', label: 'Mock Exams', icon: Trophy, color: 'bg-purple-500' },
    { id: 'daily', label: 'Daily Tests', icon: Clock, color: 'bg-green-500' },
    { id: 'subject', label: 'Subject Tests', icon: Target, color: 'bg-orange-500' }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isActive ? "default" : "outline"}
              onClick={() => onCategoryChange(category.id)}
              className={`flex flex-col h-20 p-3 ${isActive ? category.color : ''}`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{category.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizCategories;

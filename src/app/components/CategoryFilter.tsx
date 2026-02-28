import React, { useState } from 'react';
import { SPECIALITY_CATEGORIES, CATEGORY_COLORS } from '@/app/constants/specialityCategories';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/app/components/ui/card';
import { Check, X } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  onClearAll: () => void;
}

export function CategoryFilter({ selectedCategories, onCategoryChange, onClearAll }: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div>
            <h3 className="font-semibold">Filter by Speciality</h3>
            <CardDescription>
              {selectedCategories.length > 0 
                ? `${selectedCategories.length} selected` 
                : 'Select categories to filter'}
            </CardDescription>
          </div>
          <span className={`text-2xl transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Active Filters Display */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              {selectedCategories.map(category => (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}`}
                >
                  {category}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                >
                  Clear All
                </Button>
              )}
            </div>
          )}

          {/* Category Options */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {SPECIALITY_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`p-2 rounded-lg border-2 text-sm font-medium transition-all text-center ${
                  selectedCategories.includes(category)
                    ? `border-indigo-600 ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {selectedCategories.includes(category) && (
                    <Check className="w-3 h-3" />
                  )}
                  <span className="line-clamp-2">{category}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

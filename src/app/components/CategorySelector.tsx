import React, { useState, useEffect } from 'react';
import { SPECIALITY_CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_COLORS } from '@/app/constants/specialityCategories';
import { creatorAPI } from '@/app/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AlertCircle, Check } from 'lucide-react';

interface CategorySelectorProps {
  specialistEmail: string;
  onSave?: (categories: string[]) => void;
}

export function CategorySelector({ specialistEmail, onSave }: CategorySelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [specialistEmail]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await creatorAPI.getSpecialistCategories(specialistEmail);
      if (response?.success) {
        setSelectedCategories(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load speciality categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setSuccess(false);
  };

  const handleSelectAll = () => {
    setSelectedCategories(SPECIALITY_CATEGORIES);
    setSuccess(false);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await creatorAPI.updateSpecialistCategories(specialistEmail, selectedCategories);
      if (response?.success) {
        setSuccess(true);
        if (onSave) {
          onSave(selectedCategories);
        }
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save categories:', err);
      setError('Failed to save speciality categories');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-gray-600">Loading categories...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Speciality Categories</CardTitle>
        <CardDescription>
          Select your speciality areas to help customers find you. Selected: {selectedCategories.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-md flex items-center gap-2 bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-md flex items-center gap-2 bg-green-50 border border-green-200">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Categories saved successfully!</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SPECIALITY_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryToggle(category)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedCategories.includes(category)
                  ? `border-indigo-600 ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{category}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]}
                  </p>
                </div>
                {selectedCategories.includes(category) && (
                  <Check className="w-4 h-4 ml-2 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? 'Saving...' : 'Save Categories'}
          </Button>
          <p className="text-xs text-gray-600 flex items-center">
            {selectedCategories.length} selected
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

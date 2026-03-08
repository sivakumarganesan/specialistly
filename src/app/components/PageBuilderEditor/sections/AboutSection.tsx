import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Upload, X } from 'lucide-react';

interface AboutSectionEditorProps {
  section: PageSection;
  onChange: (updates: Partial<PageSection>) => void;
}

export const AboutSectionEditor: React.FC<AboutSectionEditorProps> = ({
  section,
  onChange,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(
    section.content?.image || null
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setImagePreview(imageUrl);
        onChange({
          content: {
            ...section.content,
            image: imageUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-bold mb-4">Section Content</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="About Us"
              value={section.content?.title || ''}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    title: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Tell your story..."
              value={section.content?.description || ''}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    description: e.target.value,
                  },
                })
              }
              rows={5}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Image</h3>
        {imagePreview && (
          <div className="relative mb-4">
            <img
              src={imagePreview}
              alt="About"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setImagePreview(null);
                onChange({
                  content: {
                    ...section.content,
                    image: null,
                  },
                });
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="text-center">
            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <span className="text-sm text-gray-600">Upload image</span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Layout</h3>
        <div>
          <label className="block text-sm font-medium mb-2">Image Position</label>
          <select
            value={section.content?.imagePosition || 'right'}
            onChange={(e) =>
              onChange({
                content: {
                  ...section.content,
                  imagePosition: e.target.value,
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      </Card>
    </div>
  );
};

// Preview Component
export const AboutSectionPreview: React.FC<{ section: PageSection }> = ({
  section,
}) => {
  const imagePosition = section.content?.imagePosition || 'right';

  const contentClasses = {
    left: 'flex-row-reverse',
    right: 'flex-row',
    top: 'flex-col',
    bottom: 'flex-col-reverse',
  }[imagePosition] as string;

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className={`flex gap-12 items-center ${contentClasses}`}>
          {section.content?.image && (
            <div className="flex-1">
              <img
                src={section.content.image}
                alt={section.content?.title}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}

          <div className="flex-1">
            {section.content?.title && (
              <h2 className="text-3xl font-bold mb-4">{section.content.title}</h2>
            )}
            {section.content?.description && (
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                {section.content.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSectionEditor;

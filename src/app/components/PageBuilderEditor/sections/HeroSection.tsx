import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Upload, X } from 'lucide-react';

interface HeroSectionEditorProps {
  section: PageSection;
  onChange: (updates: Partial<PageSection>) => void;
}

export const HeroSectionEditor: React.FC<HeroSectionEditorProps> = ({
  section,
  onChange,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(
    section.content?.backgroundImage || null
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
            backgroundImage: imageUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTitleChange = (value: string) => {
    onChange({
      content: {
        ...section.content,
        title: value,
      },
    });
  };

  const handleSubtitleChange = (value: string) => {
    onChange({
      content: {
        ...section.content,
        subtitle: value,
      },
    });
  };

  const handleCTATextChange = (value: string) => {
    onChange({
      content: {
        ...section.content,
        ctaText: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-bold mb-4">Background Image</h3>
        {imagePreview && (
          <div className="relative mb-4">
            <img
              src={imagePreview}
              alt="Hero background"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setImagePreview(null);
                onChange({
                  content: {
                    ...section.content,
                    backgroundImage: null,
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
            <span className="text-sm text-gray-600">Upload background image</span>
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
        <h3 className="font-bold mb-4">Content</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="Enter hero title"
              value={section.content?.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subtitle</label>
            <Textarea
              placeholder="Enter hero subtitle"
              value={section.content?.subtitle || ''}
              onChange={(e) => handleSubtitleChange(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">CTA Button Text</label>
            <Input
              placeholder="e.g., Get Started"
              value={section.content?.ctaText || ''}
              onChange={(e) => handleCTATextChange(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Styling</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Min Height</label>
            <Input
              placeholder="e.g., 500px"
              value={section.styling?.minHeight || ''}
              onChange={(e) =>
                onChange({
                  styling: {
                    ...section.styling,
                    minHeight: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Overlay Opacity (0-1)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={section.content?.overlayOpacity || 0.3}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    overlayOpacity: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Preview Component
export const HeroSectionPreview: React.FC<{ section: PageSection }> = ({
  section,
}) => {
  const minHeight = section.styling?.minHeight || '500px';
  const backgroundImage = section.content?.backgroundImage;
  const overlayOpacity = section.content?.overlayOpacity || 0.3;

  return (
    <div
      className="relative flex items-center justify-center text-white text-center"
      style={{
        minHeight,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-4">{section.content?.title}</h1>
        <p className="text-xl mb-8">{section.content?.subtitle}</p>
        {section.content?.ctaText && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            {section.content.ctaText}
          </button>
        )}
      </div>
    </div>
  );
};

export default HeroSectionEditor;

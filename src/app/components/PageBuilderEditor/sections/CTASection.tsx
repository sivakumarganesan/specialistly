import React from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';

interface CTASectionEditorProps {
  section: PageSection;
  onChange: (updates: Partial<PageSection>) => void;
}

export const CTASectionEditor: React.FC<CTASectionEditorProps> = ({
  section,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-bold mb-4">CTA Content</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="Ready to Get Started?"
              value={section.content?.title || ''}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    title: e.target.value,
                  },
                })
              }
              className="text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Encourage your visitors to take action"
              value={section.content?.description || ''}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    description: e.target.value,
                  },
                })
              }
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Button Text</label>
            <Input
              placeholder="Start Now"
              value={section.content?.buttonText || ''}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    buttonText: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Button URL</label>
            <Input
              placeholder="https://..."
              value={section.content?.buttonUrl || ''}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    buttonUrl: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Styling</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Background Color</label>
            <input
              type="color"
              value={section.content?.backgroundColor || '#3B82F6'}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    backgroundColor: e.target.value,
                  },
                })
              }
              className="w-16 h-10 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Text Color</label>
            <input
              type="color"
              value={section.styling?.textColor || '#FFFFFF'}
              onChange={(e) =>
                onChange({
                  styling: {
                    ...section.styling,
                    textColor: e.target.value,
                  },
                })
              }
              className="w-16 h-10 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Padding</label>
            <Input
              placeholder="e.g., 60px 40px"
              value={section.styling?.padding || ''}
              onChange={(e) =>
                onChange({
                  styling: {
                    ...section.styling,
                    padding: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Preview Component
export const CTASectionPreview: React.FC<{ section: PageSection }> = ({
  section,
}) => {
  const backgroundColor = section.content?.backgroundColor || '#3B82F6';
  const textColor = section.styling?.textColor || '#FFFFFF';
  const padding = section.styling?.padding || '60px 40px';

  return (
    <div
      className="text-center"
      style={{
        backgroundColor,
        color: textColor,
        padding,
      }}
    >
      {section.content?.title && (
        <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: section.content?.titleColor || textColor }}>{section.content.title}</h2>
      )}
      {section.content?.description && (
        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90" style={{ color: section.content?.descriptionColor || textColor }}>
          {section.content.description}
        </p>
      )}
      {section.content?.buttonText && (
        <button
          className="px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105"
          style={{
            backgroundColor: textColor,
            color: backgroundColor,
          }}
        >
          {section.content.buttonText}
        </button>
      )}
    </div>
  );
};

export default CTASectionEditor;

import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Plus, Trash2, LayoutGrid, List } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
}

interface ServicesSectionEditorProps {
  section: PageSection;
  onChange: (updates: Partial<PageSection>) => void;
}

export const ServicesSectionEditor: React.FC<ServicesSectionEditorProps> = ({
  section,
  onChange,
}) => {
  const services = (section.content?.services || []) as Service[];
  const layout = section.content?.layout || 'grid'; // 'grid', 'list', 'carousel'

  const handleAddService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      title: 'New Service',
      description: 'Service description',
    };

    onChange({
      content: {
        ...section.content,
        services: [...services, newService],
      },
    });
  };

  const handleUpdateService = (serviceId: string, updates: Partial<Service>) => {
    const updatedServices = services.map((service) =>
      service.id === serviceId ? { ...service, ...updates } : service
    );

    onChange({
      content: {
        ...section.content,
        services: updatedServices,
      },
    });
  };

  const handleDeleteService = (serviceId: string) => {
    const updatedServices = services.filter((service) => service.id !== serviceId);

    onChange({
      content: {
        ...section.content,
        services: updatedServices,
      },
    });
  };

  const handleLayoutChange = (newLayout: string) => {
    onChange({
      content: {
        ...section.content,
        layout: newLayout,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-bold mb-4">Section Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="e.g., Our Services"
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
              placeholder="Section description"
              value={section.content?.description || ''}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    description: e.target.value,
                  },
                })
              }
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Layout</label>
            <div className="flex gap-2">
              <Button
                variant={layout === 'grid' ? 'default' : 'outline'}
                onClick={() => handleLayoutChange('grid')}
                className="flex-1 gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Grid
              </Button>
              <Button
                variant={layout === 'list' ? 'default' : 'outline'}
                onClick={() => handleLayoutChange('list')}
                className="flex-1 gap-2"
              >
                <List className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={layout === 'carousel' ? 'default' : 'outline'}
                onClick={() => handleLayoutChange('carousel')}
                className="flex-1"
              >
                Carousel
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={section.content?.accentColor || '#00acc1'}
                onChange={(e) =>
                  onChange({
                    content: {
                      ...section.content,
                      accentColor: e.target.value,
                    },
                  })
                }
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <Input
                value={section.content?.accentColor || '#00acc1'}
                onChange={(e) =>
                  onChange({
                    content: {
                      ...section.content,
                      accentColor: e.target.value,
                    },
                  })
                }
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Used for card accents, icons, and highlights</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Services</h3>
          <Button onClick={handleAddService} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </div>

        <div className="space-y-4">
          {services.map((service, index) => (
            <Card key={service.id} className="p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Service {index + 1}
                </span>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Title</label>
                  <Input
                    placeholder="Service title"
                    value={service.title}
                    onChange={(e) =>
                      handleUpdateService(service.id, { title: e.target.value })
                    }
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Description
                  </label>
                  <Textarea
                    placeholder="Service description"
                    value={service.description}
                    onChange={(e) =>
                      handleUpdateService(service.id, {
                        description: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Icon URL</label>
                  <Input
                    placeholder="https://example.com/icon.png"
                    value={service.icon || ''}
                    onChange={(e) =>
                      handleUpdateService(service.id, { icon: e.target.value })
                    }
                    size="sm"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Small icon shown beside the title</p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Image URL</label>
                  <Input
                    placeholder="https://example.com/service-photo.jpg"
                    value={service.image || ''}
                    onChange={(e) =>
                      handleUpdateService(service.id, { image: e.target.value })
                    }
                    size="sm"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Large cover image for the service card</p>
                  {service.image && (
                    <img
                      src={service.image}
                      alt="Preview"
                      className="mt-2 w-full h-24 object-cover rounded-lg border"
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Preview Component
export const ServicesSectionPreview: React.FC<{ section: PageSection }> = ({
  section,
}) => {
  const services = (section.content?.services || []) as Service[];
  const layout = section.content?.layout || 'grid';
  const accentColor = section.content?.accentColor || '#00acc1';
  const bgColor = section.styling?.backgroundColor || '#ffffff';

  // Determine if background is dark for text contrast
  const isDark = (() => {
    const c = bgColor.replace('#', '');
    if (c.length < 6) return false;
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b < 0.4;
  })();

  const titleColor = isDark ? '#ffffff' : '#111827';
  const subtitleColor = isDark ? 'rgba(255,255,255,0.7)' : '#6b7280';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const cardTextColor = isDark ? '#ffffff' : '#111827';
  const cardDescColor = isDark ? 'rgba(255,255,255,0.7)' : '#4b5563';

  return (
    <div
      className="py-16 px-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-6xl mx-auto">
        {section.content?.title && (
          <h2
            className="text-3xl sm:text-4xl font-bold mb-3 text-center"
            style={{ color: titleColor }}
          >
            {section.content.title}
          </h2>
        )}
        {section.content?.description && (
          <p
            className="text-lg mb-12 text-center max-w-2xl mx-auto"
            style={{ color: subtitleColor }}
          >
            {section.content.description}
          </p>
        )}

        {layout === 'list' ? (
          <div className="space-y-5 max-w-3xl mx-auto">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex gap-5 p-6 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderLeft: `4px solid ${accentColor}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                {service.icon ? (
                  <img src={service.icon} alt={service.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xl font-bold"
                    style={{ backgroundColor: accentColor }}
                  >
                    {service.title?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1" style={{ color: cardTextColor }}>{service.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: cardDescColor }}>{service.description}</p>
                </div>
                {service.image && (
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-28 h-20 rounded-lg object-cover flex-shrink-0 ml-4"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={layout === 'carousel' ? 'flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory' : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`}>
            {services.map((service, idx) => (
              <div
                key={service.id}
                className={`group relative p-6 rounded-xl transition-all duration-300 hover:-translate-y-1 ${layout === 'carousel' ? 'min-w-[280px] snap-start' : ''}`}
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                {/* Top accent bar */}
                <div
                  className="absolute top-0 left-6 right-6 h-1 rounded-b-full"
                  style={{ backgroundColor: accentColor }}
                />

                {service.image && (
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-40 object-cover rounded-lg mb-5 -mt-1"
                  />
                )}

                {service.icon ? (
                  <img src={service.icon} alt={service.title} className="w-16 h-16 rounded-xl object-cover mb-5" />
                ) : !service.image ? (
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-5 text-white text-2xl font-bold shadow-lg"
                    style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px ${accentColor}40` }}
                  >
                    {service.title?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                ) : null}

                <h3 className="font-bold text-lg mb-2 group-hover:translate-x-0.5 transition-transform" style={{ color: cardTextColor }}>
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: cardDescColor }}>
                  {service.description}
                </p>

                {/* Bottom hover accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesSectionEditor;

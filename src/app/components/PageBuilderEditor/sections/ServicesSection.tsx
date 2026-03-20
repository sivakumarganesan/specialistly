import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Plus, Trash2, LayoutGrid, List, Upload, X } from 'lucide-react';

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
                  <label className="block text-xs font-medium mb-1">Service Image</label>
                  {service.image ? (
                    <div className="relative">
                      <img
                        src={service.image}
                        alt="Service"
                        className="w-full h-28 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => handleUpdateService(service.id, { image: '' })}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                      <div className="flex flex-col items-center">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Click to upload image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              handleUpdateService(service.id, { image: event.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                  <Input
                    placeholder="Or paste image URL"
                    value={service.image?.startsWith('data:') ? '' : (service.image || '')}
                    onChange={(e) =>
                      handleUpdateService(service.id, { image: e.target.value })
                    }
                    size="sm"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Description
                  </label>
                  <Textarea
                    placeholder="Service description (shown when user clicks the card)"
                    value={service.description}
                    onChange={(e) =>
                      handleUpdateService(service.id, {
                        description: e.target.value,
                      })
                    }
                    rows={2}
                  />
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
  const [selectedService, setSelectedService] = useState<Service | null>(null);
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

  // Service card component - image focused, title below
  const ServiceCard = ({ service, className = '' }: { service: Service; className?: string }) => (
    <div
      className={`group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}
      onClick={() => setSelectedService(service)}
    >
      {/* Image area */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {service.image ? (
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : service.icon ? (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}>
            <img src={service.icon} alt={service.title} className="w-20 h-20 object-contain" />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)` }}
          >
            <span className="text-5xl font-bold" style={{ color: accentColor }}>
              {service.title?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Title area */}
      <div className="px-4 py-4 text-center">
        <h3 className="font-semibold text-lg" style={{ color: accentColor }}>
          {service.title}
        </h3>
      </div>
    </div>
  );

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
                className="flex gap-5 items-center p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
                onClick={() => setSelectedService(service)}
              >
                <div className="w-24 h-18 rounded-lg overflow-hidden flex-shrink-0" style={{ aspectRatio: '4/3' }}>
                  {service.image ? (
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                  ) : service.icon ? (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}>
                      <img src={service.icon} alt={service.title} className="w-10 h-10 object-contain" />
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)` }}
                    >
                      <span className="text-2xl font-bold" style={{ color: accentColor }}>
                        {service.title?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-lg" style={{ color: accentColor }}>{service.title}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className={layout === 'carousel' ? 'flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                className={layout === 'carousel' ? 'min-w-[280px] snap-start' : ''}
              />
            ))}
          </div>
        )}
      </div>

      {/* Service detail modal */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedService(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              ✕
            </button>

            {/* Modal image */}
            {selectedService.image ? (
              <img
                src={selectedService.image}
                alt={selectedService.title}
                className="w-full h-64 object-cover flex-shrink-0"
              />
            ) : selectedService.icon ? (
              <div className="w-full h-48 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}>
                <img src={selectedService.icon} alt={selectedService.title} className="w-24 h-24 object-contain" />
              </div>
            ) : (
              <div
                className="w-full h-48 flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}66)` }}
              >
                <span className="text-6xl font-bold text-white">{selectedService.title?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
            )}

            {/* Modal content */}
            <div className="p-8 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4" style={{ color: accentColor }}>
                {selectedService.title}
              </h2>
              {selectedService.description && (
                <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: cardDescColor }}>
                  {selectedService.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSectionEditor;

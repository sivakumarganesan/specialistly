import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Plus, Trash2, Grid3, List } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  icon?: string;
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
                <Grid3 className="w-4 h-4" />
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

  const gridClasses =
    layout === 'grid'
      ? 'grid grid-cols-3 gap-6'
      : layout === 'list'
        ? 'space-y-4'
        : 'flex gap-6 overflow-x-auto pb-4';

  return (
    <div
      className="py-16 px-4"
      style={{
        backgroundColor: section.styling?.backgroundColor || 'white',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {section.content?.title && (
          <h2 className="text-3xl font-bold mb-4">{section.content.title}</h2>
        )}
        {section.content?.description && (
          <p className="text-gray-600 mb-12 text-lg">
            {section.content.description}
          </p>
        )}

        <div className={gridClasses}>
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              {service.icon && (
                <img
                  src={service.icon}
                  alt={service.title}
                  className="w-12 h-12 mb-4"
                />
              )}
              <h3 className="font-bold text-lg mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServicesSectionEditor;

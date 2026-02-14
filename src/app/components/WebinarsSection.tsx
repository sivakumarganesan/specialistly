import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Plus, Edit, Trash2, Eye, Lock, ChevronRight, Upload } from 'lucide-react';
import WebinarManager from './WebinarManager';
import { serviceAPI } from '@/app/api/apiClient';

interface Webinar {
  _id: string;
  title: string;
  description: string;
  price: string;
  location: string;
  eventType: 'single' | 'multiple';
  sessionFrequency: 'onetime' | 'selected' | 'repeat';
  webinarDates: Array<{ date: string; time: string; duration: string; capacity: string }>;
  weeklySchedule: Array<{ day: string; time: string; duration: string; capacity: string; enabled: boolean }>;
  status: 'active' | 'draft';
  creator: string;
  createdAt: string;
}

interface Props {
  specialistEmail: string;
  specialistId?: string;
  specialistName?: string;
}

export const WebinarsSection: React.FC<Props> = ({ specialistEmail, specialistId, specialistName }) => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<Webinar | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchWebinars();
  }, [specialistEmail]);

  const fetchWebinars = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getServices(specialistEmail);
      
      if (response?.data) {
        // Filter for webinars only
        const webinars = response.data.filter((service: any) => service.eventType);
        setWebinars(webinars);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load webinars');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebinar = async (data: any) => {
    try {
      setLoading(true);
      
      if (editingWebinar?._id) {
        // Update existing
        await serviceAPI.updateService(editingWebinar._id, {
          ...data,
          specialistEmail,
          specialistId,
          specialistName,
        });
        setSuccessMessage('Webinar updated successfully');
      } else {
        // Create new
        await fetch(`${process.env.VITE_API_URL}/services/webinar/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            specialistEmail,
            specialistId,
            specialistName,
          }),
        });
        setSuccessMessage('Webinar created successfully with booking slots');
      }

      setTimeout(() => {
        setSuccessMessage('');
        setIsCreating(false);
        setEditingWebinar(null);
        fetchWebinars();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save webinar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebinar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webinar?')) return;

    try {
      await serviceAPI.deleteService(id);
      setSuccessMessage('Webinar deleted successfully');
      setTimeout(() => {
        setSuccessMessage('');
        fetchWebinars();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to delete webinar');
    }
  };

  const handlePublishWebinar = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.VITE_API_URL}/services/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistEmail,
          specialistId,
          specialistName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish webinar');
      }

      const result = await response.json();
      setSuccessMessage(`Webinar published! ${result.slotsGenerated} booking slots created.`);
      setTimeout(() => {
        setSuccessMessage('');
        fetchWebinars();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to publish webinar');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingWebinar(null);
  };

  if (isCreating || editingWebinar) {
    return (
      <div className="space-y-4">
        {successMessage && (
          <Card className="bg-green-50 border-green-200 p-4">
            <p className="text-green-700 font-medium">✓ {successMessage}</p>
          </Card>
        )}
        {error && (
          <Card className="bg-red-50 border-red-200 p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </Card>
        )}
        <WebinarManager
          serviceId={editingWebinar?._id}
          initialData={editingWebinar}
          onSave={handleSaveWebinar}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webinars & Events</h2>
          <p className="text-gray-600 text-sm mt-1">
            Create and manage webinars with single or multiple sessions. Users can book available time slots.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Webinar
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200 p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </Card>
      )}

      {successMessage && (
        <Card className="bg-green-50 border-green-200 p-4">
          <p className="text-green-700 font-medium">✓ {successMessage}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading webinars...</p>
        </Card>
      ) : webinars.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="text-4xl">📺</div>
          <p className="text-gray-600 max-w-md mx-auto">
            No webinars yet. Create your first webinar to allow users to book available time slots.
          </p>
          <Button
            onClick={() => setIsCreating(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Your First Webinar
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webinars.map(webinar => (
            <Card key={webinar._id} className="p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{webinar.title}</h3>
                    <Badge className={webinar.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {webinar.status === 'active' ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Draft
                        </>
                      )}
                    </Badge>
                    {webinar.eventType === 'single' ? (
                      <Badge className="bg-blue-100 text-blue-800">Single Day</Badge>
                    ) : (
                      <Badge className="bg-purple-100 text-purple-800">Multiple Sessions</Badge>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {webinar.description}
                  </p>

                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs font-medium">Price</p>
                      <p className="font-bold text-lg">${webinar.price}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium">Type</p>
                      <p className="font-medium">
                        {webinar.eventType === 'single' ? 'One-time' : webinar.sessionFrequency === 'repeat' ? 'Weekly' : 'Multiple Dates'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium">Sessions</p>
                      <p className="font-medium">
                        {webinar.eventType === 'single' 
                          ? webinar.webinarDates?.length || 0
                          : webinar.sessionFrequency === 'repeat'
                          ? webinar.weeklySchedule?.filter(s => s.enabled).length || 0
                          : webinar.webinarDates?.length || 0
                        } slots
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium">Platform</p>
                      <p className="font-medium capitalize">{webinar.location}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {webinar.status === 'draft' && (
                    <Button
                      onClick={() => handlePublishWebinar(webinar._id)}
                      className="gap-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Upload className="h-4 w-4" />
                      Publish
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingWebinar(webinar)}
                    className="gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWebinar(webinar._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 How it works:</strong> When you publish a webinar, available booking slots are automatically created. Users can book any available slot, and you'll receive a notification for each booking.
        </p>
      </Card>
    </div>
  );
};

export default WebinarsSection;

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { serviceAPI } from "@/app/api/apiClient";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  DollarSign,
  MapPin,
  Video,
  Briefcase,
  Edit,
  Trash2,
  Share2,
} from "lucide-react";

interface ServiceDetailProps {
  serviceId: string;
  onBack: () => void;
  onEdit?: (service: any) => void;
  onDelete?: (serviceId: string) => void;
}

export function ServiceDetail({ serviceId, onBack, onEdit, onDelete }: ServiceDetailProps) {
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getServiceById(serviceId);
      setService(response?.data || response);
    } catch (err: any) {
      setError(err.message || "Failed to load service details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="ml-4 text-gray-600">Loading service details...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <Card className="p-8 text-center">
            <p className="text-red-600 mb-4">{error || "Service not found"}</p>
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isWebinar = service.eventType || false;
  const isSingleDay = service.eventType === "single";
  const isRecurring = service.sessionFrequency === "repeat";

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(service)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this service?")) {
                    onDelete(service._id || service.id);
                  }
                }}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6">
          {/* Header Card */}
          <Card className="overflow-hidden">
            {service.image && (
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
                  <p className="text-gray-600 text-lg mb-4">{service.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge
                    className={
                      service.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {service.status || "active"}
                  </Badge>
                  {isWebinar && (
                    <Badge
                      className={
                        isSingleDay
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }
                    >
                      {isSingleDay ? "Single Day" : "Multiple Sessions"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-lg font-semibold">${service.price || "0"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="text-lg font-semibold">{service.capacity || "N/A"}</p>
                  </div>
                </div>
                {service.duration && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="text-lg font-semibold">{service.duration} min</p>
                    </div>
                  </div>
                )}
                {service.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-lg font-semibold capitalize">{service.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Details Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Service Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Service Information</h2>
              <div className="space-y-4">
                {service.type && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Type</p>
                    <p className="text-gray-900 capitalize">{service.type}</p>
                  </div>
                )}
                {isWebinar && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Event Type</p>
                      <p className="text-gray-900 capitalize">
                        {isSingleDay ? "Single Day" : "Multiple Days"}
                      </p>
                    </div>
                    {!isSingleDay && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Frequency</p>
                        <p className="text-gray-900 capitalize">
                          {service.sessionFrequency === "selected"
                            ? "Selected Dates"
                            : service.sessionFrequency}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {service.assignedCustomer && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Assigned To</p>
                    <p className="text-gray-900">{service.assignedCustomer}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Schedule/Dates */}
            {isWebinar && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {isSingleDay ? "Session Details" : "Schedule"}
                </h2>
                <div className="space-y-3">
                  {isSingleDay && service.webinarDates?.length > 0 ? (
                    service.webinarDates.map((date: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold">{date.date}</p>
                          <p className="text-sm text-gray-600">{date.time}</p>
                        </div>
                      </div>
                    ))
                  ) : isRecurring && service.weeklySchedule?.length > 0 ? (
                    service.weeklySchedule
                      .filter((s: any) => s.enabled)
                      .map((schedule: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-semibold">{schedule.day}s</p>
                            <p className="text-sm text-gray-600">{schedule.time}</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-600">No schedule details available</p>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Full Description */}
          {service.description && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{service.description}</p>
            </Card>
          )}

          {/* Statistics (if available) */}
          {(service.sales !== undefined || service.revenue !== undefined || service.bookings !== undefined) && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Performance</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {service.sales !== undefined && (
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">{service.sales || 0}</p>
                    <p className="text-sm text-gray-600">Sales</p>
                  </div>
                )}
                {service.revenue !== undefined && (
                  <div className="text-center p-4 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">
                      ${service.revenue || 0}
                    </p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                )}
                {service.bookings !== undefined && (
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <p className="text-2xl font-bold text-purple-600">
                      {service.bookings || 0}
                    </p>
                    <p className="text-sm text-gray-600">Bookings</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceDetail;

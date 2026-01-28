import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { serviceAPI, appointmentAPI } from "@/app/api/apiClient";
import { useAuth } from "@/app/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Video,
  UserCheck,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  X,
  CalendarClock,
} from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";

interface Service {
  id: string;
  title: string;
  type: "webinar" | "consulting";
  description: string;
  price: string;
  duration: string;
  capacity: string;
  schedule: string;
  status: "active" | "draft";
  // Webinar specific fields
  eventType?: "single" | "multiple";
  location?: string;
  sessionFrequency?: "onetime" | "selected" | "repeat";
  webinarDates?: { date: string; time: string }[];
  weeklySchedule?: { day: string; time: string; enabled: boolean }[];
  // Consulting specific fields
  sessionLocation?: string;
  availabilityType?: string;
  sessionDuration?: string;
  selectedDate?: string;
  startTime?: string;
  startAmPm?: "AM" | "PM";
  endTime?: string;
  endAmPm?: "AM" | "PM";
}

interface WeeklyAvailability {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface CreatorProfile {
  weeklyAvailability: WeeklyAvailability[];
  savedAt?: string;
}

interface SearchableItem {
  id: string;
  title: string;
  type: "course" | "offering";
}

interface ServicesProps {
  onUpdateSearchableItems: (items: SearchableItem[]) => void;
}

export function Services({ onUpdateSearchableItems }: ServicesProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft">("all");

  // Load services from API
  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoading(true);
        const response = await serviceAPI.getAll({ creator: user?.email });
        if (response.data) {
          // Transform MongoDB data to Service interface
          const transformedServices: Service[] = response.data.map((service: any) => ({
            id: service._id || service.id,
            title: service.title,
            type: service.type,
            description: service.description,
            price: service.price,
            duration: service.duration,
            capacity: service.capacity,
            schedule: service.schedule,
            status: service.status || "draft",
            eventType: service.eventType,
            location: service.location,
            sessionFrequency: service.sessionFrequency,
            webinarDates: service.webinarDates,
            weeklySchedule: service.weeklySchedule,
          }));
          setServices(transformedServices);
        }
      } catch (error) {
        console.error("Failed to load services:", error);
        // Keep empty array if no services exist yet
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [user?.email]);

  // Update searchable items whenever services change
  useEffect(() => {
    const searchableItems: SearchableItem[] = services.map(service => ({
      id: service.id,
      title: service.title,
      type: "offering",
    }));
    onUpdateSearchableItems(searchableItems);
  }, [services, onUpdateSearchableItems]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceType, setServiceType] = useState<"webinar" | "consulting" | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    capacity: "",
    schedule: "Flexible",
    // Webinar specific fields
    eventType: "single" as "single" | "multiple",
    location: "zoom",
    sessionFrequency: "onetime" as "onetime" | "selected" | "repeat",
    // Consulting specific fields
    sessionLocation: "zoom",
    availabilityType: "single_day",
    sessionDuration: "60",
    selectedDate: new Date().toISOString().split('T')[0],
    startTime: "09",
    startAmPm: "AM" as "AM" | "PM",
    endTime: "10",
    endAmPm: "AM" as "AM" | "PM",
  })

  const [webinarDates, setWebinarDates] = useState<{ date: string; time: string }[]>([
    { date: new Date().toISOString().split('T')[0], time: "10:00" }
  ]);

  const [weeklySchedule, setWeeklySchedule] = useState<{ day: string; time: string; enabled: boolean }[]>([
    { day: "Monday", time: "10:00", enabled: true },
    { day: "Tuesday", time: "10:00", enabled: false },
    { day: "Wednesday", time: "10:00", enabled: false },
    { day: "Thursday", time: "10:00", enabled: false },
    { day: "Friday", time: "10:00", enabled: false },
    { day: "Saturday", time: "10:00", enabled: false },
    { day: "Sunday", time: "10:00", enabled: false },
  ]);

  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedServiceForSlots, setSelectedServiceForSlots] = useState<Service | null>(null);
  
  // Creator Profile with Weekly Availability
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile>({
    weeklyAvailability: [
      { day: "Monday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "Tuesday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "Wednesday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "Thursday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "Friday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "Saturday", enabled: false, startTime: "09:00", endTime: "17:00" },
      { day: "Sunday", enabled: false, startTime: "09:00", endTime: "17:00" },
    ],
    savedAt: new Date().toISOString(),
  });

  // Appointment slots state
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [newSlot, setNewSlot] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "10:00",
  });

  const handleCreateService = async () => {
    if (!formData.title || !formData.description) {
      alert("Please fill in all required fields (Title and Description)");
      return;
    }
    if (serviceType) {
      const serviceData = {
        title: formData.title,
        type: serviceType,
        description: formData.description,
        price: formData.price,
        duration: serviceType === "consulting" ? formData.sessionDuration : formData.duration,
        capacity: formData.capacity,
        schedule: formData.schedule,
        status: "draft",
        creator: user?.email,
        ...(serviceType === "webinar" && {
          eventType: formData.eventType,
          location: formData.location,
          sessionFrequency: formData.sessionFrequency,
          ...(formData.sessionFrequency === "selected" && {
            webinarDates: webinarDates,
          }),
          ...(formData.sessionFrequency === "repeat" && {
            weeklySchedule: weeklySchedule,
          }),
        }),
        ...(serviceType === "consulting" && {
          sessionLocation: formData.sessionLocation,
          availabilityType: formData.availabilityType,
          sessionDuration: formData.sessionDuration,
          selectedDate: formData.selectedDate,
          startTime: formData.startTime,
          startAmPm: formData.startAmPm,
          endTime: formData.endTime,
          endAmPm: formData.endAmPm,
        }),
      };
      
      try {
        const response = await serviceAPI.create(serviceData);
        const newService: Service = {
          id: response.data?._id,
          ...serviceData,
        };
        setServices([...services, newService]);
        setCreateDialogOpen(false);
        setServiceType(null);
        resetForm();
        alert("✓ Offering published successfully! Your service is now live.");
      } catch (error) {
        console.error("Failed to create service:", error);
        alert("Failed to create service. Please try again.");
      }
    }
  };

  const handleEditService = async () => {
    if (selectedService && formData.title) {
      const updatedData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        duration: selectedService.type === "consulting" ? formData.sessionDuration : formData.duration,
        capacity: formData.capacity,
        schedule: formData.schedule,
        creator: user?.email,
        ...(selectedService.type === "webinar" && {
          eventType: formData.eventType,
          location: formData.location,
          sessionFrequency: formData.sessionFrequency,
          ...(formData.sessionFrequency === "selected" && {
            webinarDates: webinarDates,
          }),
          ...(formData.sessionFrequency === "repeat" && {
            weeklySchedule: weeklySchedule,
          }),
        }),
        ...(selectedService.type === "consulting" && {
          sessionLocation: formData.sessionLocation,
          availabilityType: formData.availabilityType,
          sessionDuration: formData.sessionDuration,
          selectedDate: formData.selectedDate,
          startTime: formData.startTime,
          startAmPm: formData.startAmPm,
          endTime: formData.endTime,
          endAmPm: formData.endAmPm,
        }),
      };
      
      try {
        await serviceAPI.update(selectedService.id, updatedData);
        setServices(
          services.map((service) =>
            service.id === selectedService.id
              ? {
                  ...service,
                  ...updatedData,
                }
              : service
          )
        );
        setEditDialogOpen(false);
        setSelectedService(null);
        resetForm();
        alert("✓ Offering updated successfully! Your changes are now live.");
      } catch (error) {
        console.error("Failed to update service:", error);
        alert("Failed to update service. Please try again.");
      }
    }
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        await serviceAPI.delete(id);
        setServices(services.filter((service) => service.id !== id));
        alert("✓ Offering removed successfully.");
      } catch (error) {
        console.error("Failed to delete service:", error);
        alert("Failed to delete service. Please try again.");
      }
    }
  };

  const toggleStatus = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (service) {
      const newStatus = service.status === "active" ? "draft" : "active";
      try {
        await serviceAPI.update(id, { status: newStatus });
        setServices(
          services.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: newStatus,
                }
              : s
          )
        );
      } catch (error) {
        console.error("Failed to update service status:", error);
        alert("Failed to update service status. Please try again.");
      }
    }
  };

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price,
      duration: service.duration,
      capacity: service.capacity,
      schedule: service.schedule,
      eventType: service.eventType || "single",
      location: service.location || "zoom",
      sessionFrequency: service.sessionFrequency || "onetime",
    });
    if (service.type === "webinar" && service.webinarDates && service.webinarDates.length > 0) {
      setWebinarDates(service.webinarDates);
    } else {
      setWebinarDates([{ date: new Date().toISOString().split('T')[0], time: "10:00" }]);
    }
    if (service.type === "webinar" && service.weeklySchedule && service.weeklySchedule.length > 0) {
      setWeeklySchedule(service.weeklySchedule);
    } else {
      setWeeklySchedule([
        { day: "Monday", time: "10:00", enabled: false },
        { day: "Tuesday", time: "10:00", enabled: false },
        { day: "Wednesday", time: "10:00", enabled: false },
        { day: "Thursday", time: "10:00", enabled: false },
        { day: "Friday", time: "10:00", enabled: false },
        { day: "Saturday", time: "10:00", enabled: false },
        { day: "Sunday", time: "10:00", enabled: false },
      ]);
    }
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      duration: "",
      capacity: "",
      schedule: "Flexible",
      eventType: "single",
      location: "zoom",
      sessionFrequency: "onetime",
    });
    setWebinarDates([{ date: new Date().toISOString().split('T')[0], time: "10:00" }]);
    setWeeklySchedule([
      { day: "Monday", time: "10:00", enabled: false },
      { day: "Tuesday", time: "10:00", enabled: false },
      { day: "Wednesday", time: "10:00", enabled: false },
      { day: "Thursday", time: "10:00", enabled: false },
      { day: "Friday", time: "10:00", enabled: false },
      { day: "Saturday", time: "10:00", enabled: false },
      { day: "Sunday", time: "10:00", enabled: false },
    ]);
  };

  const openCreateDialog = (type: "webinar" | "consulting") => {
    setServiceType(type);
    resetForm();
    setCreateDialogOpen(true);
  };

  const addWebinarDate = () => {
    setWebinarDates([...webinarDates, { date: new Date().toISOString().split('T')[0], time: "10:00" }]);
  };

  const removeWebinarDate = (index: number) => {
    if (webinarDates.length > 1) {
      setWebinarDates(webinarDates.filter((_, i) => i !== index));
    }
  };

  const updateWebinarDate = (index: number, field: "date" | "time", value: string) => {
    const updated = [...webinarDates];
    updated[index][field] = value;
    setWebinarDates(updated);
  };

  const toggleWeekday = (index: number) => {
    const updated = [...weeklySchedule];
    updated[index].enabled = !updated[index].enabled;
    setWeeklySchedule(updated);
  };

  const updateWeekdayTime = (index: number, value: string) => {
    const updated = [...weeklySchedule];
    updated[index].time = value;
    setWeeklySchedule(updated);
  };

  const openAppointmentDialog = () => {
    setAppointmentDialogOpen(true);
  };

  const addAppointmentSlot = async () => {
    if (newSlot.date && newSlot.startTime && newSlot.endTime) {
      try {
        const slotData = {
          date: newSlot.date,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          status: "available",
        };
        
        const response = await appointmentAPI.create(slotData);
        const createdSlot: AppointmentSlot = {
          id: response.data._id,
          date: response.data.date,
          startTime: response.data.startTime,
          endTime: response.data.endTime,
          status: response.data.status || "available",
          bookedBy: response.data.bookedBy,
          serviceTitle: response.data.serviceTitle,
        };
        
        setAppointmentSlots([...appointmentSlots, createdSlot]);
        setNewSlot({
          date: new Date().toISOString().split('T')[0],
          startTime: "09:00",
          endTime: "10:00",
        });
        alert("Appointment slot added successfully!");
      } catch (error) {
        console.error("Failed to create appointment slot:", error);
        alert("Failed to add appointment slot. Please try again.");
      }
    }
  };

  const deleteAppointmentSlot = async (slotId: string) => {
    try {
      await appointmentAPI.delete(slotId);
      setAppointmentSlots(appointmentSlots.filter((slot) => slot.id !== slotId));
      alert("Appointment slot deleted successfully!");
    } catch (error) {
      console.error("Failed to delete appointment slot:", error);
      alert("Failed to delete appointment slot. Please try again.");
    }
  };

  const toggleDayAvailability = (index: number) => {
    const updated = [...creatorProfile.weeklyAvailability];
    updated[index].enabled = !updated[index].enabled;
    setCreatorProfile({
      ...creatorProfile,
      weeklyAvailability: updated,
    });
  };

  const updateDayTime = (index: number, field: "startTime" | "endTime", value: string) => {
    const updated = [...creatorProfile.weeklyAvailability];
    updated[index][field] = value;
    setCreatorProfile({
      ...creatorProfile,
      weeklyAvailability: updated,
    });
  };

  const saveWeeklyAvailability = () => {
    setCreatorProfile({
      ...creatorProfile,
      savedAt: new Date().toISOString(),
    });
    setAppointmentDialogOpen(false);
  };

  const getAvailableSlots = () => {
    return appointmentSlots.filter((slot) => slot.status === "available");
  };

  const getBookedSlots = () => {
    return appointmentSlots.filter((slot) => slot.status === "booked");
  };

  const getAvailableDays = () => {
    return creatorProfile.weeklyAvailability.filter((day) => day.enabled);
  };

  const getUnavailableDays = () => {
    return creatorProfile.weeklyAvailability.filter((day) => !day.enabled);
  };

  const getTotalConsultingServices = () => {
    return services.filter((s) => s.type === "consulting").length;
  };

  const getFilteredServices = () => {
    if (filterStatus === "all") {
      return services;
    }
    return services.filter((s) => s.status === filterStatus);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "webinar":
        return <Video className="h-5 w-5" />;
      case "consulting":
        return <UserCheck className="h-5 w-5" />;
      default:
        return <Briefcase className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "webinar":
        return "bg-blue-100 text-blue-700";
      case "consulting":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Services</h1>
          <p className="text-gray-600">
            Create and manage your service offerings
          </p>
        </div>
        
        {/* Set Availability Button */}
        {getTotalConsultingServices() > 0 && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 gap-2"
            onClick={openAppointmentDialog}
          >
            <CalendarClock className="h-5 w-5" />
            Set Your Availability
            <Badge className="bg-white text-blue-600">
              {getAvailableDays().length}/7
            </Badge>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus("all")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="text-2xl font-bold">{services.length}</p>
            </div>
          </div>
        </Card>
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus("active")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Video className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">
                {services.filter((s) => s.status === "active").length}
              </p>
            </div>
          </div>
        </Card>
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus("draft")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold">
                {services.filter((s) => s.status === "draft").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarClock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Days</p>
              <p className="text-2xl font-bold">
                {getAvailableDays().length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Appointment Availability Info - Show when consulting services exist */}
      {getTotalConsultingServices() > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <CalendarClock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your Consulting Availability</h3>
                <p className="text-sm text-gray-600">
                  {getAvailableDays().length} days available • {getUnavailableDays().length} days unavailable
                  {creatorProfile.savedAt && (
                    <span className="ml-2 text-xs text-gray-500">
                      Last updated: {new Date(creatorProfile.savedAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={openAppointmentDialog}
            >
              <Edit className="h-4 w-4" />
              Manage Slots
            </Button>
          </div>
        </Card>
      )}

      {/* Create Service Type Selection */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Create New Service</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
            onClick={() => openCreateDialog("webinar")}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-blue-100 rounded-full">
                <Video className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Live Webinar</h3>
              <p className="text-sm text-gray-600">
                Host live webinars for multiple participants
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="h-4 w-4" />
                Create Webinar
              </Button>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-green-500"
            onClick={() => openCreateDialog("consulting")}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-green-100 rounded-full">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">Consulting 1:1</h3>
              <p className="text-sm text-gray-600">
                Offer personalized one-on-one consulting sessions
              </p>
              <Button className="bg-green-600 hover:bg-green-700 gap-2">
                <Plus className="h-4 w-4" />
                Create Consulting
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Services List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Services</h2>
        {filterStatus !== "all" && (
          <div className="mb-3 flex items-center gap-2">
            <Badge className={filterStatus === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
              Filter: {filterStatus}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Clear Filter
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getFilteredServices().map((service) => (
            <Card key={service.id} className="p-4 hover:shadow-lg transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(service.type)}`}>
                      {getTypeIcon(service.type)}
                    </div>
                    <Badge className={getTypeColor(service.type)}>
                      {service.type}
                    </Badge>
                  </div>
                  <Badge
                    className={
                      service.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {service.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-1">{service.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">{service.price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">{service.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-semibold">{service.capacity}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarClock className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">{service.schedule}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(service)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(service.id)}
                  >
                    {service.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {service.type === "consulting" && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Linked to your availability</span>
                      <Badge className="bg-blue-100 text-blue-700">
                        {getAvailableSlots().length} slots
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Service Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create {serviceType && serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for your new service offering
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Service title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your service"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Webinar Specific Fields */}
            {serviceType === "webinar" && (
              <>
                <div>
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value: "single" | "multiple") =>
                      setFormData({ ...formData, eventType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Day</SelectItem>
                      <SelectItem value="multiple">Multiple Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Webinar Location *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom">Zoom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration *</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sessionFrequency">Session Frequency *</Label>
                  <Select
                    value={formData.sessionFrequency}
                    onValueChange={(value: "onetime" | "selected" | "repeat") =>
                      setFormData({ ...formData, sessionFrequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onetime">One time</SelectItem>
                      <SelectItem value="selected">On Selected Dates</SelectItem>
                      <SelectItem value="repeat">Repeat on Selected days of the Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Webinar Dates - Show only when "On Selected Dates" is selected */}
                {formData.sessionFrequency === "selected" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Webinar Date & Time *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addWebinarDate}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Date
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {webinarDates.map((dateTime, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Input
                              type="date"
                              value={dateTime.date}
                              onChange={(e) =>
                                updateWebinarDate(index, "date", e.target.value)
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              type="time"
                              value={dateTime.time}
                              onChange={(e) =>
                                updateWebinarDate(index, "time", e.target.value)
                              }
                            />
                          </div>
                          {webinarDates.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeWebinarDate(index)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly Schedule - Show only when "Repeat on Selected days of the Week" is selected */}
                {formData.sessionFrequency === "repeat" && (
                  <div className="space-y-3">
                    <Label>Select Days & Time *</Label>
                    <div className="space-y-2">
                      {weeklySchedule.map((day, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg border">
                          <Checkbox
                            id={`day-${index}`}
                            checked={day.enabled}
                            onCheckedChange={() => toggleWeekday(index)}
                          />
                          <label
                            htmlFor={`day-${index}`}
                            className="flex-1 cursor-pointer font-medium"
                          >
                            {day.day}
                          </label>
                          <Input
                            type="time"
                            value={day.time}
                            onChange={(e) => updateWeekdayTime(index, e.target.value)}
                            disabled={!day.enabled}
                            className="w-32"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Consulting Specific Fields */}
            {serviceType === "consulting" && (
              <>
                <div>
                  <Label htmlFor="sessionLocation">Session Location *</Label>
                  <Select
                    value={formData.sessionLocation}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sessionLocation: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="google-meet">Google Meet</SelectItem>
                      <SelectItem value="address">At this Address</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="availabilityType">Availability Type *</Label>
                  <Select
                    value={formData.availabilityType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, availabilityType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_day">Single Day</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="not_sure">Not Sure</SelectItem>
                      <SelectItem value="set_after_booking">Set after Booking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sessionDuration">Set Duration of Each Session *</Label>
                  <Select
                    value={formData.sessionDuration}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sessionDuration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="selectedDate">Select Date *</Label>
                  <Input
                    id="selectedDate"
                    type="date"
                    value={formData.selectedDate}
                    onChange={(e) =>
                      setFormData({ ...formData, selectedDate: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.startTime}
                        onValueChange={(value) =>
                          setFormData({ ...formData, startTime: value })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = String(i + 1).padStart(2, '0');
                            return (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Select
                        value={formData.startAmPm}
                        onValueChange={(value: "AM" | "PM") =>
                          setFormData({ ...formData, startAmPm: value })
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.endTime}
                        onValueChange={(value) =>
                          setFormData({ ...formData, endTime: value })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = String(i + 1).padStart(2, '0');
                            return (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Select
                        value={formData.endAmPm}
                        onValueChange={(value: "AM" | "PM") =>
                          setFormData({ ...formData, endAmPm: value })
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  placeholder="$99"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              {serviceType === "webinar" && (
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="2 hours"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  placeholder="50"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                />
              </div>
              {serviceType === "webinar" && (
                <div>
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    placeholder="Weekly"
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setServiceType(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleCreateService}
            >
              Create Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the details for your service offering
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="Service title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe your service"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Webinar Specific Fields */}
            {selectedService?.type === "webinar" && (
              <>
                <div>
                  <Label htmlFor="edit-eventType">Event Type *</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value: "single" | "multiple") =>
                      setFormData({ ...formData, eventType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Day</SelectItem>
                      <SelectItem value="multiple">Multiple Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-location">Webinar Location *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom">Zoom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-duration">Duration *</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-sessionFrequency">Session Frequency *</Label>
                  <Select
                    value={formData.sessionFrequency}
                    onValueChange={(value: "onetime" | "selected" | "repeat") =>
                      setFormData({ ...formData, sessionFrequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onetime">One time</SelectItem>
                      <SelectItem value="selected">On Selected Dates</SelectItem>
                      <SelectItem value="repeat">Repeat on Selected days of the Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Webinar Dates - Show only when "On Selected Dates" is selected */}
                {formData.sessionFrequency === "selected" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Webinar Date & Time *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addWebinarDate}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Date
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {webinarDates.map((dateTime, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Input
                              type="date"
                              value={dateTime.date}
                              onChange={(e) =>
                                updateWebinarDate(index, "date", e.target.value)
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              type="time"
                              value={dateTime.time}
                              onChange={(e) =>
                                updateWebinarDate(index, "time", e.target.value)
                              }
                            />
                          </div>
                          {webinarDates.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeWebinarDate(index)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly Schedule - Show only when "Repeat on Selected days of the Week" is selected */}
                {formData.sessionFrequency === "repeat" && (
                  <div className="space-y-3">
                    <Label>Select Days & Time *</Label>
                    <div className="space-y-2">
                      {weeklySchedule.map((day, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg border">
                          <Checkbox
                            id={`edit-day-${index}`}
                            checked={day.enabled}
                            onCheckedChange={() => toggleWeekday(index)}
                          />
                          <label
                            htmlFor={`edit-day-${index}`}
                            className="flex-1 cursor-pointer font-medium"
                          >
                            {day.day}
                          </label>
                          <Input
                            type="time"
                            value={day.time}
                            onChange={(e) => updateWeekdayTime(index, e.target.value)}
                            disabled={!day.enabled}
                            className="w-32"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Consulting Specific Fields in Edit Dialog */}
            {selectedService?.type === "consulting" && (
              <>
                <div>
                  <Label htmlFor="edit-sessionLocation">Session Location *</Label>
                  <Select
                    value={formData.sessionLocation || "zoom"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sessionLocation: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="google-meet">Google Meet</SelectItem>
                      <SelectItem value="address">At this Address</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-availabilityType">Availability Type *</Label>
                  <Select
                    value={formData.availabilityType || "single_day"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, availabilityType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_day">Single Day</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="not_sure">Not Sure</SelectItem>
                      <SelectItem value="set_after_booking">Set after Booking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-sessionDuration">Set Duration of Each Session *</Label>
                  <Select
                    value={formData.sessionDuration || "60"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sessionDuration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-selectedDate">Select Date *</Label>
                  <Input
                    id="edit-selectedDate"
                    type="date"
                    value={formData.selectedDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, selectedDate: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startTime">Start Time *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.startTime || "09"}
                        onValueChange={(value) =>
                          setFormData({ ...formData, startTime: value })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = String(i + 1).padStart(2, '0');
                            return (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Select
                        value={formData.startAmPm || "AM"}
                        onValueChange={(value: "AM" | "PM") =>
                          setFormData({ ...formData, startAmPm: value })
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-endTime">End Time *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.endTime || "10"}
                        onValueChange={(value) =>
                          setFormData({ ...formData, endTime: value })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = String(i + 1).padStart(2, '0');
                            return (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Select
                        value={formData.endAmPm || "AM"}
                        onValueChange={(value: "AM" | "PM") =>
                          setFormData({ ...formData, endAmPm: value })
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  placeholder="$99"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              {selectedService?.type !== "webinar" && (
                <div>
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input
                    id="edit-duration"
                    placeholder="2 hours"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  placeholder="50"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                />
              </div>
              {selectedService?.type !== "webinar" && (
                <div>
                  <Label htmlFor="edit-schedule">Schedule</Label>
                  <Input
                    id="edit-schedule"
                    placeholder="Weekly"
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedService(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleEditService}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Weekly Availability Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Set Your Availability
            </DialogTitle>
            <DialogDescription>
              Configure your weekly availability for consulting services. Enable/disable each day and set your working hours.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-3 bg-green-50 border-green-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Available Days</p>
                  <p className="text-2xl font-bold text-green-700">{getAvailableDays().length}/7</p>
                </div>
              </Card>
              <Card className="p-3 bg-gray-50 border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Unavailable Days</p>
                  <p className="text-2xl font-bold text-gray-700">{getUnavailableDays().length}/7</p>
                </div>
              </Card>
            </div>

            {/* Weekly Schedule Configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Weekly Schedule</h3>
                {creatorProfile.savedAt && (
                  <span className="text-xs text-gray-500">
                    Last saved: {new Date(creatorProfile.savedAt).toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                {creatorProfile.weeklyAvailability.map((day, index) => (
                  <Card 
                    key={index} 
                    className={`p-4 transition-all ${
                      day.enabled 
                        ? "bg-green-50 border-green-200" 
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <Checkbox
                        id={`day-${index}`}
                        checked={day.enabled}
                        onCheckedChange={() => toggleDayAvailability(index)}
                      />
                      
                      {/* Day Label */}
                      <label
                        htmlFor={`day-${index}`}
                        className="flex-1 cursor-pointer font-semibold min-w-[100px]"
                      >
                        {day.day}
                      </label>
                      
                      {/* Time Inputs */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600 min-w-fit">Start:</span>
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => updateDayTime(index, "startTime", e.target.value)}
                            disabled={!day.enabled}
                            className="w-24"
                          />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600 min-w-fit">End:</span>
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => updateDayTime(index, "endTime", e.target.value)}
                            disabled={!day.enabled}
                            className="w-24"
                          />
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      {day.enabled && (
                        <Badge className="bg-green-100 text-green-700">
                          Open
                        </Badge>
                      )}
                      {!day.enabled && (
                        <Badge className="bg-gray-100 text-gray-700">
                          Off
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Quick Actions</h4>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = creatorProfile.weeklyAvailability.map((day) => ({
                      ...day,
                      enabled: true,
                    }));
                    setCreatorProfile({ ...creatorProfile, weeklyAvailability: updated });
                  }}
                >
                  Enable All Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = creatorProfile.weeklyAvailability.map((day, idx) => ({
                      ...day,
                      enabled: idx < 5, // Monday to Friday
                    }));
                    setCreatorProfile({ ...creatorProfile, weeklyAvailability: updated });
                  }}
                >
                  Weekdays (Mon-Fri)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = creatorProfile.weeklyAvailability.map((day, idx) => ({
                      ...day,
                      enabled: idx >= 5, // Saturday and Sunday
                    }));
                    setCreatorProfile({ ...creatorProfile, weeklyAvailability: updated });
                  }}
                >
                  Weekends (Sat-Sun)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = creatorProfile.weeklyAvailability.map((day) => ({
                      ...day,
                      enabled: false,
                    }));
                    setCreatorProfile({ ...creatorProfile, weeklyAvailability: updated });
                  }}
                >
                  Disable All
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-gray-500">
                <span className="font-medium">{getTotalConsultingServices()}</span> consulting service(s) will use this availability
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAppointmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveWeeklyAvailability}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Save Availability
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
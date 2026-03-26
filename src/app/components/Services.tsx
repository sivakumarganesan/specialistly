import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { serviceAPI, appointmentAPI, customerAPI, consultingSlotAPI } from "@/app/api/apiClient";
import { Courses } from "@/app/components/Courses";
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
  GraduationCap,
  ImagePlus,
} from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";

interface Service {
  id: string;
  title: string;
  type: "webinar" | "consulting";
  description: string;
  price: string;
  duration: string;  // Required for all services (in minutes for consulting, string format for webinar)
  capacity?: string; // Required for webinars, not for consulting
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
  assignedCustomer?: string;
  assignedCustomerEmail?: string;
  currency?: string;
  thumbnail?: string;
}

interface SearchableItem {
  id: string;
  title: string;
  type: "course" | "offering";
}

interface Customer {
  _id?: string;
  id?: string;
  name: string;
  email: string;
}

interface ServicesProps {
  onUpdateSearchableItems: (items: SearchableItem[]) => void;
  onUpdateCourseItems?: (items: SearchableItem[]) => void;
}

export function Services({ onUpdateSearchableItems, onUpdateCourseItems }: ServicesProps) {
  const { user, setCurrentPage } = useAuth();
  const [activeTab, setActiveTab] = useState<"courses" | "offerings">("courses");
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookedOfferings, setBookedOfferings] = useState<any[]>([]);
  const [scheduledWebinars, setScheduledWebinars] = useState<any[]>([]);
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
            assignedCustomer: service.assignedCustomer,
            assignedCustomerEmail: service.assignedCustomerEmail,
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

  // Load customers from API
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await customerAPI.getAll();
        if (response.data) {
          setCustomers(response.data);
        }
      } catch (error) {
        console.error("Failed to load customers:", error);
      }
    };

    loadCustomers();
  }, []);

  // Load booked offerings (appointment slots with status 'booked')
  useEffect(() => {
    const loadBookedOfferings = async () => {
      try {
        const response = await appointmentAPI.getAll();
        if (response.data) {
          // Filter for booked slots for this specialist only
          const booked = response.data.filter((slot: any) => 
            slot.status === "booked" && slot.specialistEmail === user?.email
          );
          
          // Group by offering/service title
          const groupedByOffering = booked.reduce((acc: any, slot: any) => {
            const offering = acc.find((o: any) => o.serviceTitle === slot.serviceTitle);
            if (offering) {
              offering.bookings.push(slot);
            } else {
              acc.push({
                serviceTitle: slot.serviceTitle,
                bookings: [slot]
              });
            }
            return acc;
          }, []);
          
          setBookedOfferings(groupedByOffering);
        }
      } catch (error) {
        console.error("Failed to load booked offerings:", error);
      }
    };

    if (user?.email) {
      loadBookedOfferings();
    }
  }, [user?.email]);

  // Load scheduled webinars with Zoom data
  useEffect(() => {
    const loadScheduledWebinars = async () => {
      try {
        const response = await appointmentAPI.getScheduledWebinars(user?.email!);
        if (response.data) {
          setScheduledWebinars(response.data);
        }
      } catch (error) {
        console.error("Failed to load scheduled webinars:", error);
      }
    };

    if (user?.email) {
      loadScheduledWebinars();
    }
  }, [user?.email]);

  // Update searchable items whenever services change
  useEffect(() => {
    const searchableItems: SearchableItem[] = services.map(service => ({
      id: service.id,
      title: service.title,
      type: "offering",
    }));
    onUpdateSearchableItems(searchableItems);
  }, [services]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceType, setServiceType] = useState<"webinar" | "consulting" | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD" as string,
    duration: "",
    capacity: "",
    schedule: "Flexible",
    thumbnail: "",
    // Webinar specific fields
    eventType: "single" as "single" | "multiple",
    location: "zoom",
    sessionFrequency: "onetime" as "onetime" | "selected" | "repeat",
    // Consulting specific fields
    sessionLocation: "zoom",
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

  const handleCreateService = async () => {
    if (!formData.title || !formData.description) {
      alert("Please fill in all required fields (Title and Description)");
      return;
    }
    // Require duration for all service types
    if (!formData.duration) {
      alert("Please enter the duration for your service");
      return;
    }
    // Require capacity for webinars
    if (serviceType === "webinar" && !formData.capacity) {
      alert("Please enter the capacity for your webinar");
      return;
    }
    if (serviceType) {
      const serviceData = {
        title: formData.title,
        type: serviceType,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        duration: formData.duration,
        schedule: formData.schedule,
        status: "draft",
        creator: user?.email,
        thumbnail: formData.thumbnail,
        ...(serviceType === "webinar" && {
          capacity: formData.capacity,
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
        currency: formData.currency,
        duration: formData.duration,
        schedule: formData.schedule,
        creator: user?.email,
        thumbnail: formData.thumbnail,
        ...(selectedService.type === "webinar" && {
          capacity: formData.capacity,
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

  // Helper function to calculate end time (1 hour after start time)
  const getEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const toggleStatus = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (service) {
      const newStatus = service.status === "active" ? "draft" : "active";
      try {
        await serviceAPI.update(id, { status: newStatus });
        
        // If activating a webinar, create appointment slots from webinar dates
        if (newStatus === "active" && service.type === "webinar") {
          if (service.webinarDates && service.webinarDates.length > 0) {
            for (const dateSlot of service.webinarDates) {
              try {
                const endTime = getEndTime(dateSlot.time);
                await appointmentAPI.create({
                  date: dateSlot.date,
                  startTime: dateSlot.time,
                  endTime: endTime,
                  status: "available",
                  specialistEmail: user?.email,
                  specialistName: user?.name,
                  serviceTitle: service.title,
                });
              } catch (error) {
                console.error("Failed to create appointment slot:", error);
              }
            }
            alert(`✓ Webinar activated! ${service.webinarDates.length} appointment slot(s) created.`);
          }
        }
        
        // For consulting services, auto-generate slots from availability
        if (newStatus === "active" && service.type === "consulting") {
          try {
            await consultingSlotAPI.generateFromAvailability({
              specialistEmail: user?.email || '',
            });
            alert(`✓ Consulting service activated! Slots have been auto-generated from your availability schedule. Manage them in "Manage Consulting Slots".`);
          } catch (slotError) {
            console.error("Failed to auto-generate slots:", slotError);
            alert(`✓ Consulting service activated! Please go to "Manage Consulting Slots" or set up your availability schedule to create bookable slots.`);
          }
        }
        
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
      currency: service.currency || "USD",
      duration: service.duration,
      capacity: service.capacity || "",
      schedule: service.schedule,
      thumbnail: service.thumbnail || "",
      eventType: service.eventType || "single",
      location: service.location || "zoom",
      sessionFrequency: service.sessionFrequency || "onetime",
      sessionLocation: service.sessionLocation || "zoom",
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
      currency: "USD",
      duration: "",
      capacity: "",
      schedule: "Flexible",
      thumbnail: "",
      eventType: "single",
      location: "zoom",
      sessionFrequency: "onetime",
      sessionLocation: "zoom",
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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, thumbnail: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
        return "bg-cyan-100 text-blue-700";
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
          <h1 className="text-3xl font-bold mb-1">Offerings</h1>
          <p className="text-gray-600">
            Create and manage your courses and services
          </p>
        </div>
        
        {/* Manage Availability Button */}
        {activeTab === "offerings" && getTotalConsultingServices() > 0 && (
          <Button
            className="bg-cyan-600 hover:bg-cyan-700 gap-2"
            onClick={() => setCurrentPage('settings')}
          >
            <CalendarClock className="h-5 w-5" />
            Manage Availability
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "courses"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <GraduationCap className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Courses
        </button>
        <button
          onClick={() => setActiveTab("offerings")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "offerings"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Briefcase className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Offerings
        </button>
      </div>

      {/* Courses Tab */}
      {activeTab === "courses" && (
        <Courses onUpdateSearchableItems={onUpdateCourseItems || (() => {})} embedded />
      )}

      {/* Offerings Tab */}
      {activeTab === "offerings" && <>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus("all")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-gray-900" />
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
            <div className="p-2 bg-cyan-100 rounded-lg">
              <CalendarClock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Consulting</p>
              <p className="text-2xl font-bold">
                {getTotalConsultingServices()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Consulting Availability Info - Show when consulting services exist */}
      {getTotalConsultingServices() > 0 && (
        <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-600 rounded-lg">
                <CalendarClock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your Consulting Availability</h3>
                <p className="text-sm text-gray-600">
                  Manage your weekly availability and booking rules in Settings → Manage Availability
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setCurrentPage('settings')}
            >
              <Edit className="h-4 w-4" />
              Manage Availability
            </Button>
          </div>
        </Card>
      )}

      {/* Create New Consulting Offering */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Create New Offering</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Your Offerings</h2>
            <p className="text-sm text-gray-600">
              {filterStatus === "all" 
                ? `Total: ${services.length} offering${services.length !== 1 ? 's' : ''}`
                : `${filterStatus}: ${services.filter(s => s.status === filterStatus).length} offering${services.filter(s => s.status === filterStatus).length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          {filterStatus !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterStatus("all")}
              className="whitespace-nowrap"
            >
              Show All
            </Button>
          )}
        </div>
        
        {services.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50">
            <p className="text-gray-600 mb-4">No offerings yet. Create one to get started!</p>
          </Card>
        ) : (
          <>
            {filterStatus !== "all" && (
              <div className="mb-3 flex items-center gap-2">
                <Badge className={filterStatus === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                  Filter: {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                </Badge>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredServices().length === 0 ? (
                <Card className="p-6 col-span-full text-center bg-gray-50">
                  <p className="text-gray-600">No {filterStatus === "all" ? "offerings" : filterStatus + " offerings"} yet.</p>
                </Card>
              ) : (
                getFilteredServices().map((service) => (
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
                  {service.type === "webinar" && service.capacity && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold">{service.capacity}</span>
                    </div>
                  )}
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
                      <Badge className="bg-cyan-100 text-blue-700">
                        Consulting
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
              )}
            </div>
          </>
        )}
      </div>

      </>}

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

                {/* Webinar Dates - Show for Single Day OR when "On Selected Dates" is selected */}
                {(formData.eventType === "single" || formData.sessionFrequency === "selected") && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Webinar Date & Time *</Label>
                      {formData.sessionFrequency === "selected" && (
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
                      )}
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
                          {webinarDates.length > 1 && formData.sessionFrequency === "selected" && (
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
                  <p className="text-xs text-gray-500 mt-2 italic">📝 Note: Set specific dates and times in "Manage Consulting Slots" after activating this service.</p>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">$</SelectItem>
                      <SelectItem value="INR">₹</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="price"
                    placeholder="99"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="duration">Duration {serviceType === "consulting" ? "(minutes) *" : ""}</Label>
                <Input
                  id="duration"
                  placeholder={serviceType === "consulting" ? "30" : "2 hours"}
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <Label>Thumbnail Image</Label>
              <div className="mt-1 flex items-center gap-4">
                {formData.thumbnail ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnail: "" })}
                      className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <ImagePlus className="h-5 w-5 text-gray-400" />
                    <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                  </label>
                )}
                <p className="text-xs text-gray-500">JPG, PNG or WebP. Max 2MB.</p>
              </div>
            </div>

            {serviceType === "webinar" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    placeholder="50"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  />
                </div>
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
              </div>
            )}
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
              className="bg-gray-900 hover:bg-gray-800"
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

                {/* Webinar Dates - Show for Single Day OR when "On Selected Dates" is selected */}
                {(formData.eventType === "single" || formData.sessionFrequency === "selected") && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Webinar Date & Time *</Label>
                      {formData.sessionFrequency === "selected" && (
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
                      )}
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
                          {webinarDates.length > 1 && formData.sessionFrequency === "selected" && (
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
                  <p className="text-xs text-gray-500 mt-2 italic">📝 Note: Set specific dates and times in "Manage Consulting Slots" after activating this service.</p>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">$</SelectItem>
                      <SelectItem value="INR">₹</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="edit-price"
                    placeholder="99"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-duration">Duration {selectedService?.type === "consulting" ? "(minutes) *" : ""}</Label>
                <Input
                  id="edit-duration"
                  placeholder={selectedService?.type === "consulting" ? "30" : "2 hours"}
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <Label>Thumbnail Image</Label>
              <div className="mt-1 flex items-center gap-4">
                {formData.thumbnail ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnail: "" })}
                      className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <ImagePlus className="h-5 w-5 text-gray-400" />
                    <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                  </label>
                )}
                <p className="text-xs text-gray-500">JPG, PNG or WebP. Max 2MB.</p>
              </div>
            </div>

            {selectedService?.type === "webinar" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-capacity">Capacity *</Label>
                  <Input
                    id="edit-capacity"
                    placeholder="50"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  />
                </div>
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
              </div>
            )}
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
              className="bg-gray-900 hover:bg-gray-800"
              onClick={handleEditService}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

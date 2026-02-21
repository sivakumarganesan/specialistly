import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { usePaymentContext } from "@/app/context/PaymentContext";
import { creatorAPI, courseAPI, serviceAPI, customerAPI, appointmentAPI, consultingSlotAPI } from "@/app/api/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Star, Users, ArrowLeft, BookOpen, Briefcase, Calendar, Clock, Video } from "lucide-react";
import { MonthCalendarSlots } from "@/app/components/MonthCalendarSlots";
import { WebinarCalendarSlots } from "@/app/components/WebinarCalendarSlots";
import { WebinarBookingModal } from "@/app/components/WebinarBookingModal";
import { ConsultingSlotCalendar } from "@/app/components/ConsultingSlotCalendar";
import { SpecialistMeetingManager } from "@/app/components/SpecialistMeetingManager";

interface SpecialistProfileProps {
  specialistId: string;
  specialistEmail: string;
  onBack: () => void;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  level: string;
  duration: string;
  enrollments: number;
}

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  duration: number;
  sessionFrequency?: string;
  webinarDates?: Array<{ date: string; time: string }>;
  weeklySchedule?: Array<{ day: string; time: string; enabled: boolean }>;
}

interface AppointmentSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "available" | "booked";
  serviceTitle?: string;
}

export function SpecialistProfile({ specialistId, specialistEmail, onBack }: SpecialistProfileProps) {
  const { user } = useAuth();
  const { openPayment } = usePaymentContext();
  const [specialist, setSpecialist] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesCount, setCoursesCount] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "courses" | "services" | "appointments" | "meetings">("about");
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [serviceBookingId, setServiceBookingId] = useState<string | null>(null);
  const [selectedServiceDate, setSelectedServiceDate] = useState<string>("");
  const [futureSlots, setFutureSlots] = useState<AppointmentSlot[]>([]);
  const [showZoomReAuthModal, setShowZoomReAuthModal] = useState(false);
  const [zoomReAuthMessage, setZoomReAuthMessage] = useState("");
  const [selectedWebinarDate, setSelectedWebinarDate] = useState<{ date: string; time: string } | null>(null);
  const [webinarModalOpen, setWebinarModalOpen] = useState(false);
  const [selectedWebinarService, setSelectedWebinarService] = useState<Service | null>(null);

  useEffect(() => {
    fetchSpecialistData();
  }, [specialistId, specialistEmail]);

  const fetchSpecialistData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch specialist profile
      const specialistResponse = await creatorAPI.getById(specialistId);
      if (specialistResponse?.data) {
        setSpecialist(specialistResponse.data);
      }

      // Fetch specialist's courses
      const coursesResponse = await courseAPI.getAll({ specialistEmail: specialistEmail });
      const activeCourses = Array.isArray(coursesResponse?.data)
        ? coursesResponse.data.filter((c: any) => c.status === "published" || c.status === "active")
        : [];
      setCoursesCount(activeCourses.length);  // Store total count
      setCourses(activeCourses.slice(0, 6));  // Display only first 6

      // Fetch specialist's services
      const servicesResponse = await serviceAPI.getAll({ creator: specialistEmail });
      const activeServices = Array.isArray(servicesResponse?.data)
        ? servicesResponse.data.filter((s: any) => s.status === "active")
        : [];
      console.log(`📊 Services for ${specialistEmail}:`, activeServices.length);
      activeServices.forEach((s: any) => {
        console.log(`  - Service: ${s.title}, Type: ${s.type}, Status: ${s.status}, ID: ${s._id}`);
      });
      setServicesCount(activeServices.length);  // Store total count
      setServices(activeServices.slice(0, 6));  // Display only first 6

      // Fetch available consulting slots for this specialist (Phase 1 Backend Integration)
      try {
        const slotsResponse = await consultingSlotAPI.getSlots(specialistEmail);
        console.log('📅 Consulting Slots API response:', slotsResponse?.data);
        
        const now = new Date();
        // Convert ConsultingSlot format to AppointmentSlot format and filter future/available
        const consultingSlots = Array.isArray(slotsResponse?.data) ? slotsResponse.data : [];
        const availableSlots = consultingSlots
          .filter((slot: any) => {
            // Only show active slots with available capacity
            if (slot.status !== "active") {
              console.log('  ❌ Slot filtered out (not active):', slot.status);
              return false;
            }
            const bookedCount = slot.bookedSlots?.length || 0;
            const isFull = bookedCount >= slot.capacity;
            if (isFull) {
              console.log('  ❌ Slot filtered out (at capacity):', slot.date);
              return false;
            }
            const slotDate = new Date(slot.date);
            slotDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPastDate = slotDate < today;
            if (isPastDate) {
              console.log('  ❌ Slot filtered out (past date):', slot.date);
              return false;
            }
            console.log('  ✅ Slot included:', slot.date, slot.startTime);
            return true;
          })
          .map((slot: any) => ({
            // Map ConsultingSlot to AppointmentSlot interface
            _id: slot._id,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: "available" as const,
            serviceTitle: "Consulting Session", // Generic title for all consulting slots
          }));
        
        console.log(`📊 Final available consulting slots: ${availableSlots.length}`, availableSlots);
        setAppointmentSlots(availableSlots);
      } catch (error) {
        console.error("Failed to fetch consulting slots:", error);
        // Fall back to empty array if new API fails
        setAppointmentSlots([]);
      }
    } catch (error) {
      console.error("Failed to fetch specialist data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async (slotId: string) => {
    if (!user?.email || !specialist?.name || !user?.id) return;
    try {
      setIsBooking(true);
      const bookingData = {
        customerEmail: user.email,
        customerName: user.name || user.email,
        customerId: user.id,
      };
      const response = await consultingSlotAPI.book(slotId, bookingData);
      if (response?.success || response?.data) {
        alert("✓ Consulting slot booked successfully! Check your email for meeting details.");
        // Refresh appointment slots
        fetchSpecialistData();
        setBookingSlotId(null);
      } else {
        alert("Failed to book slot. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to book slot:", error);
      alert("Error booking slot. Please try again or contact the specialist.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleEnrollCourse = async (courseId: string, course?: Course) => {
    if (!user?.id || !user?.email) return;
    
    const courseData = course || courses.find(c => c._id === courseId);
    
    try {
      // Check if course is FREE or PAID
      if (courseData?.price && courseData.price > 0) {
        // Paid course - open payment modal
        openPayment({
          serviceId: courseId,
          serviceType: 'course',
          serviceName: courseData.title,
          amount: courseData.price * 100, // Convert to cents
          currency: 'usd',
          specialistId: specialistId,
          specialistName: specialist?.name || 'Specialist',
          onSuccess: async () => {
            try {
              // Enroll after payment succeeds
              await courseAPI.enrollSelfPaced(courseId, user.id, user.email);
              alert("✓ Payment successful! Successfully enrolled in course! View it in My Learning & Bookings.");
            } catch (error) {
              console.error("Failed to enroll:", error);
              alert(`Failed to complete enrollment after payment.`);
            }
          },
          onError: (error) => {
            alert(`Payment failed: ${error}`);
          },
        });
      } else {
        // Free course - enroll directly
        await courseAPI.enrollSelfPaced(courseId, user.id, user.email);
        alert("✓ Successfully enrolled in course! View it in My Learning & Bookings.");
      }
    } catch (error) {
      console.error("Failed to enroll:", error);
      alert(`Failed to enroll. Please try again.`);
    }
  };

  const handleBookService = async (serviceId: string, service?: any) => {
    if (!user?.email) return;
    
    // Check if it's a webinar with specific dates
    if (service?.type === "webinar" && service?.sessionFrequency === "selected" && service?.webinarDates?.length > 0) {
      // For webinars with specific dates, proceed directly to webinar date selection
      setServiceBookingId(serviceId);
      setSelectedServiceDate(service.webinarDates[0].date);
    } else {
      // For consulting or other services, use appointment slots
      setServiceBookingId(serviceId);
      setSelectedServiceDate("");
    }
  };

  const handleServiceDateSelect = (date: string) => {
    setSelectedServiceDate(date);
    // Get the service for this booking
    const service = services.find((s) => s._id === serviceBookingId);
    
    // Check if this is a webinar with specific dates
    if (service?.type === "webinar" && service?.sessionFrequency === "selected" && service?.webinarDates?.length > 0) {
      // For webinars, find the selected date in webinarDates
      const webinarDateInfo = service.webinarDates.find((wd: any) => wd.date === date);
      if (webinarDateInfo) {
        setSelectedWebinarDate(webinarDateInfo);
        setFutureSlots([]); // No appointment slots for webinars
      }
    } else {
      // For consulting services, filter appointment slots
      const serviceTitle = service?.title || "";
      const filteredSlots = appointmentSlots.filter((slot) => {
        const slotDate = new Date(slot.date).toISOString().split('T')[0];
        return slotDate === date && slot.status === "available" && slot.serviceTitle === serviceTitle;
      });
      setFutureSlots(filteredSlots);
      setSelectedWebinarDate(null);
    }
  };

  const handleConfirmServiceBooking = async (slotId?: string) => {
    if (!user?.email || !serviceBookingId) return;
    try {
      setIsBooking(true);
      const service = services.find((s) => s._id === serviceBookingId);
      
      // Handle webinar booking with specific dates
      if (service?.type === "webinar" && service?.sessionFrequency === "selected" && selectedWebinarDate) {
        const webinarBookingData = {
          customerEmail: user.email,
          customerName: user.name || user.email,
          specialistEmail: specialistEmail,
          specialistName: specialist.name,
          specialistId: specialistId,
          serviceId: serviceBookingId,
          serviceTitle: service.title,
          webinarDate: selectedWebinarDate.date,
          webinarTime: selectedWebinarDate.time,
        };
        
        // Book the webinar using new webinar booking endpoint (creates Zoom + sends emails)
        const response = await customerAPI.bookWebinar(webinarBookingData);
        
        if (response?.success) {
          alert("✓ Webinar booked successfully! Check your email for confirmation and Zoom link.");
          fetchSpecialistData();
          setServiceBookingId(null);
          setSelectedServiceDate("");
          setSelectedWebinarDate(null);
        } else {
          alert("Failed to book webinar: " + (response?.message || "Unknown error"));
        }
      } else if (slotId) {
        // Book consulting slot using Phase 1 Backend API
        const bookingData = {
          customerEmail: user.email,
          customerName: user.name || user.email,
          customerId: user.id,
        };
        
        const response = await consultingSlotAPI.book(slotId, bookingData);
        
        if (response?.success || response?.data) {
          alert("✓ Consulting slot booked successfully! Check your email for meeting details.");
          // Refresh data
          fetchSpecialistData();
          setServiceBookingId(null);
          setSelectedServiceDate("");
          setFutureSlots([]);
        } else {
          alert("Failed to book consulting slot. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Failed to book service:", error);
      alert("Error booking service. Please try again or contact the specialist.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-gray-600">Loading specialist profile...</p>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
        <p className="text-gray-600">Specialist not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Button onClick={onBack} variant="outline" className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Marketplace
      </Button>

      {/* Header Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {specialist.profilePicture ? (
                <img
                  src={specialist.profilePicture}
                  alt={specialist.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white font-bold text-4xl">
                  {specialist.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{specialist.name}</h1>
              <p className="text-lg text-indigo-600 font-semibold mb-3">{specialist.specialization}</p>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{specialist.rating || 4.5}</span>
                  <span className="text-gray-600">rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold">{specialist.totalStudents || 0}</span>
                  <span className="text-gray-600">students</span>
                </div>
              </div>
              <p className="text-gray-700">{specialist.bio}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b overflow-x-auto">
        {["about", "courses", "services", "appointments", ...(user?.email === specialistEmail ? ["meetings"] : [])].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "about" && "About"}
            {tab === "courses" && `Courses (${coursesCount})`}
            {tab === "services" && `Services (${servicesCount})`}
            {tab === "appointments" && `Book Appointment (${appointmentSlots.length})`}
            {tab === "meetings" && "Your Zoom Meetings"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "about" && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Bio</h3>
              <p className="text-gray-700">{specialist.bio}</p>
            </div>
            {specialist.experience && (
              <div>
                <h3 className="font-bold text-lg mb-2">Experience</h3>
                <p className="text-gray-700">{specialist.experience}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{coursesCount}</p>
                <p className="text-sm text-gray-600">Courses Offered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{servicesCount}</p>
                <p className="text-sm text-gray-600">Services Offered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{specialist.totalStudents || 0}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "courses" && (
        <div className="space-y-4">
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <Card key={course._id}>
                  <CardHeader>
                    <CardTitle className="flex items-start gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                      <span className="line-clamp-2">{course.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-indigo-600">₹{course.price}</p>
                        <p className="text-xs text-gray-600">{course.duration || "Self-paced"}</p>
                      </div>
                      <p className="text-sm text-gray-600">{course.enrollments || 0} enrolled</p>
                    </div>
                    <Button
                      onClick={() => handleEnrollCourse(course._id, course)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      Enroll Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                No courses available from this specialist
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "services" && (
        <div className="space-y-4">
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => {
                return (
                  <Card key={service._id}>
                    <CardHeader>
                      <CardTitle className="flex items-start gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                        <span className="line-clamp-2">{service.title}</span>
                      </CardTitle>
                      <CardDescription>{service.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-2xl font-bold text-indigo-600">₹{service.price}</p>
                          <p className="text-xs text-gray-600">{service.duration} min</p>
                        </div>
                      </div>

                      {/* Display webinar dates for webinar services */}
                      {service.type === "webinar" && service.sessionFrequency === "selected" && service.webinarDates && service.webinarDates.length > 0 ? (
                        <div className="bg-cyan-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-700 mb-2">
                            🎥 Webinar Sessions ({service.webinarDates.length})
                          </p>
                          <div className="space-y-1.5">
                            {service.webinarDates.slice(0, 3).map((wd: any, idx: number) => (
                              <div key={idx} className="text-xs text-blue-800 bg-white rounded px-2 py-1">
                                <span className="font-semibold">
                                  {new Date(wd.date + "T00:00:00").toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                                <span className="text-blue-600 mx-1">•</span>
                                <span className="font-medium">{wd.time}</span>
                              </div>
                            ))}
                            {service.webinarDates.length > 3 && (
                              <p className="text-xs text-blue-700 italic mt-2 font-medium">
                                ➕ +{service.webinarDates.length - 3} more dates available
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Calendar View for 1:1 Consulting */
                        <MonthCalendarSlots
                          slots={appointmentSlots.filter(
                            (slot) => slot.serviceTitle === service.title
                          )}
                          serviceName={service.title}
                          onSelectSlot={(slot) => {
                            setBookingSlotId(slot._id);
                            setServiceBookingId(service._id);
                          }}
                        />
                      )}

                      {service.type === "webinar" && service.sessionFrequency === "selected" && service.webinarDates && service.webinarDates.length > 0 ? (
                        <Button
                          onClick={() => {
                            setSelectedWebinarService(service);
                            setWebinarModalOpen(true);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          Join Webinar
                        </Button>
                      ) : (
                        <p className="text-xs text-gray-600 text-center py-2">
                          ℹ️ Select a date and time above to book your consultation
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                No services available from this specialist
              </CardContent>
            </Card>
          )}

          {/* Service Booking Modal - For 1:1 consulting appointments only */}
          {serviceBookingId && !selectedWebinarService && (
            (() => {
              const bookingService = services.find((s) => s._id === serviceBookingId);
              const isWebinar = bookingService?.type === "webinar" && bookingService?.sessionFrequency === "selected" && bookingService?.webinarDates?.length > 0;
              const hasAppointmentSlots = !isWebinar && appointmentSlots.length > 0;

              return hasAppointmentSlots ? (
            <Card className="border-2 border-purple-300 bg-indigo-50 shadow-lg">
              <CardHeader className="bg-indigo-100 rounded-t-lg">
                <CardTitle className="text-purple-800 text-lg">
                  {bookingService?.title || "Book Service"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {!isWebinar && (
                  <>
                    <p className="text-sm text-gray-700 font-medium">
                      📍 Select a date and time to book this service. A Zoom meeting link will be sent to your email.
                    </p>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <p className="text-sm font-semibold text-gray-800">Available Appointment Slots:</p>
                      
                      {appointmentSlots.filter(s => s.status === "available").length > 0 ? (
                        <div className="space-y-4">
                          {Array.from(
                            new Set(
                              appointmentSlots
                                .filter(s => s.status === "available")
                                .map((slot) =>
                                  new Date(slot.date).toISOString().split("T")[0]
                                )
                            )
                          )
                            .sort()
                            .map((date) => {
                              const slotsForDate = appointmentSlots.filter(
                                (slot) =>
                                  new Date(slot.date).toISOString().split("T")[0] === date && slot.status === "available"
                              );
                              return (
                                <div key={date} className="border-2 border-purple-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                  <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                    {new Date(date).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {slotsForDate.map((slot) => (
                                      <Button
                                        key={slot._id}
                                        onClick={() => handleConfirmServiceBooking(slot._id)}
                                        disabled={isBooking}
                                        className="bg-green-600 hover:bg-green-700 text-white text-xs h-auto py-3 font-semibold disabled:opacity-50"
                                      >
                                        <div className="flex flex-col items-center">
                                          <Clock className="w-3 h-3 mb-1" />
                                          <span>{slot.startTime}</span>
                                          <span className="text-xs opacity-90">- {slot.endTime}</span>
                                        </div>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-600 text-lg">No available slots.</p>
                          <p className="text-sm text-gray-500 mt-2">Please check back later.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Button
                  onClick={() => {
                    setServiceBookingId(null);
                    setFutureSlots([]);
                    setSelectedServiceDate("");
                    setSelectedWebinarDate(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
              ) : null;
            })()
          )}
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="space-y-4">
          {user?.role === "specialist" ? (
            <Card>
              <CardContent className="pt-6 text-center text-amber-600">
                <p>Please switch to customer mode to book appointments.</p>
              </CardContent>
            </Card>
          ) : (
            <ConsultingSlotCalendar
              specialistEmail={specialistEmail}
              onSelectSlot={(slot) => {
                setBookingSlotId(slot._id);
                console.log('Selected slot:', slot);
              }}
            />
          )}
        </div>
      )}

      {activeTab === "meetings" && user?.email === specialistEmail && (
        <div>
          <SpecialistMeetingManager />
        </div>
      )}

      {/* Zoom Re-Auth Modal */}
      {showZoomReAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">🔄 Zoom Authorization Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">
                {zoomReAuthMessage}
              </p>
              
              <div className="bg-cyan-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>What to do:</strong>
                </p>
                <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                  <li>Ask the specialist to open their Settings</li>
                  <li>Find "Zoom Integration" section</li>
                  <li>Click "Re-authorize" button</li>
                  <li>Complete the Zoom authorization</li>
                </ol>
              </div>

              <p className="text-xs text-gray-500">
                The specialist has been sent an email notification with a direct link to re-authorize.
              </p>
            </CardContent>
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
              <Button
                onClick={() => setShowZoomReAuthModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Got it, Thanks
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Webinar Booking Modal */}
      <WebinarBookingModal
        isOpen={webinarModalOpen}
        onClose={() => setWebinarModalOpen(false)}
        service={selectedWebinarService}
        onConfirm={(webinarDate) => {
          setSelectedWebinarDate(webinarDate);
          setSelectedServiceDate(webinarDate.date);
          handleConfirmServiceBooking();
        }}
        isLoading={isBooking}
      />
    </div>
  );
}

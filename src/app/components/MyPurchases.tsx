import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { customerAPI, courseAPI, serviceAPI, appointmentAPI } from "@/app/api/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { BookOpen, Briefcase, Clock, CheckCircle, AlertCircle, Calendar, X, Video } from "lucide-react";

interface Enrollment {
  _id: string;
  courseId: string;
  courseName: string;
  coursePrice: number;
  enrolledAt: string;
  status: string;
  progress: number;
}

interface Booking {
  _id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  bookedAt: string;
  status: string;
  scheduledTime?: string;
}

interface Appointment {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceTitle: string;
  specialistName: string;
  specialistEmail: string;
  status: string;
  zoomJoinUrl?: string;
  bookedAt: string;
}

export function MyPurchases() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"courses" | "services" | "appointments">("courses");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchPurchasesAndBookings();
  }, [user?.email]);

  const fetchPurchasesAndBookings = async () => {
    if (!user?.email) return;
    try {
      setIsLoading(true);

      // Fetch enrolled courses
      try {
        const enrollmentsResponse = await customerAPI.getEnrollments(user.email);
        const enrollmentsList = Array.isArray(enrollmentsResponse?.data)
          ? enrollmentsResponse.data.map((enrollment: any) => ({
              _id: enrollment._id,
              courseId: enrollment.courseId,
              courseName: enrollment.courseName || "Course",
              coursePrice: enrollment.coursePrice || 0,
              enrolledAt: enrollment.enrolledAt,
              status: enrollment.status || "active",
              progress: enrollment.progress || 0,
            }))
          : [];
        setEnrollments(enrollmentsList);
      } catch (error: any) {
        console.warn('⚠️ No enrollments found:', error.message);
        setEnrollments([]);
      }

      // Fetch booked services
      try {
        const bookingsResponse = await customerAPI.getBookings(user.email);
        console.log('📦 Direct Bookings Response:', bookingsResponse?.data);
        const bookingsList = Array.isArray(bookingsResponse?.data)
          ? bookingsResponse.data.map((booking: any) => ({
              _id: booking._id,
              serviceId: booking.serviceId,
              serviceName: booking.serviceName || "Service",
              servicePrice: booking.servicePrice || 0,
              bookedAt: booking.bookedAt,
              status: booking.status || "pending",
              scheduledTime: booking.scheduledTime,
            }))
          : [];
        console.log('💼 Direct Bookings count:', bookingsList.length);
        setBookings(bookingsList);
      } catch (error: any) {
        console.warn('⚠️ No bookings found:', error.message);
        setBookings([]);
      }

      // Fetch booked appointments
      try {
        const appointmentsResponse = await appointmentAPI.getAll();
        console.log('📅 All Appointments:', appointmentsResponse?.data);
        console.log('👤 Current user email:', user?.email);
        
        const userAppointments = Array.isArray(appointmentsResponse?.data)
          ? appointmentsResponse.data.filter((apt: any) => {
              const matches = apt.customerEmail?.toLowerCase() === user?.email?.toLowerCase() && apt.status === "booked";
              if (!matches) {
                console.log('❌ Appointment filtered out:', {
                  customerEmail: apt.customerEmail,
                  userEmail: user?.email,
                  status: apt.status,
                  serviceTitle: apt.serviceTitle
                });
              }
              return matches;
            })
          : [];
        console.log('✅ User Appointments matched:', userAppointments.length);
        
        const appointmentsList = userAppointments.map((appointment: any) => ({
          _id: appointment._id,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          serviceTitle: appointment.serviceTitle || "Consulting Session",
          specialistName: appointment.specialistName || "Specialist",
          specialistEmail: appointment.specialistEmail,
          status: appointment.status || "booked",
          zoomJoinUrl: appointment.zoomJoinUrl,
          bookedAt: appointment.createdAt || new Date().toISOString(),
        }));
        console.log('📋 Appointments List final:', appointmentsList);
        setAppointments(appointmentsList);
      } catch (error: any) {
        console.warn('⚠️ No appointments found:', error.message);
        setAppointments([]);
      }
    } catch (error) {
      console.error("Failed to fetch purchases and bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-cyan-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "confirmed":
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Learning & Bookings</h1>
        <p className="text-gray-600">Track your enrolled courses and booked services</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "courses"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          Enrolled Courses ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "services"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Booked Services ({bookings.length + appointments.length})
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "appointments"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Calendar className="w-5 h-5" />
          Scheduled Appointments ({appointments.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-600">
          <p>Loading your purchases...</p>
        </div>
      ) : null}

      {!isLoading && activeTab === "courses" && (
        <div className="space-y-4">
          {enrollments.length > 0 ? (
            enrollments.map((enrollment) => (
              <Card key={enrollment._id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-bold">{enrollment.courseName}</h3>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>₹{enrollment.coursePrice}</span>
                        <span>
                          Enrolled:{" "}
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {enrollment.progress}% complete
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          enrollment.status
                        )}`}
                      >
                        {getStatusIcon(enrollment.status)}
                        <span className="capitalize">{enrollment.status}</span>
                      </div>
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled
                        title="View in My Learning section"
                      >
                        Continue Learning
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No enrolled courses yet</p>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!isLoading && activeTab === "services" && (
        <div className="space-y-4">
          {bookings.length > 0 || appointments.length > 0 ? (
            <>
              {/* Direct Service Bookings */}
              {bookings.map((booking) => (
                <Card key={booking._id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Briefcase className="w-5 h-5 text-indigo-600" />
                          <h3 className="text-lg font-bold">{booking.serviceName}</h3>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>₹{booking.servicePrice}</span>
                          <span>
                            Booked:{" "}
                            {new Date(booking.bookedAt).toLocaleDateString()}
                          </span>
                          {booking.scheduledTime && (
                            <span>
                              Scheduled:{" "}
                              {new Date(booking.scheduledTime).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">{booking.status}</span>
                        </div>
                        {booking.status === "pending" && (
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        )}
                        {booking.status === "confirmed" && (
                          <Button variant="outline" size="sm">
                            Join Session
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Appointment-based Service Bookings */}
              {appointments.map((appointment) => {
                const appointmentDate = new Date(appointment.date);
                return (
                  <Card key={appointment._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-bold">{appointment.serviceTitle}</h3>
                          </div>
                          <div className="space-y-2 ml-8 text-sm text-gray-600">
                            <p>
                              <strong>Specialist:</strong> {appointment.specialistName}
                            </p>
                            <p>
                              <strong>Date:</strong>{" "}
                              {appointmentDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p>
                              <strong>Time:</strong> {appointment.startTime} - {appointment.endTime}
                            </p>
                            <p>
                              <strong>Booked:</strong>{" "}
                              {new Date(appointment.bookedAt).toLocaleDateString()}
                            </p>
                            {appointment.zoomJoinUrl && (
                              <p>
                                <strong>Meeting:</strong>{" "}
                                <a
                                  href={appointment.zoomJoinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline break-all"
                                >
                                  Join Zoom Meeting
                                </a>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <div
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              appointmentDate > new Date()
                                ? "bg-cyan-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{appointmentDate > new Date() ? "Upcoming" : "Completed"}</span>
                          </div>
                          {appointmentDate > new Date() && appointment.zoomJoinUrl && (
                            <Button
                              className="bg-indigo-600 hover:bg-indigo-700"
                              onClick={() =>
                                window.open(appointment.zoomJoinUrl, "_blank")
                              }
                            >
                              Join Meeting
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No booked services yet</p>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Browse Services
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!isLoading && activeTab === "appointments" && (
        <div className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map((appointment) => {
              const appointmentDate = new Date(appointment.date);
              const isUpcoming = appointmentDate > new Date();
              return (
                <Card key={appointment._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          <h3 className="text-lg font-bold">{appointment.serviceTitle}</h3>
                        </div>
                        <div className="space-y-2 ml-8 text-sm text-gray-600">
                          <p>
                            <strong>Specialist:</strong> {appointment.specialistName}
                          </p>
                          <p>
                            <strong>Date:</strong>{" "}
                            {appointmentDate.toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p>
                            <strong>Time:</strong> {appointment.startTime} - {appointment.endTime}
                          </p>
                          {appointment.zoomJoinUrl && (
                            <p>
                              <strong>Meeting:</strong>{" "}
                              <a
                                href={appointment.zoomJoinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                              >
                                Join Zoom Meeting
                              </a>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            isUpcoming
                              ? "bg-cyan-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{isUpcoming ? "Upcoming" : "Completed"}</span>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <Button
                            variant="outline"
                            className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            View Details
                          </Button>
                          {isUpcoming && appointment.zoomJoinUrl && (
                            <Button
                              className="bg-indigo-600 hover:bg-indigo-700"
                              onClick={() =>
                                window.open(appointment.zoomJoinUrl, "_blank")
                              }
                            >
                              Join Meeting
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No scheduled appointments yet</p>
                <p className="text-sm text-gray-500">
                  Book a consulting session with a specialist to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Appointment Details</CardTitle>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Service Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Service</h3>
                <p className="text-lg font-semibold text-gray-900">{selectedAppointment.serviceTitle}</p>
              </div>

              {/* Specialist Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Specialist</h3>
                <p className="text-lg font-semibold text-gray-900">{selectedAppointment.specialistName}</p>
                <p className="text-sm text-gray-600">{selectedAppointment.specialistEmail}</p>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Date</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(selectedAppointment.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Time</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Status</h3>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
                    new Date(selectedAppointment.date) > new Date()
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{new Date(selectedAppointment.date) > new Date() ? "Upcoming" : "Completed"}</span>
                </div>
              </div>

              {/* Zoom Meeting Info */}
              {selectedAppointment.zoomJoinUrl ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Video className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-3">Zoom Meeting Ready</h3>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.open(selectedAppointment.zoomJoinUrl, "_blank")}
                      >
                        Join Meeting
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-amber-900">Zoom Meeting Pending</h3>
                      <p className="text-sm text-amber-800 mt-1">
                        The specialist will create the Zoom meeting link shortly before your appointment time.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Booked At */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500">
                  Booked on {new Date(selectedAppointment.bookedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

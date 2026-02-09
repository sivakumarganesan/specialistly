import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { customerAPI, courseAPI, serviceAPI, appointmentAPI } from "@/app/api/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { BookOpen, Briefcase, Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";

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
        return "bg-blue-100 text-blue-800";
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
              ? "border-purple-600 text-purple-600"
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
              ? "border-purple-600 text-purple-600"
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
              ? "border-purple-600 text-purple-600"
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
                        <BookOpen className="w-5 h-5 text-purple-600" />
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
                          className="bg-purple-600 h-2 rounded-full transition-all"
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
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() =>
                          window.open(`/course/${enrollment.courseId}`, "_blank")
                        }
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
                <Button className="bg-purple-600 hover:bg-purple-700">
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
                          <Briefcase className="w-5 h-5 text-purple-600" />
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
                            <Briefcase className="w-5 h-5 text-purple-600" />
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
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{appointmentDate > new Date() ? "Upcoming" : "Completed"}</span>
                          </div>
                          {appointmentDate > new Date() && appointment.zoomJoinUrl && (
                            <Button
                              className="bg-purple-600 hover:bg-purple-700"
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
                <Button className="bg-purple-600 hover:bg-purple-700">
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
                          <Calendar className="w-5 h-5 text-purple-600" />
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
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{isUpcoming ? "Upcoming" : "Completed"}</span>
                        </div>
                        {isUpcoming && appointment.zoomJoinUrl && (
                          <Button
                            className="bg-purple-600 hover:bg-purple-700"
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
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { reportAPI } from "@/app/api/apiClient";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Loader2,
  Mail,
  Phone,
  Video,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Appointment {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  timezone: string;
  price: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  bookedAt: string;
  notes: string;
  zoomLink: string | null;
}

interface CourseEnrollment {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseType: string;
  customerEmail: string;
  paymentStatus: string;
  status: string;
  amount: number;
  currency: string;
  enrolledAt: string;
}

interface CourseSummary {
  id: string;
  title: string;
  courseType: string;
  price: number;
  currency: string;
  status: string;
  startDate: string;
  endDate: string;
  enrollmentCount: number;
}

interface Summary {
  totalAppointments: number;
  upcomingAppointments: number;
  pastAppointments: number;
  cancelledAppointments: number;
  totalCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
}

type Tab = "appointments" | "courses";

export function MyAppointments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("appointments");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportAPI.getSpecialistOverview();
      const data = res.data;
      setSummary(data.summary);
      setAppointments(data.appointments || []);
      setCourseEnrollments(data.courseEnrollments || []);
      setCourses(data.courses || []);
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "INR") return `₹${amount}`;
    return `$${amount}`;
  };

  const statusColor = (status: string) => {
    if (status === "booked" || status === "active" || status === "confirmed") return "bg-green-100 text-green-800";
    if (status.includes("cancelled")) return "bg-red-100 text-red-800";
    if (status === "completed") return "bg-blue-100 text-blue-800";
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter(a => new Date(a.date) >= now && a.status === "booked");
  const pastAppointments = appointments.filter(a => new Date(a.date) < now || a.status !== "booked");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold mb-1">My Appointments & Courses</h1>
      <p className="text-gray-500 text-sm mb-6">Track all your 1:1 appointments and course enrollments</p>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.upcomingAppointments}</p>
                <p className="text-xs text-gray-500">Upcoming Appointments</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalAppointments}</p>
                <p className="text-xs text-gray-500">Total Appointments</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalCourses}</p>
                <p className="text-xs text-gray-500">Courses</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalEnrollments}</p>
                <p className="text-xs text-gray-500">Course Enrollments</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "appointments"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("appointments")}
        >
          1:1 Appointments ({appointments.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "courses"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("courses")}
        >
          Courses & Enrollments ({courseEnrollments.length})
        </button>
      </div>

      {/* Appointments Tab */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcomingAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Upcoming ({upcomingAppointments.length})
              </h2>
              <div className="space-y-3">
                {upcomingAppointments.map((apt, i) => (
                  <AppointmentCard key={`upcoming-${i}`} appointment={apt} formatDate={formatDate} formatCurrency={formatCurrency} statusColor={statusColor} />
                ))}
              </div>
            </div>
          )}

          {/* Past / Other */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Past & Cancelled ({pastAppointments.length})
              </h2>
              <div className="space-y-3">
                {pastAppointments.map((apt, i) => (
                  <AppointmentCard key={`past-${i}`} appointment={apt} formatDate={formatDate} formatCurrency={formatCurrency} statusColor={statusColor} />
                ))}
              </div>
            </div>
          )}

          {appointments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No appointments yet</p>
              <p className="text-sm">When customers book your consulting slots, they&apos;ll appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          {courses.length > 0 ? (
            courses.map((course) => {
              const enrollments = courseEnrollments.filter(
                (e) => e.courseId?.toString() === course.id?.toString()
              );
              const isExpanded = expandedCourse === course.id;

              return (
                <Card key={course.id} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{course.courseType}</Badge>
                          <span className="text-sm text-gray-500">
                            {formatCurrency(course.price, course.currency)}
                          </span>
                          {course.startDate && (
                            <span className="text-xs text-gray-400">
                              Starts {formatDate(course.startDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-100 text-purple-800">
                        {course.enrollmentCount} enrolled
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-3 bg-gray-50">
                      {enrollments.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b">
                                <th className="pb-2 font-medium">Student Email</th>
                                <th className="pb-2 font-medium">Enrolled</th>
                                <th className="pb-2 font-medium">Payment</th>
                                <th className="pb-2 font-medium">Amount</th>
                                <th className="pb-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {enrollments.map((e) => (
                                <tr key={e.enrollmentId} className="border-b last:border-0">
                                  <td className="py-2">
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-gray-400" />
                                      {e.customerEmail}
                                    </span>
                                  </td>
                                  <td className="py-2 text-gray-600">{formatDate(e.enrolledAt)}</td>
                                  <td className="py-2">
                                    <Badge className={statusColor(e.paymentStatus)} variant="secondary">
                                      {e.paymentStatus}
                                    </Badge>
                                  </td>
                                  <td className="py-2">{formatCurrency(e.amount, e.currency)}</td>
                                  <td className="py-2">
                                    <Badge className={statusColor(e.status)} variant="secondary">
                                      {e.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No enrollments yet</p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No courses yet</p>
              <p className="text-sm">Create a course to start tracking enrollments.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Appointment row card */
function AppointmentCard({
  appointment,
  formatDate,
  formatCurrency,
  statusColor,
}: {
  appointment: Appointment;
  formatDate: (d: string) => string;
  formatCurrency: (a: number, c: string) => string;
  statusColor: (s: string) => string;
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{appointment.customerName}</span>
            <Badge className={statusColor(appointment.status)} variant="secondary">
              {appointment.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(appointment.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {appointment.startTime} – {appointment.endTime}
              {appointment.timezone && (
                <span className="text-xs text-gray-400 ml-1">({appointment.timezone})</span>
              )}
            </span>
            <span>{appointment.duration} min</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
            {appointment.customerEmail && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {appointment.customerEmail}
              </span>
            )}
            {appointment.customerPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {appointment.customerPhone}
              </span>
            )}
          </div>
          {appointment.notes && (
            <p className="text-xs text-gray-400 mt-1 italic">{appointment.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <span className="font-semibold text-gray-900">
            {formatCurrency(appointment.price, appointment.currency)}
          </span>
          {appointment.zoomLink && (
            <a
              href={appointment.zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              <Video className="w-3.5 h-3.5" />
              Join
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

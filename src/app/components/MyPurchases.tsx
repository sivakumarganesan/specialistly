import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { customerAPI, courseAPI, serviceAPI } from "@/app/api/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { BookOpen, Briefcase, Clock, CheckCircle, AlertCircle } from "lucide-react";

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

export function MyPurchases() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"courses" | "services">("courses");

  useEffect(() => {
    fetchPurchasesAndBookings();
  }, [user?.email]);

  const fetchPurchasesAndBookings = async () => {
    if (!user?.email) return;
    try {
      setIsLoading(true);

      // Fetch enrolled courses
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

      // Fetch booked services
      const bookingsResponse = await customerAPI.getBookings(user.email);
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
      setBookings(bookingsList);
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
          Booked Services ({bookings.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-600">
          <p>Loading your purchases...</p>
        </div>
      ) : activeTab === "courses" ? (
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
      ) : (
        <div className="space-y-4">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
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
            ))
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
    </div>
  );
}

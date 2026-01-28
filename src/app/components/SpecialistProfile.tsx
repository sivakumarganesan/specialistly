import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { creatorAPI, courseAPI, serviceAPI, customerAPI } from "@/app/api/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Star, Users, ArrowLeft, BookOpen, Briefcase } from "lucide-react";

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
}

export function SpecialistProfile({ specialistId, specialistEmail, onBack }: SpecialistProfileProps) {
  const { user } = useAuth();
  const [specialist, setSpecialist] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "courses" | "services">("about");

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
      const coursesResponse = await courseAPI.getAll({ creator: specialistEmail });
      const activeCourses = Array.isArray(coursesResponse?.data)
        ? coursesResponse.data.filter((c: any) => c.status === "published" || c.status === "active")
        : [];
      setCourses(activeCourses.slice(0, 6));

      // Fetch specialist's services
      const servicesResponse = await serviceAPI.getAll({ creator: specialistEmail });
      const activeServices = Array.isArray(servicesResponse?.data)
        ? servicesResponse.data.filter((s: any) => s.status === "active")
        : [];
      setServices(activeServices.slice(0, 6));
    } catch (error) {
      console.error("Failed to fetch specialist data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollCourse = async (courseId: string) => {
    if (!user?.email) return;
    try {
      const enrollmentData = {
        userId: user.email,
        courseId,
        enrolledAt: new Date(),
        status: "active",
      };
      await customerAPI.enrollCourse(enrollmentData);
      alert("✓ Successfully enrolled in course!");
    } catch (error) {
      console.error("Failed to enroll:", error);
      alert("Failed to enroll. Please try again.");
    }
  };

  const handleBookService = async (serviceId: string) => {
    if (!user?.email) return;
    try {
      const bookingData = {
        userId: user.email,
        serviceId,
        bookedAt: new Date(),
        status: "pending",
      };
      await customerAPI.bookService(bookingData);
      alert("✓ Service booked successfully!");
    } catch (error) {
      console.error("Failed to book service:", error);
      alert("Failed to book service. Please try again.");
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
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-4xl">
                  {specialist.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{specialist.name}</h1>
              <p className="text-lg text-purple-600 font-semibold mb-3">{specialist.specialization}</p>
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
      <div className="flex gap-4 mb-6 border-b">
        {["about", "courses", "services"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "about" && "About"}
            {tab === "courses" && `Courses (${courses.length})`}
            {tab === "services" && `Services (${services.length})`}
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
                <p className="text-2xl font-bold text-purple-600">{courses.length}</p>
                <p className="text-sm text-gray-600">Courses Offered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{services.length}</p>
                <p className="text-sm text-gray-600">Services Offered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{specialist.totalStudents || 0}</p>
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
                      <BookOpen className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                      <span className="line-clamp-2">{course.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-purple-600">₹{course.price}</p>
                        <p className="text-xs text-gray-600">{course.duration || "Self-paced"}</p>
                      </div>
                      <p className="text-sm text-gray-600">{course.enrollments || 0} enrolled</p>
                    </div>
                    <Button
                      onClick={() => handleEnrollCourse(course._id)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
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
              {services.map((service) => (
                <Card key={service._id}>
                  <CardHeader>
                    <CardTitle className="flex items-start gap-2">
                      <Briefcase className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                      <span className="line-clamp-2">{service.title}</span>
                    </CardTitle>
                    <CardDescription>{service.type}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-purple-600">₹{service.price}</p>
                        <p className="text-xs text-gray-600">{service.duration} min</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleBookService(service._id)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Book Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                No services available from this specialist
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { courseAPI } from "@/app/api/apiClient";
import { useAuth } from "@/app/context/AuthContext";
import { usePaymentContext } from "@/app/context/PaymentContext";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Play, Users, Star, ArrowRight } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  description: string;
  courseType: string;
  price: number;
  lessons?: Array<{ _id: string; title: string }>;
  specialistName?: string;
  status?: string;
  thumbnail?: string;
}

export function CoursesBrowse() {
  const { user } = useAuth();
  const { openPayment } = usePaymentContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseTypeFilter, setCourseTypeFilter] = useState("all");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    // Only fetch enrolled courses when user is available
    if (user?.id) {
      fetchEnrolledCourses();
    }
  }, [user?.id]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.browseCourses();
      const coursesData = response.data || [];
      setCourses(coursesData);
      setFilteredCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      if (!user?.id) {
        console.log('[CoursesBrowse] No user ID, skipping enrolled course fetch');
        return;
      }
      console.log('[CoursesBrowse] Fetching enrolled courses for user:', user.id);
      const myCoursesResponse = await courseAPI.getMyCourses(user.id);
      const enrolledIds = new Set<string>();
      if (Array.isArray(myCoursesResponse?.data)) {
        myCoursesResponse.data.forEach((enrollment: any) => {
          if (enrollment.courseId) {
            enrolledIds.add(enrollment.courseId);
          }
        });
        console.log('[CoursesBrowse] Enrolled courses:', Array.from(enrolledIds));
      }
      setEnrolledCourseIds(enrolledIds);
    } catch (error) {
      console.warn('[CoursesBrowse] Failed to fetch enrolled courses:', error);
      setEnrolledCourseIds(new Set()); // Set empty set on error
    }
  };

  useEffect(() => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (courseTypeFilter !== "all") {
      filtered = filtered.filter((course) => course.courseType === courseTypeFilter);
    }

    setFilteredCourses(filtered);
  }, [searchTerm, courseTypeFilter, courses]);

  const handleEnroll = async (courseId: string, courseType: string, course?: Course) => {
    try {
      console.log('[CoursesBrowse] handleEnroll called:', { courseId, courseType, courseName: course?.title });
      
      if (!user?.id) {
        alert('Please log in to enroll in a course');
        return;
      }
      
      setEnrolling(courseId);
      if (courseType === "self-paced") {
        // Check if course is FREE or PAID
        const courseData = course || courses.find(c => c._id === courseId);
        
        if (!courseData) {
          console.log('[CoursesBrowse] Course not found');
          setEnrolling(null);
          alert('Course not found');
          return;
        }

        console.log('[CoursesBrowse] Course data:', { title: courseData.title, price: courseData.price });
        
        if (courseData?.price && courseData.price > 0) {
          // Paid course - open payment modal
          console.log('[CoursesBrowse] Opening payment modal for paid course');
          openPayment({
            serviceId: courseId,
            serviceType: 'course',
            serviceName: courseData.title,
            amount: courseData.price * 100, // Convert to cents
            currency: 'usd',
            specialistId: '', // Would need to get from course data
            specialistName: courseData.specialistName || 'Specialist',
            onSuccess: async () => {
              try {
                console.log('[CoursesBrowse] Payment successful, enrolling...');
                // Enroll after payment succeeds
                await courseAPI.enrollSelfPaced(courseId, user?.id, user?.email);
                // Add to enrolled courses
                setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
                console.log('[CoursesBrowse] Enrollment complete after payment');
                alert("Payment successful! Enrolled successfully. Check My Learning to start.");
              } catch (error: any) {
                console.error('[CoursesBrowse] Enrollment error after payment:', error);
                alert(error.message || "Enrollment failed after payment");
              } finally {
                // Clear enrolling state after payment flow completes
                setEnrolling(null);
              }
            },
            onError: (error) => {
              console.error('[CoursesBrowse] Payment error:', error);
              alert(`Payment failed: ${error}`);
              // Clear enrolling state on payment error
              setEnrolling(null);
            },
          });
          // Don't return here - let the modal handle cleanup via callbacks
          return;
        } else {
          // Free course - enroll directly
          console.log('[CoursesBrowse] Enrolling in free course');
          await courseAPI.enrollSelfPaced(courseId, user?.id, user?.email);
          // Add to enrolled courses
          setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
          console.log('[CoursesBrowse] Free course enrollment complete');
          alert("Enrolled successfully! Check My Learning to start.");
          setEnrolling(null);
        }
      } else {
        console.log('[CoursesBrowse] Non self-paced course type:', courseType);
        setEnrolling(null);
        alert("Please select a cohort to enroll");
      }
    } catch (error: any) {
      console.error("[CoursesBrowse] Enrollment error:", error);
      alert(error.message || "Enrollment failed");
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Courses</h1>
          <p className="text-gray-600">Learn new skills from expert specialists</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex gap-4 flex-col sm:flex-row">
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={courseTypeFilter}
            onChange={(e) => setCourseTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="self-paced">Self-Paced</option>
            <option value="cohort">Cohort-Based</option>
          </select>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No courses found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course._id);
              return (
              <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Play className="w-12 h-12 text-white opacity-50" />
                  )}
                  <Badge className="absolute top-3 right-3 bg-white text-indigo-600">
                    {course.courseType === "self-paced" ? "Self-Paced" : "Cohort"}
                  </Badge>
                  {isEnrolled && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      ✓ Enrolled
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{course.lessons?.length || 0} lessons</span>
                    </div>
                  </div>

                  {/* Price and Button */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-gray-900">
                        {course.price === 0 ? "FREE" : `$${course.price}`}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleEnroll(course._id, course.courseType, course)}
                      disabled={enrolling === course._id || isEnrolled}
                      className={`w-full ${isEnrolled ? "bg-gray-300 hover:bg-gray-300 text-gray-600 cursor-not-allowed" : ""}`}
                    >
                      {enrolling === course._id ? "Enrolling..." : isEnrolled ? "Already Enrolled" : "Enroll Now"}
                      {enrolling !== course._id && !isEnrolled && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

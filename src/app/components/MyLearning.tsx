import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { courseAPI } from "@/app/api/apiClient";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Award, ArrowRight, BookOpen, Video } from "lucide-react";

interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  title: string;
  thumbnail?: string | null;
  courseType?: string;
  lessonsTotal: number;
  lessonsCompleted: number;
  percentComplete: number;
  completed: boolean;
  certificate?: {
    issued: boolean;
    certificateId: string;
  };
}

export function MyLearning() {
  const { user, setCurrentPage } = useAuth();
  const [allEnrollments, setAllEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"self-paced" | "cohort">("self-paced");
  const [viewingEnrollmentId, setViewingEnrollmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive self-paced and cohort lists from the single enrollment list
  const selfPacedCourses = allEnrollments.filter(
    (c) => !c.courseType || c.courseType === "self-paced"
  );
  const cohortCourses = allEnrollments.filter(
    (c) => c.courseType === "cohort" || c.courseType === "cohort-based"
  );

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await courseAPI.getMySelfPacedCourses(user?.id).catch((err) => {
        console.error("Error fetching courses:", err);
        return { data: [] };
      });
      const coursesData = Array.isArray(result) ? result : (result?.data || []);
      setAllEnrollments(coursesData);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  const allCourses = allEnrollments.length;

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Learning</h1>
              <p className="text-gray-600">
                You have {allCourses} course{allCourses !== 1 ? "s" : ""} enrolled
              </p>
            </div>
            <Button 
              onClick={fetchCourses}
              disabled={loading}
              variant="outline"
            >
              Refresh
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
              <Button 
                onClick={fetchCourses}
                size="sm"
                className="mt-2 bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {allCourses === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h2>
            <p className="text-gray-600 mb-6">Start learning by browsing our course catalog</p>
            <Button 
              onClick={() => setCurrentPage("browse-courses")}
              className="bg-gray-900 hover:bg-gray-800"
            >
              Browse Courses
            </Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 flex items-end justify-between">
              <div className="flex gap-8">
                <button
                  onClick={() => setSelectedTab("self-paced")}
                  className={`py-3 px-1 border-b-2 font-semibold transition ${
                    selectedTab === "self-paced"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Self-Paced ({selfPacedCourses.length})
                </button>
                <button
                  onClick={() => setSelectedTab("cohort")}
                  className={`py-3 px-1 border-b-2 font-semibold transition ${
                    selectedTab === "cohort"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Cohort-Based ({cohortCourses.length})
                </button>
              </div>
              <Button 
                onClick={() => setCurrentPage("browse-courses")}
                variant="outline"
                size="sm"
              >
                + Browse More Courses
              </Button>
            </div>

            {/* Self-Paced Courses */}
            {selectedTab === "self-paced" && (
              <div className="space-y-4">
                {selfPacedCourses.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center text-gray-600">
                    No self-paced courses yet.
                  </div>
                ) : (
                  selfPacedCourses.map((course) => (
                    <Card 
                      key={course.enrollmentId} 
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setViewingEnrollmentId(course.enrollmentId);
                        setCurrentPage(`learn-course-${course.enrollmentId}`);
                      }}
                    >
                      <div className="flex gap-6 p-6">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-36 h-28 rounded-xl overflow-hidden bg-gray-100">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {course.lessonsCompleted} of {course.lessonsTotal} lessons completed
                              </p>
                            </div>
                            <div className="text-right">
                              {course.completed && course.certificate?.issued && (
                                <Badge className="bg-green-100 text-green-700 mb-2">
                                  <Award className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {!course.completed && (
                                <div className="text-2xl font-bold text-gray-900">
                                  {course.percentComplete}%
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gray-900 h-2 rounded-full transition-all"
                                style={{ width: `${course.percentComplete}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Actions */}
                          <Button 
                            className="gap-2" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingEnrollmentId(course.enrollmentId);
                              setCurrentPage(`learn-course-${course.enrollmentId}`);
                            }}
                          >
                            <span>Continue Learning</span>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Cohort Courses */}
            {selectedTab === "cohort" && (
              <div className="space-y-4">
                {cohortCourses.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center text-gray-600">
                    No cohort-based courses yet.
                  </div>
                ) : (
                  cohortCourses.map((course) => (
                    <Card 
                      key={course.enrollmentId} 
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setViewingEnrollmentId(course.enrollmentId);
                        setCurrentPage(`learn-course-${course.enrollmentId}`);
                      }}
                    >
                      <div className="flex gap-6 p-6">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-36 h-28 rounded-xl overflow-hidden bg-gray-100">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                              <Video className="w-8 h-8 text-emerald-500" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {course.lessonsCompleted} of {course.lessonsTotal} lessons completed
                              </p>
                            </div>
                            <div className="text-right">
                              {course.completed && course.certificate?.issued && (
                                <Badge className="bg-green-100 text-green-700 mb-2">
                                  <Award className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {!course.completed && (
                                <div className="text-2xl font-bold text-gray-900">
                                  {course.percentComplete}%
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gray-900 h-2 rounded-full transition-all"
                                style={{ width: `${course.percentComplete}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Actions */}
                          <Button 
                            className="gap-2" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingEnrollmentId(course.enrollmentId);
                              setCurrentPage(`learn-course-${course.enrollmentId}`);
                            }}
                          >
                            <span>Continue Learning</span>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

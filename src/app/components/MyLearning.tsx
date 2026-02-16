import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { courseAPI } from "@/app/api/apiClient";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Play, Users, Award, ArrowRight } from "lucide-react";

interface SelfPacedCourse {
  enrollmentId: string;
  courseId: string;
  title: string;
  lessonsTotal: number;
  lessonsCompleted: number;
  percentComplete: number;
  completed: boolean;
  certificate?: {
    issued: boolean;
    certificateId: string;
  };
}

interface CohortCourse {
  enrollmentId: string;
  cohortId: string;
  batchName: string;
  sessionsTotal: number;
  sessionsAttended: number;
  percentComplete: number;
  completed: boolean;
  certificate?: {
    issued: boolean;
    certificateId: string;
  };
}

export function MyLearning() {
  const { setCurrentPage } = useAuth();
  const [selfPacedCourses, setSelfPacedCourses] = useState<SelfPacedCourse[]>([]);
  const [cohortCourses, setCohortCourses] = useState<CohortCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"self-paced" | "cohort">("self-paced");
  const [viewingEnrollmentId, setViewingEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [selfPaced, cohorts] = await Promise.all([
        courseAPI.getMySelfPacedCourses().catch(() => ({ data: [] })),
        courseAPI.getMyCohorts().catch(() => ({ data: [] })),
      ]);
      setSelfPacedCourses(selfPaced.data || []);
      setCohortCourses(cohorts.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  const allCourses = selfPacedCourses.length + cohortCourses.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Learning</h1>
          <p className="text-gray-600">
            You have {allCourses} course{allCourses !== 1 ? "s" : ""} enrolled
          </p>
        </div>

        {allCourses === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h2>
            <p className="text-gray-600 mb-6">Start learning by browsing our course catalog</p>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Browse Courses</Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex gap-8">
                <button
                  onClick={() => setSelectedTab("self-paced")}
                  className={`py-3 px-1 border-b-2 font-semibold transition ${
                    selectedTab === "self-paced"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Self-Paced ({selfPacedCourses.length})
                </button>
                <button
                  onClick={() => setSelectedTab("cohort")}
                  className={`py-3 px-1 border-b-2 font-semibold transition ${
                    selectedTab === "cohort"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Cohort-Based ({cohortCourses.length})
                </button>
              </div>
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
                    <Card key={course.enrollmentId} className="overflow-hidden">
                      <div className="flex gap-6 p-6">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Play className="w-8 h-8 text-white opacity-50" />
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
                                <div className="text-2xl font-bold text-indigo-600">
                                  {course.percentComplete}%
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${course.percentComplete}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Actions */}
                          <Button 
                            className="gap-2" 
                            variant="outline"
                            onClick={() => {
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
                    <Card key={course.enrollmentId} className="overflow-hidden">
                      <div className="flex gap-6 p-6">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                          <Users className="w-8 h-8 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{course.batchName}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {course.sessionsAttended} of {course.sessionsTotal} sessions attended
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
                                <div className="text-2xl font-bold text-emerald-600">
                                  {course.percentComplete}%
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-emerald-600 h-2 rounded-full transition-all"
                                style={{ width: `${course.percentComplete}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Actions */}
                          <Button className="gap-2" variant="outline">
                            <span>View Sessions</span>
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

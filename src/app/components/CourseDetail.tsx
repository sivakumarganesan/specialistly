import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { courseAPI } from "@/app/api/apiClient";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ChevronLeft, Play, CheckCircle, Award, AlertCircle } from "lucide-react";

interface Lesson {
  _id: string;
  title: string;
  videoUrl?: string;
  order: number;
  completed: boolean;
  files?: Array<{
    _id?: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    uploadedAt?: string;
  }>;
}

interface EnrollmentDetails {
  enrollmentId: string;
  courseTitle: string;
  courseDescription?: string;
  lessons: Lesson[];
  percentComplete: number;
  completed: boolean;
  certificate?: {
    issued: boolean;
    certificateId: string;
  };
}

interface CourseDetailProps {
  enrollmentId: string;
}

export function CourseDetail({ enrollmentId }: CourseDetailProps) {
  const { setCurrentPage } = useAuth();
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollmentDetails();
  }, [enrollmentId]);

  useEffect(() => {
    // Reset video error when changing lessons
    setVideoError(null);
  }, [currentLessonId]);

  const getFileIcon = (fileType: string) => {
    const icons: { [key: string]: string } = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '🎯',
      'pptx': '🎯',
      'txt': '📄',
      'zip': '📦',
      'other': '📎',
    };
    return icons[fileType] || '📎';
  };

  const fetchEnrollmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseAPI.getSelfPacedEnrollmentDetails(enrollmentId);
      const data = response.data || response;
      setEnrollment(data);
      
      // Set first uncompleted lesson as current, or first lesson if all complete
      const lessons = data.lessons || [];
      const uncompletedLesson = lessons.find(l => !l.completed);
      setCurrentLessonId(uncompletedLesson?._id || lessons[0]?._id || null);
    } catch (err) {
      console.error("Error fetching enrollment details:", err);
      setError("Failed to load course details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (lessonId: string) => {
    if (!enrollment) return;

    try {
      setCompleting(true);
      const response = await courseAPI.markLessonComplete(enrollmentId, lessonId);
      const data = response.data || response;

      // Update enrollment state
      setEnrollment(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          percentComplete: data.percentComplete || prev.percentComplete,
          completed: data.completed || false,
          certificate: data.certificate || prev.certificate,
          lessons: prev.lessons.map(lesson =>
            lesson._id === lessonId ? { ...lesson, completed: true } : lesson
          ),
        };
      });

      // Move to next lesson if available
      const currentIndex = enrollment.lessons.findIndex(l => l._id === lessonId);
      if (currentIndex !== -1 && currentIndex < enrollment.lessons.length - 1) {
        setCurrentLessonId(enrollment.lessons[currentIndex + 1]._id);
      }
    } catch (err) {
      console.error("Error marking lesson complete:", err);
      setError("Failed to mark lesson complete. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            onClick={() => setCurrentPage("my-learning")}
            variant="outline"
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">{error || "Course not found"}</p>
            <Button 
              onClick={() => setCurrentPage("my-learning")}
              className="mt-4"
            >
              Return to My Learning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentLesson = enrollment.lessons.find(l => l._id === currentLessonId);
  const completedLessons = enrollment.lessons.filter(l => l.completed).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => setCurrentPage("my-learning")}
            variant="outline"
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to My Learning
          </Button>
          
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {enrollment.courseTitle}
                </h1>
                {enrollment.courseDescription && (
                  <p className="text-gray-600 mb-4">{enrollment.courseDescription}</p>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progress: {completedLessons}/{enrollment.lessons.length} lessons
                      </span>
                      <span className="text-sm font-semibold text-indigo-600">
                        {enrollment.percentComplete}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.percentComplete}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              {enrollment.completed && enrollment.certificate?.issued && (
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-700">
                    <Award className="w-4 h-4 mr-2" />
                    Completed
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video/Content Area */}
          <div className="lg:col-span-2">
            {currentLesson ? (
              <Card>
                <div className="bg-black rounded-t-lg aspect-video flex items-center justify-center relative">
                  {currentLesson.videoUrl ? (
                    <>
                      <iframe
                        width="100%"
                        height="100%"
                        src={currentLesson.videoUrl}
                        title={currentLesson.title}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        className="rounded-t-lg"
                        onError={() => {
                          setVideoError("Unable to load video. The video provider may not allow embedding from this site.");
                        }}
                      ></iframe>
                      {videoError && (
                        <div className="absolute inset-0 bg-black bg-opacity-95 rounded-t-lg flex flex-col items-center justify-center text-white p-6">
                          <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                          <p className="text-center mb-4 font-semibold">{videoError}</p>
                          <p className="text-sm text-gray-300 max-w-sm text-center">
                            Videos typically fail to load when the URL isn't in the proper embed format. 
                            For YouTube, use: https://www.youtube.com/embed/VIDEO_ID
                            <br/>
                            For Google Drive, use: https://drive.google.com/file/d/FILE_ID/preview
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white">
                      <Play className="w-16 h-16 opacity-50 mb-4" />
                      <p className="text-gray-400">Video not available</p>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {currentLesson.title}
                  </h2>
                  <div className="flex gap-3 mb-6">
                    {!currentLesson.completed && (
                      <Button
                        onClick={() => handleMarkComplete(currentLesson._id)}
                        disabled={completing}
                        className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {completing ? "Marking complete..." : "Mark as Complete"}
                      </Button>
                    )}
                    {currentLesson.completed && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completed
                      </Badge>
                    )}
                  </div>

                  {/* Display Lesson Files if any */}
                  {currentLesson.files && currentLesson.files.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        📎 Lesson Materials
                      </h3>
                      <div className="space-y-2">
                        {currentLesson.files.map((file: any, index: number) => (
                          <a
                            key={index}
                            href={file.fileUrl}
                            download={file.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-white rounded border border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-lg flex-shrink-0">
                                {getFileIcon(file.fileType)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.fileName}
                                </p>
                                {file.fileSize && (
                                  <p className="text-xs text-gray-500">
                                    {(file.fileSize / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-blue-600 ml-2 flex-shrink-0">↓</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center text-gray-500">
                <p>No lessons available in this course.</p>
              </Card>
            )}
          </div>

          {/* Lessons Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-4 border-b">
                <h3 className="font-bold text-gray-900">
                  Lessons ({completedLessons}/{enrollment.lessons.length})
                </h3>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {enrollment.lessons.map((lesson, index) => (
                  <button
                    key={lesson._id}
                    onClick={() => setCurrentLessonId(lesson._id)}
                    className={`w-full p-4 text-left transition ${
                      currentLessonId === lesson._id
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {lesson.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {index + 1}. {lesson.title}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Certificate Section */}
        {enrollment.completed && enrollment.certificate?.issued && (
          <Card className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="p-6 text-center">
              <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Congratulations!
              </h3>
              <p className="text-gray-600 mb-4">
                You've completed this course and earned a certificate!
              </p>
              <Button 
                onClick={() => setCurrentPage("my-learning")}
                className="bg-green-600 hover:bg-green-700"
              >
                View Certificates
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

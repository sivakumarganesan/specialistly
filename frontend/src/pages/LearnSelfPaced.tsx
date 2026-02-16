import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, Clock, Award } from 'lucide-react';
import * as coursesAPI from '../api/coursesAPI';

interface Lesson {
  _id: string;
  title: string;
  videoUrl: string;
  order: number;
  completed: boolean;
}

interface EnrollmentDetails {
  enrollmentId: string;
  courseTitle: string;
  lessons: Lesson[];
  percentComplete: number;
  completed: boolean;
  certificate?: {
    issued: boolean;
    certificateId: string;
    downloadUrl: string;
  };
}

interface LearnSelfPacedProps {
  enrollmentId: string;
}

const LearnSelfPaced: React.FC<LearnSelfPacedProps> = ({ enrollmentId }) => {
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getSelfPacedEnrollmentDetails(enrollmentId);
        setEnrollment(response.data.data);
        // Set first lesson as current
        if (response.data.data.lessons.length > 0) {
          setCurrentLessonId(response.data.data.lessons[0]._id);
        }
      } catch (error) {
        console.error('Error fetching enrollment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollment();
  }, [enrollmentId]);

  const handleMarkComplete = async (lessonId: string) => {
    try {
      setCompleting(true);
      const response = await coursesAPI.markLessonComplete(enrollmentId, lessonId);

      // Update enrollment state
      setEnrollment((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          percentComplete: response.data.percentComplete,
          completed: response.data.completed,
          certificate: response.data.certificate,
          lessons: prev.lessons.map((lesson) =>
            lesson._id === lessonId ? { ...lesson, completed: true } : lesson
          ),
        };
      });

      // Move to next lesson if available
      const currentIndex = enrollment?.lessons.findIndex((l) => l._id === lessonId) ?? -1;
      if (currentIndex !== -1 && currentIndex < (enrollment?.lessons.length ?? 0) - 1) {
        setCurrentLessonId(enrollment?.lessons[currentIndex + 1]._id || null);
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      alert('Failed to mark lesson complete');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-lg">
        <p>Failed to load course. Please try again later.</p>
      </div>
    );
  }

  const currentLesson = enrollment.lessons.find((l) => l._id === currentLessonId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{enrollment.courseTitle}</h1>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-gray-900">{enrollment.percentComplete}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${enrollment.percentComplete}%` }}
                ></div>
              </div>
            </div>
            {enrollment.completed && (
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <CheckCircle className="w-5 h-5" />
                <span>Completed!</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            {currentLesson ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Video */}
                <div className="bg-black aspect-video flex items-center justify-center">
                  {currentLesson.videoUrl ? (
                    <iframe
                      src={currentLesson.videoUrl}
                      title={currentLesson.title}
                      className="w-full h-full"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="text-white text-center">
                      <p className="text-lg">Video not available</p>
                    </div>
                  )}
                </div>

                {/* Lesson Info */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {currentLesson.title}
                  </h2>

                  {/* Mark Complete Button */}
                  {!currentLesson.completed && (
                    <button
                      onClick={() => handleMarkComplete(currentLesson._id)}
                      disabled={completing}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition mb-4"
                    >
                      {completing ? 'Marking complete...' : 'Mark Lesson Complete'}
                    </button>
                  )}

                  {currentLesson.completed && (
                    <div className="flex items-center gap-2 text-green-600 font-semibold p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span>Lesson completed</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No lesson selected</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Course Stats */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Course Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Lessons Completed
                  </span>
                  <span className="font-semibold">
                    {enrollment.lessons.filter((l) => l.completed).length}/{enrollment.lessons.length}
                  </span>
                </div>
                {enrollment.completed && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 flex items-center gap-2 font-semibold">
                      <Award className="w-4 h-4" />
                      Certificate Ready
                    </span>
                    {enrollment.certificate?.issued && (
                      <a
                        href={enrollment.certificate.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 font-semibold"
                      >
                        Download
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lessons List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900">Lessons</h3>
              </div>
              <div className="divide-y">
                {enrollment.lessons.map((lesson, index) => (
                  <button
                    key={lesson._id}
                    onClick={() => setCurrentLessonId(lesson._id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                      currentLessonId === lesson._id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {lesson.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-400">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            lesson.completed ? 'text-gray-600' : 'text-gray-900'
                          }`}
                        >
                          {lesson.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Lesson {index + 1} of {enrollment.lessons.length}
                        </p>
                      </div>
                      {currentLessonId === lesson._id && (
                        <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnSelfPaced;

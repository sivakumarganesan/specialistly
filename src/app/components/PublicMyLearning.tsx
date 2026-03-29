import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Award, ChevronRight, Loader } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "/api";

interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  title: string;
  thumbnail?: string;
  courseType: string;
  lessonsTotal: number;
  lessonsCompleted: number;
  percentComplete: number;
  completed: boolean;
  certificate?: { issued: boolean; certificateId?: string } | null;
}

interface PublicMyLearningProps {
  specialistEmail: string;
  onOpenCourse: (enrollmentId: string) => void;
  brandColor?: string;
}

export const PublicMyLearning: React.FC<PublicMyLearningProps> = ({
  specialistEmail,
  onOpenCourse,
  brandColor = '#1f2937',
}) => {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, [specialistEmail]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setCourses([]);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/courses/enrollments/self-paced/my-courses?specialistEmail=${encodeURIComponent(specialistEmail)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        setCourses([]);
        return;
      }

      const data = await res.json();
      setCourses(data.data || []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Courses Yet</h2>
        <p className="text-gray-500">You haven't enrolled in any courses from this specialist yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">My Learning</h2>
      <p className="text-gray-500 mb-8">Continue where you left off</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.enrollmentId}
            onClick={() => onOpenCourse(course.enrollmentId)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          >
            {/* Thumbnail */}
            <div className="relative h-40 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <Play className="w-10 h-10 text-white opacity-40" />
              )}
              {course.completed && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <Award className="w-3 h-3" />
                  Completed
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700">
                {course.title}
              </h3>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{course.lessonsCompleted} / {course.lessonsTotal} lessons</span>
                  <span>{course.percentComplete}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${course.percentComplete}%`, backgroundColor: brandColor }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 capitalize">{course.courseType.replace('-', ' ')}</span>
                <span className="text-sm font-medium flex items-center gap-1" style={{ color: brandColor }}>
                  {course.completed ? 'Review' : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicMyLearning;

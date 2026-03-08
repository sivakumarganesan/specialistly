import React, { useState, useEffect } from 'react';
import { Heart, Play, Users } from 'lucide-react';
import * as coursesAPI from '../api/coursesAPI';

interface Course {
  _id: string;
  title: string;
  description: string;
  courseType: string;
  price: number;
  lessons: Array<{ _id: string; title: string }>;
  specialistName: string;
  thumbnail?: string;
}

const CoursesBrowse: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseType, setSelectedCourseType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.browseCourses();
        setCourses(response.data.data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesType = selectedCourseType === 'all' || course.courseType === selectedCourseType;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleEnroll = async (courseId: string, courseType: string) => {
    try {
      setEnrolling(courseId);
      if (courseType === 'self-paced') {
        await coursesAPI.enrollSelfPaced(courseId);
      } else {
        // For cohort, need to select a cohort first
        // This would open a modal in a real implementation
        await coursesAPI.getCourseAvailableCohorts(courseId);
      }
      alert('Enrolled successfully! You can now access the course from My Courses.');
    } catch (error: any) {
      console.error('Enrollment error:', error);
      alert(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Courses</h1>
          <p className="text-gray-600">Learn new skills from expert specialists</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={selectedCourseType}
              onChange={(e) => setSelectedCourseType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Course Types</option>
              <option value="self-paced">Self-Paced</option>
              <option value="cohort">Cohort-Based</option>
            </select>
            <div className="text-right pt-2 text-sm text-gray-600">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No courses found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Play className="w-12 h-12 text-white opacity-50" />
                  )}
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold text-indigo-600">
                    {course.courseType === 'self-paced' ? '🎯 Self-Paced' : '👥 Cohort'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{course.lessons.length} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.specialistName}</span>
                    </div>
                  </div>

                  {/* Price and Button */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-gray-900">
                        {course.price === 0 ? 'FREE' : `$${course.price}`}
                      </span>
                      <button className="p-2 hover:bg-gray-100 rounded-full">
                        <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleEnroll(course._id, course.courseType)}
                      disabled={enrolling === course._id}
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition"
                    >
                      {enrolling === course._id ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesBrowse;

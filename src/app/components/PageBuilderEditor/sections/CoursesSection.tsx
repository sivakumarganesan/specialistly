import React, { useState, useEffect } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Plus, Trash2, LayoutGrid, List, ShoppingCart, Calendar, Clock, Video, Users, Share2 } from 'lucide-react';
import { PublicCourseCheckout } from '@/app/components/PublicCourseCheckout';
import { ShareCourseModal } from './ShareCourseModal';

import { courseAPI } from '@/app/api/apiClient';
import { useAuth } from '@/app/context/AuthContext';

const tzAbbrMap: Record<string, string> = {
  'Asia/Kolkata': 'IST', 'Asia/Dubai': 'GST', 'Asia/Singapore': 'SGT',
  'Asia/Tokyo': 'JST', 'Asia/Shanghai': 'CST', 'Europe/London': 'GMT',
  'Europe/Paris': 'CET', 'Europe/Berlin': 'CET', 'America/New_York': 'EST',
  'America/Chicago': 'CST', 'America/Los_Angeles': 'PST', 'America/Toronto': 'EST',
  'America/Sao_Paulo': 'BRT', 'Australia/Sydney': 'AEST', 'Pacific/Auckland': 'NZST', 'UTC': 'UTC',
};
const getTzAbbr = (tz?: string) => tzAbbrMap[tz || ''] || tz?.replace(/_/g, ' ') || '';

// Calculate enrollment close time based on course start time and settings
const calculateEnrollmentCloseTime = (course: any): Date | null => {
  if (!course.startDate || !course.startTime) return null;
  
  try {
    // Parse start time (e.g., "7:30 PM" or "19:30")
    const timeMatch = course.startTime.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!timeMatch) return null;
    
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3]?.toUpperCase();
    
    // Convert to 24-hour format if AM/PM provided
    if (period) {
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    }
    
    // Create date in the course's timezone
    // First create a UTC date from the ISO string
    const startDate = new Date(course.startDate);
    
    // Get timezone offset for the course's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: course.timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(startDate);
    const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '1970', 10);
    const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '01', 10) - 1;
    const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '01', 10);
    
    // Calculate the difference between UTC and the course's timezone
    const utcDate = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const tzDate = new Date(tzYear, tzMonth, tzDay);
    const tzOffset = utcDate.getTime() - tzDate.getTime();
    
    // Create start datetime in the course's timezone
    const startDatetimeUTC = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), hours, minutes, 0);
    const startDatetimeInTz = new Date(startDatetimeUTC.getTime() + tzOffset);
    
    // Get enrollment close minutes
    let closeMinutes = 1;
    if (course.enrollmentClosesAt) {
      if (typeof course.enrollmentClosesAt === 'number') {
        closeMinutes = course.enrollmentClosesAt;
      } else if (typeof course.enrollmentClosesAt === 'string') {
        const match = course.enrollmentClosesAt.match(/(\d+)/);
        if (match) closeMinutes = parseInt(match[1], 10);
      }
    }
    
    // Subtract close minutes from start time
    const closeTime = new Date(startDatetimeInTz.getTime() - closeMinutes * 60000);
    return closeTime;
  } catch (e) {
    return null;
  }
};

interface Course {
  id: string;
  title: string;
  description: string;
  price?: string;
  duration?: string;
  level?: string;
  thumbnail?: string;
}

interface CoursesSectionEditorProps {
  section: PageSection;
  onChange: (updates: Partial<PageSection>) => void;
}

export const CoursesSectionEditor: React.FC<CoursesSectionEditorProps> = ({
  section,
  onChange,
}) => {
  const courses = (section.content?.courses || []) as Course[];
  const layout = section.content?.layout || 'grid'; // 'grid', 'list', 'carousel'

  const handleAddCourse = () => {
    const newCourse: Course = {
      id: Date.now().toString(),
      title: 'New Course',
      description: 'Course description',
      price: '$99',
      duration: '4 weeks',
      level: 'Beginner',
    };

    onChange({
      content: {
        ...section.content,
        courses: [...courses, newCourse],
      },
    });
  };

  const handleUpdateCourse = (courseId: string, updates: Partial<Course>) => {
    const updatedCourses = courses.map((course) =>
      course.id === courseId ? { ...course, ...updates } : course
    );

    onChange({
      content: {
        ...section.content,
        courses: updatedCourses,
      },
    });
  };

  const handleDeleteCourse = (courseId: string) => {
    const updatedCourses = courses.filter((course) => course.id !== courseId);

    onChange({
      content: {
        ...section.content,
        courses: updatedCourses,
      },
    });
  };

  const handleLayoutChange = (newLayout: string) => {
    onChange({
      content: {
        ...section.content,
        layout: newLayout,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-bold mb-4">Section Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="e.g., Our Courses"
              value={section.content?.title || ''}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    title: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Section description"
              value={section.content?.description || ''}
              onChange={(e) =>
                onChange({
                  content: {
                    ...section.content,
                    description: e.target.value,
                  },
                })
              }
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Layout</label>
            <div className="flex gap-2">
              <Button
                variant={layout === 'grid' ? 'default' : 'outline'}
                onClick={() => handleLayoutChange('grid')}
                className="flex-1 gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Grid
              </Button>
              <Button
                variant={layout === 'list' ? 'default' : 'outline'}
                onClick={() => handleLayoutChange('list')}
                className="flex-1 gap-2"
              >
                <List className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={layout === 'carousel' ? 'default' : 'outline'}
                onClick={() => handleLayoutChange('carousel')}
                className="flex-1"
              >
                Carousel
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Courses</h3>
          <Button onClick={handleAddCourse} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Course
          </Button>
        </div>

        <div className="space-y-4">
          {courses.map((course, index) => (
            <Card key={course.id} className="p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Course {index + 1}
                </span>
                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Title</label>
                  <Input
                    placeholder="Course title"
                    value={course.title}
                    onChange={(e) =>
                      handleUpdateCourse(course.id, { title: e.target.value })
                    }
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Description
                  </label>
                  <Textarea
                    placeholder="Course description"
                    value={course.description}
                    onChange={(e) =>
                      handleUpdateCourse(course.id, {
                        description: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Price</label>
                    <Input
                      placeholder="$99"
                      value={course.price || ''}
                      onChange={(e) =>
                        handleUpdateCourse(course.id, { price: e.target.value })
                      }
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Duration</label>
                    <Input
                      placeholder="4 weeks"
                      value={course.duration || ''}
                      onChange={(e) =>
                        handleUpdateCourse(course.id, { duration: e.target.value })
                      }
                      size="sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Level</label>
                  <Input
                    placeholder="Beginner, Intermediate, Advanced"
                    value={course.level || ''}
                    onChange={(e) =>
                      handleUpdateCourse(course.id, { level: e.target.value })
                    }
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Thumbnail URL</label>
                  <Input
                    placeholder="https://example.com/thumbnail.jpg"
                    value={course.thumbnail || ''}
                    onChange={(e) =>
                      handleUpdateCourse(course.id, { thumbnail: e.target.value })
                    }
                    size="sm"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Preview Component

export const CoursesSectionPreview: React.FC<{ section: PageSection }> = ({ section }) => {
  const { user } = useAuth();
  const [fetchedCourses, setFetchedCourses] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [checkoutCourse, setCheckoutCourse] = React.useState<any | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = React.useState<Set<string>>(new Set());
  const [shareModalCourse, setShareModalCourse] = React.useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const courses = (section.content?.courses || []) as Course[];
  const layout = section.content?.layout || 'grid';
  const backendCourses = section.content?.fetchedCourses || [];

  const handleOpenShareModal = (course: any) => {
    setShareModalCourse(course);
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setShareModalCourse(null);
  };

  // Fetch specialist's courses from API (only in editor, when logged in)
  useEffect(() => {
    if (backendCourses.length > 0) {
      setIsLoading(false);
      return;
    }
    const fetchCourses = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          setIsLoading(false);
          return;
        }
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const specialistEmail = user.email || '';
        const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
        const response = await fetch(`${apiUrl}/courses/my-courses?specialistEmail=${encodeURIComponent(specialistEmail)}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setFetchedCourses(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [backendCourses.length]);

  // Fetch enrolled course IDs for the logged-in customer
  useEffect(() => {
    const fetchEnrolled = async () => {
      try {
        if (!user?.id) {
          setEnrolledCourseIds(new Set());
          return;
        }
        const res = await courseAPI.getMySelfPacedCourses(user.id);
        if (Array.isArray(res?.data)) {
          const ids = new Set(res.data.map((enr: any) => enr.courseId || enr._id));
          setEnrolledCourseIds(ids);
        } else {
          setEnrolledCourseIds(new Set());
        }
      } catch (err) {
        setEnrolledCourseIds(new Set());
      }
    };
    fetchEnrolled();
  }, [user?.id]);

  // Priority: manual courses > backend-enriched courses > fetched courses
  let displayCourses = courses.length > 0 ? courses : backendCourses.length > 0 ? backendCourses : fetchedCourses;
  // Sort: paid courses first, then by earliest start date (if present)
  displayCourses = [...displayCourses].sort((a, b) => {
    // Paid courses first
    const priceA = Number(a.price || a.coursePrice || 0);
    const priceB = Number(b.price || b.coursePrice || 0);
    if ((priceA > 0 && priceB === 0)) return -1;
    if ((priceA === 0 && priceB > 0)) return 1;
    // If both paid or both free, sort by earliest start date (if available)
    const startA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
    const startB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
    return startA - startB;
  });
  const gridClasses =
    layout === 'grid'
      ? 'grid grid-cols-3 gap-6'
      : layout === 'list'
        ? 'space-y-4'
        : 'flex gap-6 overflow-x-auto pb-4';

  return (
    <div
      className="py-16 px-4"
      style={{
        backgroundColor: section.styling?.backgroundColor || '#f9fafb',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {section.content?.title && (
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: section.content?.titleColor || undefined }}>{section.content.title}</h2>
        )}
        {section.content?.description && (
          <p className="mb-12 text-lg" style={{ color: section.content?.descriptionColor || '#4b5563' }}>
            {section.content.description}
          </p>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading courses...</p>
          </div>
        )}

        {!isLoading && displayCourses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No courses to display yet. Add courses in the properties panel.</p>
          </div>
        )}

        {!isLoading && displayCourses.length > 0 && (
          <div className={gridClasses}>
            {displayCourses.map((course: any) => {
              const courseId = course._id || course.id;
              const isEnrolled = enrolledCourseIds.has(courseId);
              
              // Determine if course enrollment is closed
              // For cohort courses: check if enrollment close time has passed
              // For self-paced courses: enrollment is always open unless explicitly marked as draft
              let isEnrollmentClosed = false;
              
              if (course.courseType === 'cohort' || course.courseType === 'cohort-based') {
                // Cohort-based courses: check enrollment close time based on start date
                if (course.startDate) {
                  const closeTime = calculateEnrollmentCloseTime(course);
                  isEnrollmentClosed = closeTime ? new Date() >= closeTime : new Date(course.startDate) < new Date();
                }
              } else if (course.courseType === 'self-paced') {
                // Self-paced courses: only closed if explicitly marked as draft
                // If status is missing (legacy data), default to open (not closed)
                isEnrollmentClosed = course.status === 'draft';
              }
              
              return (
                <div
                  key={courseId}
                  className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${layout === 'list' ? 'flex gap-4' : ''}`}
                >
                  <div
                    className={`overflow-hidden ${layout === 'list' ? 'w-32 h-32' : 'w-full'}`}
                  >
                    {(course.thumbnail || course.courseImage) ? (
                      <img
                        src={course.thumbnail || course.courseImage}
                        alt={course.title || course.name || 'Course'}
                        className={`w-full ${layout === 'list' ? 'h-full object-cover' : ''}`}
                      />
                    ) : (
                      <div className={`bg-gradient-to-br from-blue-400 to-gray-900 ${layout === 'list' ? 'w-full h-full' : 'w-full h-48'} flex items-center justify-center text-white/80`}>
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                      </div>
                    )}
                  </div>
                  <div className={`p-4 ${layout === 'list' ? 'flex-1' : ''}`}>
                    <h3 className="font-bold text-lg mb-2">{course.title || course.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{course.description || course.courseDescription}</p>
                    <div className="flex flex-wrap gap-2 mb-3 text-xs">
                      {course.level && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {course.level}
                        </span>
                      )}
                      {course.duration && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {course.duration}
                        </span>
                      )}
                      {(course.courseType === 'cohort' || course.courseType === 'cohort-based') && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-semibold">
                          Live Course
                        </span>
                      )}
                    </div>

                    {/* Cohort course details */}
                    {(course.courseType === 'cohort' || course.courseType === 'cohort-based') && (course.startDate || course.schedule || course.meetingPlatform) && (
                      <div className="mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1.5">
                        {course.startDate && (
                          <div className="flex items-center gap-1.5 text-gray-900">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>Starts: {new Date(course.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: course.timezone || 'UTC' })}{course.startTime ? ` at ${course.startTime}` : ''}{course.endTime ? ` to ${course.endTime}` : ''}{course.timezone ? ` ${getTzAbbr(course.timezone)}` : ''}</span>
                            {course.endDate && (
                              <span> — Ends: {new Date(course.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: course.timezone || 'UTC' })}</span>
                            )}
                          </div>
                        )}
                        {course.schedule && (
                          <div className="flex items-center gap-1.5 text-gray-900">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{course.schedule}</span>
                          </div>
                        )}
                        {(course.meetingPlatform || course.zoomLink) && (
                          <div className="flex items-center gap-1.5 text-gray-900">
                            <Video className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>Online</span>
                          </div>
                        )}
                        {course.cohortSize && (
                          <div className="flex items-center gap-1.5 text-gray-900">
                            <Users className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>Max {course.cohortSize} students</span>
                          </div>
                        )}
                      </div>
                    )}

                    {Number(course.price || course.coursePrice || 0) > 0 ? (
                      <div className="font-bold text-lg text-gray-900">
                        {course.currency === 'INR' ? '₹' : '$'}{course.price || course.coursePrice}
                      </div>
                    ) : (
                      <div className="font-bold text-lg text-green-600">Free</div>
                    )}
                    <div className="flex gap-3 mt-3">
                      {backendCourses.length > 0 && (() => {
                        if (isEnrolled) {
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('navigate-my-learning'));
                                }}
                                className={`py-2 px-3 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap`}
                              >
                                Go to My Learning
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenShareModal(course)}
                                className="py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center gap-1"
                                title="Share course"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          );
                        }
                        if (isEnrollmentClosed) {
                          return (
                            <>
                              <div className="py-2 px-3 bg-gray-400 text-white text-xs font-semibold rounded-lg text-center whitespace-nowrap">
                                Enrollment Closed
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenShareModal(course)}
                                className="py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center gap-1"
                                title="Share course"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          );
                        }
                        return (
                          <>
                            <button
                              onClick={() => setCheckoutCourse(course)}
                              className="py-2 px-3 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              {(!course.price && !course.coursePrice) || Number(course.price || course.coursePrice) === 0
                                ? 'Enroll Free'
                                : (course.courseType === 'cohort' || course.courseType === 'cohort-based') ? 'Enroll Now' : 'Buy Now'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenShareModal(course)}
                              className="py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center gap-1"
                              title="Share course"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Checkout Modal */}
        {checkoutCourse && (
          <PublicCourseCheckout
            course={{
              _id: checkoutCourse._id || checkoutCourse.id,
              title: checkoutCourse.title || checkoutCourse.name,
              description: checkoutCourse.description || checkoutCourse.courseDescription,
              price: Number(checkoutCourse.price || checkoutCourse.coursePrice || 0),
              currency: checkoutCourse.currency || 'USD',
              thumbnail: checkoutCourse.thumbnail || checkoutCourse.courseImage,
              specialistEmail: checkoutCourse.specialistEmail,
              courseType: checkoutCourse.courseType,
              startDate: checkoutCourse.startDate,
              endDate: checkoutCourse.endDate,
              schedule: checkoutCourse.schedule,
              meetingPlatform: checkoutCourse.meetingPlatform,
              zoomLink: checkoutCourse.zoomLink,
            }}
            isOpen={!!checkoutCourse}
            onClose={() => setCheckoutCourse(null)}
          />
        )}

        {/* Share Course Modal */}
        <ShareCourseModal
          course={shareModalCourse || {}}
          isOpen={isShareModalOpen}
          onClose={handleCloseShareModal}
        />
      </div>
    </div>
  );
};

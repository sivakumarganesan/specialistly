import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, Award, Loader, Video, Calendar, Clock, Users, ExternalLink } from 'lucide-react';
import { HLSVideoPlayer } from '@/app/components/HLSVideoPlayer';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "/api";

interface LessonFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  downloadLink?: string;
}

interface Lesson {
  _id: string;
  title: string;
  order: number;
  completed: boolean;
  cloudflareStreamId?: string;
  files?: LessonFile[];
}

interface Enrollment {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseDescription?: string;
  courseType?: string;
  zoomLink?: string;
  meetingPlatform?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  schedule?: string;
  liveSessions?: number;
  lessons: Lesson[];
  percentComplete: number;
  completed: boolean;
  certificate?: { issued: boolean; certificateId?: string };
}

interface PublicCourseViewerProps {
  enrollmentId: string;
  onBack: () => void;
  brandColor?: string;
}

const fileIcons: Record<string, string> = {
  pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
  ppt: '🎯', pptx: '🎯', txt: '📄', zip: '📦', audio: '🎵',
};

// Helper to detect if file is audio
const isAudioFile = (file: LessonFile): boolean => {
  const audioMimes = [
    'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 
    'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/flac', 
    'audio/x-flac'
  ];
  const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.webm'];
  
  // Check by MIME type if available
  if (file.fileType === 'audio') return true;
  if (audioMimes.includes((file as any).mimeType || '')) return true;
  
  // Check by file extension
  const ext = file.fileName.toLowerCase().match(/\.[^.]*$/)?.[0] || '';
  return audioExtensions.includes(ext);
};

export const PublicCourseViewer: React.FC<PublicCourseViewerProps> = ({
  enrollmentId,
  onBack,
  brandColor = '#1f2937',
}) => {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [videoThumb, setVideoThumb] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => { fetchEnrollment(); }, [enrollmentId]);

  useEffect(() => {
    setHlsUrl(null);
    setVideoThumb(null);
    if (enrollment && currentLessonId) {
      loadVideo(enrollment.courseId, currentLessonId);
    }
  }, [currentLessonId, enrollment?.courseId]);

  const fetchEnrollment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/courses/enrollments/self-paced/${enrollmentId}`, { headers });
      if (!res.ok) throw new Error('Failed to load course');
      const json = await res.json();
      const data = json.data || json;
      setEnrollment(data);
      const uncompleted = data.lessons?.find((l: Lesson) => !l.completed);
      setCurrentLessonId(uncompleted?._id || data.lessons?.[0]?._id || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVideo = async (courseId: string, lessonId: string) => {
    if (!courseId) return;
    try {
      setLoadingVideo(true);
      const res = await fetch(`${API_BASE_URL}/videos/lessons/${courseId}/${lessonId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.video?.hlsUrl) {
          setHlsUrl(data.video.hlsUrl);
          setVideoThumb(data.video.thumbnail || null);
        }
      }
    } catch {
      // Fallback — no video
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleMarkComplete = async (lessonId: string) => {
    if (!enrollment) return;
    try {
      setCompleting(true);
      const res = await fetch(
        `${API_BASE_URL}/courses/enrollments/self-paced/${enrollmentId}/lessons/${lessonId}/complete`,
        { method: 'POST', headers }
      );
      if (!res.ok) throw new Error('Failed to mark complete');
      const json = await res.json();
      const data = json.data || json;

      setEnrollment(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          percentComplete: data.percentComplete ?? prev.percentComplete,
          completed: data.completed ?? prev.completed,
          certificate: data.certificate ?? prev.certificate,
          lessons: prev.lessons.map(l => l._id === lessonId ? { ...l, completed: true } : l),
        };
      });

      // Advance to next lesson
      const idx = enrollment.lessons.findIndex(l => l._id === lessonId);
      if (idx !== -1 && idx < enrollment.lessons.length - 1) {
        setCurrentLessonId(enrollment.lessons[idx + 1]._id);
      }
    } catch {
      // Silently fail
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <p className="text-gray-600 mb-4">{error || 'Course not found'}</p>
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: brandColor }}>
          Back to My Learning
        </button>
      </div>
    );
  }

  const currentLesson = enrollment.lessons.find(l => l._id === currentLessonId);
  const completedCount = enrollment.lessons.filter(l => l.completed).length;
  const isCohort = enrollment.courseType === 'cohort-based' || enrollment.courseType === 'cohort';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Back + Title */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to My Learning
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{enrollment.courseTitle}</h1>
        {enrollment.courseDescription && (
          <p className="text-gray-500 mt-1 text-sm">{enrollment.courseDescription}</p>
        )}
        {!isCohort && (
          <div className="mt-3 max-w-xs">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{completedCount}/{enrollment.lessons.length} lessons</span>
              <span>{enrollment.percentComplete}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${enrollment.percentComplete}%`, backgroundColor: brandColor }} />
            </div>
          </div>
        )}
        {enrollment.completed && enrollment.certificate?.issued && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
            <Award className="w-4 h-4" /> Course Completed
          </div>
        )}
      </div>

      {/* Cohort view */}
      {isCohort ? (
        <div className="space-y-6">
          {enrollment.zoomLink && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border rounded-xl p-8 text-center">
              <Video className="w-12 h-12 mx-auto mb-3" style={{ color: brandColor }} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Join Live Session</h2>
              <p className="text-gray-500 mb-4">Join your session on {enrollment.meetingPlatform || 'Zoom'}</p>
              <a
                href={enrollment.zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-lg font-semibold"
                style={{ backgroundColor: brandColor }}
              >
                <Video className="w-4 h-4" /> Join Meeting <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrollment.startDate && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Start Date</p>
                  <p className="font-medium text-gray-900">{new Date(enrollment.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: enrollment.timezone || 'UTC' })}{enrollment.startTime ? ` at ${enrollment.startTime}` : ''}{enrollment.endTime ? ` to ${enrollment.endTime}` : ''}{enrollment.timezone ? ` ${({'Asia/Kolkata':'IST','America/New_York':'EST','America/Chicago':'CST','America/Denver':'MST','America/Los_Angeles':'PST','Europe/London':'GMT','Europe/Paris':'CET','Australia/Sydney':'AEST','Pacific/Auckland':'NZST','Asia/Tokyo':'JST','Asia/Shanghai':'CST','Asia/Dubai':'GST','Asia/Singapore':'SGT'} as Record<string,string>)[enrollment.timezone] || enrollment.timezone}` : ''}</p>
                  {enrollment.timezone && <p className="text-xs text-gray-500">{enrollment.timezone}</p>}
                </div>
              </div>
            )}
            {enrollment.schedule && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Schedule</p>
                  <p className="font-medium text-gray-900">{enrollment.schedule}</p>
                </div>
              </div>
            )}
            {enrollment.liveSessions && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Live Sessions</p>
                  <p className="font-medium text-gray-900">{enrollment.liveSessions} sessions</p>
                </div>
              </div>
            )}
          </div>
          {!enrollment.zoomLink && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <p className="text-gray-700 font-medium">Meeting link not available yet</p>
              <p className="text-gray-500 text-sm mt-1">The instructor will share the meeting link before the session starts.</p>
            </div>
          )}
        </div>
      ) : (
        /* Self-paced: video + lessons */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video area */}
          <div className="lg:col-span-2">
            {currentLesson ? (
              <>
                {/* Video Player - Only show if video exists */}
                {hlsUrl && (
                  <div className="bg-white border rounded-xl overflow-hidden shadow-sm mb-5">
                    <div className="bg-black aspect-video flex items-center justify-center relative">
                      {loadingVideo ? (
                        <Loader className="w-8 h-8 animate-spin text-gray-500" />
                      ) : (
                        <HLSVideoPlayer
                          hlsUrl={hlsUrl}
                          posterUrl={videoThumb || undefined}
                          title={currentLesson.title}
                          className="w-full h-full"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Lesson Content */}
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{currentLesson.title}</h2>
                  <div className="flex gap-3 mb-4">
                    {!currentLesson.completed ? (
                      <button
                        onClick={() => handleMarkComplete(currentLesson._id)}
                        disabled={completing}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: brandColor }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {completing ? 'Marking...' : 'Mark as Complete'}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </span>
                    )}
                  </div>

                  {/* Files - Audio Player + Downloads */}
                  {currentLesson.files && currentLesson.files.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="font-semibold text-blue-900 mb-3 text-sm">📎 Lesson Materials</h3>
                      <div className="space-y-3">
                        {currentLesson.files.map((file, i) => (
                          isAudioFile(file) ? (
                            // Audio Player
                            <div key={i} className="bg-white rounded border border-blue-200 p-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <span>🎵</span>
                                <span className="truncate">{file.fileName}</span>
                              </p>
                              <audio
                                controls
                                className="w-full h-8"
                                style={{
                                  accentColor: brandColor,
                                }}
                              >
                                <source src={file.downloadLink || file.fileUrl} type="audio/mp4" />
                                <source src={file.downloadLink || file.fileUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          ) : (
                            // Download Link
                            <a
                              key={i}
                              href={file.downloadLink || file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-white rounded border border-blue-100 hover:border-blue-300 transition text-sm"
                            >
                              <span>{fileIcons[file.fileType] || '📎'}</span>
                              <span className="truncate flex-1 text-gray-900">{file.fileName}</span>
                              <span className="text-blue-500 flex-shrink-0">↓</span>
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
            ) : (
              <div className="bg-white border rounded-xl p-8 text-center text-gray-500">
                No lessons available.
              </div>
            )}
          </div>

          {/* Lessons sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm sticky top-20">
              <div className="p-4 border-b">
                <h3 className="font-bold text-gray-900 text-sm">
                  Lessons ({completedCount}/{enrollment.lessons.length})
                </h3>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {enrollment.lessons.map((lesson, idx) => (
                  <button
                    key={lesson._id}
                    onClick={() => setCurrentLessonId(lesson._id)}
                    className={`w-full p-3.5 text-left transition ${currentLessonId === lesson._id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 mt-0.5">
                        {lesson.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <span className={`text-sm ${currentLessonId === lesson._id ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {lesson.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCourseViewer;

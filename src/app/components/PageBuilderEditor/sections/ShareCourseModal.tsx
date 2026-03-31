import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface ShareCourseModalProps {
  course: {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    description?: string;
    courseDescription?: string;
    thumbnail?: string;
    courseImage?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const ShareCourseModal: React.FC<ShareCourseModalProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const courseId = course._id || course.id;
  const courseTitle = course.title || course.name || 'Course';
  const courseImage = course.thumbnail || course.courseImage;

  // Generate shareable URL
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}?shareCourseid=${courseId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Share Course</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Course Preview */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Course Preview
            </p>
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              {courseImage ? (
                <img
                  src={courseImage}
                  alt={courseTitle}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-gray-900 flex items-center justify-center text-white/80">
                  <svg
                    className="w-16 h-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{courseTitle}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {course.description || course.courseDescription || 'A great course awaits!'}
              </p>
            </div>
          </div>

          {/* Share Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-blue-900 font-semibold">Ready to share?</p>
            <p className="text-sm text-blue-800">
              Click the button below to copy the shareable link. Paste it anywhere to let others discover this course!
            </p>
          </div>

          {/* Share Link Display */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Shareable Link
            </p>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 break-all">
              <p className="text-sm text-gray-700 font-mono">{shareUrl}</p>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyLink}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isCopied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="h-5 w-5" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                Copy Shareable Link
              </>
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareCourseModal;

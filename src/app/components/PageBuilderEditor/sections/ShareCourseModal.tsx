import React, { useState } from 'react';
import { X, Copy, Check, Mail, Instagram, MessageCircle, Facebook } from 'lucide-react';

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
  const courseDescription = course.description || course.courseDescription || 'A great course awaits!';
  const courseImage = course.thumbnail || course.courseImage;

  // Generate clean, readable shareable URL (course ID only)
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}?shareCourseid=${courseId}`;
  const encodedUrl = encodeURIComponent(shareUrl);

  const generateRichHTML = (imageDataUrl?: string) => {
    return `
      <div style="max-width: 500px; font-family: Arial, sans-serif; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        ${imageDataUrl ? `<img src="${imageDataUrl}" alt="${courseTitle}" style="width: 100%; height: 300px; object-fit: cover;" />` : '<div style="width: 100%; height: 300px; background: linear-gradient(135deg, #60a5fa 0%, #1a202c 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">📚</div>'}
        <div style="padding: 24px;">
          <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: bold; color: #111827;">${courseTitle}</h2>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">${courseDescription}</p>
          <a href="${shareUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Explore Course</a>
        </div>
      </div>
    `;
  };

  const imageToDataUrl = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('Failed to convert image to data URL:', err);
      return ''; // Return empty string if image conversion fails
    }
  };

  const handleCopyRichHTML = async () => {
    try {
      let imageDataUrl = '';
      
      // If we have a course image, convert it to data URL so it's embedded
      if (courseImage) {
        imageDataUrl = await imageToDataUrl(courseImage);
      }
      
      const richHTML = generateRichHTML(imageDataUrl);
      const plainText = `${courseTitle}\n${courseDescription}\n\n${shareUrl}`;
      
      const blob = new Blob([richHTML], { type: 'text/html' });
      const data = [new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      })];
      
      await navigator.clipboard.write(data);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy rich HTML:', err);
      // Fallback to plain text
      try {
        await navigator.clipboard.writeText(`${courseTitle}\n${courseDescription}\n\n${shareUrl}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
        alert('Failed to copy. Please try again.');
      }
    }
  };

  const handleShareEmail = () => {
    const subject = `Check out this course: ${courseTitle}`;
    // Keep it simple with just the image URL, not heavily encoded
    const body = `I found this great course you might be interested in:\n\n${courseTitle}\n${courseDescription}\n\nCourse Image:\n${courseImage}\n\nExplore it here:\n${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShareInstagram = () => {
    // Instagram - copy rich HTML with course info
    handleCopyRichHTML().then(() => {
      alert('Course card copied with rich formatting! Open Instagram and paste it in your bio link, story, or message.');
    }).catch(() => {
      alert('Failed to copy. Please try again.');
    });
  };

  const handleShareWhatsApp = () => {
    // WhatsApp - simple message with link and image
    const message = `📚 ${courseTitle}\n\n${courseDescription}\n\n🖼️ ${courseImage}\n\n🔗 ${shareUrl}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/?text=${encodedMessage}`,
      'whatsapp-share',
      'width=550,height=420'
    );
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      'facebook-share',
      'width=550,height=420'
    );
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
              Copy the course card with rich formatting below. Paste it into email, docs, or messages to share with beautiful formatting!
            </p>
          </div>

          {/* Share Link Display */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              What you'll copy
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">Formatted Course Card</p>
              <p className="text-xs text-gray-600">• Course image</p>
              <p className="text-xs text-gray-600">• Title & description</p>
              <p className="text-xs text-gray-600">• Clickable "Explore Course" button</p>
              <p className="text-xs text-gray-600 mt-2">Pastes beautifully into email, Google Docs, Notion, and more!</p>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyRichHTML}
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
                Copy Rich HTML
              </>
            )}
          </button>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Share on Social Media
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleShareEmail}
                className="py-3 px-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex flex-col items-center justify-center gap-1 text-xs font-semibold"
                title="Share via Email"
              >
                <Mail className="h-5 w-5" />
                <span>Email</span>
              </button>
              <button
                onClick={handleShareInstagram}
                className="py-3 px-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors flex flex-col items-center justify-center gap-1 text-xs font-semibold"
                title="Share on Instagram"
              >
                <Instagram className="h-5 w-5" />
                <span>Instagram</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="py-3 px-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex flex-col items-center justify-center gap-1 text-xs font-semibold"
                title="Share on WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleShareFacebook}
                className="py-3 px-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex flex-col items-center justify-center gap-1 text-xs font-semibold"
                title="Share on Facebook"
              >
                <Facebook className="h-5 w-5" />
                <span>Facebook</span>
              </button>
            </div>
          </div>

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

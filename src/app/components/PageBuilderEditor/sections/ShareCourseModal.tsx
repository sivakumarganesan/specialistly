import React, { useState } from 'react';
import { X, Copy, Check, Mail, Instagram, MessageCircle, Facebook, Download, Share2 } from 'lucide-react';

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
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const courseId = course._id || course.id;
  const courseTitle = course.title || course.name || 'Course';
  const courseDescription = course.description || course.courseDescription || 'A great course awaits!';
  const courseImage = course.thumbnail || course.courseImage;

  // Generate clean, readable shareable URL (course ID only)
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}?shareCourseid=${courseId}`;
  const encodedUrl = encodeURIComponent(shareUrl);

  // Generate a course card image using Canvas API
  const generateCardImage = async (): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const width = 600;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Try to draw thumbnail
    const imgHeight = 240;
    if (courseImage) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.crossOrigin = 'anonymous';
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = courseImage;
        });
        // Draw image covering top portion
        const scale = Math.max(width / img.width, imgHeight / img.height);
        const sw = width / scale;
        const sh = imgHeight / scale;
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, imgHeight);
      } catch {
        // Fallback gradient if image fails to load
        const grad = ctx.createLinearGradient(0, 0, width, imgHeight);
        grad.addColorStop(0, '#60a5fa');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, imgHeight);
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📚', width / 2, imgHeight / 2 + 16);
      }
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, imgHeight);
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, imgHeight);
    }

    // Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px Arial, sans-serif';
    const title = courseTitle.length > 50 ? courseTitle.slice(0, 47) + '...' : courseTitle;
    ctx.fillText(title, 20, imgHeight + 36);

    // Description
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial, sans-serif';
    const desc = courseDescription.length > 90 ? courseDescription.slice(0, 87) + '...' : courseDescription;
    ctx.fillText(desc, 20, imgHeight + 60);

    // Bottom bar with branding
    ctx.fillStyle = '#2563eb';
    const btnY = height - 50;
    const btnW = 160;
    const btnH = 36;
    const btnX = 20;
    // Rounded rect button
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(btnX + r, btnY);
    ctx.lineTo(btnX + btnW - r, btnY);
    ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + r);
    ctx.lineTo(btnX + btnW, btnY + btnH - r);
    ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - r, btnY + btnH);
    ctx.lineTo(btnX + r, btnY + btnH);
    ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - r);
    ctx.lineTo(btnX, btnY + r);
    ctx.quadraticCurveTo(btnX, btnY, btnX + r, btnY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('Explore Course', btnX + 20, btnY + 23);

    // URL text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(shareUrl, btnX + btnW + 16, btnY + 23);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  };

  const handleShareWithImage = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateCardImage();
      const file = new File([blob], `${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: courseTitle,
          text: `${courseTitle}\n${courseDescription}\n${shareUrl}`,
          files: [file],
        });
      } else {
        // Fallback: download the image
        downloadCardImage(blob);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Share failed:', err);
        // Fallback: download
        try {
          const blob = await generateCardImage();
          downloadCardImage(blob);
        } catch {
          alert('Failed to generate image. Please try again.');
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCardImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateRichHTML = (imageSource?: string) => {
    // imageSource can be either a data URL or a regular URL
    return `
      <div style="max-width: 500px; font-family: Arial, sans-serif; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        ${imageSource ? `<img src="${imageSource}" alt="${courseTitle}" style="width: 100%; height: 300px; object-fit: cover;" />` : '<div style="width: 100%; height: 300px; background: linear-gradient(135deg, #60a5fa 0%, #1a202c 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">📚</div>'}
        <div style="padding: 24px;">
          <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: bold; color: #111827;">${courseTitle}</h2>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 1.5; max-height: 100px; overflow: hidden;">${courseDescription}</p>
          <a href="${shareUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Explore Course</a>
        </div>
      </div>
    `;
  };

  const imageToDataUrl = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        console.warn('Image fetch failed with status:', response.status, 'Falling back to URL');
        return imageUrl; // Return the original URL as fallback
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (result && result.startsWith('data:')) {
            resolve(result);
          } else {
            console.warn('DataURL conversion resulted in unexpected format, using original URL');
            resolve(imageUrl);
          }
        };
        reader.onerror = () => {
          console.warn('FileReader error, falling back to URL');
          resolve(imageUrl);
        };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Failed to convert image to data URL:', err, 'Using original URL as fallback');
      // Return the original image URL - Gmail will fetch it when pasting
      return imageUrl;
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
    // Use Web Share API with image on supported devices (mobile)
    handleShareWithImage();
  };

  const handleShareFacebook = () => {
    // Facebook sharer uses OG tags from URL; also try Web Share API for image
    if (navigator.share) {
      handleShareWithImage();
    } else {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        'facebook-share',
        'width=550,height=420'
      );
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

          {/* Share / Download Image */}
          <div className="flex gap-2">
            <button
              onClick={handleShareWithImage}
              disabled={isGenerating}
              className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 active:scale-95 disabled:opacity-50"
            >
              <Share2 className="h-5 w-5" />
              {isGenerating ? 'Generating...' : 'Share as Image'}
            </button>
            <button
              onClick={async () => {
                setIsGenerating(true);
                try {
                  const blob = await generateCardImage();
                  downloadCardImage(blob);
                } catch {
                  alert('Failed to generate image.');
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating}
              className="py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 disabled:opacity-50"
              title="Download course card image"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>

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

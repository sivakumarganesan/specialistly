import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Calendar, Clock, X } from 'lucide-react';
import { ConsultingSlotCalendar } from '@/app/components/ConsultingSlotCalendar';

interface BookingSectionEditorProps {
  section: PageSection;
  onChange: (updates: Partial<PageSection>) => void;
}

export const BookingSectionEditor: React.FC<BookingSectionEditorProps> = ({
  section,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-bold mb-4">Booking Section</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Section Title</label>
            <Input
              placeholder="Book a Personal Appointment"
              value={section.content?.title || ''}
              onChange={(e) =>
                onChange({
                  content: { ...section.content, title: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Schedule a one-on-one consultation session"
              value={section.content?.description || ''}
              onChange={(e) =>
                onChange({
                  content: { ...section.content, description: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Button Text</label>
            <Input
              placeholder="Book Now"
              value={section.content?.buttonText || ''}
              onChange={(e) =>
                onChange({
                  content: { ...section.content, buttonText: e.target.value },
                })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ───────────── Preview (used in EditorCanvas, PreviewMode & PublicPageViewer) ───────────── */

interface BookingSectionPreviewProps {
  section: PageSection;
}

export const BookingSectionPreview: React.FC<BookingSectionPreviewProps> = ({ section }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const specialistEmail = section.content?.specialistEmail || '';
  const title = section.content?.title || 'Book a Personal Appointment';
  const description = section.content?.description || 'Schedule a one-on-one consultation session with our specialist.';
  const buttonText = section.content?.buttonText || 'Book Now';
  const bgColor = section.content?.backgroundColor || '#f0f9ff';
  const titleColor = section.content?.titleColor;
  const descriptionColor = section.content?.descriptionColor;

  return (
    <>
      <div className="py-16 px-4" style={{ backgroundColor: bgColor }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: titleColor || '#1e293b' }}
          >
            {title}
          </h2>
          <p
            className="text-lg mb-8 max-w-xl mx-auto"
            style={{ color: descriptionColor || '#475569' }}
          >
            {description}
          </p>
          <button
            onClick={() => specialistEmail && setShowCalendar(true)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Clock className="w-5 h-5" />
            {buttonText}
          </button>
        </div>
      </div>

      {/* Booking calendar modal */}
      {showCalendar && specialistEmail && ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCalendar(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-900">Book an Appointment</h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <ConsultingSlotCalendar specialistEmail={specialistEmail} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default BookingSectionEditor;

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { WebinarCalendarSlots } from "@/app/components/WebinarCalendarSlots";
import { AlertCircle, CheckCircle } from "lucide-react";

interface WebinarDate {
  date: string;
  time: string;
}

interface Service {
  _id: string;
  title: string;
  price: number;
  duration?: number;
  webinarDates?: WebinarDate[];
}

interface WebinarBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onConfirm: (webinarDate: WebinarDate) => void;
  isLoading?: boolean;
}

type BookingStep = "selecting" | "confirming" | "success";

export function WebinarBookingModal({
  isOpen,
  onClose,
  service,
  onConfirm,
  isLoading = false,
}: WebinarBookingModalProps) {
  const [bookingStep, setBookingStep] = useState<BookingStep>("selecting");
  const [selectedWebinar, setSelectedWebinar] = useState<WebinarDate | null>(
    null
  );

  const handleSelectWebinar = (webinar: WebinarDate) => {
    setSelectedWebinar(webinar);
    setBookingStep("confirming");
  };

  const handleConfirmBooking = () => {
    if (selectedWebinar) {
      setBookingStep("success");
      onConfirm(selectedWebinar);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        resetModal();
        onClose();
      }, 2000);
    }
  };

  const handleBackToSelection = () => {
    setSelectedWebinar(null);
    setBookingStep("selecting");
  };

  const resetModal = () => {
    setBookingStep("selecting");
    setSelectedWebinar(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-3xl">🎥</span>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {service.title}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {bookingStep === "success"
                    ? "Booking confirmed! ✓"
                    : "Book a live webinar session"}
                </p>
              </div>
            </div>
            <DialogClose />
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6 py-6">
          {bookingStep === "selecting" && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">
                  📅 Select a webinar session to join. A confirmation email
                  will be sent to you.
                </p>
              </div>

              <WebinarCalendarSlots
                webinarDates={service.webinarDates || []}
                serviceName={service.title}
                onSelectDate={handleSelectWebinar}
                isLoading={isLoading}
              />
            </>
          )}

          {bookingStep === "confirming" && selectedWebinar && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 font-medium">
                  ⏰ Confirm your webinar session booking
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Booking Summary
                </h3>

                <div className="space-y-3">
                  {/* Service Name */}
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-700">Service:</span>
                    <span className="font-medium text-gray-900">
                      {service.title}
                    </span>
                  </div>

                  {/* Date and Time */}
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-700">Session:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedWebinar.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        }
                      )}{" "}
                      at {selectedWebinar.time}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-700">Price:</span>
                    <span className="font-bold text-lg text-indigo-600">
                      ₹{service.price}
                    </span>
                  </div>

                  {/* Duration */}
                  {service.duration && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Duration:</span>
                      <span className="font-medium text-gray-900">
                        {service.duration} minutes
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Message */}
                <div className="bg-white rounded-lg p-3 border border-indigo-100 mt-4">
                  <p className="text-xs text-gray-600">
                    ✓ You'll receive a confirmation email with the webinar link
                    and details.
                  </p>
                </div>
              </div>
            </>
          )}

          {bookingStep === "success" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-24 h-24 text-green-500 animate-pulse" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                Booking Confirmed! 🎉
              </h3>

              <p className="text-gray-600 text-sm space-y-2">
                <div>You're successfully registered for:</div>
                <div className="font-semibold text-gray-900">
                  {service.title}
                </div>
                <div>
                  {selectedWebinar &&
                    new Date(selectedWebinar.date + "T00:00:00").toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      }
                    )}{" "}
                  at {selectedWebinar?.time}
                </div>
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <p className="text-sm text-green-900">
                  ✓ Confirmation email sent to your registered email address
                </p>
                <p className="text-sm text-green-900 mt-2">
                  ✓ Join link and details included in the email
                </p>
                <p className="text-sm text-green-900 mt-2">
                  ✓ Check your spam folder if you don't see it
                </p>
              </div>

              <p className="text-xs text-gray-500 italic">
                Closing in a few seconds...
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {bookingStep === "selecting" && (
            <>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button disabled className="flex-1 opacity-50 cursor-not-allowed">
                Select a Session
              </Button>
            </>
          )}

          {bookingStep === "confirming" && (
            <>
              <Button
                onClick={handleBackToSelection}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                ← Back
              </Button>
              <Button
                onClick={handleConfirmBooking}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? "Confirming..." : "Confirm Booking"}
              </Button>
            </>
          )}

          {bookingStep === "success" && (
            <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

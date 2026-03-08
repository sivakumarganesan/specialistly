import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Calendar, Clock, Users, MapPin, ChevronRight, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { API_BASE_URL } from '@/app/api/apiClient';

interface WebinarSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked';
  specialistEmail: string;
  specialistName: string;
  serviceTitle: string;
  capacity: string;
  duration: string;
}

interface Webinar {
  _id: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  capacity: string;
  location: string;
  eventType: 'single' | 'multiple';
  sessionFrequency: 'onetime' | 'selected' | 'repeat';
  webinarDates: Array<{ date: string; time: string; duration: string; capacity: string }>;
  creator: string;
  status: 'active' | 'draft';
  createdAt: string;
}

interface Props {
  specialistEmail?: string;
  onBook: (slot: WebinarSlot) => Promise<void>;
}

export const WebinarBooking: React.FC<Props> = ({ specialistEmail, onBook }) => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [availableSlots, setAvailableSlots] = useState<WebinarSlot[]>([]);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<WebinarSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingStep, setBookingStep] = useState<'browse' | 'slots' | 'confirm'>('browse');
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    message: '',
  });
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchWebinars();
  }, []);

  const fetchWebinars = async () => {
    try {
      setLoading(true);
      const query = specialistEmail ? `?creator=${specialistEmail}` : '';
      const response = await fetch(`${API_BASE_URL}/services${query}`);
      
      if (!response.ok) throw new Error('Failed to fetch webinars');
      
      const data = await response.json();
      // Filter for active webinars only
      const activeWebinars = data.data.filter((w: Webinar) => w.status === 'active');
      setWebinars(activeWebinars);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWebinar = async (webinar: Webinar) => {
    setSelectedWebinar(webinar);
    await fetchAvailableSlots(webinar);
    setBookingStep('slots');
  };

  const fetchAvailableSlots = async (webinar: Webinar) => {
    try {
      setLoading(true);
      const query = specialistEmail 
        ? `?specialistEmail=${specialistEmail}`
        : '';
      
      const response = await fetch(`${API_BASE_URL}/appointments/available${query}`);
      if (!response.ok) throw new Error('Failed to fetch available slots');
      
      const data = await response.json();
      
      // Filter slots that match this webinar's dates
      const webinarSlots = data.data.filter((slot: WebinarSlot) => 
        slot.serviceTitle === webinar.title && slot.status === 'available'
      );
      
      // Sort by date
      webinarSlots.sort((a: WebinarSlot, b: WebinarSlot) => 
        new Date(`${a.date}${a.startTime}`).getTime() - 
        new Date(`${b.date}${b.startTime}`).getTime()
      );
      
      setAvailableSlots(webinarSlots);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot: WebinarSlot) => {
    setSelectedSlot(slot);
    setBookingStep('confirm');
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot || !selectedWebinar || !bookingData.customerName || !bookingData.customerEmail) {
      setError('Please fill in all required fields');
      return;
    }

    setBooking(true);
    try {
      await onBook({
        ...selectedSlot,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
      });
      
      setBookingSuccess(true);
      
      // Reset after successful booking
      setTimeout(() => {
        setBookingStep('browse');
        setSelectedWebinar(null);
        setSelectedSlot(null);
        setBookingData({ customerName: '', customerEmail: '', message: '' });
        setBookingSuccess(false);
        fetchWebinars();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const handleBack = () => {
    if (bookingStep === 'confirm') {
      setBookingStep('slots');
      setSelectedSlot(null);
    } else if (bookingStep === 'slots') {
      setBookingStep('browse');
      setSelectedWebinar(null);
    }
  };

  if (loading && webinars.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading webinars...</p>
        </div>
      </div>
    );
  }

  // Browse Webinars View
  if (bookingStep === 'browse') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold mb-2">Available Webinars</h2>
          <p className="text-gray-600">
            Choose from our expert-led webinars and book your preferred time slot
          </p>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200 p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {webinars.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No webinars available at the moment</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {webinars.map(webinar => (
              <Card key={webinar._id} className="overflow-hidden hover:shadow-lg transition cursor-pointer" onClick={() => handleSelectWebinar(webinar)}>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{webinar.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {webinar.description}
                      </p>
                    </div>
                    {webinar.eventType === 'single' && (
                      <Badge className="bg-cyan-100 text-blue-800">Single Day</Badge>
                    )}
                    {webinar.eventType === 'multiple' && (
                      <Badge className="bg-indigo-100 text-purple-800">Multiple</Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{webinar.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Max {webinar.capacity} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="capitalize">{webinar.location}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-600">
                      ${webinar.price}
                    </div>
                    <Button 
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectWebinar(webinar);
                      }}
                    >
                      View Times
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Select Time Slot View
  if (bookingStep === 'slots' && selectedWebinar) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={handleBack}
          className="mb-4"
        >
          ← Back to Webinars
        </Button>

        <div>
          <h2 className="text-3xl font-bold mb-2">Select Your Time Slot</h2>
          <p className="text-gray-600">{selectedWebinar.title}</p>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200 p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </Card>
        )}

        {availableSlots.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No available slots at the moment</p>
            <Button variant="outline" onClick={handleBack}>
              Browse Other Webinars
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {availableSlots.map(slot => (
              <Card
                key={slot._id}
                className="p-4 hover:border-cyan-500 cursor-pointer transition"
                onClick={() => handleSelectSlot(slot)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span className="font-bold">
                        {format(parseISO(slot.date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ml-8">
                      <Clock className="h-5 w-5 text-green-500" />
                      <span>
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSlot(slot);
                    }}
                  >
                    Select
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Confirm Booking View
  if (bookingStep === 'confirm' && selectedWebinar && selectedSlot) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button
          variant="outline"
          onClick={handleBack}
          className="mb-4"
        >
          ← Back to Time Slots
        </Button>

        <div>
          <h2 className="text-3xl font-bold mb-4">Complete Your Booking</h2>
        </div>

        {bookingSuccess && (
          <Card className="bg-green-50 border-green-200 p-4">
            <p className="text-green-700 font-medium">✓ Booking confirmed! Check your email for details.</p>
          </Card>
        )}

        {error && (
          <Card className="bg-red-50 border-red-200 p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </Card>
        )}

        {/* Booking Summary */}
        <Card className="p-6 space-y-4 bg-cyan-50 border-blue-200">
          <h3 className="font-bold text-lg">Booking Summary</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Webinar:</span>
              <span className="font-medium">{selectedWebinar.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {format(parseISO(selectedSlot.date), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium">
                {selectedSlot.startTime} - {selectedSlot.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{selectedWebinar.duration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform:</span>
              <span className="font-medium capitalize">{selectedWebinar.location}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Price:</span>
              <span className="text-blue-600">${selectedWebinar.price}</span>
            </div>
          </div>
        </Card>

        {/* Contact Form */}
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-lg">Your Information</h3>
          
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={bookingData.customerName}
                onChange={(e) => setBookingData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={bookingData.customerEmail}
                onChange={(e) => setBookingData(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="john@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Message (Optional)
              </label>
              <textarea
                value={bookingData.message}
                onChange={(e) => setBookingData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Any special requests or questions?"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-24"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={booking}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={booking || bookingSuccess}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                {booking ? 'Processing...' : 'Confirm Booking'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return null;
};

export default WebinarBooking;

import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { X, Plus, Clock, Calendar } from 'lucide-react';

// Simple Select component
const Select = ({ value, onChange, children }: any) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {children}
  </select>
);

// Simple Switch component
const Switch = ({ checked, onChange }: any) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className="w-5 h-5 cursor-pointer"
  />
);

interface WebinarDate {
  date: string;
  time: string;
  duration: string; // in minutes
  capacity: string;
  id: string;
}

interface WeeklySlot {
  day: string;
  time: string;
  duration: string;
  capacity: string;
  enabled: boolean;
  id: string;
}

interface WebinarFormData {
  title: string;
  description: string;
  price: string;
  location: string; // zoom, google-meet, etc
  eventType: 'single' | 'multiple'; // single day or multiple days
  sessionFrequency: 'onetime' | 'selected' | 'repeat'; // onetime, selected dates, or recurring
  webinarDates: WebinarDate[]; // for single and selected dates
  weeklySchedule: WeeklySlot[]; // for recurring events
  capacity: string;
  status: 'draft' | 'active';
}

interface Props {
  serviceId?: string;
  initialData?: any;
  onSave: (data: WebinarFormData) => Promise<void>;
  onCancel: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATIONS = ['30', '45', '60', '90', '120'];

export const WebinarManager: React.FC<Props> = ({ serviceId, initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<WebinarFormData>(
    initialData || {
      title: '',
      description: '',
      price: '',
      location: 'zoom',
      eventType: 'single',
      sessionFrequency: 'onetime',
      webinarDates: [],
      weeklySchedule: [],
      capacity: '50',
      status: 'draft',
    }
  );

  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('09:00');
  const [currentDuration, setCurrentDuration] = useState('60');
  const [currentCapacity, setCurrentCapacity] = useState('50');
  const [currentDay, setCurrentDay] = useState('Monday');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add single date/time slot
  const addWebinarDate = () => {
    if (!currentDate || !currentTime) {
      setError('Please select date and time');
      return;
    }

    const newSlot: WebinarDate = {
      date: currentDate,
      time: currentTime,
      duration: currentDuration,
      capacity: currentCapacity,
      id: Math.random().toString(36).substr(2, 9),
    };

    setFormData(prev => ({
      ...prev,
      webinarDates: [...prev.webinarDates, newSlot],
    }));

    // Reset form
    setCurrentDate('');
    setCurrentTime('09:00');
    setCurrentDuration('60');
    setCurrentCapacity('50');
    setError('');
  };

  // Remove date slot
  const removeWebinarDate = (id: string) => {
    setFormData(prev => ({
      ...prev,
      webinarDates: prev.webinarDates.filter(d => d.id !== id),
    }));
  };

  // Add weekly recurring slot
  const addWeeklySlot = () => {
    if (!currentDay || !currentTime) {
      setError('Please select day and time');
      return;
    }

    const newSlot: WeeklySlot = {
      day: currentDay,
      time: currentTime,
      duration: currentDuration,
      capacity: currentCapacity,
      enabled: true,
      id: Math.random().toString(36).substr(2, 9),
    };

    setFormData(prev => ({
      ...prev,
      weeklySchedule: [...prev.weeklySchedule, newSlot],
    }));

    setError('');
  };

  // Remove weekly slot
  const removeWeeklySlot = (id: string) => {
    setFormData(prev => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.filter(s => s.id !== id),
    }));
  };

  // Toggle weekly slot enabled
  const toggleWeeklySlot = (id: string) => {
    setFormData(prev => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.eventType === 'single' && formData.webinarDates.length === 0) {
      setError('Please add at least one date/time for single day event');
      return;
    }

    if (formData.eventType === 'multiple') {
      const hasSlots = formData.webinarDates.length > 0 || 
                       (formData.sessionFrequency === 'repeat' && formData.weeklySchedule.length > 0);
      if (!hasSlots) {
        setError('Please add dates or set up recurring schedule');
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(formData);
      setSuccessMessage('Webinar saved successfully!');
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save webinar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">
          {serviceId ? 'Edit Webinar' : 'Create New Webinar'}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Close
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Card className="bg-red-50 border-red-200 p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </Card>
        )}

        {successMessage && (
          <Card className="bg-green-50 border-green-200 p-4">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </Card>
        )}

        {/* Basic Info */}
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-bold">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium mb-2">
              Webinar Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Python Basics for Beginners"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what participants will learn"
              className="w-full min-h-24"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Price ($) *
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="99.99"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Location (Platform)
              </label>
              <Select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              >
                <option value="zoom">Zoom</option>
                <option value="google-meet">Google Meet</option>
                <option value="teams">Microsoft Teams</option>
                <option value="webex">Webex</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Event Type Selection */}
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-bold">Event Type</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, eventType: 'single', sessionFrequency: 'onetime' }))}
              className={`p-4 rounded-lg border-2 text-left transition ${
                formData.eventType === 'single'
                  ? 'border-blue-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-lg">Single Day Event</div>
              <p className="text-sm text-gray-600 mt-2">
                One-time webinar on a specific date and time
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, eventType: 'multiple', sessionFrequency: 'selected' }))}
              className={`p-4 rounded-lg border-2 text-left transition ${
                formData.eventType === 'multiple'
                  ? 'border-blue-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-lg">Multiple Day/Recurring</div>
              <p className="text-sm text-gray-600 mt-2">
                Multiple sessions across different dates or recurring schedule
              </p>
            </button>
          </div>
        </Card>

        {/* Single Day Event */}
        {formData.eventType === 'single' && (
          <Card className="p-6 space-y-4 border-blue-200 bg-cyan-50">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Single Day Event Details
            </h3>

            <div className="bg-white rounded-lg p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Event Date *
                  </label>
                  <Input
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Time *
                  </label>
                  <Input
                    type="time"
                    value={currentTime}
                    onChange={(e) => setCurrentTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration (minutes)
                  </label>
                  <Select
                    value={currentDuration}
                    onChange={(e) => setCurrentDuration(e.target.value)}
                  >
                    {DURATIONS.map(d => (
                      <option key={d} value={d}>{d} mins</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Capacity
                  </label>
                  <Input
                    type="number"
                    value={currentCapacity}
                    onChange={(e) => setCurrentCapacity(e.target.value)}
                    min="1"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addWebinarDate}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Date/Time
                  </Button>
                </div>
              </div>
            </div>

            {/* Display added dates */}
            {formData.webinarDates.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Added Event Times:</h4>
                {formData.webinarDates.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{slot.date} at {slot.time}</p>
                        <p className="text-xs text-gray-600">
                          {slot.duration} mins • Capacity: {slot.capacity}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWebinarDate(slot.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Multiple Day Event */}
        {formData.eventType === 'multiple' && (
          <Card className="p-6 space-y-4 border-purple-200 bg-indigo-50">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Multiple Sessions Setup
            </h3>

            {/* Session Frequency Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                How would you like to schedule sessions?
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, sessionFrequency: 'selected' }))}
                  className={`p-3 rounded-lg border text-left transition ${
                    formData.sessionFrequency === 'selected'
                      ? 'border-indigo-500 bg-white'
                      : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium text-sm">Specific Dates</p>
                  <p className="text-xs text-gray-600">Choose specific dates/times</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, sessionFrequency: 'repeat' }))}
                  className={`p-3 rounded-lg border text-left transition ${
                    formData.sessionFrequency === 'repeat'
                      ? 'border-indigo-500 bg-white'
                      : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium text-sm">Recurring Schedule</p>
                  <p className="text-xs text-gray-600">Same days/times each week</p>
                </button>
              </div>
            </div>

            {/* Specific Dates */}
            {formData.sessionFrequency === 'selected' && (
              <div className="bg-white rounded-lg p-4 space-y-4">
                <h4 className="font-bold text-sm">Add Session Dates</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date *</label>
                    <Input
                      type="date"
                      value={currentDate}
                      onChange={(e) => setCurrentDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Start Time *</label>
                    <Input
                      type="time"
                      value={currentTime}
                      onChange={(e) => setCurrentTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duration (minutes)
                    </label>
                    <Select
                      value={currentDuration}
                      onChange={(e) => setCurrentDuration(e.target.value)}
                    >
                      {DURATIONS.map(d => (
                        <option key={d} value={d}>{d} mins</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Capacity
                    </label>
                    <Input
                      type="number"
                      value={currentCapacity}
                      onChange={(e) => setCurrentCapacity(e.target.value)}
                      min="1"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addWebinarDate}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Date
                    </Button>
                  </div>
                </div>

                {formData.webinarDates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm">Scheduled Sessions:</h4>
                    {formData.webinarDates.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
                        <div>
                          <p className="font-medium text-sm">{slot.date} at {slot.time}</p>
                          <p className="text-xs text-gray-600">
                            {slot.duration} mins • {slot.capacity} capacity
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWebinarDate(slot.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recurring Schedule */}
            {formData.sessionFrequency === 'repeat' && (
              <div className="bg-white rounded-lg p-4 space-y-4">
                <h4 className="font-bold text-sm">Setup Recurring Schedule</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Day of Week *
                    </label>
                    <Select
                      value={currentDay}
                      onChange={(e) => setCurrentDay(e.target.value)}
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Start Time *
                    </label>
                    <Input
                      type="time"
                      value={currentTime}
                      onChange={(e) => setCurrentTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duration (minutes)
                    </label>
                    <Select
                      value={currentDuration}
                      onChange={(e) => setCurrentDuration(e.target.value)}
                    >
                      {DURATIONS.map(d => (
                        <option key={d} value={d}>{d} mins</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Capacity
                    </label>
                    <Input
                      type="number"
                      value={currentCapacity}
                      onChange={(e) => setCurrentCapacity(e.target.value)}
                      min="1"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addWeeklySlot}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Slot
                    </Button>
                  </div>
                </div>

                {formData.weeklySchedule.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm">Weekly Schedule:</h4>
                    {formData.weeklySchedule.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{slot.day} at {slot.time}</p>
                          <p className="text-xs text-gray-600">
                            {slot.duration} mins • {slot.capacity} capacity
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slot.enabled}
                            onChange={() => toggleWeeklySlot(slot.id)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWeeklySlot(slot.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* General Settings */}
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-bold">Settings</h3>

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.status === 'active'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  status: e.target.checked ? 'active' : 'draft'
                }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">
                Publish this webinar (make it visible to users)
              </span>
            </label>
            <p className="text-xs text-gray-600 ml-7 mt-1">
              {formData.status === 'active' ? '✓ Published' : '○ Draft - Not visible to users'}
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {saving ? 'Saving...' : 'Save Webinar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WebinarManager;

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface WebinarDate {
  date: string;
  time: string;
}

interface WebinarCalendarSlotsProps {
  webinarDates: WebinarDate[];
  serviceName: string;
  onSelectDate: (date: WebinarDate) => void;
  isLoading?: boolean;
}

export function WebinarCalendarSlots({
  webinarDates,
  serviceName,
  onSelectDate,
  isLoading = false,
}: WebinarCalendarSlotsProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group webinar dates by date string
  const datesByDate = useMemo(() => {
    const grouped = new Map<string, WebinarDate[]>();
    webinarDates.forEach((wd) => {
      const dateObj = new Date(wd.date + "T00:00:00");
      const dateKey = dateObj.toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(wd);
    });
    return grouped;
  }, [webinarDates]);

  // Get dates in current month
  const datesInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const dates: (Date | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      dates.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i));
    }

    return dates;
  }, [currentMonth]);

  const isDateAvailable = (date: Date | null): boolean => {
    if (!date) return false;
    return datesByDate.has(date.toDateString());
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
    setSelectedDate(null);
  };

  const formatDateLabel = (date: Date | null): string => {
    if (!date) return "";
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const selectedDateWebinars = selectedDate
    ? datesByDate.get(selectedDate) || []
    : [];

  // Sort webinars by time
  const sortedWebinars = useMemo(() => {
    return [...selectedDateWebinars].sort((a, b) => {
      return a.time.localeCompare(b.time);
    });
  }, [selectedDateWebinars]);

  return (
    <div className="space-y-4 bg-white rounded-lg border border-cyan-200 p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900">
          {currentMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-2 text-center mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {datesInMonth.map((date, idx) => {
          const available = isDateAvailable(date);
          const isSelected =
            date && selectedDate === date.toDateString();

          return (
            <button
              key={idx}
              onClick={() => {
                if (date && available) {
                  setSelectedDate(date.toDateString());
                }
              }}
              disabled={!available}
              className={`aspect-square rounded-lg text-sm font-medium transition-colors relative ${
                !date
                  ? "bg-transparent cursor-default"
                  : available
                  ? isSelected
                    ? "bg-cyan-600 text-white"
                    : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {date && date.getDate()}
              {available && !isSelected && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Webinar sessions for selected date */}
      {selectedDate && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-600" />
            Webinar Sessions - {formatDateLabel(new Date(selectedDate))}
          </h4>

          {sortedWebinars.length > 0 ? (
            <div className="space-y-2">
              {sortedWebinars.map((webinar, idx) => (
                <Button
                  key={idx}
                  onClick={() => {
                    onSelectDate(webinar);
                  }}
                  disabled={isLoading}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-auto py-3 justify-between font-medium disabled:opacity-50"
                >
                  <span className="text-sm">{webinar.time}</span>
                  <span className="text-xs opacity-90">Join Session →</span>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No sessions available for this date
            </p>
          )}
        </div>
      )}

      {/* Info text */}
      {webinarDates.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">
            No webinar sessions scheduled for {serviceName}
          </p>
        </div>
      )}
    </div>
  );
}

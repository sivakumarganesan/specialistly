import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, CheckCircle, ArrowRight } from 'lucide-react';
import * as coursesAPI from '../api/coursesAPI';

interface Session {
  _id: string;
  sessionNumber: number;
  title: string;
  date: string;
  time: string;
  zoomLink: string;
  completed: boolean;
}

interface CohortSessionsProps {
  cohortId: string;
  enrollmentId: string;
}

const CohortSessions: React.FC<CohortSessionsProps> = ({ cohortId, enrollmentId }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getCohortSessions(cohortId);
        setSessions(response.data.data.sessions || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [cohortId]);

  const handleJoinSession = async (sessionId: string) => {
    try {
      const response = await coursesAPI.getSessionJoinLink(cohortId, sessionId);
      window.open(response.data.data.zoomLink, '_blank');
    } catch (error) {
      console.error('Error getting join link:', error);
      alert('Failed to get session link');
    }
  };

  const handleMarkAttended = async (sessionId: string) => {
    try {
      setMarking(sessionId);
      const response = await coursesAPI.markSessionAttended(enrollmentId, sessionId);
      
      // Update sessions list
      setSessions(sessions.map(s => 
        s._id === sessionId ? { ...s, completed: true } : s
      ));
      
      setSuccessMessage('Session marked as attended!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      alert(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  const attendedSessions = sessions.filter(s => s.completed).length;
  const attendancePercentage = sessions.length > 0 ? Math.round((attendedSessions / sessions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cohort Sessions</h1>
          <p className="text-gray-600">Join your instructor-led learning sessions</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
            {successMessage}
          </div>
        )}

        {/* Progress Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Sessions Attended</p>
              <p className="text-3xl font-bold text-emerald-600">{attendedSessions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Attendance</p>
              <p className="text-3xl font-bold text-indigo-600">{attendancePercentage}%</p>
            </div>
          </div>
          {attendancePercentage === 100 && (
            <div className="mt-4 flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle className="w-5 h-5" />
              <span>All sessions completed! Certificate ready for download.</span>
            </div>
          )}
        </div>

        {/* Sessions Timeline */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-600 text-lg">No sessions scheduled yet</p>
            </div>
          ) : (
            sessions.map((session, index) => {
              const sessionDate = new Date(session.date);
              const isUpcoming = sessionDate > new Date();
              
              return (
                <div
                  key={session._id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden transition ${
                    session.completed ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        {/* Session Number */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          session.completed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          #{session.sessionNumber}
                        </div>

                        {/* Session Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {session.title}
                          </h3>
                          <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{sessionDate.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{session.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {session.completed && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 font-semibold rounded-full text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Attended</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                      {!session.completed && session.zoomLink && (
                        <>
                          <button
                            onClick={() => handleJoinSession(session._id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-semibold transition"
                          >
                            <Video className="w-4 h-4" />
                            <span>Join Session</span>
                          </button>
                          <button
                            onClick={() => handleMarkAttended(session._id)}
                            disabled={marking === session._id}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg font-semibold transition disabled:opacity-50"
                          >
                            {marking === session._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                                <span>Recording...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Mark as Attended</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {session.zoomLink && session.completed && (
                        <a
                          href={session.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-semibold transition"
                        >
                          <Video className="w-4 h-4" />
                          <span>View Recording</span>
                        </a>
                      )}
                      {!session.zoomLink && (
                        <p className="text-gray-500 text-sm py-2">Zoom link coming soon</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <a
            href="/my-courses"
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            <span>← Back to My Courses</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CohortSessions;

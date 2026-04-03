import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { adminEnrollmentAPI } from '@/api/adminEnrollmentAPI';

const EnrollmentManagement: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Add enrollment form
  const [addForm, setAddForm] = useState({
    customerId: '',
    customerEmail: '',
    reason: '',
    notes: '',
  });

  // Customer search
  const [customerSearchEmail, setCustomerSearchEmail] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses/my-courses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        const data = await response.json();
        setCourses(data.data || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        setError('Failed to load courses');
      }
    };

    fetchCourses();
  }, []);

  // Fetch enrollments when course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments();
    }
  }, [selectedCourse]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const enrollments = await adminEnrollmentAPI.getCourseEnrollments(selectedCourse);
      setEnrollments(enrollments);
      setError('');
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
      setError('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const result = await adminEnrollmentAPI.getCourseAuditLogs(selectedCourse, 1, 100);
      setAuditLogs(result.data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setError('Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  const searchCustomer = async () => {
    if (!customerSearchEmail) {
      setError('Please enter customer email');
      return;
    }

    try {
      setSearchingCustomer(true);
      const response = await fetch(`/api/customers/search?email=${encodeURIComponent(customerSearchEmail)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Customer not found');
      }

      const data = await response.json();
      if (data.data) {
        const customer = data.data;
        setAddForm({
          customerId: customer._id || customer.customerId || '',
          customerEmail: customer.email || customerSearchEmail,
          reason: '',
          notes: '',
        });
        setCustomerFound(true);
        setError('');
      } else {
        setError('Customer not found');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to search customer');
      setCustomerFound(false);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleAddEnrollment = async () => {
    if (!addForm.customerId || !addForm.customerEmail) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const course = courses.find(c => c._id === selectedCourse);
      const isSelfPaced = course?.courseType === 'self-paced';

      if (isSelfPaced) {
        await adminEnrollmentAPI.addSelfPacedEnrollment({
          courseId: selectedCourse,
          ...addForm,
        });
      } else {
        await adminEnrollmentAPI.addCohortEnrollment({
          courseId: selectedCourse,
          ...addForm,
        });
      }

      setSuccess('Enrollment added successfully!');
      setAddForm({ customerId: '', customerEmail: '', reason: '', notes: '' });
      setCustomerSearchEmail('');
      setCustomerFound(false);
      setIsAddDialogOpen(false);
      fetchEnrollments();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to add enrollment');
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string, type: string) => {
    if (!window.confirm('Are you sure you want to remove this enrollment?')) {
      return;
    }

    try {
      if (type === 'self-paced') {
        await adminEnrollmentAPI.removeSelfPacedEnrollment(enrollmentId, {
          reason: 'Admin removal',
        });
      } else {
        await adminEnrollmentAPI.removeCohortEnrollment(enrollmentId, {
          reason: 'Admin removal',
        });
      }

      setSuccess('Enrollment removed successfully!');
      fetchEnrollments();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to remove enrollment');
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6">Enrollment Management</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Success</p>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Course Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setEnrollments([]);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose a course --</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.title} ({course.courseType === 'self-paced' ? 'Self-Paced' : 'Cohort-Based'})
              </option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <>
            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 flex-1 mr-4">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Enrollment
              </Button>
              <Button
                onClick={() => {
                  fetchAuditLogs();
                  setIsAuditDialogOpen(true);
                }}
                variant="outline"
                className="ml-2"
              >
                <Eye className="w-4 h-4" />
                Audit Trail
              </Button>
            </div>

            {/* Enrollments Table */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading enrollments...</p>
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No enrollments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Enrolled Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEnrollments.map(enrollment => (
                      <tr key={enrollment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{enrollment.customerName || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{enrollment.customerEmail}</td>
                        <td className="px-6 py-4 text-sm">
                          {enrollment.paymentStatus === 'completed' || enrollment.paidAt ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              Paid
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(enrollment.createdAt || enrollment.paidAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            enrollment.type === 'self-paced' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {enrollment.type === 'self-paced' ? 'Self-Paced' : 'Cohort'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemoveEnrollment(enrollment._id, enrollment.type)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                            title="Remove enrollment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Enrollment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setCustomerSearchEmail('');
          setCustomerFound(false);
          setAddForm({ customerId: '', customerEmail: '', reason: '', notes: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer to Course</DialogTitle>
            <DialogDescription>
              Search for a customer by email to enroll them in the selected course
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!customerFound ? (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium">Search Customer by Email</label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter customer email to search"
                    value={customerSearchEmail}
                    onChange={(e) => setCustomerSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchCustomer()}
                  />
                  <Button
                    onClick={searchCustomer}
                    disabled={searchingCustomer}
                    className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap"
                  >
                    {searchingCustomer ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Customer Found</p>
                    <p className="text-sm text-green-700 break-all">{addForm.customerEmail}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCustomerFound(false);
                      setCustomerSearchEmail('');
                      setAddForm({ customerId: '', customerEmail: '', reason: '', notes: '' });
                    }}
                    className="text-green-600 hover:text-green-800 font-semibold text-sm"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {customerFound && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Customer ID</label>
                  <Input
                    disabled
                    value={addForm.customerId}
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Reason for Manual Enrollment</label>
                  <Input
                    placeholder="e.g., System error correction, Special request"
                    value={addForm.reason}
                    onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Additional Notes</label>
                  <textarea
                    placeholder="Any additional context or details"
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setCustomerSearchEmail('');
              setCustomerFound(false);
              setAddForm({ customerId: '', customerEmail: '', reason: '', notes: '' });
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddEnrollment}
              disabled={!customerFound}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Enrollment Audit Trail</DialogTitle>
            <DialogDescription>
              View all manual enrollment changes for this course
            </DialogDescription>
          </DialogHeader>

          {auditLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {log.action === 'add' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">
                          {log.action === 'add' ? 'Added' : 'Removed'} {log.customerName}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{log.customerEmail}</p>
                      {log.reason && <p className="text-sm text-gray-500"><strong>Reason:</strong> {log.reason}</p>}
                      {log.notes && <p className="text-sm text-gray-500"><strong>Notes:</strong> {log.notes}</p>}
                      <p className="text-xs text-gray-400 mt-2">By: {log.adminEmail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsAuditDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnrollmentManagement;

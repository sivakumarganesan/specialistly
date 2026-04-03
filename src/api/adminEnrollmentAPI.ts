// Frontend API client for admin enrollment management
// This file provides typed methods for interacting with the enrollment management backend

const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export interface EnrollmentResponse {
  _id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  courseId: string;
  type: 'self-paced' | 'cohort';
  paymentStatus: 'completed' | 'pending';
  createdAt: string;
  paidAt?: string;
}

export interface AuditLogResponse {
  _id: string;
  action: 'add' | 'remove' | 'payment_override' | 'manual_adjustment';
  enrollmentId?: string;
  cohortEnrollmentId?: string;
  courseId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  reason?: string;
  notes?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  createdAt: string;
}

export interface AddEnrollmentRequest {
  courseId: string;
  customerId: string;
  customerEmail: string;
  reason?: string;
  notes?: string;
}

export interface RemoveEnrollmentRequest {
  reason?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

class AdminEnrollmentAPI {
  /**
   * Get all enrollments for a course
   * @param courseId - The course ID
   * @returns Promise containing array of enrollments
   */
  async getCourseEnrollments(courseId: string): Promise<EnrollmentResponse[]> {
    try {
      const response = await fetch(
        `/api/admin/enrollments/course/${courseId}`,
        {
          method: 'GET',
          headers: getAuthHeader(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch enrollments: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  }

  /**
   * Add a customer to a self-paced course
   * @param request - Enrollment request details
   * @returns Promise containing the created enrollment
   */
  async addSelfPacedEnrollment(request: AddEnrollmentRequest): Promise<EnrollmentResponse> {
    try {
      const response = await fetch(
        `/api/admin/enrollments/self-paced/add`,
        {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add enrollment');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error adding self-paced enrollment:', error);
      throw error;
    }
  }

  /**
   * Add a customer to a cohort-based course
   * @param request - Enrollment request details
   * @returns Promise containing the created enrollment
   */
  async addCohortEnrollment(request: AddEnrollmentRequest): Promise<EnrollmentResponse> {
    try {
      const response = await fetch(
        `/api/admin/enrollments/cohort/add`,
        {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add enrollment');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error adding cohort enrollment:', error);
      throw error;
    }
  }

  /**
   * Remove a customer from a self-paced course
   * @param enrollmentId - The enrollment ID to remove
   * @param request - Removal request details
   * @returns Promise containing removal confirmation
   */
  async removeSelfPacedEnrollment(
    enrollmentId: string,
    request?: RemoveEnrollmentRequest
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `/api/admin/enrollments/self-paced/${enrollmentId}`,
        {
          method: 'DELETE',
          headers: getAuthHeader(),
          body: JSON.stringify(request || { reason: 'Admin removal' }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove enrollment');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error removing self-paced enrollment:', error);
      throw error;
    }
  }

  /**
   * Remove a customer from a cohort-based course
   * @param enrollmentId - The enrollment ID to remove
   * @param request - Removal request details
   * @returns Promise containing removal confirmation
   */
  async removeCohortEnrollment(
    enrollmentId: string,
    request?: RemoveEnrollmentRequest
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `/api/admin/enrollments/cohort/${enrollmentId}`,
        {
          method: 'DELETE',
          headers: getAuthHeader(),
          body: JSON.stringify(request || { reason: 'Admin removal' }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove enrollment');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error removing cohort enrollment:', error);
      throw error;
    }
  }

  /**
   * Get all enrollment audit logs with pagination
   * @param page - Page number (1-based)
   * @param limit - Results per page
   * @returns Promise containing paginated audit logs
   */
  async getAuditLogs(
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<AuditLogResponse>> {
    try {
      const response = await fetch(
        `/api/admin/enrollments/audit-logs?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getAuthHeader(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific course
   * @param courseId - The course ID
   * @param page - Page number (1-based)
   * @param limit - Results per page
   * @returns Promise containing paginated course audit logs
   */
  async getCourseAuditLogs(
    courseId: string,
    page: number = 1,
    limit: number = 100
  ): Promise<PaginatedResponse<AuditLogResponse>> {
    try {
      const response = await fetch(
        `/api/admin/enrollments/${courseId}/audit-logs?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getAuthHeader(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch course audit logs: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching course audit logs:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const adminEnrollmentAPI = new AdminEnrollmentAPI();

// Also export the class for testing/mocking purposes
export default AdminEnrollmentAPI;

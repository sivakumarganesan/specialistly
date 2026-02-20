// API Base URL - use environment variable, fallback to localhost for development
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5001/api";

// Helper function to make API calls
const apiCall = async (
  endpoint: string,
  method: string = "GET",
  data?: any,
  token?: string
) => {
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Get token from parameter or localStorage
    const authToken = token || localStorage.getItem('authToken');
    if (authToken) {
      options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${authToken}`,
      };
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || result.message || "API Error";
      // Don't log 404s as they're expected when resources don't exist yet
      if (response.status !== 404) {
        console.error(`API Error (${response.status}):`, errorMessage);
      }
      const error = new Error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage) as any;
      error.status = response.status;
      throw error;
    }

    return result;
  } catch (error) {
    // Don't log errors for expected 404s - they'll be handled by the calling component
    if (!(error instanceof Error && error.message.includes("404"))) {
      console.error("API Error:", error);
    }
    throw error;
  }
};

// Course API calls
export const courseAPI = {
  // Course Management
  getAll: (filters?: { creator?: string }) => {
    const params = new URLSearchParams();
    if (filters?.creator) params.append("creator", filters.creator);
    const queryString = params.toString();
    return apiCall(`/courses/my-courses${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id: string) => apiCall(`/courses/${id}`),
  browseCourses: () => apiCall("/courses/browse"),
  create: (data: any) => apiCall("/courses", "POST", data),
  update: (id: string, data: any) => apiCall(`/courses/${id}`, "PUT", data),
  addLesson: (courseId: string, lessonData: any) => 
    apiCall(`/courses/${courseId}/lessons`, "POST", lessonData),
  publishCourse: (courseId: string) => 
    apiCall(`/courses/${courseId}/publish`, "POST"),
  archiveCourse: (courseId: string) => 
    apiCall(`/courses/${courseId}/archive`, "POST"),
  delete: (id: string) => apiCall(`/courses/${id}`, "DELETE"),
  
  // Self-Paced Enrollment
  enrollSelfPaced: (courseId: string, customerId?: string, customerEmail?: string) => 
    apiCall("/courses/enrollments/self-paced", "POST", { courseId, customerId, customerEmail }),
  getMySelfPacedCourses: (customerId?: string) => {
    const endpoint = customerId 
      ? `/courses/enrollments/self-paced/my-courses?customerId=${customerId}`
      : `/courses/enrollments/self-paced/my-courses`;
    return apiCall(endpoint);
  },
  getSelfPacedEnrollmentDetails: (enrollmentId: string) => 
    apiCall(`/courses/enrollments/self-paced/${enrollmentId}`),
  markLessonComplete: (enrollmentId: string, lessonId: string) => 
    apiCall(`/courses/enrollments/self-paced/${enrollmentId}/lessons/${lessonId}/complete`, "POST"),
  checkCertificateEligibility: (enrollmentId: string) => 
    apiCall(`/courses/enrollments/self-paced/${enrollmentId}/check-certificate`),
  
  // Cohort Management
  createCohort: (cohortData: any) => 
    apiCall("/courses/cohorts", "POST", cohortData),
  publishCohort: (cohortId: string) => 
    apiCall(`/courses/cohorts/${cohortId}/publish`, "POST"),
  addSession: (cohortId: string, sessionData: any) => 
    apiCall(`/courses/cohorts/${cohortId}/sessions`, "POST", sessionData),
  getCohortsByCourse: (courseId: string) => 
    apiCall(`/courses/${courseId}/cohorts`),
  getCohortSessions: (cohortId: string) => 
    apiCall(`/courses/cohorts/${cohortId}/sessions`),
  
  // Cohort Enrollment
  enrollCohort: (cohortId: string) => 
    apiCall("/courses/enrollments/cohort", "POST", { cohortId }),
  getMyCohorts: (customerId?: string) => {
    const endpoint = customerId 
      ? `/courses/enrollments/cohort/my-courses?customerId=${customerId}`
      : `/courses/enrollments/cohort/my-courses`;
    return apiCall(endpoint);
  },
  markSessionAttended: (enrollmentId: string, sessionId: string) => 
    apiCall(`/courses/enrollments/cohort/${enrollmentId}/sessions/${sessionId}/attend`, "POST"),
  getSessionJoinLink: (cohortId: string, sessionId: string) => 
    apiCall(`/courses/enrollments/cohort/${cohortId}/sessions/${sessionId}/join`),
  
  // Certificates
  downloadCertificate: (certificateId: string) => 
    apiCall(`/courses/certificates/${certificateId}/download`),
  getCertificate: (certificateId: string) => 
    apiCall(`/courses/certificates/${certificateId}`),
  verifyCertificate: (certificateId: string) => 
    apiCall(`/courses/verify/${certificateId}`),
  getMyCertificates: () => 
    apiCall("/courses/certificates/my-certificates"),
};

// Service API calls
export const serviceAPI = {
  getAll: (filters?: { creator?: string }) => {
    const params = new URLSearchParams();
    if (filters?.creator) params.append("creator", filters.creator);
    const queryString = params.toString();
    return apiCall(`/services${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id: string) => apiCall(`/services/${id}`),
  create: (data: any) => apiCall("/services", "POST", data),
  update: (id: string, data: any) => apiCall(`/services/${id}`, "PUT", data),
  delete: (id: string) => apiCall(`/services/${id}`, "DELETE"),
};

// Customer API calls
export const customerAPI = {
  getAll: (filters?: { specialistEmail?: string }) => {
    const params = new URLSearchParams();
    if (filters?.specialistEmail) {
      params.append('specialistEmail', filters.specialistEmail);
    }
    const queryString = params.toString();
    const url = queryString ? `/customers?${queryString}` : '/customers';
    return apiCall(url);
  },
  getById: (id: string) => apiCall(`/customers/${id}`),
  create: (data: any) => apiCall("/customers", "POST", data),
  update: (id: string, data: any) => apiCall(`/customers/${id}`, "PUT", data),
  delete: (id: string) => apiCall(`/customers/${id}`, "DELETE"),
  addPurchase: (customerId: string, data: any) =>
    apiCall(`/customers/${customerId}/purchases`, "POST", data),
  enrollCourse: (data: any) => apiCall("/customers/enroll", "POST", data),
  bookService: (data: any) => apiCall("/customers/book", "POST", data),
  bookWebinar: (data: any) => apiCall("/customers/book-webinar", "POST", data),
  getEnrollments: (email: string) => apiCall(`/customers/${email}/enrollments`),
  getBookings: (email: string) => apiCall(`/customers/${email}/bookings`),
};

// Appointment API calls
export const appointmentAPI = {
  getAll: () => apiCall("/appointments"),
  getAvailable: (specialistEmail?: string, specialistId?: string) => {
    const params = new URLSearchParams();
    if (specialistEmail) params.append('specialistEmail', specialistEmail);
    if (specialistId) params.append('specialistId', specialistId);
    const queryString = params.toString();
    return apiCall(`/appointments/available${queryString ? '?' + queryString : ''}`);
  },
  getScheduledWebinars: (specialistEmail: string) => {
    const params = new URLSearchParams();
    params.append('specialistEmail', specialistEmail);
    return apiCall(`/appointments/scheduled-webinars?${params.toString()}`);
  },
  create: (data: any) => apiCall("/appointments", "POST", data),
  book: (slotId: string, data: any) =>
    apiCall(`/appointments/${slotId}/book`, "PUT", data),
  updateStatus: (appointmentId: string, data: any) =>
    apiCall(`/appointments/${appointmentId}/status`, "PUT", data),
  sendReminder: (appointmentId: string) =>
    apiCall(`/appointments/${appointmentId}/send-reminder`, "POST"),
  shareRecording: (appointmentId: string, data: any) =>
    apiCall(`/appointments/${appointmentId}/share-recording`, "POST", data),
  getRecording: (appointmentId: string) =>
    apiCall(`/appointments/${appointmentId}/recording`, "GET"),
  delete: (id: string) => apiCall(`/appointments/${id}`, "DELETE"),
};

// Consulting Slot API calls (Phase 1 Backend)
export const consultingSlotAPI = {
  getSlots: (email: string) => apiCall(`/consulting-slots/${email}`),
  getStats: (email: string) => apiCall(`/consulting-slots/${email}/stats`),
  getById: (id: string) => apiCall(`/consulting-slots/${id}`),
  getAvailable: (email: string, startDate?: string, endDate?: string) => {
    let query = `/consulting-slots/available?specialistEmail=${email}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;
    return apiCall(query);
  },
  getAvailableForCustomer: (email: string, startDate?: string, endDate?: string) => {
    let query = `/consulting-slots/customer/available?specialistEmail=${email}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;
    return apiCall(query);
  },
  create: (data: any) => apiCall("/consulting-slots", "POST", data),
  bulkCreate: (data: any) => apiCall("/consulting-slots/bulk/create", "POST", data),
  generateFromAvailability: (data: { specialistEmail: string; startDate?: string; numDays?: number; serviceId?: string }) =>
    apiCall("/consulting-slots/generate/from-availability", "POST", data),
  update: (id: string, data: any) => apiCall(`/consulting-slots/${id}`, "PUT", data),
  delete: (id: string) => apiCall(`/consulting-slots/${id}`, "DELETE"),
  book: (id: string, data: any) => apiCall(`/consulting-slots/${id}/book`, "POST", data),
  cancelBooking: (id: string, customerId: string) => 
    apiCall(`/consulting-slots/${id}/book/${customerId}`, "DELETE"),
};

// Availability Schedule API calls
export const availabilityScheduleAPI = {
  // Authenticated endpoints (for logged-in specialists)
  getMySchedule: () => 
    apiCall(`/availability-schedule/my/schedule`),
  
  // Public endpoints (for customer view or when email is available)
  getSchedule: (specialistEmail: string) => 
    apiCall(`/availability-schedule/specialist/${specialistEmail}`),
  
  getAvailableSlots: (specialistEmail: string, date: string) =>
    apiCall(`/availability-schedule/slots/${specialistEmail}/${date}`),
  
  create: (data: any) => apiCall("/availability-schedule", "POST", data),
  update: (scheduleId: string, data: any) => apiCall(`/availability-schedule/${scheduleId}`, "PUT", data),
  delete: (scheduleId: string) => apiCall(`/availability-schedule/${scheduleId}`, "DELETE"),
};

// Creator API calls
export const creatorAPI = {
  getAll: () => apiCall("/creator"),
  getAllSpecialists: () => apiCall("/creator/specialists/all"),
  getById: (id: string) => apiCall(`/creator/id/${id}`),
  getByEmail: (email: string) => apiCall(`/creator/${email}`),
  save: (data: any) => apiCall("/creator", "POST", data),
  updateAvailability: (email: string, data: any) =>
    apiCall(`/creator/${email}/availability`, "PUT", data),
  delete: (id: string) => apiCall(`/creator/${id}`, "DELETE"),
};

// Subscription API calls
export const subscriptionAPI = {
  getAll: () => apiCall("/subscriptions"),
  getByEmail: (email: string) => apiCall(`/subscriptions/email/${email}`),
  create: (data: any) => apiCall("/subscriptions", "POST", data),
  update: (id: string, data: any) => apiCall(`/subscriptions/${id}`, "PUT", data),
  updateByEmail: (email: string, data: any) => apiCall(`/subscriptions/email/${email}`, "PUT", data),
  changePlan: (email: string, data: any) => apiCall(`/subscriptions/email/${email}/change-plan`, "POST", data),
  delete: (id: string) => apiCall(`/subscriptions/${id}`, "DELETE"),
};

// Branding API calls (Specialist Marketplace Pages)
export const brandingAPI = {
  // Public endpoints
  getPublicBranding: (slug: string) => apiCall(`/branding/public/slug/${slug}`),
  checkSlugAvailability: (slug: string) => apiCall(`/branding/available/slug?slug=${slug}`),
  
  // Specialist endpoints
  getMyBranding: (email: string) => apiCall(`/branding/${email}`),
  createBranding: (data: any) => apiCall(`/branding`, "POST", data),
  updateBranding: (email: string, data: any) => apiCall(`/branding/${email}`, "PUT", data),
  updateSection: (email: string, section: string, data: any) => 
    apiCall(`/branding/${email}/section/${section}`, "PUT", data),
  togglePublish: (email: string) => apiCall(`/branding/${email}/publish`, "PUT"),
  
  // Testimonials
  addTestimonial: (email: string, data: any) => apiCall(`/branding/${email}/testimonials`, "POST", data),
  removeTestimonial: (email: string, testimonialId: string) => 
    apiCall(`/branding/${email}/testimonials/${testimonialId}`, "DELETE"),
  
  // Social Links
  addSocialLink: (email: string, data: any) => apiCall(`/branding/${email}/social`, "POST", data),
  removeSocialLink: (email: string, platform: string) => 
    apiCall(`/branding/${email}/social/${platform}`, "DELETE"),
};

// Auth API calls
export const authAPI = {
  signup: (data: any) => apiCall("/auth/signup", "POST", data),
  login: (data: any) => apiCall("/auth/login", "POST", data),
  getProfile: (token: string) => apiCall("/auth/profile", "GET", undefined, token),
  updateSubscription: (token: string, data: any) => apiCall("/auth/subscription", "PUT", data, token),
};

// Messages API calls
export const messageAPI = {
  getConversations: () => apiCall("/messages/conversations"),
  getOrCreateConversation: (data: any) => apiCall("/messages/conversations", "POST", data),
  sendMessage: (data: any) => apiCall("/messages", "POST", data),
  getMessages: (conversationId: string, limit: number = 50, skip: number = 0) => 
    apiCall(`/messages/${conversationId}?limit=${limit}&skip=${skip}`),
  markAsRead: (conversationId: string) => apiCall(`/messages/${conversationId}/read`, "PUT"),
  getUnreadCount: () => apiCall("/messages/unread/count"),
  deleteMessage: (messageId: string) => apiCall(`/messages/${messageId}`, "DELETE"),
  archiveConversation: (conversationId: string) => apiCall(`/messages/${conversationId}/archive`, "PUT"),
};

// Health check
export const healthCheck = () => apiCall("/health");

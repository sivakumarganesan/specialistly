// API Base URL
const API_BASE_URL = "http://localhost:5001/api";

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

    if (token) {
      options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
      };
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || result.message || "API Error";
      console.error(`API Error (${response.status}):`, errorMessage);
      throw new Error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    }

    return result;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Course API calls
export const courseAPI = {
  getAll: (filters?: { creator?: string }) => {
    const params = new URLSearchParams();
    if (filters?.creator) params.append("creator", filters.creator);
    const queryString = params.toString();
    return apiCall(`/courses${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id: string) => apiCall(`/courses/${id}`),
  create: (data: any) => apiCall("/courses", "POST", data),
  update: (id: string, data: any) => apiCall(`/courses/${id}`, "PUT", data),
  delete: (id: string) => apiCall(`/courses/${id}`, "DELETE"),
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
  getAll: () => apiCall("/customers"),
  getById: (id: string) => apiCall(`/customers/${id}`),
  create: (data: any) => apiCall("/customers", "POST", data),
  update: (id: string, data: any) => apiCall(`/customers/${id}`, "PUT", data),
  delete: (id: string) => apiCall(`/customers/${id}`, "DELETE"),
  addPurchase: (customerId: string, data: any) =>
    apiCall(`/customers/${customerId}/purchases`, "POST", data),
  enrollCourse: (data: any) => apiCall("/customers/enroll", "POST", data),
  bookService: (data: any) => apiCall("/customers/book", "POST", data),
  getEnrollments: (email: string) => apiCall(`/customers/${email}/enrollments`),
  getBookings: (email: string) => apiCall(`/customers/${email}/bookings`),
};

// Appointment API calls
export const appointmentAPI = {
  getAll: () => apiCall("/appointments"),
  getAvailable: () => apiCall("/appointments/available"),
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

// Website API calls
export const websiteAPI = {
  getWebsite: (email: string) => apiCall(`/website/${email}`),
  saveWebsite: (email: string, data: any) => apiCall(`/website/${email}`, "POST", data),
  updateSubdomain: (email: string, data: any) => apiCall(`/website/${email}/subdomain`, "PUT", data),
  updateBranding: (email: string, data: any) => apiCall(`/website/${email}/branding`, "PUT", data),
  updateContent: (email: string, data: any) => apiCall(`/website/${email}/content`, "PUT", data),
  publishWebsite: (email: string) => apiCall(`/website/${email}/publish`, "PUT"),
};

// Auth API calls
export const authAPI = {
  signup: (data: any) => apiCall("/auth/signup", "POST", data),
  login: (data: any) => apiCall("/auth/login", "POST", data),
  getProfile: (token: string) => apiCall("/auth/profile", "GET", undefined, token),
  updateSubscription: (token: string, data: any) => apiCall("/auth/subscription", "PUT", data, token),
};

// Health check
export const healthCheck = () => apiCall("/health");

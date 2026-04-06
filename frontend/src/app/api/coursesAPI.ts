import axios from 'axios';

const API_BASE = '/api/courses';

/**
 * Helper: Build headers for authenticated API calls with fallback
 * 
 * ISSUE: When navigating across domains (e.g., staging.specialistly.com → nest.staging.specialistly.com),
 * localStorage is domain-specific and the auth token is not accessible.
 * 
 * SOLUTION: Try JWT token first (from same domain), fall back to X-Customer-Email header if not available
 * The backend supports both authentication methods:
 * - Priority 1: Authorization Bearer token (when on same domain as login)
 * - Priority 2: X-Customer-Email header (when on different domain)
 */
const getHeaders = () => {
  const headers: Record<string, string> = {};
  
  // Priority 1: Use JWT token if available (from same domain)
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }
  
  // Priority 2: Use customer email from stored user object (works across domains)
  // This ensures courses display even when accessing from specialized subdomains
  try {
    const userJSON = localStorage.getItem('user');
    const user = userJSON ? JSON.parse(userJSON) : null;
    if (user?.email) {
      headers['X-Customer-Email'] = user.email;
    }
  } catch (e) {
    // Silently handle parsing errors
  }
  
  return headers;
};

// ===== COURSE MANAGEMENT (Specialist) =====

export const createCourse = (courseData) => {
  return axios.post(`${API_BASE}`, courseData, {
    headers: getHeaders(),
  });
};

export const getMyCourses = (filters = {}) => {
  return axios.get(`${API_BASE}/my-courses`, {
    params: filters,
    headers: getHeaders(),
  });
};

export const browseCourses = () => {
  return axios.get(`${API_BASE}/browse`);
};

export const getCourseById = (courseId) => {
  return axios.get(`${API_BASE}/${courseId}`);
};

export const updateCourse = (courseId, courseData) => {
  return axios.put(`${API_BASE}/${courseId}`, courseData, {
    headers: getHeaders(),
  });
};

export const addLesson = (courseId, lessonData) => {
  return axios.post(`${API_BASE}/${courseId}/lessons`, lessonData, {
    headers: getHeaders(),
  });
};

export const publishCourse = (courseId) => {
  return axios.post(
    `${API_BASE}/${courseId}/publish`,
    {},
    {
      headers: getHeaders(),
    }
  );
};

export const archiveCourse = (courseId) => {
  return axios.post(
    `${API_BASE}/${courseId}/archive`,
    {},
    {
      headers: getHeaders(),
    }
  );
};

export const deleteCourse = (courseId) => {
  return axios.delete(`${API_BASE}/${courseId}`, {
    headers: getHeaders(),
  });
};

// ===== SELF-PACED ENROLLMENT =====

export const enrollSelfPaced = (courseId) => {
  return axios.post(
    `${API_BASE}/enrollments/self-paced`,
    { courseId },
    {
      headers: getHeaders(),
    }
  );
};

export const getMySelfPacedCourses = () => {
  return axios.get(`${API_BASE}/enrollments/self-paced/my-courses`, {
    headers: getHeaders(),
  });
};

export const getSelfPacedEnrollmentDetails = (enrollmentId) => {
  return axios.get(`${API_BASE}/enrollments/self-paced/${enrollmentId}`, {
    headers: getHeaders(),
  });
};

export const markLessonComplete = (enrollmentId, lessonId) => {
  return axios.post(
    `${API_BASE}/enrollments/self-paced/${enrollmentId}/lessons/${lessonId}/complete`,
    {},
    {
      headers: getHeaders(),
    }
  );
};

export const checkSelfPacedCertificateEligibility = (enrollmentId) => {
  return axios.get(
    `${API_BASE}/enrollments/self-paced/${enrollmentId}/check-certificate`,
    {
      headers: getHeaders(),
    }
  );
};

// ===== COHORT MANAGEMENT (Specialist) =====

export const createCohort = (cohortData) => {
  return axios.post(`${API_BASE}/cohorts`, cohortData, {
    headers: getHeaders(),
  });
};

export const publishCohort = (cohortId) => {
  return axios.post(
    `${API_BASE}/cohorts/${cohortId}/publish`,
    {},
    {
      headers: getHeaders(),
    }
  );
};

export const addSessionToCohort = (cohortId, sessionData) => {
  return axios.post(`${API_BASE}/cohorts/${cohortId}/sessions`, sessionData, {
    headers: getHeaders(),
  });
};

export const getCourseAvailableCohorts = (courseId) => {
  return axios.get(`${API_BASE}/${courseId}/cohorts`);
};

export const getCohortSessions = (cohortId) => {
  return axios.get(`${API_BASE}/cohorts/${cohortId}/sessions`);
};

// ===== COHORT ENROLLMENT (Student) =====

export const enrollCohort = (cohortId) => {
  return axios.post(
    `${API_BASE}/enrollments/cohort`,
    { cohortId },
    {
      headers: getHeaders(),
    }
  );
};

export const getMyCohorts = () => {
  return axios.get(`${API_BASE}/enrollments/cohort/my-courses`, {
    headers: getHeaders(),
  });
};

export const markSessionAttended = (enrollmentId, sessionId) => {
  return axios.post(
    `${API_BASE}/enrollments/cohort/${enrollmentId}/sessions/${sessionId}/attend`,
    {},
    {
      headers: getHeaders(),
    }
  );
};

export const getSessionJoinLink = (cohortId, sessionId) => {
  return axios.get(
    `${API_BASE}/enrollments/cohort/${cohortId}/sessions/${sessionId}/join`,
    {
      headers: getHeaders(),
    }
  );
};

// ===== CERTIFICATES =====

export const downloadCertificate = (certificateId) => {
  return axios.get(`${API_BASE}/certificates/${certificateId}/download`, {
    headers: getHeaders(),
  });
};

export const getCertificate = (certificateId) => {
  return axios.get(`${API_BASE}/certificates/${certificateId}`);
};

export const verifyCertificate = (certificateId) => {
  return axios.get(`${API_BASE}/verify/${certificateId}`);
};

export const getMyCertificates = () => {
  return axios.get(`${API_BASE}/certificates/my-certificates`, {
    headers: getHeaders(),
  });
};

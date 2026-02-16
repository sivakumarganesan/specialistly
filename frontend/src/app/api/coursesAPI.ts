import axios from 'axios';

const API_BASE = '/api/courses';

// ===== COURSE MANAGEMENT (Specialist) =====

export const createCourse = (courseData) => {
  return axios.post(`${API_BASE}`, courseData, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
};

export const getMyCourses = (filters = {}) => {
  return axios.get(`${API_BASE}/my-courses`, {
    params: filters,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
};

export const addLesson = (courseId, lessonData) => {
  return axios.post(`${API_BASE}/${courseId}/lessons`, lessonData, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
};

export const publishCourse = (courseId) => {
  return axios.post(
    `${API_BASE}/${courseId}/publish`,
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

export const archiveCourse = (courseId) => {
  return axios.post(
    `${API_BASE}/${courseId}/archive`,
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

export const deleteCourse = (courseId) => {
  return axios.delete(`${API_BASE}/${courseId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
};

// ===== SELF-PACED ENROLLMENT =====

export const enrollSelfPaced = (courseId) => {
  return axios.post(
    `${API_BASE}/enrollments/self-paced`,
    { courseId },
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

export const getMySelfPacedCourses = () => {
  return axios.get(`${API_BASE}/enrollments/self-paced/my-courses`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
};

export const getSelfPacedEnrollmentDetails = (enrollmentId) => {
  return axios.get(`${API_BASE}/enrollments/self-paced/${enrollmentId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
};

export const markLessonComplete = (enrollmentId, lessonId) => {
  return axios.post(
    `${API_BASE}/enrollments/self-paced/${enrollmentId}/lessons/${lessonId}/complete`,
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

export const checkSelfPacedCertificateEligibility = (enrollmentId) => {
  return axios.get(
    `${API_BASE}/enrollments/self-paced/${enrollmentId}/check-certificate`,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

// ===== COHORT MANAGEMENT (Specialist) =====

export const createCohort = (cohortData) => {
  return axios.post(`${API_BASE}/cohorts`, cohortData, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
};

export const publishCohort = (cohortId) => {
  return axios.post(
    `${API_BASE}/cohorts/${cohortId}/publish`,
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

export const addSessionToCohort = (cohortId, sessionData) => {
  return axios.post(`${API_BASE}/cohorts/${cohortId}/sessions`, sessionData, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

export const getMyCohorts = () => {
  return axios.get(`${API_BASE}/enrollments/cohort/my-courses`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
};

export const markSessionAttended = (enrollmentId, sessionId) => {
  return axios.post(
    `${API_BASE}/enrollments/cohort/${enrollmentId}/sessions/${sessionId}/attend`,
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

export const getSessionJoinLink = (cohortId, sessionId) => {
  return axios.get(
    `${API_BASE}/enrollments/cohort/${cohortId}/sessions/${sessionId}/join`,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

// ===== CERTIFICATES =====

export const downloadCertificate = (certificateId) => {
  return axios.get(`${API_BASE}/certificates/${certificateId}/download`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
};

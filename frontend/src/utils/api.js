// API base URL — change to your backend URL
const BASE_URL = 'https://examshield-api.onrender.com/api';

// Helper: attach JWT token to all requests
const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Handle API response
const handleRes = async (res) => {
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Server returned an invalid response (Not JSON).');
  }
  
  if (!res.ok) {
    throw new Error(data.message || `API Error: ${res.status} ${res.statusText}`);
  }
  return data;
};

// Generic fetch wrapper to catch network errors
const safeFetch = async (url, options) => {
  try {
    const res = await fetch(url, options);
    return await handleRes(res);
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      throw new Error('Could not connect to the server. The backend might be starting up (cold start) or your internet is down.');
    }
    throw err;
  }
};

/* ── Auth APIs ── */
export const loginAPI = (email, password, role) =>
  safeFetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });

export const registerAPI = (name, email, password) =>
  safeFetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

export const forgotPasswordAPI = (email) =>
  safeFetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

export const resetPasswordAPI = (token, newPassword) =>
  safeFetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

/* ── Exam APIs ── */
export const getExamsAPI = (token) =>
  safeFetch(`${BASE_URL}/exams`, { headers: authHeaders(token) });

export const createExamAPI = (token, examData) =>
  safeFetch(`${BASE_URL}/exams`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(examData),
  });

export const updateExamAPI = (token, id, examData) =>
  safeFetch(`${BASE_URL}/exams/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(examData),
  });

export const deleteExamAPI = (token, id) =>
  safeFetch(`${BASE_URL}/exams/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

/* ── Question APIs ── */
export const getQuestionsAPI = (token, examId) =>
  safeFetch(`${BASE_URL}/exams/${examId}/questions`, {
    headers: authHeaders(token),
  });

export const getAdminQuestionsAPI = (token, examId) =>
  safeFetch(`${BASE_URL}/questions/exam/${examId}`, {
    headers: authHeaders(token),
  });

export const addQuestionAPI = (token, questionData) =>
  safeFetch(`${BASE_URL}/questions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(questionData),
  });

export const editQuestionAPI = (token, questionId, questionData) =>
  safeFetch(`${BASE_URL}/questions/${questionId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(questionData),
  });

export const deleteQuestionAPI = (token, questionId) =>
  safeFetch(`${BASE_URL}/questions/${questionId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

/* ── Result APIs ── */
export const submitExamAPI = (token, attemptId, answers) =>
  safeFetch(`${BASE_URL}/results/submit`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ attemptId, answers }),
  });

export const getMyResultsAPI = (token) =>
  safeFetch(`${BASE_URL}/results/my`, { headers: authHeaders(token) });

export const getLeaderboardAPI = (token, examId) =>
  safeFetch(`${BASE_URL}/results/leaderboard${examId ? `?examId=${examId}` : ''}`, {
    headers: authHeaders(token),
  });

export const startExamAttemptAPI = (token, examId) =>
  safeFetch(`${BASE_URL}/attempts/start`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ examId }),
  });

export const getAdminStatsAPI = (token) =>
  safeFetch(`${BASE_URL}/admin/stats`, { headers: authHeaders(token) });

export const getAdminStudentsAPI = (token) =>
  safeFetch(`${BASE_URL}/admin/students`, { headers: authHeaders(token) });

export const getAdminAllResultsAPI = (token) =>
  safeFetch(`${BASE_URL}/admin/all-results`, { headers: authHeaders(token) });

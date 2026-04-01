// API base URL — change to your backend URL
const BASE_URL = 'https://examshield-api.onrender.com/api';

// Helper: attach JWT token to all requests
const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Handle API response
const handleRes = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
};

/* ── Auth APIs ── */
export const loginAPI = (email, password, role) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  }).then(handleRes);

export const registerAPI = (name, email, password) =>
  fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  }).then(handleRes);

export const forgotPasswordAPI = (email) =>
  fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(handleRes);

export const resetPasswordAPI = (token, newPassword) =>
  fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  }).then(handleRes);

/* ── Exam APIs ── */
export const getExamsAPI = (token) =>
  fetch(`${BASE_URL}/exams`, { headers: authHeaders(token) }).then(handleRes);

export const createExamAPI = (token, examData) =>
  fetch(`${BASE_URL}/exams`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(examData),
  }).then(handleRes);

export const updateExamAPI = (token, id, examData) =>
  fetch(`${BASE_URL}/exams/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(examData),
  }).then(handleRes);

export const deleteExamAPI = (token, id) =>
  fetch(`${BASE_URL}/exams/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then(handleRes);

/* ── Question APIs ── */
export const getQuestionsAPI = (token, examId) =>
  fetch(`${BASE_URL}/exams/${examId}/questions`, {
    headers: authHeaders(token),
  }).then(handleRes);

export const getAdminQuestionsAPI = (token, examId) =>
  fetch(`${BASE_URL}/questions/exam/${examId}`, {
    headers: authHeaders(token),
  }).then(handleRes);

export const addQuestionAPI = (token, questionData) =>
  fetch(`${BASE_URL}/questions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(questionData),
  }).then(handleRes);

export const editQuestionAPI = (token, questionId, questionData) =>
  fetch(`${BASE_URL}/questions/${questionId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(questionData),
  }).then(handleRes);

export const deleteQuestionAPI = (token, questionId) =>
  fetch(`${BASE_URL}/questions/${questionId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then(handleRes);

/* ── Result APIs ── */
export const submitExamAPI = (token, attemptId, answers) =>
  fetch(`${BASE_URL}/results/submit`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ attemptId, answers }),
  }).then(handleRes);

export const getMyResultsAPI = (token) =>
  fetch(`${BASE_URL}/results/my`, { headers: authHeaders(token) }).then(handleRes);

export const getLeaderboardAPI = (token, examId) =>
  fetch(`${BASE_URL}/results/leaderboard${examId ? `?examId=${examId}` : ''}`, {
    headers: authHeaders(token),
  }).then(handleRes);

export const startExamAttemptAPI = (token, examId) =>
  fetch(`${BASE_URL}/attempts/start`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ examId }),
  }).then(handleRes);

export const getAdminStatsAPI = (token) =>
  fetch(`${BASE_URL}/admin/stats`, { headers: authHeaders(token) }).then(handleRes);

export const getAdminStudentsAPI = (token) =>
  fetch(`${BASE_URL}/admin/students`, { headers: authHeaders(token) }).then(handleRes);

export const getAdminAllResultsAPI = (token) =>
  fetch(`${BASE_URL}/admin/all-results`, { headers: authHeaders(token) }).then(handleRes);

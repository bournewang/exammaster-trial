// Simple client for the course progress API.
//
// Backend endpoint (can be overridden via Vite env):
//   VITE_PROGRESS_ENDPOINT, e.g. http://127.0.0.1:8000/api/course-progress
// Fallback: /api/course-progress (useful when running behind a dev proxy).

import { getToken, clearAuthData } from './auth';

const PROGRESS_ENDPOINT = import.meta.env.VITE_PROGRESS_ENDPOINT || '/api/course-progress';

/**
 * Build headers for API requests, including Authorization token if available.
 */
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fire-and-forget helper to update course progress.
 *
 * @param {Object} params
 * @param {number} params.userId       Numeric user id from authStore.user.id
 * @param {number} params.courseId     Numeric course id (lesson.id as number)
 * @param {number} [params.progressPercent] 0-100, optional (video watch progress)
 * @param {number} [params.totalAnswered]   >= 0, optional (questions answered)
 * @param {number} [params.totalCorrect]    >= 0, optional (questions correct)
 */
export async function updateCourseProgress({
  // userId is ignored when Authorization token is present
  userId,
  courseId,
  progressPercent,
  totalAnswered,
  totalCorrect,
}) {
  if (!userId || !courseId) {
    return;
  }

  const payload = {
    // user_id intentionally omitted; backend resolves user from token
    course_id: courseId,
  };

  if (typeof progressPercent === 'number') {
    const rounded = Math.max(0, Math.min(100, Math.round(progressPercent)));
    payload.progress_percent = rounded;
  }

  if (typeof totalAnswered === 'number') {
    payload.total_answered = Math.max(0, Math.round(totalAnswered));
  }

  if (typeof totalCorrect === 'number') {
    payload.total_correct = Math.max(0, Math.round(totalCorrect));
  }

  try {
    const res = await fetch(PROGRESS_ENDPOINT, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.message === 'Invalid or expired token') {
          clearAuthData();
          window.location.href = '/';
          return;
        }
      } catch (e) {
        // Ignore parse errors
      }
      // eslint-disable-next-line no-console
      console.warn('Failed to update course progress', text);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Error while calling course progress API', err);
  }
}

/**
 * Fetch all course progress rows for a given user.
 * Returns the raw items from the backend (array of rows).
 *
 * @param {number} userId
 * @returns {Promise<Array<any>>}
 */
export async function fetchCourseProgressForUser(userId) {
  if (!userId) return [];

  // Query params are not required when using token-based auth
  const url = PROGRESS_ENDPOINT;

  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json().catch(() => ({}));

  // Check for token expiration
  if (data.message === 'Invalid or expired token') {
    clearAuthData();
    // Redirect to login by throwing error that will be caught upstream
    window.location.href = '/';
    throw new Error('Token expired. Please log in again.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch course progress');
  }

  return data.items || [];
}

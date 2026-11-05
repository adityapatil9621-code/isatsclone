import { useEffect, useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function fetchCourses() {
  const response = await fetch(`${API_BASE_URL}/api/courses`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.message ||
      payload.error ||
      'Unable to load courses from PostgreSQL'
    );
  }

  return Array.isArray(payload.courses) ? payload.courses : [];
}

export function useCourses(category = null) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const allCourses = await fetchCourses();

        if (cancelled) return;

        const filtered = category
          ? allCourses.filter(
              (course) => course.category === category
            )
          : allCourses;

        setCourses(filtered);
        setConnected(true);
      } catch (err) {
        if (cancelled) return;

        console.error('Course API error:', err);

        setCourses([]);
        setConnected(false);
        setError(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [category]);

  return {
    courses,
    loading,
    connected,
    error,
  };
}
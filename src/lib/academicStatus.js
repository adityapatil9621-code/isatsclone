import { useEffect, useState } from 'react';

const KEY = 'isats_academic_status';

export const ACADEMIC_OPTIONS = [
  { value: 'tenth', label: '10th pass' },
  { value: 'twelfth', label: '12th pass' },
  { value: 'graduate', label: 'Degree / Diploma' },
];

export const getAcademicStatus = () => {
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
};

export function setAcademicStatus(value) {
  try { value ? localStorage.setItem(KEY, value) : localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event('isats-academic-status'));
}

export function useAcademicStatus() {
  const [status, setStatus] = useState(getAcademicStatus);
  useEffect(() => {
    const sync = () => setStatus(getAcademicStatus());
    window.addEventListener('isats-academic-status', sync);
    return () => window.removeEventListener('isats-academic-status', sync);
  }, []);
  return [status, setAcademicStatus];
}
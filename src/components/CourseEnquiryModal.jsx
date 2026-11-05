import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput.jsx';
import { validatePhone } from '@/lib/phone.js';
import { CONTACT } from '@/data/contactInfo.js';
import { ACADEMIC_OPTIONS, useAcademicStatus } from '@/lib/academicStatus.js';
import { coursesAvailableFor, courseLabel } from '@/lib/courseAccess.js';

export default function CourseEnquiryModal({ course, open, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [academicStatus, setAcademicStatus] = useAcademicStatus();
  const [courseName, setCourseName] = useState('');
  const available = useMemo(() => coursesAvailableFor(academicStatus), [academicStatus]);
  const initialCourse = course?.title || course?.name || '';

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [open, busy, onClose]);

  // Reset the form each time it opens, starting from the course that was clicked
  useEffect(() => {
    if (open) {
      setName(''); setPhone('+91'); setPhoneTouched(false); setError(''); setBusy(false);
      setCourseName(initialCourse);
    }
  }, [open, course]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autofill name and phone from the signed-in student's saved profile
  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => response.json())
      .then((result) => {
        if (!active || !result.authenticated) return;
        const profile = result.user?.profile || {};
        if (profile.fullName) setName((current) => current || profile.fullName);
        if (profile.phone) setPhone((current) => (!current || current === '+91' ? profile.phone : current));
      })
      .catch(() => {}); // not signed in or API offline: the form still works
    return () => { active = false; };
  }, [open, course]);

  // Keep the chosen course valid whenever the academic background changes
  useEffect(() => {
    if (!open) return;
    const names = available.map(courseLabel);
    const sameProgram = available.find((c) => c.category && c.category === course?.category);
    setCourseName((current) =>
      names.includes(current) ? current : sameProgram ? courseLabel(sameProgram) : names[0] || ''
    );
  }, [open, available, course]);

  if (!open || !course) return null;

  async function submit(event) {
    event.preventDefault();
    setPhoneTouched(true);
    setError('');
    if (!academicStatus) return setError('Please select your academic background.');
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const cleanPhone = String(phone || '').replace(/[\s()-]/g, '');
    const validation = validatePhone(cleanPhone);
    if (cleanName.length < 2 || cleanName.length > 120) return setError('Enter your full name (2–120 characters).');
    if (!/^\+[1-9]\d{7,14}$/.test(cleanPhone) || validation) return setError(validation || 'Enter a valid phone number with country code.');
    if (!courseName || courseName.length > 180) return setError('The selected course is not valid. Please refresh and try again.');

    setBusy(true);
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: cleanName, phone: cleanPhone, interestedCourse: courseName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save your enquiry. Please try again.');

      const message = [
        'Hello ISATS, I would like to enquire about a course.',
        `Course: ${courseName}`,
      ].join('\n');
      window.location.assign(`https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not submit your enquiry.');
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="course-enquiry-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-primary">ISATS COURSE ENQUIRY</p>
            <h2 id="course-enquiry-title" className="mt-1 text-2xl font-semibold text-slate-900">Request course details</h2>
            <p className="mt-2 text-sm text-slate-600">Share your contact details. Our team will assist you on WhatsApp.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close enquiry form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="enquiry-name" className="mb-1.5 block text-sm font-medium text-slate-800">Full name</label>
            <input id="enquiry-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Enter your full name" />
          </div>
          <div>
            <label htmlFor="enquiry-phone" className="mb-1.5 block text-sm font-medium text-slate-800">Phone number</label>
            <div className="rounded-lg border border-slate-300 px-2 py-2 focus-within:border-primary">
              <PhoneInput id="enquiry-phone" value={phone} onChange={setPhone} error={phoneTouched ? (validatePhone(phone) || (!phone || phone === '+91' ? 'Enter your phone number.' : '')) : ''} />
            </div>
          </div>
          <div>
            <label htmlFor="enquiry-background" className="mb-1.5 block text-sm font-medium text-slate-800">Academic background</label>
            <select id="enquiry-background" value={academicStatus} onChange={(e) => setAcademicStatus(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">Select your academic background</option>
              {ACADEMIC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="enquiry-course" className="mb-1.5 block text-sm font-medium text-slate-800">Interested course</label>
            <select id="enquiry-course" value={courseName} onChange={(e) => setCourseName(e.target.value)} disabled={!academicStatus} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary disabled:bg-slate-50">
              {available.map((c) => (
                <option key={courseLabel(c)} value={courseLabel(c)}>
                  {courseLabel(c)}{academicStatus === 'tenth' && /laser/i.test(courseLabel(c)) ? ' (hair reduction only)' : ''}
                </option>
              ))}
            </select>
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
            <MessageCircle size={18} /> {busy ? 'Saving enquiry…' : 'Enquire on WhatsApp'}
          </button>
          <p className="text-center text-xs leading-relaxed text-slate-500">Your enquiry is saved with ISATS before WhatsApp opens. Submitting does not create a student account.</p>
        </form>
      </section>
    </div>, document.body,
  );
}
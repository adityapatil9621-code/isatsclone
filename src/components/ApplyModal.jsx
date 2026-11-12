import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileText, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput.jsx';
import { validatePhone } from '@/lib/phone.js';
import { ACADEMIC_OPTIONS, useAcademicStatus } from '@/lib/academicStatus.js';
import { coursesAvailableFor, courseLabel } from '@/lib/courseAccess.js';
import { submitApplication } from '@/lib/applicationApi.js';

const MAX_FILE_MB = 5;
const MAX_TOTAL_MB = 15;
const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6];

const getSlots = (status, years) => {
  if (status === 'tenth') return [{ id: 'tenthCertificate', label: '10th passing certificate' }];
  if (status === 'twelfth') return [{ id: 'twelfthCertificate', label: '12th passing certificate' }];
  if (status === 'graduate') {
    return [
      ...Array.from({ length: years }, (_, i) => ({ id: `marksheet${i + 1}`, label: `Year ${i + 1} marksheet` })),
      { id: 'finalCertificate', label: 'Final degree / diploma certificate' },
    ];
  }
  return [];
};

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Checks type, size and the real "%PDF-" file signature
async function validatePdf(file) {
  const looksLikePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!looksLikePdf) return 'Only PDF files are allowed.';
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `File is too large. Maximum size is ${MAX_FILE_MB} MB.`;
  const header = await file.slice(0, 5).text();
  if (header !== '%PDF-') return 'This file is not a valid PDF.';
  return null;
}

function FileSlot({ slot, file, error, onSelect, onRemove }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const pick = (list) => list && list[0] && onSelect(slot.id, list[0]);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {slot.label} <span className="text-destructive">*</span>
      </span>
      {/* Hidden native input: clicking the button opens the computer's file explorer */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
      />
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2.5">
          <FileText className="h-5 w-5 shrink-0 text-green-700" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium text-primary hover:underline">Replace</button>
          <button type="button" onClick={() => onRemove(slot.id)} aria-label={`Remove ${slot.label}`} className="text-slate-500 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-4 text-sm transition-colors ${
            error ? 'border-destructive bg-red-50 text-destructive'
              : dragging ? 'border-primary bg-primary/5 text-primary'
              : 'border-slate-300 bg-white text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          <Upload className="h-4 w-4" /> Choose PDF or drag it here
        </button>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function ApplyModal({ open, onClose, defaultCourse = '' }) {
  const [academicStatus, setAcademicStatus] = useAcademicStatus();
  const [details, setDetails] = useState({ fullName: '', email: '', phone: '' });
  const [course, setCourse] = useState(defaultCourse);
  const [years, setYears] = useState(3);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);
  const scrollRef = useRef(null);

  const available = useMemo(() => coursesAvailableFor(academicStatus), [academicStatus]);
  const slots = getSlots(academicStatus, years);

  // Autofill name, email and phone from the signed-in student's account
  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => response.json())
      .then((result) => {
        if (!active || !result.authenticated) return;
        const profile = result.user?.profile || {};
        setDetails((prev) => ({
          fullName: prev.fullName || profile.fullName || '',
          email: prev.email || result.user?.email || '',
          phone: prev.phone || profile.phone || '',
        }));
      })
      .catch(() => {}); // not signed in or API offline: the form still works
    return () => { active = false; };
  }, [open]);

  // Keep the selected course valid for the chosen academic background
  useEffect(() => {
    if (!open) return;
    const names = available.map(courseLabel);
    setCourse((current) =>
      names.includes(current) ? current : names.includes(defaultCourse) ? defaultCourse : names[0] || ''
    );
  }, [open, available, defaultCourse]);

  // Lock page scroll and close on Escape while open
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && !submitting && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  const setError = (key, message) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[key] = message; else delete next[key];
      return next;
    });

  const handleClose = () => {
    if (submitting) return;
    if (done) {
      setDone(false); setFiles({}); setAgreed(false); setErrors({}); setSubmitError('');
    }
    onClose();
  };

  const handleStatusChange = (value) => {
    setAcademicStatus(value); // saved, so the Courses page and Enquire form follow
    setFiles({});             // documents belong to the selected background only
    setErrors({});
  };

  const handleSelect = async (slotId, file) => {
    const problem = await validatePdf(file);
    if (problem) {
      setFiles((prev) => { const next = { ...prev }; delete next[slotId]; return next; });
      setError(slotId, problem);
      return;
    }
    setFiles((prev) => ({ ...prev, [slotId]: file }));
    setError(slotId, null);
  };

  const handleRemove = (slotId) => {
    setFiles((prev) => { const next = { ...prev }; delete next[slotId]; return next; });
    setError(slotId, null);
  };

  const validate = () => {
    const next = {};
    if (details.fullName.trim().length < 2) next.fullName = 'Please enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(details.email.trim())) next.email = 'Enter a valid email address.';
    const phoneProblem = validatePhone(details.phone);
    if (!details.phone) next.phone = 'Enter your phone number.';
    else if (phoneProblem || !/^\+[1-9]\d{7,14}$/.test(details.phone)) next.phone = phoneProblem || 'Enter a valid phone number.';
    if (!academicStatus) next.status = 'Please select your academic background.';
    if (academicStatus && !course) next.course = 'Please select a course.';
    slots.forEach((slot) => {
      if (!files[slot.id]) next[slot.id] = errors[slot.id] || 'This document is required.';
    });
    const totalBytes = slots.reduce((sum, slot) => sum + (files[slot.id]?.size || 0), 0);
    if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
      next.total = `Total size of all PDFs must be under ${MAX_TOTAL_MB} MB. Please compress some files.`;
    }
    if (!agreed) next.agreed = 'Please confirm to continue.';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() =>
        scrollRef.current?.querySelector('[data-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitApplication({
        details: {
          fullName: details.fullName.trim(),
          email: details.email.trim(),
          phone: details.phone,
          academicStatus,
          course,
          years: academicStatus === 'graduate' ? years : '',
        },
        documents: slots.map((s) => ({ id: s.id, label: s.label, file: files[s.id] })),
      });
      setDone(true);
    } catch (err) {
      setSubmitError(
        err instanceof TypeError
          ? 'We could not reach the server. Please check your connection and try again.'
          : err.message || 'We could not submit your application. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (key) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-ring ${
      errors[key] ? 'border-destructive' : 'border-slate-300'
    }`;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-title"
        className="relative flex max-h-[95vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="apply-title" className="text-xl font-semibold text-foreground">Apply to ISATS</h2>
            <p className="text-sm text-muted-foreground">Choose your course and upload your documents.</p>
          </div>
          <button type="button" onClick={handleClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" />
            <h3 className="mb-2 text-xl font-semibold">Application received</h3>
            <p className="mx-auto mb-6 max-w-md text-muted-foreground">
              Thank you, {details.fullName.split(' ')[0]}. Our admissions team will verify your documents and contact you
              shortly.
            </p>
            <button type="button" onClick={handleClose} className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-col">
            <div ref={scrollRef} className="space-y-6 overflow-y-auto px-6 py-5">
              {/* Contact details (autofilled when signed in) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2" data-invalid={!!errors.fullName}>
                  <label htmlFor="apply-name" className="mb-1.5 block text-sm font-medium">Full name <span className="text-destructive">*</span></label>
                  <input id="apply-name" type="text" autoComplete="name" value={details.fullName} onChange={(e) => setDetails({ ...details, fullName: e.target.value })} placeholder="Enter your full name" className={fieldClass('fullName')} />
                  {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
                </div>
                <div data-invalid={!!errors.email}>
                  <label htmlFor="apply-email" className="mb-1.5 block text-sm font-medium">Email address <span className="text-destructive">*</span></label>
                  <input id="apply-email" type="email" autoComplete="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} placeholder="your.email@example.com" className={fieldClass('email')} />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
                <div data-invalid={!!errors.phone}>
                  <label htmlFor="apply-phone" className="mb-1.5 block text-sm font-medium">Phone number <span className="text-destructive">*</span></label>
                  <PhoneInput id="apply-phone" value={details.phone} onChange={(phone) => { setDetails((d) => ({ ...d, phone })); setError('phone', null); }} error={errors.phone} />
                </div>
              </div>

              {/* Academic background */}
              <fieldset data-invalid={!!errors.status}>
                <legend className="mb-2 text-sm font-medium">Academic background <span className="text-destructive">*</span></legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {ACADEMIC_OPTIONS.map((opt) => {
                    const selected = academicStatus === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`cursor-pointer rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                          selected ? 'border-primary bg-primary/5' : errors.status ? 'border-destructive' : 'border-slate-200 hover:border-primary/50'
                        }`}
                      >
                        <input type="radio" name="applyAcademicStatus" value={opt.value} checked={selected} onChange={() => handleStatusChange(opt.value)} className="sr-only" />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
                {errors.status && <p className="mt-1 text-xs text-destructive">{errors.status}</p>}
              </fieldset>

              {/* Course */}
              <div data-invalid={!!errors.course}>
                <label htmlFor="apply-course" className="mb-1.5 block text-sm font-medium">Course <span className="text-destructive">*</span></label>
                <select id="apply-course" value={course} onChange={(e) => setCourse(e.target.value)} disabled={!academicStatus} className={`${fieldClass('course')} disabled:bg-slate-50`}>
                  {!academicStatus && <option value="">Select your academic background first</option>}
                  {available.map((c) => (
                    <option key={courseLabel(c)} value={courseLabel(c)}>
                      {courseLabel(c)}{academicStatus === 'tenth' && /laser/i.test(courseLabel(c)) ? ' (hair reduction only)' : ''}
                    </option>
                  ))}
                </select>
                {errors.course && <p className="mt-1 text-xs text-destructive">{errors.course}</p>}
              </div>

              {/* Documents */}
              {academicStatus && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold">Upload documents</h3>
                    <p className="text-xs text-muted-foreground">PDF only, up to {MAX_FILE_MB} MB per file ({MAX_TOTAL_MB} MB in total).</p>
                  </div>

                  {academicStatus === 'graduate' && (
                    <div>
                      <label htmlFor="apply-years" className="mb-1.5 block text-sm font-medium">Years in your degree / diploma</label>
                      <select
                        id="apply-years"
                        value={years}
                        onChange={(e) => { setYears(Number(e.target.value)); setErrors({}); }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-48"
                      >
                        {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>)}
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">Upload one marksheet for every year, plus your final certificate.</p>
                    </div>
                  )}

                  {slots.map((slot) => (
                    <div key={slot.id} data-invalid={!!errors[slot.id]}>
                      <FileSlot slot={slot} file={files[slot.id]} error={errors[slot.id]} onSelect={handleSelect} onRemove={handleRemove} />
                    </div>
                  ))}
                </div>
              )}

              {/* Consent */}
              <div data-invalid={!!errors.agreed}>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
                  <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError('agreed', null); }} className="mt-0.5 h-4 w-4" />
                  <span>
                    I confirm the documents are genuine and agree to their processing as described in the{' '}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</a>.
                  </span>
                </label>
                {errors.agreed && <p className="mt-1 text-xs text-destructive">{errors.agreed}</p>}
              </div>

              {errors.total && (
                <p data-invalid="true" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">{errors.total}</p>
              )}
              {submitError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">{submitError}</p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 rounded-b-2xl border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleClose} disabled={submitting} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
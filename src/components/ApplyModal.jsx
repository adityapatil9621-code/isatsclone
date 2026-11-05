import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileText, CheckCircle2, Trash2, Plus, Loader2 } from 'lucide-react';
import { submitApplication } from '@/lib/applicationApi.js';

const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const MAX_TOTAL_MB = 15;

const STATUS_OPTIONS = [
  { value: 'tenth', title: '10th pass', hint: 'Secondary school certificate' },
  { value: 'twelfth', title: '12th pass', hint: 'Higher secondary certificate' },
  { value: 'graduate', title: 'Graduate', hint: 'Degree completed' },
];

const GRADUATE_YEAR_SLOTS = [
  { id: 'degreeMarksheet1', label: 'First year marksheet' },
  { id: 'degreeMarksheet2', label: 'Second year marksheet' },
  { id: 'degreeMarksheet3', label: 'Third year marksheet' },
  { id: 'degreeMarksheet4', label: 'Fourth year marksheet' },
];

const getRequiredSlots = (status, extraCount) => {
  if (status === 'tenth') return [{ id: 'tenthCertificate', label: '10th passing certificate' }];
  if (status === 'twelfth') return [{ id: 'twelfthCertificate', label: '12th passing certificate' }];
  if (status === 'graduate') {
    const extras = Array.from({ length: extraCount }, (_, i) => ({
      id: `degreeMarksheetExtra${i + 1}`,
      label: `Additional marksheet ${i + 1}`,
      optional: true,
    }));
    return [
      { id: 'degreeCertificate', label: 'Degree completion certificate' },
      ...GRADUATE_YEAR_SLOTS,
      ...extras,
    ];
  }
  return [];
};

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Checks extension/type, size and the real "%PDF-" file signature
async function validatePdf(file) {
  const looksLikePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!looksLikePdf) return 'Only PDF files are allowed.';
  if (file.size > MAX_FILE_BYTES) return `File is too large. Maximum size is ${MAX_FILE_MB} MB.`;
  if (file.size === 0) return 'This file is empty.';
  const header = await file.slice(0, 5).text();
  if (header !== '%PDF-') return 'This file is not a valid PDF.';
  return null;
}

function FileSlot({ slot, file, error, onSelect, onRemove }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList) => {
    const picked = fileList && fileList[0];
    if (picked) onSelect(slot.id, picked);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground">
          {slot.label}
          {slot.optional ? (
            <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
          ) : (
            <span className="text-destructive"> *</span>
          )}
        </span>
        {slot.optional && (
          <button
            type="button"
            onClick={() => onRemove(slot.id, true)}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        )}
      </div>

      {/* Hidden native input: clicking the button opens the computer's file explorer */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = ''; // allow re-selecting the same file
        }}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2.5">
          <FileText className="h-5 w-5 text-green-700 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-primary hover:underline"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onRemove(slot.id)}
            aria-label={`Remove ${slot.label}`}
            className="text-slate-500 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-4 text-sm transition-colors ${
            error
              ? 'border-destructive bg-red-50 text-destructive'
              : dragging
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-slate-300 bg-white text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          <Upload className="h-4 w-4" />
          Choose PDF or drag it here
        </button>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function ApplyModal({ open, onClose }) {
  const [details, setDetails] = useState({ fullName: '', phone: '', email: '' });
  const [status, setStatus] = useState('');
  const [files, setFiles] = useState({});
  const [extraCount, setExtraCount] = useState(0);
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);
  const scrollRef = useRef(null);

  // If the visitor is signed in, prefill their details from their ISATS account
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
          phone: prev.phone || profile.phone || '',
          email: prev.email || result.user?.email || '',
        }));
      })
      .catch(() => {}); // not signed in / API offline: the form still works
    return () => {
      active = false;
    };
  }, [open]);

  // Lock page scroll + close on Escape while open
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && !submitting && onClose();
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, submitting, onClose]);

  const resetAll = () => {
    setDetails({ fullName: '', phone: '', email: '' });
    setStatus('');
    setFiles({});
    setExtraCount(0);
    setErrors({});
    setAgreed(false);
    setSubmitError('');
    setDone(false);
  };

  const handleClose = () => {
    if (submitting) return;
    if (done) resetAll();
    onClose();
  };

  if (!open) return null;

  const slots = getRequiredSlots(status, extraCount);

  const setError = (key, message) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });

  const handleSelect = async (slotId, file) => {
    const problem = await validatePdf(file);
    if (problem) {
      setFiles((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      setError(slotId, problem);
      return;
    }
    setFiles((prev) => ({ ...prev, [slotId]: file }));
    setError(slotId, null);
  };

  const handleRemove = (slotId, removeSlot = false) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    setError(slotId, null);
    if (removeSlot) setExtraCount((c) => Math.max(0, c - 1));
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setFiles({}); // documents belong to the selected status only
    setExtraCount(0);
    setErrors((prev) => ({ ...prev, status: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!details.fullName.trim()) next.fullName = 'Please enter your full name.';
    if (!/^[+\d][\d\s-]{8,14}$/.test(details.phone.trim())) next.phone = 'Enter a valid phone number.';
    if (!/^\S+@\S+\.\S+$/.test(details.email.trim())) next.email = 'Enter a valid email address.';
    if (!status) next.status = 'Please select your academic status.';
    slots.forEach((slot) => {
      if (!slot.optional && !files[slot.id]) next[slot.id] = 'This document is required.';
      else if (errors[slot.id] && !files[slot.id]) next[slot.id] = errors[slot.id];
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
      requestAnimationFrame(() => {
        scrollRef.current?.querySelector('[data-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitApplication({
        details: {
          fullName: details.fullName.trim(),
          phone: details.phone.trim(),
          email: details.email.trim(),
          academicStatus: status,
        },
        documents: slots.filter((s) => files[s.id]).map((s) => ({ id: s.id, label: s.label, file: files[s.id] })),
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
    `w-full h-10 rounded-lg border px-3 text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-ring ${
      errors[key] ? 'border-destructive' : 'border-slate-300'
    }`;

  const graduateMarksheetSlots = slots.filter((s) => s.id.startsWith('degreeMarksheet'));
  const otherSlots = slots.filter((s) => !s.id.startsWith('degreeMarksheet'));

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-title"
        className="relative w-full sm:max-w-2xl max-h-[95vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="apply-title" className="text-xl font-semibold text-foreground">
              Apply to ISATS
            </h2>
            <p className="text-sm text-muted-foreground">Tell us about your education and upload your documents.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Application received</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Thank you, {details.fullName.split(' ')[0]}. Our admissions team will review your documents and contact
              you shortly.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col min-h-0">
            <div ref={scrollRef} className="overflow-y-auto px-6 py-5 space-y-6">
              {/* Contact details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2" data-invalid={!!errors.fullName}>
                  <label htmlFor="apply-name" className="block text-sm font-medium mb-1.5">
                    Full name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="apply-name"
                    type="text"
                    value={details.fullName}
                    onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className={fieldClass('fullName')}
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
                </div>
                <div data-invalid={!!errors.phone}>
                  <label htmlFor="apply-phone" className="block text-sm font-medium mb-1.5">
                    Phone number <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="apply-phone"
                    type="tel"
                    value={details.phone}
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className={fieldClass('phone')}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div data-invalid={!!errors.email}>
                  <label htmlFor="apply-email" className="block text-sm font-medium mb-1.5">
                    Email address <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="apply-email"
                    type="email"
                    value={details.email}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className={fieldClass('email')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              {/* Academic status */}
              <fieldset data-invalid={!!errors.status}>
                <legend className="text-sm font-medium mb-2">
                  Academic status <span className="text-destructive">*</span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {STATUS_OPTIONS.map((opt) => {
                    const selected = status === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`cursor-pointer rounded-xl border-2 px-4 py-3 transition-colors ${
                          selected
                            ? 'border-primary bg-primary/5'
                            : errors.status
                            ? 'border-destructive'
                            : 'border-slate-200 hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="academicStatus"
                          value={opt.value}
                          checked={selected}
                          onChange={() => handleStatusChange(opt.value)}
                          className="sr-only"
                        />
                        <span className="block text-sm font-semibold text-foreground">{opt.title}</span>
                        <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.status && <p className="mt-1 text-xs text-destructive">{errors.status}</p>}
              </fieldset>

              {/* Documents */}
              {status && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold">Upload documents</h3>
                    <p className="text-xs text-muted-foreground">
                      PDF only, up to {MAX_FILE_MB} MB per file ({MAX_TOTAL_MB} MB in total).
                    </p>
                  </div>

                  {otherSlots.map((slot) => (
                    <div key={slot.id} data-invalid={!!errors[slot.id]}>
                      <FileSlot
                        slot={slot}
                        file={files[slot.id]}
                        error={errors[slot.id]}
                        onSelect={handleSelect}
                        onRemove={handleRemove}
                      />
                    </div>
                  ))}

                  {status === 'graduate' && (
                    <div className="rounded-xl border border-slate-200 p-4 space-y-4 bg-slate-50">
                      <div>
                        <h4 className="text-sm font-semibold">Degree marksheets</h4>
                        <p className="text-xs text-muted-foreground">
                          Upload a marksheet for every year of your degree. A minimum of 4 is required.
                        </p>
                      </div>
                      {graduateMarksheetSlots.map((slot) => (
                        <div key={slot.id} data-invalid={!!errors[slot.id]}>
                          <FileSlot
                            slot={slot}
                            file={files[slot.id]}
                            error={errors[slot.id]}
                            onSelect={handleSelect}
                            onRemove={(id, removeSlot) => {
                              // removing an extra slot shifts nothing else because extras are re-indexed below
                              handleRemove(id, false);
                              if (removeSlot) {
                                const index = Number(id.replace('degreeMarksheetExtra', ''));
                                setFiles((prev) => {
                                  const next = { ...prev };
                                  for (let i = index; i < extraCount; i += 1) {
                                    const following = next[`degreeMarksheetExtra${i + 1}`];
                                    if (following) next[`degreeMarksheetExtra${i}`] = following;
                                    else delete next[`degreeMarksheetExtra${i}`];
                                  }
                                  delete next[`degreeMarksheetExtra${extraCount}`];
                                  return next;
                                });
                                setExtraCount((c) => Math.max(0, c - 1));
                              }
                            }}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setExtraCount((c) => c + 1)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <Plus className="h-4 w-4" /> Add another marksheet
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Consent */}
              <div data-invalid={!!errors.agreed}>
                <label className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      setError('agreed', null);
                    }}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    I confirm the documents are genuine and agree to their processing as described in the{' '}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
                {errors.agreed && <p className="mt-1 text-xs text-destructive">{errors.agreed}</p>}
              </div>

              {errors.total && (
                <p data-invalid="true" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-destructive">
                  {errors.total}
                </p>
              )}

              {submitError && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
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

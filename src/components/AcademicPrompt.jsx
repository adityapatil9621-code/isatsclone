import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ACADEMIC_OPTIONS, useAcademicStatus } from '@/lib/academicStatus.js';

export default function AcademicPrompt() {
  const [status, setStatus] = useAcademicStatus();
  const [open, setOpen] = useState(false);

  // Ask 5 seconds after the page opens, only if no background is saved yet
  useEffect(() => {
    if (status) return undefined;
    const timer = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const current = ACADEMIC_OPTIONS.find((o) => o.value === status);

  return (
    <>
      {current && (
        <p className="text-sm text-muted-foreground mt-4">
          Showing courses for: <strong>{current.label}</strong>{' '}
          <button type="button" className="text-primary underline" onClick={() => setOpen(true)}>Change</button>
        </p>
      )}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-foreground">Please select your academic background</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                We'll show the courses that suit you and fill this in when you apply.
              </p>
              <div className="grid gap-3">
                {ACADEMIC_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { setStatus(o.value); setOpen(false); }}
                    className={`rounded-xl border-2 px-4 py-3 text-left font-medium transition-colors hover:border-primary ${
                      status === o.value ? 'border-primary bg-primary/5' : 'border-slate-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="mt-4 text-sm text-muted-foreground hover:underline">
                Skip for now
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
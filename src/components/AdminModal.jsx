import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AdminPanel } from '@/pages/Admin.jsx';

export default function AdminModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.assign('/');
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-title"
        className="w-full max-w-6xl max-h-[95vh] flex flex-col rounded-none sm:rounded-2xl bg-[#f6f7f8] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white sm:rounded-t-2xl">
          <div>
            <p className="auth-eyebrow" style={{ margin: 0 }}>ADMIN</p>
            <h2 id="admin-title" className="text-xl font-semibold text-foreground">Course enquiries</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="auth-secondary" onClick={logout}>Sign out</button>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6">
          <AdminPanel />
        </div>
      </div>
    </div>,
    document.body,
  );
}

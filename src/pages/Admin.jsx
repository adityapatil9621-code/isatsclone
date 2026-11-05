import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { titanMailLink } from '@/data/contactInfo.js';

const fmt = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const STATUS_LABELS = { new: 'New', contacted: 'Contacted', follow_up: 'Follow-up', converted: 'Converted', closed: 'Closed' };
const digits = (value) => String(value || '').replace(/\D/g, '');

export function AdminPanel() {
  const [enquiries, setEnquiries] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [users, setUsers] = useState([]);

  async function loadEnquiries() {
    setError('');
    const response = await fetch('/api/admin/enquiries', { credentials: 'include' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load course enquiries.');
    setEnquiries(result.enquiries || []);
  }

  async function loadUsers() {
    const response = await fetch('/api/admin/users', { credentials: 'include' });
    const result = await response.json();
    if (response.ok) setUsers(result.users || []);
  }

  useEffect(() => {
    let active = true;
    fetch('/api/admin/enquiries', { credentials: 'include' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load course enquiries.');
        if (active) setEnquiries(result.enquiries || []);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    loadUsers().catch(() => {});
    return () => { active = false; };
  }, []);

  // An enquiry's email = the registered user who saved the same phone number
  const emailByPhone = useMemo(() => {
    const map = new Map();
    users.forEach((u) => { const d = digits(u.phone); if (d) map.set(d, u.email); });
    return map;
  }, [users]);
  const emailOf = (item) => emailByPhone.get(digits(item.phone)) || '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enquiries.filter((item) => {
      const matchesQuery = !q || [item.fullName, item.phone, item.interestedCourse, emailOf(item)].some((v) => (v || '').toLowerCase().includes(q));
      return matchesQuery && (statusFilter === 'all' || item.status === statusFilter);
    });
  }, [enquiries, query, statusFilter, emailByPhone]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id, status) {
    setUpdatingId(id); setError('');
    try {
      const response = await fetch(`/api/admin/enquiries/${id}/status`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update status.');
      setEnquiries((current) => current.map((item) => item.id === id ? { ...item, status: result.enquiry.status } : item));
    } catch (err) { setError(err.message); }
    finally { setUpdatingId(''); }
  }

  const counts = {
    total: enquiries.length,
    new: enquiries.filter((item) => item.status === 'new').length,
    followUp: enquiries.filter((item) => item.status === 'follow_up').length,
    converted: enquiries.filter((item) => item.status === 'converted').length,
  };

  return (
    <>
      {error && <p className="auth-message auth-error" role="alert">{error}</p>}
      <div className="admin-stats">
        {[["Total enquiries", counts.total], ["New", counts.new], ["Follow-up", counts.followUp], ["Converted", counts.converted], ["Registered users", users.length]].map(([label, value]) => (
          <div key={label} className="profile-panel admin-stat"><strong>{value}</strong><span>{label}</span></div>
        ))}
      </div>
      <section className="profile-panel">
        <div className="profile-panel-heading" style={{ flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Course enquiries ({filtered.length})</h2>
          <div className="flex flex-wrap gap-2">
            <input type="search" className="admin-search" placeholder="Search name, phone, email or course" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="admin-search" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button type="button" className="auth-secondary" onClick={() => { loadUsers().catch(() => {}); setLoading(true); loadEnquiries().catch((err) => setError(err.message)).finally(() => setLoading(false)); }}>Refresh</button>
          </div>
        </div>
        {loading ? <p className="auth-loading">Loading enquiries…</p> : filtered.length === 0 ? <p className="auth-loading">No enquiries found.</p> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Interested course</th><th>Received</th><th>Status</th><th>Contact</th></tr></thead>
              <tbody>{filtered.map((item) => {
                const email = emailOf(item);
                return (
                  <tr key={item.id}>
                    <td>{item.fullName}</td>
                    <td className="whitespace-nowrap">{item.phone}</td>
                    <td>
                      {email
                        ? <a className="text-primary hover:underline" href={titanMailLink(email, item.fullName, item.interestedCourse)} title="Open in Titan Mail">{email}</a>
                        : '—'}
                    </td>
                    <td>{item.interestedCourse}</td>
                    <td className="whitespace-nowrap">{fmt(item.createdAt)}</td>
                    <td>
                      <select aria-label={`Status for ${item.fullName}`} disabled={updatingId === item.id} value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
                        {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </td>
                    <td><a className="text-green-700 font-medium hover:underline" href={`https://wa.me/${item.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="profile-panel" style={{ marginTop: 18 }}>
        <div className="profile-panel-heading">
          <h2 style={{ margin: 0 }}>Registered users ({users.length})</h2>
        </div>
        {users.length === 0 ? <p className="auth-loading">No users yet.</p> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Login method</th><th>Joined</th><th>Last login</th></tr></thead>
              <tbody>{users.map((u) => {
                const isNew = Date.now() - new Date(u.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
                return (
                  <tr key={u.id}>
                    <td>{u.fullName || '—'}{isNew && <span className="admin-pill ok">New</span>}</td>
                    <td><a className="text-primary hover:underline" href={titanMailLink(u.email, u.fullName)} title="Open in Titan Mail">{u.email}</a></td>
                    <td className="whitespace-nowrap">{u.phone || '—'}</td>
                    <td>{(u.providers || []).join(', ') || '—'}</td>
                    <td className="whitespace-nowrap">{fmt(u.createdAt)}</td>
                    <td className="whitespace-nowrap">{fmt(u.lastLogin)}{u.activeSessions > 0 && <span className="admin-pill ok">online</span>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    navigate('/login', { replace: true });
  }
  return (
    <main className="profile-page">
      <div className="profile-shell admin-shell">
        <header className="profile-header">
          <Link to="/" className="auth-brand">ISATS</Link>
          <div><p className="auth-eyebrow">ADMIN</p><h1>Course enquiries</h1></div>
          <button type="button" className="auth-secondary" onClick={logout}>Sign out</button>
        </header>
        <AdminPanel />
      </div>
    </main>
  );
}
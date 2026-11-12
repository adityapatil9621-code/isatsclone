import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import AdminModal from '@/components/AdminModal.jsx';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldOpenAdmin = location.state?.openAdmin === true;

  useEffect(() => {
    let active = true;
    async function checkAuthentication() {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        const result = await response.json();
        if (!active) return;
        const authenticated = Boolean(result.authenticated);
        const admin = Boolean(authenticated && result.user?.isAdmin);
        setIsAuthenticated(authenticated);
        setIsAdmin(admin);
        if (admin && shouldOpenAdmin) {
          setAdminOpen(true);
          navigate(location.pathname, { replace: true, state: null });
        }
      } catch {
        if (!active) return;
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    }
    checkAuthentication();
    return () => { active = false; };
  }, [location.pathname, shouldOpenAdmin, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  const nav = [['Home', '/'], ['About', '/about'], ['Courses', '/courses'], ['Contact', '/contact']];
  const linkClass = ({ isActive }) => `isats-nav-link${isActive ? ' is-active' : ''}`;

  return (
    <>
      <header className="isats-header">
        <div className="isats-header-inner">
          <Link to="/" aria-label="ISATS home" className="isats-brand">
            <img src="/isats-logo.jpeg" alt="ISATS - Institute of Skill-based Aesthetic & Trichology Sciences" />
          </Link>

          <nav aria-label="Main navigation" className="isats-desktop-nav">
            {nav.map(([label, path]) => <NavLink key={path} to={path} end={path === '/'} className={linkClass}>{label}</NavLink>)}
            {!isAuthenticated && <>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <Link to="/register" className="isats-nav-cta">Get started <ArrowUpRight size={15} /></Link>
            </>}
            {isAuthenticated && !isAdmin && <Link to="/profile" className="isats-nav-cta">My profile <ArrowUpRight size={15} /></Link>}
            {isAdmin && <button type="button" className="isats-nav-link" onClick={() => setAdminOpen(true)}>Admin</button>}
            {!isAdmin && <NavLink to="/admin/login" className={linkClass}>Admin</NavLink>}
          </nav>

          <button
            type="button"
            className="isats-menu-toggle"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="isats-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        <div id="isats-mobile-navigation" className={`isats-mobile-nav${mobileOpen ? ' is-open' : ''}`} aria-hidden={!mobileOpen}>
          <nav aria-label="Mobile navigation">
            {nav.map(([label, path]) => <NavLink key={path} to={path} end={path === '/'} className={linkClass}>{label}</NavLink>)}
            {!isAuthenticated && <>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <Link to="/register" className="isats-nav-cta">Create an account <ArrowUpRight size={15} /></Link>
            </>}
            {isAuthenticated && !isAdmin && <Link to="/profile" className="isats-nav-cta">My profile <ArrowUpRight size={15} /></Link>}
            {isAdmin && <button type="button" className="isats-nav-link" onClick={() => { setAdminOpen(true); setMobileOpen(false); }}>Admin</button>}
            {!isAdmin && <NavLink to="/admin/login" className={linkClass}>Admin</NavLink>}
          </nav>
        </div>
      </header>
      <AdminModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import AdminModal from '@/components/AdminModal.jsx';
import { useAuth } from '@/context/AuthContext.jsx';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, isAdmin, loading } = useAuth();

  const [adminOpen, setAdminOpen] = useState(false);

  const shouldOpenAdmin = location.state?.openAdmin === true;

  useEffect(() => {
    if (isAdmin && shouldOpenAdmin) {
      setAdminOpen(true);

      navigate(location.pathname, {
        replace: true,
        state: null
      });
    }
  }, [
    isAdmin,
    shouldOpenAdmin,
    location.pathname,
    navigate
  ]);

  const nav = [
    ['Home', '/'],
    ['About', '/about'],
    ['Courses', '/courses'],
    ['Contact', '/contact']
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 flex items-center justify-between gap-4">

        <Link
          to="/"
          aria-label="ISATS home"
          className="flex items-center shrink-0"
        >
          <img
            src="/isats-logo.jpeg"
            alt="ISATS - International School of Aesthetic & Trichology Science"
            className="h-11 w-auto"
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex flex-wrap justify-end gap-2 sm:gap-6 items-center"
        >
          {nav.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `text-sm font-medium ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {/* Avoid displaying incorrect authentication links while checking. */}
          {!loading && !isAuthenticated && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `isats-login-nav ${isActive ? 'is-active' : ''}`
                }
              >
                Login
              </NavLink>

              <Link
                to="/register"
                className="isats-login-nav"
              >
                Register
              </Link>
            </>
          )}

          {!loading && isAuthenticated && !isAdmin && (
            <Link
              to="/profile"
              className="isats-login-nav"
            >
              My Profile
            </Link>
          )}

          {!loading && isAdmin && (
            <button
              type="button"
              className="isats-login-nav"
              onClick={() => setAdminOpen(true)}
            >
              Admin
            </button>
          )}

          {!loading && !isAdmin && (
            <NavLink
              to="/admin/login"
              className={({ isActive }) =>
                `isats-login-nav ${isActive ? 'is-active' : ''}`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>
      </div>

      <AdminModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
      />
    </header>
  );
}
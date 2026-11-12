import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

let pendingTransitionOrigin = null;

export function consumeTransitionOrigin() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  return pendingTransitionOrigin;
}

export function clearTransitionOrigin() {
  pendingTransitionOrigin = null;
}

const REVEAL_TARGETS = [
  '.isats-inner-section-heading',
  '.isats-contact-card',
  '.isats-why-card',
  '.isats-mission-card',
  '.isats-course-category',
  '.isats-about-intro > div',
  '.isats-contact-map-frame',
  '.isats-highlight-card',
  '.isats-intro-section > *',
  '.isats-vision-panel'
].join(',');

export default function MotionEnhancements() {
  const location = useLocation();

  useEffect(() => {
    const rememberOrigin = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : event.target?.parentElement;
      const link = target?.closest('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      const rect = link.getBoundingClientRect();
      pendingTransitionOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, scrollY: window.scrollY, path: destination.pathname };
    };
    document.addEventListener('click', rememberOrigin, true);
    return () => document.removeEventListener('click', rememberOrigin, true);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const targets = document.querySelectorAll(REVEAL_TARGETS);
    if (!targets.length || !('IntersectionObserver' in window)) return undefined;

    targets.forEach((element, index) => {
      element.classList.add('isats-reveal-pending');
      element.style.setProperty('--isats-reveal-delay', `${(index % 4) * 75}ms`);
    });

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('isats-revealed');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -45px 0px' });

    targets.forEach((element) => observer.observe(element));

    const header = document.querySelector('.isats-header');
    const updateHeader = () => {
      if (header) header.classList.toggle('isats-header-scrolled', window.scrollY > 18);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateHeader);
      targets.forEach((element) => {
        element.classList.remove('isats-reveal-pending', 'isats-revealed');
        element.style.removeProperty('--isats-reveal-delay');
      });
    };
  }, [location.pathname]);

  return null;
}

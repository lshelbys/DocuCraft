/* ==========================================================================
   DocuCraft — app-shell touch behavior, shared by every page.
   Blocks zoom gestures that the viewport meta tag can't (iOS Safari ignores
   user-scalable=no), so the site behaves like an installed app on mobile.
   ========================================================================== */
(function () {
  'use strict';

  // iOS Safari pinch-zoom fires gesture* events and ignores user-scalable=no.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (type) {
    document.addEventListener(type, function (e) { e.preventDefault(); }, { passive: false });
  });

  // Chrome/Android (and iOS, belt-and-suspenders): a second finger means a
  // pinch — cancel it. Single-touch scrolling and canvas dragging are untouched.
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // Block the iOS double-tap-to-zoom that touch-action can miss, without
  // swallowing ordinary taps (only suppresses the second tap within 300ms).
  var lastTap = 0;
  document.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTap <= 300 && e.touches.length === 0) e.preventDefault();
    lastTap = now;
  }, { passive: false });
})();

// Shared logic for theme, logo animation, and action tracking
document.addEventListener('DOMContentLoaded', function() {
  const activeTheme = localStorage.getItem('theme') || 'light';
  if (activeTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); }
      else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
      resetLogoLetters();
    });
  }

  let activeStaggerTimeouts = [];
  function resetLogoLetters() {
    activeStaggerTimeouts.forEach(clearTimeout); activeStaggerTimeouts = [];
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('.logo-letter').forEach(l => { l.style.color = isDark ? '#f7f6f2' : '#1a1a18'; });
  }

  const logoLink = document.querySelector('.header-logo');
  if (logoLink) {
    const letters = document.querySelectorAll('.logo-letter');
    logoLink.addEventListener('mouseenter', () => {
      activeStaggerTimeouts.forEach(clearTimeout); activeStaggerTimeouts = [];
      letters.forEach((letter, index) => {
        const id = setTimeout(() => { letter.style.color = `hsl(${Math.floor(Math.random()*360)}, 85%, 75%)`; }, index * 120);
        activeStaggerTimeouts.push(id);
      });
    });
    logoLink.addEventListener('mouseleave', resetLogoLetters);
  }
});

window.incrementActionStats = function() {
  const count = parseInt(localStorage.getItem('docucraft_actions_total_count') || '0');
  localStorage.setItem('docucraft_actions_total_count', count + 1);
};

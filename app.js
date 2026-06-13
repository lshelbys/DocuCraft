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

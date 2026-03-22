// Mobile Navigation — bypasses greedy-nav on narrow screens
(function () {
  'use strict';

  function initMobileNav() {
    if (window.innerWidth > 768) return;

    var nav       = document.getElementById('site-nav');
    var btn       = nav && nav.querySelector('.greedy-nav__toggle');
    var hlinks    = nav && nav.querySelector('.hidden-links');
    var vlinks    = nav && nav.querySelector('.visible-links');

    if (!nav || !btn || !hlinks || !vlinks) return;

    // Remove greedy-nav's click handler so it doesn't double-toggle
    if (window.jQuery) {
      jQuery(btn).off('click');
    }

    // Populate hidden-links by cloning from visible-links (one-time)
    if (hlinks.children.length === 0) {
      Array.from(vlinks.children).forEach(function (item) {
        hlinks.appendChild(item.cloneNode(true));
      });
    }

    var isOpen = false;

    function openMenu() {
      hlinks.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
      isOpen = true;
    }

    function closeMenu() {
      hlinks.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      isOpen = false;
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !nav.contains(e.target)) closeMenu();
    });

    hlinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (isOpen && (e.key === 'Escape' || e.keyCode === 27)) {
        closeMenu();
        btn.focus();
      }
    });
  }

  // Run after main.min.js (which includes greedy-nav) has executed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();
// Mobile Navigation — works with the redesigned greedy-nav markup
(function () {
  'use strict';

  function initMobileNav() {
    var nav        = document.querySelector('.greedy-nav');
    var toggleBtn  = nav && nav.querySelector('.greedy-nav__toggle');
    var hiddenLinks = nav && nav.querySelector('.hidden-links');

    if (!nav || !toggleBtn || !hiddenLinks) return;

    // Populate hidden-links from the visible-links so the server-rendered
    // list is the single source of truth (no hardcoded duplicates).
    var visibleItems = nav.querySelectorAll('.visible-links .masthead__menu-item');
    if (hiddenLinks.children.length === 0 && visibleItems.length > 0) {
      visibleItems.forEach(function (item) {
        var clone = item.cloneNode(true);
        hiddenLinks.appendChild(clone);
      });
    }

    var isOpen = false;

    function openMenu() {
      hiddenLinks.classList.remove('hidden');
      toggleBtn.setAttribute('aria-expanded', 'true');
      isOpen = true;
    }

    function closeMenu() {
      hiddenLinks.classList.add('hidden');
      toggleBtn.setAttribute('aria-expanded', 'false');
      isOpen = false;
    }

    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    // Close when clicking outside the nav
    document.addEventListener('click', function (e) {
      if (isOpen && !nav.contains(e.target)) {
        closeMenu();
      }
    });

    // Close when a link inside the dropdown is followed
    hiddenLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        closeMenu();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (isOpen && (e.key === 'Escape' || e.keyCode === 27)) {
        closeMenu();
        toggleBtn.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();

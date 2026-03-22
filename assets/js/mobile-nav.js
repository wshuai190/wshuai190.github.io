// Mobile Navigation — takes over from greedy-nav on narrow screens
(function () {
  'use strict';

  function initMobileNav() {
    if (window.innerWidth > 768) return;

    var nav    = document.getElementById('site-nav');
    var btn    = nav && nav.querySelector('.greedy-nav__toggle');
    var hlinks = nav && nav.querySelector('.hidden-links');
    var vlinks = nav && nav.querySelector('.visible-links');

    if (!nav || !btn || !hlinks || !vlinks) return;

    // Clone the button to strip ALL existing event handlers (jQuery + native)
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    btn = newBtn;

    // Populate dropdown from visible-links (always refresh)
    hlinks.innerHTML = '';
    Array.from(vlinks.children).forEach(function (item) {
      hlinks.appendChild(item.cloneNode(true));
    });

    var isOpen = false;

    function openMenu()  { hlinks.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true');  isOpen = true;  }
    function closeMenu() { hlinks.classList.add('hidden');    btn.setAttribute('aria-expanded', 'false'); isOpen = false; }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !nav.contains(e.target)) closeMenu();
    });

    hlinks.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : (e.target.tagName === 'A' ? e.target : null);
      if (a) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (isOpen && (e.key === 'Escape' || e.keyCode === 27)) { closeMenu(); btn.focus(); }
    });
  }

  // Scripts load at end of body, so readyState is already 'interactive' or 'complete'.
  // jQuery's $(document).ready() fires synchronously at 'interactive', meaning
  // greedy-nav's click handler is already registered by the time we run.
  // The clone-button approach strips it reliably without any timing concerns.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav(); // DOM + all prior scripts done — run immediately
  }
})();

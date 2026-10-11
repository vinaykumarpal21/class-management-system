/* Sagar Classes – ONE shared navigation bar, mobile menu and footer for every page.
   Each page only contains:
     <script src="…/js/layout.js" data-part="nav"></script>      (inside .app-container, before <main>)
     <script src="…/js/layout.js" data-part="footer"></script>   (after .app-container)
   Edit the lists below to change the menu / footer everywhere at once. */
(function () {
  'use strict';
  var me = document.currentScript;
  var part = me.getAttribute('data-part');
  var base = (me.getAttribute('src') || '').replace(/js\/layout\.js.*$/, '');     // '' on index.html, '../' on html/*.html
  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  var PAGES = [
    { file: 'index.html',            href: base + 'index.html',            label: 'Home Dashboard',     icon: 'ri-home-5-fill',           cls: 'nav-icon-home' },
    { file: 'facilities.html',       href: base + 'html/facilities.html',  label: 'Class Facilities',   icon: 'ri-school-fill',           cls: 'nav-icon-facilities' },
    { file: 'functions.html',        href: base + 'html/functions.html',   label: 'Functions & Events', icon: 'ri-calendar-event-fill',   cls: 'nav-icon-events' },
    { file: 'about.html',            href: base + 'html/about.html',       label: 'About Institute',    icon: 'ri-community-fill',        cls: 'nav-icon-about' },
    { file: 'academic.html',         href: base + 'html/academic.html',    label: 'Student Attendance', icon: 'ri-graduation-cap-fill',   cls: 'nav-icon-student' },
    { file: 'staff-attendance.html', href: base + 'html/staff-attendance.html', label: 'Staff Attendance', icon: 'ri-user-star-fill',     cls: 'nav-icon-staff' },
    { file: 'toppers.html',          href: base + 'html/toppers.html',     label: 'Toppers & Results',  icon: 'ri-medal-2-fill',          cls: 'nav-icon-toppers' },
    { file: 'contact.html',          href: base + 'html/contact.html',     label: 'Contact & Branches', icon: 'ri-map-pin-user-fill',     cls: 'nav-icon-contact' }
  ];
  var ADMIN = { file: 'admin.html', href: base + 'html/admin.html' };
  var QUICK = ['index.html', 'toppers.html', 'facilities.html', 'functions.html', 'about.html', 'contact.html'];
  var QUICK_LABEL = { 'index.html': 'Home', 'toppers.html': 'Toppers', 'facilities.html': 'Facilities',
                      'functions.html': 'Functions & Events', 'about.html': 'About Us', 'contact.html': 'Contact' };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function link(p) {
    var on = p.file === file;
    return '<a href="' + p.href + '" class="nav-link' + (on ? ' active' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' +
           '<i class="' + p.icon + ' ' + p.cls + '"></i> ' + esc(p.label) + '</a>';
  }
  var logo = base + 'images/logo.jpeg';

  if (part === 'nav') {
    var adminOn = file === ADMIN.file;
    document.write(
      '<input type="checkbox" id="navToggle" class="css-switch" hidden>' +
      '<label for="navToggle" class="sidebar-overlay" aria-label="Close menu"></label>' +

      '<aside class="sidebar" id="sidebar">' +
        '<a class="brand" href="' + base + 'index.html"><div class="brand-logo animate-pulse"><img src="' + logo + '" alt="Sagar Classes Logo" class="sagar-logo-img"></div>' +
          '<div>SAGAR <span>CLASSES</span><p class="brand-sub">Excellence in Education</p></div></a>' +
        '<nav class="side-nav" aria-label="Main">' + PAGES.map(link).join('') +
          '<div class="divider"></div>' +
          '<a href="' + ADMIN.href + '" class="nav-link admin-btn' + (adminOn ? ' active' : '') + '"><i class="ri-admin-fill nav-icon-admin"></i> Admin Panel</a>' +
        '</nav>' +
        '<div class="theme-toggle-box"><button type="button" class="theme-btn" data-theme-toggle aria-label="Switch light / dark mode">' +
          '<span class="to-light"><i class="ri-sun-fill"></i> Light Mode</span><span class="to-dark"><i class="ri-moon-fill"></i> Dark Mode</span></button></div>' +
      '</aside>' +

      '<header class="floating-menu-bar">' +
        '<a class="floating-brand" href="' + base + 'index.html"><img src="' + logo + '" alt="" class="sagar-logo-img-small"> SAGAR <span>CLASSES</span></a>' +
        '<div class="floating-actions-mobile">' +
          '<button type="button" class="menu-action-icon-btn" data-theme-toggle title="Switch light / dark mode" aria-label="Switch light / dark mode"><i class="ri-contrast-2-fill nav-icon-home"></i></button>' +
          '<a href="' + ADMIN.href + '" class="menu-action-icon-btn admin-mobile-icon" title="Admin Panel" aria-label="Admin Panel"><i class="ri-admin-fill nav-icon-admin"></i></a>' +
          '<label for="navToggle" class="menu-toggle-btn" title="Menu" role="button" aria-label="Open or close menu"><i class="ri-menu-3-fill"></i></label>' +
        '</div>' +
      '</header>');

    /* mobile menu: Esc closes it, and it never stays open when coming back with the Back button */
    var closeMenu = function () { var t = document.getElementById('navToggle'); if (t) t.checked = false; };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('pageshow', closeMenu);
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.sidebar .nav-link')) closeMenu(); });
  }

  if (part === 'footer') {
    var byFile = {}; PAGES.forEach(function (p) { byFile[p.file] = p; });
    document.write(
      '<footer class="site-footer"><div class="main-site-container footer-inner-wrap"><div class="footer-grid">' +
        '<div class="footer-col footer-about">' +
          '<a class="brand footer-brand-override" href="' + base + 'index.html"><img src="' + logo + '" alt="Sagar Classes Logo" class="sagar-logo-img">' +
            '<div><h3>Sagar Classes<span>.</span></h3><span class="brand-sub">Excellence in Education</span></div></a>' +
          '<p class="footer-desc">Empowering students with quality education, conceptual clarity and dedicated mentorship to achieve academic brilliance.</p>' +
          '<div class="footer-socials">' +
            '<a href="https://wa.me/919702215658" target="_blank" rel="noopener" aria-label="WhatsApp" class="social-icon-btn"><i class="ri-whatsapp-fill"></i></a>' +
            '<a href="tel:+919702215658" aria-label="Call us" class="social-icon-btn"><i class="ri-phone-fill"></i></a>' +
          '</div>' +
        '</div>' +
        '<div class="footer-col"><h4>Quick Links</h4><ul class="footer-links-list">' +
          QUICK.map(function (f) { var p = byFile[f]; return '<li><a href="' + p.href + '"><i class="ri-arrow-right-s-line"></i> ' + esc(QUICK_LABEL[f]) + '</a></li>'; }).join('') +
        '</ul></div>' +
        '<div class="footer-col"><h4>Get in Touch</h4><ul class="footer-contact-list">' +
          '<li><i class="ri-map-pin-2-fill"></i><span>Nirmal Anand Nagar, Manorama Nagar, Kolshet Road, Thane (West), Maharashtra 400607</span></li>' +
          '<li><i class="ri-phone-fill"></i><a href="tel:+919702215658">+91 97022 15658</a></li>' +
        '</ul></div>' +
      '</div></div></footer>');
  }
})();

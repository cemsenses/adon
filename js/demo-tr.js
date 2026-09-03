/* =============================================
   ADON AI Studio — /demo-tr motion
   Lenis on gsap.ticker + ScrollTrigger.
   Vertical rhythm only: overlay, opacity, light hero Y, hovers.
   No pin, no horizontal rail, no 3D, no video scrub.
   ============================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
    || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  if (isTouch) document.documentElement.classList.add('is-touch');

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    document.body.classList.add('page-loaded');
    initStamp();
    initMenu();
    initOverlay();
    initHovers();
    initHashScroll();

    if (typeof gsap === 'undefined') {
      revealInstant();
      initBarTheme(null);
      return;
    }

    if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

    var lenis = initLenis();
    initReveals();
    initHeroParallax();
    initBarTheme(lenis);

    if (lenis && typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  });

  /* ── Live studio stamp: “3 Eylül · 09:07” ── */
  function initStamp() {
    var el = document.querySelector('[data-stamp]');
    if (!el) return;
    var months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    function write() {
      var now = new Date();
      var hh = String(now.getHours()).padStart(2, '0');
      var mm = String(now.getMinutes()).padStart(2, '0');
      el.textContent = now.getDate() + ' ' + months[now.getMonth()] + ' · ' + hh + ':' + mm;
    }

    write();
    setInterval(write, 30000);
  }

  /* ── MENU ·· ── */
  function initMenu() {
    var toggle = document.getElementById('dtr-menu-toggle');
    var menu = document.getElementById('dtr-menu');
    if (!toggle || !menu) return;

    function open() {
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-menu');
      document.body.style.overflow = 'hidden';
      if (window.__demoLenis) window.__demoLenis.stop();
    }

    function close() {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-menu');
      document.body.style.overflow = '';
      if (window.__demoLenis) window.__demoLenis.start();
    }

    toggle.addEventListener('click', function () {
      if (menu.hidden) open();
      else close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) close();
    });
  }

  /* ── Overlay-in then navigate (internal pages) ── */
  function initOverlay() {
    var overlay = document.querySelector('.page-overlay');
    if (!overlay) return;

    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      if (link.target === '_blank') return;
      if (/^https?:/i.test(href) && href.indexOf(location.host) === -1) return;

      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        var target = link.href;
        if (reduced) {
          window.location.href = target;
          return;
        }
        overlay.classList.add('is-navigating');
        overlay.style.animation = 'none';
        overlay.offsetHeight;
        overlay.style.transformOrigin = 'top';
        overlay.style.animation = 'overlay-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards';
        setTimeout(function () { window.location.href = target; }, 450);
      });
    });
  }

  function initHashScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      link.addEventListener('click', function (e) {
        var el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        if (window.__demoLenis) window.__demoLenis.scrollTo(el, { offset: 0, duration: 1.15 });
        else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ── Lenis ↔ gsap.ticker ── */
  function initLenis() {
    if (reduced || typeof Lenis === 'undefined' || typeof gsap === 'undefined') return null;

    var lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2
    });

    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    if (typeof ScrollTrigger !== 'undefined') lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
    window.__demoLenis = lenis;
    return lenis;
  }

  /* ── Headings finish fully opaque ── */
  function initReveals() {
    if (reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      revealInstant();
      return;
    }

    gsap.utils.toArray('.dtr-reveal').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.95,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onComplete: function () { gsap.set(el, { opacity: 1, y: 0, clearProps: 'transform' }); }
        }
      );
    });

    gsap.utils.toArray('.dtr-stagger').forEach(function (parent) {
      var kids = parent.children;
      if (!kids.length) return;
      gsap.fromTo(kids,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: { trigger: parent, start: 'top 88%', once: true },
          onComplete: function () { gsap.set(kids, { opacity: 1, y: 0, clearProps: 'transform' }); }
        }
      );
    });

    var heroBits = document.querySelectorAll('.hero-title, .hero-dek, .hero-meta, .hero-services, .hero-actions');
    if (heroBits.length) {
      gsap.fromTo(heroBits,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 1.05,
          stagger: 0.07,
          delay: 0.18,
          ease: 'power3.out',
          onComplete: function () { gsap.set(heroBits, { opacity: 1, y: 0, clearProps: 'transform' }); }
        }
      );
    }
  }

  function revealInstant() {
    document.querySelectorAll('.dtr-reveal, .dtr-stagger > *, .hero-title, .hero-dek, .hero-meta, .hero-services, .hero-actions').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  function initBarTheme(lenis) {
    var process = document.querySelector('.process');
    if (!process) return;

    function paint() {
      var r = process.getBoundingClientRect();
      document.body.classList.toggle('on-light', r.top < 64 && r.bottom > 48);
    }

    paint();
    window.addEventListener('resize', paint);
    if (lenis) lenis.on('scroll', paint);
    else window.addEventListener('scroll', paint, { passive: true });
  }

  /* ── Light Y on the hero still (disabled when reduced) ── */
  function initHeroParallax() {
    if (reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    var media = document.querySelector('.hero-media');
    if (!media) return;
    gsap.fromTo(media, { yPercent: -6 }, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  function initHovers() {
    if (isTouch) return;
    document.querySelectorAll('.text-link').forEach(function (el) {
      el.addEventListener('mouseenter', function () { el.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { el.classList.remove('is-hover'); });
    });
  }
})();

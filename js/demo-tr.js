/* =============================================
   ADON STUDIO — demo-tr motion stack
   Lenis on gsap.ticker + ScrollTrigger.
   Does not patch js/main.js.
   ============================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
    || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  if (isTouch) {
    document.documentElement.classList.add('is-touch');
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    document.body.classList.add('page-loaded');

    initOverlay();
    initNav();
    initMobileMenu();
    if (!isTouch) initCursor();
    initMarquee();
    initHovers();

    if (typeof gsap === 'undefined') {
      revealInstant();
      staticPin();
      return;
    }

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    var lenis = initFabrica();
    initReveals();
    initPin();
    initParallax();

    if (lenis && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });

  /* ── Overlay: overlay-in then navigate; overlay-out on load (CSS) ── */
  function initOverlay() {
    var overlay = document.querySelector('.page-overlay');
    if (!overlay) return;

    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
      if (link.target === '_blank') return;

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
        setTimeout(function () {
          window.location.href = target;
        }, 450);
      });
    });
  }

  /* ── Nav scroll state ── */
  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var onScroll = function () {
      if ((window.scrollY || document.documentElement.scrollTop) > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile menu (same language as live site) ── */
  function initMobileMenu() {
    var toggle = document.querySelector('.nav-menu-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    var navParent = links.parentElement;

    function open() {
      document.body.appendChild(links);
      links.classList.add('open');
      Object.assign(links.style, {
        display: 'flex', flexDirection: 'column', position: 'fixed',
        inset: '0', background: '#ffffff', justifyContent: 'center',
        alignItems: 'center', gap: '40px', zIndex: '9999'
      });
      links.querySelectorAll('a').forEach(function (a) {
        Object.assign(a.style, {
          fontSize: '28px', fontFamily: 'var(--font-headline)',
          fontWeight: '800', color: '#0a0a0a', textDecoration: 'none',
          letterSpacing: '0.05em', textTransform: 'uppercase'
        });
      });
      var spans = toggle.querySelectorAll('span');
      if (spans[0]) spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      if (spans[1]) spans[1].style.opacity = '0';
      if (spans[2]) spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      document.body.style.overflow = 'hidden';
    }

    function close() {
      links.classList.remove('open');
      links.style.cssText = '';
      links.querySelectorAll('a').forEach(function (a) { a.style.cssText = ''; });
      navParent.appendChild(links);
      var spans = toggle.querySelectorAll('span');
      if (spans[0]) spans[0].style.transform = '';
      if (spans[1]) spans[1].style.opacity = '1';
      if (spans[2]) spans[2].style.transform = '';
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function () {
      if (links.classList.contains('open')) close();
      else open();
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
  }

  /* ── Custom cursor (desktop only) ── */
  function initCursor() {
    var cursor = document.querySelector('.cursor');
    var follower = document.querySelector('.cursor-follower');
    if (!cursor) return;
    var mx = 0, my = 0, fx = 0, fy = 0;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top = my + 'px';
    });

    document.querySelectorAll('a, button, .card, .pillar, .btn').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('expanded'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('expanded'); });
    });

    (function loop() {
      fx += (mx - fx) * 0.12;
      fy += (my - fy) * 0.12;
      if (follower) {
        follower.style.left = fx + 'px';
        follower.style.top = fy + 'px';
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ── Fabrica: Lenis + gsap.ticker + ScrollTrigger.update ── */
  function initFabrica() {
    if (reduced || typeof Lenis === 'undefined' || typeof gsap === 'undefined') return null;

    var lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2
    });

    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });

    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }
    gsap.ticker.lagSmoothing(0);
    window.__demoLenis = lenis;
    return lenis;
  }

  /* ── ScrollTrigger reveals — always finish at opacity 1 ── */
  function initReveals() {
    if (reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      revealInstant();
      return;
    }

    gsap.utils.toArray('.demo-reveal').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true
          },
          onComplete: function () {
            gsap.set(el, { opacity: 1, y: 0, clearProps: 'transform' });
          }
        }
      );
    });

    gsap.utils.toArray('.demo-stagger').forEach(function (parent) {
      var kids = parent.children;
      if (!kids.length) return;
      gsap.fromTo(kids,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: parent,
            start: 'top 88%',
            once: true
          },
          onComplete: function () {
            gsap.set(kids, { opacity: 1, y: 0, clearProps: 'transform' });
          }
        }
      );
    });
  }

  function revealInstant() {
    document.querySelectorAll('.demo-reveal').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('.demo-stagger > *').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  /* ── One pin only (Spector / XZERO combined) ── */
  function initPin() {
    var section = document.querySelector('.demo-pin');
    var sticky = document.querySelector('.demo-pin-sticky');
    var frames = Array.prototype.slice.call(document.querySelectorAll('.demo-pin-frame'));
    if (!section || !sticky || !frames.length) return;

    if (reduced || typeof ScrollTrigger === 'undefined') {
      staticPin();
      return;
    }

    frames.forEach(function (frame, i) {
      gsap.set(frame, {
        opacity: i === 0 ? 1 : 0,
        visibility: i === 0 ? 'visible' : 'hidden',
        zIndex: i
      });
      if (i === 0) frame.classList.add('is-active');
      else frame.classList.remove('is-active');
    });

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: function () { return '+=' + (window.innerHeight * frames.length); },
      pin: sticky,
      pinSpacing: true,
      scrub: 0.65,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        var p = self.progress * (frames.length - 1);
        frames.forEach(function (frame, i) {
          var dist = Math.abs(p - i);
          var op = gsap.utils.clamp(0, 1, 1 - dist);
          var vis = op > 0.02;
          gsap.set(frame, {
            opacity: op,
            visibility: vis ? 'visible' : 'hidden',
            zIndex: op > 0.5 ? 3 : i
          });
          frame.classList.toggle('is-active', op > 0.5);
        });
      }
    });
  }

  function staticPin() {
    var section = document.querySelector('.demo-pin');
    if (section) section.classList.add('is-static');
    document.querySelectorAll('.demo-pin-frame').forEach(function (frame) {
      frame.classList.add('is-active');
      frame.style.opacity = '1';
      frame.style.visibility = 'visible';
    });
  }

  /* ── Offset parallax ~10–20% on hero + pin stills ── */
  function initParallax() {
    if (reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var heroMedia = document.querySelector('.demo-hero-media');
    if (heroMedia) {
      gsap.fromTo(heroMedia, { yPercent: -10 }, {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.demo-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    document.querySelectorAll('.demo-pin-media').forEach(function (media) {
      gsap.fromTo(media, { yPercent: -8 }, {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.demo-pin',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true
        }
      });
    });
  }

  /* ── Directed hover: image scale ~1.06, coral type rule ── */
  function initHovers() {
    if (isTouch) return;

    document.querySelectorAll('.demo-hover-img').forEach(function (img) {
      img.style.transformOrigin = 'center center';
      img.addEventListener('mouseenter', function () {
        if (typeof gsap !== 'undefined') {
          gsap.to(img, { scale: 1.06, duration: 0.85, ease: 'power2.out', overwrite: 'auto' });
        } else {
          img.style.transform = 'scale(1.06)';
        }
      });
      img.addEventListener('mouseleave', function () {
        if (typeof gsap !== 'undefined') {
          gsap.to(img, { scale: 1, duration: 0.85, ease: 'power2.out', overwrite: 'auto' });
        } else {
          img.style.transform = 'scale(1)';
        }
      });
    });

    document.querySelectorAll('.demo-hover-rule').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        el.classList.add('is-hover');
      });
      el.addEventListener('mouseleave', function () {
        el.classList.remove('is-hover');
      });
    });
  }

  /* ── Scroll-driven marquee (ported, not via main.js) ── */
  function initMarquee() {
    var el = document.querySelector('.marquee-section');
    var track = el && el.querySelector('.marquee-track');
    if (!el || !track) return;
    el.classList.add('marquee-ready');

    if (reduced) return;

    var x = 0;
    var baseSpeed = 0.7;
    var speed = baseSpeed;
    var velocity = 0;
    var skew = 0;
    var paused = false;
    var lastScrollY = window.scrollY;

    window.addEventListener('scroll', function () {
      var dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      velocity = Math.max(-18, Math.min(velocity + dy * 0.12, 18));
    }, { passive: true });

    el.addEventListener('mouseenter', function () { paused = true; });
    el.addEventListener('mouseleave', function () { paused = false; });

    (function loop() {
      if (!paused) {
        velocity *= 0.90;
        var targetSpeed = baseSpeed + velocity;
        speed += (targetSpeed - speed) * 0.10;
        var targetSkew = velocity * -0.35;
        skew += (targetSkew - skew) * 0.10;
        x -= speed;
        var halfWidth = track.scrollWidth / 2;
        if (Math.abs(x) >= halfWidth) x = 0;
        track.style.transform = 'translateX(' + x + 'px) skewX(' + skew + 'deg)';
      }
      requestAnimationFrame(loop);
    })();
  }
})();

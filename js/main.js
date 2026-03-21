/* =============================================
   ADON STUDIO — Main JavaScript
   PaperTiger-style interactions & animations
   ============================================= */

(function () {
  'use strict';

  // ─── Custom Cursor ───────────────────────────
  class Cursor {
    constructor() {
      this.cursor = document.querySelector('.cursor');
      this.follower = document.querySelector('.cursor-follower');
      this.mx = 0; this.my = 0;
      this.fx = 0; this.fy = 0;
      if (!this.cursor) return;
      this.bind();
      this.loop();
    }

    bind() {
      document.addEventListener('mousemove', (e) => {
        this.mx = e.clientX;
        this.my = e.clientY;
        if (this.cursor) {
          this.cursor.style.left = this.mx + 'px';
          this.cursor.style.top = this.my + 'px';
        }
      });

      // Expand cursor on interactive elements
      const hovers = document.querySelectorAll('a, button, .card, .solution-card, .work-item, .pillar, .btn');
      hovers.forEach(el => {
        el.addEventListener('mouseenter', () => {
          this.cursor && this.cursor.classList.add('expanded');
        });
        el.addEventListener('mouseleave', () => {
          this.cursor && this.cursor.classList.remove('expanded');
        });
      });
    }

    loop() {
      this.fx += (this.mx - this.fx) * 0.12;
      this.fy += (this.my - this.fy) * 0.12;
      if (this.follower) {
        this.follower.style.left = this.fx + 'px';
        this.follower.style.top = this.fy + 'px';
      }
      requestAnimationFrame(() => this.loop());
    }
  }

  // ─── Smooth Scroll (Lenis-like via CSS + JS) ──
  class SmoothScroll {
    constructor() {
      this.scroll = 0;
      this.target = 0;
      this.ease = 0.085;
      this.scrollPos = 0;
      this.ticking = false;
      this.init();
    }

    init() {
      // We'll use native smooth scroll with Lenis via CDN
      // This class adds the nav scroll behavior
      window.addEventListener('scroll', () => {
        this.scrollPos = window.scrollY;
        this.updateNav();
      });
    }

    updateNav() {
      const nav = document.querySelector('.nav');
      if (!nav) return;
      if (this.scrollPos > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  }

  // ─── Counter Animation ───────────────────────
  class Counter {
    constructor(el) {
      this.el = el;
      this.target = parseInt(el.dataset.target, 10);
      this.suffix = el.dataset.suffix || '';
      this.started = false;
    }

    start() {
      if (this.started) return;
      this.started = true;
      const duration = 1800;
      const startTime = performance.now();
      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(eased * this.target);
        this.el.textContent = value + this.suffix;
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    }
  }

  // ─── Scroll Reveal ───────────────────────────
  class ScrollReveal {
    constructor() {
      this.els = document.querySelectorAll('.reveal, .stagger');
      this.counters = [];
      this.init();
    }

    init() {
      // Init counters
      document.querySelectorAll('[data-target]').forEach(el => {
        this.counters.push(new Counter(el));
      });

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      this.els.forEach(el => observer.observe(el));

      // Counter observer
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const counter = this.counters.find(c => c.el === entry.target);
            if (counter) counter.start();
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));
    }
  }

  // ─── Hero Text Animation ─────────────────────
  class HeroType {
    constructor() {
      this.lines = document.querySelectorAll('.hero-text-top, .hero-text-bottom');
      this.animate();
    }

    animate() {
      this.lines.forEach((line, lineIndex) => {
        // Split by <br> to preserve line breaks
        const parts = line.innerHTML.split(/<br\s*\/?>/i);
        line.innerHTML = '';
        let charOffset = 0;
        parts.forEach((part, partIndex) => {
          if (partIndex > 0) {
            line.appendChild(document.createElement('br'));
          }
          // Strip any residual HTML tags from each part
          const text = part.replace(/<[^>]*>/g, '');
          text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.className = 'hero-char';
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.animationDelay = (lineIndex * 0.3 + (charOffset + i) * 0.025) + 's';
            line.appendChild(span);
          });
          charOffset += text.length;
        });
      });
    }
  }

  // ─── Page Transitions ────────────────────────
  class PageTransition {
    constructor() {
      this.overlay = document.querySelector('.page-overlay');
      this.init();
    }

    init() {
      if (!this.overlay) return;

      // Animate in on load
      document.body.classList.add('page-loaded');

      // Intercept internal links
      document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;

        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = link.href;
          this.overlay.style.animation = 'overlay-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards';
          setTimeout(() => {
            window.location.href = target;
          }, 450);
        });
      });
    }
  }

  // ─── Mobile Menu ─────────────────────────────
  class MobileMenu {
    constructor() {
      this.toggle = document.querySelector('.nav-menu-toggle');
      this.links = document.querySelector('.nav-links');
      if (!this.toggle || !this.links) return;
      this.navParent = this.links.parentElement; // nav elementi
      this.bind();
    }

    _open() {
      // Nav'ın backdrop-filter/stacking context'inden kaçmak için body'e taşı
      document.body.appendChild(this.links);
      this.links.classList.add('open');
      // Inline style ile garantile — CSS cascade sorunlarını bypass eder
      Object.assign(this.links.style, {
        display: 'flex', flexDirection: 'column', position: 'fixed',
        inset: '0', background: '#ffffff', justifyContent: 'center',
        alignItems: 'center', gap: '40px', zIndex: '9999'
      });
      this.links.querySelectorAll('a').forEach(a => {
        Object.assign(a.style, {
          fontSize: '28px', fontFamily: 'var(--font-headline)',
          fontWeight: '800', color: '#0a0a0a', textDecoration: 'none',
          letterSpacing: '0.05em', textTransform: 'uppercase'
        });
      });
      const spans = this.toggle.querySelectorAll('span');
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      document.body.style.overflow = 'hidden';
    }

    _close() {
      this.links.classList.remove('open');
      this.links.style.cssText = '';
      this.links.querySelectorAll('a').forEach(a => { a.style.cssText = ''; });
      // Geri nav'a yerleştir
      this.navParent.appendChild(this.links);
      const spans = this.toggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '1';
      spans[2].style.transform = '';
      document.body.style.overflow = '';
    }

    bind() {
      this.toggle.addEventListener('click', () => {
        if (this.links.classList.contains('open')) {
          this._close();
        } else {
          this._open();
        }
      });

      // Link'e tıklayınca kapat
      this.links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => this._close());
      });
    }
  }

  // ─── Active Nav Link ─────────────────────────
  function setActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === current || (current === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  }

  // ─── Lenis Smooth Scroll Setup ───────────────
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // ─── Parallax on Hero Visual ─────────────────
  function initParallax() {
    const visual = document.querySelector('.hero-visual');
    if (!visual) return;

    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      visual.style.transform = `translate(-50%, calc(-50% + ${scrolled * 0.2}px))`;
    }, { passive: true });
  }

  // ─── Scroll-Driven Marquee (GSAP horizontal-text style) ────
  class ScrollMarquee {
    constructor(el) {
      this.el = el;
      this.track = el.querySelector('.marquee-track');
      if (!this.track) return;

      this.x = 0;
      this.baseSpeed = 0.7;    // px/frame at rest
      this.speed = this.baseSpeed;
      this.velocity = 0;       // raw scroll delta accumulator
      this.skew = 0;       // current skewX in degrees
      this.paused = false;
      this.lastScrollY = window.scrollY;

      this.bind();
      this.loop();
    }

    bind() {
      window.addEventListener('scroll', () => {
        const dy = window.scrollY - this.lastScrollY;
        this.lastScrollY = window.scrollY;
        // Add scroll delta to velocity (clamped)
        this.velocity = Math.max(-18, Math.min(this.velocity + dy * 0.12, 18));
      }, { passive: true });

      this.el.addEventListener('mouseenter', () => { this.paused = true; });
      this.el.addEventListener('mouseleave', () => { this.paused = false; });
    }

    loop() {
      if (!this.paused) {
        // Decay velocity toward 0
        this.velocity *= 0.90;

        // Target speed: base + velocity effect
        const targetSpeed = this.baseSpeed + this.velocity;
        this.speed += (targetSpeed - this.speed) * 0.10;

        // skewX: leans forward when scrolling fast
        // velocty of +18 → skew toward -6deg, velocity of -18 → +6deg
        const targetSkew = this.velocity * -0.35;
        this.skew += (targetSkew - this.skew) * 0.10;

        // Move position
        this.x -= this.speed;

        // Seamless loop (track is doubled)
        const halfWidth = this.track.scrollWidth / 2;
        if (Math.abs(this.x) >= halfWidth) this.x = 0;

        // Apply transform with skew
        this.track.style.transform =
          `translateX(${this.x}px) skewX(${this.skew}deg)`;
      }

      requestAnimationFrame(() => this.loop());
    }
  }


  // ─── Simple Carousel ─────────────────────────
  function initGSAPCarousel() {
    const slides = Array.from(document.querySelectorAll('.cards li'));
    if (!slides.length) return;

    let current = 0;
    const total = slides.length;

    function show(index) {
      // wrap around
      current = (index + total) % total;
      slides.forEach((s, i) => {
        gsap.to(s, {
          xPercent: (i - current) * 110,
          scale:    i === current ? 1 : 0.75,
          opacity:  i === current ? 1 : 0.4,
          zIndex:   i === current ? 10 : 1,
          duration: 0.5,
          ease: 'power2.out'
        });
      });
    }

    // set initial positions instantly
    slides.forEach((s, i) => {
      gsap.set(s, {
        xPercent: (i - current) * 110,
        scale:    i === current ? 1 : 0.75,
        opacity:  i === current ? 1 : 0.4,
        zIndex:   i === current ? 10 : 1,
      });
    });

    document.querySelector('.carousel-arrow.next').addEventListener('click', () => show(current + 1));
    document.querySelector('.carousel-arrow.prev').addEventListener('click', () => show(current - 1));

    // drag support
    let startX = 0;
    const gallery = document.querySelector('.gallery');
    gallery.addEventListener('pointerdown', e => { startX = e.clientX; });
    gallery.addEventListener('pointerup',   e => {
      const diff = startX - e.clientX;
      if (Math.abs(diff) > 40) show(current + (diff > 0 ? 1 : -1));
    });
  }

  // CMS'ten erişilebilir global reinit
  window.reinitCarousel = function() {
    initGSAPCarousel();
  };

  // ─── Init ────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    new Cursor();
    new SmoothScroll();
    new ScrollReveal();
    new HeroType();
    new PageTransition();
    new MobileMenu();
    setActiveNav();
    initParallax();
    initGSAPCarousel();

    // Init scroll-driven marquees on all pages
    document.querySelectorAll('.marquee-section').forEach(el => {
      new ScrollMarquee(el);
    });
  });

})();

// First line: mark JS active so CSS can gate entrance animations.
// Must run before anything that can throw.
document.documentElement.classList.add('js');

// === Unity Publisher Page — Engine Canvas + Boot + Interactions ===
// Single IIFE, no dependencies. Fails open: if this script errors,
// the boot overlay auto-dismisses via CSS (3s no-JS / 6s booting cap)
// and hero content is visible because .js is already set and .hero-ready
// is never needed for visibility when reduced-motion overrides.

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  // ================================================================
  // BOOT SEQUENCE — the focal moment. Console types init lines, then
  // wireframe boots in, then hero reveals. If reduced-motion or JS
  // error, CSS handles fallback (overlay hidden, content visible).
  // ================================================================
  // BOOT SEQUENCE — the focal moment. Console types init lines, bar
  // fills in parallel, hero reveals when BOTH finish. Click-to-skip.
  // Two-flag pattern: typingDone + barDone, dismiss fires when both true.
  // CSS hard cap: 2.5s on .booting, 3s no-JS fallback.
  // ================================================================

  var bootOverlay = document.getElementById('boot-overlay');
  var bootText = document.getElementById('boot-text');
  var bootBarFill = document.getElementById('boot-bar-fill');
  var heroEl = document.querySelector('.hero');

  var bootLines = [
    '> initializing publisher system...',
    '> system online'
  ];

  var typingDone = false;
  var barDone = false;
  var dismissed = false;

  function tryDismiss() {
    if (typingDone && barDone && !dismissed) {
      dismissed = true;
      bootOverlay.classList.add('boot-done');
      setTimeout(function () {
        bootOverlay.style.display = 'none';
      }, 400);
      if (heroEl) heroEl.classList.add('hero-ready');
    }
  }

  function dismissBoot() {
    dismissed = true;
    bootOverlay.classList.add('boot-done');
    setTimeout(function () {
      bootOverlay.style.display = 'none';
    }, 400);
    if (heroEl) heroEl.classList.add('hero-ready');
  }

  // Click-to-skip on overlay
  bootOverlay.addEventListener('click', dismissBoot);

  function startBoot() {
    if (reducedMotion) {
      dismissBoot();
      return;
    }

    bootOverlay.classList.add('booting');
    var lineIdx = 0;
    var charIdx = 0;
    var currentText = '';

    function typeNext() {
      if (lineIdx >= bootLines.length) {
        typingDone = true;
        tryDismiss();
        return;
      }
      var line = bootLines[lineIdx];
      if (charIdx < line.length) {
        currentText += line[charIdx];
        bootText.textContent = currentText;
        charIdx++;
        setTimeout(typeNext, 8 + Math.random() * 14);
      } else {
        currentText += '\n';
        bootText.textContent = currentText;
        charIdx = 0;
        lineIdx++;
        setTimeout(typeNext, 60);
      }
    }
    // CSS animation drives the bar fill (0.9s). JS timer gates barDone
    // for the two-flag dismiss pattern — no inline transition needed.
    setTimeout(function () {
      barDone = true;
      tryDismiss();
    }, 950);

    setTimeout(typeNext, 100);
  }

  // ================================================================
  // ENGINE CANVAS — rotating icosahedron wireframe.
  // Single canvas layer. Interactive: responds to mouse with lag.
  // DPR-aware for crisp rendering on retina displays.
  // ================================================================

  var canvas = document.getElementById('engine-canvas');
  var ctx = canvas.getContext('2d');
  var w, h, cx, cy, dpr;

  var phi = (1 + Math.sqrt(5)) / 2;
  var verts = [
    [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
    [0, -1,  phi], [0,  1,  phi], [0, -1, -phi], [0,  1, -phi],
    [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
  ];
  for (var i = 0; i < verts.length; i++) {
    var len = Math.sqrt(verts[i][0]*verts[i][0] + verts[i][1]*verts[i][1] + verts[i][2]*verts[i][2]);
    verts[i][0] /= len; verts[i][1] /= len; verts[i][2] /= len;
  }
  var edges = [
    [0,1],[0,5],[0,7],[0,10],[0,11], [1,5],[1,7],[1,8],[1,9],
    [2,3],[2,4],[2,6],[2,10],[2,11], [3,4],[3,6],[3,8],[3,9],
    [4,5],[4,9],[4,11], [5,9],[5,11], [6,7],[6,8],[6,10],
    [7,8],[7,10], [8,9], [9,11], [10,11]
  ];

  var angle = 0;
  var targetMouseX = 0, targetMouseY = 0;
  var mouseX = 0, mouseY = 0;
  var scrollOffset = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function project(v, rotY, rotX) {
    var x1 = v[0] * Math.cos(rotY) - v[2] * Math.sin(rotY);
    var z1 = v[0] * Math.sin(rotY) + v[2] * Math.cos(rotY);
    var y1 = v[1];
    var y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
    var z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
    var persp = 3 / (3 - z2 * 0.4);
    var scale = Math.min(w, h) * 0.22;
    return [cx + x1 * scale * persp, cy + y2 * scale * persp, z2];
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    cx = w > 768 ? w * 0.7 : w / 2;
    cy = h * 0.42 - scrollOffset * 0.3;

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    var rotY = angle + mouseX * 0.5;
    var rotX = angle * 0.6 + mouseY * 0.3;

    var projected = [];
    for (var i = 0; i < verts.length; i++) {
      projected.push(project(verts[i], rotY, rotX));
    }

    for (var e = 0; e < edges.length; e++) {
      var a = projected[edges[e][0]];
      var b = projected[edges[e][1]];
      var avgZ = (a[2] + b[2]) / 2;
      var alpha = Math.max(0.04, Math.min(0.5, 0.3 - avgZ * 0.15));
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.strokeStyle = 'rgba(16, 185, 129, ' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (var v = 0; v < projected.length; v++) {
      var p = projected[v];
      var vAlpha = Math.max(0.2, Math.min(1, 0.6 - p[2] * 0.3));
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, ' + vAlpha + ')';
      ctx.fill();
    }

    angle += 0.004;
    requestAnimationFrame(draw);
  }

  // ================================================================
  // CUSTOM CURSOR — dot + ring with hover detection.
  // pointer:fine only. Ring centers on cursor at all sizes.
  // ================================================================

  var cursorDot = document.getElementById('cursor-dot');
  var cursorRing = document.getElementById('cursor-ring');

  if (finePointer && !reducedMotion) {
    var tx = 0, ty = 0, ringX = 0, ringY = 0;

    document.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      // Dot follows instantly (6px → offset 3px)
      cursorDot.style.transform = 'translate(' + (tx - 3) + 'px, ' + (ty - 3) + 'px)';
    });

    function animateRing() {
      ringX += (tx - ringX) * 0.15;
      ringY += (ty - ringY) * 0.15;
      // Ring size changes via CSS class; offset = half current size.
      // Using getBoundingClientRect keeps it centered at any size.
      var size = cursorRing.offsetWidth;
      cursorRing.style.transform = 'translate(' + (ringX - size / 2) + 'px, ' + (ringY - size / 2) + 'px)';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    var hoverables = document.querySelectorAll('a, button, [data-tilt]');
    hoverables.forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorRing.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cursorRing.classList.remove('hover'); });
    });
  }

  // ================================================================
  // 3D TILT — cards respond to mouse position with smooth ease-back.
  // Transforms the card element itself (not a child wrapper).
  // ================================================================

  if (finePointer && !reducedMotion) {
    var tiltCards = document.querySelectorAll('[data-tilt]');
    tiltCards.forEach(function (card) {
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        // Kill transition during movement for 1:1 tracking
        card.style.transition = 'none';
        card.style.transform = 'perspective(800px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        // Restore transition for smooth ease-back to neutral
        card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = 'perspective(800px) rotateY(0) rotateX(0)';
      });
    });
  }

  // ================================================================
  // SCROLL + MOUSE — wireframe reacts to scroll and mouse
  // ================================================================

  window.addEventListener('scroll', function () {
    scrollOffset = window.scrollY;
  }, { passive: true });

  window.addEventListener('mousemove', function (e) {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ================================================================
  // SCROLL REVEAL — sections fade in on enter
  // ================================================================

  var revealEls = document.querySelectorAll('.section, .coming-soon, .console-panel, .dossier-prose');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      observer.observe(el);
    });
  }

  // ================================================================
  // FORM — copy subject input into _subject hidden field on submit
  // ================================================================

  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function () {
      var subjectInput = document.getElementById('form-subject');
      var hiddenSubject = contactForm.querySelector('[name="_subject"]');
      if (subjectInput && hiddenSubject) {
        hiddenSubject.value = subjectInput.value || 'New message from Publisher page';
      }
    });
  }

  // ================================================================
  // INIT
  // ================================================================

  if (!reducedMotion) {
    resize();
    window.addEventListener('resize', resize);
    draw();
    startBoot();
  } else {
    canvas.style.display = 'none';
    bootOverlay.style.display = 'none';
    if (heroEl) heroEl.classList.add('hero-ready');
  }
})();

// === Wireframe Engine Canvas ===
// Rotating icosahedron wireframe — the signature element evoking Unity's 3D engine.
// Disabled entirely under prefers-reduced-motion.

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('engine-canvas');
  var ctx = canvas.getContext('2d');
  var w, h, cx, cy, rafId;

  // Icosahedron vertices (normalized)
  var phi = (1 + Math.sqrt(5)) / 2;
  var verts = [
    [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
    [0, -1,  phi], [0,  1,  phi], [0, -1, -phi], [0,  1, -phi],
    [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
  ];
  // Normalize
  for (var i = 0; i < verts.length; i++) {
    var len = Math.sqrt(verts[i][0]*verts[i][0] + verts[i][1]*verts[i][1] + verts[i][2]*verts[i][2]);
    verts[i][0] /= len; verts[i][1] /= len; verts[i][2] /= len;
  }
  // Edge list (30 edges)
  var edges = [
    [0,1],[0,5],[0,7],[0,10],[0,11], [1,5],[1,7],[1,8],[1,9],
    [2,3],[2,4],[2,6],[2,10],[2,11], [3,4],[3,6],[3,8],[3,9],
    [4,5],[4,9],[4,11], [5,9],[5,11], [6,7],[6,8],[6,10],
    [7,8],[7,10], [8,9], [9,11], [10,11]
  ];

  var angle = 0;
  var scale = 180;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cx = w / 2;
    cy = h / 2;
    scale = Math.min(w, h) * 0.22;
  }

  function project(v, rotY, rotX) {
    // Rotate Y
    var x1 = v[0] * Math.cos(rotY) - v[2] * Math.sin(rotY);
    var z1 = v[0] * Math.sin(rotY) + v[2] * Math.cos(rotY);
    var y1 = v[1];
    // Rotate X
    var y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
    var z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
    var x2 = x1;
    // Perspective
    var persp = 3 / (3 - z2 * 0.4);
    return [cx + x2 * scale * persp, cy + y2 * scale * persp, z2];
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Position the wireframe in the right half of the screen (behind hero)
    cx = w > 768 ? w * 0.7 : w / 2;
    cy = h * 0.45;

    var projected = [];
    for (var i = 0; i < verts.length; i++) {
      projected.push(project(verts[i], angle, angle * 0.6));
    }

    // Draw edges
    for (var e = 0; e < edges.length; e++) {
      var a = projected[edges[e][0]];
      var b = projected[edges[e][1]];
      var avgZ = (a[2] + b[2]) / 2;
      var alpha = Math.max(0.05, Math.min(0.5, 0.3 - avgZ * 0.15));
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.strokeStyle = 'rgba(16, 185, 129, ' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw vertices
    for (var v = 0; v < projected.length; v++) {
      var p = projected[v];
      var alpha = Math.max(0.2, Math.min(1, 0.6 - p[2] * 0.3));
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, ' + alpha + ')';
      ctx.fill();
    }

    angle += 0.005;
    rafId = requestAnimationFrame(draw);
  }

  if (!reducedMotion) {
    resize();
    window.addEventListener('resize', resize);
    draw();
  } else {
    canvas.style.display = 'none';
  }

  // === Scroll Reveal ===
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }
})();

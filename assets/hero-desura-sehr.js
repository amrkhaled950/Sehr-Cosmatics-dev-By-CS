/**
 * DESURA DE SEHR — Hero Section JS (Fixed)
 * Scroll-driven animation: spring physics + rAF
 */
'use strict';

/* ─── Utilities ─────────────────────────────────────────── */
function mapRange(val, inMin, inMax, outMin, outMax, clamp = true) {
  if (inMin === inMax) return outMin;
  const t = (val - inMin) / (inMax - inMin);
  const r = outMin + t * (outMax - outMin);
  if (!clamp) return r;
  return outMin < outMax
    ? Math.min(outMax, Math.max(outMin, r))
    : Math.min(outMin, Math.max(outMax, r));
}

function multiMap(p, stops) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [x0, y0] = stops[i];
    const [x1, y1] = stops[i + 1];
    if (p <= x1) return mapRange(p, x0, x1, y0, y1);
  }
  return stops[stops.length - 1][1];
}

/* ─── Spring ────────────────────────────────────────────── */
class Spring {
  constructor({ stiffness = 100, damping = 20 } = {}) {
    this.k = stiffness; this.d = damping;
    this.v = 0; this.x = 0; this.target = 0;
  }
  setTarget(t) { this.target = t; }
  step(dt = 1 / 60) {
    const force = -this.k * (this.x - this.target);
    const damp  = -this.d * this.v;
    this.v += ((force + damp)) * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

/* ─── Box config ────────────────────────────────────────── */
const BOX_DATA = [
  { start: 0.03, dur: 0.22, from: -900,  tilt: -3, drift: -6, idx: 0 },
  { start: 0.10, dur: 0.22, from: -1100, tilt:  2, drift:  4, idx: 1 },
  { start: 0.18, dur: 0.22, from: -1000, tilt: -2, drift: -3, idx: 2 },
  { start: 0.26, dur: 0.24, from: -1200, tilt:  4, drift:  7, idx: 3 },
];

/* ─── Idle float ────────────────────────────────────────── */
function getIdleY(idx, ms) {
  const period = 4 + idx * 0.4;
  return Math.sin((ms / 1000 / period) * Math.PI * 2) * -4;
}

/* ─── Sparkle bokeh ─────────────────────────────────────── */
function generateSparkles() {
  const wrap = document.getElementById('sparklesWrap');
  if (!wrap) return;
  for (let i = 0; i < 28; i++) {
    const x   = (i * 37) % 100;
    const y   = 20 + (i * 53) % 70;
    const sz  = 2 + (i * 7)  % 5;
    const dur = 2 + (i * 11) % 6;
    const dly = (i % 8) * 0.35;
    const el  = document.createElement('div');
    el.className = 'sparkle';
    el.style.cssText =
      `left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;` +
      `box-shadow:0 0 8px 2px rgba(99,201,207,0.85);` +
      `--dur:${dur}s;--dly:${dly}s;`;
    wrap.appendChild(el);
  }
}

/* ─── Ribbon progress ───────────────────────────────────── */
function setRibbonProgress(p) {
  const opacity = multiMap(p, [[0.05, 0], [0.2, 1], [1, 0.9]]);
  const draw    = mapRange(p, 0.1, 0.55, 1, 0, true);
  document.querySelectorAll('.ribbon').forEach(r => {
    r.style.strokeDashoffset = draw;
    r.style.opacity = opacity;
  });
}

/* ─── Halo ──────────────────────────────────────────────── */
function updateHalo(p) {
  const wrap = document.getElementById('atmHaloWrap');
  if (!wrap) return;
  const opacity = multiMap(p, [[0, 0], [0.15, 0.55], [0.5, 0.9], [1, 0.75]]);
  const scale   = multiMap(p, [[0, 0.85], [0.6, 1], [1, 1]]);
  const rotate  = mapRange(p, 0, 1, 0, 25);
  wrap.style.opacity   = opacity;
  wrap.style.transform = `translate(-50%,-50%) scale(${scale}) rotate(${rotate}deg)`;
}

/* ─── Silk drift ────────────────────────────────────────── */
function updateSilk(p) {
  const silk = document.getElementById('atmSilk');
  if (!silk) return;
  const x = mapRange(p, 0, 1, -2, 2);
  const y = mapRange(p, 0, 1,  0, -4);
  silk.style.transform = `translate(${x}%,${y}%)`;
}

/* ─── Scroll progress ───────────────────────────────────── */
function getScrollProgress(heroEl) {
  if (!heroEl) return 0;
  const rect       = heroEl.getBoundingClientRect();
  const scrollable = heroEl.offsetHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  const scrolled = -rect.top;
  return Math.min(1, Math.max(0, scrolled / scrollable));
}

/* ─── Main init ─────────────────────────────────────────── */
function initHero() {
  /* Use class selector — works regardless of dynamic section ID */
  const heroEl = document.querySelector('.hero-section');

  /* If no hero section on this page, bail out */
  if (!heroEl) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Grab all dynamic box elements */
  const boxWraps = Array.from(heroEl.querySelectorAll('.box-wrap'));

  /* Extract block configuration dynamically from dataset */
  const blocksData = boxWraps.map((wrap, i) => {
    const ds = wrap.dataset;
    return {
      wrap,
      idx: i,
      start: parseFloat(ds.start) || 0.05,
      dur: parseFloat(ds.dur) || 0.22,
      from: parseFloat(ds.from) || -900,
      landX_en: parseFloat(ds.landXEn || ds.landX) || 0,
      landY_en: parseFloat(ds.landYEn || ds.landY) || 0,
      landX_ar: parseFloat(ds.landXAr || ds.landXEn || ds.landX) || 0,
      landY_ar: parseFloat(ds.landYAr || ds.landYEn || ds.landY) || 0,
      landX_mb: parseFloat(ds.landXMb || ds.landXEn || ds.landX) || 0,
      landY_mb: parseFloat(ds.landYMb || ds.landYEn || ds.landY) || 0,
      landZ: parseFloat(ds.landZ) || 0,
      rotX: parseFloat(ds.rotX) || 0,
      rotY: parseFloat(ds.rotY) || 0,
      rotZ: parseFloat(ds.rotZ || ds.tilt) || 0,
      scaleVal: parseFloat(ds.scale) || 1.0,
      drift: parseFloat(ds.drift || ds.rotZ) || 0
    };
  });

  /* Build springs */
  const springs = blocksData.map(() => ({
    y:     new Spring({ stiffness: 55, damping: 16 }),
    x:     new Spring({ stiffness: 50, damping: 18 }),
    scale: new Spring({ stiffness: 60, damping: 18 }),
  }));

  generateSparkles();

  /* Set initial state */
  blocksData.forEach((bd) => {
    const wrap = bd.wrap;
    if (!wrap) return;

    const isArabic = document.documentElement.dir === 'rtl' || 
                     (document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('ar')) ||
                     document.body.classList.contains('rtl') || 
                     window.location.pathname.includes('/ar') || 
                     window.location.search.includes('lang=ar');
    const isMobile = window.innerWidth <= 768;

    let curLandX = bd.landX_en;
    let curLandY = bd.landY_en;

    if (isMobile) {
      curLandX = bd.landX_mb;
      curLandY = bd.landY_mb;
    } else if (isArabic) {
      curLandX = bd.landX_ar;
      curLandY = bd.landY_ar;
    }

    wrap.style.left = `calc(50% + ${curLandX}%)`;
    wrap.style.top  = `calc(50% + ${curLandY}%)`;

    if (reducedMotion) {
      /* Jump straight to landed position */
      wrap.style.opacity   = '1';
      wrap.style.transform = `translate3d(-50%, -50%, ${bd.landZ}px) rotateX(${bd.rotX}deg) rotateY(${bd.rotY}deg) rotateZ(${bd.rotZ}deg)`;
    } else {
      /* Start hidden above */
      wrap.style.opacity   = '0';
      wrap.style.transform =
        `translate3d(-50%, -50%, ${bd.landZ}px) translateY(${bd.from}px) rotateZ(${bd.drift * 8}deg) scale(0.5)`;
    }
  });

  /* ── Animation loop ── */
  let lastTime = performance.now();
  let smoothP  = 0;

  function tick(timestamp) {
    const dt  = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime  = timestamp;

    const rawP = getScrollProgress(heroEl);
    smoothP   += (rawP - smoothP) * 0.12;

    /* Atmosphere */
    if (!reducedMotion) {
      updateSilk(smoothP);
      updateHalo(smoothP);
      setRibbonProgress(rawP);
    } else {
      updateHalo(0.5);
      setRibbonProgress(1);
    }

    const isArabic = document.documentElement.dir === 'rtl' || 
                     (document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('ar')) ||
                     document.body.classList.contains('rtl') || 
                     window.location.pathname.includes('/ar') || 
                     window.location.search.includes('lang=ar');
    const isMobile = window.innerWidth <= 768;

    /* Boxes */
    blocksData.forEach((bd, i) => {
      const p     = rawP;
      const end   = bd.start + bd.dur;
      const wrap  = bd.wrap;
      if (!wrap || reducedMotion) return;

      /* Device & Language specific landing coordinates */
      let curLandX = bd.landX_en;
      let curLandY = bd.landY_en;

      if (isMobile) {
        curLandX = bd.landX_mb;
        curLandY = bd.landY_mb;
      } else if (isArabic) {
        curLandX = bd.landX_ar;
        curLandY = bd.landY_ar;
      }

      wrap.style.left = `calc(50% + ${curLandX}%)`;
      wrap.style.top  = `calc(50% + ${curLandY}%)`;

      /* Y target */
      const targetY = mapRange(p, bd.start, end, bd.from, 0, true);

      /* X target */
      const targetX = mapRange(p, bd.start, end, bd.drift * 20, 0, true);

      /* Scale: overshoot then settle */
      let targetScale;
      if (p < bd.start) {
        targetScale = 0.5;
      } else if (p < bd.start + bd.dur * 0.6) {
        targetScale = mapRange(p, bd.start, bd.start + bd.dur * 0.6, 0.5, 1.08);
      } else {
        targetScale = mapRange(p, bd.start + bd.dur * 0.6, end, 1.08, 1);
      }

      /* Opacity fade-in */
      const opacity = mapRange(p, bd.start - 0.03, bd.start + 0.04, 0, 1, true);

      /* Rotate: tumble → overshoot → settle */
      const rotateZ = multiMap(p, [
        [bd.start,        bd.drift * 8],
        [end,             bd.rotZ * 1.4],
        [end + 0.02,      bd.rotZ],
        [1,               bd.rotZ],
      ]);

      /* Spring step */
      springs[i].y.setTarget(targetY);
      springs[i].x.setTarget(targetX);
      springs[i].scale.setTarget(targetScale);

      const sy = springs[i].y.step(dt);
      const sx = springs[i].x.step(dt);
      const ss = springs[i].scale.step(dt);

      /* Idle float after landing */
      const idleY = (p >= end + 0.01) ? getIdleY(i, timestamp) : 0;

      wrap.style.opacity   = Math.min(1, opacity);
      wrap.style.transform =
        `translate3d(-50%, -50%, ${bd.landZ}px) translateX(${sx}px) translateY(${sy + idleY}px) rotateX(${bd.rotX}deg) rotateY(${bd.rotY}deg) rotateZ(${rotateZ}deg) scale(${ss})`;
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/* ─── Boot & Theme Editor Events ──────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHero);
} else {
  initHero();
}

/* Shopify Theme Customizer Live Preview Listeners */
document.addEventListener('shopify:section:load', initHero);
document.addEventListener('shopify:section:select', initHero);
document.addEventListener('shopify:block:select', initHero);
document.addEventListener('shopify:block:deselect', initHero);


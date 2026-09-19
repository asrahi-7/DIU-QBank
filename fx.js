/* ==========================================================================
   InfinityWord — visual effects layer (pairs with theme.css)
   Does NOT touch your Firebase / auth / AI logic. It only decorates the DOM
   your existing scripts already produce and reacts to it via observers.

   Optional settings — define BEFORE this script loads:
     window.FX_CONFIG = { constellation:true, cursorGlow:true, tilt:true,
                          hero:true, reveal:true, ripple:true,
                          mobileMenu:true, shortcut:true };
   ========================================================================== */
(() => {
  'use strict';

  const cfg = Object.assign({
    constellation: true, cursorGlow: true, tilt: true, hero: true,
    reveal: true, ripple: true, mobileMenu: true, shortcut: true
  }, window.FX_CONFIG || {});

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const pointer = { x: -9999, y: -9999, on: false };

  /* ---------------------------------------------------------------- */
  /* 1. Constellation canvas — drifting "stars" linked like a graph;   */
  /*    the cursor wires itself to nearby nodes.                       */
  /* ---------------------------------------------------------------- */
  function constellation() {
    const c = document.createElement('canvas');
    c.id = 'fx-canvas';
    c.setAttribute('aria-hidden', 'true');
    document.body.prepend(c);
    const ctx = c.getContext('2d');
    const COLORS = ['154,134,255', '34,211,238', '235,238,255'];
    const LINK = 140, MOUSE_LINK = 190;
    let w = 0, h = 0, dpr = 1, nodes = [];

    function build() {
      const target = Math.min(w < 700 ? 36 : 90, Math.round((w * h) / 17000));
      while (nodes.length < target) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
          r: .8 + Math.random() * 1.2, col: COLORS[(Math.random() * COLORS.length) | 0],
          ph: Math.random() * 6.28
        });
      }
      nodes.length = target;
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      c.style.width = w + 'px'; c.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduce) frame(0, true);
    }
    function frame(t, still) {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!still) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
          if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
          if (pointer.on) {                       /* gentle pull toward the cursor */
            const dx = pointer.x - a.x, dy = pointer.y - a.y, d2 = dx * dx + dy * dy;
            if (d2 < 22000) { a.x += dx * .0016; a.y += dy * .0016; }
          }
        }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = 'rgba(154,134,255,' + ((1 - d / LINK) * .28).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (pointer.on) {
          const d = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          if (d < MOUSE_LINK) {
            ctx.strokeStyle = 'rgba(34,211,238,' + ((1 - d / MOUSE_LINK) * .55).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
          }
        }
        const pulse = still ? 1 : .65 + .35 * Math.sin(t / 900 + a.ph);
        ctx.fillStyle = 'rgba(' + a.col + ',' + (.75 * pulse).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      }
      if (!still) requestAnimationFrame(frame);
    }
    addEventListener('resize', resize);
    resize();
    if (!reduce) requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------- */
  /* 2. Cursor glow                                                    */
  /* ---------------------------------------------------------------- */
  function cursorGlow() {
    const el = document.createElement('div');
    el.id = 'fx-cursor';
    el.setAttribute('aria-hidden', 'true');
    document.body.prepend(el);
    let x = innerWidth / 2, y = innerHeight / 3;
    (function loop() {
      if (pointer.on) {
        x += (pointer.x - x) * .12; y += (pointer.y - y) * .12;
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      }
      el.classList.toggle('on', pointer.on);
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------------------------------------------- */
  /* 3. 3-D tilt + spotlight on question cards                         */
  /* ---------------------------------------------------------------- */
  function tilt() {
    let active = null, raf = 0, ev = null;
    const MAX = 5;
    const release = el => { el.classList.remove('is-tilting'); el.style.transform = ''; };

    function apply() {
      raf = 0;
      if (!ev) return;
      const card = ev.target && ev.target.closest ? ev.target.closest('.q-card') : null;
      if (active && active !== card) { release(active); active = null; }
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      card.classList.add('is-tilting');
      card.style.transform = 'perspective(900px) rotateX(' + ((.5 - py) * MAX * 2).toFixed(2) +
        'deg) rotateY(' + ((px - .5) * MAX * 2).toFixed(2) + 'deg) translateY(-3px)';
      active = card;
    }
    document.addEventListener('pointermove', e => { ev = e; if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
    document.addEventListener('scroll', () => { if (active) { release(active); active = null; } }, true);
    document.documentElement.addEventListener('pointerleave', () => { if (active) { release(active); active = null; } });
  }

  /* ---------------------------------------------------------------- */
  /* 4. Number count-up                                                */
  /* ---------------------------------------------------------------- */
  function animateNumber(node, target, fmt, dur) {
    if (reduce) { node.nodeValue = fmt(target); return; }
    const t0 = performance.now();
    let last = null;
    (function step(now) {
      const p = Math.min(1, (now - t0) / (dur || 900));
      const v = Math.round(target * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
      if (last !== null && node.nodeValue !== last) return;   /* someone else changed it — stop */
      last = fmt(v);
      node.nodeValue = last;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  function countUp(root) {
    root.querySelectorAll('.stat-value').forEach(el => {
      if (el.dataset.fxc) return;
      el.dataset.fxc = '1';
      const txt = el.textContent.trim();
      const node = el.firstChild;
      if (!/^\d[\d,]*$/.test(txt) || !node || node.nodeType !== 3) return;
      const commas = txt.indexOf(',') > -1;
      animateNumber(node, +txt.replace(/,/g, ''), v => commas ? v.toLocaleString('en-US') : String(v));
    });
  }

  /* ---------------------------------------------------------------- */
  /* 5. Staggered reveal for freshly-rendered cards                    */
  /* ---------------------------------------------------------------- */
  function reveal(root, sel) {
    if (reduce) return;
    const els = [...root.querySelectorAll(sel)].filter(e => !e.dataset.fx);
    if (!els.length) return;
    els.forEach((el, i) => {
      el.dataset.fx = '1';
      el.classList.add('fx-reveal');
      el.style.setProperty('--d', Math.min(i, 10) * 34 + 'ms');
    });
    requestAnimationFrame(() => requestAnimationFrame(() => els.forEach(el => el.classList.add('fx-in'))));
    setTimeout(() => els.forEach(el => {          /* hand transitions back to the normal hover styles */
      el.classList.remove('fx-reveal', 'fx-in'); el.style.removeProperty('--d');
    }), 1100);
  }

  /* ---------------------------------------------------------------- */
  /* 6. Hero strip — headline + live numbers + exam-type bar          */
  /* ---------------------------------------------------------------- */
  function hero() {
    const main = $('.main'), filterbar = $('#filterbar');
    if (!main || !filterbar) return;

    /* QRAW is the question array declared by the page's own script */
    const data = (typeof QRAW !== 'undefined' && Array.isArray(QRAW)) ? QRAW : null;
    const TYPES = [
      { key: 'Mid',       label: 'Mid',       color: '#ffd34d' },
      { key: 'Final',     label: 'Final',     color: '#ff5d73' },
      { key: 'Quiz',      label: 'Quiz',      color: '#34e08a' },
      { key: 'Lab Final', label: 'Lab final', color: '#ff9a3d' }
    ];
    let total = 0, depts = 0, courses = 0;
    if (data) {
      total = data.length;
      depts = new Set(data.map(r => r[1])).size;
      courses = new Set(data.map(r => String(r[3]).toLowerCase().trim())).size;
      TYPES.forEach(t => { t.n = data.filter(r => r[5] === t.key).length; });
    }
    const segs = TYPES.filter(t => t.n > 0);

    const sec = document.createElement('section');
    sec.className = 'fx-hero';
    sec.id = 'fxHero';
    sec.setAttribute('aria-label', 'Question bank overview');

    /* headline: split into words → letters for the one-time entrance */
    const title = 'Every past paper, one search away.';
    const copy = document.createElement('div');
    copy.className = 'fx-hero-copy';
    const h2 = document.createElement('h2');
    h2.className = 'fx-hero-title';
    h2.setAttribute('aria-label', title);
    let idx = 0;
    title.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span');
      w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      [...word].forEach(chr => {
        const s = document.createElement('span');
        s.className = 'ch'; s.style.setProperty('--i', idx++); s.textContent = chr;
        w.appendChild(s);
      });
      h2.appendChild(w);
      if (wi < arr.length - 1) { h2.appendChild(document.createTextNode(' ')); idx++; }
    });
    const sub = document.createElement('p');
    sub.className = 'fx-hero-sub';
    sub.textContent = 'Pick a department, narrow by exam type, then ask the AI solver to walk you through any question.';
    copy.append(h2, sub);
    sec.appendChild(copy);

    if (data) {
      const viz = document.createElement('div');
      viz.className = 'fx-hero-viz';
      const stats = document.createElement('div');
      stats.className = 'fx-stats';
      [[total, 'papers'], [depts, 'departments'], [courses, 'courses']].forEach(([n, label]) => {
        const box = document.createElement('div'); box.className = 'fx-stat';
        const b = document.createElement('b'); b.textContent = '0';
        const sp = document.createElement('span'); sp.textContent = label;
        box.append(b, sp); stats.appendChild(box);
        animateNumber(b.firstChild, n, v => v.toLocaleString('en-US'), 1400);
      });

      const bar = document.createElement('div');
      bar.className = 'fx-bar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Papers by exam type');
      const legend = document.createElement('div');
      legend.className = 'fx-legend';

      const pickType = key => {         /* reuse the page's own filter chip so its logic stays in charge */
        const chip = [...document.querySelectorAll('.filter-chip')]
          .find(ch => ch.textContent.replace(/[^A-Za-z ]/g, '').trim() === key);
        if (chip) chip.click();
      };
      segs.forEach((t, i) => {
        const seg = document.createElement('button');
        seg.type = 'button'; seg.className = 'fx-seg';
        seg.style.cssText = '--n:' + t.n + ';--c:' + t.color + ';--i:' + i;
        seg.setAttribute('aria-label', 'Show ' + t.label + ' papers (' + t.n + ')');
        seg.title = t.label + ': ' + t.n;
        seg.addEventListener('click', () => pickType(t.key));
        bar.appendChild(seg);

        const lb = document.createElement('button');
        lb.type = 'button';
        lb.style.setProperty('--c', t.color);
        const dot = document.createElement('i');
        const nm = document.createTextNode(t.label + ' ');
        const nb = document.createElement('b'); nb.textContent = t.n.toLocaleString('en-US');
        lb.append(dot, nm, nb);
        lb.addEventListener('click', () => pickType(t.key));
        legend.appendChild(lb);
      });
      viz.append(stats, bar, legend);
      sec.appendChild(viz);
    }

    main.insertBefore(sec, filterbar);

    /* hide the hero on pages that hide the filter bar (Settings, Admin …) */
    const sync = () => { sec.hidden = getComputedStyle(filterbar).display === 'none'; };
    new MutationObserver(sync).observe(filterbar, { attributes: true, attributeFilter: ['style', 'class'] });
    sync();
  }

  /* ---------------------------------------------------------------- */
  /* 7. Mobile drawer for the department sidebar                       */
  /* ---------------------------------------------------------------- */
  function mobileMenu() {
    const bar = $('.topbar'), sb = $('#sidebar'), app = $('#app') || $('.app');
    if (!bar || !sb || !app) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'fx-menu';
    btn.setAttribute('aria-label', 'Open departments'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
    bar.prepend(btn);
    const scrim = document.createElement('div');
    scrim.className = 'fx-scrim';
    app.appendChild(scrim);
    const set = on => {
      sb.classList.toggle('fx-open', on); scrim.classList.toggle('on', on);
      btn.setAttribute('aria-expanded', String(on));
    };
    btn.addEventListener('click', () => set(!sb.classList.contains('fx-open')));
    scrim.addEventListener('click', () => set(false));
    sb.addEventListener('click', e => { if (e.target.closest('.nav-item')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* ---------------------------------------------------------------- */
  /* 8. Small touches: ripple, title swap, search hint + "/" shortcut  */
  /* ---------------------------------------------------------------- */
  function ripple() {
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest && e.target.closest('.btn-primary,.btn-view,.filter-chip,.page-btn,.btn-close');
      if (!b) return;
      const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
      const sp = document.createElement('span');
      sp.className = 'fx-ripple';
      sp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
      b.appendChild(sp);
      setTimeout(() => sp.remove(), 650);
    });
  }
  function titleSwap() {
    const t = $('#topbarTitle');
    if (!t) return;
    let last = t.textContent;
    new MutationObserver(() => {
      if (t.textContent === last) return;
      last = t.textContent;
      t.classList.remove('fx-swap'); void t.offsetWidth; t.classList.add('fx-swap');
    }).observe(t, { childList: true, characterData: true, subtree: true });
  }
  function searchTouches() {
    const input = $('#searchInput');
    if (!input) return;
    input.placeholder = 'Search a course, semester or exam type';
    if (cfg.shortcut) {
      const kbd = document.createElement('kbd');
      kbd.className = 'fx-kbd'; kbd.textContent = '/'; kbd.setAttribute('aria-hidden', 'true');
      input.parentElement.appendChild(kbd);
      addEventListener('keydown', e => {
        if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
          e.preventDefault(); input.focus();
        }
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* boot                                                              */
  /* ---------------------------------------------------------------- */
  function init() {
    addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { pointer.on = false; });

    if (cfg.constellation) constellation();
    if (cfg.cursorGlow && finePointer && !reduce) cursorGlow();
    if (cfg.tilt && finePointer && !reduce) tilt();
    if (cfg.ripple && !reduce) ripple();
    if (cfg.hero) hero();
    if (cfg.mobileMenu) mobileMenu();
    titleSwap();
    searchTouches();

    const content = $('#content');
    if (content) {
      let pending = 0;
      const run = () => {
        pending = 0;
        if (cfg.reveal) reveal(content, '.q-card,.stat-card,.settings-card,.mini-row');
        countUp(content);
      };
      new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(run); })
        .observe(content, { childList: true, subtree: true });
      run();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* Vikshiv Labs — interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Settings: edit these ---------- */
  const EMAIL = 'hello@vikshivlabs.com';   // where inquiries go
  const CALENDAR_URL = '';                  // paste your Google Calendar / Calendly booking link

  /* ---------- Media loader ----------
     Every media slot has a name like data-name="work/film-1". The loader tries, in order:
       1. assets/work/film-1.mp4                      (your video)
       2. assets/work/film-1.jpg / .png / .webp      (your still image)
       3. Mixkit free-stock video (data-id), 720p then 360p
     So to replace anything, drop a file with that name into its folder. */
  const CDN = (id, q) => `https://assets.mixkit.co/videos/${id}/${id}-${q}.mp4`;
  const IMG_EXT = ['jpg', 'png', 'webp', 'jpeg'];
  const tryImages = (base, cb) => {
    let k = 0;
    const next = () => {
      if (k >= IMG_EXT.length) return cb(null);
      const url = `${base}.${IMG_EXT[k++]}`, im = new Image();
      im.onload = () => cb(url); im.onerror = next; im.src = url;
    };
    next();
  };
  function loadVideo(el) {
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = '1';
    const base = el.dataset.name ? `assets/${el.dataset.name}` : null;
    const remote = el.dataset.id ? [CDN(el.dataset.id, 720), CDN(el.dataset.id, 360)] : [];
    let stage = base ? 'local' : 'remote', r = 0;
    const play = () => { if (el.hasAttribute('autoplay') || el.closest('.slide.is-active')) el.play().catch(() => {}); };
    const next = () => {
      if (stage === 'local') {
        stage = 'image';
        el.src = `${base}.mp4`; el.load(); play();
      } else if (stage === 'image') {
        stage = 'checking';
        tryImages(base, (url) => {
          if (url) { el.removeAttribute('src'); el.poster = url; el.classList.add('is-still'); el.load(); return; }
          stage = 'remote'; next();
        });
      } else if (stage === 'remote' && r < remote.length) {
        el.src = remote[r++]; el.load(); play();
      }
    };
    if (el._onErr) el.removeEventListener('error', el._onErr);
    el.removeAttribute('poster');
    el.classList.remove('is-still');
    el._onErr = () => { if (stage !== 'checking') next(); };
    el.addEventListener('error', el._onErr);
    next();
  }
  const vio = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        loadVideo(v);
        if (v.hasAttribute('autoplay') || v.closest('.slide.is-active') || v.closest('.poster')) v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { rootMargin: '250px 0px' });
  $$('.lazy-video').forEach((v) => (v.dataset.name === 'hero' ? loadVideo(v) : vio.observe(v)));

  /* ---------- Hero title: split into letters ---------- */
  const title = $('[data-split]');
  if (title) {
    let n = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((word) => {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.append(' '); return; }
            const w = document.createElement('span'); w.className = 'w';
            [...word].forEach((ch) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', n++); s.textContent = ch; w.append(s); });
            frag.append(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    };
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    walk(title);
  }

  /* ---------- Intro (film leader 3-2-1) ---------- */
  const done = () => document.body.classList.add('intro-done');
  if (reduce || sessionStorage.getItem('vl-intro')) { $('.intro')?.remove(); done(); }
  else {
    document.body.classList.add('is-intro');
    const num = $('.intro__num');
    let k = 3;
    const t = setInterval(() => {
      k -= 1;
      if (k > 0) { num.textContent = k; return; }
      clearInterval(t);
      done();
      document.body.classList.remove('is-intro');
      try { sessionStorage.setItem('vl-intro', '1'); } catch (e) {}
      setTimeout(() => $('.intro')?.remove(), 1300);
    }, 420);
  }

  /* ---------- Hero timecode ---------- */
  const tc = $('[data-tc]');
  if (tc) {
    const t0 = performance.now(), p = (x) => String(x).padStart(2, '0');
    const draw = () => {
      const s = (performance.now() - t0) / 1000;
      tc.textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(Math.floor(s) % 60)}:${p(Math.floor((s % 1) * 24))}`;
      requestAnimationFrame(draw);
    };
    draw();
  }

  /* ---------- Nav, progress, hero scroll-morph, marquee velocity, process line ---------- */
  const nav = $('[data-nav]');
  const links = $$('.nav__links a');
  const darkSections = $$('[data-theme="dark"]').filter((s) => !s.hasAttribute('data-hero'));
  const bar = $('.progress span');
  const hero = $('[data-hero]');
  const frame = $('.hero__frame');
  const heroVid = $('.hero__media');
  const marquee = $('[data-marquee]');
  const stepsLine = $('.steps-line');
  const stepsWrap = $('.steps-wrap');
  let mqX = 0, lastY = scrollY, vel = 0, mouseX = 0, mouseY = 0;

  addEventListener('mousemove', (e) => { mouseX = e.clientX / innerWidth - 0.5; mouseY = e.clientY / innerHeight - 0.5; }, { passive: true });

  const updateNavState = () => {
    nav.classList.toggle('is-pill', scrollY > innerHeight * 0.55);
    const onDark = darkSections.some((s) => { const r = s.getBoundingClientRect(); return r.top <= 40 && r.bottom >= 40; });
    nav.classList.toggle('on-dark', onDark);
    let current = '';
    ['work', 'originals', 'process'].forEach((id) => { const s = document.getElementById(id); if (s && s.getBoundingClientRect().top < innerHeight * 0.45) current = id; });
    if (scrollY > ($('#pricing')?.offsetTop || 1e9) - innerHeight * 0.45) current = '';
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${current}`));
  };
  addEventListener('scroll', updateNavState, { passive: true });
  updateNavState();

  const frameLoop = () => {
    const y = scrollY;
    vel = lerp(vel, y - lastY, 0.12); lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (!reduce && hero) {
      const p = clamp(y / (hero.offsetHeight || 1), 0, 1);
      frame.style.transform = `scale(${1 - p * 0.08})`;
      frame.style.borderRadius = `${16 + p * 24}px`;
      if (heroVid) heroVid.style.transform = `scale(${1.08 + p * 0.1}) translate(${mouseX * -18}px, ${mouseY * -12 + p * 60}px)`;
    }
    if (marquee && !reduce) {
      mqX -= 0.6 + Math.abs(vel) * 0.35;
      const half = marquee.scrollWidth / 2;
      if (-mqX >= half) mqX += half;
      marquee.style.transform = `translateX(${mqX}px) skewX(${clamp(-vel * 0.4, -12, 12)}deg)`;
    }
    if (stepsLine && stepsWrap) {
      const r = stepsWrap.getBoundingClientRect();
      stepsLine.style.setProperty('--p', clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3), 0, 1));
    }
    requestAnimationFrame(frameLoop);
  };
  requestAnimationFrame(frameLoop);

  /* ---------- Reveal (fade + un-blur) ---------- */
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const sibs = $$(':scope > .reveal', e.target.parentElement);
      e.target.style.transitionDelay = `${Math.max(0, sibs.indexOf(e.target)) * 0.09}s`;
      e.target.classList.add('is-in');
      rio.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => rio.observe(el));

  /* ---------- Custom cursor ---------- */
  const cursor = $('.cursor');
  if (fine && cursor) {
    const label = $('.cursor__label', cursor);
    let cx = -100, cy = -100, tx = cx, ty = cy, seen = false;
    cursor.classList.add('is-hidden');
    addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; if (!seen) { seen = true; cx = tx; cy = ty; cursor.classList.remove('is-hidden'); } });
    const loop = () => { cx = lerp(cx, tx, 0.2); cy = lerp(cy, ty, 0.2); cursor.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-big'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-big'));
    });
    $$('a, button, input, textarea').forEach((el) => {
      el.addEventListener('mouseenter', () => { if (!el.closest('[data-cursor]')) cursor.classList.add('is-hidden'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hidden'));
    });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduce) {
    $$('[data-magnet]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Carousel with progress bars + drag ---------- */
  const car = $('[data-carousel]');
  if (car) {
    const slides = $$('.slide', car);
    const thumbs = $$('.thumb', car);
    const nowEl = $('[data-count-now]', car);
    const DUR = 7000;
    let idx = 0, start = performance.now(), paused = false, pauseAt = 0;
    const show = (n) => {
      const prev = slides[idx];
      prev.classList.remove('is-active'); $('video', prev).pause();
      idx = (n + slides.length) % slides.length;
      const s = slides[idx];
      s.classList.add('is-active');
      const v = $('video', s); loadVideo(v); v.currentTime = 0; v.play().catch(() => {});
      thumbs.forEach((t, i) => { t.classList.toggle('is-active', i === idx); $('i', t).style.transform = `scaleX(${i < idx ? 1 : 0})`; });
      if (nowEl) nowEl.textContent = String(idx + 1).padStart(2, '0');
      start = performance.now();
    };
    const tick = (now) => {
      if (!paused) {
        const p = clamp((now - start) / DUR, 0, 1);
        const bar = $('i', thumbs[idx]); if (bar) bar.style.transform = `scaleX(${p})`;
        if (p >= 1) show(idx + 1);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    car.addEventListener('mouseenter', () => { paused = true; pauseAt = performance.now(); });
    car.addEventListener('mouseleave', () => { paused = false; start += performance.now() - pauseAt; });
    $('[data-prev]', car).addEventListener('click', () => show(idx - 1));
    $('[data-next]', car).addEventListener('click', () => show(idx + 1));
    thumbs.forEach((t) => t.addEventListener('click', () => show(+t.dataset.go)));
    const track = $('.carousel__track', car);
    let x0 = null, moved = false;
    track.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; x0 = e.clientX; moved = false; });
    addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) { moved = true; show(idx + (dx < 0 ? 1 : -1)); }
    });
    slides.forEach((s) => loadVideo($('video', s)));
  }

  /* ---------- Storyboard → Final compare ---------- */
  const cmp = $('[data-compare]');
  if (cmp) {
    let dragging = false, auto = true, t = 0;
    const set = (clientX) => { const r = cmp.getBoundingClientRect(); cmp.style.setProperty('--x', `${clamp((clientX - r.left) / r.width, 0.02, 0.98) * 100}%`); };
    cmp.addEventListener('pointerdown', (e) => { dragging = true; auto = false; set(e.clientX); cmp.setPointerCapture(e.pointerId); });
    cmp.addEventListener('pointermove', (e) => { if (dragging || (fine && e.pointerType === 'mouse')) { auto = false; set(e.clientX); } });
    cmp.addEventListener('pointerup', () => { dragging = false; });
    // gentle idle sweep until the visitor touches it
    const sweep = () => { if (auto && !reduce) { t += 0.012; cmp.style.setProperty('--x', `${50 + Math.sin(t) * 28}%`); } requestAnimationFrame(sweep); };
    sweep();
    // keep both layers of the compare in sync
    const [a, b] = $$('video', cmp);
    setInterval(() => { if (a && b && a.readyState > 1 && b.readyState > 1 && Math.abs(a.currentTime - b.currentTime) > 0.15) b.currentTime = a.currentTime; }, 1000);
  }

  /* ---------- Poster tilt + glare ---------- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', `${(px - 0.5) * 14}deg`);
        el.style.setProperty('--rx', `${(0.5 - py) * 12}deg`);
        el.style.setProperty('--gx', `${px * 100}%`);
        el.style.setProperty('--gy', `${py * 100}%`);
      });
      el.addEventListener('mouseleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Process: scroll story + sticky monitor ---------- */
  const flow = $('[data-pflow]');
  if (flow) {
    const steps = $$('.pstep', flow);
    const mon = $('[data-monitor]', flow);
    const labels = ['01 — Brief', '02 — Storyboard', '03 — Production', '04 — Delivery'];
    const days = ['DAY 0', 'DAY 1–2', 'DAY 3–6', 'DAY 7'];
    const states = $$('.mstate', mon);
    const rail = $('.pflow__rail', flow);
    let cur = -1, timers = [];
    const clearT = () => { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; };
    const typeBrief = () => {
      const dds = $$('.brief dd', mon); const ok = $('.brief__ok', mon);
      dds.forEach((d) => { d.textContent = ''; d.classList.remove('typing'); }); ok.classList.remove('on');
      let di = 0;
      const typeOne = () => {
        if (di >= dds.length) { ok.classList.add('on'); return; }
        const d = dds[di], txt = d.dataset.type; let ci = 0; d.classList.add('typing');
        const iv = setInterval(() => {
          d.textContent = txt.slice(0, ++ci);
          if (ci >= txt.length) { clearInterval(iv); d.classList.remove('typing'); di++; timers.push(setTimeout(typeOne, 180)); }
        }, reduce ? 0 : 38);
        timers.push(iv);
      };
      timers.push(setTimeout(typeOne, 350));
    };
    const runProd = () => {
      const lis = $$('.prod__layers li', mon); const r = $('.prod__render i', mon);
      lis.forEach((l) => l.classList.remove('on')); r.style.setProperty('--r', 0);
      lis.forEach((l, i) => timers.push(setTimeout(() => l.classList.add('on'), 400 + i * 650)));
      const t0 = performance.now();
      const iv = setInterval(() => { const p = clamp((performance.now() - t0) / 3200, 0, 1); r.style.setProperty('--r', p); if (p >= 1) clearInterval(iv); }, 40);
      timers.push(iv);
    };
    const setStep = (i) => {
      if (i === cur) return; cur = i; clearT();
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      mon.dataset.state = i;
      $('[data-mlabel]', mon).textContent = labels[i];
      $('[data-mtc]', mon).textContent = days[i];
      $$('.monitor__steps span', mon).forEach((s, k) => s.classList.toggle('on', k <= i));
      states.forEach((st, k) => $$('video', st).forEach((v) => {
        if (k === i) { loadVideo(v); v.play().catch(() => {}); } else v.pause();
      }));
      if (i === 0) typeBrief();
      if (i === 2) runProd();
    };
    const sio = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) setStep(+e.target.dataset.step); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => sio.observe(s));
    // start typing the brief once the monitor first comes into view
    const mio = new IntersectionObserver((en) => { if (en[0].isIntersecting) { if (cur < 0) setStep(0); else if (cur === 0) typeBrief(); mio.disconnect(); } }, { threshold: 0.3 });
    mio.observe(mon);
    const railUpdate = () => {
      const r = $('.psteps', flow).getBoundingClientRect();
      rail.style.setProperty('--p', clamp((innerHeight / 2 - r.top) / r.height, 0, 1));
    };
    addEventListener('scroll', railUpdate, { passive: true }); railUpdate();
  }

  /* ---------- Pricing spotlight ---------- */
  $$('[data-spot]').forEach((el) => el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------- Counters ---------- */
  const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, t0 = performance.now();
    const step = (now) => { const p = clamp((now - t0) / 1600, 0, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); cio.unobserve(el);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* ---------- About: words light up as you scroll ---------- */
  const words = $('[data-words]');
  if (words) {
    words.innerHTML = words.textContent.trim().split(/\s+/).map((w) => `<span class="wd">${w}</span>`).join(' ');
    const wds = $$('.wd', words);
    const onS = () => {
      const r = words.getBoundingClientRect();
      const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0, 1);
      const n = Math.round(p * wds.length);
      wds.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    addEventListener('scroll', onS, { passive: true }); onS();
  }

  /* ---------- Footer giant letters ---------- */
  const giant = $('[data-giant]');
  if (giant) {
    giant.innerHTML = [...giant.textContent].map((c, i) => `<span class="gl" style="--i:${i}">${c}</span>`).join('');
    const fio = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); fio.disconnect(); } }), { threshold: 0.2 });
    fio.observe($('.footer'));
  }

  /* ---------- Lightbox ---------- */
  const lb = $('.lightbox');
  const lbVideo = $('video', lb);
  const openLB = (name, id, title) => {
    lbVideo.dataset.name = name; lbVideo.dataset.id = id;
    delete lbVideo.dataset.loaded;
    lbVideo.setAttribute('autoplay', '');
    $('.lightbox__title', lb).textContent = `${title} — Vikshiv Labs`;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    loadVideo(lbVideo);
    document.body.style.overflow = 'hidden';
  };
  const closeLB = () => {
    lb.classList.remove('is-open');
    lbVideo.pause();
    setTimeout(() => { lb.hidden = true; lbVideo.removeAttribute('src'); lbVideo.load(); }, 350);
    document.body.style.overflow = '';
  };
  $$('[data-film]').forEach((b) => b.addEventListener('click', () => openLB(b.dataset.film, b.dataset.id, b.dataset.title)));
  $$('.poster').forEach((p) => p.addEventListener('click', () => {
    const v = $('video', p); openLB(v.dataset.name, v.dataset.id, $('strong', p).textContent);
  }));
  $('.lightbox__close').addEventListener('click', closeLB);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) closeLB(); });

  /* ---------- Booking ---------- */
  const cal = $('[data-calendar]');
  if (cal) {
    if (CALENDAR_URL) { cal.href = CALENDAR_URL; cal.target = '_blank'; cal.rel = 'noopener'; }
    else cal.remove();
  }
  $('#inquiry').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const body = `Name: ${d.name}\nEmail: ${d.email}\nBrand: ${d.brand}\nPreferred date: ${d.date}\n\n${d.msg}`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Intro call — ' + (d.brand || d.name))}&body=${encodeURIComponent(body)}`;
  });
})();

const GotaScene = {
  _canvas: null, _ctx: null, _raf: null, _running: false,
  _sprites: {}, _imagesLoaded: 0, _imagesTotal: 7,
  _phase: 'idle',
  _spinT: 0, _spinIdx: 0, _spinEnd: 1.7,
  _bgColor: '#1a1a2e', _targetBgColor: '#1a1a2e',
  _flash: 0, _burst: 0, _punch: 0, _last: 0,
  _rewards: null, _onDone: null, _missionRewards: null,
  rewards: null,

  init() {
    this._canvas = document.getElementById('gota-canvas');
    if (!this._canvas) {
      console.error('GotaScene: canvas element not found');
      return;
    }
    this._ctx = this._canvas.getContext('2d');
    if (!this._ctx) {
      console.error('GotaScene: could not get 2d context');
      return;
    }
    this._preloadSprites();
    this._resize();
    this._canvas.addEventListener('pointerdown', e => this._onTap(e));
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    on('gota-collect', () => this._finish());
    on('gota-exit', () => this._finish());
    on('gota-reveal-ok', () => this._close());
    window.addEventListener('resize', () => this._resize());
  },

  _preloadSprites() {
    const names = ['gota-comum','gota-raro','gota-super_raro','gota-epico','gota-mitico','gota-lendario','gota-primal'];
    this._imagesTotal = names.length;
    this._imagesLoaded = 0;
    names.forEach(name => {
      const img = new Image();
      img.onload = () => { this._imagesLoaded++; };
      img.onerror = () => { this._imagesLoaded++; };
      img.src = 'assets/img/gota/' + name + '.png';
      this._sprites[name] = img;
    });
  },

  _resize() {
    if (!this._canvas) return;
    const w = window.innerWidth, h = window.innerHeight;
    this._canvas.width = w;
    this._canvas.height = h;
  },

  show(missionRewards, onDone) {
    this._resize();
    this._missionRewards = missionRewards || { coins:0, trophies:0 };
    this._onDone = onDone || (() => {});
    this._rewards = null;
    this.rewards = null;
    if (!Primordial.state.active) Primordial.start('shop');

    this._phase = 'spin';
    this._spinT = 0;
    this._spinIdx = 0;
    this._flash = 0;
    this._burst = 0;
    this._punch = 0;
    this._running = true;
    this._last = performance.now();
    this._bgColor = '#1a1a2e';
    this._targetBgColor = Primordial.getTierData().color;

    document.getElementById('screen-gota').classList.add('active');
    const rewards = document.getElementById('gota-rewards');
    if (rewards) { rewards.style.display = 'none'; rewards.innerHTML = ''; }
    this._setHud(true);
    this._updateMeter();
    this._updateTier(Primordial.TIERS[Primordial.state.winner]);
    this._updateTimer(Primordial.state.remainingMs);

    const hint = document.getElementById('gota-hint');
    if (hint && !localStorage.getItem('prf_gota_onboarding')) {
      localStorage.setItem('prf_gota_onboarding', '1');
      hint.style.display = 'block';
      setTimeout(() => { hint.style.display = 'none'; }, 3000);
    }

    this._loop(this._last);
  },

  _setHud(show) {
    ['gota-top', 'gota-meter', 'gota-actions'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? '' : 'none';
    });
  },

  _loop(now) {
    if (!this._running) return;
    const dt = Math.min(0.05, Math.max(0, (now - this._last) / 1000));
    this._last = now;

    if (this._phase === 'spin') {
      this._spinT += dt;
      this._spinIdx = Math.floor(this._spinT / 0.075) % Primordial.TIERS.length;
      if (this._spinT >= this._spinEnd) {
        this._phase = 'play';
        this._spinIdx = Primordial.state.tierIdx;
        this._punch = 1;
        this._flash = 0.45;
        this._targetBgColor = Primordial.getTierData().color;
        this._sfx('gotaBurst');
      }
    } else if (this._phase === 'play') {
      const left = Primordial.tick(Date.now());
      this._updateTimer(left);
      if (left <= 0) this._finish();
    }

    this._flash = Math.max(0, this._flash - dt * 2);
    this._burst = Math.max(0, this._burst - dt * 1.6);
    this._punch = Math.max(0, this._punch - dt * 3);
    this._bgColor = this._lerpColor(this._bgColor, this._targetBgColor, Math.min(1, dt * 5));

    this._draw();
    this._raf = requestAnimationFrame(t => this._loop(t));
  },

  _lerpColor(a, b, t) {
    const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
    const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
  },

  _updateTimer(ms) {
    const fill = document.getElementById('gota-timer-fill');
    if (fill) {
      const pct = Math.max(0, Math.min(100, (ms / Primordial.ROUND_MS) * 100));
      fill.style.width = pct + '%';
      fill.classList.toggle('low', ms <= 3000);
    }
    const label = document.getElementById('gota-timer-label');
    if (label) label.textContent = (ms / 1000).toFixed(1) + 's';
  },

  _updateTier(tier) {
    const el = document.getElementById('gota-tier-name');
    if (!el || !tier) return;
    el.textContent = tier.name.toUpperCase();
    el.style.color = tier.color;
  },

  _updateMeter() {
    const el = document.getElementById('gota-meter');
    if (!el) return;
    const filled = Primordial.state.charge;
    let html = '';
    for (let i = 0; i < Primordial.CHARGE_MAX; i++) {
      html += `<span class="gota-pip ${i < filled ? 'on' : ''}"></span>`;
    }
    el.innerHTML = html;
  },

  _draw() {
    const ctx = this._ctx, w = this._canvas.width, h = this._canvas.height;

    ctx.fillStyle = this._bgColor;
    ctx.fillRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.55);
    grad.addColorStop(0, 'rgba(255,255,255,0.09)');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const tierIdx = this._phase === 'spin' ? this._spinIdx : Primordial.state.tierIdx;
    const tier = Primordial.TIERS[tierIdx] || Primordial.TIERS[0];

    if (this._phase === 'reveal') {
      if (this._flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (this._flash * 0.35) + ')';
        ctx.fillRect(0, 0, w, h);
      }
      return;
    }

    const cx = w / 2;
    const cy = h * 0.40;
    const baseR = Math.min(w, h) * (0.155 + this._punch * 0.03);

    if (this._burst > 0) this._drawBurst(ctx, cx, cy, baseR, tier.color);

    this._drawSprite(ctx, cx, cy, baseR, tier);

    ctx.fillStyle = tier.color || '#fff';
    ctx.font = 'bold ' + Math.round(Math.min(w, h) * 0.05) + 'px ' + this._font();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tier.name.toUpperCase(), cx, cy + baseR + 34);

    this._drawChips(ctx, w, h, tierIdx);

    if (this._phase === 'spin') {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = 'bold ' + Math.round(Math.min(w, h) * 0.026) + 'px sans-serif';
      ctx.fillText('A SORTEAR A RARIDADE…', cx, h * 0.24);
    }

    if (this._flash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (this._flash * 0.35) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  },

  _drawBurst(ctx, cx, cy, r, color) {
    const a = this._burst;
    ctx.save();
    ctx.globalAlpha = Math.min(1, a);
    ctx.strokeStyle = color || '#fff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const r0 = r * (1.15 + (1 - a) * 0.9);
      const r1 = r0 + 26 * a;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
      ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx.stroke();
    }
    ctx.restore();
  },

  _drawChips(ctx, w, h, activeIdx) {
    const tiers = Primordial.TIERS;
    const chipW = Math.min(w * 0.115, 120);
    const gap = Math.max(4, chipW * 0.08);
    const total = tiers.length * chipW + (tiers.length - 1) * gap;
    const startX = (w - total) / 2;
    const y = h * 0.74;
    const chipH = Math.min(46, h * 0.11);

    tiers.forEach((t, i) => {
      const x = startX + i * (chipW + gap);
      const on = i === activeIdx;
      ctx.globalAlpha = on ? 1 : 0.35;
      ctx.fillStyle = on ? t.color : 'rgba(255,255,255,0.06)';
      this._roundRect(ctx, x, y, chipW, chipH, 8);
      ctx.fill();
      if (on) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = on ? '#0a0c16' : 'rgba(255,255,255,0.7)';
      ctx.font = 'bold ' + Math.max(9, Math.round(chipH * 0.28)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.name.slice(0, 9), x + chipW / 2, y + chipH / 2);
      ctx.globalAlpha = 1;
    });
  },

  _font() {
    try {
      const f = getComputedStyle(document.body).fontFamily;
      if (f) return f;
    } catch (e) {}
    return 'sans-serif';
  },

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  _drawSprite(ctx, cx, cy, r, tier) {
    const name = (tier.sprite || '').replace('.png', '');
    const img = this._sprites[name];
    if (img && img.complete && img.naturalWidth > 0) {
      const s = r * 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - r, cy - r, s, s);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = tier.color || '#8a9ba8';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = Math.round(r * 1.2) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💧', cx, cy);
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = tier.color || 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();
  },

  _onTap(e) {
    if (this._phase !== 'play') return;
    if (e && e.isPrimary === false) return;
    const result = Primordial.tap(performance.now());
    if (!result) return;

    const tier = Primordial.getTierData();
    this._targetBgColor = tier.color;
    this._updateMeter();
    this._updateTier(tier);

    if (result === 'upgrade') {
      this._punch = 1;
      this._flash = 0.5;
      this._burst = 1;
      this._sfx('gotaUpgrade');
      if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
    } else if (result === 'full') {
      this._flash = 0.2;
      this._sfx('gotaMiss');
      if (navigator.vibrate) navigator.vibrate(14);
    } else {
      this._sfx('gotaTap');
      if (navigator.vibrate) navigator.vibrate(8);
    }
  },

  _finish() {
    if (this._phase === 'reveal' || this._phase === 'idle') return;
    this._phase = 'reveal';
    this._rewards = Primordial.claim() || [];
    this.rewards = this._rewards;
    this._flash = 0.7;
    this._burst = 1;
    this._sfx('gotaClaim');
    if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 30]);
    this._setHud(false);
    this._renderRewards();
  },

  _renderRewards() {
    const panel = document.getElementById('gota-rewards');
    if (!panel) return;
    const tier = Primordial.getTierData();
    const list = this._rewards || [];
    const cards = list.length
      ? list.map(r => `
          <div class="gota-card" style="border-color:${tier.color}">
            <div class="gota-card-icon">${r.icon || (r.type === 'coins' ? COIN_SVG : (r.type === 'trophies' ? '🏆' : '📦'))}</div>
            <div class="gota-card-text">${Primordial.rewardText(r)}</div>
          </div>
        `).join('')
      : `<div class="gota-card-empty">Sem recompensas nesta Gota.</div>`;

    panel.innerHTML = `
      <div class="gota-reveal">
        <div class="gota-reveal-tier" style="color:${tier.color}">⭐ ${tier.name.toUpperCase()} ⭐</div>
        <div class="gota-reveal-cards">${cards}</div>
        <button class="gota-reveal-ok" id="gota-reveal-ok">CONTINUAR</button>
      </div>
    `;
    panel.style.display = 'flex';
    const ok = document.getElementById('gota-reveal-ok');
    if (ok) ok.onclick = () => this._close();
  },

  _close() {
    if (this._phase !== 'reveal') return;
    this._phase = 'idle';
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    const panel = document.getElementById('gota-rewards');
    if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
    document.getElementById('screen-gota').classList.remove('active');
    const cb = this._onDone;
    this._onDone = null;
    if (cb) cb();
  },

  _sfx(name) {
    if (typeof AudioFX === 'undefined') return;
    try { AudioFX.play(name); } catch (e) {}
  },
};

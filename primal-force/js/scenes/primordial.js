const GotaScene = {
  _canvas: null, _ctx: null, _raf: null, _running: false,
  _sprites: {}, _imagesLoaded: 0, _imagesTotal: 7,
  _state: 'idle', // idle | playing | popup | rewards | done
  _popupTimer: 0, _popupText: '',
  _rewardIndex: 0, _rewardTimer: 0,
  _rewards: [], _onDone: null, _missionRewards: null,
  _bgColor: '#1a1a2e', _targetBgColor: '#1a1a2e',

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
    // Pointerdown + touchstart para compatibilidade mobile
    this._canvas.addEventListener('pointerdown', e => this._onTap(e));
    this._canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this._onTap(e);
    }, { passive: false });
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
    this._state = 'playing';
    this._rewardIndex = 0;
    this._popupTimer = 0;
    this._running = true;
    this._bgColor = '#1a1a2e';
    this._targetBgColor = '#1a1a2e';

    document.getElementById('screen-gota').classList.add('active');
    document.getElementById('gota-tap-counter').textContent = '0';

    const hint = document.getElementById('gota-hint');
    if (!localStorage.getItem('prf_gota_onboarding')) {
      localStorage.setItem('prf_gota_onboarding', '1');
      hint.style.display = 'block';
      setTimeout(() => { hint.style.display = 'none'; }, 3000);
    }

    this._loop();
  },

  _loop() {
    if (!this._running) return;

    if (this._state === 'popup') {
      this._popupTimer -= 0.016;
      if (this._popupTimer <= 0) {
        this._state = 'playing';
      }
    }

    if (this._state === 'rewards') {
      this._rewardTimer += 0.016;
      if (this._rewardTimer > 0.6 && this._rewardIndex < this._rewards.length) {
        this._rewardIndex++;
        this._rewardTimer = 0;
      }
      if (this._rewardIndex >= this._rewards.length && this._rewardTimer > 1.5) {
        this._state = 'done';
        this._running = false;
        cancelAnimationFrame(this._raf);
        document.getElementById('screen-gota').classList.remove('active');
        this._onDone();
        return;
      }
    }

    // Animação suave da cor de fundo
    this._bgColor = this._lerpColor(this._bgColor, this._targetBgColor, 0.08);

    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
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

  _draw() {
    const ctx = this._ctx, w = this._canvas.width, h = this._canvas.height;

    if (this._state === 'rewards' || this._state === 'done') {
      this._drawRewards(ctx, w, h);
      return;
    }

    // Fundo com cor da raridade (suave)
    ctx.fillStyle = this._bgColor;
    ctx.fillRect(0, 0, w, h);

    // Gradiente no centro
    const tier = Primordial.getTierData();
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h * 0.38;
    const baseR = Math.min(w, h) * 0.18;

    // Gota (sprite)
    this._drawSprite(ctx, cx, cy, baseR, tier);

    // Nome do tier
    ctx.fillStyle = tier.color || '#fff';
    ctx.font = 'bold ' + Math.round(Math.min(w, h) * 0.05) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tier.name.toUpperCase(), cx, cy + baseR + 36);

    // Indicador de progresso (toques neste tier)
    const tapsForTier = Primordial.state.tapsForTier;
    const needed = Primordial.TAPS_PER_TIER;
    for (let i = 0; i < needed; i++) {
      const bx = cx - (needed - 1) * 12 + i * 24;
      const by = cy + baseR + 66;
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fillStyle = i < tapsForTier ? tier.color || '#fff' : 'rgba(255,255,255,0.2)';
      ctx.fill();
    }

    // Total de toques
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = Math.round(Math.min(w, h) * 0.028) + 'px sans-serif';
    ctx.fillText('Total: ' + Primordial.state.taps + ' toques', cx, cy + baseR + 100);

    // Popup de evolução
    if (this._state === 'popup') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const pw = w * 0.6, ph = 50;
      const px = (w - pw) / 2, py = h * 0.15;
      ctx.beginPath();
      ctx.moveTo(px + 12, py);
      ctx.lineTo(px + pw - 12, py);
      ctx.quadraticCurveTo(px + pw, py, px + pw, py + 12);
      ctx.lineTo(px + pw, py + ph - 12);
      ctx.quadraticCurveTo(px + pw, py + ph, px + pw - 12, py + ph);
      ctx.lineTo(px + 12, py + ph);
      ctx.quadraticCurveTo(px, py + ph, px, py + ph - 12);
      ctx.lineTo(px, py + 12);
      ctx.quadraticCurveTo(px, py, px + 12, py);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = tier.color || '#fff';
      ctx.font = 'bold ' + Math.round(Math.min(w, h) * 0.04) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⬆ ' + this._popupText, w / 2, py + ph / 2);
    }
  },

  _drawSprite(ctx, cx, cy, r, tier) {
    const name = tier.sprite.replace('.png', '');
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
      ctx.fillText(tier.icon || '💧', cx, cy);
    }
  },

  _drawRewards(ctx, w, h) {
    const tier = Primordial.getTierData();
    // Fundo com a cor do tier escurecida
    ctx.fillStyle = this._bgColor;
    ctx.fillRect(0, 0, w, h);

    // Nome do tier
    ctx.fillStyle = tier.color || '#fff';
    ctx.font = 'bold ' + Math.round(Math.min(w, h) * 0.06) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐ ' + tier.name.toUpperCase() + ' ⭐', w / 2, h * 0.18);

    // Lista de recompensas
    const shown = this._rewards.slice(0, this._rewardIndex);
    const startY = h * 0.32;
    const lineH = Math.min(48, h * 0.07);
    shown.forEach((r, i) => {
      const y = startY + i * lineH;
      const bounce = Math.sin(this._rewardTimer * 8 - i) * 4;
      ctx.fillStyle = '#fff';
      ctx.font = Math.round(Math.min(w, h) * 0.038) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Primordial.rewardText(r), w / 2, y + bounce);
    });

    if (this._rewardIndex >= this._rewards.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = Math.round(Math.min(w, h) * 0.03) + 'px sans-serif';
      ctx.fillText('A continuar…', w / 2, h * 0.85);
    }
  },

  _onTap(e) {
    if (this._state === 'rewards' || this._state === 'done') return;
    const now = performance.now();
    const result = Primordial.tap(now);
    if (!result) return;

    document.getElementById('gota-tap-counter').textContent = Primordial.state.taps;

    const tier = Primordial.getTierData();
    this._targetBgColor = tier.color || '#1a1a2e';

    if (result === 'evolve') {
      this._popupText = tier.name + '!';
      this._popupTimer = 1.2;
      this._state = 'popup';
      if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
    } else if (result === 'claim') {
      this._rewards = Primordial.getRewards();
      Primordial.claimRewards(this._rewards);
      window._gotaRewards = this._rewards;
      this._rewardIndex = 0;
      this._rewardTimer = 0;
      this._state = 'rewards';
      if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 30]);
    } else {
      if (navigator.vibrate) navigator.vibrate(10);
    }
  },
};

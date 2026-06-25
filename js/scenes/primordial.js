const PrimordialScene = {
  _canvas: null, _ctx: null, _raf: null, _running: false,
  _onboardingDone: false, _exploding: false, _explodeTimer: 0,
  _popRewards: [], _returnTo: null,

  init() {
    this._canvas = document.getElementById('primordial-canvas');
    this._ctx = this._canvas.getContext('2d');
    document.getElementById('btn-close-primordial').onclick = () => {
      const dest = this._returnTo || 'menu';
      this._returnTo = null;
      App.goTo(dest);
    };
    this._resize();
  },

  _resize() {
    if (!this._canvas) return;
    const p = this._canvas.parentElement;
    this._canvas.width  = (p ? p.clientWidth  : window.innerWidth)  || window.innerWidth;
    this._canvas.height = (p ? p.clientHeight : window.innerHeight) || window.innerHeight;
  },

  show(dropTime, returnTo) {
    this._resize();
    this._running = true;
    this._returnTo = returnTo || null;
    this._onboardingDone = !!localStorage.getItem('prf_primordial_onboarding');

    if (!this._onboardingDone) {
      localStorage.setItem('prf_primordial_onboarding', '1');
      this._onboardingDone = true;
    }

    Primordial.start(dropTime);
    this._exploding = false;
    this._explodeTimer = 0;
    this._popRewards = [];
    this._loop();
  },

  stop() {
    this._running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
  },

  _loop() {
    if (!this._running) return;
    if (Primordial.tick(0.016)) {
      this._finish();
      return;
    }
    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
  },

  _draw() {
    const ctx = this._ctx;
    const W = this._canvas.width, H = this._canvas.height;
    ctx.clearRect(0, 0, W, H);

    // fundo escuro
    ctx.fillStyle = '#0a0c16';
    ctx.fillRect(0, 0, W, H);

    const tier = Primordial.getTierData();
    const cx = W / 2, cy = H * 0.42;
    const timeRatio = Primordial.state.time / Primordial.MAX_TIME;
    const r = 90 + 10 * Primordial.state.tierIdx;

    // glow
    const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.5);
    grad.addColorStop(0, tier.color + '60');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // orbe
    const orbGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    orbGrad.addColorStop(0, '#fff');
    orbGrad.addColorStop(0.3, tier.color);
    orbGrad.addColorStop(1, tier.color + '80');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // brilho
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.3, r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // nome do tier
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${22 + Primordial.state.tierIdx}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tier.icon + ' ' + tier.name, cx, cy);

    // taps
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px sans-serif';
    ctx.fillText(Primordial.state.taps + ' toques', cx, cy + r + 30);

    // timer circular
    const angle = timeRatio * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = timeRatio < 0.3 ? '#ef4444' : tier.color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 18, -Math.PI / 2, angle);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(Primordial.state.time.toFixed(1) + 's', cx, cy + r + 64);

    // onboarding
    if (!this._onboardingDone && Primordial.state.taps < 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👆 Toca no orbe para acumulares toques!', cx, H * 0.2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '15px sans-serif';
      ctx.fillText('Cada toque aumenta a raridade e o tempo.', cx, H * 0.2 + 30);
      ctx.fillText('Quanto mais toques, melhores as recompensas!', cx, H * 0.2 + 52);
    }

    // explosão final
    if (this._exploding) {
      this._drawExplosion(ctx, W, H);
    }
  },

  _drawExplosion(ctx, W, H) {
    const progress = 1 - this._explodeTimer / 1.5;
    const cx = W / 2, cy = H * 0.42;
    const intensity = Math.min(1, progress * 2);

    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = (30 + Math.random() * 150) * intensity;
      const x = cx + Math.cos(a) * dist;
      const y = cy + Math.sin(a) * dist;
      const size = 3 + Math.random() * 6 * intensity;
      ctx.fillStyle = Primordial.getTierData().color + Math.floor(80 + 100 * intensity).toString(16);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // recompensas popping
    this._popRewards.forEach((r, i) => {
      const t = (1 - this._explodeTimer / 1.5) * (1 + i * 0.15);
      if (t < 0 || t > 1) return;
      const y = cy + 50 - t * 120 + i * 50;
      const alpha = Math.min(1, t * 3) * (1 - Math.max(0, t - 0.7) / 0.3);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.font = `bold ${16 + t * 8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(r.text, cx, y);
    });

    if (this._explodeTimer <= 0) {
      // tudo terminou
    }
  },

  _finish() {
    const tier = Primordial.getTierData();
    const rewards = Primordial.getRewards();
    Primordial.claimRewards(rewards);

    this._popRewards = rewards.map(r => {
      if (r.type === 'coins') return { text: '🪙 +' + r.amount };
      if (r.type === 'trophies') return { text: '🏆 +' + r.amount };
      if (r.type === 'gems') return { text: '💎 +' + r.amount };
      if (r.type === 'item') {
        const item = Progression.SHOP_ITEMS.find(i => i.id === r.id);
        return { text: (item ? item.icon : '📦') + ' ' + (item ? item.name : r.id) };
      }
      if (r.type === 'skin') return { text: '🎨 Skin: ' + r.id };
      return { text: '📦 Recompensa' };
    });

    this._exploding = true;
    this._explodeTimer = 1.5;

    const animLoop = () => {
      this._explodeTimer -= 0.016;
      this._draw();
      if (this._explodeTimer > 0) {
        this._raf = requestAnimationFrame(animLoop);
      } else {
        this._running = false;
        this._draw();
        setTimeout(() => {
          const dest = this._returnTo || 'menu';
          this._returnTo = null;
          App.goTo(dest);
        }, 1500);
      }
    };
    animLoop();
  },

  onCanvasPointer(e) {
    if (this._exploding) return;
    const rect = this._canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
    const cx = this._canvas.width / 2, cy = this._canvas.height * 0.42;
    const r = 90 + 10 * Primordial.state.tierIdx;
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= (r + 24) * (r + 24)) {
      const now = performance.now();
      if (Primordial.tap(now)) {
        if (navigator.vibrate) navigator.vibrate(10);
      }
    }
  },
};

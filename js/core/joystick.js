// ── JOYSTICK ESQUERDO + DIREITO LIVRE (estilo Free Fire) ──────────────
// Lado esquerdo: joystick de movimento (azul)
// Lado direito: toque e arrastar = rodar câmara (sem joystick visível)
const Joystick = {
  left:  { active: false, startX: 0, startY: 0, dx: 0, dy: 0, id: -1 },
  right: { active: false, startX: 0, startY: 0, dx: 0, dy: 0, id: -1, dragged: false },

  // Delta bruto do arrasto direito (para câmara)
  _rawDX: 0,
  _rawDY: 0,

  RADIUS: 60,
  KNOB:   26,

  _btnIds: new Set(['btn-mb-melee','btn-mb-laser','btn-mb-special','btn-mb-shield','btn-mb-zord','btn-pause','btn-mb-reaction','btn-mb-camera']),

  init() {
    document.addEventListener('touchstart',  e => this._tStart(e),  { passive: false });
    document.addEventListener('touchmove',   e => this._tMove(e),   { passive: false });
    document.addEventListener('touchend',    e => this._tEnd(e),    { passive: false });
    document.addEventListener('touchcancel', e => this._tEnd(e),    { passive: false });

    document.addEventListener('mousedown', e => this._mDown(e));
    document.addEventListener('mousemove', e => this._mMove(e));
    document.addEventListener('mouseup',   e => this._mUp(e));
  },

  _isButton(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    return this._btnIds.has(el.id) || el.closest('button') !== null;
  },

  _gameActive() {
    return typeof GameScene !== 'undefined' && GameScene.running;
  },

  _triggerMelee(stick) {
    if (!this._gameActive() || !GameScene.player) return;

    if (stick.dragged && (stick.dx !== 0 || stick.dy !== 0)) {
      GameScene.player.facing = Math.atan2(stick.dy, stick.dx);
    } else {
      let nearest = null;
      let nearDist = Infinity;
      for (const e of GameScene.enemies) {
        if (e.dead) continue;
        const d = Utils.dist(GameScene.player, e);
        if (d < nearDist) { nearDist = d; nearest = e; }
      }
      if (nearest) {
        GameScene.player.facing = Math.atan2(nearest.y - GameScene.player.y, nearest.x - GameScene.player.x);
      }
    }

    GameScene.player.doMelee(GameScene);
  },

  _appWidth() {
    return document.body.classList.contains('portrait') ? window.innerHeight : window.innerWidth;
  },

  _touchToApp(cx, cy) {
    return App.vpToApp(cx, cy);
  },

  // ── TOUCH ────────────────────────────────────────────────────────────
  _tStart(e) {
    if (!this._gameActive()) return;
    const sw = this._appWidth();

    for (const t of e.changedTouches) {
      const p = this._touchToApp(t.clientX, t.clientY);
      if (this._isButton(t.clientX, t.clientY)) continue;
      e.preventDefault();

      const isLeft = p.x < sw / 2;

      if (isLeft && !this.left.active) {
        this.left = { active: true, startX: p.x, startY: p.y, dx: 0, dy: 0, id: t.identifier };
      } else if (!isLeft && !this.right.active) {
        this.right = { active: true, startX: p.x, startY: p.y, dx: 0, dy: 0, id: t.identifier, dragged: false };
        this._rawDX = 0;
        this._rawDY = 0;
      }
    }
  },

  _tMove(e) {
    if (!this._gameActive()) return;
    for (const t of e.changedTouches) {
      const p = this._touchToApp(t.clientX, t.clientY);
      if (this.left.active && t.identifier === this.left.id) {
        this._calcDir(this.left, p.x, p.y);
      }
      if (this.right.active && t.identifier === this.right.id) {
        // Delta bruto para câmara (estilo Free Fire — não joystick)
        this._rawDX = p.x - this.right.startX;
        this._rawDY = p.y - this.right.startY;
        this.right.startX = p.x;
        this.right.startY = p.y;

        const ddx = p.x - this.right.startX;
        const ddy = p.y - this.right.startY;
        if (Math.sqrt(ddx*ddx + ddy*ddy) > 10) {
          this.right.dragged = true;
        }
      }
    }
    e.preventDefault();
  },

  _tEnd(e) {
    for (const t of e.changedTouches) {
      if (this.left.active  && t.identifier === this.left.id)  {
        this.left.active  = false; this.left.dx  = this.left.dy  = 0;
      }
      if (this.right.active && t.identifier === this.right.id) {
        this._triggerMelee(this.right);
        this.right.active = false; this.right.dx = this.right.dy = 0; this.right.dragged = false;
        this._rawDX = 0;
        this._rawDY = 0;
      }
    }
  },

  // ── MOUSE ────────────────────────────────────────────────────────────
  _mDown(e) {
    if (!this._gameActive()) return;
    const p = this._touchToApp(e.clientX, e.clientY);
    if (this._isButton(e.clientX, e.clientY)) return;
    const isLeft = p.x < this._appWidth() / 2;
    if (isLeft && !this.left.active) {
      this.left = { active: true, startX: p.x, startY: p.y, dx: 0, dy: 0, id: 0 };
    } else if (!isLeft && !this.right.active) {
      this.right = { active: true, startX: p.x, startY: p.y, dx: 0, dy: 0, id: 1, dragged: false };
      this._rawDX = 0;
      this._rawDY = 0;
    }
  },

  _mMove(e) {
    const p = this._touchToApp(e.clientX, e.clientY);
    if (this.left.active  && this.left.id  === 0) this._calcDir(this.left,  p.x, p.y);
    if (this.right.active && this.right.id === 1) {
      this._rawDX = e.movementX;
      this._rawDY = e.movementY;
      const dx = p.x - this.right.startX, dy = p.y - this.right.startY;
      if (Math.sqrt(dx*dx + dy*dy) > 10) {
        this.right.dragged = true;
      }
    }
  },

  _mUp(e) {
    if (e.button === 0) {
      const p = this._touchToApp(e.clientX, e.clientY);
      const isLeft = p.x < this._appWidth() / 2;
      if (isLeft)  {
        this.left.active  = false; this.left.dx  = this.left.dy  = 0;
      } else if (this.right.active) {
        this._triggerMelee(this.right);
        this.right.active = false; this.right.dx = this.right.dy = 0; this.right.dragged = false;
        this._rawDX = 0;
        this._rawDY = 0;
      }
    }
  },

  // ── HELPERS ──────────────────────────────────────────────────────────
  _calcDir(stick, cx, cy) {
    const dx = cx - stick.startX;
    const dy = cy - stick.startY;
    const len = Math.sqrt(dx*dx + dy*dy);
    const cl  = Math.min(len, this.RADIUS);
    stick.dx = len > 0 ? (dx / len) * (cl / this.RADIUS) : 0;
    stick.dy = len > 0 ? (dy / len) * (cl / this.RADIUS) : 0;
  },

  getMoveDir() { return { x: this.left.dx,  y: this.left.dy  }; },
  getAimDir()  { return { x: this.right.dx, y: this.right.dy }; },
  isFiring()   { return this.right.firing; },

  // Delta bruto do arrasto direito (para rotação de câmara)
  getCameraDrag() {
    const dx = this._rawDX;
    const dy = this._rawDY;
    this._rawDX = 0;
    this._rawDY = 0;
    return { dx, dy };
  },

  // ── DESENHO ───────────────────────────────────────────────────────────
  draw(ctx, canvasW, canvasH) {
    const isMobile = document.body.classList.contains('is-mobile');
    const baseY = isMobile ? canvasH * 0.55 : canvasH * 0.78;

    // Apenas desenha o joystick esquerdo (lado direito = toque livre)
    this._drawStick(ctx,
      this.left.active ? this.left.startX : canvasW * 0.18,
      this.left.active ? this.left.startY : baseY,
      this.left.dx, this.left.dy, this.left.active, '#378add'
    );
  },

  _drawStick(ctx, bx, by, dx, dy, active, color) {
    const R = this.RADIUS, K = this.KNOB;
    ctx.save();
    ctx.globalAlpha = active ? 0.85 : 0.4;

    ctx.beginPath();
    ctx.arc(bx, by, R, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = color + '22';
    ctx.fill();

    const kx = bx + dx * R;
    const ky = by + dy * R;
    ctx.beginPath();
    ctx.arc(kx, ky, K, 0, Math.PI * 2);
    ctx.fillStyle = color + 'bb';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  },
};

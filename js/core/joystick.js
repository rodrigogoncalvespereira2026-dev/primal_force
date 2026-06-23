// ── JOYSTICK DUPLO ─────────────────────────────────────────────────────
// Ouve no document (não no canvas) — mais fiável em Android Chrome
const Joystick = {
  left:  { active: false, startX: 0, startY: 0, dx: 0, dy: 0, id: -1 },
  right: { active: false, startX: 0, startY: 0, dx: 0, dy: 0, id: -1, firing: false },

  RADIUS: 60,
  KNOB:   26,

  // IDs dos botões de habilidade — não interferir com eles
  _btnIds: new Set(['btn-mb-melee','btn-mb-laser','btn-mb-special','btn-mb-shield','btn-mb-zord','btn-pause']),

  init() {
    // ── Touch (Android / iOS) ─────────────────────────────────────────
    document.addEventListener('touchstart',  e => this._tStart(e),  { passive: false });
    document.addEventListener('touchmove',   e => this._tMove(e),   { passive: false });
    document.addEventListener('touchend',    e => this._tEnd(e),    { passive: false });
    document.addEventListener('touchcancel', e => this._tEnd(e),    { passive: false });

    // ── Mouse (desktop) ───────────────────────────────────────────────
    document.addEventListener('mousedown', e => this._mDown(e));
    document.addEventListener('mousemove', e => this._mMove(e));
    document.addEventListener('mouseup',   e => this._mUp(e));
  },

  // Verifica se o toque é sobre um botão de habilidade — se sim, ignora
  _isButton(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    return this._btnIds.has(el.id) || el.closest('button') !== null;
  },

  // Verifica se o jogo está ativo
  _gameActive() {
    return typeof GameScene !== 'undefined' && GameScene.running;
  },

  // ── TOUCH ────────────────────────────────────────────────────────────
  _tStart(e) {
    if (!this._gameActive()) return;
    const sw = window.innerWidth;

    for (const t of e.changedTouches) {
      if (this._isButton(t.clientX, t.clientY)) continue;
      e.preventDefault();

      const isLeft = t.clientX < sw / 2;

      if (isLeft && !this.left.active) {
        this.left = { active: true, startX: t.clientX, startY: t.clientY, dx: 0, dy: 0, id: t.identifier };
      } else if (!isLeft && !this.right.active) {
        this.right = { active: true, startX: t.clientX, startY: t.clientY, dx: 0, dy: 0, id: t.identifier, firing: true };
      }
    }
  },

  _tMove(e) {
    if (!this._gameActive()) return;
    for (const t of e.changedTouches) {
      if (this.left.active && t.identifier === this.left.id) {
        this._calcDir(this.left, t.clientX, t.clientY);
      }
      if (this.right.active && t.identifier === this.right.id) {
        this._calcDir(this.right, t.clientX, t.clientY);
        const dx = t.clientX - this.right.startX;
        const dy = t.clientY - this.right.startY;
        this.right.firing = Math.sqrt(dx*dx + dy*dy) > 8;
      }
    }
    e.preventDefault();
  },

  _tEnd(e) {
    for (const t of e.changedTouches) {
      if (this.left.active  && t.identifier === this.left.id)  { this.left.active  = false; this.left.dx  = this.left.dy  = 0; }
      if (this.right.active && t.identifier === this.right.id) { this.right.active = false; this.right.dx = this.right.dy = 0; this.right.firing = false; }
    }
  },

  // ── MOUSE ────────────────────────────────────────────────────────────
  _mDown(e) {
    if (!this._gameActive()) return;
    if (this._isButton(e.clientX, e.clientY)) return;
    const isLeft = e.clientX < window.innerWidth / 2;
    if (isLeft && !this.left.active) {
      this.left = { active: true, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, id: 0 };
    } else if (!isLeft && !this.right.active) {
      this.right = { active: true, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, id: 1, firing: true };
    }
  },

  _mMove(e) {
    if (this.left.active  && this.left.id  === 0) this._calcDir(this.left,  e.clientX, e.clientY);
    if (this.right.active && this.right.id === 1) {
      this._calcDir(this.right, e.clientX, e.clientY);
      const dx = e.clientX - this.right.startX, dy = e.clientY - this.right.startY;
      this.right.firing = Math.sqrt(dx*dx + dy*dy) > 8;
    }
  },

  _mUp(e) {
    if (e.button === 0) {
      const isLeft = e.clientX < window.innerWidth / 2;
      if (isLeft)  { this.left.active  = false; this.left.dx  = this.left.dy  = 0; }
      else         { this.right.active = false; this.right.dx = this.right.dy = 0; this.right.firing = false; }
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

  // ── DESENHO ───────────────────────────────────────────────────────────
  draw(ctx, canvasW, canvasH) {
    const isMobile = document.body.classList.contains('is-mobile');
    const baseY = isMobile ? canvasH * 0.55 : canvasH * 0.78;

    this._drawStick(ctx,
      this.left.active ? this.left.startX : canvasW * 0.18,
      this.left.active ? this.left.startY : baseY,
      this.left.dx, this.left.dy, this.left.active, '#378add'
    );
    this._drawStick(ctx,
      this.right.active ? this.right.startX : canvasW * 0.82,
      this.right.active ? this.right.startY : baseY,
      this.right.dx, this.right.dy, this.right.active, '#e24b4a'
    );
  },

  _drawStick(ctx, bx, by, dx, dy, active, color) {
    const R = this.RADIUS, K = this.KNOB;
    ctx.save();
    ctx.globalAlpha = active ? 0.85 : 0.4;

    // Base
    ctx.beginPath();
    ctx.arc(bx, by, R, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = color + '22';
    ctx.fill();

    // Knob
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

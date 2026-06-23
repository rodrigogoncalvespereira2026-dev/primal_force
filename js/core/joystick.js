// ── JOYSTICK DUPLO ESTILO BRAWL STARS ────────────────────────────────
// Usa TouchEvents (Android/iOS) + fallback PointerEvents (desktop)
const Joystick = {
  left:  { active: false, startX: 0, startY: 0, dx: 0, dy: 0, touchId: -1 },
  right: { active: false, startX: 0, startY: 0, dx: 0, dy: 0, touchId: -1, firing: false },

  RADIUS: 55,
  KNOB:   24,

  init() {
    const canvas = document.getElementById('game-canvas');

    // ── Touch Events (Android/iOS — mais fiável) ──────────────────────
    canvas.addEventListener('touchstart',  e => { e.preventDefault(); this._onTouchStart(e);  }, { passive: false });
    canvas.addEventListener('touchmove',   e => { e.preventDefault(); this._onTouchMove(e);   }, { passive: false });
    canvas.addEventListener('touchend',    e => { e.preventDefault(); this._onTouchEnd(e);    }, { passive: false });
    canvas.addEventListener('touchcancel', e => { e.preventDefault(); this._onTouchEnd(e);    }, { passive: false });

    // ── Pointer Events (desktop/mouse) ────────────────────────────────
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return; // Já tratado pelos touch events
      e.preventDefault();
      this._onPointerDown(e);
    });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      this._onPointerMove(e);
    });
    canvas.addEventListener('pointerup',    e => {
      if (e.pointerType === 'touch') return;
      this._onPointerUp(e);
    });
    canvas.addEventListener('pointercancel', e => {
      if (e.pointerType === 'touch') return;
      this._onPointerUp(e);
    });
  },

  // ── TOUCH EVENTS ─────────────────────────────────────────────────────
  _onTouchStart(e) {
    const canvas = e.target;
    const cw = canvas.clientWidth;

    for (const t of e.changedTouches) {
      const isLeft = t.clientX < cw / 2;

      if (isLeft && !this.left.active) {
        this.left.active  = true;
        this.left.touchId = t.identifier;
        this.left.startX  = t.clientX;
        this.left.startY  = t.clientY;
        this.left.dx = this.left.dy = 0;
      } else if (!isLeft && !this.right.active) {
        this.right.active  = true;
        this.right.touchId = t.identifier;
        this.right.startX  = t.clientX;
        this.right.startY  = t.clientY;
        this.right.dx = this.right.dy = 0;
        this.right.firing = true;
      }
    }
  },

  _onTouchMove(e) {
    for (const t of e.changedTouches) {
      if (this.left.active && t.identifier === this.left.touchId) {
        const dx = t.clientX - this.left.startX;
        const dy = t.clientY - this.left.startY;
        const len = Math.sqrt(dx*dx + dy*dy);
        const cl  = Math.min(len, this.RADIUS);
        this.left.dx = len > 0 ? (dx / len) * (cl / this.RADIUS) : 0;
        this.left.dy = len > 0 ? (dy / len) * (cl / this.RADIUS) : 0;
      }
      if (this.right.active && t.identifier === this.right.touchId) {
        const dx = t.clientX - this.right.startX;
        const dy = t.clientY - this.right.startY;
        const len = Math.sqrt(dx*dx + dy*dy);
        const cl  = Math.min(len, this.RADIUS);
        this.right.dx = len > 0 ? (dx / len) * (cl / this.RADIUS) : 0;
        this.right.dy = len > 0 ? (dy / len) * (cl / this.RADIUS) : 0;
        this.right.firing = len > 8;
      }
    }
  },

  _onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (this.left.active  && t.identifier === this.left.touchId)  {
        this.left.active  = false; this.left.dx  = this.left.dy  = 0;
      }
      if (this.right.active && t.identifier === this.right.touchId) {
        this.right.active = false; this.right.dx = this.right.dy = 0; this.right.firing = false;
      }
    }
  },

  // ── POINTER EVENTS (mouse/desktop) ───────────────────────────────────
  _onPointerDown(e) {
    const cw = e.target.clientWidth;
    const isLeft = e.clientX < cw / 2;
    if (isLeft && !this.left.active) {
      this.left.active    = true;
      this.left.touchId   = e.pointerId;
      this.left.startX    = e.clientX;
      this.left.startY    = e.clientY;
      this.left.dx = this.left.dy = 0;
    } else if (!isLeft && !this.right.active) {
      this.right.active   = true;
      this.right.touchId  = e.pointerId;
      this.right.startX   = e.clientX;
      this.right.startY   = e.clientY;
      this.right.dx = this.right.dy = 0;
      this.right.firing = true;
    }
  },

  _onPointerMove(e) {
    if (this.left.active && e.pointerId === this.left.touchId) {
      const dx = e.clientX - this.left.startX;
      const dy = e.clientY - this.left.startY;
      const len = Math.sqrt(dx*dx + dy*dy);
      const cl  = Math.min(len, this.RADIUS);
      this.left.dx = len > 0 ? (dx / len) * (cl / this.RADIUS) : 0;
      this.left.dy = len > 0 ? (dy / len) * (cl / this.RADIUS) : 0;
    }
    if (this.right.active && e.pointerId === this.right.touchId) {
      const dx = e.clientX - this.right.startX;
      const dy = e.clientY - this.right.startY;
      const len = Math.sqrt(dx*dx + dy*dy);
      const cl  = Math.min(len, this.RADIUS);
      this.right.dx = len > 0 ? (dx / len) * (cl / this.RADIUS) : 0;
      this.right.dy = len > 0 ? (dy / len) * (cl / this.RADIUS) : 0;
      this.right.firing = len > 8;
    }
  },

  _onPointerUp(e) {
    if (this.left.active  && e.pointerId === this.left.touchId)  { this.left.active  = false; this.left.dx  = this.left.dy  = 0; }
    if (this.right.active && e.pointerId === this.right.touchId) { this.right.active = false; this.right.dx = this.right.dy = 0; this.right.firing = false; }
  },

  getMoveDir() { return { x: this.left.dx,  y: this.left.dy  }; },
  getAimDir()  { return { x: this.right.dx, y: this.right.dy }; },
  isFiring()   { return this.right.firing; },

  // Desenha os joysticks no canvas
  draw(ctx, canvasW, canvasH) {
    const isMobile = document.body.classList.contains('is-mobile');
    const baseY = isMobile ? canvasH * 0.58 : canvasH * 0.78;

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

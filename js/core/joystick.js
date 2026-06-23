// ── JOYSTICK DUPLO ESTILO BRAWL STARS ────────────────────────────────
const Joystick = {
  left:  { active: false, startX: 0, startY: 0, dx: 0, dy: 0, pointerId: -1 },
  right: { active: false, startX: 0, startY: 0, dx: 0, dy: 0, pointerId: -1, firing: false },

  RADIUS: 50,      // raio da base
  KNOB:   22,      // raio do knob

  init() {
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('pointerdown',  e => { e.preventDefault(); this._onDown(e); });
    canvas.addEventListener('pointermove',  e => this._onMove(e));
    canvas.addEventListener('pointerup',    e => this._onUp(e));
    canvas.addEventListener('pointercancel',e => this._onUp(e));
  },

  _onDown(e) {
    // Ignora toques que vieram de elementos HTML (botões, dpad)
    if (e.target.id !== 'game-canvas') return;

    const cw = e.target.clientWidth;
    const isLeft = e.clientX < cw / 2;

    if (isLeft && !this.left.active) {
      this.left.active    = true;
      this.left.pointerId = e.pointerId;
      this.left.startX    = e.clientX;
      this.left.startY    = e.clientY;
      this.left.dx = this.left.dy = 0;
      try { e.target.setPointerCapture(e.pointerId); } catch(_) {}
    } else if (!isLeft && !this.right.active) {
      this.right.active    = true;
      this.right.pointerId = e.pointerId;
      this.right.startX    = e.clientX;
      this.right.startY    = e.clientY;
      this.right.dx = this.right.dy = 0;
      this.right.firing = true;
      try { e.target.setPointerCapture(e.pointerId); } catch(_) {}
    }
  },

  _onMove(e) {
    if (this.left.active && e.pointerId === this.left.pointerId) {
      const dx = e.clientX - this.left.startX;
      const dy = e.clientY - this.left.startY;
      const len = Math.sqrt(dx*dx + dy*dy);
      const clamped = Math.min(len, this.RADIUS);
      this.left.dx = len > 0 ? (dx / len) * (clamped / this.RADIUS) : 0;
      this.left.dy = len > 0 ? (dy / len) * (clamped / this.RADIUS) : 0;
    }
    if (this.right.active && e.pointerId === this.right.pointerId) {
      const dx = e.clientX - this.right.startX;
      const dy = e.clientY - this.right.startY;
      const len = Math.sqrt(dx*dx + dy*dy);
      const clamped = Math.min(len, this.RADIUS);
      this.right.dx = len > 0 ? (dx / len) * (clamped / this.RADIUS) : 0;
      this.right.dy = len > 0 ? (dy / len) * (clamped / this.RADIUS) : 0;
      this.right.firing = len > 8;
    }
  },

  _onUp(e) {
    if (this.left.active  && e.pointerId === this.left.pointerId)  { this.left.active  = false; this.left.dx  = this.left.dy  = 0; }
    if (this.right.active && e.pointerId === this.right.pointerId) { this.right.active = false; this.right.dx = this.right.dy = 0; this.right.firing = false; }
  },

  getMoveDir() { return { x: this.left.dx,  y: this.left.dy  }; },
  getAimDir()  { return { x: this.right.dx, y: this.right.dy }; },
  isFiring()   { return this.right.firing; },

  // Desenha os joysticks no canvas
  draw(ctx, canvasW, canvasH) {
    // Em mobile com controlos em baixo, posiciona joysticks mais acima
    const isMobile = document.body.classList.contains('is-mobile');
    const baseY = isMobile ? canvasH * 0.62 : canvasH * 0.78;

    // Esquerdo
    this._drawStick(ctx,
      this.left.active ? this.left.startX : canvasW * 0.18,
      this.left.active ? this.left.startY : baseY,
      this.left.dx, this.left.dy, this.left.active, '#378add'
    );
    // Direito
    this._drawStick(ctx,
      this.right.active ? this.right.startX : canvasW * 0.82,
      this.right.active ? this.right.startY : baseY,
      this.right.dx, this.right.dy, this.right.active, '#e24b4a'
    );
  },

  _drawStick(ctx, bx, by, dx, dy, active, color) {
    const R = this.RADIUS, K = this.KNOB;
    ctx.save();
    ctx.globalAlpha = active ? 0.75 : 0.35;

    // Base
    ctx.beginPath();
    ctx.arc(bx, by, R, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = color + '22';
    ctx.fill();

    // Knob
    const kx = bx + dx * R;
    const ky = by + dy * R;
    ctx.beginPath();
    ctx.arc(kx, ky, K, 0, Math.PI * 2);
    ctx.fillStyle = color + 'aa';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  },
};

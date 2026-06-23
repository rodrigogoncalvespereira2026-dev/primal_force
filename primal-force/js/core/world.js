const World = {
  W: 2000,
  H: 1600,
  TILE: 48,

  // paleta de tiles: 0=chão, 1=relva escura, 2=pedra, 3=água, 4=ruína
  _map: null,

  generate() {
    const cols = Math.ceil(this.W / this.TILE);
    const rows = Math.ceil(this.H / this.TILE);
    this._map = [];
    for (let r = 0; r < rows; r++) {
      this._map[r] = [];
      for (let c = 0; c < cols; c++) {
        const n = Math.sin(c * 0.4) * Math.cos(r * 0.3) + Math.sin(c * 0.15 + r * 0.2) * 0.5;
        if (n < -0.6)      this._map[r][c] = 3; // água
        else if (n < -0.2) this._map[r][c] = 1; // relva escura
        else if (n > 0.6)  this._map[r][c] = 2; // pedra
        else if (n > 0.4)  this._map[r][c] = 4; // ruína
        else               this._map[r][c] = 0; // chão normal
      }
    }
  },

  getTile(col, row) {
    if (!this._map || row < 0 || col < 0 || row >= this._map.length || col >= this._map[0].length) return 0;
    return this._map[row][col];
  },

  // retorna true se a posição é sólida (água = bloqueio)
  isSolid(x, y) {
    const c = Math.floor(x / this.TILE);
    const r = Math.floor(y / this.TILE);
    return this.getTile(c, r) === 3;
  },

  COLORS: ['#111c11','#0a1a0a','#1a1a1a','#0a1220','#1c1410'],
  BORDER: ['rgba(255,255,255,0.02)','rgba(255,255,255,0.015)','rgba(255,255,255,0.04)','rgba(30,80,150,0.15)','rgba(100,60,20,0.1)'],
  ACCENT: [null, '#0d1a0d', '#222', '#162040', '#2a1e10'],

  draw(ctx, cam, vw, vh) {
    const T = this.TILE;
    const cx = cam.flatX, cy = cam.flatY;
    const c0 = Math.max(0, Math.floor(cx / T));
    const r0 = Math.max(0, Math.floor(cy / T));
    const c1 = Math.min(this._map[0].length - 1, Math.ceil((cx + vw) / T));
    const r1 = Math.min(this._map.length - 1, Math.ceil((cy + vh) / T));

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = this._map[r][c];
        const sx = c * T - cx;
        const sy = r * T - cy;

        ctx.fillStyle = this.COLORS[t];
        ctx.fillRect(sx, sy, T, T);

        if (this.ACCENT[t]) {
          ctx.fillStyle = this.ACCENT[t];
          if ((c + r) % 3 === 0) ctx.fillRect(sx + 6, sy + 6, 8, 8);
          if ((c * r) % 5 === 0) ctx.fillRect(sx + T - 10, sy + T - 10, 5, 5);
        }

        ctx.strokeStyle = this.BORDER[t];
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, T, T);
      }
    }
  },
};

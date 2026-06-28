const World = {
  W: 2000,
  H: 1600,
  TILE: 48,

  _map: null,
  _customMap: null,
  _customObjects: null,

  loadCustom(data) {
    if (!data || !data.grid) return false;
    this._customMap = data;
    this._customObjects = data.objects || null;
    const cols = data.cols || Math.ceil(this.W / this.TILE);
    const rows = data.rows || Math.ceil(this.H / this.TILE);
    this.W = cols * this.TILE;
    this.H = rows * this.TILE;
    this._map = [];
    for (let r = 0; r < rows; r++) {
      this._map[r] = [];
      for (let c = 0; c < cols; c++) {
        this._map[r][c] = (data.grid[r] && data.grid[r][c] !== undefined) ? data.grid[r][c] : 0;
      }
    }
    return true;
  },

  clearCustom() {
    this._customMap = null;
    this._customObjects = null;
    this.W = 2000;
    this.H = 1600;
  },

  getCustomObjects() {
    return this._customObjects;
  },

  generate() {
    const cols = Math.ceil(this.W / this.TILE);
    const rows = Math.ceil(this.H / this.TILE);
    this._map = [];
    for (let r = 0; r < rows; r++) {
      this._map[r] = [];
      for (let c = 0; c < cols; c++) {
        const n = Math.sin(c * 0.4) * Math.cos(r * 0.3) + Math.sin(c * 0.15 + r * 0.2) * 0.5;
        if (n < -0.6)      this._map[r][c] = 3;
        else if (n < -0.2) this._map[r][c] = 1;
        else if (n > 0.6)  this._map[r][c] = 2;
        else if (n > 0.4)  this._map[r][c] = 4;
        else               this._map[r][c] = 0;
      }
    }
  },

  getTile(col, row) {
    if (!this._map || row < 0 || col < 0 || row >= this._map.length || col >= this._map[0].length) return 0;
    return this._map[row][col];
  },

  isSolid(x, y) {
    const c = Math.floor(x / this.TILE);
    const r = Math.floor(y / this.TILE);
    const tile = this.getTile(c, r);
    if (tile === 3 || tile === 6) return true;
    if (this._customObjects) {
      for (const obj of this._customObjects) {
        if (obj.c === c && obj.r === r) {
          const def = typeof MapEditorData !== 'undefined' ? MapEditorData.OBJECTS.find(o => o.id === obj.type) : null;
          if (def && def.solid) return true;
        }
      }
    }
    return false;
  },

  COLORS: ['#111c11','#0a1a0a','#1a1a1a','#0a1220','#1c1410','#c2a050','#cc3300','#e0e8f0'],
  BORDER: ['rgba(255,255,255,0.02)','rgba(255,255,255,0.015)','rgba(255,255,255,0.04)','rgba(30,80,150,0.15)','rgba(100,60,20,0.1)','rgba(180,150,60,0.12)','rgba(200,60,0,0.2)','rgba(200,220,240,0.15)'],
  ACCENT: [null, '#0d1a0d', '#222', '#162040', '#2a1e10', '#aa8833', '#ff4400', '#c8d8e8'],

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

        ctx.fillStyle = this.COLORS[t] || this.COLORS[0];
        ctx.fillRect(sx, sy, T, T);

        if (this.ACCENT[t]) {
          ctx.fillStyle = this.ACCENT[t];
          if ((c + r) % 3 === 0) ctx.fillRect(sx + 6, sy + 6, 8, 8);
          if ((c * r) % 5 === 0) ctx.fillRect(sx + T - 10, sy + T - 10, 5, 5);
        }

        ctx.strokeStyle = this.BORDER[t] || this.BORDER[0];
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, T, T);
      }
    }
  },
};

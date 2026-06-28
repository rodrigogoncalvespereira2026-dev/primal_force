const MapEditor = {
  canvas: null,
  ctx: null,
  grid: null,
  objects: [],
  history: [],
  historyIdx: -1,
  maxHistory: 80,

  tool: 'paint',
  mode: 'tiles',
  selectedTile: 0,
  selectedObject: null,

  zoom: 1,
  panX: 0,
  panY: 0,
  _dragging: false,
  _lastMouse: null,
  _painting: false,

  mapName: 'Mapa Sem Nome',
  zone: 'forest',

  _raf: null,
  _dirty: true,
  _initialized: false,

  init() {
    if (this._initialized) {
      this._resize();
      this._dirty = true;
      return;
    }
    this.canvas = document.getElementById('editor-canvas');
    this.ctx = this.canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());

    this._resetGrid();
    this._bindEvents();
    this._buildPalette();
    this._updateToolUI();
    this._startLoop();
    this._initialized = true;
  },

  _resetGrid() {
    const D = MapEditorData;
    this.grid = [];
    for (let r = 0; r < D.GRID_ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < D.GRID_COLS; c++) {
        this.grid[r][c] = 0;
      }
    }
    this.objects = [];
    this.history = [];
    this.historyIdx = -1;
    this._pushHistory();
    this._dirty = true;
  },

  _resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this._dirty = true;
  },

  _startLoop() {
    const loop = () => {
      if (this._dirty) {
        this._render();
        this._dirty = false;
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  destroy() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
  },

  _worldToScreen(wx, wy) {
    const T = MapEditorData.TILE * this.zoom;
    return {
      x: wx * T + this.panX,
      y: wy * T + this.panY,
    };
  },

  _screenToWorld(sx, sy) {
    const T = MapEditorData.TILE * this.zoom;
    return {
      c: Math.floor((sx - this.panX) / T),
      r: Math.floor((sy - this.panY) / T),
    };
  },

  _render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const D = MapEditorData;
    const T = D.TILE * this.zoom;

    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, 0, W, H);

    const c0 = Math.max(0, Math.floor(-this.panX / T));
    const r0 = Math.max(0, Math.floor(-this.panY / T));
    const c1 = Math.min(D.GRID_COLS - 1, Math.ceil((W - this.panX) / T));
    const r1 = Math.min(D.GRID_ROWS - 1, Math.ceil((H - this.panY) / T));

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const tile = this.grid[r] ? this.grid[r][c] : 0;
        const tileDef = D.TILES[tile] || D.TILES[0];
        const sx = c * T + this.panX;
        const sy = r * T + this.panY;

        ctx.fillStyle = tileDef.color;
        ctx.fillRect(sx, sy, T, T);

        if (tileDef.solid) {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(sx, sy, T, T);
        }

        if (this.zoom > 0.5) {
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(sx, sy, T, T);
        }
      }
    }

    if (this.zoom >= 0.4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;

      for (let c = c0; c <= c1 + 1; c++) {
        const x = c * T + this.panX;
        ctx.beginPath();
        ctx.moveTo(x, r0 * T + this.panY);
        ctx.lineTo(x, (r1 + 1) * T + this.panY);
        ctx.stroke();
      }
      for (let r = r0; r <= r1 + 1; r++) {
        const y = r * T + this.panY;
        ctx.beginPath();
        ctx.moveTo(c0 * T + this.panX, y);
        ctx.lineTo((c1 + 1) * T + this.panX, y);
        ctx.stroke();
      }
    }

    if (this.mode === 'objects') {
      for (const obj of this.objects) {
        const objDef = D.OBJECTS.find(o => o.id === obj.type);
        if (!objDef) continue;
        const sx = obj.c * T + this.panX;
        const sy = obj.r * T + this.panY;

        ctx.fillStyle = objDef.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
        ctx.globalAlpha = 1;

        if (this.zoom >= 0.6) {
          const fontSize = Math.max(12, Math.round(T * 0.45));
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(objDef.emoji, sx + T / 2, sy + T / 2);
        }
      }
    }

    this._drawMinimap();
  },

  _drawMinimap() {
    const mc = document.getElementById('editor-minimap');
    if (!mc) return;
    const mctx = mc.getContext('2d');
    const D = MapEditorData;
    const mw = mc.width;
    const mh = mc.height;
    const cw = mw / D.GRID_COLS;
    const ch = mh / D.GRID_ROWS;

    mctx.fillStyle = '#0a0e18';
    mctx.fillRect(0, 0, mw, mh);

    for (let r = 0; r < D.GRID_ROWS; r++) {
      for (let c = 0; c < D.GRID_COLS; c++) {
        const tile = this.grid[r] ? this.grid[r][c] : 0;
        const tileDef = D.TILES[tile] || D.TILES[0];
        mctx.fillStyle = tileDef.color;
        mctx.fillRect(c * cw, r * ch, cw + 0.5, ch + 0.5);
      }
    }

    for (const obj of this.objects) {
      const objDef = D.OBJECTS.find(o => o.id === obj.type);
      if (objDef) {
        mctx.fillStyle = objDef.color;
        mctx.fillRect(obj.c * cw, obj.r * ch, cw * 2, ch * 2);
      }
    }

    const T = D.TILE * this.zoom;
    const viewW = this.canvas.width / T;
    const viewH = this.canvas.height / T;
    const viewX = -this.panX / T;
    const viewY = -this.panY / T;
    mctx.strokeStyle = '#ffffff';
    mctx.lineWidth = 1;
    mctx.strokeRect(
      (viewX / D.GRID_COLS) * mw,
      (viewY / D.GRID_ROWS) * mh,
      (viewW / D.GRID_COLS) * mw,
      (viewH / D.GRID_ROWS) * mh
    );
  },

  _bindEvents() {
    const cv = this.canvas;

    cv.addEventListener('pointerdown', e => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        this._dragging = true;
        this._lastMouse = { x: e.clientX, y: e.clientY };
        cv.setPointerCapture(e.pointerId);
        return;
      }
      if (e.button === 2) {
        this._pickAt(e);
        return;
      }
      if (e.button === 0) {
        this._painting = true;
        this._applyTool(e);
        cv.setPointerCapture(e.pointerId);
      }
    });

    cv.addEventListener('pointermove', e => {
      if (this._dragging) {
        const dx = e.clientX - this._lastMouse.x;
        const dy = e.clientY - this._lastMouse.y;
        this.panX += dx;
        this.panY += dy;
        this._lastMouse = { x: e.clientX, y: e.clientY };
        this._dirty = true;
        return;
      }
      if (this._painting) {
        this._applyTool(e);
      }
    });

    cv.addEventListener('pointerup', e => {
      if (this._dragging) {
        this._dragging = false;
        this._lastMouse = null;
      }
      if (this._painting) {
        this._painting = false;
        this._pushHistory();
      }
    });

    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = cv.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const oldZoom = this.zoom;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom = Math.max(0.2, Math.min(3, this.zoom * delta));

      this.panX = mx - (mx - this.panX) * (this.zoom / oldZoom);
      this.panY = my - (my - this.panY) * (this.zoom / oldZoom);
      this._dirty = true;
    }, { passive: false });

    cv.addEventListener('contextmenu', e => e.preventDefault());

    cv.addEventListener('dblclick', e => {
      this._pickAt(e);
    });

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this.redo(); }
      if (e.key === 'b') this.setTool('paint');
      if (e.key === 'e') this.setTool('erase');
      if (e.key === 'f') this.setTool('fill');
      if (e.key === 'g') this.toggleGrid();
      if (e.key === 'o') this.setMode('objects');
      if (e.key === 't') this.setMode('tiles');
      if (e.key === '+' || e.key === '=') { this.zoom = Math.min(3, this.zoom * 1.15); this._dirty = true; }
      if (e.key === '-') { this.zoom = Math.max(0.2, this.zoom * 0.85); this._dirty = true; }
    });
  },

  _applyTool(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { c, r } = this._screenToWorld(mx, my);
    const D = MapEditorData;

    if (c < 0 || c >= D.GRID_COLS || r < 0 || r >= D.GRID_ROWS) return;

    if (this.mode === 'tiles') {
      if (this.tool === 'paint') {
        if (this.grid[r][c] !== this.selectedTile) {
          this.grid[r][c] = this.selectedTile;
          this._dirty = true;
        }
      } else if (this.tool === 'erase') {
        if (this.grid[r][c] !== 0) {
          this.grid[r][c] = 0;
          this._dirty = true;
        }
      } else if (this.tool === 'fill') {
        this._floodFill(c, r, this.grid[r][c], this.selectedTile);
        this._dirty = true;
      }
    } else if (this.mode === 'objects') {
      if (this.tool === 'paint' && this.selectedObject) {
        const existing = this.objects.findIndex(o => o.c === c && o.r === r);
        if (existing >= 0) {
          this.objects[existing].type = this.selectedObject;
        } else {
          const objDef = D.OBJECTS.find(o => o.id === this.selectedObject);
          const count = this.objects.filter(o => o.type === this.selectedObject).length;
          if (!objDef || count < objDef.max) {
            this.objects.push({ type: this.selectedObject, c, r });
          }
        }
        this._dirty = true;
      } else if (this.tool === 'erase' || this.tool === 'erase_obj') {
        const idx = this.objects.findIndex(o => o.c === c && o.r === r);
        if (idx >= 0) {
          this.objects.splice(idx, 1);
          this._dirty = true;
        }
      }
    }
  },

  _floodFill(c, r, fromTile, toTile) {
    const D = MapEditorData;
    if (fromTile === toTile) return;
    if (c < 0 || c >= D.GRID_COLS || r < 0 || r >= D.GRID_ROWS) return;
    if (this.grid[r][c] !== fromTile) return;

    const stack = [[c, r]];
    const visited = new Set();
    let iterations = 0;
    const maxIter = D.GRID_COLS * D.GRID_ROWS;

    while (stack.length > 0 && iterations < maxIter) {
      iterations++;
      const [cx, ry] = stack.pop();
      const key = `${cx},${ry}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (cx < 0 || cx >= D.GRID_COLS || ry < 0 || ry >= D.GRID_ROWS) continue;
      if (this.grid[ry][cx] !== fromTile) continue;

      this.grid[ry][cx] = toTile;
      stack.push([cx + 1, ry], [cx - 1, ry], [cx, ry + 1], [cx, ry - 1]);
    }
  },

  _pickAt(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { c, r } = this._screenToWorld(mx, my);
    const D = MapEditorData;

    if (c < 0 || c >= D.GRID_COLS || r < 0 || r >= D.GRID_ROWS) return;

    if (this.mode === 'tiles') {
      this.selectedTile = this.grid[r][c];
      this.setTool('paint');
      this._updatePaletteSelection();
    } else {
      const obj = this.objects.find(o => o.c === c && o.r === r);
      if (obj) {
        this.selectedObject = obj.type;
        this.setTool('paint');
        this._updatePaletteSelection();
      }
    }
  },

  _pushHistory() {
    const state = {
      grid: this.grid.map(row => [...row]),
      objects: this.objects.map(o => ({ ...o })),
    };
    this.history = this.history.slice(0, this.historyIdx + 1);
    this.history.push(state);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIdx = this.history.length - 1;
    this._updateUndoRedoUI();
  },

  undo() {
    if (this.historyIdx <= 0) return;
    this.historyIdx--;
    const state = this.history[this.historyIdx];
    this.grid = state.grid.map(row => [...row]);
    this.objects = state.objects.map(o => ({ ...o }));
    this._dirty = true;
    this._updateUndoRedoUI();
  },

  redo() {
    if (this.historyIdx >= this.history.length - 1) return;
    this.historyIdx++;
    const state = this.history[this.historyIdx];
    this.grid = state.grid.map(row => [...row]);
    this.objects = state.objects.map(o => ({ ...o }));
    this._dirty = true;
    this._updateUndoRedoUI();
  },

  _updateUndoRedoUI() {
    const undoBtn = document.getElementById('editor-undo');
    const redoBtn = document.getElementById('editor-redo');
    if (undoBtn) undoBtn.disabled = this.historyIdx <= 0;
    if (redoBtn) redoBtn.disabled = this.historyIdx >= this.history.length - 1;
  },

  setTool(tool) {
    this.tool = tool;
    this._updateToolUI();
  },

  setMode(mode) {
    this.mode = mode;
    this._updateToolUI();
    this._buildPalette();
  },

  toggleGrid() {
    const el = document.getElementById('editor-grid-toggle');
    if (el) {
      const active = el.classList.toggle('active');
      this.zoom = active ? this.zoom : this.zoom;
    }
    this._dirty = true;
  },

  clearAll() {
    if (!confirm('Tem certeza que deseja apagar tudo?')) return;
    this._resetGrid();
    this._buildPalette();
    this._dirty = true;
  },

  fillAll() {
    const D = MapEditorData;
    for (let r = 0; r < D.GRID_ROWS; r++) {
      for (let c = 0; c < D.GRID_COLS; c++) {
        this.grid[r][c] = this.selectedTile;
      }
    }
    this._pushHistory();
    this._dirty = true;
  },

  _updateToolUI() {
    const D = MapEditorData;
    const btns = document.querySelectorAll('.editor-tool-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.dataset.tool === this.tool);
    });
    const modeBtns = document.querySelectorAll('.editor-mode-btn');
    modeBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.mode === this.mode);
    });
    const statusEl = document.getElementById('editor-status');
    if (statusEl) {
      const toolName = { paint: 'Pintar', erase: 'Apagar', fill: 'Preencher', pick: 'Capturar', erase_obj: 'Apagar Obj.' }[this.tool] || this.tool;
      const modeName = this.mode === 'tiles' ? 'Terreno' : 'Objetos';
      statusEl.textContent = `${modeName} · ${toolName}`;
    }
  },

  _buildPalette() {
    const container = document.getElementById('editor-palette');
    if (!container) return;
    container.innerHTML = '';

    const D = MapEditorData;

    if (this.mode === 'tiles') {
      D.TILES.forEach((tile, i) => {
        const btn = document.createElement('button');
        btn.className = 'editor-palette-btn' + (i === this.selectedTile ? ' selected' : '');
        btn.style.background = tile.color;
        btn.innerHTML = `<span class="palette-emoji">${tile.emoji}</span><span class="palette-label">${tile.name}</span>`;
        if (tile.solid) btn.classList.add('solid');
        btn.onclick = () => {
          this.selectedTile = i;
          this.setTool('paint');
          this._updatePaletteSelection();
        };
        container.appendChild(btn);
      });
    } else {
      const categories = { spawn: 'Spawn', object: 'Objetos', loot: 'Loot', deco: 'Decoração' };
      for (const [cat, catName] of Object.entries(categories)) {
        const items = D.OBJECTS.filter(o => o.category === cat);
        if (items.length === 0) continue;

        const label = document.createElement('div');
        label.className = 'palette-category';
        label.textContent = catName;
        container.appendChild(label);

        items.forEach(obj => {
          const btn = document.createElement('button');
          btn.className = 'editor-palette-btn' + (this.selectedObject === obj.id ? ' selected' : '');
          btn.style.background = obj.color + '33';
          btn.style.borderColor = obj.color;
          btn.innerHTML = `<span class="palette-emoji">${obj.emoji}</span><span class="palette-label">${obj.name}</span>`;
          btn.onclick = () => {
            this.selectedObject = obj.id;
            this.setTool('paint');
            this.mode = 'objects';
            this._updateToolUI();
            this._updatePaletteSelection();
          };
          container.appendChild(btn);
        });
      }

      const eraseBtn = document.createElement('button');
      eraseBtn.className = 'editor-palette-btn erase-btn' + (this.tool === 'erase_obj' ? ' selected' : '');
      eraseBtn.innerHTML = `<span class="palette-emoji">🗑️</span><span class="palette-label">Apagar</span>`;
      eraseBtn.onclick = () => {
        this.setTool('erase_obj');
        this._updatePaletteSelection();
      };
      container.appendChild(eraseBtn);
    }
  },

  _updatePaletteSelection() {
    const btns = document.querySelectorAll('.editor-palette-btn');
    btns.forEach(b => b.classList.remove('selected'));
    if (this.mode === 'tiles') {
      const btns2 = document.querySelectorAll('.editor-palette-btn');
      if (btns2[this.selectedTile]) btns2[this.selectedTile].classList.add('selected');
    } else if (this.selectedObject) {
      const D = MapEditorData;
      const idx = D.OBJECTS.findIndex(o => o.id === this.selectedObject);
      if (idx >= 0 && btns[idx]) btns[idx].classList.add('selected');
    }
  },

  centerView() {
    const D = MapEditorData;
    const T = D.TILE * this.zoom;
    this.panX = (this.canvas.width - D.GRID_COLS * T) / 2;
    this.panY = (this.canvas.height - D.GRID_ROWS * T) / 2;
    this._dirty = true;
  },

  zoomIn() {
    this.zoom = Math.min(3, this.zoom * 1.25);
    this._dirty = true;
  },

  zoomOut() {
    this.zoom = Math.max(0.2, this.zoom * 0.8);
    this._dirty = true;
  },

  zoomFit() {
    const D = MapEditorData;
    const fitW = this.canvas.width / (D.GRID_COLS * D.TILE);
    const fitH = this.canvas.height / (D.GRID_ROWS * D.TILE);
    this.zoom = Math.min(fitW, fitH) * 0.95;
    this.centerView();
  },

  getData() {
    const D = MapEditorData;
    return {
      name: this.mapName,
      zone: this.zone,
      cols: D.GRID_COLS,
      rows: D.GRID_ROWS,
      tile: D.TILE,
      grid: this.grid.map(row => [...row]),
      objects: this.objects.map(o => ({ ...o })),
      modifiers: this._getModifiers(),
    };
  },

  loadData(data) {
    if (!data) return;
    this.mapName = data.name || 'Mapa Sem Nome';
    this.zone = data.zone || 'forest';
    if (data.grid) {
      this.grid = data.grid.map(row => [...row]);
    }
    if (data.objects) {
      this.objects = data.objects.map(o => ({ ...o }));
    }
    if (data.modifiers) {
      this._setModifiers(data.modifiers);
    }
    const nameInput = document.getElementById('editor-map-name');
    if (nameInput) nameInput.value = this.mapName;
    const zoneSelect = document.getElementById('editor-zone');
    if (zoneSelect) zoneSelect.value = this.zone;
    this.history = [];
    this.historyIdx = -1;
    this._pushHistory();
    this.centerView();
    this._dirty = true;
  },

  _getModifiers() {
    return {
      waves: parseInt(document.getElementById('editor-waves')?.value) || 3,
      enemyTier: parseInt(document.getElementById('editor-tier')?.value) || 0,
      timeLimit: parseInt(document.getElementById('editor-timer')?.value) || 0,
    };
  },

  _setModifiers(m) {
    const w = document.getElementById('editor-waves');
    const t = document.getElementById('editor-tier');
    const tl = document.getElementById('editor-timer');
    if (w) w.value = m.waves || 3;
    if (t) t.value = m.enemyTier || 0;
    if (tl) tl.value = m.timeLimit || 0;
  },

  loadPresetZone(zoneKey) {
    const D = MapEditorData;
    const theme = D.ZONE_THEMES[zoneKey];
    if (!theme) return;
    this.zone = zoneKey;
    const tileWeights = theme.tiles;
    for (let r = 0; r < D.GRID_ROWS; r++) {
      for (let c = 0; c < D.GRID_COLS; c++) {
        const edge = r === 0 || r === D.GRID_ROWS - 1 || c === 0 || c === D.GRID_COLS - 1;
        if (edge) {
          this.grid[r][c] = tileWeights[2] !== undefined ? tileWeights[2] : 2;
        } else {
          const idx = Math.floor(Math.random() * tileWeights.length);
          this.grid[r][c] = tileWeights[idx];
        }
      }
    }
    this._pushHistory();
    this._dirty = true;
  },
};

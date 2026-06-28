const MapMakerScene = {
  _modes: [
    { id: 'solo',    name: 'Combate Solitário', emoji: '⚔️' },
    { id: 'duo',     name: 'Combate Duplo',     emoji: '👥' },
    { id: 'ko',      name: 'Nocaute',            emoji: '💥' },
    { id: 'survive', name: 'Sobrevivência',      emoji: '☠️' },
  ],
  _envs: [
    { id: 'forest',     name: 'Floresta',     emoji: '🌿' },
    { id: 'city',       name: 'Cidade',       emoji: '🏚️' },
    { id: 'enemy_base', name: 'Base Inimiga', emoji: '🏭' },
    { id: 'volcano',    name: 'Vulcão',       emoji: '🌋' },
    { id: 'ocean',      name: 'Oceano',       emoji: '🌊' },
    { id: 'desert',     name: 'Deserto',      emoji: '🏜️' },
    { id: 'mountains',  name: 'Montanhas',    emoji: '⛰️' },
  ],
  _modeIdx: 0,
  _envIdx: 0,

  init() {
    document.getElementById('btn-back-mapmaker').onclick = () => App.goTo('menu');
    document.getElementById('mm-btn-new').onclick = () => this._openModal();
    document.getElementById('mm-modal-close').onclick = () => this._closeModal();
    document.getElementById('mm-modal-create').onclick = () => this._createMap();

    document.getElementById('mm-modal').onclick = (e) => {
      if (e.target.id === 'mm-modal') this._closeModal();
    };

    document.getElementById('mm-mode-left').onclick = () => {
      this._modeIdx = (this._modeIdx - 1 + this._modes.length) % this._modes.length;
      this._updateModeDisplay();
    };
    document.getElementById('mm-mode-right').onclick = () => {
      this._modeIdx = (this._modeIdx + 1) % this._modes.length;
      this._updateModeDisplay();
    };
    document.getElementById('mm-env-left').onclick = () => {
      this._envIdx = (this._envIdx - 1 + this._envs.length) % this._envs.length;
      this._updateEnvDisplay();
    };
    document.getElementById('mm-env-right').onclick = () => {
      this._envIdx = (this._envIdx + 1) % this._envs.length;
      this._updateEnvDisplay();
    };
  },

  show() {
    this._renderMapCards();
    this._envIdx = 0;
    this._updateEnvDisplay();
  },

  _renderMapCards() {
    const body = document.getElementById('mm-body');
    if (!body) return;

    body.innerHTML = '';

    const newCard = document.createElement('div');
    newCard.className = 'mm-card mm-card-new';
    newCard.id = 'mm-btn-new';
    newCard.innerHTML = `
      <div class="mm-card-badge">✨ Novo</div>
      <div class="mm-card-new-icon">🗺️</div>
      <div class="mm-card-new-title">CRIAR NOVO!</div>
      <div class="mm-card-new-sub">Criador de mapas</div>
    `;
    newCard.onclick = () => this._openModal();
    body.appendChild(newCard);

    const maps = MapStorage.getAll();
    document.getElementById('mm-map-count').textContent = maps.length;

    maps.forEach((m, i) => {
      const env = this._envs.find(e => e.id === m.zone) || this._envs[0];
      const mode = this._modes.find(md => md.id === (m.mode || 'solo')) || this._modes[0];
      const card = document.createElement('div');
      card.className = 'mm-card mm-card-map';
      card.innerHTML = `
        <div class="mm-card-badge">Rascunho</div>
        <div class="mm-card-menu" data-idx="${i}">☰</div>
        <div class="mm-card-body">
          <div class="mm-card-emoji">${env.emoji}</div>
          <div class="mm-card-title">${m.name || 'Sem nome'}</div>
          <div class="mm-card-sub">${mode.name} · ${env.name}</div>
        </div>
      `;
      card.querySelector('.mm-card-body').onclick = () => {
        this._editMap(m);
      };
      card.querySelector('.mm-card-menu').onclick = (e) => {
        e.stopPropagation();
        this._showCardMenu(i, m, card);
      };
      body.appendChild(card);
    });
  },

  _showCardMenu(idx, mapData, cardEl) {
    const existing = cardEl.querySelector('.mm-card-popup');
    if (existing) { existing.remove(); return; }

    const popup = document.createElement('div');
    popup.className = 'mm-card-popup';
    popup.innerHTML = `
      <button class="mm-popup-btn edit">✏️ Editar</button>
      <button class="mm-popup-btn play">▶ Jogar</button>
      <button class="mm-popup-btn export">📤 Exportar</button>
      <button class="mm-popup-btn delete">🗑️ Apagar</button>
    `;
    popup.querySelector('.edit').onclick = (e) => { e.stopPropagation(); this._editMap(mapData); };
    popup.querySelector('.play').onclick = (e) => {
      e.stopPropagation();
      MapStorage.saveActiveMap(mapData);
      App.goTo('game');
    };
    popup.querySelector('.export').onclick = (e) => {
      e.stopPropagation();
      MapStorage.exportJSON(mapData);
    };
    popup.querySelector('.delete').onclick = (e) => {
      e.stopPropagation();
      if (confirm('Apagar "' + mapData.name + '"?')) {
        MapStorage.remove(mapData.name);
        this._renderMapCards();
      }
    };
    cardEl.appendChild(popup);

    const close = (ev) => {
      if (!popup.contains(ev.target)) {
        popup.remove();
        document.removeEventListener('pointerdown', close);
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', close), 10);
  },

  _editMap(mapData) {
    MapEditor.mapName = mapData.name || 'Sem nome';
    MapEditor.zone = mapData.zone || 'forest';
    MapEditor.loadData(mapData);
    App.goTo('editor');
    if (!MapEditor._initialized) {
      MapEditor.init();
      MapEditor._initialized = true;
    }
    MapEditor.centerView();
  },

  _openModal() {
    const maps = MapStorage.getAll();
    if (maps.length >= 10) {
      alert('Máximo de 10 rascunhos! Apague algum mapa primeiro.');
      return;
    }
    document.getElementById('mm-modal').style.display = 'flex';
    document.getElementById('mm-modal-name').value = 'Sem nome';
    this._modeIdx = 0;
    this._envIdx = 0;
    this._updateModeDisplay();
    this._updateEnvDisplay();
  },

  _closeModal() {
    document.getElementById('mm-modal').style.display = 'none';
  },

  _updateModeDisplay() {
    const mode = this._modes[this._modeIdx];
    const display = document.getElementById('mm-mode-display');
    display.querySelector('.mm-sel-emoji').textContent = mode.emoji;
    display.querySelector('.mm-sel-text').textContent = mode.name;
  },

  _updateEnvDisplay() {
    const env = this._envs[this._envIdx];
    const display = document.getElementById('mm-env-display');
    display.querySelector('.mm-sel-emoji').textContent = env.emoji;
    display.querySelector('.mm-sel-text').textContent = env.name;
  },

  _createMap() {
    const name = document.getElementById('mm-modal-name').value.trim() || 'Sem nome';
    const env = this._envs[this._envIdx];
    const mode = this._modes[this._modeIdx];

    const D = MapEditorData;
    const grid = [];
    for (let r = 0; r < D.GRID_ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < D.GRID_COLS; c++) {
        grid[r][c] = 0;
      }
    }

    const mapData = {
      name: name,
      zone: env.id,
      mode: mode.id,
      cols: D.GRID_COLS,
      rows: D.GRID_ROWS,
      tile: D.TILE,
      grid: grid,
      objects: [],
      modifiers: { waves: 3, enemyTier: 0, timeLimit: 0 },
      savedAt: Date.now(),
    };

    MapStorage.save(mapData);
    this._closeModal();
    this._editMap(mapData);
  },
};

const SelectScene = {
  selected: 0,

  init() {
    document.getElementById('btn-back-select').onclick = () => App.goTo('menu');
    document.getElementById('btn-confirmar-ranger').onclick = () => {
      App.selectedRanger = RANGERS_DATA[this.selected];
      App.goTo('game');
    };
    // ranger detail controls
    const backR = document.getElementById('btn-back-ranger');
    if (backR) backR.onclick = () => App.goTo('select');
    const rdSelect = document.getElementById('rd-select');
    if (rdSelect) rdSelect.onclick = () => {
      if (this._detailIndex != null) {
        App.selectedRanger = RANGERS_DATA[this._detailIndex];
        App.goTo('game');
      }
    };
    const rdTest = document.getElementById('rd-test');
    if (rdTest) rdTest.onclick = () => {
      if (this._detailIndex != null) {
        App.selectedRanger = RANGERS_DATA[this._detailIndex];
        App.goTo('game');
      }
    };
    this._buildGrid();
    this._initArrows('rangers');
  },

  _initArrows(name) {
    const scroll = document.getElementById('ranger-grid');
    const left  = document.getElementById('arrow-' + name + '-left');
    const right = document.getElementById('arrow-' + name + '-right');
    if (!scroll || !left || !right) return;
    left.onclick  = () => { const w = scroll.querySelector('.ranger-card')?.offsetWidth || 170; scroll.scrollBy({ left: -(w + 12), behavior: 'smooth' }); };
    right.onclick = () => { const w = scroll.querySelector('.ranger-card')?.offsetWidth || 170; scroll.scrollBy({ left:  (w + 12), behavior: 'smooth' }); };
  },

  _buildGrid() {
    const grid = document.getElementById('ranger-grid');
    grid.innerHTML = '';
    RANGERS_DATA.forEach((r, i) => {
      const card = document.createElement('div');
      card.className = 'ranger-card' + (i === this.selected ? ' selected' : '');
      
      const level = 5 + i;
      const power = (10 + i * 5) + (i * 3);
      
      card.innerHTML = `
        <div class="ranger-card-header">
          <div class="ranger-card-level">${level}</div>
          <div class="ranger-card-power">💰 ${power}</div>
        </div>
        <div class="ranger-avatar" style="background:${r.color}22; border: 2px solid ${r.color}66;">
          <span>${r.emoji}</span>
        </div>
        <div class="ranger-card-name" style="color:${r.color}">${r.name}</div>
        <div class="ranger-card-zord">${r.title}</div>
        <div class="ranger-card-stats">
          ${SelectScene._statIcon('💪', r.attack, '#ff8080')}
          ${SelectScene._statIcon('🛡️', r.defense, '#378add')}
          ${SelectScene._statIcon('⚡', r.speed * 20, '#ffd700')}
          ${SelectScene._statIcon('❤️', r.maxHp, '#e24b4a')}
        </div>
      `;
      card.onclick = () => {
        SelectScene.showDetail(i);
      };
      grid.appendChild(card);
    });
  },

  showDetail(index) {
    const r = RANGERS_DATA[index];
    this._detailIndex = index;
    const level = Math.min(11, 5 + index);
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

    // Coluna esquerda
    setText('rd-name', r.name);
    setText('rd-class', r.title);
    setText('rd-tag', r.zord.toUpperCase());
    setText('rd-desc', r.specialDesc || r.title);
    setText('rd-trophies', (index * 12) + '/1000');
    const tf = document.getElementById('rd-trophy-fill');
    if (tf) tf.style.width = Math.min(100, (index * 12) / 10) + '%';

    // Centro
    const av = document.getElementById('rd-avatar');
    if (av) av.textContent = r.emoji;
    const glow = document.getElementById('rd-glow');
    if (glow) glow.style.background = r.color;

    // Coluna direita
    setText('rd-level', level);
    const pf = document.getElementById('rd-power-fill');
    if (pf) pf.style.width = (level / 11 * 100) + '%';
    setText('rd-hp', r.maxHp);
    setText('rd-atk', r.attack);
    setText('rd-super', r.specialName || '-');

    App.goTo('ranger');
  },

  _statIcon(emoji, val, color) {
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px">
      <span style="font-size:16px">${emoji}</span>
      <span style="color:${color};font-weight:700">${Math.round(val)}</span>
    </div>`;
  },
};

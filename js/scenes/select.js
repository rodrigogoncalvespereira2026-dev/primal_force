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
    // populate detail screen
    const elName = document.getElementById('rd-name');
    const elSub = document.getElementById('rd-sub');
    const elDesc = document.getElementById('rd-desc');
    const elAvatar = document.getElementById('rd-avatar');
    const elLevel = document.getElementById('rd-level');
    const elHp = document.getElementById('rd-hp');
    const elAtk = document.getElementById('rd-atk');
    const elSuper = document.getElementById('rd-super');
    if (elName) elName.textContent = r.name;
    if (elSub) elSub.textContent = r.title + ' · ' + r.zord;
    if (elDesc) elDesc.textContent = r.specialDesc || r.title;
    if (elAvatar) elAvatar.textContent = r.emoji;
    if (elLevel) elLevel.textContent = Math.min(11, 5 + index);
    if (elHp) elHp.textContent = r.maxHp;
    if (elAtk) elAtk.textContent = r.attack;
    if (elSuper) elSuper.textContent = r.specialName || '-';
    App.goTo('ranger');
  },

  _statIcon(emoji, val, color) {
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px">
      <span style="font-size:16px">${emoji}</span>
      <span style="color:${color};font-weight:700">${Math.round(val)}</span>
    </div>`;
  },
};

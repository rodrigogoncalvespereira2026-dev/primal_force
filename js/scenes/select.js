const SelectScene = {
  selected: 0,

  init() {
    document.getElementById('btn-back-select').onclick = () => App.goTo('menu');
    document.getElementById('btn-confirmar-ranger').onclick = () => {
      App.selectedRanger = RANGERS_DATA[this.selected];
      App.goTo('game');
    };
    this._buildGrid();
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
        SelectScene.selected = i;
        SelectScene._buildGrid();
      };
      grid.appendChild(card);
    });
  },

  _statIcon(emoji, val, color) {
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px">
      <span style="font-size:16px">${emoji}</span>
      <span style="color:${color};font-weight:700">${Math.round(val)}</span>
    </div>`;
  },
};

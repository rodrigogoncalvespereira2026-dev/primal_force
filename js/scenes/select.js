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
      card.style.borderColor = i === this.selected ? r.color : '';
      card.innerHTML = `
        <div class="ranger-avatar" style="background:${r.color}22; border: 2px solid ${r.color}66;">
          <span style="font-size:28px">${r.emoji}</span>
        </div>
        <div class="ranger-card-name" style="color:${r.color}">${r.name}</div>
        <div class="ranger-card-zord">${r.title} · ${r.zord}</div>
        <div class="ranger-card-stats">
          ${SelectScene._stat('ATK', r.attack, 45, r.color)}
          ${SelectScene._stat('DEF', r.defense, 25, '#378add')}
          ${SelectScene._stat('SPD', r.speed * 20, 100, '#3cb371')}
          ${SelectScene._stat('HP',  r.maxHp,  180, '#e24b4a')}
        </div>
        <div style="font-size:10px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.4">${r.specialDesc}</div>
      `;
      card.onclick = () => {
        SelectScene.selected = i;
        SelectScene._buildGrid();
      };
      grid.appendChild(card);
    });
  },

  _stat(label, val, max, color) {
    const pct = Math.min(100, (val / max) * 100);
    return `<div class="stat-mini">
      <span style="width:28px;color:rgba(255,255,255,0.4)">${label}</span>
      <div class="stat-mini-bar"><div class="stat-mini-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  },
};

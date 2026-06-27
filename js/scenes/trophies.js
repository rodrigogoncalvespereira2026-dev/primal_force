// ── ECRÃ DE TROFÉUS ──────────────────────────────────────────────
const TrophiesScene = {
  init() {
    document.getElementById('btn-back-trophies').onclick = () => App.goTo('menu');
    this._initArrows('trophies');
  },

  _initArrows(name) {
    const scroll = document.getElementById('trophy-path');
    const left  = document.getElementById('arrow-' + name + '-left');
    const right = document.getElementById('arrow-' + name + '-right');
    if (!scroll || !left || !right) return;
    left.onclick  = () => { const w = scroll.querySelector('.trophy-node')?.offsetWidth || 200; scroll.scrollBy({ left: -(w + 12), behavior: 'smooth' }); };
    right.onclick = () => { const w = scroll.querySelector('.trophy-node')?.offsetWidth || 200; scroll.scrollBy({ left:  (w + 12), behavior: 'smooth' }); };
  },

  show() {
    this._renderTrophies();
  },

  _renderTrophies() {
    const container = document.getElementById('trophies-content');
    const pathEl   = document.getElementById('trophy-path');
    const d = Progression.data;
    const { next } = Progression.getCurrentTrophyMilestone();
    const nextTrophies = next ? next.trophies : d.trophies;
    const pct = next ? Math.min(100, (d.trophies / nextTrophies) * 100) : 100;

    container.innerHTML = `
      <div class="trophy-header">
        <div class="trophy-count">🏆 ${d.trophies} Troféus</div>
        <div class="trophy-progress-wrap">
          <div class="trophy-progress-bar"><div class="trophy-progress-fill" style="width:${pct}%"></div></div>
          <div class="trophy-progress-label">${next ? `Próximo: ${next.trophies} 🏆` : 'Máximo!'}</div>
        </div>
      </div>
    `;

    let html = '';
    Progression.TROPHY_PATH.forEach((m, i) => {
      const unlocked = d.trophies >= m.trophies;
      const isCurrent = !unlocked && (i === 0 || d.trophies >= Progression.TROPHY_PATH[i-1].trophies);
      html += `
        <div class="trophy-node ${unlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}">
          <div class="trophy-node-icon">${m.icon || '🏆'}</div>
          <div class="trophy-node-trophies">${m.trophies} 🏆</div>
          <div class="trophy-node-label">${m.label}</div>
          ${unlocked ? '<div class="trophy-node-check">✓</div>' : ''}
        </div>
      `;
    });

    pathEl.innerHTML = html;
  },
};

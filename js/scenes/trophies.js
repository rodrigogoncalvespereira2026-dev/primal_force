// ── ECRÃ DE TROFÉUS ──────────────────────────────────────────────
const TrophiesScene = {
  init() {
    document.getElementById('btn-back-trophies').onclick = () => App.goTo('menu');
  },

  show() {
    this._renderTrophies();
  },

  _renderTrophies() {
    const container = document.getElementById('trophies-content');
    const d = Progression.data;
    const { next } = Progression.getCurrentTrophyMilestone();
    const nextTrophies = next ? next.trophies : d.trophies;
    const pct = next ? Math.min(100, (d.trophies / nextTrophies) * 100) : 100;

    let html = `
      <div class="trophy-header">
        <div class="trophy-count">🏆 ${d.trophies} Troféus</div>
        <div class="trophy-progress-wrap">
          <div class="trophy-progress-bar"><div class="trophy-progress-fill" style="width:${pct}%"></div></div>
          <div class="trophy-progress-label">${next ? `Próximo: ${next.trophies} 🏆` : 'Máximo!'}</div>
        </div>
      </div>
      <div class="trophy-path">
    `;

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
        ${i < Progression.TROPHY_PATH.length - 1 ? '<div class="trophy-connector ' + (unlocked?'unlocked':'') + '"></div>' : ''}
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },
};

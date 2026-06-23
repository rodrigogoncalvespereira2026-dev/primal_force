// ── ECRÃ DE TROFÉUS + PASSE DE BATALHA ──────────────────────────────
const TrophiesScene = {
  tab: 'trophies', // 'trophies' | 'battlepass'

  init() {
    document.getElementById('btn-back-trophies').onclick = () => App.goTo('menu');
    document.getElementById('tab-trophies').onclick    = () => this.switchTab('trophies');
    document.getElementById('tab-battlepass').onclick  = () => this.switchTab('battlepass');
  },

  show() {
    this.switchTab(this.tab);
  },

  switchTab(tab) {
    this.tab = tab;
    document.getElementById('tab-trophies').classList.toggle('active-tab', tab === 'trophies');
    document.getElementById('tab-battlepass').classList.toggle('active-tab', tab === 'battlepass');
    document.getElementById('trophies-content').style.display   = tab === 'trophies'   ? 'block' : 'none';
    document.getElementById('battlepass-content').style.display = tab === 'battlepass' ? 'block' : 'none';
    if (tab === 'trophies')   this._renderTrophies();
    if (tab === 'battlepass') this._renderBattlePass();
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

  _renderBattlePass() {
    const container = document.getElementById('battlepass-content');
    const d = Progression.data;
    const currentTier = d.battlePassTier;
    const xpPct = currentTier < 20
      ? Math.min(100, (d.battlePassXP / Progression.BATTLE_PASS[currentTier]?.xpNeeded) * 100)
      : 100;

    let html = `
      <div class="bp-header">
        <div class="bp-title">PASSE DE BATALHA</div>
        <div class="bp-tier">Nível ${currentTier}/20</div>
        <div class="bp-xp-bar"><div class="bp-xp-fill" style="width:${xpPct}%"></div></div>
        <div class="bp-xp-label">${d.battlePassXP} / ${Progression.BATTLE_PASS[Math.min(currentTier,19)]?.xpNeeded || 0} XP</div>
      </div>
      <div class="bp-grid">
        <div class="bp-col-header"></div>
        <div class="bp-col-header" style="color:#aaa">GRÁTIS</div>
        <div class="bp-col-header" style="color:#fac775">⭐ PREMIUM</div>
    `;

    Progression.BATTLE_PASS.forEach(tier => {
      const done = d.battlePassTier >= tier.tier;
      const isCur = d.battlePassTier === tier.tier - 1;
      html += `
        <div class="bp-tier-num ${done?'done':''} ${isCur?'current':''}">${tier.tier}</div>
        <div class="bp-reward free ${done?'done':''}">
          ${tier.free.map(r => `<span class="bp-reward-item">${r.type==='coins'?'🪙'+r.amount:r.type==='skin'?'🎨':'⚔️'}</span>`).join('')}
        </div>
        <div class="bp-reward premium ${done?'done':''}">
          ${tier.premium.map(r => `<span class="bp-reward-item">${r.type==='coins'?'🪙'+r.amount:r.type==='ranger'&&r.id?'🦸':r.type==='skin'&&r.id?'🎨':r.type==='weapon'&&r.id?'⚔️':'🪙'}</span>`).join('')}
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },
};

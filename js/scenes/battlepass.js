// ── ECRÃ DE PASSE DE BATALHA ──────────────────────────────────────
const BattlePassScene = {
  init() {
    document.getElementById('btn-back-battlepass').onclick = () => App.goTo('menu');
  },

  show() {
    this._renderBattlePass();
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
          ${tier.free.map(r => `<span class="bp-reward-item">${r.type==='coins'?'🪙'+r.amount:r.type==='gems'?'💎'+r.amount:r.type==='skin'?'🎨':'⚔️'}</span>`).join('')}
        </div>
        <div class="bp-reward premium ${done?'done':''}">
          ${tier.premium.map(r => `<span class="bp-reward-item">${r.type==='coins'?'🪙'+r.amount:r.type==='gems'?'💎'+r.amount:r.type==='ranger'&&r.id?'🦸':r.type==='skin'&&r.id?'🎨':r.type==='weapon'&&r.id?'⚔️':'🪙'}</span>`).join('')}
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },
};

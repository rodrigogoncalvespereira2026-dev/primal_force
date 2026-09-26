// ── ECRÃ DE PASSE DE BATALHA ──────────────────────────────────────
const BattlePassScene = {
  init() {
    document.getElementById('btn-back-battlepass').onclick = () => App.goTo('menu');
    this._initArrows('battlepass');
  },

  _initArrows(name) {
    const scroll = document.getElementById('battlepass-path');
    const left  = document.getElementById('arrow-' + name + '-left');
    const right = document.getElementById('arrow-' + name + '-right');
    if (!scroll || !left || !right) return;
    left.onclick  = () => { const w = scroll.querySelector('.bp-tier-card')?.offsetWidth || 180; scroll.scrollBy({ left: -(w + 12), behavior: 'smooth' }); };
    right.onclick = () => { const w = scroll.querySelector('.bp-tier-card')?.offsetWidth || 180; scroll.scrollBy({ left:  (w + 12), behavior: 'smooth' }); };
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

    container.innerHTML = `
      <div class="bp-header">
        <div class="bp-title">PASSE DE BATALHA</div>
        <div class="bp-tier">Nível ${currentTier}/20</div>
        <div class="bp-xp-bar"><div class="bp-xp-fill" style="width:${xpPct}%"></div></div>
        <div class="bp-xp-label">${d.battlePassXP} / ${Progression.BATTLE_PASS[Math.min(currentTier,19)]?.xpNeeded || 0} XP</div>
        ${d.bpPremium
          ? '<div class="bp-premium-active">⭐ PREMIUM ATIVO</div>'
          : `<button class="bp-buy-premium" id="bp-buy-premium">⭐ ATIVAR PREMIUM — 50 ${GEM_SVG}</button>`}
      </div>
    `;

    const buyBtn = document.getElementById('bp-buy-premium');
    if (buyBtn) buyBtn.onclick = () => {
      if (Progression.buyBPPremium(50)) this._renderBattlePass();
      else alert('Joias insuficientes!');
    };

    const pathEl = document.getElementById('battlepass-path');
    let html = '';
    Progression.BATTLE_PASS.forEach(tier => {
      const done = d.battlePassTier >= tier.tier;
      const isCur = d.battlePassTier === tier.tier - 1;
      const claimFree = done && Progression.canClaimBPReward(tier.tier, 'free');
      const claimPrem = done && Progression.canClaimBPReward(tier.tier, 'premium');
      html += `
        <div class="bp-tier-card ${done?'done':''} ${isCur?'current':''}">
          <div class="bp-tier-num ${done?'done':''} ${isCur?'current':''}">${tier.tier}</div>
          <div class="bp-row-label">GRÁTIS</div>
          <div class="bp-reward free ${done?'done':''} ${claimFree?'claimable':''}">
            ${tier.free.map(r => `<span class="bp-reward-item">${r.type==='coins'?COIN_SVG+r.amount:r.type==='gems'?GEM_SVG+r.amount:r.type==='skin'?'🎨':'⚔️'}</span>`).join('')}
          </div>
          ${claimFree ? `<button class="bp-claim" data-tier="${tier.tier}" data-track="free">RESGATAR</button>` : ''}
          <div class="bp-row-label premium-label">⭐ PREMIUM</div>
          <div class="bp-reward premium ${done&&d.bpPremium?'done':''} ${claimPrem?'claimable':''}">
            ${tier.premium.map(r => `<span class="bp-reward-item">${r.type==='coins'?COIN_SVG+r.amount:r.type==='gems'?GEM_SVG+r.amount:r.type==='ranger'&&r.id?'🦸':r.type==='skin'&&r.id?'🎨':r.type==='weapon'&&r.id?'⚔️':COIN_SVG}</span>`).join('')}
          </div>
          ${claimPrem ? `<button class="bp-claim premium-claim" data-tier="${tier.tier}" data-track="premium">RESGATAR</button>` : ''}
        </div>
      `;
    });

    pathEl.innerHTML = html;
    pathEl.querySelectorAll('.bp-claim').forEach(btn => {
      btn.onclick = () => {
        const tier = parseInt(btn.dataset.tier, 10);
        const track = btn.dataset.track;
        if (Progression.claimBPReward(tier, track)) this._renderBattlePass();
      };
    });
  },
};

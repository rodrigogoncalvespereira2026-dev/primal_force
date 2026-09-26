const PerfilScene = {
  init() {
    document.getElementById('btn-back-perfil').onclick = () => App.goTo('menu');
  },

  show() {
    this._render();
  },

  _render() {
    const el = document.getElementById('perfil-content');
    if (!el) return;

    const p = Progression.data;
    const acc = (typeof Account !== 'undefined') ? Account.load() : null;
    const ranger = App.selectedRanger || ((typeof RANGERS_DATA !== 'undefined') ? RANGERS_DATA[0] : null);
    const skin = p.equippedSkin ? Progression.getSkin(p.equippedSkin) : null;
    const zonesTotal = WorldMap.zones.length;
    const zonesDone = WorldMap.zones.filter(z => (WorldMap.completed[z.id] || 0) >= (z.missions || []).length).length;
    const missionsDone = Object.values(WorldMap.completed).reduce((sum, n) => sum + (Number(n) || 0), 0);
    const rangersTotal = (typeof RANGERS_DATA !== 'undefined') ? RANGERS_DATA.length : 0;
    const rangersDone = (typeof RANGERS_DATA !== 'undefined') ? RANGERS_DATA.filter(r => Progression.isRangerUnlocked(r.id)).length : 0;
    const bpTier = Math.min((p.battlePassTier || 0) + 1, Progression.BATTLE_PASS.length);
    const created = (acc && acc.createdAt) ? new Date(acc.createdAt).toLocaleDateString('pt-PT') : '—';
    const avatar = (ranger && (ranger.emoji || ranger.icon)) || '⚡';

    el.innerHTML = `
      <div class="pf-card">
        <div class="pf-card-title">CONTA</div>
        ${acc ? `
          <div class="pf-head">
            <div class="pf-avatar">${avatar}</div>
            <div class="pf-id">
              <div class="pf-email">${acc.email}</div>
              <div class="pf-meta">Idade: ${acc.age} • perfil desde ${created}</div>
            </div>
          </div>
        ` : `
          <div class="pf-meta">Ainda não criaste um perfil neste dispositivo.</div>
        `}
      </div>

      <div class="pf-card">
        <div class="pf-card-title">RECURSOS</div>
        <div class="pf-stats">
          <div class="pf-stat"><div class="pf-stat-label">🏆 TROFÉUS</div><div class="pf-stat-value">${p.trophies}</div></div>
          <div class="pf-stat"><div class="pf-stat-label">${COIN_SVG} MOEDAS</div><div class="pf-stat-value">${p.coins}</div></div>
          <div class="pf-stat"><div class="pf-stat-label">${GEM_SVG} JOIAS</div><div class="pf-stat-value">${p.gems || 0}</div></div>
          <div class="pf-stat"><div class="pf-stat-label">⚡ PASSE DE BATALHA${p.bpPremium ? ' • PREMIUM' : ''}</div><div class="pf-stat-value">N.º ${bpTier}</div></div>
        </div>
      </div>

      <div class="pf-card">
        <div class="pf-card-title">PROGRESSO</div>
        <div class="pf-rows">
          <div class="pf-row"><span>Rangers desbloqueados</span><span>${rangersDone} / ${rangersTotal}</span></div>
          <div class="pf-row"><span>Skins desbloqueadas</span><span>${(p.unlockedSkins || []).length}</span></div>
          <div class="pf-row"><span>Armas desbloqueadas</span><span>${(p.unlockedWeapons || []).length}</span></div>
          <div class="pf-row"><span>Zonas concluídas</span><span>${zonesDone} / ${zonesTotal}</span></div>
          <div class="pf-row"><span>Missões concluídas</span><span>${missionsDone}</span></div>
        </div>
      </div>

      <div class="pf-card">
        <div class="pf-card-title">EQUIPA ATUAL</div>
        <div class="pf-rows">
          <div class="pf-row"><span>Ranger ativo</span><span>${ranger ? ranger.name : '—'}</span></div>
          <div class="pf-row"><span>Skin equipada</span><span>${skin ? skin.icon + ' ' + skin.name : '—'}</span></div>
        </div>
      </div>

      <div class="pf-card">
        <div class="pf-card-title">AÇÕES</div>
        <div class="pf-actions">
          <button class="pf-btn" id="pf-account">${acc ? 'TROCAR CONTA' : 'CRIAR PERFIL'}</button>
          <button class="pf-btn danger" id="pf-reset">REPOR PROGRESSO</button>
        </div>
      </div>
    `;

    const accBtn = el.querySelector('#pf-account');
    if (accBtn) {
      accBtn.onclick = () => {
        if (acc && !confirm('Criar um novo perfil? O perfil atual deste dispositivo será substituído.')) return;
        if (acc) Account.clear();
        App.goTo('account');
      };
    }

    const resetBtn = el.querySelector('#pf-reset');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (!confirm('Apagar todo o progresso (troféus, moedas, missões e zonas)? Esta ação não pode ser desfeita.')) return;
        ['prf_progression', 'prf_worldmap', 'prf_daily_missions'].forEach(k => {
          try { localStorage.removeItem(k); } catch (e) {}
        });
        location.reload();
      };
    }
  },
};

const ConfigScene = {
  init() {
    document.getElementById('btn-back-config').onclick = () => App.goTo('menu');
  },

  show() {
    this._render();
  },

  _render() {
    const el = document.getElementById('config-content');
    if (!el) return;
    const a = AudioFX;
    const q = (typeof Settings !== 'undefined') ? Settings.quality : 'high';

    el.innerHTML = `
      <div class="pf-card">
        <div class="pf-card-title">SOM</div>
        <div class="pf-rows">
          <div class="pf-row"><span>Efeitos sonoros</span><button class="cfg-toggle ${a.enabled ? 'on' : ''}" id="cfg-sfx">${a.enabled ? 'LIGADO' : 'DESLIGADO'}</button></div>
          <div class="pf-row"><span>Música de fundo</span><button class="cfg-toggle ${a.musicEnabled ? 'on' : ''}" id="cfg-music">${a.musicEnabled ? 'LIGADO' : 'DESLIGADO'}</button></div>
        </div>
        <div class="cfg-slider-row">
          <span class="cfg-slider-label">Volume</span>
          <input type="range" id="cfg-volume" min="0" max="100" step="5" value="${Math.round(a.volume * 100)}" />
          <span class="cfg-slider-value" id="cfg-volume-val">${Math.round(a.volume * 100)}%</span>
        </div>
      </div>

      <div class="pf-card">
        <div class="pf-card-title">GRÁFICOS</div>
        <div class="cfg-seg" id="cfg-quality">
          <button class="cfg-seg-btn ${q === 'high' ? 'active' : ''}" data-q="high">ALTA</button>
          <button class="cfg-seg-btn ${q === 'medium' ? 'active' : ''}" data-q="medium">MÉDIA</button>
          <button class="cfg-seg-btn ${q === 'low' ? 'active' : ''}" data-q="low">BAIXA</button>
        </div>
        <div class="cfg-hint">Alta: sombras e resolução máxima · Média: resolução 1x · Baixa: mais fluidez</div>
      </div>

      <div class="pf-card">
        <div class="pf-card-title">DADOS</div>
        <div class="pf-actions">
          <button class="pf-btn" id="cfg-clear-lb">LIMPAR LIDERANÇA</button>
          <button class="pf-btn danger" id="cfg-reset">REPOR PROGRESSO</button>
        </div>
      </div>
    `;

    const sfxBtn = el.querySelector('#cfg-sfx');
    sfxBtn.onclick = () => {
      a.toggle();
      sfxBtn.textContent = a.enabled ? 'LIGADO' : 'DESLIGADO';
      sfxBtn.classList.toggle('on', a.enabled);
    };

    const musicBtn = el.querySelector('#cfg-music');
    musicBtn.onclick = () => {
      a.setMusicEnabled(!a.musicEnabled);
      musicBtn.textContent = a.musicEnabled ? 'LIGADO' : 'DESLIGADO';
      musicBtn.classList.toggle('on', a.musicEnabled);
      if (a.musicEnabled) a.play('ui');
    };

    const vol = el.querySelector('#cfg-volume');
    const volVal = el.querySelector('#cfg-volume-val');
    vol.oninput = () => {
      a.setVolume(vol.value / 100);
      volVal.textContent = vol.value + '%';
      a.play('ui');
    };

    el.querySelectorAll('.cfg-seg-btn').forEach(btn => {
      btn.onclick = () => {
        if (typeof Settings !== 'undefined') Settings.setQuality(btn.dataset.q);
        el.querySelectorAll('.cfg-seg-btn').forEach(b => b.classList.toggle('active', b === btn));
        a.play('ui');
      };
    });

    el.querySelector('#cfg-clear-lb').onclick = () => {
      if (!confirm('Apagar o histórico de pontuações da liderança?')) return;
      if (typeof Leaderboard !== 'undefined') Leaderboard.clear();
      a.play('ui');
    };

    el.querySelector('#cfg-reset').onclick = () => {
      if (!confirm('Apagar todo o progresso (troféus, moedas, missões e zonas)? Esta ação não pode ser desfeita.')) return;
      ['prf_progression', 'prf_worldmap', 'prf_daily_missions', 'prf_leaderboard', 'prf_battlepass'].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
      location.reload();
    };
  },
};

const Leaderboard = {
  _key: 'prf_leaderboard',
  data: null,

  load() {
    try { this.data = JSON.parse(localStorage.getItem(this._key) || 'null'); } catch (e) { this.data = null; }
    if (!this.data || !Array.isArray(this.data.runs)) this.data = { runs: [] };
  },

  save() {
    try { localStorage.setItem(this._key, JSON.stringify(this.data)); } catch (e) {}
  },

  record(run) {
    this.load();
    this.data.runs.push({
      score: Math.max(0, Math.round(Number(run.score) || 0)),
      kills: Math.max(0, Math.round(Number(run.kills) || 0)),
      zone: run.zone || '—',
      ranger: run.ranger || '—',
      result: run.result || '',
      date: run.date || new Date().toISOString().slice(0, 10),
    });
    this.data.runs.sort((a, b) => b.score - a.score);
    this.data.runs = this.data.runs.slice(0, 10);
    this.save();
  },

  top() {
    this.load();
    return this.data.runs;
  },

  clear() {
    this.data = { runs: [] };
    this.save();
  },
};

const LeaderboardScene = {
  init() {
    document.getElementById('btn-back-lideranca').onclick = () => App.goTo('menu');
  },

  show() {
    this._render();
  },

  _render() {
    const el = document.getElementById('lideranca-content');
    if (!el) return;
    const runs = Leaderboard.top();
    const wins = runs.filter(r => r.result === 'Vitória').length;
    const losses = runs.filter(r => r.result === 'Derrota').length;
    const best = runs.length ? runs[0].score : 0;
    const bestKills = runs.reduce((m, r) => Math.max(m, r.kills), 0);
    const top = runs.slice(0, 10);

    el.innerHTML = `
      <div class="pf-card">
        <div class="pf-card-title">TOP PONTUAÇÕES</div>
        ${top.length ? `
          <div class="lb-list">
            ${top.map((r, i) => `
              <div class="lb-row ${i === 0 ? 'first' : ''}">
                <span class="lb-pos">${i + 1}</span>
                <span class="lb-zone">${r.zone}</span>
                <span class="lb-ranger">${r.ranger}</span>
                <span class="lb-result">${r.result}</span>
                <span class="lb-score">${r.score}</span>
              </div>
            `).join('')}
          </div>
        ` : `<div class="cfg-hint">Ainda não há registos — joga uma missão para entrares no ranking local.</div>`}
      </div>

      <div class="pf-card">
        <div class="pf-card-title">RESUMO</div>
        <div class="pf-stats">
          <div class="pf-stat"><div class="pf-stat-label">🏆 MELHOR PONTUAÇÃO</div><div class="pf-stat-value">${best}</div></div>
          <div class="pf-stat"><div class="pf-stat-label">💀 MELHOR DE ABATES</div><div class="pf-stat-value">${bestKills}</div></div>
          <div class="pf-stat"><div class="pf-stat-label">✅ VITÓRIAS</div><div class="pf-stat-value">${wins}</div></div>
          <div class="pf-stat"><div class="pf-stat-label">❌ DERROTAS</div><div class="pf-stat-value">${losses}</div></div>
        </div>
      </div>
    `;
  },
};

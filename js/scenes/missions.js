// ── MISSÕES DIÁRIAS + ECRÃ ──────────────────────────────────────────
const DailyMissions = {
  _key: 'prf_daily_missions',
  data: null,

  POOL: [
    { id: 'kills_15',  key: 'kills',     title: 'Derrota 15 inimigos',  goal: 15, reward: { coins: 60 } },
    { id: 'kills_40',  key: 'kills',     title: 'Derrota 40 inimigos',  goal: 40, reward: { trophies: 15 } },
    { id: 'waves_5',   key: 'waves',     title: 'Completa 5 ondas',     goal: 5,  reward: { coins: 80 } },
    { id: 'waves_12',  key: 'waves',     title: 'Completa 12 ondas',    goal: 12, reward: { trophies: 20 } },
    { id: 'boss_1',    key: 'boss',      title: 'Derrota 1 boss',       goal: 1,  reward: { trophies: 25, coins: 50 } },
    { id: 'mission_2', key: 'missions',  title: 'Completa 2 missões',   goal: 2,  reward: { coins: 150 } },
    { id: 'mission_1', key: 'missions',  title: 'Completa 1 missão',    goal: 1,  reward: { coins: 90 } },
    { id: 'pickups_8', key: 'pickups',   title: 'Apanha 8 itens',       goal: 8,  reward: { coins: 50, trophies: 5 } },
    { id: 'kills_8',   key: 'kills',     title: 'Derrota 8 inimigos',   goal: 8,  reward: { coins: 40 } },
    { id: 'waves_3',   key: 'waves',     title: 'Completa 3 ondas',     goal: 3,  reward: { coins: 45 } },
  ],

  today() {
    return new Date().toISOString().slice(0, 10);
  },

  load() {
    const day = this.today();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(this._key) || 'null'); } catch (e) {}
    if (saved && saved.date === day && Array.isArray(saved.missions)) {
      this.data = saved;
      return;
    }
    this.data = { date: day, missions: this._generate(day) };
    this.save();
  },

  save() {
    try { localStorage.setItem(this._key, JSON.stringify(this.data)); } catch (e) {}
  },

  _seed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  },

  _generate(day) {
    const pool = this.POOL.slice();
    let s = this._seed(day) || 1;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s; };
    for (let i = pool.length - 1; i > 0; i--) {
      const j = rnd() % (i + 1);
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, 3).map(m => ({ id: m.id, progress: 0, claimed: false }));
  },

  template(id) {
    return this.POOL.find(p => p.id === id) || null;
  },

  track(key, n = 1) {
    if (!this.data || this.data.date !== this.today()) this.load();
    if (!this.data) return;
    let changed = false;
    this.data.missions.forEach(m => {
      const t = this.template(m.id);
      if (!t || t.key !== key || m.claimed || m.progress >= t.goal) return;
      m.progress = Math.min(t.goal, m.progress + n);
      changed = true;
    });
    if (changed) this.save();
  },

  claim(id) {
    if (!this.data || this.data.date !== this.today()) this.load();
    if (!this.data) return false;
    const m = this.data.missions.find(x => x.id === id);
    const t = m ? this.template(m.id) : null;
    if (!m || !t || m.claimed || m.progress < t.goal) return false;
    m.claimed = true;
    const r = t.reward || {};
    if (r.coins)    Progression.addCoins(r.coins);
    if (r.trophies) Progression.addTrophies(r.trophies);
    if (r.gems)     Progression.addGems(r.gems);
    this.save();
    return true;
  },

  rewardText(reward) {
    const r = reward || {};
    const parts = [];
    if (r.coins)    parts.push(COIN_SVG + ' ' + r.coins);
    if (r.trophies) parts.push('🏆 ' + r.trophies);
    if (r.gems)     parts.push(GEM_SVG + ' ' + r.gems);
    return parts.join(' + ');
  },

  claimableCount() {
    if (!this.data || this.data.date !== this.today()) this.load();
    if (!this.data) return 0;
    return this.data.missions.filter(m => {
      const t = this.template(m.id);
      return t && !m.claimed && m.progress >= t.goal;
    }).length;
  },
};

const MissionsScene = {
  init() {
    document.getElementById('btn-back-missions').onclick = () => App.goTo('menu');
  },

  show() {
    DailyMissions.load();
    this._render();
  },

  updateBadge() {
    const el = document.getElementById('badge-missoes');
    if (!el || typeof DailyMissions === 'undefined') return;
    const n = DailyMissions.claimableCount();
    el.textContent = String(n);
    el.hidden = n <= 0;
  },

  _render() {
    const el = document.getElementById('missions-content');
    if (!el) return;
    DailyMissions.load();
    const d = DailyMissions.data;
    const claimed = d.missions.filter(m => m.claimed).length;

    el.innerHTML = `
      <div class="dm-header">
        <div class="dm-title">MISSÕES DIÁRIAS</div>
        <div class="dm-sub">${d.date} • ${claimed}/${d.missions.length} resgatadas • novas missões todos os dias</div>
      </div>
      ${d.missions.map(m => {
        const t = DailyMissions.template(m.id);
        if (!t) return '';
        const pct = Math.min(100, Math.round((m.progress / t.goal) * 100));
        const done = m.progress >= t.goal;
        const claimable = done && !m.claimed;
        return `
          <div class="dm-card ${m.claimed ? 'claimed' : ''} ${claimable ? 'claimable' : ''}">
            <div class="dm-main">
              <div class="dm-card-title">${t.title}</div>
              <div class="dm-bar"><div class="dm-fill" style="width:${pct}%"></div></div>
              <div class="dm-progress">${Math.min(m.progress, t.goal)} / ${t.goal}</div>
            </div>
            <div class="dm-reward">${DailyMissions.rewardText(t.reward)}</div>
            ${m.claimed
              ? '<div class="dm-state">✅ Resgatada</div>'
              : claimable
                ? `<button class="dm-claim" data-id="${m.id}">RESGATAR</button>`
                : '<div class="dm-state">Em curso…</div>'}
          </div>
        `;
      }).join('')}
    `;

    el.querySelectorAll('.dm-claim').forEach(btn => {
      btn.onclick = () => {
        if (DailyMissions.claim(btn.dataset.id)) this._render();
      };
    });

    this.updateBadge();
  },
};

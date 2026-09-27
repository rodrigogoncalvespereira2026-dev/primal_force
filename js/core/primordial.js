const Primordial = {
  TIERS: [
    { id:'common',     name:'Comum',      sprite:'gota-comum.png',     color:'#8a9ba8', coins:8,   trophies:0, items:0, itemTier:'none' },
    { id:'rare',       name:'Raro',       sprite:'gota-raro.png',      color:'#3b82f6', coins:18,  trophies:3, items:0, itemTier:'none' },
    { id:'super_rare', name:'Super-Raro', sprite:'gota-super_raro.png',color:'#8b5cf6', coins:35,  trophies:8, items:0, itemTier:'none' },
    { id:'epic',       name:'Épico',      sprite:'gota-epico.png',     color:'#f59e0b', coins:65,  trophies:15,items:1, itemTier:'random' },
    { id:'mythic',     name:'Mítico',     sprite:'gota-mitico.png',    color:'#ef4444', coins:110, trophies:28,items:1, itemTier:'good' },
    { id:'legendary',  name:'Lendário',   sprite:'gota-lendario.png',  color:'#f97316', coins:180, trophies:45,items:2, itemTier:'random' },
    { id:'primal',     name:'PRIMAL',     sprite:'gota-primal.png',    color:'#ec4899', coins:300, trophies:75,items:2, itemTier:'good' },
  ],

  CHARGE_MAX: 5,
  UPGRADE_CHANCE: 0.30,
  UPGRADE_BONUS: 0.05,
  ROUND_MS: 12000,
  UPGRADE_MS: 2500,
  ANTI_CHEAT_MIN_MS: 40,

  WEIGHTS: {
    defeat:  [55, 45,  0,  0,  0,  0, 0],
    victory: [ 0, 38, 27, 19, 11,  5, 0],
    boss:    [ 0, 15, 20, 24, 20, 14, 7],
    shop:    [ 0, 15, 20, 24, 20, 13, 8],
  },

  _RANDOM_ITEMS: ['potion', 'shield', 'speedBoost'],
  _GOOD_ITEMS: ['doubleCoins', 'doubleTrophies'],

  state: {
    active:false, mode:'shop', tierIdx:0, winner:0, charge:0, taps:0,
    upgrades:0, lastTapTime:0, upgradeBonus:0, remainingMs:0, endsAt:0,
  },

  weightsFor(mode) {
    return this.WEIGHTS[mode] || this.WEIGHTS.shop;
  },

  pickWeighted(weights, rnd) {
    const fn = typeof rnd === 'function' ? rnd : Math.random;
    let total = 0;
    for (let i = 0; i < weights.length; i++) total += weights[i];
    if (total <= 0) return 0;
    const x = fn() * total;
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (x < acc) return i;
    }
    for (let i = weights.length - 1; i >= 0; i--) if (weights[i] > 0) return i;
    return 0;
  },

  start(mode, opts) {
    opts = opts || {};
    const now = opts.now !== undefined ? opts.now : Date.now();
    const winner = opts.tierIdx !== undefined
      ? opts.tierIdx
      : this.pickWeighted(this.weightsFor(mode), opts.rnd);
    this.state = {
      active: true,
      mode: mode || 'shop',
      winner: winner,
      tierIdx: winner,
      charge: 0,
      taps: 0,
      upgrades: 0,
      lastTapTime: 0,
      upgradeBonus: opts.upgradeBonus || 0,
      remainingMs: this.ROUND_MS,
      endsAt: now + this.ROUND_MS,
    };
    return this.state.tierIdx;
  },

  tick(now) {
    if (!this.state.active) return 0;
    const t = now !== undefined ? now : Date.now();
    this.state.remainingMs = Math.max(0, this.state.endsAt - t);
    return this.state.remainingMs;
  },

  timedOut(now) {
    return this.state.active && this.tick(now) <= 0;
  },

  tap(now) {
    if (!this.state.active) return false;
    const t = now !== undefined ? now : performance.now();
    const elapsed = t - this.state.lastTapTime;
    if (elapsed > 0 && elapsed < this.ANTI_CHEAT_MIN_MS) return false;
    this.state.lastTapTime = t;
    this.state.taps++;
    this.state.charge++;

    if (this.state.charge < this.CHARGE_MAX) return 'tap';

    this.state.charge = 0;
    if (this.state.tierIdx >= this.TIERS.length - 1) return 'full';
    const chance = Math.min(1, this.UPGRADE_CHANCE + this.state.upgradeBonus);
    if (Math.random() < chance) {
      this.state.tierIdx++;
      this.state.upgrades++;
      this.state.endsAt += this.UPGRADE_MS;
      this.state.remainingMs += this.UPGRADE_MS;
      return 'upgrade';
    }
    return 'full';
  },

  chargeProgress() {
    return this.state.charge / this.CHARGE_MAX;
  },

  getTierData() {
    return this.TIERS[this.state.tierIdx] || this.TIERS[0];
  },

  _pickItem(tier) {
    const pool = tier === 'good' ? this._GOOD_ITEMS : this._RANDOM_ITEMS;
    const id = pool[Math.floor(Math.random() * pool.length)];
    const item = Progression.SHOP_ITEMS.find(i => i.id === id);
    return item || { id: id, name: id, icon: '📦' };
  },

  getRewards() {
    const tier = this.getTierData();
    const rewards = [];
    if (tier.coins > 0) rewards.push({ type:'coins', amount:tier.coins });
    if (tier.trophies > 0) rewards.push({ type:'trophies', amount:tier.trophies });
    for (let i = 0; i < tier.items; i++) {
      const picked = this._pickItem(tier.itemTier);
      rewards.push({ type:'item', id:picked.id, icon:picked.icon, name:picked.name });
    }
    if (tier.id === 'primal') {
      rewards.push({ type:'aura', id:'primal_aura', icon:'🌟', name:'Aura Primal (1 missão)' });
    }
    return rewards;
  },

  claimRewards(rewards) {
    rewards.forEach(r => {
      if (r.type === 'coins') Progression.addCoins(r.amount);
      else if (r.type === 'trophies') Progression.addTrophies(r.amount);
      else if (r.type === 'item') {
        Progression.data.items[r.id] = (Progression.data.items[r.id] || 0) + 1;
        Progression.save();
      }
      else if (r.type === 'aura') {
        if (!Progression.data.unlockedSkins.includes(r.id)) {
          Progression.data.unlockedSkins.push(r.id);
          Progression.save();
        }
        Progression.data.activeAura = r.id;
        Progression.save();
      }
    });
  },

  claim() {
    if (!this.state.active) return null;
    this.state.active = false;
    this.state.remainingMs = 0;
    const rewards = this.getRewards();
    this.claimRewards(rewards);
    return rewards;
  },

  canDrop(missionResult) {
    if (!missionResult.victory) return { chance:0.15, mode:'defeat' };
    if (missionResult.isBoss) return { chance:1.0, mode:'boss' };
    return { chance:0.4, mode:'victory' };
  },

  rewardText(r) {
    if (r.type === 'coins') return COIN_SVG + ' +' + r.amount;
    if (r.type === 'trophies') return '🏆 +' + r.amount;
    if (r.type === 'item') return (r.icon || '📦') + ' ' + (r.name || r.id);
    if (r.type === 'aura') return '🌟 Aura Primal (1 missão)';
    return '📦 Recompensa';
  },
};

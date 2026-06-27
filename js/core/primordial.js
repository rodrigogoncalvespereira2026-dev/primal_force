const Primordial = {
  TIERS: [
    { id:'common',     name:'Comum',      tapsMin:0,  tapsMax:3,   sprite:'gota-comum.png',     color:'#8a9ba8', coins:8,   trophies:0, items:0,     itemTier:'none' },
    { id:'rare',       name:'Raro',       tapsMin:4,  tapsMax:7,   sprite:'gota-raro.png',      color:'#3b82f6', coins:18,  trophies:3, items:0,     itemTier:'none' },
    { id:'super_rare', name:'Super-Raro', tapsMin:8,  tapsMax:12,  sprite:'gota-super_raro.png', color:'#8b5cf6', coins:35,  trophies:8, items:0,     itemTier:'none' },
    { id:'epic',       name:'Épico',      tapsMin:13, tapsMax:18,  sprite:'gota-epico.png',      color:'#f59e0b', coins:65,  trophies:15,items:1,     itemTier:'random' },
    { id:'mythic',     name:'Mítico',     tapsMin:19, tapsMax:26,  sprite:'gota-mitico.png',     color:'#ef4444', coins:110, trophies:28,items:1,     itemTier:'good' },
    { id:'legendary',  name:'Lendário',   tapsMin:27, tapsMax:35,  sprite:'gota-lendario.png',   color:'#f97316', coins:180, trophies:45,items:2,     itemTier:'random' },
    { id:'primal',     name:'PRIMAL',     tapsMin:36, tapsMax:999, sprite:'gota-primal.png',     color:'#ec4899', coins:300, trophies:75,items:2,     itemTier:'good' },
  ],

  TAPS_PER_TIER: 5,
  ANTI_CHEAT_MIN_MS: 40,

  _RANDOM_ITEMS: ['potion', 'shield', 'speedBoost'],
  _GOOD_ITEMS: ['doubleCoins', 'doubleTrophies'],

  state: {
    active:false, taps:0, tapsForTier:0, tierIdx:0, lastTapTime:0, maxTier:6
  },

  getTier(taps) {
    for (let i = this.TIERS.length - 1; i >= 0; i--) {
      if (taps >= this.TIERS[i].tapsMin) return i;
    }
    return 0;
  },

  start(maxAllowedTier) {
    this.state = {
      active:true, taps:0, tapsForTier:0, tierIdx:0,
      lastTapTime:0, maxTier:maxAllowedTier !== undefined ? maxAllowedTier : 6
    };
  },

  // Devolve: false (anti-cheat), 'tap' (normal), 'evolve' (subiu de tier), 'claim' (5 toques → resgata)
  tap(now) {
    if (!this.state.active) return false;
    const elapsed = now - this.state.lastTapTime;
    if (elapsed > 0 && elapsed < this.ANTI_CHEAT_MIN_MS) return false;
    this.state.lastTapTime = now;
    this.state.taps++;
    this.state.tapsForTier++;

    // Verifica se total de toques atinge o tier seguinte
    const newTier = Math.min(this.getTier(this.state.taps), this.state.maxTier);
    if (newTier > this.state.tierIdx) {
      this.state.tierIdx = newTier;
      this.state.tapsForTier = 0;
      return 'evolve';
    }

    // Verifica se completou 5 toques neste tier
    if (this.state.tapsForTier >= this.TAPS_PER_TIER) {
      this.state.active = false;
      return 'claim';
    }

    return 'tap';
  },

  getTierData() {
    return this.TIERS[this.state.tierIdx] || this.TIERS[0];
  },

  _pickItem(tier) {
    const pool = tier === 'good' ? this._GOOD_ITEMS : this._RANDOM_ITEMS;
    const id = pool[Math.floor(Math.random() * pool.length)];
    const item = Progression.SHOP_ITEMS.find(i => i.id === id);
    return item || { id, name:id, icon:'📦' };
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

  canDrop(missionResult) {
    if (!missionResult.victory) return { chance:0.15, maxTier:1 };
    if (missionResult.isBoss) return { chance:1.0, maxTier:6 };
    return { chance:0.4, maxTier:6 };
  },

  rewardText(r) {
    if (r.type === 'coins') return '🪙 +' + r.amount;
    if (r.type === 'trophies') return '🏆 +' + r.amount;
    if (r.type === 'item') return (r.icon || '📦') + ' ' + (r.name || r.id);
    if (r.type === 'aura') return '🌟 Aura Primal (1 missão)';
    return '📦 Recompensa';
  },
};

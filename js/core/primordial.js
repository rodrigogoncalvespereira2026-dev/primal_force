const Primordial = {
  TIERS: [
    { id:'common',     name:'Comum',        icon:'💧', tapsMin:0,   tapsMax:4,   color:'#8a9ba8', coins:5,   trophies:0, items:[] },
    { id:'rare',       name:'Raro',         icon:'🔵', tapsMin:5,   tapsMax:9,   color:'#3b82f6', coins:15,  trophies:1, items:['potion'] },
    { id:'super_rare', name:'Super Raro',   icon:'🟣', tapsMin:10,  tapsMax:14,  color:'#8b5cf6', coins:35,  trophies:3, items:['shield'] },
    { id:'epic',       name:'Épico',        icon:'🟠', tapsMin:15,  tapsMax:19,  color:'#f59e0b', coins:70,  trophies:6, items:['speedBoost','potion'] },
    { id:'mythic',     name:'Mítico',       icon:'🔴', tapsMin:20,  tapsMax:24,  color:'#ef4444', coins:130, trophies:10,items:['doubleCoins','shield'], gems:1 },
    { id:'legendary',  name:'Lendário',     icon:'💎', tapsMin:25,  tapsMax:29,  color:'#f97316', coins:250, trophies:20,items:['doubleTrophies','speedBoost'], gems:3, cosmetic:true },
    { id:'primal',     name:'PRIMAL',       icon:'🌟', tapsMin:30,  tapsMax:999, color:'#ec4899', coins:500, trophies:40,items:['potion','shield','speedBoost','doubleCoins','doubleTrophies'], gems:10, cosmetic:true },
  ],
  MAX_TIME: 5,
  TAP_BONUS: 0.15,
  ANTI_CHEAT_MIN_MS: 40,
  ANTI_CHEAT_MAX_MS: 50,

  state: { active:false, taps:0, time:0, tierIdx:0, lastTapTime:0 },

  getTier(taps) {
    for (let i = this.TIERS.length - 1; i >= 0; i--) {
      if (taps >= this.TIERS[i].tapsMin) return i;
    }
    return 0;
  },

  start(timeLimit) {
    this.state = { active:true, taps:0, time:timeLimit || this.MAX_TIME, tierIdx:0, lastTapTime:0 };
  },

  tap(now) {
    if (!this.state.active) return false;
    const elapsed = now - this.state.lastTapTime;
    if (elapsed > 0 && elapsed < this.ANTI_CHEAT_MIN_MS) return false;
    this.state.lastTapTime = now;
    this.state.taps++;
    this.state.time = Math.min(this.state.time + this.TAP_BONUS, this.MAX_TIME);
    this.state.tierIdx = this.getTier(this.state.taps);
    return true;
  },

  tick(dt) {
    if (!this.state.active) return false;
    this.state.time -= dt;
    if (this.state.time <= 0) {
      this.state.time = 0;
      return true;
    }
    return false;
  },

  getTierData() { return this.TIERS[this.state.tierIdx] || this.TIERS[0]; },

  getRewards() {
    const tier = this.getTierData();
    const rewards = [];
    if (tier.coins > 0) rewards.push({ type:'coins', amount:tier.coins });
    if (tier.trophies > 0) rewards.push({ type:'trophies', amount:tier.trophies });
    if (tier.gems > 0) rewards.push({ type:'gems', amount:tier.gems });
    tier.items.forEach(id => rewards.push({ type:'item', id }));
    if (tier.cosmetic) {
      const skins = Progression.SHOP_SKINS || [];
      const unlocked = Progression.data.unlockedSkins || [];
      const available = skins.filter(s => !unlocked.includes(s.id));
      if (available.length > 0) {
        const picked = available[Math.floor(Math.random() * available.length)];
        rewards.push({ type:'skin', id:picked.id });
      }
    }
    return rewards;
  },

  claimRewards(rewards) {
    rewards.forEach(r => {
      if (r.type === 'coins') Progression.addCoins(r.amount);
      else if (r.type === 'trophies') Progression.addTrophies(r.amount);
      else if (r.type === 'gems') Progression.addGems(r.amount);
      else if (r.type === 'item') {
        Progression.data.items[r.id] = (Progression.data.items[r.id] || 0) + 1;
        Progression.save();
      }
      else if (r.type === 'skin' && !Progression.data.unlockedSkins.includes(r.id)) {
        Progression.data.unlockedSkins.push(r.id);
        Progression.save();
      }
    });
  },

  canDrop(missionResult) {
    if (missionResult.victory) {
      return missionResult.isBoss ? 1.0 : 0.4;
    }
    return 0.15;
  },
};

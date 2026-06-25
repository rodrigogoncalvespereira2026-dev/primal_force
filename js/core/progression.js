// ── SISTEMA DE PROGRESSÃO: TROFÉUS + PASSE DE BATALHA ────────────────

const Progression = {
  // Dados guardados (localStorage)
  data: {
    trophies: 0,
    battlePassTier: 0,
    battlePassXP: 0,
    unlockedRangers: ['roro'],
    unlockedSkins: [],
    unlockedWeapons: [],
    coins: 0,
    items: { potion: 0, shield: 0, speedBoost: 0, doubleCoins: 0, doubleTrophies: 0 },
  },

  // Skins cosméticas para recompensas lendárias
  SHOP_SKINS: [
    { id:'primal_aura',      name:'Aura Primal',      icon:'🌟' },
    { id:'golden_ranger',    name:'Ranger Dourado',   icon:'✨' },
    { id:'shadow_phantom',   name:'Fantasma Sombrio', icon:'🌑' },
    { id:'crystal_guardian', name:'Guardião Cristal', icon:'💎' },
    { id:'inferno_blaze',    name:'Chama Infernal',   icon:'🔥' },
  ],

  // Catálogo da loja — itens comprados com moedas
  SHOP_ITEMS: [
    { id:'potion',         name:'Poção de Vida',      desc:'Começa a próxima missão com o HP completo.',            icon:'🧪', price:50  },
    { id:'shield',         name:'Escudo de Entrada',  desc:'Começa a missão com alguns segundos de invencibilidade.', icon:'🛡️', price:80  },
    { id:'speedBoost',     name:'Bota de Velocidade', desc:'+30% de velocidade durante toda a missão.',             icon:'⚡', price:70  },
    { id:'doubleCoins',    name:'Moeda Dupla',        desc:'Ganha o dobro de moedas nesta missão.',                 icon:'💰', price:100 },
    { id:'doubleTrophies', name:'Troféu Duplo',       desc:'Ganha o dobro de troféus nesta missão.',                icon:'🏆', price:120 },
  ],

  // Caminho de troféus — cada entrada é um marco
  TROPHY_PATH: [
    { trophies: 0,   reward: null,          label: 'Início' },
    { trophies: 10,  reward: { type:'ranger', id:'mar' },        label: 'Mar desbloqueado!',      icon:'🦕' },
    { trophies: 25,  reward: { type:'skin',   id:'roro_fire' },  label: 'Skin Fogo (Roro)',       icon:'🔥' },
    { trophies: 50,  reward: { type:'ranger', id:'marc' },       label: 'Marc desbloqueado!',     icon:'🦏' },
    { trophies: 80,  reward: { type:'weapon', id:'laser2' },     label: 'Laser Duplo',            icon:'⚡' },
    { trophies: 120, reward: { type:'ranger', id:'vido' },       label: 'Vido desbloqueado!',     icon:'🦅' },
    { trophies: 160, reward: { type:'skin',   id:'mar_dark' },   label: 'Skin Sombra (Mar)',      icon:'🌑' },
    { trophies: 200, reward: { type:'ranger', id:'mira' },       label: 'Mira desbloqueada!',     icon:'🌊' },
    { trophies: 260, reward: { type:'weapon', id:'shield2' },    label: 'Mega Escudo',            icon:'🛡️' },
    { trophies: 320, reward: { type:'ranger', id:'zenowing' },   label: 'Zenowing desbloqueado!', icon:'⚔️' },
    { trophies: 400, reward: { type:'skin',   id:'roro_legend' },label: 'Skin Lendário (Roro)',   icon:'👑' },
    { trophies: 500, reward: { type:'skin',   id:'all_gold' },   label: 'Skin Ouro (todos)',      icon:'🏆' },
  ],

  // Passe de batalha — 20 níveis, grátis e premium
  BATTLE_PASS: Array.from({ length: 20 }, (_, i) => ({
    tier: i + 1,
    xpNeeded: (i + 1) * 100,
    free:    [
      { type:'coins', amount: 50 + i * 10 },
      { type:'coins', amount: 100 + i * 15 },
      { type:'skin',  id: i % 4 === 3 ? `skin_free_${i}` : null },
    ].filter(r => r.id !== null || r.amount),
    premium: [
      { type:'coins',  amount: 150 + i * 25 },
      { type:'weapon', id: i % 5 === 4 ? `weapon_prem_${i}` : null },
      { type:'ranger', id: i === 9 ? 'bonus_ranger' : null },
      { type:'skin',   id: i % 3 === 2 ? `skin_prem_${i}` : null },
    ].filter(r => r.id !== null || r.amount),
    label: `Nível ${i + 1}`,
  })),

  load() {
    try {
      const saved = localStorage.getItem('prf_progression');
      if (saved) this.data = { ...this.data, ...JSON.parse(saved) };
    } catch(e) {}
  },

  save() {
    try { localStorage.setItem('prf_progression', JSON.stringify(this.data)); } catch(e) {}
  },

  addTrophies(n) {
    this.data.trophies += n;
    this._checkTrophyRewards();
    this.save();
  },

  addCoins(n) {
    this.data.coins += n;
    this.save();
  },

  buyItem(id) {
    const item = this.SHOP_ITEMS.find(i => i.id === id);
    if (!item) return false;
    if (this.data.coins < item.price) return false;
    this.data.coins -= item.price;
    this.data.items[id] = (this.data.items[id] || 0) + 1;
    this.save();
    return true;
  },

  // Gasta 1 unidade de um item do inventário (usado ao iniciar uma missão)
  consumeItem(id) {
    if ((this.data.items[id] || 0) > 0) {
      this.data.items[id]--;
      this.save();
      return true;
    }
    return false;
  },

  addBattlePassXP(n) {
    this.data.battlePassXP += n;
    while (
      this.data.battlePassTier < this.BATTLE_PASS.length &&
      this.data.battlePassXP >= this.BATTLE_PASS[this.data.battlePassTier].xpNeeded
    ) {
      this.data.battlePassXP -= this.BATTLE_PASS[this.data.battlePassTier].xpNeeded;
      this.data.battlePassTier++;
    }
    this.save();
  },

  _checkTrophyRewards() {
    for (const milestone of this.TROPHY_PATH) {
      if (!milestone.reward) continue;
      if (this.data.trophies >= milestone.trophies) {
        const r = milestone.reward;
        if (r.type === 'ranger' && !this.data.unlockedRangers.includes(r.id)) {
          this.data.unlockedRangers.push(r.id);
        }
        if (r.type === 'skin' && !this.data.unlockedSkins.includes(r.id)) {
          this.data.unlockedSkins.push(r.id);
        }
        if (r.type === 'weapon' && !this.data.unlockedWeapons.includes(r.id)) {
          this.data.unlockedWeapons.push(r.id);
        }
      }
    }
  },

  isRangerUnlocked(id) { return this.data.unlockedRangers.includes(id); },

  getCurrentTrophyMilestone() {
    let current = this.TROPHY_PATH[0];
    let next    = this.TROPHY_PATH[1];
    for (let i = 0; i < this.TROPHY_PATH.length; i++) {
      if (this.data.trophies >= this.TROPHY_PATH[i].trophies) current = this.TROPHY_PATH[i];
      else { next = this.TROPHY_PATH[i]; break; }
    }
    return { current, next };
  },
};

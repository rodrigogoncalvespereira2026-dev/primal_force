// ── SISTEMA DE PROGRESSÃO: TROFÉUS + PASSE DE BATALHA ────────────────

const Progression = {
  // Dados guardados (localStorage)
  data: {
    trophies: 0,
    battlePassTier: 0,
    battlePassXP: 0,
    unlockedRangers: ['roro'],
    unlockedSkins: [],
    equippedSkin: null,
    unlockedWeapons: [],
    coins: 0,
    gems: 0,
    bpPremium: false,
    claimedBPFree: [],
    claimedBPPremium: [],
    lastFreePrimordial: null,
    items: { potion: 0, shield: 0, speedBoost: 0, doubleCoins: 0, doubleTrophies: 0 },
  },

  GEM_PRICES: [10, 20, 30], // joias necessárias para 1ª, 2ª, 3+ gota extra por dia

  // Skins cosméticas para recompensas lendárias
  SHOP_SKINS: [
    { id:'primal_aura',      name:'Aura Primal',      icon:'🌟' },
    { id:'golden_ranger',    name:'Ranger Dourado',   icon:'✨' },
    { id:'shadow_phantom',   name:'Fantasma Sombrio', icon:'🌑' },
    { id:'crystal_guardian', name:'Guardião Cristal', icon:GEM_SVG },
    { id:'inferno_blaze',    name:'Chama Infernal',   icon:'🔥' },
  ],

  // Catálogo da loja — itens comprados com moedas
  SHOP_ITEMS: [
    { id:'potion',         name:'Poção de Vida',      desc:'Começa a próxima missão com o HP completo.',            icon:'🧪', price:50  },
    { id:'shield',         name:'Escudo de Entrada',  desc:'Começa a missão com alguns segundos de invencibilidade.', icon:'🛡️', price:80  },
    { id:'speedBoost',     name:'Bota de Velocidade', desc:'+30% de velocidade durante toda a missão.',             icon:'⚡', price:70  },
    { id:'doubleCoins',    name:'Moeda Dupla',        desc:'Ganha o dobro de moedas nesta missão.',                 icon:COIN_SVG, price:100 },
    { id:'doubleTrophies', name:'Troféu Duplo',       desc:'Ganha o dobro de troféus nesta missão.',                icon:'🏆', price:120 },
    // Pacotes de moedas (comprados com joias)
    { id:'coins_small',    name:'Pacote de Moedas',   desc:'500 moedas',  icon:COIN_SVG, price:5,  priceType:'gems', reward:{ coins:500 } },
    { id:'coins_medium',   name:'Pacote de Moedas+',  desc:'1200 moedas', icon:COIN_SVG, price:10, priceType:'gems', reward:{ coins:1200 } },
    { id:'coins_large',    name:'Pacote de Moedas++', desc:'3000 moedas', icon:COIN_SVG, price:20, priceType:'gems', reward:{ coins:3000 } },
    // Pacotes de joias (comprados com moedas)
    { id:'gems_small',     name:'Pacote de Joias',    desc:'3 joias',  icon:GEM_SVG, price:200, reward:{ gems:3 } },
    { id:'gems_medium',    name:'Pacote de Joias+',   desc:'8 joias',  icon:GEM_SVG, price:500, reward:{ gems:8 } },
    { id:'gems_large',     name:'Pacote de Joias++',  desc:'20 joias', icon:GEM_SVG, price:1000, reward:{ gems:20 } },
  ],
  // Ajudante: devolve moedas/joias conforme o tipo de preço
  _canAfford(item) {
    if (item.priceType === 'gems') return (this.data.gems || 0) >= item.price;
    return this.data.coins >= item.price;
  },
  _spend(item) {
    if (item.priceType === 'gems') {
      if ((this.data.gems || 0) < item.price) return false;
      this.data.gems -= item.price;
    } else {
      if (this.data.coins < item.price) return false;
      this.data.coins -= item.price;
    }
    return true;
  },

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
      { type:'gems',  amount: i % 5 === 0 ? 1 : 0 },
      { type:'skin',  id: i % 4 === 3 ? `skin_free_${i}` : null },
    ].filter(r => r.id !== null || r.amount),
    premium: [
      { type:'coins',  amount: 150 + i * 25 },
      { type:'gems',   amount: i % 3 === 0 ? 3 : 0 },
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

  addGems(n) {
    this.data.gems = (this.data.gems || 0) + n;
    this.save();
  },

  spendGems(n) {
    if ((this.data.gems || 0) < n) return false;
    this.data.gems -= n;
    this.save();
    return true;
  },

  canClaimFreePrimordial() {
    const last = this.data.lastFreePrimordial;
    if (!last) return true;
    const today = new Date().toISOString().slice(0, 10);
    return last !== today;
  },

  claimFreePrimordial() {
    this.data.lastFreePrimordial = new Date().toISOString().slice(0, 10);
    this.save();
  },

  primordialExtraPrice(count) {
    const idx = Math.min(count, this.GEM_PRICES.length - 1);
    return this.GEM_PRICES[idx];
  },

  buyItem(id) {
    const item = this.SHOP_ITEMS.find(i => i.id === id);
    if (!item) return false;
    if (!this._canAfford(item)) return false;
    if (!this._spend(item)) return false;
    // Pacotes de moedas/joias: creditam diretamente
    if (item.reward) {
      if (item.reward.coins) this.data.coins += item.reward.coins;
      if (item.reward.gems) this.data.gems = (this.data.gems || 0) + item.reward.gems;
    } else {
      this.data.items[id] = (this.data.items[id] || 0) + 1;
    }
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

  // ── SKINS EQUIPÁVEIS ──
  SKIN_DEFS: {
    primal_aura:      { name:'Aura Primal',      color:'#7ee0ff', icon:'🌟' },
    golden_ranger:    { name:'Ranger Dourado',   color:'#ffd700', icon:'✨' },
    shadow_phantom:   { name:'Fantasma Sombrio', color:'#2b2b3d', icon:'🌑' },
    crystal_guardian: { name:'Guardião Cristal', color:'#a9e7ff', icon:'💎' },
    inferno_blaze:    { name:'Chama Infernal',   color:'#ff5a1f', icon:'🔥' },
    roro_fire:        { name:'Fogo (Roro)',      color:'#ff7a1f', icon:'🔥' },
    mar_dark:         { name:'Sombra (Mar)',     color:'#4a4a55', icon:'🌑' },
    roro_legend:      { name:'Lendário (Roro)',  color:'#ffe08a', icon:'👑' },
    all_gold:         { name:'Ouro (todos)',     color:'#ffd700', icon:'🏆' },
  },

  getSkin(id) {
    if (!id) return null;
    const def = this.SKIN_DEFS[id];
    if (def) return Object.assign({ id: id }, def);
    // IDs gerados (passe de batalha) — cor derivada do nome
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
    return { id: id, name: id.replace(/_/g, ' '), color: `hsl(${h},70%,55%)`, icon: '🎨' };
  },

  ownedSkins() {
    return (this.data.unlockedSkins || []).map(id => this.getSkin(id)).filter(Boolean);
  },

  equipSkin(id) {
    if (id && !(this.data.unlockedSkins || []).includes(id)) return false;
    this.data.equippedSkin = id || null;
    this.save();
    return true;
  },

  buyBPPremium(price = 50) {
    if (this.data.bpPremium) return true;
    if (!this.spendGems(price)) return false;
    this.data.bpPremium = true;
    this.save();
    return true;
  },

  _grantReward(r) {
    if (!r) return;
    if (r.type === 'coins')  this.data.coins += (r.amount || 0);
    else if (r.type === 'gems') this.data.gems = (this.data.gems || 0) + (r.amount || 0);
    else if (r.type === 'skin'   && r.id && !this.data.unlockedSkins.includes(r.id))    this.data.unlockedSkins.push(r.id);
    else if (r.type === 'weapon' && r.id && !this.data.unlockedWeapons.includes(r.id))  this.data.unlockedWeapons.push(r.id);
    else if (r.type === 'ranger' && r.id && !this.data.unlockedRangers.includes(r.id))  this.data.unlockedRangers.push(r.id);
  },

  canClaimBPReward(tierNum, track) {
    if (tierNum > this.data.battlePassTier) return false;
    if (track === 'premium' && !this.data.bpPremium) return false;
    const list = track === 'premium'
      ? (this.data.claimedBPPremium || [])
      : (this.data.claimedBPFree || []);
    return !list.includes(tierNum);
  },

  claimBPReward(tierNum, track) {
    if (!this.canClaimBPReward(tierNum, track)) return false;
    const tier = this.BATTLE_PASS[tierNum - 1];
    if (!tier) return false;
    tier[track].forEach(r => this._grantReward(r));
    if (track === 'premium') this.data.claimedBPPremium.push(tierNum);
    else this.data.claimedBPFree.push(tierNum);
    this.save();
    return true;
  },

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

const ShopScene = {
  _extraCount: 0,
  _packQueue: 0,
  _cat: 'destaque',

  init() {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    on('btn-back-shop', () => App.goTo('menu'));
    on('btn-shop-home', () => App.goTo('menu'));
    on('btn-shop-values', () => this._openValues());
    on('btn-shop-values-close', () => this._closeValues());
    const ov = document.getElementById('shop-values');
    if (ov) ov.onclick = e => { if (e.target === ov) this._closeValues(); };
  },

  show() {
    this._extraCount = 0;
    this._packQueue = 0;
    this._render();
  },

  _render() {
    const data = Progression.data;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('shop-trophies', data.trophies);
    set('shop-coins', data.coins);
    set('shop-gems', data.gems || 0);
    set('shop-bp-level', data.battlePassTier + 1);
    this._renderCats();
    this._renderPanel();
  },

  _renderCats() {
    const wrap = document.getElementById('shop-cats');
    if (!wrap) return;
    wrap.innerHTML = Progression.SHOP_CATEGORIES.map(c => `
      <button class="shop-cat ${c.id === this._cat ? 'active' : ''}" data-cat="${c.id}">
        <span class="shop-cat-icon">${c.icon}</span>
        <span class="shop-cat-label">${c.label}</span>
      </button>
    `).join('');
    wrap.querySelectorAll('.shop-cat').forEach(btn => {
      btn.onclick = () => {
        this._cat = btn.dataset.cat;
        this._renderCats();
        this._renderPanel();
        this._sfx('ui');
      };
    });
  },

  _renderPanel() {
    const panel = document.getElementById('shop-panels');
    if (!panel) return;
    const cat = Progression.SHOP_CATEGORIES.find(c => c.id === this._cat) || Progression.SHOP_CATEGORIES[0];
    const fn = this['_cat_' + cat.id];
    const body = fn ? fn.call(this) : '';
    panel.innerHTML = `
      <section class="shop-panel">
        <h2 class="shop-panel-title">${cat.icon} ${cat.label.toUpperCase()}</h2>
        <div class="shop-grid">${body}</div>
      </section>
    `;
    panel.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.onclick = () => this._onAction(btn.dataset.act);
    });
  },

  _card(o) {
    const priceIcon = o.priceType === 'gems' ? GEM_SVG : COIN_SVG;
    const priceHtml = o.priceHtml !== undefined
      ? o.priceHtml
      : `${priceIcon} ${o.price}`;
    return `
      <div class="shop-item ${o.cls || ''}">
        ${o.badge ? `<div class="shop-item-badge">${o.badge}</div>` : ''}
        <div class="shop-item-icon">${o.icon}</div>
        <div class="shop-item-name">${o.name}</div>
        <div class="shop-item-desc">${o.desc}</div>
        ${o.owned ? `<div class="shop-item-owned">${o.owned}</div>` : ''}
        ${o.bonus ? `<div class="shop-item-bonus">${o.bonus}</div>` : ''}
        <button class="shop-buy-btn" data-act="${o.act || ''}" ${o.disabled ? 'disabled' : ''}>${o.cta || priceHtml}</button>
      </div>
    `;
  },

  _itemCard(item) {
    const data = Progression.data;
    const owned = data.items[item.id] || 0;
    return this._card({
      icon: item.icon,
      name: item.name,
      desc: item.desc,
      badge: item.badge || null,
      bonus: item.bonus || null,
      price: item.price,
      priceType: item.priceType,
      owned: item.reward ? null : `Tens: ${owned}`,
      act: `item:${item.id}`,
      disabled: !Progression._canAfford(item),
    });
  },

  _freeGotaCard() {
    const free = Progression.canClaimFreePrimordial();
    return this._card({
      icon: '💧',
      name: 'Gota Grátis',
      desc: 'Uma Gota Primordial grátis por dia. Toca para abrir!',
      badge: free ? 'GRÁTIS' : null,
      priceHtml: free ? '🎁 GRÁTIS' : '✅ USADA HOJE',
      act: 'gota-free',
      disabled: !free,
      cls: free ? 'highlight' : 'done',
    });
  },

  _cat_destaque() {
    const deal = Progression.getDailyDeal();
    const dealDone = Progression.isDailyDealBought();
    const dealIcon = deal && deal.priceType === 'gems' ? GEM_SVG : COIN_SVG;
    const pop = Progression.SHOP_ITEMS.find(i => i.id === 'pack_popular');

    const dealCard = deal ? this._card({
      icon: deal.item.icon,
      name: deal.item.name,
      desc: deal.item.desc,
      badge: 'OFERTA DO DIA',
      priceHtml: dealDone
        ? '✅ COMPRADA HOJE'
        : `<span class="shop-old-price">${dealIcon} ${deal.item.price}</span> ${dealIcon} ${deal.price}`,
      act: 'daily',
      disabled: dealDone,
      cls: dealDone ? 'done' : 'highlight',
    }) : '';

    const popCard = pop ? this._card({
      icon: pop.icon,
      name: pop.name,
      desc: pop.desc,
      badge: pop.badge,
      bonus: pop.bonus,
      priceHtml: `${GEM_SVG} ${pop.price}`,
      act: `item:${pop.id}`,
      disabled: (Progression.data.gems || 0) < pop.price,
    }) : '';

    return [
      this._freeGotaCard(),
      dealCard,
      popCard,
      this._itemCard(Progression.SHOP_ITEMS.find(i => i.id === 'coins_large') || {}),
    ].join('');
  },

  _cat_recursos() {
    return Progression.itemsByCat('recursos').map(i => this._itemCard(i)).join('');
  },

  _cat_gotas() {
    const data = Progression.data;
    const last = Progression.GEM_PRICES.length - 1;
    const cards = [this._freeGotaCard()];

    Progression.GEM_PRICES.forEach((price, i) => {
      const bought = i < this._extraCount;
      const next = i === Math.min(this._extraCount, last);
      cards.push(this._card({
        icon: '💧',
        name: `Gota Extra ${i + 1}`,
        desc: 'Abre mais uma Gota Primordial agora.',
        badge: i === 0 ? '1ª' : (i === 1 ? '2ª' : '3ª+'),
        priceHtml: bought ? '✅ COMPRADA' : `${GEM_SVG} ${price}`,
        act: `gota-extra:${i}`,
        disabled: bought || !next || (data.gems || 0) < price,
        cls: bought ? 'done' : '',
      }));
    });

    cards.push(this._card({
      icon: '🎁',
      name: 'Pack de 3 Gotas',
      desc: 'Abre 3 Gotas Primordiais em sequência.',
      badge: 'PACK',
      bonus: '3 EM SEQUÊNCIA',
      priceHtml: `${GEM_SVG} ${Progression.GOTAPACK_PRICE}`,
      act: 'gotapack3',
      disabled: (data.gems || 0) < Progression.GOTAPACK_PRICE,
    }));

    return cards.join('');
  },

  _cat_skins() {
    const data = Progression.data;
    const eq = data.equippedSkin || null;
    const owned = data.unlockedSkins || [];
    const cards = [this._card({
      icon: '🎨',
      name: 'Original',
      desc: 'Visual clássico do teu ranger, sem skin.',
      priceHtml: eq === null ? '✅ EQUIPADA' : 'EQUIPAR',
      act: 'skin:',
      disabled: eq === null,
      cls: eq === null ? 'done' : '',
    })];

    Object.keys(Progression.SKIN_DEFS).forEach(id => {
      const s = Progression.SKIN_DEFS[id];
      const has = owned.includes(id);
      const active = eq === id;
      cards.push(this._card({
        icon: `<span class="shop-skin-dot" style="background:${s.color}"></span>${s.icon}`,
        name: s.name,
        desc: has
          ? 'Desbloqueada — toca para equipar.'
          : 'Bloqueada — ganha troféus ou abre Gotas Primordiais.',
        priceHtml: !has ? '🔒 BLOQUEADA' : (active ? '✅ EQUIPADA' : 'EQUIPAR'),
        act: has ? `skin:${id}` : '',
        disabled: !has || active,
        cls: !has ? 'locked' : (active ? 'done' : ''),
      }));
    });

    return cards.join('');
  },

  _cat_passe() {
    const data = Progression.data;
    const total = Progression.BATTLE_PASS.length;
    const maxed = data.battlePassTier >= total;
    const tier = Progression.BATTLE_PASS[Math.min(data.battlePassTier, total - 1)];
    const rest = maxed ? 0 : Math.max(0, tier.xpNeeded - (data.battlePassXP || 0));
    return [
      this._card({
        icon: '👑',
        name: 'Passe Premium',
        desc: 'Desbloqueia a linha premium com 20 níveis de recompensas exclusivas.',
        badge: 'PREMIUM',
        bonus: '+50% RECOMPENSAS',
        priceHtml: data.bpPremium ? '✅ ATIVO' : `${GEM_SVG} 50`,
        act: 'bp-premium',
        disabled: data.bpPremium,
        cls: data.bpPremium ? 'done' : 'highlight',
        owned: data.bpPremium ? 'Já tens o Passe Premium' : null,
      }),
      this._card({
        icon: '📜',
        name: `Nível ${Math.min(data.battlePassTier + 1, total)} de ${total}`,
        desc: maxed
          ? 'Passe completo — resgata todas as recompensas pendentes.'
          : `Faltam ${rest} XP para o próximo nível. Vê as recompensas e resgata as desbloqueadas.`,
        priceHtml: 'VER PASSE',
        act: 'bp-view',
      }),
    ].join('');
  },

  _onAction(act) {
    if (!act) return;
    const parts = act.split(':');
    const key = parts[0];
    const arg = parts[1];

    if (key === 'item') {
      if (Progression.buyItem(arg)) { this._sfx('coin'); this._render(); }
    } else if (key === 'daily') {
      if (Progression.buyDailyDeal()) { this._sfx('coin'); this._render(); }
    } else if (key === 'gota-free') {
      if (!Progression.canClaimFreePrimordial()) return;
      Progression.claimFreePrimordial();
      this._startGota();
    } else if (key === 'gota-extra') {
      const idx = Number(arg);
      const maxIdx = Progression.GEM_PRICES.length - 1;
      if (idx !== Math.min(this._extraCount, maxIdx)) return;
      if (!Progression.spendGems(Progression.GEM_PRICES[idx])) return;
      this._extraCount++;
      this._startGota();
    } else if (key === 'gotapack3') {
      if (!Progression.spendGems(Progression.GOTAPACK_PRICE)) return;
      this._packQueue = 3;
      this._startGota();
    } else if (key === 'bp-premium') {
      if (Progression.buyBPPremium(50)) { this._sfx('coin'); this._render(); }
    } else if (key === 'bp-view') {
      App.goTo('battlepass');
    } else if (key === 'skin') {
      if (Progression.equipSkin(arg || null)) { this._sfx('ui'); this._render(); }
    }
  },

  _startGota() {
    this._sfx('pickup');
    this._render();
    Primordial.start(6);
    GotaScene.show({ coins: 0, trophies: 0 }, () => {
      if (this._packQueue > 0) {
        this._packQueue--;
        this._startGota();
      } else {
        this._render();
      }
    });
  },

  _sfx(name) {
    if (typeof AudioFX === 'undefined') return;
    try { AudioFX.play(name); } catch (e) {}
  },

  _openValues() {
    const list = document.getElementById('shop-values-list');
    const ov = document.getElementById('shop-values');
    if (!list || !ov) return;
    const row = (label, value) => `<div class="shop-values-row"><span>${label}</span><span>${value}</span></div>`;
    const priceOf = i => `${i.priceType === 'gems' ? GEM_SVG : COIN_SVG} ${i.price}`;

    list.innerHTML = Progression.SHOP_CATEGORIES.map(c => {
      let rows = '';
      if (c.id === 'destaque') {
        rows = Progression.itemsByCat('destaque').map(i => row(i.name, priceOf(i))).join('');
        const deal = Progression.getDailyDeal();
        if (deal) rows += row('Oferta do dia', `${deal.item.name} — ${deal.priceType === 'gems' ? GEM_SVG : COIN_SVG} ${deal.price}`);
      } else if (c.id === 'recursos') {
        rows = Progression.itemsByCat('recursos').map(i => row(i.name, priceOf(i))).join('');
      } else if (c.id === 'gotas') {
        rows = row('Gota Grátis (1x/dia)', 'GRÁTIS')
          + Progression.GEM_PRICES.map((p, i) => row(`Gota Extra ${i + 1}`, `${GEM_SVG} ${p}`)).join('')
          + row('Pack de 3 Gotas', `${GEM_SVG} ${Progression.GOTAPACK_PRICE}`);
      } else if (c.id === 'skins') {
        rows = Object.keys(Progression.SKIN_DEFS).map(id => {
          const s = Progression.SKIN_DEFS[id];
          const has = (Progression.data.unlockedSkins || []).includes(id);
          return row(s.name, has ? '✅ DESBLOQUEADA' : '🔒 BLOQUEADA');
        }).join('');
      } else if (c.id === 'passe') {
        rows = row('Passe Premium', `${GEM_SVG} 50`) + row('Recompensas grátis', 'GRÁTIS');
      }
      if (!rows) return '';
      return `
        <div class="shop-values-group">
          <div class="shop-values-title">${c.icon} ${c.label}</div>
          ${rows}
        </div>
      `;
    }).join('');
    ov.style.display = 'flex';
  },

  _closeValues() {
    const ov = document.getElementById('shop-values');
    if (ov) ov.style.display = 'none';
  },
};

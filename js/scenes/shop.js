const ShopScene = {
  _extraCount: 0, // quantas gotas extra compradas hoje

  init() {
    document.getElementById('btn-back-shop').onclick = () => App.goTo('menu');
  },

  show() {
    this._extraCount = 0;
    this._render();
  },

  _render() {
    const data = Progression.data;
    document.getElementById('shop-coins').textContent = data.coins;
    document.getElementById('shop-gems').textContent = data.gems || 0;

    // Grade de itens
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = Progression.SHOP_ITEMS.map(item => {
      const owned  = data.items[item.id] || 0;
      const canBuy = data.coins >= item.price;
      return `
        <div class="shop-item">
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
          <div class="shop-item-owned">Tens: ${owned}</div>
          <button class="shop-buy-btn" data-id="${item.id}" ${canBuy ? '' : 'disabled'}>💰 ${item.price}</button>
        </div>
      `;
    }).join('');
    grid.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.onclick = () => { if (Progression.buyItem(btn.dataset.id)) this._render(); };
    });

    // Secção Gota Primordial
    this._renderPrimordial();
  },

  _renderPrimordial() {
    const el = document.getElementById('shop-primordial');
    const freeAvailable = Progression.canClaimFreePrimordial();
    const extraPrice = Progression.primordialExtraPrice(this._extraCount);
    const canBuyExtra = (Progression.data.gems || 0) >= extraPrice;

    el.innerHTML = `
      <div class="shop-primordial-title">💧 Gota Primordial</div>
      <div class="shop-primordial-btns">
        <button class="shop-gota-btn ${freeAvailable ? 'gota-free' : 'gota-done'}" id="btn-gota-free" ${freeAvailable ? '' : 'disabled'}>
          ${freeAvailable ? '🎁 Grátis (1x/dia)' : '✅ Já usaste hoje'}
        </button>
        <button class="shop-gota-btn gota-gems" id="btn-gota-extra" ${canBuyExtra ? '' : 'disabled'}>
          💎 ${extraPrice} — Gota Extra
        </button>
      </div>
    `;

    document.getElementById('btn-gota-free').onclick = () => {
      if (!Progression.canClaimFreePrimordial()) return;
      Progression.claimFreePrimordial();
      PrimordialScene.show(5, 'shop');
      this._render();
    };

    document.getElementById('btn-gota-extra').onclick = () => {
      const price = Progression.primordialExtraPrice(this._extraCount);
      if (!Progression.spendGems(price)) return;
      this._extraCount++;
      PrimordialScene.show(5, 'shop');
      this._render();
    };
  },
};

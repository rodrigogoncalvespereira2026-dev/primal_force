// ── LOJA ──────────────────────────────────────────────────────────────
const ShopScene = {
  init() {
    document.getElementById('btn-back-shop').onclick = () => App.goTo('menu');
  },

  show() {
    this._render();
  },

  _render() {
    document.getElementById('shop-coins').textContent = Progression.data.coins;

    const grid = document.getElementById('shop-grid');
    grid.innerHTML = Progression.SHOP_ITEMS.map(item => {
      const owned  = Progression.data.items[item.id] || 0;
      const canBuy = Progression.data.coins >= item.price;
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
      btn.onclick = () => {
        const ok = Progression.buyItem(btn.dataset.id);
        if (ok) this._render();
      };
    });
  },
};

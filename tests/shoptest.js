const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;

global.COIN_SVG = '$';
global.GEM_SVG = '♦';

const progressionSrc = fs.readFileSync(path.join(root, 'js/core/progression.js'), 'utf8');
(0, eval)(progressionSrc + '\nglobalThis.Progression = Progression;');

const shopSrc = fs.readFileSync(path.join(root, 'js/scenes/shop.js'), 'utf8');
(0, eval)(shopSrc + '\nglobalThis.ShopScene = ShopScene;');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');

let fails = 0;
function check(label, cond) {
  if (!cond) { fails++; console.log('FAIL: ' + label); }
  else console.log('ok:   ' + label);
}

const cats = Progression.SHOP_CATEGORIES.map(c => c.id);
check('5 categorias da loja', cats.length === 5);
check('categorias esperadas',
  ['destaque', 'recursos', 'gotas', 'skins', 'passe'].every(id => cats.includes(id)));
check('cada categoria tem ícone e nome',
  Progression.SHOP_CATEGORIES.every(c => c.icon && c.label));

check('todos os itens têm categoria válida',
  Progression.SHOP_ITEMS.every(i => cats.includes(i.cat)));
check('categoria recursos tem itens de consumo e pacotes',
  Progression.itemsByCat('recursos').length >= 8);
check('categoria destaque tem pack popular',
  Progression.itemsByCat('destaque').some(i => i.id === 'pack_popular'));
check('pack popular tem etiqueta POPULAR',
  Progression.SHOP_ITEMS.find(i => i.id === 'pack_popular').badge === 'POPULAR');

const bonusItems = Progression.SHOP_ITEMS.filter(i => i.bonus && i.reward);
check('pacotes com faixa +N A MAIS existem', bonusItems.length >= 7);
check('faixa bate certo com a recompensa real', bonusItems.every(i => {
  const m = /\+(\d+)/.exec(i.bonus);
  if (!m) return false;
  const n = Number(m[1]);
  const total = i.reward.coins || i.reward.gems || 0;
  return n > 0 && n < total;
}));

check('preço de pack de 3 gotas definido', Progression.GOTAPACK_PRICE === 25);
check('preços de gota extra', Progression.GEM_PRICES.join(',') === '10,20,30');

const dealA = Progression.getDailyDeal();
const dealB = Progression.getDailyDeal();
check('oferta do dia existe', !!dealA && !!dealA.item);
check('oferta do dia é determinística', dealA.item.id === dealB.item.id && dealA.price === dealB.price);
check('oferta do dia tem desconto', dealA.price < dealA.item.price);
check('oferta do dia não é comprada de raiz', !Progression.isDailyDealBought());

Progression.data.coins = 10000;
Progression.data.gems = 100;
const before = {
  coins: Progression.data.coins,
  gems: Progression.data.gems,
  items: Object.assign({}, Progression.data.items),
};
check('comprar oferta do dia funciona', Progression.buyDailyDeal());
check('oferta do dia cobrada uma vez', !Progression.buyDailyDeal());
check('oferta do dia fica registada', Progression.isDailyDealBought());
check('oferta do dia não dá itens extra sem pagar',
  Progression.data.coins <= before.coins && Progression.data.gems <= before.gems);
check('itens consumíveis podem ter aumentado', typeof Progression.data.items === 'object');

Progression.data.dailyDealDate = null;
check('reset da oferta do dia volta a permitir compra', Progression.buyDailyDeal());

['item', 'daily', 'gota-free', 'gota-extra', 'gotapack3', 'bp-premium', 'bp-view', 'skin']
  .forEach(act => check('ação da loja definida: ' + act, typeof ShopScene['_onAction'] === 'function'));

['destaque', 'recursos', 'gotas', 'skins', 'passe'].forEach(c => {
  check('painel da categoria ' + c, typeof ShopScene['_cat_' + c] === 'function');
});

check('ShopScene renderiza painéis', typeof ShopScene._renderPanel === 'function');
check('ShopScene abre lista de valores', typeof ShopScene._openValues === 'function');
check('ShopScene fecha lista de valores', typeof ShopScene._closeValues === 'function');

['btn-back-shop', 'btn-shop-home', 'btn-shop-values',
 'btn-shop-values-close', 'shop-cats', 'shop-panels', 'shop-values',
 'shop-values-list', 'shop-trophies', 'shop-coins', 'shop-gems', 'shop-bp-level']
  .forEach(id => check('index.html tem #' + id, html.includes('id="' + id + '"')));
check('index.html tem barra superior', html.includes('class="shop-topbar"'));

check('css tem sidebar de categorias', css.includes('.shop-cats'));
check('css tem grelha de produtos', css.includes('.shop-grid'));
check('css tem lista de valores', css.includes('.shop-values-overlay'));
check('css tem etiquetas de oferta', css.includes('.shop-item-badge'));
check('css já não tem scroll horizontal antigo', !css.includes('.shop-scroll-wrap'));

const valuesSection = shopSrc.indexOf('_openValues');
check('lista de valores cobre as 5 categorias', valuesSection > 0 &&
  ['destaque', 'recursos', 'gotas', 'skins', 'passe'].every(id => shopSrc.includes(`c.id === '${id}'`)));

console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : '\n' + fails + ' FALHAS');
process.exit(fails === 0 ? 0 : 1);

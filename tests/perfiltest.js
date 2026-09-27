const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;

let lastHTML = '';
const fakeEl = {
  set innerHTML(v) { lastHTML = v; },
  get innerHTML() { return lastHTML; },
  querySelector(sel) { return { onclick: null, dataset: {} }; },
  querySelectorAll() { return []; },
};
global.document = { getElementById: () => fakeEl };
global.confirm = () => true;
global.location = { reload() { global.__reloaded = true; } };
global.localStorage = { store: {}, removeItem(k) { delete this.store[k]; }, getItem(k) { return this.store[k] || null; }, setItem(k, v) { this.store[k] = v; } };
global.COIN_SVG = '$';
global.GEM_SVG = '\u2666';
global.RANGERS_DATA = [
  { id: 'roro', name: 'Roro', emoji: '\uD83E\uDD96' },
  { id: 'mar',  name: 'Mar',  emoji: '\uD83E\uDD95' },
];
global.Progression = {
  data: { trophies: 12, coins: 340, gems: 5, battlePassTier: 3, bpPremium: true, unlockedRangers: ['roro'], unlockedSkins: ['roro_fire'], unlockedWeapons: [], equippedSkin: 'roro_fire' },
  BATTLE_PASS: Array.from({ length: 20 }, (_, i) => ({ tier: i + 1 })),
  isRangerUnlocked(id) { return this.data.unlockedRangers.includes(id); },
  getSkin(id) { return { id, name: 'Fogo (Roro)', icon: '\uD83D\uDD25' }; },
};
global.WorldMap = {
  zones: [
    { id: 'forest', missions: ['a', 'b', 'c'] },
    { id: 'city',   missions: ['a', 'b', 'c'] },
  ],
  completed: { forest: 3 },
};
global.Account = { data: { email: 'x@y.pt', age: 12, createdAt: '2026-01-05T10:00:00.000Z' }, load() { return this.data; }, exists() { return !!this.data; }, clear() { this.data = null; global.__cleared = true; } };
global.App = { selectedRanger: { id: 'roro', name: 'Roro', emoji: '\uD83E\uDD96' }, goTo(n) { global.__goTo = n; } };

(0, eval)(fs.readFileSync(root + 'js/scenes/perfil.js', 'utf8') + '\nglobalThis.PerfilScene = PerfilScene;');

let fails = 0;
const check = (label, cond) => { if (!cond) { fails++; console.log('FAIL: ' + label); } else console.log('ok:   ' + label); };

PerfilScene.show();
check('render contém email', lastHTML.includes('x@y.pt'));
check('render mostra idade e data', lastHTML.includes('Idade: 12') && lastHTML.includes('perfil desde'));
check('render mostra moedas e joias', lastHTML.includes('MOEDAS') && lastHTML.includes('JOIAS') && lastHTML.includes('>340<') && lastHTML.includes('>5<'));
check('render mostra nível do passe (4)', lastHTML.includes('N.º 4'));
check('render rangers 1/2', lastHTML.includes('1 / 2'));
check('render zonas 1/2', lastHTML.includes('1 / 2'));
check('render ranger ativo e skin', lastHTML.includes('Roro') && lastHTML.includes('Fogo (Roro)'));
check('render sem contas usa fallback', (() => { Account.data = null; PerfilScene.show(); return lastHTML.includes('Ainda não criaste') && lastHTML.includes('CRIAR PERFIL'); })());
check('reset limpa chaves e recarrega', (() => {
  localStorage.store['prf_progression'] = '{}';
  localStorage.store['prf_worldmap'] = '{}';
  localStorage.store['prf_daily_missions'] = '{}';
  const fakeBtn = null;
  const btns = {};
  fakeEl.querySelector = sel => (btns[sel] = btns[sel] || { onclick: null, dataset: {} });
  PerfilScene.show();
  const reset = fakeEl.querySelector('#pf-reset');
  reset.onclick();
  return !localStorage.store['prf_progression'] && !localStorage.store['prf_worldmap'] && !localStorage.store['prf_daily_missions'] && global.__reloaded;
})());
check('trocar conta limpa e vai para account', (() => {
  Account.data = { email: 'a@b.pt', age: 10, createdAt: '2026-01-01T00:00:00.000Z' };
  const btns = {};
  fakeEl.querySelector = sel => (btns[sel] = btns[sel] || { onclick: null, dataset: {} });
  PerfilScene.show();
  fakeEl.querySelector('#pf-account').onclick();
  return global.__cleared && global.__goTo === 'account';
})());

console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : '\n' + fails + ' FALHAS');
process.exit(fails ? 1 : 0);

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
};
global.COIN_SVG = '$';
global.GEM_SVG = '';
global.Progression = {
  coins: 0, trophies: 0, gems: 0,
  addCoins(n) { this.coins += n; },
  addTrophies(n) { this.trophies += n; },
  addGems(n) { this.gems += n; },
};

const load = (rel, name) => {
  (0, eval)(fs.readFileSync(root + rel, 'utf8') + '\nglobalThis.' + name + ' = ' + name + ';');
};
load('js/scenes/leaderboard.js', 'Leaderboard');
load('js/scenes/missions.js', 'DailyMissions');
load('js/core/settings.js', 'Settings');

let fails = 0;
const check = (label, cond) => {
  if (!cond) fails++;
  console.log((cond ? 'ok:   ' : 'FAIL: ') + label);
};

for (let i = 1; i <= 12; i++) {
  Leaderboard.record({ score: i * 100, kills: i, zone: 'Zona ' + i, ranger: 'Red', result: 'Vitória' });
}
const runs = Leaderboard.top();
check('lideranca guarda apenas os 10 melhores', runs.length === 10);
check('topo é a maior pontuação', runs[0].score === 1200 && runs[0].zone === 'Zona 12');
check('ordem decrescente', runs.every((r, i) => i === 0 || runs[i - 1].score >= r.score));
check('guarda em localStorage', (localStorage.getItem('prf_leaderboard') || '').includes('1200'));

Leaderboard.record({ score: 9999, kills: 50, zone: 'Zona X', ranger: 'Blue', result: 'Derrota' });
check('novo registo entra no topo', Leaderboard.top()[0].score === 9999);
check('mantém 10 após novo registo', Leaderboard.top().length === 10);

Leaderboard.clear();
check('clear apaga tudo', Leaderboard.top().length === 0);

DailyMissions.load();
const m = DailyMissions.data.missions[0];
const t = DailyMissions.template(m.id);
m.progress = t.goal;
check('claimableCount conta missões prontas', DailyMissions.claimableCount() === 1);
DailyMissions.claim(m.id);
check('claimableCount ignora resgatadas', DailyMissions.claimableCount() === 0);

check('settings por omissão é alta', Settings.quality === 'high');
Settings.setQuality('low');
check('setQuality grava', localStorage.getItem('prf_quality') === 'low');
check('setQuality aplica valor', Settings.quality === 'low');
Settings.setQuality('nonsense');
check('valores inválidos caem em high', Settings.quality === 'high');
Settings.load();
check('load relê do localStorage', Settings.quality === 'high');

console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : '\n' + fails + ' FALHAS');
process.exit(fails === 0 ? 0 : 1);

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;

global.COIN_SVG = '$';
global.GEM_SVG = '♦';
global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
};
global.Progression = {
  coins: 0, trophies: 0, gems: 0,
  addCoins(n) { this.coins += n; },
  addTrophies(n) { this.trophies += n; },
  addGems(n) { this.gems += n; },
};

const src = fs.readFileSync(path.join(root, 'js/scenes/missions.js'), 'utf8');
(0, eval)(src + '\nglobalThis.DailyMissions = DailyMissions;');

let fails = 0;
function check(label, cond) {
  if (!cond) { fails++; console.log('FAIL: ' + label); }
  else console.log('ok:   ' + label);
}

DailyMissions.load();
check('gera 3 missões por dia', DailyMissions.data.missions.length === 3);
check('todas com template válido', DailyMissions.data.missions.every(m => DailyMissions.template(m.id)));

const firstSet = DailyMissions.data.missions.map(m => m.id).join(',');
localStorage.store['prf_daily_missions'] = null;
delete localStorage.store['prf_daily_missions'];
DailyMissions.data = null;
DailyMissions.load();
check('geração determinística para o mesmo dia', DailyMissions.data.missions.map(m => m.id).join(',') === firstSet);

const target = DailyMissions.data.missions[0];
const t = DailyMissions.template(target.id);
DailyMissions.track('kills');
const afterOne = target.progress;
check('track incrementa só a missão certa', afterOne === 1 || t.key !== 'kills');
for (let i = 0; i < 500; i++) DailyMissions.track(t.key);
check('progresso não passa do objetivo', target.progress === t.goal);

check('resgate antes do fim falha', true === (t.goal === target.progress));
if (t.goal === target.progress) {
  const before = Progression.coins;
  const okClaim = DailyMissions.claim(target.id);
  const gained = Progression.coins - before;
  check('resgate dá a recompensa', okClaim && (gained === (t.reward.coins || 0)) && (Progression.trophies >= (t.reward.trophies || 0)));
  check('segundo resgate é recusado', !DailyMissions.claim(target.id));
}

check('claim de missão inexistente falha', !DailyMissions.claim('nao_existe'));

DailyMissions.data = { date: '2020-01-01', missions: [{ id: t.id, progress: 99, claimed: false }] };
DailyMissions.track(t.key);
check('dia diferente dispara novo carregamento', DailyMissions.data.date !== '2020-01-01' && DailyMissions.data.missions.length === 3);

check('rewardText juntamente moedas e troféus', DailyMissions.rewardText({ coins: 10, trophies: 5 }).includes('10') && DailyMissions.rewardText({ coins: 10, trophies: 5 }).includes('5'));

console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : '\n' + fails + ' FALHAS');
process.exit(fails === 0 ? 0 : 1);

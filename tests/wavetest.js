const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;

global.Utils = { randInt: (a, b) => a, dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y) };
global.Enemy = function (t) { this.type = t; this.dead = false; };
global.GameScene = { enemies: [] };

function load(rel) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  (0, eval)(src + '\n;globalThis.__last = ' + src.match(/const\s+(\w+)\s*=/) ? '' : '');
}

function loadConst(rel, name) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  (0, eval)(src + '\nglobalThis.' + name + ' = ' + name + ';');
}

loadConst('js/core/wave.js', 'WaveSystem');
loadConst('js/entities/boss.js', 'BOSS_TYPES');
(function () {
  const src = fs.readFileSync(path.join(root, 'js/entities/boss.js'), 'utf8');
  (0, eval(src + '\nglobalThis.bossForZone = bossForZone; globalThis.pickRandomBoss = pickRandomBoss;'));
})();

let fails = 0;
function check(label, cond) {
  if (!cond) { fails++; console.log('FAIL: ' + label); }
  else console.log('ok:   ' + label);
}

// ── 1. Missão intermédia (sem boss) completa depois das ondas ──
function makeGame(bossKey) {
  return {
    enemies: [],
    spawned: null,
    completed: 0,
    waves: [],
    showMsg() {},
    onWaveComplete(w) { this.waves.push(w); },
    _bossKeyForMission() { return bossKey; },
    _spawnBoss(k) { this.spawned = k; },
    _completeMission() { this.completed++; },
  };
}

WaveSystem.maxWaves = 3;
WaveSystem.isFinalMission = false;
WaveSystem.reset();
WaveSystem.startWave(1);
let g = makeGame('maltherion');
for (let step = 0; step < 40 && g.completed === 0 && g.spawned === null; step++) {
  if (WaveSystem.betweenWaves) { WaveSystem.betweenTimer = 0; WaveSystem.update(16, g); continue; }
  WaveSystem.enemiesSpawned = WaveSystem.enemiesPerWave;
  g.enemies = [];
  WaveSystem.update(16, g);
}
check('missão intermédia termina sem boss', g.completed === 1 && g.spawned === null);
check('ondas 1 e 2 premiadas', g.waves.join(',') === '1,2');

// ── 2. Missão final dá spawn do boss da zona ──
WaveSystem.maxWaves = 3;
WaveSystem.isFinalMission = true;
WaveSystem.reset();
WaveSystem.startWave(1);
g = makeGame('valtherion');
for (let step = 0; step < 40 && g.spawned === null; step++) {
  if (WaveSystem.betweenWaves) { WaveSystem.betweenTimer = 0; WaveSystem.update(16, g); continue; }
  WaveSystem.enemiesSpawned = WaveSystem.enemiesPerWave;
  g.enemies = [];
  WaveSystem.update(16, g);
}
check('missão final spawna o boss certo', g.spawned === 'valtherion' && g.completed === 0);

// ── 3. Durante o boss não há mais ondas nem fim de missão ──
const spawnedBefore = WaveSystem.enemiesSpawned;
WaveSystem.update(16, g);
WaveSystem.update(16, g);
check('boss bloqueia sistema de ondas', WaveSystem.enemiesSpawned === spawnedBefore && g.completed === 0 && g.spawned === 'valtherion');

// ── 4. Zona sem boss (base) → missão final sem boss ──
check('base não tem boss', bossForZone({ id: 'base', boss: null }) === null);
check('vulcão = valtherion', bossForZone({ id: 'volcano' }) === 'valtherion');
check('boss por omissão está no pool', BOSS_TYPES[bossForZone({ id: 'desert' })] !== undefined);
check('zona nula → boss aleatório do pool', ['maltherion', 'valtherion', 'vordax', 'arcano'].includes(bossForZone(null)));
check('todas as zonas da campanha têm boss válido', ['forest', 'city', 'enemy_base', 'volcano', 'ocean', 'desert', 'mountains'].every(z => BOSS_TYPES[bossForZone({ id: z })] !== undefined));

console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : '\n' + fails + ' FALHAS');
process.exit(fails === 0 ? 0 : 1);

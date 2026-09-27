const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;

global.COIN_SVG = '$';
global.GEM_SVG = '♦';

const coreSrc = fs.readFileSync(path.join(root, 'js/core/primordial.js'), 'utf8');
(0, eval)(coreSrc + '\nglobalThis.Primordial = Primordial;');

const sceneSrc = fs.readFileSync(path.join(root, 'js/scenes/primordial.js'), 'utf8');
(0, eval)(sceneSrc + '\nglobalThis.GotaScene = GotaScene;');

const progressionSrc = fs.readFileSync(path.join(root, 'js/core/progression.js'), 'utf8');
(0, eval)(progressionSrc + '\nglobalThis.Progression = Progression;');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const gameSrc = fs.readFileSync(path.join(root, 'js/scenes/game.js'), 'utf8');
const shopSrc = fs.readFileSync(path.join(root, 'js/scenes/shop.js'), 'utf8');

let fails = 0;
function check(label, cond) {
  if (!cond) { fails++; console.log('FAIL: ' + label); }
  else console.log('ok:   ' + label);
}

check('7 tiers de raridade', Primordial.TIERS.length === 7);
check('tiers com nome, cor e sprite', Primordial.TIERS.every(t => t.name && t.color && t.sprite));
check('carga de 5 toques', Primordial.CHARGE_MAX === 5);
check('30% de chance de subir', Primordial.UPGRADE_CHANCE === 0.30);
check('bónus de gota paga é +5%', Primordial.UPGRADE_BONUS === 0.05);
check('ronda de 12s + 2.5s por upgrade', Primordial.ROUND_MS === 12000 && Primordial.UPGRADE_MS === 2500);

const modes = ['defeat', 'victory', 'boss', 'shop'];
check('4 modos com pesos', modes.every(m => Array.isArray(Primordial.WEIGHTS[m]) && Primordial.WEIGHTS[m].length === 7));
check('derrota só dá Comum/Raro', Primordial.WEIGHTS.defeat[0] === 55 && Primordial.WEIGHTS.defeat[1] === 45 && Primordial.WEIGHTS.defeat.slice(2).every(w => w === 0));
check('vitória nunca dá Comum nem PRIMAL', Primordial.WEIGHTS.victory[0] === 0 && Primordial.WEIGHTS.victory[6] === 0);
check('boss dá PRIMAL 7%', Primordial.WEIGHTS.boss[6] === 7);
check('loja dá PRIMAL 8%', Primordial.WEIGHTS.shop[6] === 8);

check('rnd mínimo escolhe o 1º peso', Primordial.pickWeighted([0, 45, 55], () => 0) === 1);
check('rnd máximo escolhe o último peso', Primordial.pickWeighted([45, 55], () => 0.999999) === 1);
check('modo desconhecido cai na loja', Primordial.weightsFor('nope') === Primordial.WEIGHTS.shop);

let inRange = true, seenR = false, seenSR = false;
for (let i = 0; i < 20000; i++) {
  const idx = Primordial.pickWeighted(Primordial.WEIGHTS.defeat);
  if (idx !== 0 && idx !== 1) inRange = false;
  if (idx === 0) seenR = true;
  if (idx === 1) seenSR = true;
}
check('derrota sorteia só Comum/Raro', inRange);
check('derrota chega a Comum e a Raro', seenR && seenSR);

let vMin = 99, vMax = -1, vIllegal = false;
for (let i = 0; i < 20000; i++) {
  const idx = Primordial.pickWeighted(Primordial.WEIGHTS.victory);
  if (idx === 0 || idx === 6) vIllegal = true;
  vMin = Math.min(vMin, idx);
  vMax = Math.max(vMax, idx);
}
check('vitória nunca dá Comum/PRIMAL no sorteador', !vIllegal);
check('vitória cobre Raro a Lendário', vMin === 1 && vMax === 5);

let bossMax = -1;
for (let i = 0; i < 20000; i++) bossMax = Math.max(bossMax, Primordial.pickWeighted(Primordial.WEIGHTS.boss));
check('boss chega ao PRIMAL', bossMax === 6);

const st = Primordial.start('victory', { now: 1000 });
check('start ativa a ronda', Primordial.state.active === true);
check('start regista o modo', Primordial.state.mode === 'victory');
check('tier inicial é o sorteado', st === Primordial.state.tierIdx && st === Primordial.state.winner);
check('carga começa a zero', Primordial.state.charge === 0);
check('cronómetro começa em 12s', Primordial.tick(1000) === 12000);
check('tick desce com o tempo', Primordial.tick(6000) === 7000);
check('sem tempo esgota', Primordial.timedOut(13001));

Primordial.start('victory', { now: 0, tierIdx: 0 });
check('1º toque conta', Primordial.tap(1000) === 'tap' && Primordial.state.charge === 1);
check('toque rápido é anti-cheat', Primordial.tap(1010) === false && Primordial.state.taps === 1);
check('2º toque legítimo conta', Primordial.tap(1100) === 'tap' && Primordial.state.charge === 2);

const realRandom = Math.random;
Math.random = () => 0;
Primordial.start('victory', { now: 0, tierIdx: 2 });
const beforeTier = Primordial.state.tierIdx;
const beforeEnd = Primordial.state.endsAt;
let ups = 0;
for (let i = 0; i < Primordial.CHARGE_MAX; i++) {
  if (Primordial.tap(1000 + i * 100) === 'upgrade') ups++;
}
check('carga cheia roda para subir', ups === 1);
check('upgrade sobe 1 tier', Primordial.state.tierIdx === beforeTier + 1);
check('upgrade dá +2.5s', Primordial.state.endsAt === beforeEnd + Primordial.UPGRADE_MS);
check('carga reinicia após a roleta', Primordial.state.charge === 0);

Math.random = () => 0.99;
Primordial.start('victory', { now: 0, tierIdx: 2 });
let fulls = 0, tapsDone = 0;
for (let i = 0; i < Primordial.CHARGE_MAX; i++) {
  const r = Primordial.tap(1000 + i * 100);
  tapsDone++;
  if (r === 'full') fulls++;
}
check('carga cheia sem sorte falha', fulls === 1);
check('tier não desce nem sobre sem sorte', Primordial.state.tierIdx === 2);
check('contagem de toques mantém', Primordial.state.taps === tapsDone);

Math.random = () => 0.32;
Primordial.start('victory', { now: 0, tierIdx: 2, upgradeBonus: 0 });
for (let i = 0; i < Primordial.CHARGE_MAX; i++) Primordial.tap(1000 + i * 100);
check('sem bónus, 32% não sobe', Primordial.state.tierIdx === 2);

Math.random = () => 0.32;
Primordial.start('victory', { now: 0, tierIdx: 2, upgradeBonus: Primordial.UPGRADE_BONUS });
for (let i = 0; i < Primordial.CHARGE_MAX; i++) Primordial.tap(1000 + i * 100);
check('com bónus de +5%, 32% sobe', Primordial.state.tierIdx === 3);
Math.random = realRandom;

Primordial.start('victory', { now: 0, tierIdx: 6 });
for (let i = 0; i < Primordial.CHARGE_MAX; i++) Primordial.tap(1000 + i * 100);
check('PRIMAL é o teto', Primordial.state.tierIdx === 6);

Primordial.start('victory', { now: 0, tierIdx: 0 });
const coinsBefore = Progression.data.coins;
const rew = Primordial.claim();
check('claim devolve recompensas', Array.isArray(rew) && rew.length > 0);
check('claim dá moedas do tier', Progression.data.coins > coinsBefore);
check('claim fecha a ronda', Primordial.state.active === false);
check('segundo claim é nulo', Primordial.claim() === null);

Primordial.start('victory', { now: 0, tierIdx: 1 });
const rewRare = Primordial.claim();
check('tier Raro dá troféus', rewRare.some(r => r.type === 'trophies'));

Primordial.start('victory', { now: 0, tierIdx: 6 });
const rewPrimal = Primordial.claim();
check('tier PRIMAL dá a aura', rewPrimal.some(r => r.type === 'aura'));

check('derrota tem 15% e modo defeat', (() => { const d = Primordial.canDrop({ victory:false }); return d.chance === 0.15 && d.mode === 'defeat'; })());
check('vitória comum tem 40%', (() => { const d = Primordial.canDrop({ victory:true, isBoss:false }); return d.chance === 0.4 && d.mode === 'victory'; })());
check('boss tem 100%', (() => { const d = Primordial.canDrop({ victory:true, isBoss:true }); return d.chance === 1 && d.mode === 'boss'; })());

check('rewardText de moedas', Primordial.rewardText({ type:'coins', amount:10 }).includes('10'));
check('rewardText de troféus', Primordial.rewardText({ type:'trophies', amount:3 }).includes('3'));
check('rewardText de item', Primordial.rewardText({ type:'item', id:'potion', name:'Poção', icon:'🧪' }).includes('Poção'));

check('cena expõe show', typeof GotaScene.show === 'function');
check('cena expõe rewards', 'rewards' in GotaScene);
check('cena tem reveal', typeof GotaScene._renderRewards === 'function');
check('cena fecha com _close', typeof GotaScene._close === 'function');
check('cena usa pointerdown único', (sceneSrc.match(/pointerdown/g) || []).length === 1 && !sceneSrc.includes('touchstart'));
check('cena não usa _gotaRewards global', !sceneSrc.includes('_gotaRewards'));

check('game usa o modo da roleta', gameSrc.includes('Primordial.start(drop.mode)'));
check('game lê GotaScene.rewards', gameSrc.includes('GotaScene.rewards'));
check('loja usa modo shop', shopSrc.includes("Primordial.start('shop'"));
check('loja dá +5% em gotas pagas', shopSrc.includes('upgradeBonus'));

['gota-top', 'gota-tier-name', 'gota-timer-fill', 'gota-timer-label', 'gota-meter',
 'gota-actions', 'gota-collect', 'gota-exit', 'gota-rewards', 'gota-canvas']
  .forEach(id => check('index.html tem #' + id, html.includes('id="' + id + '"')));
check('index.html já não tem contador antigo', !html.includes('gota-tap-counter') && !html.includes('gota-canvas-wrap'));

check('css tem pips da carga', css.includes('.gota-pip'));
check('css tem botão recolher', css.includes('.gota-collect'));
check('css tem cartões do reveal', css.includes('.gota-card') && css.includes('.gota-reveal-ok'));
check('css tem barra de tempo', css.includes('.gota-timer-fill'));

const audioSrc = fs.readFileSync(path.join(root, 'js/core/audio.js'), 'utf8');
['gotaTap', 'gotaBurst', 'gotaUpgrade', 'gotaClaim', 'gotaMiss']
  .forEach(n => check('audio tem som ' + n, audioSrc.includes("case '" + n + "'")));

console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : '\n' + fails + ' FALHAS');
process.exit(fails === 0 ? 0 : 1);

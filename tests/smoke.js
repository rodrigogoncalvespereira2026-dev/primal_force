const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;
const h = fs.readFileSync(root + 'index.html', 'utf8');
let fails = 0;
const check = (label, ok) => {
  if (!ok) fails++;
  console.log((ok ? 'ok   ' : 'MISS ') + label);
};

['screen-menu', 'screen-missoes', 'missions-content', 'screen-perfil', 'perfil-content',
 'btn-back-perfil', 'btn-back-account', 'screen-account',
 'screen-config', 'config-content', 'btn-back-config',
 'screen-lideranca', 'lideranca-content', 'btn-back-lideranca',
 'badge-missoes', 'js/scenes/config.js', 'js/scenes/leaderboard.js', 'js/core/settings.js'
].forEach(id => check('index.html: ' + id, h.includes(id)));

const main = fs.readFileSync(root + 'js/main.js', 'utf8');
check("main.js: screen config", main.includes("config:      'screen-config'"));
check("main.js: screen leaderboard", main.includes("leaderboard: 'screen-lideranca'"));
check('main.js: hook config', main.includes("name === 'config'"));
check('main.js: hook leaderboard', main.includes("name === 'leaderboard'"));
check('main.js: init ConfigScene', main.includes('ConfigScene.init()'));
check('main.js: init LeaderboardScene', main.includes('LeaderboardScene.init()'));
check('main.js: badge no menu', main.includes('MissionsScene.updateBadge()'));
check('main.js: musica no menu', main.includes("AudioFX.playMusic('menu')"));
check('main.js: musica em jogo', main.includes("AudioFX.playMusic('battle')"));
check('main.js: Settings.load', main.includes('Settings.load()'));

const menu = fs.readFileSync(root + 'js/scenes/menu.js', 'utf8');
check("menu.js: rota config", menu.includes("App.goTo('config')"));
check("menu.js: rota lideranca", menu.includes("App.goTo('leaderboard')"));
check("menu.js: btn-perfil", menu.includes("btn-perfil').onclick  = () => App.goTo('perfil')"));

const miss = fs.readFileSync(root + 'js/scenes/missions.js', 'utf8');
check('missions.js: claimableCount', miss.includes('claimableCount()'));
check('missions.js: updateBadge', miss.includes('updateBadge()'));

const audio = fs.readFileSync(root + 'js/core/audio.js', 'utf8');
check('audio.js: setVolume', audio.includes('setVolume(v)'));
check('audio.js: setMusicEnabled', audio.includes('setMusicEnabled(on)'));
check('audio.js: playMusic', audio.includes('playMusic(track)'));
check('audio.js: MUSIC', audio.includes('MUSIC:'));

const cfg = fs.readFileSync(root + 'js/scenes/config.js', 'utf8');
check('config.js: slider de volume', cfg.includes('cfg-volume'));
check('config.js: qualidade', cfg.includes('Settings.setQuality'));

const lb = fs.readFileSync(root + 'js/scenes/leaderboard.js', 'utf8');
check('leaderboard.js: record', lb.includes('record(run)'));
check('leaderboard.js: cenas', lb.includes('LeaderboardScene'));

const game = fs.readFileSync(root + 'js/scenes/game.js', 'utf8');
check('game.js: regista na lideranca', game.includes('Leaderboard.record('));
check('game.js: aplica qualidade', game.includes('Settings.apply()'));

const sw = fs.readFileSync(root + 'service-worker.js', 'utf8');
check('service-worker: precache', ['settings.js', 'config.js', 'leaderboard.js', 'perfil.js', 'missions.js'].every(s => sw.includes(s)));

const css = fs.readFileSync(root + 'css/style.css', 'utf8');
check('style.css: .menu-badge', css.includes('.menu-badge'));
check('style.css: ecran config', css.includes('#screen-config'));
check('style.css: ecran lideranca', css.includes('#screen-lideranca'));

console.log(fails === 0 ? '\nSMOKE OK' : '\n' + fails + ' FALHAS');
process.exit(fails ? 1 : 0);

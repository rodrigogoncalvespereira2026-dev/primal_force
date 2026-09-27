const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;

global.COIN_SVG = '$';
global.GEM_SVG = '♦';

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const menuSrc = fs.readFileSync(path.join(root, 'js/scenes/menu.js'), 'utf8');
const mainSrc = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const swSrc = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
const progressionSrc = fs.readFileSync(path.join(root, 'js/core/progression.js'), 'utf8');

let fails = 0;
function check(label, cond) {
  if (!cond) { fails++; console.log('FAIL: ' + label); }
  else console.log('ok:   ' + label);
}

function makeElement() {
  const classes = new Set();
  return {
    textContent: '',
    value: '',
    disabled: false,
    onclick: null,
    onsubmit: null,
    classList: {
      toggle(name, force) {
        const on = force === undefined ? !classes.has(name) : !!force;
        if (on) classes.add(name); else classes.delete(name);
        return on;
      },
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
    setAttribute() {},
    getAttribute() { return null; },
    querySelector() { return makeElement(); },
  };
}

const elements = {};
global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = makeElement();
    return elements[id];
  },
  querySelector() { return makeElement(); },
  addEventListener() {},
  visibilityState: 'visible',
};
global.localStorage = {
  _data: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
};

const sdkSrc = fs.readFileSync(path.join(root, 'js/core/surgeid.js'), 'utf8');
(0, eval)(sdkSrc);

check('SDK define SurgeID', typeof globalThis.SurgeID === 'object');
check('SDK aponta para a API da Surge ID', SurgeID.API_BASE.indexOf('surge-id') > 0);
check('SDK usa o slug do jogo', SurgeID.GAME_SLUG === 'primal_force');
check('SDK sem sessão no arranque', SurgeID.isSignedIn() === false);

function jsonResponse(status, data) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

const fetchLog = [];
global.fetch = async (url, options) => {
  fetchLog.push({ url, method: (options && options.method) || 'GET' });
  if (options && options.method === 'PUT') {
    return jsonResponse(200, { game: 'primal_force', progress: { moedas: 50 } });
  }
  return jsonResponse(200, { game: 'primal_force', progress: { moedas: 50, trofeus: 7 } });
};

const sceneSrc = fs.readFileSync(path.join(root, 'js/scenes/surgeid.js'), 'utf8');
(0, eval)(sceneSrc + '\nglobalThis.SurgeIDScene = SurgeIDScene;');
const progressionSrcEval = progressionSrc + '\nglobalThis.Progression = Progression;';
(0, eval)(progressionSrcEval);

check('cena existe', typeof SurgeIDScene === 'object');
check('progressão tem saveLocal', typeof Progression.saveLocal === 'function');
check('progressão tem queueCloudSync', typeof Progression.queueCloudSync === 'function');

SurgeIDScene.init();
check('init liga o botão voltar', typeof document.getElementById('btn-back-surgeid').onclick === 'function');
check('init liga o formulário', typeof document.getElementById('surgeid-form').onsubmit === 'function');
check('init liga sincronizar', typeof document.getElementById('surgeid-sync').onclick === 'function');
check('init liga carregar da nuvem', typeof document.getElementById('surgeid-pull').onclick === 'function');

SurgeIDScene.show();
check('sem sessão mostra o formulário', document.getElementById('surgeid-signedout').classList.contains('surgeid-hidden') === false);
check('sem sessão esconde o painel da conta', document.getElementById('surgeid-signedin').classList.contains('surgeid-hidden') === true);

SurgeID._setSession({ token: 'tk-1', user: { id: 'u1', email: 'a@b.pt', surge_id: 'SG-XYZ123' } });
SurgeIDScene.render();
check('com sessão esconde o formulário', document.getElementById('surgeid-signedout').classList.contains('surgeid-hidden') === true);
check('com sessão mostra o painel da conta', document.getElementById('surgeid-signedin').classList.contains('surgeid-hidden') === false);
check('mostra o Surge ID', document.getElementById('surgeid-code').textContent === 'SG-XYZ123');
check('mostra o email', document.getElementById('surgeid-email-view').textContent === 'a@b.pt');
check('mostra troféus locais', document.getElementById('surgeid-trophies').textContent === Progression.data.trophies);

check('save grava no localStorage', (() => {
  localStorage.removeItem('prf_progression');
  Progression.data.coins = 1234;
  Progression.save();
  return JSON.parse(localStorage.getItem('prf_progression')).coins === 1234;
})());
check('save agenda sincronização quando há sessão', typeof Progression._cloudTimer !== 'undefined' && Progression._cloudTimer !== null);
clearTimeout(Progression._cloudTimer);

fetchLog.length = 0;
SurgeIDScene.syncNow();
setImmediate(() => {
  const pushed = fetchLog.some(c => c.method === 'PUT');
  check('sync envia o progresso local', pushed);
  check('sync grava a resposta local', JSON.parse(localStorage.getItem('prf_progression')).trofeus === 7);
  check('mensagem de sucesso', document.getElementById('surgeid-msg').textContent.indexOf('nuvem') >= 0);

  check('html tem o ecrã surgeid', html.includes('id="screen-surgeid"'));
  check('html tem o formulário', html.includes('id="surgeid-form"'));
  check('html tem botão guardar na nuvem', html.includes('id="surgeid-sync"'));
  check('html carrega o SDK', html.includes('js/core/surgeid.js?v=1'));
  check('html carrega a cena', html.includes('js/scenes/surgeid.js?v=1'));
  check('html subiu o css', html.includes('css/style.css?v=32'));

  check('menu abre o surgeid', menuSrc.includes("opcao === 'id'") && menuSrc.includes("App.goTo('surgeid')"));
  check('main regista o ecrã', mainSrc.includes("surgeid:     'screen-surgeid'"));
  check('main mostra a cena', mainSrc.includes("name === 'surgeid'"));
  check('main inicializa a cena', mainSrc.includes('SurgeIDScene.init()'));
  check('main arranca a sincronização', mainSrc.includes('_initSurgeSync()'));

  check('progressão liga save ao saveLocal', /save\(\)\s*\{[^}]*saveLocal\(\)/.test(progressionSrc));
  check('progressão agenda sync na nuvem', progressionSrc.includes('queueCloudSync()'));

  check('css tem o ecrã', css.includes('#screen-surgeid'));
  check('css tem o código do Surge ID', css.includes('.surgeid-code'));
  check('css tem os separadores', css.includes('.surgeid-tab.active'));

  check('service worker bump', swSrc.includes("primal-force-v10"));
  check('service worker guarda o SDK', swSrc.includes('./js/core/surgeid.js'));
  check('service worker guarda a cena', swSrc.includes('./js/scenes/surgeid.js'));

  console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : '\n' + fails + ' FALHAS');
  process.exit(fails === 0 ? 0 : 1);
});

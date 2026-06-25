const App = {
  selectedRanger: null,
  currentZone:    null,
  currentMission: 0,
  _current: null,

  screens: {
    menu:     'screen-menu',
    select:   'screen-select',
    worldmap: 'screen-worldmap',
    trophies: 'screen-trophies',
    shop:     'screen-shop',
    dialog:   'screen-dialog',
    game:     'screen-game',
    pause:    'screen-pause',
    gameover: 'screen-gameover',
  },

  goTo(name) {
    for (const id of Object.values(this.screens)) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    }
    const el = document.getElementById(this.screens[name]);
    if (el) el.classList.add('active');

    if (name === 'menu') {
      document.getElementById('menu-trophies').textContent = Progression.data.trophies;
      document.getElementById('menu-coins').textContent    = Progression.data.coins;
    }
    if (name === 'worldmap') WorldMap.show();
    if (name === 'trophies') TrophiesScene.show();
    if (name === 'shop') ShopScene.show();
    if (name === 'game') {
      GameScene.stop();
      const ranger = this.selectedRanger || RANGERS_DATA[0];
      setTimeout(() => GameScene.start(ranger), 0);
    }
    this._current = name;
  },

  vpToApp(vx, vy) {
    const app = document.getElementById('app');
    if (app && app.style.transform) {
      return { x: vy, y: window.innerWidth - vx };
    }
    return { x: vx, y: vy };
  },

  _forceLandscape() {
    const app = document.getElementById('app');
    const p = (top, left, h) => {
      h = h || 44;
      return { left: left, top: window.innerWidth - top };
    };
    const setPos = (el, top, left, h) => {
      if (!el) return;
      const pos = p(top, left, h);
      el.style.left = pos.left + 'px';
      el.style.top = pos.top + 'px';
      el.style.right = '';
      el.style.bottom = '';
      el.style.transform = 'none'; // CSS transforms interferem no espaço rodado
    };
    const clearPos = (el) => {
      if (!el) return;
      el.style.left = '';
      el.style.top = '';
      el.style.right = '';
      el.style.bottom = '';
      el.style.transform = ''; // restaurar CSS transform original
    };
    const applyRotate = () => {
      if (window.innerHeight > window.innerWidth) {
        app.style.width = window.innerHeight + 'px';
        app.style.height = window.innerWidth + 'px';
        app.style.transformOrigin = 'top left';
        app.style.transform = 'rotate(90deg) translate(0, -100vw)';
        document.body.classList.add('portrait');
        const vw = window.innerWidth, vh = window.innerHeight;
        // setPos(visualX, visualY): visualX = dist from visual LEFT, visualY = dist from visual TOP
        setPos(document.getElementById('btn-perfil'), 20, 70);
        setPos(document.getElementById('btn-trofeus'), 166, 70);
        setPos(document.getElementById('btn-opcoes'), vw - 64, 80);
        setPos(document.getElementById('btn-passe'), 20, vh - 68);
        setPos(document.getElementById('btn-missoes'), 166, vh - 68);
        const sl = document.querySelector('.menu-side-left');
        if (sl) setPos(sl, 20, vh / 2 - 74);
        const sr = document.querySelector('.menu-side-right');
        if (sr) setPos(sr, vw - 220, vh - 160);
        const tb = document.querySelector('.trophy-bar-menu');
        if (tb) { tb.style.left = '20px'; tb.style.top = (vw - 20) + 'px'; tb.style.transform = 'none'; }
      } else {
        app.style.width = '';
        app.style.height = '';
        app.style.transformOrigin = '';
        app.style.transform = '';
        document.body.classList.remove('portrait');
        clearPos(document.getElementById('btn-perfil'));
        clearPos(document.getElementById('btn-trofeus'));
        clearPos(document.getElementById('btn-opcoes'));
        clearPos(document.getElementById('btn-passe'));
        clearPos(document.getElementById('btn-missoes'));
        const sl = document.querySelector('.menu-side-left');
        if (sl) clearPos(sl);
        const sr = document.querySelector('.menu-side-right');
        if (sr) clearPos(sr);
        const tb = document.querySelector('.trophy-bar-menu');
        if (tb) { tb.style.left = ''; tb.style.top = ''; tb.style.transform = ''; }
      }
    };
    // tentar orientation.lock primeiro, fallback CSS rotation
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => applyRotate());
    } else {
      applyRotate();
    }
    const onResize = () => setTimeout(applyRotate, 200);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('resize', onResize);
  },

  init() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isUA    = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
    if (isTouch || isUA) {
      document.body.classList.add('is-mobile');
      this._forceLandscape();
    }
    Progression.load();
    WorldMap.load();
    Input.init();
    MenuScene.init();
    SelectScene.init();
    TrophiesScene.init();
    ShopScene.init();
    DialogSystem.init();
    GameScene.init();
    this.selectedRanger = RANGERS_DATA[0];
    this.goTo('menu');
  },
};

window.addEventListener('DOMContentLoaded', () => App.init());

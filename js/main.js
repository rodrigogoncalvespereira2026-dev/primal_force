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
    return { x: vx, y: vy };
  },

  _forceLandscape() {
    const app = document.getElementById('app');

    const fixPos = (el, visualX, visualY) => {
      // map visual (x from left, y from top) → CSS { left: visualY, top: innerWidth - visualX }
      if (!el) return;
      el.style.left = visualY + 'px';
      el.style.top = (window.innerWidth - visualX) + 'px';
      el.style.right = el.style.bottom = '';
      el.style.transform = 'none';
    };
    const undPos = (el) => {
      if (!el) return;
      el.style.left = el.style.top = el.style.right = el.style.bottom = '';
      el.style.transform = '';
    };

    const rotateApp = () => {
      if (window.innerHeight <= window.innerWidth) return;
      app.style.width = window.innerHeight + 'px';
      app.style.height = window.innerWidth + 'px';
      app.style.transformOrigin = 'top left';
      app.style.transform = 'rotate(90deg) translate(0, -100vw)';
      document.body.classList.add('portrait');
      const vw = window.innerWidth, vh = window.innerHeight;
      // fixPos(visualX, visualY) → CSS { left: visualY, top: vw - visualX }
      fixPos(document.getElementById('btn-perfil'),  20, 70);
      fixPos(document.getElementById('btn-trofeus'), 166, 70);
      fixPos(document.getElementById('btn-opcoes'), vw - 64, 80);
      fixPos(document.getElementById('btn-passe'),  20, vh - 68);
      fixPos(document.getElementById('btn-missoes'), 166, vh - 68);
      const sl = document.querySelector('.menu-side-left');
      if (sl) fixPos(sl, 20, vh / 2 - 74);
      const sr = document.querySelector('.menu-side-right');
      if (sr) fixPos(sr, vw - 226, vh - 160);
      // mobile controls at visual bottom, spanning full width
      const mc = document.getElementById('mobile-controls');
      if (mc) { mc.style.left = (vh - 80) + 'px'; mc.style.top = '0'; mc.style.right = ''; mc.style.bottom = ''; mc.style.transform = 'none'; mc.style.width = '80px'; mc.style.height = vw + 'px'; mc.style.flexDirection = 'column'; }
      // pause btn at top center
      const pb = document.getElementById('btn-pause');
      if (pb) fixPos(pb, vw / 2 - 30, 10);
    };
    const unrotateApp = () => {
      app.style.width = app.style.height = '';
      app.style.transform = app.style.transformOrigin = '';
      document.body.classList.remove('portrait');
      ['btn-perfil','btn-trofeus','btn-opcoes','btn-passe','btn-missoes'].forEach(id => undPos(document.getElementById(id)));
      undPos(document.querySelector('.menu-side-left'));
      undPos(document.querySelector('.menu-side-right'));
    };

    const handleResize = () => {
      if (window.innerHeight > window.innerWidth) rotateApp();
      else unrotateApp();
    };

    // tentar orientation.lock primeiro
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => rotateApp());
    } else {
      rotateApp();
    }
    // no primeiro toque, tentar de novo (se lock funcionar, remove a rotação CSS)
    document.addEventListener('pointerdown', async () => {
      if (app.style.transform && screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape');
          unrotateApp();
        } catch (e) {}
      }
    }, { once: true });

    window.addEventListener('resize', handleResize);
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

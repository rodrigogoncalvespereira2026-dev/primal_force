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

  _forceLandscape() {
    const wrap = document.getElementById('app-rotated');
    const apply = () => {
      if (window.innerHeight > window.innerWidth) {
        wrap.style.position = 'absolute';
        wrap.style.top = '0';
        wrap.style.left = '0';
        wrap.style.width = window.innerHeight + 'px';
        wrap.style.height = window.innerWidth + 'px';
        wrap.style.transformOrigin = 'top left';
        wrap.style.transform = 'rotate(90deg) translate(0, -100vw)';
        document.body.classList.add('portrait');
      } else {
        wrap.style.position = '';
        wrap.style.top = '';
        wrap.style.left = '';
        wrap.style.width = '';
        wrap.style.height = '';
        wrap.style.transformOrigin = '';
        wrap.style.transform = '';
        document.body.classList.remove('portrait');
      }
    };
    apply();
    window.addEventListener('orientationchange', () => setTimeout(apply, 400));
    window.addEventListener('resize', apply);
  },

  vpToApp(vx, vy) {
    if (document.getElementById('app-rotated').style.transform) {
      return { x: vy, y: window.innerWidth - vx };
    }
    return { x: vx, y: vy };
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

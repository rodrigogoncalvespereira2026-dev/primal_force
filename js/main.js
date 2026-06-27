const App = {
  selectedRanger: null,
  currentZone:    null,
  currentMission: 0,
  _current: null,

  screens: {
    menu:        'screen-menu',
    select:      'screen-select',
    ranger:      'screen-ranger',
    worldmap:    'screen-worldmap',
    trophies:    'screen-trophies',
    battlepass:  'screen-battlepass',
    gota:        'screen-gota',
    shop:        'screen-shop',
    dialog:      'screen-dialog',
    game:        'screen-game',
    pause:       'screen-pause',
    gameover:    'screen-gameover',
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
    if (name === 'battlepass') BattlePassScene.show();
    if (name === 'gota') GotaScene.show();
    if (name === 'shop') ShopScene.show();
    if (name === 'game') {
      GameScene.stop();
      const ranger = this.selectedRanger || RANGERS_DATA[0];
      setTimeout(() => GameScene.start(ranger), 0);
    }
    this._current = name;
  },

  vpToApp(vx, vy) {
    if (document.body.classList.contains('portrait-rotated')) {
      // After 90deg CW rotation, swap and invert coords
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tmp = vx;
      vx = vh - vy;
      vy = tmp;
    }
    return { x: vx, y: vy };
  },

  _forceLandscape() {
    const tryLock = () => {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
          console.log('Orientation lock not supported');
        });
      }
    };
    tryLock();
    setTimeout(tryLock, 500);
    window.addEventListener('load', tryLock);

    // CSS rotation fallback: se o device está em retrato, rotaciona o body 90deg
    this._applyRotation();
    window.addEventListener('resize', () => this._applyRotation());
    window.addEventListener('orientationchange', () => setTimeout(() => this._applyRotation(), 150));
  },

  _applyRotation() {
    const portrait = window.innerHeight > window.innerWidth;
    const body = document.body;
    if (portrait) {
      body.classList.add('portrait-rotated');
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      document.documentElement.style.width = vh + 'px';
      document.documentElement.style.height = vw + 'px';
      document.body.style.width = vh + 'px';
      document.body.style.height = vw + 'px';
      document.body.style.transform = `rotate(90deg) translateX(${vw - vh}px)`;
      document.body.style.transformOrigin = '0 0';
    } else {
      body.classList.remove('portrait-rotated');
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
    }
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
    BattlePassScene.init();
    GotaScene.init();
    ShopScene.init();
    DialogSystem.init();
    GameScene.init();
    this.selectedRanger = RANGERS_DATA[0];
    this.goTo('menu');
  },
};

window.addEventListener('DOMContentLoaded', () => App.init());

const App = {
  selectedRanger: null,
  currentZone:    null,
  currentMission: 0,
  _current: null,
  _isPortraitRotated: false,

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
    if (this._isPortraitRotated) {
      const vh = window.innerHeight;
      return { x: vh - vy, y: vx };
    }
    return { x: vx, y: vy };
  },

  _forceLandscape() {
    const tryLock = () => {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    };
    tryLock();
    setTimeout(tryLock, 500);
    window.addEventListener('load', tryLock);

    this._applyRotation();
    const recheck = () => { this._applyRotation(); if (GameScene && GameScene.canvas) GameScene._resize(); };
    window.addEventListener('resize', recheck);
    window.addEventListener('orientationchange', () => setTimeout(recheck, 300));
  },

  _applyRotation() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const portrait = vh > vw;
    const html = document.documentElement;
    if (portrait) {
      html.style.width = vh + 'px';
      html.style.height = vw + 'px';
      html.style.transform = 'rotate(-90deg)';
      html.style.transformOrigin = 'left top';
      html.style.position = 'absolute';
      html.style.top = vh + 'px';
      html.style.left = '0';
      html.style.overflow = 'hidden';
      this._isPortraitRotated = true;
    } else {
      html.style.cssText = '';
      this._isPortraitRotated = false;
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

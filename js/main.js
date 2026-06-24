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
    const blocker = document.getElementById('orientation-blocker');
    const showBlocker = () => { blocker.style.display = 'flex'; };
    const hideBlocker = () => { blocker.style.display = 'none'; };
    const checkOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        showBlocker();
      } else {
        hideBlocker();
      }
    };
    // matchMedia é o método mais fiável para detetar orientação
    const mql = window.matchMedia('(orientation: landscape)');
    const onChange = (e) => {
      if (e.matches) {
        hideBlocker();
      } else {
        showBlocker();
      }
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
    } else {
      mql.addListener(onChange); // fallback Safari antigo
    }
    // Fallback: resize
    window.addEventListener('resize', checkOrientation);
    // Tentar bloquear orientação
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch(e) {}
    // Estado inicial
    checkOrientation();
  },

  // Viewport → app coordinates (when rotated)
  vpToApp(vx, vy) {
    if (document.body.classList.contains('portrait')) {
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

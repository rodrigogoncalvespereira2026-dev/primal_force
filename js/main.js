const App = {
  selectedRanger: null,
  currentZone:    null,
  currentMission: 0,
  _current: null,

  screens: {
    menu:        'screen-menu',
    select:      'screen-select',
    worldmap:    'screen-worldmap',
    trophies:    'screen-trophies',
    battlepass:  'screen-battlepass',
    primordial:  'screen-primordial',
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
    if (name === 'primordial') PrimordialScene.show();
    if (name === 'shop') ShopScene.show();
    if (name === 'game') {
      GameScene.stop();
      const ranger = this.selectedRanger || RANGERS_DATA[0];
      setTimeout(() => GameScene.start(ranger), 0);
    }
    this._current = name;
  },

  vpToApp(vx, vy) {
    // Retorna coordenadas como estão (sem rotação CSS)
    return { x: vx, y: vy };
  },

  _forceLandscape() {
    // Tenta bloquear orientação landscape nativamente (pode não funcionar em Android Chrome)
    const tryLock = () => {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
          console.log('Orientation lock not supported - user must rotate device manually');
        });
      }
    };

    // Tenta bloquear
    tryLock();
    setTimeout(tryLock, 500);
    window.addEventListener('load', tryLock);
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
    PrimordialScene.init();
    ShopScene.init();
    DialogSystem.init();
    GameScene.init();
    // pointer handler for primordial canvas
    const pc = document.getElementById('primordial-canvas');
    if (pc) {
      const h = (e) => PrimordialScene.onCanvasPointer(e);
      pc.addEventListener('pointerdown', h);
      pc.addEventListener('touchstart', (e) => { e.preventDefault(); h(e); }, {passive:false});
    }
    this.selectedRanger = RANGERS_DATA[0];
    this.goTo('menu');
  },
};

window.addEventListener('DOMContentLoaded', () => App.init());

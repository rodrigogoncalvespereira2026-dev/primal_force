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
  },

  _applyMobileMenuLayout() {
    if (!window.matchMedia('(orientation: landscape)').matches) return;
    const menu = document.getElementById('screen-menu');
    if (!menu) return;

    const style = document.createElement('style');
    style.textContent = `
      #screen-menu {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        gap: 4px;
        overflow: hidden;
      }
      #screen-menu .menu-bg { position: absolute; inset: 0; }
      #screen-menu .opcoes-sidebar { display: none !important; }
      #screen-menu .trophy-bar-menu {
        position: static !important; transform: none; font-size: 11px; padding: 4px 12px;
        width: 100%; text-align: center; order: -1;
      }
      #screen-menu .menu-content { position: static !important; order: 0; flex: 0 0 auto; gap: 4px; }
      #screen-menu .logo-main { font-size: 18px; }
      #screen-menu .logo-sub { font-size: 7px; letter-spacing: 3px; }
      #screen-menu .logo-tagline { display: none; }
      #screen-menu #btn-perfil,
      #screen-menu #btn-trofeus,
      #screen-menu .menu-corner-tr,
      #screen-menu #btn-passe,
      #screen-menu #btn-missoes {
        position: static !important; top: auto !important; left: auto !important;
        bottom: auto !important; right: auto !important; z-index: 2;
      }
      #screen-menu #btn-perfil { order: 1; }
      #screen-menu #btn-trofeus { order: 2; }
      #screen-menu .menu-corner-tr { order: 3; }
      #screen-menu .menu-side-left {
        position: static !important; transform: none !important;
        flex-direction: row; gap: 4px; order: 4; z-index: 2;
      }
      #screen-menu .menu-side-right {
        position: static !important; transform: none !important;
        flex-direction: row; gap: 4px; order: 5; z-index: 2;
      }
      #screen-menu #btn-passe { order: 6; }
      #screen-menu #btn-missoes { order: 7; }
      #screen-menu .menu-footer { position: static !important; font-size: 8px; width: 100%; text-align: center; order: 8; }
      #screen-menu .menu-icon-btn {
        min-width: 0 !important; width: auto; padding: 5px 8px; gap: 4px;
      }
      #screen-menu .corner-icon { font-size: 15px; }
      #screen-menu .corner-label { font-size: 9px; letter-spacing: 0.5px; }
      #screen-menu .menu-play-btn {
        min-width: 0 !important; width: auto; padding: 7px 12px;
        background: rgba(220,30,30,0.32); border-color: #e24b4a;
      }
      #screen-menu .menu-play-btn .corner-icon { font-size: 17px; }
      #screen-menu .menu-play-btn .corner-label { font-size: 10px; }
      #screen-menu #btn-passe .menu-icon-btn,
      #screen-menu #btn-missoes .menu-icon-btn,
      #screen-menu .menu-side-left .menu-icon-btn,
      #screen-menu .menu-side-right .menu-icon-btn {
        min-width: 0 !important; padding: 5px 6px;
      }
    `;
    document.head.appendChild(style);
  },

  init() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isUA    = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
    if (isTouch || isUA) {
      document.body.classList.add('is-mobile');
      this._forceLandscape();
      this._applyMobileMenuLayout();
      document.addEventListener('touchmove', e => {
        if (e.target.closest('#mobile-controls') || e.target.closest('#dpad')) return;
        e.preventDefault();
      }, { passive: false });
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

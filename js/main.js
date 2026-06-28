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

    const style = document.createElement('style');
    style.id = 'mobile-menu-layout';
    style.textContent = `
      /* Só aplicar quando o menu está ativo */
      #screen-menu.active #btn-perfil {
        position: absolute !important;
        top: 8% !important; left: 2% !important;
        bottom: auto !important; right: auto !important;
        padding: 6px 10px !important;
      }
      #screen-menu.active #btn-trofeus {
        position: absolute !important;
        top: 8% !important; left: 12% !important;
        bottom: auto !important; right: auto !important;
        padding: 6px 10px !important;
      }
      #screen-menu.active .menu-corner-tr {
        position: absolute !important;
        top: 8% !important; right: 2% !important;
        bottom: auto !important; left: auto !important;
        padding: 6px 10px !important;
      }
      #screen-menu.active .menu-side-left {
        position: absolute !important;
        left: 2% !important; top: 50% !important;
        transform: translateY(-50%) !important;
        bottom: auto !important; right: auto !important;
        flex-direction: column !important;
        gap: 6px !important;
      }
      #screen-menu.active .menu-side-right {
        position: absolute !important;
        right: 2% !important; bottom: 8% !important;
        top: auto !important; left: auto !important;
        flex-direction: row !important;
        gap: 8px !important;
      }
      #screen-menu.active #btn-passe {
        position: absolute !important;
        bottom: 8% !important; left: 2% !important;
        top: auto !important; right: auto !important;
        padding: 6px 10px !important;
      }
      #screen-menu.active #btn-missoes {
        position: absolute !important;
        bottom: 8% !important; left: 12% !important;
        top: auto !important; right: auto !important;
        padding: 6px 10px !important;
      }
      #screen-menu.active .menu-content {
        position: absolute !important;
        top: 50% !important; left: 50% !important;
        transform: translate(-50%, -50%) !important;
      }
      #screen-menu.active .menu-footer {
        position: absolute !important;
        bottom: 2% !important; left: 50% !important;
        transform: translateX(-50%) !important;
        font-size: 8px !important;
      }
      #screen-menu.active .trophy-bar-menu {
        position: absolute !important;
        top: 2% !important; left: 50% !important;
        transform: translateX(-50%) !important;
        font-size: 11px !important; padding: 4px 12px !important;
      }
      #screen-menu.active .opcoes-sidebar { display: none !important; }

      /* Botões mais pequenos */
      #screen-menu.active .menu-icon-btn {
        min-width: 0 !important;
        width: auto !important;
        padding: 6px 10px !important;
        gap: 4px !important;
      }
      #screen-menu.active .corner-icon { font-size: 16px !important; }
      #screen-menu.active .corner-label { font-size: 9px !important; letter-spacing: 0.5px !important; }
      #screen-menu.active .menu-play-btn {
        min-width: 0 !important;
        padding: 10px 16px !important;
      }
      #screen-menu.active .menu-play-btn .corner-icon { font-size: 20px !important; }
      #screen-menu.active .menu-play-btn .corner-label { font-size: 11px !important; }
      #screen-menu.active .logo-main { font-size: 18px !important; }
      #screen-menu.active .logo-sub { font-size: 8px !important; letter-spacing: 3px !important; }
      #screen-menu.active .logo-tagline { display: none !important; }
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

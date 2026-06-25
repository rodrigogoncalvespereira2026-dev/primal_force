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
    // Converte coordenadas quando o app está rotacionado 90deg
    const isRotated = document.body.classList.contains('portrait-rotated');
    if (!isRotated) {
      return { x: vx, y: vy };
    }
    // Quando rotacionado 90deg: viewport (x,y) -> app (y, innerWidth - x)
    return { x: vy, y: window.innerWidth - vx };
  },

  _forceLandscape() {
    const app = document.getElementById('app');
    const rotateMsg = document.getElementById('rotate-message');
    const continueBtn = document.getElementById('btn-continue-anyway');

    const applyLandscape = () => {
      const isPortrait = window.innerHeight > window.innerWidth;

      if (isPortrait) {
        // Aplica rotação CSS quando em portrait
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        app.style.width = vh + 'px';
        app.style.height = vw + 'px';
        app.style.transform = 'rotate(90deg)';
        app.style.transformOrigin = 'top left';
        app.style.position = 'absolute';
        app.style.top = '0';
        app.style.left = '0';
        document.body.classList.add('portrait-rotated');
      } else {
        // Remove rotação quando em landscape
        app.style.width = '';
        app.style.height = '';
        app.style.transform = '';
        app.style.transformOrigin = '';
        app.style.position = '';
        app.style.top = '';
        app.style.left = '';
        document.body.classList.remove('portrait-rotated');
      }

      // Esconde mensagem de rotação
      if (rotateMsg) {
        rotateMsg.classList.remove('active');
      }
    };

    // Botão para continuar mesmo em portrait
    if (continueBtn) {
      continueBtn.addEventListener('click', applyLandscape);
    }

    // Aplica imediatamente e em eventos
    applyLandscape();
    setTimeout(applyLandscape, 100);
    setTimeout(applyLandscape, 500);

    window.addEventListener('resize', applyLandscape);
    window.addEventListener('orientationchange', () => setTimeout(applyLandscape, 200));
    window.addEventListener('load', applyLandscape);
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

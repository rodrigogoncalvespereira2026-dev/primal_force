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
    const app = document.getElementById('app');
    const p = (id, rules) => {
      const el = document.getElementById(id);
      if (!el) return;
      for (const [k,v] of Object.entries(rules)) el.style[k] = v;
    };
    const apply = () => {
      const portrait = window.innerHeight > window.innerWidth;
      if (portrait) {
        app.style.position = 'absolute';
        app.style.top = '0';
        app.style.left = '0';
        app.style.width = window.innerHeight + 'px';
        app.style.height = window.innerWidth + 'px';
        app.style.transformOrigin = 'top left';
        app.style.transform = 'rotate(90deg) translate(0, -100vw)';
        document.body.classList.add('portrait');
        p('btn-perfil',  { left:'70px', bottom:'20px', top:'', right:'' });
        p('btn-trofeus', { left:'70px', bottom:'166px', top:'', right:'' });
        p('btn-opcoes',  { left:'80px', bottom:'calc(100% - 40px)', top:'', right:'' });
        p('btn-passe',   { left:'calc(100% - 50px)', bottom:'20px', top:'', right:'' });
        p('btn-missoes', { left:'calc(100% - 50px)', bottom:'166px', top:'', right:'' });
        p('menu-side-right', { left:'calc(100% - 60px)', bottom:'calc(100% - 120px)', top:'', right:'' });
        p('menu-side-left',  { left:'50%', bottom:'20px', top:'', right:'', transform:'translateX(-50%)' });
      } else {
        app.style.position = '';
        app.style.top = '';
        app.style.left = '';
        app.style.width = '';
        app.style.height = '';
        app.style.transformOrigin = '';
        app.style.transform = '';
        document.body.classList.remove('portrait');
        p('btn-perfil',  { left:'', bottom:'', top:'', right:'' });
        p('btn-trofeus', { left:'', bottom:'', top:'', right:'' });
        p('btn-opcoes',  { left:'', bottom:'', top:'', right:'' });
        p('btn-passe',   { left:'', bottom:'', top:'', right:'' });
        p('btn-missoes', { left:'', bottom:'', top:'', right:'' });
        p('menu-side-right', { left:'', bottom:'', top:'', right:'' });
        p('menu-side-left',  { left:'', bottom:'', top:'', right:'', transform:'' });
      }
    };
    apply();
    window.addEventListener('orientationchange', () => setTimeout(apply, 400));
    window.addEventListener('resize', apply);
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch(e) {}
  },

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

const GameScene = {
  canvas: null, ctx: null,
  player: null,
  enemies: [], projectiles: [], particles: [], pickups: [],
  score: 0, kills: 0,
  combo: 0, comboTimer: 0,
  msg: '', msgTimer: 0,
  cam: { x: 0, y: 0 },
  running: false, _raf: null, _lastTime: 0,
  laserFireTimer: 0,

  spawnParticles(x, y, color, n=10) { for(let i=0;i<n;i++) this.particles.push(new Particle(x,y,color)); },
  showMsg(txt, dur=80) { this.msg=txt; this.msgTimer=dur; },
  addCombo()   { this.combo++; this.comboTimer=110; },
  resetCombo() { this.combo=0; },
  updateScoreEl() { document.getElementById('hud-score').textContent=this.score; },

  onEnemyKill(e) {
    const bonus = 1 + Math.floor(this.combo/4);
    this.score += e.score * bonus;
    this.kills++;
    this.updateScoreEl();
    const r = Math.random();
    if      (r<0.25) this.pickups.push(new Pickup(e.x,e.y,'hp'));
    else if (r<0.45) this.pickups.push(new Pickup(e.x,e.y,'power'));
    else if (r<0.55) this.pickups.push(new Pickup(e.x,e.y,'score'));
    this.spawnParticles(e.x,e.y,e.color,20);
    WaveSystem.enemiesLeft = Math.max(0, WaveSystem.enemiesLeft - 1);
    this._updateWaveHUD();
  },

  onWaveComplete(waveNum) {
    const trophiesEarned = 5 + waveNum * 2;
    Progression.addTrophies(trophiesEarned);
    Progression.addBattlePassXP(50 + waveNum * 10);
    this.showMsg('ONDA ' + waveNum + ' COMPLETA! +' + trophiesEarned + ' 🏆', 180);
    this.spawnParticles(this.player.x, this.player.y, '#fac775', 40);
    this._updateWaveHUD();
  },

  onPlayerDeath() {
    this.running = false;
    cancelAnimationFrame(this._raf);
    // Troféus mesmo ao perder
    const trophiesEarned = Math.floor(this.kills / 2);
    if (trophiesEarned > 0) Progression.addTrophies(trophiesEarned);
    Progression.addBattlePassXP(this.kills * 5);
    document.getElementById('go-title').textContent  = 'DERROTA';
    document.getElementById('go-score').textContent  = 'Pontuação: ' + this.score;
    document.getElementById('go-kills').textContent  = 'Inimigos derrotados: ' + this.kills;
    document.getElementById('go-trophies').textContent = '+' + trophiesEarned + ' 🏆 Troféus';
    App.goTo('gameover');
  },

  _updateWaveHUD() {
    const p = WaveSystem.getProgress();
    document.getElementById('hud-wave').textContent  = 'Onda ' + p.wave;
    document.getElementById('hud-enemies').textContent = p.killed + '/' + p.total;
  },

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');
    window.addEventListener('resize', () => this._resize());
    Joystick.init();

    document.getElementById('btn-pause').onclick = () => {
      GameScene.stop();
      document.getElementById('screen-game').classList.add('active');
      document.getElementById('screen-pause').classList.add('active');
    };
    document.getElementById('btn-continuar').onclick = () => {
      document.getElementById('screen-pause').classList.remove('active');
      GameScene.resume();
    };
    document.getElementById('btn-menu-pause').onclick = () => { GameScene.stop(); App.goTo('menu'); };
    document.getElementById('btn-retry').onclick    = () => App.goTo('game');
    document.getElementById('btn-go-menu').onclick  = () => App.goTo('menu');

    // Teclado (PC)
    const mobileActionButtons = {
      'btn-mb-melee': () => this.player.doMelee(this),
      'btn-mb-laser': () => this.player.doLaser(this),
      'btn-mb-special': () => this.player.doSpecial(this),
      'btn-mb-shield': () => this.player.doShield(this),
      'btn-mb-zord': () => this.player.doZord(this),
    };

    Object.entries(mobileActionButtons).forEach(([id, action]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('pointerdown', () => {
        if (!this.running || !this.player) return;
        action();
      });
    });

    document.addEventListener('keydown', e => {
      if (!this.running) return;
      if (e.code==='KeyZ') this.player.doMelee(this);
      if (e.code==='KeyX') this.player.doLaser(this);
      if (e.code==='KeyC') this.player.doSpecial(this);
      if (e.code==='KeyV') this.player.doShield(this);
      if (e.code==='KeyQ') this.player.doZord(this);
      if (e.code==='Escape'||e.code==='KeyP') {
        GameScene.stop();
        document.getElementById('screen-game').classList.add('active');
        document.getElementById('screen-pause').classList.add('active');
      }
    });
  },

  start(rangerData) {
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf=null; }

    World.generate();
    this.player      = new Ranger(rangerData);
    this.enemies     = [];
    this.projectiles = [];
    this.particles   = [];
    this.pickups     = [];
    this.score = this.kills = 0;
    this.combo = this.comboTimer = 0;
    this.msg=''; this.msgTimer=0;
    this.laserFireTimer=0;

    WaveSystem.reset();
    WaveSystem.startWave(1);

    document.getElementById('hud-score').textContent='0';
    HUD.init(rangerData);
    this._updateWaveHUD();

    this.showMsg('ONDA 1 — PRIMAL FORCE!', 140);
    this._resize();
    this.running=true;
    this._lastTime=performance.now();
    this._raf=requestAnimationFrame(ts=>this._loop(ts));
  },

  stop()   { this.running=false; if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;} },
  resume() { if(this.running)return; this.running=true; this._lastTime=performance.now(); this._raf=requestAnimationFrame(ts=>this._loop(ts)); },

  _resize() {
    if (!this.canvas) return;
    const p = this.canvas.parentElement;
    this.canvas.width  = (p?p.clientWidth :window.innerWidth)  || window.innerWidth;
    this.canvas.height = (p?p.clientHeight:window.innerHeight) || window.innerHeight;
  },

  _loop(ts) {
    if (!this.running) return;
    const dt = Math.min((ts-this._lastTime)/16.667, 3);
    this._lastTime=ts;
    this._update(dt);
    this._draw();
    this._raf=requestAnimationFrame(t=>this._loop(t));
  },

  _update(dt) {
    const p = this.player;

    // Movimento via joystick ou teclado
    const mob = Joystick.getMoveDir();
    const kx = Input.getDirX(), ky = Input.getDirY();
    const mx = mob.x || kx, my = mob.y || ky;
    if (mx!==0||my!==0) {
      const n=Utils.normalize(mx,my);
      const spd=p.speed*(p.zordActive?1.4:1)*dt;
      const nx=Utils.clamp(p.x+n.x*spd,20,World.W-20);
      const ny=Utils.clamp(p.y+n.y*spd,20,World.H-20);
      if(!World.isSolid(nx,p.y)) p.x=nx;
      if(!World.isSolid(p.x,ny)) p.y=ny;
      p.facing=Math.atan2(n.y,n.x);
    }

    // Joystick direito — apontar e disparar
    const aim=Joystick.getAimDir();
    if(aim.x!==0||aim.y!==0) {
      p.facing=Math.atan2(aim.y,aim.x);
      if(Joystick.isFiring()) {
        this.laserFireTimer-=dt;
        if(this.laserFireTimer<=0) {
          this.laserFireTimer=18;
          p.doLaser(this);
        }
      }
    }

    // Update entidades
    p.updateTimers(dt, this);
    WaveSystem.update(dt, this);

    for(const e  of this.enemies)     e.update(dt,p,this);
    for(const pr of this.projectiles) pr.update(dt,this);
    for(const pk of this.pickups)     pk.update(dt,p,this);
    for(const pt of this.particles)   pt.update(dt);

    this.enemies     = this.enemies.filter(e=>!e.dead);
    this.projectiles = this.projectiles.filter(pr=>!pr.dead);
    this.pickups     = this.pickups.filter(pk=>!pk.dead);
    this.particles   = this.particles.filter(pt=>!pt.dead);

    if(this.comboTimer>0){this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;}
    if(this.msgTimer>0)  this.msgTimer-=dt;

    const vw=this.canvas.width, vh=this.canvas.height;
    this.cam.x=Utils.clamp(p.x-vw/2,0,Math.max(0,World.W-vw));
    this.cam.y=Utils.clamp(p.y-vh/2,0,Math.max(0,World.H-vh));

    HUD.update(p,this);
    HUD.updateMinimap(p,this.enemies,this.cam,vw,vh);
    this._updateWaveHUD();
  },

  _draw() {
    const ctx=this.ctx;
    const w=this.canvas.width, h=this.canvas.height;
    ctx.fillStyle='#04080a';
    ctx.fillRect(0,0,w,h);
    World.draw(ctx,this.cam.x,this.cam.y,w,h);
    for(const pk of this.pickups)     pk.draw(ctx,this.cam);
    for(const pt of this.particles)   pt.draw(ctx,this.cam);
    for(const pr of this.projectiles) pr.draw(ctx,this.cam);
    for(const e  of this.enemies)     e.draw(ctx,this.cam);
    this.player.draw(ctx,this.cam);

    // Linha de mira (joystick direito)
    const aim=Joystick.getAimDir();
    if(aim.x!==0||aim.y!==0) this._drawAimLine(ctx);

    // Joysticks
    Joystick.draw(ctx,w,h);

    // Entre ondas — countdown
    if(WaveSystem.betweenWaves) {
      const secs = Math.ceil(WaveSystem.betweenTimer/60);
      ctx.fillStyle='rgba(0,0,0,0.45)';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#fff';
      ctx.font=`bold ${Math.round(w*0.06)}px sans-serif`;
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText('ONDA ' + (WaveSystem.wave+1) + ' EM ' + secs + '...', w/2, h/2);
    }
  },

  _drawAimLine(ctx) {
    const p=this.player;
    const sx=p.x-this.cam.x, sy=p.y-this.cam.y;
    const aim=Joystick.getAimDir();
    const len=220;
    const ex=sx+aim.x*len, ey=sy+aim.y*len;
    ctx.save();
    ctx.strokeStyle=p.data.laserColor+'99';
    ctx.lineWidth=2;
    ctx.setLineDash([8,6]);
    ctx.beginPath();
    ctx.moveTo(sx,sy);
    ctx.lineTo(ex,ey);
    ctx.stroke();
    ctx.setLineDash([]);
    // ponto no fim
    ctx.fillStyle=p.data.laserColor;
    ctx.beginPath();
    ctx.arc(ex,ey,5,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  },
};

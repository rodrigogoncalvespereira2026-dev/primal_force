const GameScene = {
  player: null,
  enemies: [], projectiles: [], particles: [], pickups: [],
  boss: null,
  bossDefeated: false,
  score: 0, kills: 0,
  combo: 0, comboTimer: 0,
  msg: '', msgTimer: 0,
  cam: { x: 0, y: 0 },
  running: false, _raf: null, _lastTime: 0,
  laserFireTimer: 0,
  activeBoosts: { coinMult: 1, trophyMult: 1 },
  _entityGroup: null,
  _overlayCanvas: null,
  _overlayCtx: null,

  spawnParticles(x, y, color, n=10) {
    for (let i = 0; i < n; i++) {
      const pt = new Particle(x, y, color);
      this.particles.push(pt);
    }
  },
  showMsg(txt, dur=80) { this.msg=txt; this.msgTimer=dur; },
  addCombo()   { this.combo++; this.comboTimer=110; },
  resetCombo() { this.combo=0; },
  updateScoreEl() { document.getElementById('hud-score').textContent=this.score; },

  _reactionIdx: 0,
  _reactions: ['👍','😂','😡','😢','🎉','💀','🔥','❤️'],
  _showReaction() {
    if (!this.player) return;
    const emoji = this._reactions[this._reactionIdx % this._reactions.length];
    this._reactionIdx++;
    this.particles.push(new ReactionParticle(this.player.x, this.player.y - 30, emoji));
  },

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
    Engine3D.shake(1.5);
  },

  _spawnBoss() {
    const bossKey = pickRandomBoss();
    const bossType = BOSS_TYPES[bossKey];
    const dialogKey = bossType.dialogKey;

    this.showMsg('⚠️ BOSS APROXIMA-SE!', 120);
    this.spawnParticles(this.player.x, this.player.y, '#ff4444', 30);

    const lines = Story.dialogues[dialogKey];
    if (lines) {
      this.stop();
      DialogSystem.show(lines, () => {
        this.boss = new Boss(bossKey);
        this._createBossMesh(this.boss);
        this._updateBossHUD(true);
        this.resume();
      });
    } else {
      this.boss = new Boss(bossKey);
      this._createBossMesh(this.boss);
      this._updateBossHUD(true);
    }
  },

  onBossKill(boss) {
    this.bossDefeated = true;
    const trophiesEarned = Math.round((30 + WaveSystem.wave * 5) * this.activeBoosts.trophyMult);
    const coinsEarned    = Math.round((80 + WaveSystem.wave * 8) * this.activeBoosts.coinMult);
    Progression.addTrophies(trophiesEarned);
    Progression.addCoins(coinsEarned);
    Progression.addBattlePassXP(200 + WaveSystem.wave * 20);
    this.score += boss.score * (1 + Math.floor(this.combo / 4));
    this.kills++;
    this.updateScoreEl();
    this.spawnParticles(boss.x, boss.y, boss.color, 80);
    this.spawnParticles(boss.x, boss.y, '#ffffff', 40);
    this._updateBossHUD(false);
    if (boss.mesh3d) { Engine3D.scene.remove(boss.mesh3d); boss.mesh3d = null; }
    Engine3D.shake(8);

    const defeatKey = boss.typeKey + '_defeat';
    const lines = Story.dialogues[defeatKey];
    this.stop();
    if (lines) {
      DialogSystem.show(lines, () => this._afterBossDefeat(trophiesEarned, coinsEarned));
    } else {
      this._afterBossDefeat(trophiesEarned, coinsEarned);
    }
  },

  _afterBossDefeat(trophiesEarned, coinsEarned) {
    if (App.currentZone) WorldMap.completeMission(App.currentZone.id);
    this._missionRewards = { coins: coinsEarned, trophies: trophiesEarned };
    this._showGameoverData('🏆 VITÓRIA!', '— BOSS DERROTADO!');
    this._tryPrimordial({ victory: true, isBoss: true });
  },

  _showGameoverData(title, suffix) {
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setText('go-title', title);
    setText('go-score', 'Pontuação: ' + this.score);
    setText('go-kills', 'Inimigos derrotados: ' + this.kills);
    setText('go-mission-rewards', 'Missão: +' + this._missionRewards.trophies + ' 🏆 +' + this._missionRewards.coins + ' 💰 ' + (suffix || ''));
    setText('go-gota-rewards', '');
    setText('go-trophies', 'Total: +' + this._missionRewards.trophies + ' 🏆 +' + this._missionRewards.coins + ' 💰');
  },

  _updateBossHUD(show) {
    const el = document.getElementById('boss-hud');
    if (el) el.style.display = show ? 'block' : 'none';
  },

  onWaveComplete(waveNum) {
    const trophiesEarned = Math.round((5 + waveNum * 2) * this.activeBoosts.trophyMult);
    const coinsEarned    = Math.round((3 + waveNum)     * this.activeBoosts.coinMult);
    Progression.addTrophies(trophiesEarned);
    Progression.addCoins(coinsEarned);
    Progression.addBattlePassXP(50 + waveNum * 10);
    this.showMsg('ONDA ' + waveNum + ' COMPLETA! +' + trophiesEarned + ' 🏆 +' + coinsEarned + ' 💰', 180);
    this.spawnParticles(this.player.x, this.player.y, '#fac775', 40);
    this._updateWaveHUD();
  },

  _tryPrimordial(missionResult) {
    const drop = Primordial.canDrop(missionResult);
    if (Math.random() < drop.chance) {
      Primordial.start(drop.maxTier);
      GotaScene.show(this._missionRewards || { coins:0, trophies:0 }, () => {
        this._updateGameoverWithGota();
        App.goTo('gameover');
      });
    } else {
      window._gotaRewards = [];
      App.goTo('gameover');
    }
  },

  _updateGameoverWithGota() {
    const r = window._gotaRewards || [];
    const gotaCoins = r.filter(x => x.type === 'coins').reduce((s, x) => s + x.amount, 0);
    const gotaTrophies = r.filter(x => x.type === 'trophies').reduce((s, x) => s + x.amount, 0);
    const mCoins = this._missionRewards?.coins || 0;
    const mTrophies = this._missionRewards?.trophies || 0;
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setText('go-mission-rewards', 'Missão: +' + mTrophies + ' 🏆 +' + mCoins + ' 💰');
    setText('go-gota-rewards', 'Gota: +' + gotaTrophies + ' 🏆 +' + gotaCoins + ' 💰');
    setText('go-trophies', 'Total: +' + (mTrophies + gotaTrophies) + ' 🏆 +' + (mCoins + gotaCoins) + ' 💰');
  },

  onPlayerDeath() {
    this.running = false;
    cancelAnimationFrame(this._raf);
    const trophiesEarned = Math.round(Math.floor(this.kills / 2) * this.activeBoosts.trophyMult);
    const coinsEarned    = Math.round(this.kills * this.activeBoosts.coinMult);
    if (trophiesEarned > 0) Progression.addTrophies(trophiesEarned);
    if (coinsEarned > 0)    Progression.addCoins(coinsEarned);
    Progression.addBattlePassXP(this.kills * 5);
    this._missionRewards = { coins: coinsEarned, trophies: trophiesEarned };
    this._showGameoverData('DERROTA', '');
    this._tryPrimordial({ victory: false, isBoss: false });
  },

  _updateWaveHUD() {
    const p = WaveSystem.getProgress();
    document.getElementById('hud-wave').textContent  = 'Onda ' + p.wave;
    document.getElementById('hud-enemies').textContent = p.killed + '/' + p.total;
  },

  init() {
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

    const mb = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', e => { e.preventDefault(); if (this.running) fn(); });
    };
    mb('btn-mb-laser',   () => this.player.doLaser(this));
    mb('btn-mb-special', () => this.player.doSpecial(this));
    mb('btn-mb-shield',  () => this.player.doShield(this));
    mb('btn-mb-zord',    () => this.player.doZord(this));
    mb('btn-mb-reaction', () => this._showReaction());

    document.addEventListener('keydown', e => {
      if (!this.running) return;
      if (e.code==='Space') { e.preventDefault(); this.player.doMelee(this); }
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

    // ── Setup Three.js ──
    const container = document.getElementById('game-3d-container');
    if (!container) return;
    Engine3D.init(container);
    Engine3D.clear();

    // Setup overlay 2D canvas (joystick + reactions)
    this._overlayCanvas = document.getElementById('game-overlay-2d');
    if (this._overlayCanvas) {
      this._overlayCanvas.width = window.innerWidth;
      this._overlayCanvas.height = window.innerHeight;
      this._overlayCtx = this._overlayCanvas.getContext('2d');
      window.addEventListener('resize', () => {
        if (this._overlayCanvas) {
          this._overlayCanvas.width = window.innerWidth;
          this._overlayCanvas.height = window.innerHeight;
        }
      });
    }

    // Grupo para entidades
    this._entityGroup = new THREE.Group();
    Engine3D.scene.add(this._entityGroup);

    World.clearCustom();
    const customMap = MapStorage.loadActiveMap();
    if (customMap && customMap.grid) {
      World.loadCustom(customMap);
      MapStorage.clearActiveMap();
    } else {
      World.generate();
    }

    // ── Mundo 3D ──
    const worldGroup = World3D.build(World);
    Engine3D.scene.add(worldGroup);

    this.player      = new Ranger(rangerData);
    this._createPlayerMesh(this.player);

    this.enemies     = [];
    this.projectiles = [];
    this.particles   = [];
    this.pickups     = [];
    this.score = this.kills = 0;
    this.combo = this.comboTimer = 0;
    this.msg=''; this.msgTimer=0;
    this.laserFireTimer=0;
    this.boss = null;
    this.bossDefeated = false;

    this.activeBoosts = { coinMult: 1, trophyMult: 1 };
    const boostMsgs = [];
    if (Progression.consumeItem('potion')) {
      this.player.hp = this.player.maxHp;
      boostMsgs.push('🧪 Poção de Vida');
    }
    if (Progression.consumeItem('shield')) {
      this.player.invincible = 240;
      boostMsgs.push('🛡️ Escudo de Entrada');
    }
    if (Progression.consumeItem('speedBoost')) {
      this.player.speedMult = 1.3;
      this.player.speed = this.player.data.speed * this.player.speedMult;
      boostMsgs.push('⚡ Bota de Velocidade');
    }
    if (Progression.consumeItem('doubleCoins'))    { this.activeBoosts.coinMult    = 2; boostMsgs.push('💰 Moeda Dupla'); }
    if (Progression.consumeItem('doubleTrophies')) { this.activeBoosts.trophyMult  = 2; boostMsgs.push('🏆 Troféu Duplo'); }

    WaveSystem.maxWaves = App.currentZone ? (App.currentZone.waves || 3) : 3;
    WaveSystem.isFinalMission = App.currentZone
      ? (App.currentMission >= App.currentZone.missions.length - 1)
      : true;

    WaveSystem.reset();
    WaveSystem.startWave(1);

    document.getElementById('hud-score').textContent='0';
    HUD.init(rangerData);
    this._updateWaveHUD();

    this.showMsg(
      boostMsgs.length ? 'ONDA 1! Itens usados: ' + boostMsgs.join(' ') : 'ONDA 1 — PRIMAL FORCE!',
      160
    );
    const skillBar = document.getElementById('skill-bar');
    if (skillBar && document.body.classList.contains('is-mobile')) {
      skillBar.style.display = 'none';
    }

    this.running=true;
    this._lastTime=performance.now();
    this._raf=requestAnimationFrame(ts=>this._loop(ts));
  },

  stop()   { this.running=false; if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;} },
  resume() { if(this.running)return; this.running=true; this._lastTime=performance.now(); this._raf=requestAnimationFrame(ts=>this._loop(ts)); },

  _loop(ts) {
    if (!this.running) return;
    const dt = Math.min((ts-this._lastTime)/16.667, 3);
    this._lastTime=ts;
    this._update(dt);
    this._sync3D();
    this._render3D();
    this._raf=requestAnimationFrame(t=>this._loop(t));
  },

  _update(dt) {
    const p = this.player;

    // Rotação de câmara via toque livre no lado direito (estilo Free Fire)
    const camDrag = Joystick.getCameraDrag();
    if (camDrag.dx !== 0 || camDrag.dy !== 0) {
      Engine3D.orbitAngle(-camDrag.dx * 0.006);
      Engine3D.orbitPitch(-camDrag.dy * 0.004);
    }

    // Movimento relativo à câmara (estilo Free Fire)
    const mob = Joystick.getMoveDir();
    const kx = Input.getDirX(), ky = Input.getDirY();
    const mx = (mob.x !== 0) ? mob.x : kx;
    const my = (mob.y !== 0) ? mob.y : ky;
    if (mx!==0||my!==0) {
      const camAngle = Engine3D.camAngle;
      const cosA = Math.cos(camAngle);
      const sinA = Math.sin(camAngle);
      const worldMX = mx * cosA + my * sinA;
      const worldMY = -mx * sinA + my * cosA;

      const n = Utils.normalize(worldMX, worldMY);
      const spd = p.speed * (p.zordActive ? 1.4 : 1) * dt;
      const nx = Utils.clamp(p.x + n.x * spd, 20, World.W - 20);
      const ny = Utils.clamp(p.y + n.y * spd, 20, World.H - 20);
      if (!World.isSolid(nx, p.y)) p.x = nx;
      if (!World.isSolid(p.x, ny)) p.y = ny;
      p.facing = Math.atan2(n.y, n.x);

      Engine3D.setLookAhead(n.x, n.y);
      Engine3D.resetIdleTimer();
    } else {
      Engine3D.setLookAhead(0, 0);
    }

    p.updateTimers(dt, this);
    WaveSystem.update(dt, this);

    for(const e  of this.enemies)     e.update(dt,p,this);
    for(const pr of this.projectiles) pr.update(dt,this);
    for(const pk of this.pickups)     pk.update(dt,p,this);
    for(const pt of this.particles)   pt.update(dt);

    if (this.boss && !this.boss.dead) {
      this.boss.update(dt, p, this);
    }
    if (this.boss && this.boss.dead && !this.bossDefeated) {
      this.onBossKill(this.boss);
    }

    // Remover entidades mortas e seus meshes 3D
    for (const e of this.enemies) {
      if (e.dead && e.mesh3d) { this._entityGroup.remove(e.mesh3d); e.mesh3d = null; }
    }
    for (const pr of this.projectiles) {
      if (pr.dead && pr.mesh3d) { this._entityGroup.remove(pr.mesh3d); pr.mesh3d = null; }
    }
    for (const pk of this.pickups) {
      if (pk.dead && pk.mesh3d) { this._entityGroup.remove(pk.mesh3d); pk.mesh3d = null; }
    }
    for (const pt of this.particles) {
      if (pt.dead && pt.mesh3d) { this._entityGroup.remove(pt.mesh3d); pt.mesh3d = null; }
    }

    this.enemies     = this.enemies.filter(e=>!e.dead);
    this.projectiles = this.projectiles.filter(pr=>!pr.dead);
    this.pickups     = this.pickups.filter(pk=>!pk.dead);
    this.particles   = this.particles.filter(pt=>!pt.dead);

    if(this.comboTimer>0){this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;}
    if(this.msgTimer>0)  this.msgTimer-=dt;

    // Câmara 2D para minimap
    const vw = window.innerWidth, vh = window.innerHeight;
    this.cam.x = p.x;
    this.cam.y = p.y;
    this.cam.vw = vw;
    this.cam.vh = vh;
    this.cam.vx = Utils.clamp(p.x - vw/2, 0, Math.max(0, World.W - vw));
    this.cam.vy = Utils.clamp(p.y - vh/2, 0, Math.max(0, World.H - vh));

    HUD.update(p,this);
    this._updateWaveHUD();
  },

  _sync3D() {
    const p = this.player;

    // Sincronizar posição do jogador
    if (p.mesh3d) {
      p.mesh3d.position.set(p.x, 0, p.y);
      p.mesh3d.rotation.y = -p.facing + Math.PI / 2;

      // Walk animation
      const isMoving = (p._lastX !== undefined && (Math.abs(p.x - p._lastX) > 0.1 || Math.abs(p.y - p._lastY) > 0.1));
      if (isMoving) {
        p._walkTimer = (p._walkTimer || 0) + 0.18;
      } else {
        p._walkTimer = (p._walkTimer || 0) * 0.85;
        if (p._walkTimer < 0.01) p._walkTimer = 0;
      }
      p._lastX = p.x;
      p._lastY = p.y;

      const wt = p._walkTimer;
      const swing = Math.sin(wt) * 0.45;
      const idle = Math.sin(performance.now() * 0.003) * 0.04;

      if (p.mesh3d._armL) {
        p.mesh3d._armL.rotation.x += (isMoving ? swing : idle - 0.1 - p.mesh3d._armL.rotation.x) * 0.15;
        p.mesh3d._armL.rotation.z = 0.2 + (isMoving ? Math.abs(Math.sin(wt)) * 0.12 : 0);
      }
      if (p.mesh3d._armR) {
        p.mesh3d._armR.rotation.x += (isMoving ? -swing : -idle + 0.1 - p.mesh3d._armR.rotation.x) * 0.15;
        p.mesh3d._armR.rotation.z = -0.2 - (isMoving ? Math.abs(Math.sin(wt)) * 0.12 : 0);
      }
      if (p.mesh3d._legL) {
        p.mesh3d._legL.rotation.x += (isMoving ? -swing * 0.7 : -p.mesh3d._legL.rotation.x) * 0.15;
      }
      if (p.mesh3d._legR) {
        p.mesh3d._legR.rotation.x += (isMoving ? swing * 0.7 : -p.mesh3d._legR.rotation.x) * 0.15;
      }

      // Bob na cabeça
      if (p.mesh3d._head) {
        if (!p.mesh3d._head._baseY) p.mesh3d._head._baseY = p.mesh3d._head.position.y;
        const headBob = isMoving ? Math.abs(Math.sin(wt * 2)) * 0.35 : Math.sin(performance.now() * 0.002) * 0.08;
        p.mesh3d._head.position.y = p.mesh3d._head._baseY + headBob;
      }

      // Bob no corpo
      if (p.mesh3d._body) {
        if (!p.mesh3d._body._baseY) p.mesh3d._body._baseY = p.mesh3d._body.position.y;
        const bodyBob = isMoving ? Math.abs(Math.sin(wt * 2)) * 0.18 : Math.sin(performance.now() * 0.002) * 0.04;
        p.mesh3d._body.position.y = p.mesh3d._body._baseY + bodyBob;
      }
      // Efeito de escudo
      if (p.shielded && !p._shieldMesh) {
        const shieldGeo = new THREE.TorusGeometry(p.size + 12, 1.5, 8, 24);
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0x378add, transparent: true, opacity: 0.6 });
        p._shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        p._shieldMesh.rotation.x = Math.PI / 2;
        p.mesh3d.add(p._shieldMesh);
      } else if (!p.shielded && p._shieldMesh) {
        p.mesh3d.remove(p._shieldMesh);
        p._shieldMesh = null;
      }
      // Efeito de zord
      if (p.zordActive) {
        p.mesh3d.scale.set(1.3, 1.3, 1.3);
      } else {
        p.mesh3d.scale.set(1, 1, 1);
      }
      // Piscar se invencível
      if (p.invincible > 0) {
        p.mesh3d.visible = Math.floor(p.invincible / 5) % 2 === 0;
      } else {
        p.mesh3d.visible = true;
      }
    }

    // Sincronizar inimigos
    for (const e of this.enemies) {
      if (!e.mesh3d) {
        this._createEnemyMesh(e);
      }
      if (e.mesh3d) {
        e.mesh3d.position.set(e.x, 0, e.y);
        if (e.hit > 0) {
          e.mesh3d.children.forEach(c => {
            if (c.material && c.material.emissive) c.material.emissive.setHex(0xffffff);
          });
        } else {
          e.mesh3d.children.forEach(c => {
            if (c.material && c.material.emissive) c.material.emissive.setHex(0x000000);
          });
        }
      }
    }

    // Sincronizar projéteis
    for (const pr of this.projectiles) {
      if (!pr.mesh3d) {
        this._createProjectileMesh(pr);
      }
      if (pr.mesh3d) {
        pr.mesh3d.position.set(pr.x, 2, pr.y);
      }
    }

    // Sincronizar pickups
    for (const pk of this.pickups) {
      if (!pk.mesh3d) {
        this._createPickupMesh(pk);
      }
      if (pk.mesh3d) {
        pk.mesh3d.position.set(pk.x, 0, pk.y);
        // Flutuação
        pk.mesh3d.position.y = Math.sin(pk.t * 0.1) * 2;
      }
    }

    // Sincronizar partículas
    for (const pt of this.particles) {
      if (!pt.mesh3d) {
        this._createParticleMesh(pt);
      }
      if (pt.mesh3d) {
        pt.mesh3d.position.set(pt.x, 2, pt.y);
        const alpha = pt.life / pt.maxLife;
        pt.mesh3d.scale.setScalar(alpha);
        if (pt.mesh3d.material) pt.mesh3d.material.opacity = alpha;
      }
    }

    // Sincronizar boss
    if (this.boss && !this.boss.dead && this.boss.mesh3d) {
      this.boss.mesh3d.position.set(this.boss.x, 0, this.boss.y);
      if (this.boss.hit > 0) {
        this.boss.mesh3d.position.x += (Math.random() - 0.5) * 0.5;
      }
    }

    // Animar água
    World3D.update(performance.now() * 0.001);
  },

  _render3D() {
    // Câmara segue o jogador
    if (this.player) {
      Engine3D.setCameraTarget(this.player.x, 0, this.player.y);
    }
    Engine3D.render();

    // Desenhar overlay 2D (joystick + reactions)
    if (this._overlayCtx) {
      const ctx = this._overlayCtx;
      const w = this._overlayCanvas.width;
      const h = this._overlayCanvas.height;
      ctx.clearRect(0, 0, w, h);

      // Joysticks
      Joystick.draw(ctx, w, h);

      // Mensagem de onda entre waves
      if (WaveSystem.betweenWaves) {
        const secs = Math.ceil(WaveSystem.betweenTimer / 60);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(w * 0.06)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ONDA ' + (WaveSystem.wave + 1) + ' EM ' + secs + '...', w / 2, h / 2);
      }

      // Reações emoji (2D overlay) — converte world→screen
      const cam = this.cam;
      for (const pt of this.particles) {
        if (pt instanceof ReactionParticle && !pt.dead) {
          const sx = pt.x - cam.vx;
          const sy = pt.y - cam.vy;
          if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) continue;
          const alpha = Math.min(1, pt.life / (pt.maxLife * 0.3));
          const scale = 0.6 + 0.4 * Math.min(1, (pt.maxLife - pt.life) / 10);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = `${Math.round(24 * scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pt.emoji, sx, sy);
          ctx.restore();
        }
      }
    }
  },

  // ── Criar meshes 3D ──

  _createPlayerMesh(player) {
    const mesh = Model3D.createChibi(player.data.color, 22, {
      bodyColor: player.data.color
    });
    mesh.position.set(player.x, 0, player.y);
    this._entityGroup.add(mesh);
    player.mesh3d = mesh;
  },

  _createEnemyMesh(enemy) {
    const mesh = Model3D.createEnemy(enemy.type, enemy.color, enemy.size * 1.1);
    mesh.position.set(enemy.x, 0, enemy.y);
    this._entityGroup.add(mesh);
    enemy.mesh3d = mesh;
  },

  _createBossMesh(boss) {
    const mesh = Model3D.createBoss(boss.color, boss.colorAlt, boss.size, {
      phase2: boss.phase === 2,
      eyeColor: boss.phase === 2 ? 0xffff00 : 0xffffff,
      pupilColor: new THREE.Color(boss.colorAlt).getHex()
    });
    mesh.position.set(boss.x, 0, boss.y);
    this._entityGroup.add(mesh);
    boss.mesh3d = mesh;
  },

  _createProjectileMesh(proj) {
    const mesh = Model3D.createProjectile(proj.color, 3);
    mesh.position.set(proj.x, 2, proj.y);
    this._entityGroup.add(mesh);
    proj.mesh3d = mesh;
  },

  _createPickupMesh(pickup) {
    const mesh = Model3D.createPickup(pickup.type);
    mesh.position.set(pickup.x, 0, pickup.y);
    this._entityGroup.add(mesh);
    pickup.mesh3d = mesh;
  },

  _createParticleMesh(pt) {
    if (pt instanceof ReactionParticle) return; // Reações são 2D (emojis)
    const mesh = Model3D.createParticle(pt.color, pt.size);
    mesh.position.set(pt.x, 2, pt.y);
    this._entityGroup.add(mesh);
    pt.mesh3d = mesh;
  },
};

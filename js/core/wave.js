// ── SISTEMA DE ONDAS ─────────────────────────────────────────────────
const WaveSystem = {
  wave: 1,
  enemiesPerWave: 10,
  enemiesLeft: 10,
  enemiesSpawned: 0,
  spawnTimer: 0,
  spawnInterval: 90,
  waveComplete: false,
  betweenWaves: false,
  betweenTimer: 0,
  BETWEEN_DURATION: 180,
  maxWaves: 3,        // definido ao iniciar (vem da zona)
  bossSpawned: false, // flag para não spawnar boss duas vezes
  isFinalMission: true, // só a última missão de cada zona tem boss

  reset() {
    this.wave = 1;
    this.enemiesLeft    = this.enemiesPerWave;
    this.enemiesSpawned = 0;
    this.spawnTimer     = 0;
    this.waveComplete   = false;
    this.betweenWaves   = false;
    this.betweenTimer   = 0;
    this.bossSpawned    = false;
  },

  startWave(n) {
    this.wave = n;
    this.enemiesPerWave = 10 + (n - 1) * 3;
    this.enemiesLeft    = this.enemiesPerWave;
    this.enemiesSpawned = 0;
    this.spawnTimer     = 0;
    this.waveComplete   = false;
    this.betweenWaves   = false;
  },

  maxTier() { return Math.min(3, Math.floor((this.wave - 1) / 2)); },

  update(dt, game) {
    // Boss em combate — não spawnar mais ondas nem fechar a missão
    if (this.bossSpawned) return;

    if (this.betweenWaves) {
      this.betweenTimer -= dt;
      if (this.betweenTimer <= 0) {
        this.startWave(this.wave + 1);
        game.showMsg('ONDA ' + this.wave + '!', 120);
      }
      return;
    }

    if (this.waveComplete) return;

    // Spawn progressivo de inimigos normais
    if (this.enemiesSpawned < this.enemiesPerWave) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnInterval;
        const tier = Utils.randInt(0, this.maxTier());
        game.enemies.push(new Enemy(tier));
        this.enemiesSpawned++;
      }
    }

    // Verifica se onda acabou
    if (this.enemiesSpawned >= this.enemiesPerWave && game.enemies.filter(e => !e.dead).length === 0) {
      // Última onda da missão?
      if (this.wave >= this.maxWaves) {
        const bossKey = game._bossKeyForMission ? game._bossKeyForMission() : null;
        if (this.isFinalMission && bossKey) {
          this.bossSpawned = true;
          this.waveComplete = false; // não completa ainda — espera pelo boss
          game._spawnBoss(bossKey);
          return;
        }
        // Missão sem boss (missões intermédias ou zona sem boss) → vitória
        game._completeMission();
        return;
      }

      this.waveComplete  = true;
      this.betweenWaves  = true;
      this.betweenTimer  = this.BETWEEN_DURATION;
      game.onWaveComplete(this.wave);
    }
  },

  getProgress() {
    const killed = this.enemiesSpawned - (GameScene.enemies ? GameScene.enemies.filter(e=>!e.dead).length : 0);
    return { wave: this.wave, killed: Math.max(0, killed), total: this.enemiesPerWave };
  },
};

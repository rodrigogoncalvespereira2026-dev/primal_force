const ENEMY_TYPES = [
  { name: 'Drone',    color: '#5f5e5a', hp: 35,  speed: 1.3, size: 11, dmg: 8,  score: 50,  label: 'D' },
  { name: 'Soldado',  color: '#3c3489', hp: 60,  speed: 1.0, size: 14, dmg: 14, score: 90,  label: 'S' },
  { name: 'Elite',    color: '#993556', hp: 120, speed: 0.8, size: 17, dmg: 22, score: 160, label: 'E' },
  { name: 'General',  color: '#633806', hp: 250, speed: 0.6, size: 22, dmg: 35, score: 400, label: 'G' },
];

class Enemy {
  constructor(type = 0) {
    const t = ENEMY_TYPES[type];
    const pos = Utils.spawnEdge(World.W, World.H, 60, (x, y) => World.isSolid(x, y));
    Object.assign(this, t, pos);
    this.maxHp = t.hp;
    this.dead  = false;
    this.hit   = 0;
    this.type  = type;
  }

  update(dt, player, game) {
    if (this.dead) return;
    if (this.hit > 0) this.hit -= dt;

    // Move em direção ao player (com colisão contra paredes)
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d  = Math.sqrt(dx * dx + dy * dy);

    if (d > 1) {
      const n = Utils.normalize(dx, dy);
      const spd = this.speed * dt;
      const nx = Utils.clamp(this.x + n.x * spd, this.size, World.W - this.size);
      const ny = Utils.clamp(this.y + n.y * spd, this.size, World.H - this.size);
      if (!World.isSolid(nx, this.y)) this.x = nx;
      if (!World.isSolid(this.x, ny)) this.y = ny;
    }

    // Colisão com player
    if (d < this.size + player.size + 2) {
      player.takeDamage(this.dmg * dt * 0.08, game);
    }
  }

  takeDamage(dmg, game) {
    this.hp -= dmg;
    this.hit = 14;
    if (this.hp <= 0) this.die(game);
  }

  die(game) {
    if (this.dead) return;
    this.dead = true;
    game.onEnemyKill(this);
  }

  draw(ctx, cam) {
    if (this.dead) return;
    const sx = Renderer.screenX(this.x, this.y, cam);
    const sy = Renderer.screenY(this.x, this.y, cam);
    const vw = ctx.canvas.width, vh = ctx.canvas.height;
    if (sx < -80 || sx > vw + 80 || sy < -80 || sy > vh + 80) return;

    ctx.save();
    if (this.hit > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(this.hit * 1.8));

    const enemySize = this.size * 1.1;
    Renderer.enemyChibi(ctx, sx, sy, enemySize, this.color, {
      eyeColor: this.type === 3 ? '#ff4444' : '#ffff44'
    });

    // Barra de HP
    const bw = this.size * 2 + 4;
    const barY = sy - enemySize * 0.6;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(sx - bw / 2, barY, bw, 4);
    ctx.fillStyle = this.hp > this.maxHp * 0.5 ? '#3cb371' : '#e24b4a';
    ctx.fillRect(sx - bw / 2, barY, bw * (this.hp / this.maxHp), 4);

    ctx.restore();
  }
}

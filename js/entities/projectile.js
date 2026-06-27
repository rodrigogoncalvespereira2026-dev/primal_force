// ── PROJÉTIL ────────────────────────────────────────────────────────
class Projectile {
  constructor(x, y, vx, vy, color, dmg, life = 70) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.dmg   = dmg;
    this.life  = life;
    this.dead  = false;
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }

    for (const e of game.enemies) {
      if (e.dead) continue;
      if (Utils.dist(this, e) < e.size + 6) {
        e.takeDamage(this.dmg, game);
        game.spawnParticles(e.x, e.y, this.color, 8);
        this.dead = true;
        return;
      }
    }
  }

  draw(ctx, cam) {
    const sx = Renderer.screenX(this.x, this.y, cam);
    const sy = Renderer.screenY(this.x, this.y, cam);
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.color + '44';
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
  }
}

// ── PARTÍCULA ────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color, size) {
    this.x = x; this.y = y;
    this.color = color;
    this.size  = size || Utils.randRange(2, 5);
    const spd  = Utils.randRange(1, 4);
    const ang  = Math.random() * Math.PI * 2;
    this.vx = Math.cos(ang) * spd;
    this.vy = Math.sin(ang) * spd;
    this.life = Utils.randRange(25, 45);
    this.maxLife = this.life;
    this.dead  = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx, cam) {
    const sx = Renderer.screenX(this.x, this.y, cam);
    const sy = Renderer.screenY(this.x, this.y, cam);
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── REACTION EMOJI ────────────────────────────────────────────────
class ReactionParticle {
  constructor(x, y, emoji) {
    this.x = x; this.y = y;
    this.emoji = emoji;
    this.vy = -1.5;
    this.life = 90;
    this.maxLife = 90;
    this.dead = false;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.vy *= 0.97;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx, cam) {
    const sx = Renderer.screenX(this.x, this.y, cam);
    const sy = Renderer.screenY(this.x, this.y, cam);
    const alpha = Math.min(1, this.life / (this.maxLife * 0.3));
    const scale = 0.6 + 0.4 * Math.min(1, (this.maxLife - this.life) / 10);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${Math.round(24 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, sx, sy);
    ctx.restore();
  }
}

// ── PICKUP ─────────────────────────────────────────────────────────
class Pickup {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.type = type; // 'hp' | 'power' | 'score'
    this.t    = 0;
    this.dead = false;
  }

  update(dt, player, game) {
    this.t += dt;
    if (Utils.dist(this, player) < 22) {
      if (this.type === 'hp')    { player.hp    = Math.min(player.maxHp,    player.hp    + 30); game.showMsg('+30 HP', 40); }
      if (this.type === 'power') { player.power = Math.min(player.maxPower, player.power + 35); game.showMsg('+35 PODER', 40); }
      if (this.type === 'score') { game.score += 200; game.updateScoreEl(); game.showMsg('+200 PTS', 40); }
      this.dead = true;
    }
  }

  draw(ctx, cam) {
    const sx = Renderer.screenX(this.x, this.y, cam);
    const sy = Renderer.screenY(this.x, this.y, cam) + Math.sin(this.t * 0.1) * 4;
    const col = this.type === 'hp' ? '#e24b4a' : this.type === 'power' ? '#378add' : '#fac775';
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type === 'hp' ? '♥' : this.type === 'power' ? '★' : '$', sx, sy + 1);
  }
}

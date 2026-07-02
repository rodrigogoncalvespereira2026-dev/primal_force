// ── SISTEMA DE BOSSES ─────────────────────────────────────────────────
// Bosses: Maltherion, Valtherion, Vordax, Lorde Arcano
// Aparecem aleatoriamente no final de qualquer zona

const BOSS_TYPES = {
  maltherion: {
    name: 'Maltherion',
    title: 'Robô Gémeo das Trevas',
    color: '#8a2de0',
    colorAlt: '#5500aa',
    emoji: '🤖',
    hp: 1200,
    speed: 1.1,
    size: 38,
    attack: 28,
    score: 2000,
    phase2Threshold: 0.5,
    dialogKey: 'boss_maltherion',
  },
  valtherion: {
    name: 'Valtherion',
    title: 'Robô Gémeo do Caos',
    color: '#e05a00',
    colorAlt: '#aa2200',
    emoji: '🦾',
    hp: 1200,
    speed: 1.3,
    size: 38,
    attack: 32,
    score: 2000,
    phase2Threshold: 0.5,
    dialogKey: 'boss_valtherion',
  },
  vordax: {
    name: 'Vordax',
    title: 'O Portador de Vido',
    color: '#20a050',
    colorAlt: '#fac775',
    emoji: '👁️',
    hp: 900,
    speed: 1.6,
    size: 34,
    attack: 22,
    score: 1800,
    phase2Threshold: 0.35,
    dialogKey: 'boss_vordax',
  },
  arcano: {
    name: 'Lorde Arcano',
    title: 'O Senhor das Trevas',
    color: '#d4af37',
    colorAlt: '#8b0000',
    emoji: '💀',
    hp: 2500,
    speed: 0.9,
    size: 45,
    attack: 40,
    score: 5000,
    phase2Threshold: 0.5,
    dialogKey: 'boss_arcano',
  },
};

class Boss {
  constructor(typeKey) {
    const t = BOSS_TYPES[typeKey];
    this.typeKey   = typeKey;
    this.type      = t;
    this.name      = t.name;
    this.color     = t.color;
    this.colorAlt  = t.colorAlt;
    this.size      = t.size;
    this.hp        = t.hp;
    this.maxHp     = t.hp;
    this.speed     = t.speed;
    this.attack    = t.attack;
    this.score     = t.score;
    this.dead      = false;
    this.hit       = 0;
    this.phase     = 1;
    this.phase2Done = false;

    // Posição — spawn na borda do mapa
    const pos = Utils.spawnEdge(World.W, World.H, 60, (x, y) => World.isSolid(x, y));
    this.x = pos.x;
    this.y = pos.y;

    // Timers de ataque
    this.attackTimer  = 0;
    this.specialTimer = 0;
    this.dashTimer    = 0;
    this.dashVx = 0;
    this.dashVy = 0;

    // Animação
    this.animT    = 0;
    this.shakeT   = 0;
    this.warningT = 0; // aviso antes de ataque especial

    // Projéteis do boss
    this.projectiles = [];
  }

  update(dt, player, game) {
    if (this.dead) return;
    if (this.hit > 0) this.hit -= dt;
    this.animT += dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.warningT > 0) this.warningT -= dt;

    // Verificar entrada na fase 2
    if (!this.phase2Done && this.hp / this.maxHp <= this.type.phase2Threshold) {
      this._enterPhase2(game);
    }

    // Dash (se ativo)
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      const dx = this.dashVx * dt;
      const dy = this.dashVy * dt;
      const nx = Utils.clamp(this.x + dx, this.size, World.W - this.size);
      const ny = Utils.clamp(this.y + dy, this.size, World.H - this.size);
      if (!World.isSolid(nx, this.y)) this.x = nx;
      if (!World.isSolid(this.x, ny)) this.y = ny;
      return;
    }

    // Movimento em direção ao player (com colisão contra paredes)
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    const spd = this.speed * (this.phase === 2 ? 1.4 : 1.0);

    if (d > this.size + player.size + 5) {
      const n = Utils.normalize(dx, dy);
      const nx = Utils.clamp(this.x + n.x * spd * dt, this.size, World.W - this.size);
      const ny = Utils.clamp(this.y + n.y * spd * dt, this.size, World.H - this.size);
      if (!World.isSolid(nx, this.y)) this.x = nx;
      if (!World.isSolid(this.x, ny)) this.y = ny;
    }

    // Colisão corpo-a-corpo
    if (d < this.size + player.size + 4) {
      player.takeDamage(this.attack * dt * 0.06, game);
    }

    // Ataques especiais por tipo
    this.attackTimer  -= dt;
    this.specialTimer -= dt;

    if (this.attackTimer <= 0) {
      this._doRangedAttack(player, game);
      this.attackTimer = (this.phase === 2) ? 60 : 90;
    }

    if (this.specialTimer <= 0) {
      this._doSpecialAttack(player, game);
      this.specialTimer = (this.phase === 2) ? 200 : 280;
    }
  }

  _doRangedAttack(player, game) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d  = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    switch (this.typeKey) {
      case 'maltherion': {
        // Salva de 3 projéteis em leque
        for (let i = -1; i <= 1; i++) {
          const ang = Math.atan2(dy, dx) + i * 0.25;
          game.projectiles.push(new BossProjectile(
            this.x, this.y, Math.cos(ang) * 8, Math.sin(ang) * 8,
            this.color, this.attack * 0.8, 35, 7
          ));
        }
        break;
      }
      case 'valtherion': {
        // Projétil rápido único + rastro de fogo
        const ang = Math.atan2(dy, dx);
        game.projectiles.push(new BossProjectile(
          this.x, this.y, Math.cos(ang) * 12, Math.sin(ang) * 12,
          this.color, this.attack, 28, 9
        ));
        break;
      }
      case 'vordax': {
        // Projéteis espiral
        const baseAng = Math.atan2(dy, dx);
        for (let i = 0; i < 4; i++) {
          const ang = baseAng + (Math.PI / 2) * i;
          game.projectiles.push(new BossProjectile(
            this.x, this.y, Math.cos(ang) * 7, Math.sin(ang) * 7,
            this.color, this.attack * 0.7, 32, 6
          ));
        }
        break;
      }
      case 'arcano': {
        // 6 projéteis em círculo
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI * 2 / 6) * i + this.animT * 0.02;
          game.projectiles.push(new BossProjectile(
            this.x, this.y, Math.cos(ang) * 9, Math.sin(ang) * 9,
            this.color, this.attack * 0.9, 30, 10
          ));
        }
        break;
      }
    }
    game.spawnParticles(this.x, this.y, this.color, 5);
  }

  _doSpecialAttack(player, game) {
    this.warningT = 30;
    this.shakeT   = 20;
    game.showMsg('⚠️ ' + this.name + ' — ATAQUE ESPECIAL!', 90);

    switch (this.typeKey) {
      case 'maltherion': {
        // Dash em direção ao player, deixando projéteis no caminho
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const d  = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        this.dashVx = (dx / d) * 14;
        this.dashVy = (dy / d) * 14;
        this.dashTimer = 16;
        // Deixa rastro de projéteis
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            if (!this.dead) {
              game.projectiles.push(new BossProjectile(
                this.x, this.y, (Math.random()-0.5)*6, (Math.random()-0.5)*6,
                this.colorAlt, this.attack * 1.2, 20, 8
              ));
            }
          }, i * 60);
        }
        break;
      }
      case 'valtherion': {
        // Explosão em área — anel de projéteis
        for (let i = 0; i < 12; i++) {
          const ang = (Math.PI * 2 / 12) * i;
          game.projectiles.push(new BossProjectile(
            this.x, this.y, Math.cos(ang) * 10, Math.sin(ang) * 10,
            this.colorAlt, this.attack * 1.5, 22, 12
          ));
        }
        game.spawnParticles(this.x, this.y, this.colorAlt, 40);
        break;
      }
      case 'vordax': {
        // Chama Vido — paralisa o player brevemente
        game.showMsg('💛 VIDO: "Roro... foge..."', 120);
        player.invincible = 0; // cancela invencibilidade
        player.speed *= 0.4;
        setTimeout(() => { player.speed = player.data.speed * (player.speedMult || 1); }, 2000);
        // E dispara onda de projéteis
        for (let i = 0; i < 8; i++) {
          const ang = (Math.PI * 2 / 8) * i;
          game.projectiles.push(new BossProjectile(
            this.x, this.y, Math.cos(ang) * 8, Math.sin(ang) * 8,
            '#fac775', this.attack, 26, 8
          ));
        }
        break;
      }
      case 'arcano': {
        // Invoca 4 soldados de elite
        for (let i = 0; i < 4; i++) {
          const e = new Enemy(2); // Elite
          e.x = this.x + Math.cos((Math.PI/2)*i) * 80;
          e.y = this.y + Math.sin((Math.PI/2)*i) * 80;
          game.enemies.push(e);
          WaveSystem.enemiesLeft++;
          WaveSystem.enemiesSpawned++;
        }
        game.spawnParticles(this.x, this.y, this.color, 50);
        break;
      }
    }
  }

  _enterPhase2(game) {
    this.phase2Done = true;
    this.phase = 2;
    this.shakeT = 60;
    game.showMsg('⚡ ' + this.name.toUpperCase() + ' — FASE 2!', 150);
    game.spawnParticles(this.x, this.y, this.colorAlt, 60);

    // Cura ligeira e fica mais agressivo
    switch (this.typeKey) {
      case 'maltherion':
        game.showMsg('⚡ MALTHERION SOBRECARREGADO — LASERS DUPLOS!', 150);
        break;
      case 'valtherion':
        game.showMsg('🔥 VALTHERION EM FÚRIA — VELOCIDADE MÁXIMA!', 150);
        break;
      case 'vordax':
        game.showMsg('💛 VIDO ESTÁ A RESISTIR! VORDAX ENLOUQUECEU!', 150);
        this.color = '#fac775'; // fica dourado (Vido a lutar por dentro)
        break;
      case 'arcano':
        game.showMsg('💀 LORDE ARCANO — PODER FINAL DESENCADEADO!', 150);
        this.speed = 1.5;
        break;
    }
  }

  takeDamage(dmg, game) {
    this.hp -= dmg;
    this.hit = 12;
    this.shakeT = 8;
    if (this.hp <= 0) this.die(game);
  }

  die(game) {
    if (this.dead) return;
    this.dead = true;
    game.onBossKill(this);
  }

  draw(ctx, cam) {
    if (this.dead) return;
    const sx = Renderer.screenX(this.x, this.y, cam) + (this.shakeT > 0 ? (Math.random()-0.5)*8 : 0);
    const sy = Renderer.screenY(this.x, this.y, cam);
    const vw = ctx.canvas.width, vh = ctx.canvas.height;
    if (sx < -120 || sx > vw + 120 || sy < -120 || sy > vh + 120) return;

    ctx.save();
    if (this.hit > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(this.hit * 1.8));

    const pulse = Math.sin(this.animT * 0.08) * 3;
    const chibiSize = this.size + pulse;

    // Aviso de ataque especial
    if (this.warningT > 0) {
      ctx.beginPath();
      ctx.arc(sx, sy, chibiSize * 0.8 + 30 + (30 - this.warningT), 0, Math.PI * 2);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.globalAlpha = this.warningT / 30 * 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const bossOpt = {
      eyeColor: this.phase === 2 ? '#ff0' : '#fff',
      pupilColor: this.colorAlt,
      phase2: this.phase === 2,
      animT: this.animT,
      angry: true
    };
    Renderer.bossChibi(ctx, sx, sy, chibiSize, this.color, this.colorAlt, bossOpt);

    ctx.restore();

    this._drawHPBar(ctx, sx, sy);
    this._drawNameTag(ctx, sx, sy);
  }

  _drawHPBar(ctx, sx, sy) {
    const bw = 140;
    const bh = 10;
    const bx = sx - bw / 2;
    const by = sy - 70;

    ctx.save();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(bx - 2, by - 2, bw + 4, bh + 4, 4);
    ctx.fill();

    const pct = Math.max(0, this.hp / this.maxHp);
    const barColor = pct > 0.5 ? '#3cb371' : pct > this.type.phase2Threshold ? '#e0a020' : '#e24b4a';
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw * pct, bh, 3);
    ctx.fill();

    const ph2x = bx + bw * this.type.phase2Threshold;
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(ph2x, by - 2);
    ctx.lineTo(ph2x, by + bh + 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(this.hp) + ' / ' + this.maxHp, sx, by + bh / 2);
    ctx.restore();
  }

  _drawNameTag(ctx, sx, sy) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText(this.name, sx, sy - 56);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = this.phase === 2 ? '#ff8888' : '#ccc';
    ctx.fillText(this.phase === 2 ? '⚡ FASE 2' : this.type.title, sx, sy - 44);
    ctx.restore();
  }
}

// Projétil do boss (diferente dos projéteis do player)
class BossProjectile {
  constructor(x, y, vx, vy, color, dmg, life, size = 6) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.dmg  = dmg;
    this.life = life;
    this.size = size;
    this.dead = false;
  }

  update(dt, game) {
    if (this.dead) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }

    // Colisão com player
    const p = game.player;
    if (Utils.dist(this, p) < this.size + p.size) {
      p.takeDamage(this.dmg * 0.5, game);
      this.dead = true;
    }
  }

  draw(ctx, cam) {
    if (this.dead) return;
    const sx = Renderer.screenX(this.x, this.y, cam);
    const sy = Renderer.screenY(this.x, this.y, cam);
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Lista dos 4 bosses para spawn aleatório
const BOSS_POOL = ['maltherion', 'valtherion', 'vordax', 'arcano'];

function pickRandomBoss() {
  return BOSS_POOL[Math.floor(Math.random() * BOSS_POOL.length)];
}

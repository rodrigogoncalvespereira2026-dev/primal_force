const RANGERS_DATA = [
  { id:'roro',     name:'Roro',     title:'Red Ranger',    zord:'T-Rex',        color:'#e24b4a', emoji:'🦖', speed:3.8, maxHp:120, maxPower:100, attack:30, defense:10, specialName:'Rugido do T-Rex',   specialDesc:'Ataque em área massivo',              laserColor:'#ff8080', laserRange:220 },
  { id:'mar',      name:'Mar',      title:'Black Ranger',  zord:'Stegossauro',  color:'#888',    emoji:'🦕', speed:3.0, maxHp:160, maxPower:80,  attack:35, defense:20, specialName:'Cauda de Aço',      specialDesc:'Atordoa todos os inimigos próximos',  laserColor:'#ccc',    laserRange:180 },
  { id:'marc',     name:'Marc',     title:'Blue Ranger',   zord:'Triceratops',  color:'#378add', emoji:'🦏', speed:3.5, maxHp:130, maxPower:120, attack:25, defense:15, specialName:'Carga de Corno',    specialDesc:'Dash que destrói inimigos no caminho',laserColor:'#80c0ff', laserRange:200 },
  { id:'vido',     name:'Vido',     title:'Gold Ranger',   zord:'Pterodáctilo', color:'#fac775', emoji:'🦅', speed:4.5, maxHp:90,  maxPower:110, attack:28, defense:8,  specialName:'Mergulho Dourado',  specialDesc:'Ataque aéreo de alta velocidade',     laserColor:'#ffd700', laserRange:260 },
  { id:'mira',     name:'Mira',     title:'Purple Ranger', zord:'Plesiosauros', color:'#af56f5', emoji:'🌊', speed:3.2, maxHp:110, maxPower:140, attack:22, defense:12, specialName:'Onda Arcana',       specialDesc:'Projétil que atravessa inimigos',     laserColor:'#d080ff', laserRange:300 },
  { id:'zenowing', name:'Zenowing', title:'Silver Ranger', zord:'Titanossauro', color:'#c0c0c0', emoji:'⚔️', speed:3.3, maxHp:140, maxPower:90,  attack:40, defense:18, specialName:'Lâmina do Titã',    specialDesc:'Corte devastador em linha reta',      laserColor:'#e0e0e0', laserRange:240 },
];

class Ranger {
  constructor(data) {
    this.data     = data;
    this.x        = World.W/2; this.y=World.H/2;
    this.size     = 16;
    this.facing   = 0;
    this.speed    = data.speed;
    this.speedMult= 1;
    this.hp       = data.maxHp;   this.maxHp    = data.maxHp;
    this.power    = 60;            this.maxPower = data.maxPower;
    this.cdMelee=0; this.cdLaser=0; this.cdSpecial=0; this.cdShield=0; this.cdZord=0;
    this.invincible=0;
    this.shielded=false; this.shieldTimer=0;
    this.zordActive=false; this.zordTimer=0;
    this.dashVx=0; this.dashVy=0; this.dashTimer=0;
  }

  // Só timers — movimento feito no game.js para integrar joystick
  updateTimers(dt, game) {
    if(this.cdMelee>0)   this.cdMelee-=dt;
    if(this.cdLaser>0)   this.cdLaser-=dt;
    if(this.cdSpecial>0) this.cdSpecial-=dt;
    if(this.cdShield>0)  this.cdShield-=dt;
    if(this.cdZord>0)    this.cdZord-=dt;
    if(this.invincible>0)this.invincible-=dt;
    if(this.shieldTimer>0){this.shieldTimer-=dt; if(this.shieldTimer<=0)this.shielded=false;}
    if(this.zordTimer>0)  {this.zordTimer-=dt;   if(this.zordTimer<=0){this.zordActive=false; game.showMsg('Zord desativado',60);}}
    this.power=Math.min(this.maxPower, this.power+0.025*dt);
  }

  doMelee(game) {
    if(this.cdMelee>0) return;
    this.cdMelee=22;
    this.power=Math.min(this.maxPower,this.power+4);
    let hit=false;
    for(const e of game.enemies){
      if(e.dead) continue;
      if(Utils.dist(this,e)<60+e.size){
        e.takeDamage(this.data.attack+game.combo*2,game);
        hit=true;
        game.spawnParticles(e.x,e.y,'#ff6060',8);
      }
    }
    hit ? game.addCombo() : game.resetCombo();
    game.spawnParticles(this.x+Math.cos(this.facing)*36,this.y+Math.sin(this.facing)*36,this.data.color,5);
    Engine3D.shake(hit ? 2 : 0.5);
  }

  doLaser(game) {
    if(this.cdLaser>0||this.power<12) return;
    this.cdLaser=18;
    this.power-=12;

    let nearest = null;
    let nearDist = Infinity;
    for (const e of game.enemies) {
      if (e.dead) continue;
      const d = Utils.dist(this, e);
      if (d < nearDist) { nearDist = d; nearest = e; }
    }
    if (nearest) this.facing = Math.atan2(nearest.y - this.y, nearest.x - this.x);

    const range = this.data.laserRange || 220;
    game.projectiles.push(new Projectile(
      this.x,this.y,
      Math.cos(this.facing)*11, Math.sin(this.facing)*11,
      this.data.laserColor, this.data.attack*1.5,
      range/11
    ));
    Engine3D.shake(1.5);
  }

  doShield(game) {
    if(this.cdShield>0||this.power<18) return;
    this.cdShield=180; this.power-=18;
    this.shielded=true; this.shieldTimer=130;
    game.showMsg('ESCUDO ATIVADO!',60);
  }

  doSpecial(game) {
    if(this.cdSpecial>0||this.power<35) return;
    this.cdSpecial=240; this.power-=35;
    this.dashVx=Math.cos(this.facing)*6;
    this.dashVy=Math.sin(this.facing)*6;
    this.dashTimer=18;
    game.showMsg(this.data.specialName.toUpperCase()+'!',80);
    game.spawnParticles(this.x,this.y,this.data.color,20);
    this.invincible=20;
    Engine3D.shake(3);
  }

  doZord(game) {
    if(this.cdZord>0||this.power<65){game.showMsg('Poder insuficiente!',50);return;}
    this.cdZord=480; this.power-=65;
    this.zordActive=true; this.zordTimer=320;
    game.showMsg('ZORD '+this.data.zord.toUpperCase()+' ATIVADO!',100);
    game.spawnParticles(this.x,this.y,this.data.color,40);
    for(const e of game.enemies){if(!e.dead){e.takeDamage(this.data.attack*2.5,game);game.spawnParticles(e.x,e.y,this.data.color,14);}}
    Engine3D.shake(5);
  }

  takeDamage(dmg,game) {
    if(this.invincible>0) return;
    if(this.shielded){game.spawnParticles(this.x,this.y,'#378add',8);game.showMsg('BLOQUEADO!',30);return;}
    this.hp-=dmg; this.invincible=55;
    game.spawnParticles(this.x,this.y,'#ff4444',6);
    Engine3D.shake(4);
    if(this.hp<=0){this.hp=0;game.onPlayerDeath();}
  }

  draw(ctx,cam) {
    const sx = Renderer.screenX(this.x, this.y, cam);
    const sy = Renderer.screenY(this.x, this.y, cam);

    ctx.save();
    if(this.invincible>0&&Math.floor(this.invincible/5)%2===1) ctx.globalAlpha=0.35;
    if(this.zordActive) {
      ctx.fillStyle=this.data.color+'22';
      ctx.beginPath();ctx.arc(sx,sy,60,0,Math.PI*2);ctx.fill();
    }
    if(this.shielded){
      ctx.strokeStyle='#378add';
      ctx.lineWidth=2.5;
      ctx.beginPath();ctx.arc(sx,sy,this.size+12,0,Math.PI*2);
      ctx.stroke();
    }

    const chibiSize = this.zordActive ? 28 : 22;
    Renderer.chibi(ctx, sx, sy, chibiSize, this.data.color, {
      bodyColor: this.data.color,
      squint: this.dashTimer > 0
    });

    ctx.restore();
  }
}

const RANGERS_DATA = [
  { id:'roro',     name:'Roro',     title:'Red Ranger',    zord:'T-Rex',        color:'#e24b4a', emoji:'🦖', speed:3.8, maxHp:120, maxPower:100, attack:30, defense:10, specialName:'Rugido do T-Rex',   specialDesc:'Ataque em área massivo',              laserColor:'#ff8080', laserRange:220, modelPath:'models/roro.glb' },
  { id:'mar',      name:'Mar',      title:'Black Ranger',  zord:'Stegossauro',  color:'#888',    emoji:'🦕', speed:3.0, maxHp:160, maxPower:80,  attack:35, defense:20, specialName:'Cauda de Aço',      specialDesc:'Atordoa todos os inimigos próximos',  laserColor:'#ccc',    laserRange:180, modelPath:'models/mar.glb' },
  { id:'marc',     name:'Marc',     title:'Blue Ranger',   zord:'Triceratops',  color:'#378add', emoji:'🦏', speed:3.5, maxHp:130, maxPower:120, attack:25, defense:15, specialName:'Carga de Corno',    specialDesc:'Dash que destrói inimigos no caminho',laserColor:'#80c0ff', laserRange:200, modelPath:'models/marc.glb' },
  { id:'vido',     name:'Vido',     title:'Gold Ranger',   zord:'Pterodáctilo', color:'#fac775', emoji:'🦅', speed:4.5, maxHp:90,  maxPower:110, attack:28, defense:8,  specialName:'Mergulho Dourado',  specialDesc:'Ataque aéreo de alta velocidade',     laserColor:'#ffd700', laserRange:260, modelPath:'models/vido.glb' },
  { id:'mira',     name:'Mira',     title:'Purple Ranger', zord:'Plesiosauros', color:'#af56f5', emoji:'🌊', speed:3.2, maxHp:110, maxPower:140, attack:22, defense:12, specialName:'Onda Arcana',       specialDesc:'Projétil que atravessa inimigos',     laserColor:'#d080ff', laserRange:300, modelPath:'models/mira.glb' },
  { id:'zenowing', name:'Zenowing', title:'Silver Ranger', zord:'Titanossauro', color:'#c0c0c0', emoji:'⚔️', speed:3.3, maxHp:140, maxPower:90,  attack:40, defense:18, specialName:'Lâmina do Titã',    specialDesc:'Corte devastador em linha reta',      laserColor:'#e0e0e0', laserRange:240, modelPath:'models/zenowing.glb' },
];

const ENEMY_MODELS = {
  normal: 'models/enemy_normal.glb',
  fast: 'models/enemy_fast.glb',
  tank: 'models/enemy_tank.glb',
  ranged: 'models/enemy_ranged.glb'
};

const BOSS_MODELS = {
  dragon: 'models/boss_dragon.glb',
  robot: 'models/boss_robot.glb',
  wizard: 'models/boss_wizard.glb',
  demon: 'models/boss_demon.glb'
};

// Chave do BOSS_TYPES → chave do BOSS_MODELS
const BOSS_MODEL_BY_TYPE = {
  maltherion: 'robot',
  valtherion: 'demon',
  vordax: 'dragon',
  arcano: 'wizard'
};

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
    this.mesh3d = null;
    this._walkTimer = 0;
    this._lastX = undefined;
    this._lastY = undefined;
  }

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
    const boss = game.boss;
    if(boss && !boss.dead && Utils.dist(this,boss)<60+boss.size){
      boss.takeDamage(this.data.attack+game.combo*2,game);
      hit=true;
      game.spawnParticles(boss.x,boss.y,'#ff6060',10);
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
    if (game.boss && !game.boss.dead) {
      const d = Utils.dist(this, game.boss);
      if (d < nearDist) { nearDist = d; nearest = game.boss; }
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
    window.sfx && sfx('shoot');
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
    if(game.boss && !game.boss.dead){game.boss.takeDamage(this.data.attack*2.5,game);game.spawnParticles(game.boss.x,game.boss.y,this.data.color,14);}
    Engine3D.shake(5);
  }

  takeDamage(dmg,game) {
    if(this.invincible>0) return;
    if(this.shielded){game.spawnParticles(this.x,this.y,'#378add',8);game.showMsg('BLOQUEADO!',30);return;}
    this.hp-=dmg; this.invincible=55;
    window.sfx && sfx('hurt');
    game.spawnParticles(this.x,this.y,'#ff4444',6);
    Engine3D.shake(4);
    if(this.hp<=0){this.hp=0;game.onPlayerDeath();}
  }
}
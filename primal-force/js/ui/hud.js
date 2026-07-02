const HUD = {
  init(rangerData) {
    document.getElementById('ranger-name-hud').textContent =
      rangerData.name.toUpperCase()+' — '+rangerData.title.toUpperCase();
    document.getElementById('hud-trophies').textContent = Progression.data.trophies;
  },
  update(player, game) {
    document.getElementById('bar-hp').style.width  =(player.hp/player.maxHp*100)+'%';
    document.getElementById('bar-pwr').style.width =(player.power/player.maxPower*100)+'%';
    document.getElementById('hp-num').textContent  =Math.round(player.hp);
    document.getElementById('pwr-num').textContent =Math.round(player.power);
    document.getElementById('hud-trophies').textContent=Progression.data.trophies;
    const comboEl=document.getElementById('combo-display');
    comboEl.textContent=(game.combo>1&&game.comboTimer>0)?'x'+game.combo+' COMBO!':'';
    document.getElementById('msg-box').textContent=game.msgTimer>0?game.msg:'';
    HUD._cd('cd-melee',  player.cdMelee,  22);
    HUD._cd('cd-laser',  player.cdLaser,  18);
    HUD._cd('cd-special',player.cdSpecial,240);
    HUD._cd('cd-shield', player.cdShield, 180);
    HUD._cd('cd-zord',   player.cdZord,   480);

    // Boss HUD
    const boss = game.boss;
    const bossHud = document.getElementById('boss-hud');
    if (bossHud) {
      if (boss && !boss.dead) {
        bossHud.style.display = 'block';
        document.getElementById('boss-hud-name').textContent = boss.name.toUpperCase() + (boss.phase === 2 ? ' ⚡' : '');
        document.getElementById('boss-hud-title').textContent = boss.phase === 2 ? '— FASE 2 —' : boss.type.title;
        const pct = Math.max(0, boss.hp / boss.maxHp);
        const barColor = pct > 0.5 ? '#3cb371' : pct > boss.type.phase2Threshold ? '#e0a020' : '#e24b4a';
        const bar = document.getElementById('boss-hud-bar');
        if (bar) { bar.style.width = (pct * 100) + '%'; bar.style.background = barColor; }
        document.getElementById('boss-hud-hp').textContent = Math.ceil(boss.hp) + ' / ' + boss.maxHp + ' HP';
      } else {
        bossHud.style.display = 'none';
      }
    }
  },
  _cd(id,cur,max) {
    const el=document.getElementById(id);
    if(!el)return;
    if(cur>0){el.style.display='block';el.style.height=(cur/max*100)+'%';el.style.top=0;el.style.background='rgba(0,0,0,0.65)';}
    else el.style.display='none';
  },
  updateMinimap(player,enemies,cam,vw,vh) {
    const mm=document.getElementById('minimap');
    if(!mm)return;
    const mctx=mm.getContext('2d');
    const W=mm.width,H=mm.height;
    const sx=W/World.W,sy=H/World.H;
    mctx.fillStyle='rgba(0,0,0,0.85)';mctx.fillRect(0,0,W,H);
    for(const e of enemies){if(!e.dead){mctx.fillStyle=e.color;mctx.fillRect(e.x*sx-1,e.y*sy-1,3,3);}}
    mctx.fillStyle='#e24b4a';mctx.fillRect(player.x*sx-2,player.y*sy-2,5,5);
    mctx.strokeStyle='rgba(255,255,255,0.25)';mctx.lineWidth=0.5;
    mctx.strokeRect(cam.vx*sx,cam.vy*sy,vw*sx,vh*sy);
  },
};

const WorldMap = {
  selectedZone: null,
  animT: 0,
  _animRaf: null,

  zones: [
    { id:'forest',     name:'Floresta Primordial', emoji:'🌿', x:0.18,y:0.38, color:'#2d7a2d', locked:false,
      waves:3, enemyTier:0, missions:['Elimina 10 inimigos','Derrota o Capitão','Protege o Altar Dino'],
      dialogIntro:'forest_intro', unlocksAfter:null },
    { id:'city',       name:'Cidade em Ruínas',    emoji:'🏚️', x:0.38,y:0.28, color:'#8a7a2d', locked:true,
      waves:4, enemyTier:1, missions:['Varre as ruas','Destrói os canhões','Encontra pista de Vido'],
      dialogIntro:'city_intro', unlocksAfter:'forest' },
    { id:'enemy_base', name:'Base Inimiga',        emoji:'🏭', x:0.63,y:0.22, color:'#8a2d2d', locked:true,
      waves:5, enemyTier:2, missions:['Infiltra a base','Desativa geradores','Resgata Vido!'],
      dialogIntro:'enemy_base_intro', unlocksAfter:'city' },
    { id:'volcano',    name:'Vulcão',              emoji:'🌋', x:0.82,y:0.40, color:'#c85a00', locked:true,
      waves:5, enemyTier:2, missions:['Atravessa a lava','Para os robôs','Enfrenta Valtherion!'],
      dialogIntro:'volcano_intro', unlocksAfter:'enemy_base' },
    { id:'ocean',      name:'Oceano / Costa',      emoji:'🌊', x:0.12,y:0.65, color:'#1a6aaa', locked:true,
      waves:4, enemyTier:1, missions:['Destrói a frota','Mergulha no abismo','Protege a costa'],
      dialogIntro:'ocean_intro', unlocksAfter:'forest' },
    { id:'desert',     name:'Deserto',             emoji:'🏜️', x:0.35,y:0.68, color:'#c8a020', locked:true,
      waves:4, enemyTier:2, missions:['Atravessa a areia','Sobrevive à tempestade','Encontra Vido'],
      dialogIntro:'desert_intro', unlocksAfter:'ocean' },
    { id:'mountains',  name:'Montanhas',           emoji:'⛰️', x:0.65,y:0.68, color:'#888', locked:true,
      waves:5, enemyTier:2, missions:['Escala o pico','Desperta o Titanossauro','Derrota o Guardião'],
      dialogIntro:'mountains_intro', unlocksAfter:'desert' },
    { id:'base',       name:'Base dos Rangers',    emoji:'⚡', x:0.50,y:0.50, color:'#e24b4a', locked:false,
      waves:0, enemyTier:0, missions:['Treino','Arquivo','Plano final'],
      dialogIntro:'base_intro', unlocksAfter:null, isBase:true },
  ],

  completed: {},

  load() {
    try { const s=localStorage.getItem('prf_worldmap'); if(s) this.completed=JSON.parse(s); } catch(e){}
  },
  save() {
    try { localStorage.setItem('prf_worldmap', JSON.stringify(this.completed)); } catch(e){}
  },

  isUnlocked(zone) {
    if (!zone.locked || !zone.unlocksAfter) return true;
    return (this.completed[zone.unlocksAfter]||0) >= 1;
  },

  completeMission(zoneId) {
    this.completed[zoneId] = (this.completed[zoneId]||0) + 1;
    this.save();
  },

  init() {},

  show() {
    this.selectedZone = null;
    if (this._animRaf) cancelAnimationFrame(this._animRaf);
    document.getElementById('wm-trophy-count').textContent = Progression.data.trophies;
    document.getElementById('btn-back-worldmap').onclick = () => {
      if (this._animRaf) cancelAnimationFrame(this._animRaf);
      App.goTo('menu');
    };
    // Painel por defeito
    document.getElementById('wm-panel').innerHTML =
      '<div class="wm-panel-empty">👆 Clica numa zona<br>para ver as missões</div>';
    setTimeout(() => {
      this._setupCanvas();
      this._startAnim();
    }, 30);
  },

  _setupCanvas() {
    const canvas = document.getElementById('wm-canvas');
    if (!canvas) return;
    const panel = document.getElementById('wm-panel');
    const panelW = panel ? panel.offsetWidth : 260;
    canvas.width  = window.innerWidth - panelW;
    canvas.height = window.innerHeight - 60;
    this._drawCanvas();

    // Remove listeners antigos clonando
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);

    newCanvas.addEventListener('click', e => {
      const rect = newCanvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / newCanvas.width;
      const my = (e.clientY - rect.top)  / newCanvas.height;
      for (const z of this.zones) {
        const zx = z.x, zy = z.y;
        const dx = mx - zx, dy = my - zy;
        // Raio de clique normalizado
        const R = 38 / newCanvas.width;
        if (Math.sqrt(dx*dx + dy*dy*((newCanvas.width/newCanvas.height)**2)) < R * 2) {
          this.selectedZone = z;
          this._drawCanvas();
          this._showPanel(z);
          return;
        }
      }
    });
  },

  _startAnim() {
    const loop = () => {
      if (!document.getElementById('screen-worldmap').classList.contains('active')) return;
      this.animT++;
      this._drawCanvas();
      this._animRaf = requestAnimationFrame(loop);
    };
    this._animRaf = requestAnimationFrame(loop);
  },

  _drawCanvas() {
    const canvas = document.getElementById('wm-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#06090f';
    ctx.fillRect(0,0,W,H);

    // Grid decorativa
    ctx.strokeStyle='rgba(255,255,255,0.025)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // Conexões
    const conns=[['forest','city'],['forest','ocean'],['forest','base'],
      ['city','enemy_base'],['city','base'],['city','desert'],
      ['enemy_base','volcano'],['ocean','desert'],['desert','mountains'],['mountains','volcano']];
    for(const [a,b] of conns){
      const za=this.zones.find(z=>z.id===a), zb=this.zones.find(z=>z.id===b);
      if(!za||!zb) continue;
      const unlA=this.isUnlocked(za), unlB=this.isUnlocked(zb);
      ctx.strokeStyle=(unlA&&unlB)?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.07)';
      ctx.lineWidth=2; ctx.setLineDash([6,5]);
      ctx.beginPath(); ctx.moveTo(za.x*W,za.y*H); ctx.lineTo(zb.x*W,zb.y*H); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Nós das zonas
    for(const z of this.zones){
      const cx=z.x*W, cy=z.y*H;
      const unlocked=this.isUnlocked(z);
      const selected=this.selectedZone?.id===z.id;
      const pulse=selected?Math.sin(this.animT*0.07)*5:0;
      const R=32+pulse;

      // Sombra
      ctx.beginPath(); ctx.arc(cx,cy+3,R,0,Math.PI*2);
      ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fill();

      // Círculo
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
      if(unlocked){
        const g=ctx.createRadialGradient(cx-R*0.3,cy-R*0.3,0,cx,cy,R);
        g.addColorStop(0,z.color+'ff'); g.addColorStop(1,z.color+'88');
        ctx.fillStyle=g;
      } else {
        ctx.fillStyle='#2a2a2a';
      }
      ctx.fill();

      // Borda selecionado
      if(selected){
        ctx.strokeStyle='#fff'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(cx,cy,R+5,0,Math.PI*2); ctx.stroke();
        // Glow
        ctx.strokeStyle=z.color+'66'; ctx.lineWidth=8;
        ctx.beginPath(); ctx.arc(cx,cy,R+8,0,Math.PI*2); ctx.stroke();
      }

      // Emoji / ícone
      ctx.font=`${unlocked?22:16}px sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(unlocked?z.emoji:'🔒', cx, cy);

      // Nome da zona
      ctx.fillStyle=unlocked?'#fff':'rgba(255,255,255,0.25)';
      ctx.font=`bold ${Math.max(11,Math.round(W*0.017))}px sans-serif`;
      ctx.fillText(z.name, cx, cy+R+14);

      // Progresso missões
      if(unlocked && z.missions?.length){
        const done=this.completed[z.id]||0;
        ctx.fillStyle=done>=z.missions.length?'#3cb371':'#fac775';
        ctx.font=`${Math.max(10,Math.round(W*0.013))}px sans-serif`;
        ctx.fillText(`${done}/${z.missions.length}`, cx, cy+R+28);
      }
    }
  },

  _showPanel(zone) {
    const panel = document.getElementById('wm-panel');
    if (!panel) return;

    if (!zone) {
      panel.innerHTML = `<div style="color:rgba(255,255,255,0.3);font-size:13px;text-align:center;margin-top:20px">Clica numa zona para ver detalhes</div>`;
      return;
    }

    const unlocked = this.isUnlocked(zone);
    const mDone    = this.completed[zone.id] || 0;

    if (!unlocked) {
      const need = this.zones.find(z=>z.id===zone.unlocksAfter);
      panel.innerHTML = `
        <div class="wm-panel-title">${zone.emoji} ${zone.name}</div>
        <div style="margin-top:12px;padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6">
          🔒 Bloqueado<br><br>Completa <strong style="color:#fff">${need?.name||'?'}</strong> para desbloquear esta zona.
        </div>
      `;
      return;
    }

    const missHTML = zone.missions.map((m,i)=>`
      <div class="wm-mission ${i<mDone?'done':i===mDone?'active':'locked-m'}">
        <span class="wm-mission-icon">${i<mDone?'✅':i===mDone?'▶️':'⬜'}</span>
        <span>${m}</span>
      </div>
    `).join('');

    const canPlay = !zone.isBase && mDone < zone.missions.length;

    panel.innerHTML = `
      <div class="wm-panel-title">${zone.emoji} ${zone.name}</div>
      <div class="wm-panel-progress">${mDone}/${zone.missions.length} missões completas</div>
      <div class="wm-missions-list">${missHTML}</div>
      <div style="flex:1"></div>
      ${zone.isBase
        ? `<div class="wm-base-msg">⚡ Quarteirão dos Rangers — centro de operações</div>
           <button class="menu-btn wm-play-btn" id="wm-btn-action">TREINAR</button>`
        : canPlay
          ? `<button class="menu-btn wm-play-btn" id="wm-btn-action">▶ MISSÃO ${mDone+1}</button>`
          : `<div class="wm-complete-msg">✅ Zona completa!</div>`
      }
    `;

    const btn = document.getElementById('wm-btn-action');
    if (btn) btn.onclick = () => this._startMission(zone, mDone);
  },

  _startMission(zone, missionIndex) {
    if (this._animRaf) cancelAnimationFrame(this._animRaf);
    App.currentZone    = zone;
    App.currentMission = missionIndex;
    const lines = zone.dialogIntro ? Story.dialogues[zone.dialogIntro] : null;
    if (lines) {
      DialogSystem.show(lines, () => App.goTo('game'));
    } else {
      App.goTo('game');
    }
  },
};

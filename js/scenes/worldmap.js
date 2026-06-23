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
        const unlocked = this.isUnlocked(z);
        const baseH = unlocked ? 36 : 20;
        const H_norm = baseH / newCanvas.height;

        // Distância até a base (chão)
        const dxBase = mx - z.x;
        const dyBase = my - z.y;
        const distBase = Math.sqrt(dxBase*dxBase + dyBase*dyBase * Math.pow(newCanvas.width / newCanvas.height, 2));

        // Distância até o topo (coluna elevada)
        const dxTop = mx - z.x;
        const dyTop = my - (z.y - H_norm);
        const distTop = Math.sqrt(dxTop*dxTop + dyTop*dyTop * Math.pow(newCanvas.width / newCanvas.height, 2));

        // Raio de clique dinâmico
        const R = 32 / newCanvas.width;
        if (distBase < R * 1.6 || distTop < R * 1.6) {
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

    // Fundo espacial escuro com gradiente
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#04060b');
    bgGrad.addColorStop(1, '#0c101b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── GRELHA DE PERSPECTIVA HOLOGRÁFICA 3D ──
    ctx.strokeStyle = 'rgba(55, 138, 221, 0.05)';
    ctx.lineWidth = 1;
    
    // Ponto de fuga (acima do ecrã)
    const vpX = W / 2;
    const vpY = -H * 0.4;

    // Linhas radiais (perspetiva)
    const linesCount = 24;
    for (let i = 0; i <= linesCount; i++) {
      const ratio = i / linesCount;
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      // Espalha a partir do fundo
      ctx.lineTo(W * (ratio - 0.5) * 3 + W/2, H);
      ctx.stroke();
    }

    // Linhas horizontais (aproximam-se com a distância)
    const horizCount = 15;
    for (let i = 0; i < horizCount; i++) {
      const ratio = i / horizCount;
      const y = H * Math.pow(ratio, 1.8); // progressão não-linear para perspetiva
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // ── CONEXÕES (No chão da perspetiva) ──
    const conns=[['forest','city'],['forest','ocean'],['forest','base'],
      ['city','enemy_base'],['city','base'],['city','desert'],
      ['enemy_base','volcano'],['ocean','desert'],['desert','mountains'],['mountains','volcano']];
    for(const [a,b] of conns){
      const za=this.zones.find(z=>z.id===a), zb=this.zones.find(z=>z.id===b);
      if(!za||!zb) continue;
      const unlA=this.isUnlocked(za), unlB=this.isUnlocked(zb);
      ctx.strokeStyle=(unlA&&unlB)?'rgba(55, 138, 221, 0.4)':'rgba(255,255,255,0.06)';
      ctx.lineWidth=3;
      ctx.setLineDash([8,6]);
      ctx.beginPath();
      ctx.moveTo(za.x*W, za.y*H);
      ctx.lineTo(zb.x*W, zb.y*H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── PILARES E NÓS 3D ──
    for(const z of this.zones){
      const cx=z.x*W, cy=z.y*H;
      const unlocked=this.isUnlocked(z);
      const selected=this.selectedZone?.id===z.id;
      
      // Tamanho e altura dos pilares 3D
      const R = Math.max(26, Math.round(W * 0.024)); 
      const rx = R;
      const ry = R * 0.55; // Elipse achatada para efeito 3D
      
      const baseHeight = unlocked ? 36 : 20;
      const H_pillar = baseHeight + (selected ? Math.sin(this.animT * 0.1) * 6 : 0);

      // 1. Sombra da base
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx + 4, ry + 2, 0, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      const colorHex = unlocked ? z.color : '#3d3d3d';

      // 2. Laterais do pilar 3D (Cilindro)
      if (H_pillar > 0) {
        ctx.beginPath();
        ctx.moveTo(cx - rx, cy);
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, false);
        ctx.lineTo(cx + rx, cy - H_pillar);
        ctx.ellipse(cx, cy - H_pillar, rx, ry, 0, Math.PI, 0, true);
        ctx.lineTo(cx - rx, cy);
        ctx.closePath();

        // Degradê horizontal para simular iluminação lateral 3D
        const cylGrad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
        cylGrad.addColorStop(0, colorHex + 'bb');
        cylGrad.addColorStop(0.3, colorHex + 'ff');
        cylGrad.addColorStop(0.8, colorHex + 'aa');
        cylGrad.addColorStop(1.0, colorHex + '66');
        ctx.fillStyle = cylGrad;
        ctx.fill();
      }

      // 3. Topo do pilar 3D (Tampa)
      ctx.beginPath();
      ctx.ellipse(cx, cy - H_pillar, rx, ry, 0, 0, Math.PI*2);
      if (unlocked) {
        const topGrad = ctx.createRadialGradient(cx - rx*0.2, cy - H_pillar - ry*0.2, 0, cx, cy - H_pillar, rx);
        topGrad.addColorStop(0, colorHex + 'ff');
        topGrad.addColorStop(1, colorHex + 'bb');
        ctx.fillStyle = topGrad;
      } else {
        ctx.fillStyle = '#282828';
      }
      ctx.fill();

      // Borda da tampa superior
      ctx.strokeStyle = unlocked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Destaque de Seleção
      if (selected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy - H_pillar, rx + 4, ry + 2, 0, 0, Math.PI*2);
        ctx.stroke();

        ctx.strokeStyle = colorHex + '55';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(cx, cy - H_pillar, rx + 7, ry + 3.5, 0, 0, Math.PI*2);
        ctx.stroke();
      }

      // 4. Emoji ou Cadeado (Desenhado no topo da coluna)
      ctx.font = `${unlocked ? 20 : 14}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(unlocked ? z.emoji : '🔒', cx, cy - H_pillar);

      // 5. Nome da zona (flutuando por baixo da base do pilar)
      ctx.fillStyle = unlocked ? '#ffffff' : 'rgba(255,255,255,0.35)';
      ctx.font = `bold ${Math.max(11, Math.round(W * 0.016))}px sans-serif`;
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 3;
      ctx.fillText(z.name, cx, cy + ry + 12);
      ctx.shadowBlur = 0;

      // 6. Progresso da zona
      if (unlocked && z.missions?.length) {
        const done = this.completed[z.id] || 0;
        ctx.fillStyle = done >= z.missions.length ? '#3cb371' : '#fac775';
        ctx.font = `bold ${Math.max(10, Math.round(W * 0.012))}px sans-serif`;
        ctx.fillText(`${done}/${z.missions.length}`, cx, cy + ry + 25);
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

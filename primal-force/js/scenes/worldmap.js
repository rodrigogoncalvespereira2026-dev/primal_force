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
    const isP = document.body.classList.contains('portrait');
    canvas.width  = (isP ? window.innerHeight : window.innerWidth) - panelW;
    canvas.height = (isP ? window.innerWidth  : window.innerHeight) - 60;
    this._drawCanvas();

    // Remove listeners antigos clonando
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);

    newCanvas.addEventListener('click', e => {
      const rect = newCanvas.getBoundingClientRect();
      const isPortrait = document.body.classList.contains('portrait');
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top)  / rect.height;
      // rotate(90deg) mapeia visual nx → logical ny, visual ny → logical 1-nx
      const mx = isPortrait ? ny : nx;
      const my = isPortrait ? (1 - nx) : ny;
      for (const z of this.zones) {
        const baseH = 16;
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

    // Fundo azul escuro espacial (céu)
    ctx.fillStyle = '#0f1423';
    ctx.fillRect(0, 0, W, H);

    // ── GRELHA ISOMÉTRICA DO CHÃO (Estilo Minecraft Flat World) ──
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const tileW = 44;
    const tileH = 22;
    for (let x = -W; x < W * 2; x += tileW) {
      // Linhas inclinadas esquerda -> direita descendo
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H * (tileW / tileH), H);
      ctx.stroke();

      // Linhas inclinadas direita -> esquerda descendo
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - H * (tileW / tileH), H);
      ctx.stroke();
    }

    // ── CONEXÕES NO CHÃO ──
    const conns=[['forest','city'],['forest','ocean'],['forest','base'],
      ['city','enemy_base'],['city','base'],['city','desert'],
      ['enemy_base','volcano'],['ocean','desert'],['desert','mountains'],['mountains','volcano']];
    for(const [a,b] of conns){
      const za=this.zones.find(z=>z.id===a), zb=this.zones.find(z=>z.id===b);
      if(!za||!zb) continue;
      const unlA=this.isUnlocked(za), unlB=this.isUnlocked(zb);
      
      // Conexões vermelhas/neon holográficas estilo Redstone
      ctx.strokeStyle = (unlA && unlB) ? 'rgba(226, 75, 74, 0.6)' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(za.x*W, za.y*H);
      ctx.lineTo(zb.x*W, zb.y*H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── BLOCOS VOXEL 3D (Minecraft) ──
    for(const z of this.zones){
      const cx = z.x * W;
      const cy = z.y * H;
      const unlocked = this.isUnlocked(z);
      const selected = this.selectedZone?.id === z.id;

      // Dimensões do bloco Minecraft
      const w = 32;          // largura/2
      const h = 16;          // inclinação topo/2
      const d = 26;          // espessura da lateral

      // Efeito hover se selecionado (flutua para cima)
      const hoverY = selected ? Math.sin(this.animT * 0.15) * 6 - 8 : 0;
      const bx = cx;
      const by = cy + hoverY;

      // Definição de cores por bioma (Top, Left, Right)
      let colors = { top: '#4a4a4a', left: '#2a2a2a', right: '#383838' }; // Default bloqueado/pedra

      if (unlocked) {
        switch(z.id) {
          case 'forest': // Bloco de Relva/Terra
            colors = { top: '#5c8e32', left: '#5a4634', right: '#725c48' };
            break;
          case 'city': // Bloco de Tijolo/Ruína cinzenta
            colors = { top: '#8a8a8a', left: '#525252', right: '#6c6c6c' };
            break;
          case 'enemy_base': // Bloco de Netherin/Obsidiana (roxo metálico)
            colors = { top: '#3a225c', left: '#1b0e2d', right: '#271542' };
            break;
          case 'volcano': // Bloco de Magma/Basalto
            colors = { top: '#e24d15', left: '#242424', right: '#363636' };
            break;
          case 'ocean': // Bloco de Água cristalina
            colors = { top: '#1c74c6', left: '#105696', right: '#1565b0' };
            break;
          case 'desert': // Bloco de Areia
            colors = { top: '#e6c367', left: '#aa8c3f', right: '#cca953' };
            break;
          case 'mountains': // Bloco de Neve/Pedra
            colors = { top: '#f0f4f8', left: '#5f6e7c', right: '#7a8b9b' };
            break;
          case 'base': // Bloco de Redstone ativo / Ranger Base
            colors = { top: '#ff2222', left: '#5e0c0c', right: '#8c1616' };
            break;
        }
      }

      // 1. Sombra projetada no chão (abaixo do bloco)
      ctx.beginPath();
      ctx.ellipse(cx, cy + d, w * 0.9, h * 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();

      // 2. FACE ESQUERDA do bloco
      ctx.beginPath();
      ctx.moveTo(bx - w, by - h);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx, by + d);
      ctx.lineTo(bx - w, by - h + d);
      ctx.closePath();
      ctx.fillStyle = colors.left;
      ctx.fill();

      // 3. FACE DIREITA do bloco
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + w, by - h);
      ctx.lineTo(bx + w, by - h + d);
      ctx.lineTo(bx, by + d);
      ctx.closePath();
      ctx.fillStyle = colors.right;
      ctx.fill();

      // Detalhe de textura extra estilo Minecraft
      if (unlocked) {
        if (z.id === 'forest') {
          // Relva pendurada no bloco de terra
          ctx.fillStyle = colors.top;
          
          // Lado esquerdo
          ctx.beginPath();
          ctx.moveTo(bx - w, by - h);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx, by + 6);
          ctx.lineTo(bx - w * 0.4, by - h * 0.4 + 9);
          ctx.lineTo(bx - w * 0.7, by - h * 0.7 + 5);
          ctx.lineTo(bx - w, by - h + 7);
          ctx.closePath();
          ctx.fill();

          // Lado direito
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + w, by - h);
          ctx.lineTo(bx + w, by - h + 6);
          ctx.lineTo(bx + w * 0.6, by - h * 0.6 + 8);
          ctx.lineTo(bx + w * 0.3, by - h * 0.3 + 5);
          ctx.lineTo(bx, by + 7);
          ctx.closePath();
          ctx.fill();
        } else if (z.id === 'volcano') {
          // Rachaduras de lava correndo pelas laterais do basalto
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.moveTo(bx - w * 0.4, by - h * 0.4 + 5);
          ctx.lineTo(bx - w * 0.3, by - h * 0.3 + 12);
          ctx.lineTo(bx - w * 0.3, by - h * 0.3 + 16);
          ctx.lineTo(bx - w * 0.4, by - h * 0.4 + 8);
          ctx.closePath();
          ctx.fill();
        } else if (z.id === 'mountains') {
          // Neve acumulada no topo e escorrendo pelos lados
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(bx - w, by - h);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx, by + 4);
          ctx.lineTo(bx - w * 0.5, by - h * 0.5 + 6);
          ctx.lineTo(bx - w, by - h + 3);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 4. FACE SUPERIOR (Topo do bloco)
      ctx.beginPath();
      ctx.moveTo(bx, by - h * 2);
      ctx.lineTo(bx + w, by - h);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx - w, by - h);
      ctx.closePath();
      ctx.fillStyle = colors.top;
      ctx.fill();

      // Borda subtil no topo do bloco
      ctx.strokeStyle = unlocked ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Destaque brilhante se selecionado (Contorno neon)
      if (selected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx, by - h * 2 - 3);
        ctx.lineTo(bx + w + 3, by - h);
        ctx.lineTo(bx, by + 3);
        ctx.lineTo(bx - w - 3, by - h);
        ctx.closePath();
        ctx.stroke();
      }

      // 5. Ícone/Emoji no topo do bloco Minecraft
      ctx.font = `${unlocked ? 18 : 12}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(unlocked ? z.emoji : '🔒', bx, by - h);

      // 6. Nome da zona (flutuando por baixo)
      ctx.fillStyle = unlocked ? '#ffffff' : 'rgba(255, 255, 255, 0.35)';
      ctx.font = `bold ${Math.max(11, Math.round(W * 0.016))}px sans-serif`;
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 3;
      ctx.fillText(z.name, cx, cy + d + 18);
      ctx.shadowBlur = 0;

      // 7. Progresso das missões
      if (unlocked && z.missions?.length) {
        const done = this.completed[z.id] || 0;
        ctx.fillStyle = done >= z.missions.length ? '#3cb371' : '#fac775';
        ctx.font = `bold ${Math.max(10, Math.round(W * 0.012))}px sans-serif`;
        ctx.fillText(`${done}/${z.missions.length}`, cx, cy + d + 31);
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

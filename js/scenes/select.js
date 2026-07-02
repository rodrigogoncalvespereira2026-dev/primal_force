const SelectScene = {
  selected: 0,
  _allRangers: [],
  _previewRenderer: null,
  _previewScene: null,
  _previewCamera: null,
  _previewModel: null,
  _previewMixer: null,
  _previewClock: new THREE.Clock(),
  _previewCanvas: null,

  init() {
    document.getElementById('btn-back-select').onclick = () => App.goTo('menu');
    document.getElementById('btn-confirmar-ranger').onclick = () => {
      App.selectedRanger = this._allRangers[this.selected];
      App.goTo('game');
    };
    // ranger detail controls
    const backR = document.getElementById('btn-back-ranger');
    if (backR) backR.onclick = () => App.goTo('select');
    const rdSelect = document.getElementById('rd-select');
    if (rdSelect) rdSelect.onclick = () => {
      if (this._detailIndex != null) {
        App.selectedRanger = this._allRangers[this._detailIndex];
        App.goTo('game');
      }
    };
    const rdTest = document.getElementById('rd-test');
    if (rdTest) rdTest.onclick = () => {
      if (this._detailIndex != null) {
        App.selectedRanger = this._allRangers[this._detailIndex];
        App.goTo('game');
      }
    };
    this._loadRangers();
    this._buildGrid();
    this._initArrows('rangers');
    this._initPreview();
  },

  _loadRangers() {
    // Combine built-in rangers with custom rangers
    this._allRangers = [...RANGERS_DATA];

    // Load custom rangers from localStorage
    let customRangers = [];
    try {
      customRangers = JSON.parse(localStorage.getItem('prf_custom_rangers') || '[]');
    } catch {}

    // Add custom rangers with proper data format
    customRangers.forEach((r, i) => {
      this._allRangers.push({
        id: 'custom_' + i,
        name: r.name || 'Ranger Custom',
        title: (r.class || 'warrior').charAt(0).toUpperCase() + (r.class || 'warrior').slice(1),
        zord: 'Personalizado',
        color: '#3c82f6',
        emoji: '⚡',
        speed: 3.5,
        maxHp: r.stats?.hp || 100,
        maxPower: 100,
        attack: r.stats?.atk || 12,
        defense: r.stats?.def || 8,
        specialName: 'Ataque Especial',
        specialDesc: 'Ataque personalizado',
        laserColor: '#80c0ff',
        laserRange: 220,
        modelPath: r.modelPath || null,
        isCustom: true,
      });
    });
  },

  _initPreview() {
    // Create preview canvas for 3D model
    const canvas = document.createElement('canvas');
    canvas.id = 'ranger-preview-canvas';
    
    const rdCenter = document.querySelector('.rd-center');
    const rdAvatarWrap = document.querySelector('.rd-avatar-wrap');
    if (rdCenter && rdAvatarWrap) {
      rdCenter.style.position = 'relative';
      rdAvatarWrap.insertBefore(canvas, rdAvatarWrap.firstChild);
    }

    this._previewCanvas = canvas;
    this._previewRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this._previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._previewRenderer.outputEncoding = THREE.sRGBEncoding;
    this._previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._previewRenderer.toneMappingExposure = 1.2;
    this._previewRenderer.setClearColor(0x000000, 0);
    
    this._previewScene = new THREE.Scene();
    this._previewCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this._previewCamera.position.set(0, 2, 6);
    this._previewCamera.lookAt(0, 1, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this._previewScene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x223344, 0.6);
    this._previewScene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 8, 5);
    this._previewScene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-3, 4, -3);
    this._previewScene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffd700, 0.4, 10);
    rimLight.position.set(0, 3, -4);
    this._previewScene.add(rimLight);

    this._animatePreview();
    
    // Delayed size update to ensure DOM is ready
    setTimeout(() => this._updatePreviewSize(), 100);
    window.addEventListener('resize', () => this._updatePreviewSize());
  },

  _animatePreview() {
    requestAnimationFrame(() => this._animatePreview());
    
    if (!this._previewRenderer || !this._previewScene || !this._previewCamera) return;
    
    const delta = this._previewClock.getDelta();
    if (this._previewMixer) {
      this._previewMixer.update(delta);
    }

    // Rotate model slowly
    if (this._previewModel) {
      this._previewModel.rotation.y += 0.01;
    }

    this._previewRenderer.render(this._previewScene, this._previewCamera);
  },

  _loadPreviewModel(path, tintColor) {
    if (this._previewModel) {
      this._previewScene.remove(this._previewModel);
      this._previewModel = null;
      this._previewMixer = null;
    }

    const avatar = document.getElementById('rd-avatar');
    if (avatar) avatar.classList.add('hidden');

    ModelLoader.load(path, (model) => {
      if (!model || !model.children || model.children.length === 0) {
        if (path !== 'models/sample.glb') {
          this._loadPreviewModel('models/sample.glb', tintColor);
        }
        return;
      }

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim === 0) {
        if (path !== 'models/sample.glb') {
          this._loadPreviewModel('models/sample.glb', tintColor);
        }
        return;
      }
      
      const targetSize = 3;
      const scale = targetSize / maxDim;
      model.scale.setScalar(scale);
      
      const scaledCenter = center.clone().multiplyScalar(scale);
      
      model.position.x = -scaledCenter.x;
      model.position.z = -scaledCenter.z;
      model.position.y = -(box.min.y * scale);

      if (tintColor) {
        ModelLoader.tintModel(model, tintColor);
      }

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this._previewModel = model;
      this._previewScene.add(model);

      if (model.userData?.animations?.length > 0) {
        this._previewMixer = new THREE.AnimationMixer(model);
        const action = this._previewMixer.clipAction(model.userData.animations[0]);
        action.play();
      }
    });
  },

  _updatePreviewSize() {
    if (!this._previewCanvas || !this._previewRenderer) return;
    
    const rdCenter = document.querySelector('.rd-center');
    const rdAvatarWrap = document.querySelector('.rd-avatar-wrap');
    
    // Use rd-avatar-wrap (the container) if rd-center is too small
    const container = rdAvatarWrap || rdCenter;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    const width = Math.max(w, 200);
    const height = Math.max(h, 200);
    
    this._previewCanvas.style.width = width + 'px';
    this._previewCanvas.style.height = height + 'px';
    this._previewCanvas.width = width * Math.min(window.devicePixelRatio, 2);
    this._previewCanvas.height = height * Math.min(window.devicePixelRatio, 2);
    this._previewRenderer.setSize(width, height);
    this._previewCamera.aspect = width / height;
    this._previewCamera.updateProjectionMatrix();
  },

  _initArrows(name) {
    const scroll = document.getElementById('ranger-grid');
    const left  = document.getElementById('arrow-' + name + '-left');
    const right = document.getElementById('arrow-' + name + '-right');
    if (!scroll || !left || !right) return;
    left.onclick  = () => { const w = scroll.querySelector('.ranger-card')?.offsetWidth || 170; scroll.scrollBy({ left: -(w + 12), behavior: 'smooth' }); };
    right.onclick = () => { const w = scroll.querySelector('.ranger-card')?.offsetWidth || 170; scroll.scrollBy({ left:  (w + 12), behavior: 'smooth' }); };
  },

  _buildGrid() {
    const grid = document.getElementById('ranger-grid');
    grid.innerHTML = '';
    
    this._allRangers.forEach((r, i) => {
      const card = document.createElement('div');
      card.className = 'ranger-card' + (i === this.selected ? ' selected' : '');
      
      const level = 5 + i;
      const power = (10 + i * 5) + (i * 3);
      
      // Custom badge for user-created rangers
      const customBadge = r.isCustom ? '<div class="ranger-card-custom">CUSTOM</div>' : '';
      
      card.innerHTML = `
        <div class="ranger-card-header">
          <div class="ranger-card-level">${level}</div>
          <div class="ranger-card-power">${COIN_SVG} ${power}</div>
        </div>
        <div class="ranger-avatar" style="background:${r.color}22; border: 2px solid ${r.color}66;">
          <span>${r.emoji}</span>
        </div>
        <div class="ranger-card-name" style="color:${r.color}">${r.name}</div>
        <div class="ranger-card-zord">${r.title}</div>
        ${customBadge}
        <div class="ranger-card-stats">
          ${SelectScene._statIcon('💪', r.attack, '#ff8080')}
          ${SelectScene._statIcon('🛡️', r.defense, '#378add')}
          ${SelectScene._statIcon('⚡', r.speed * 20, '#ffd700')}
          ${SelectScene._statIcon('❤️', r.maxHp, '#e24b4a')}
        </div>
      `;
      card.onclick = () => {
        SelectScene.showDetail(i);
      };
      grid.appendChild(card);
    });
  },

  showDetail(index) {
    const r = this._allRangers[index];
    this._detailIndex = index;
    const level = Math.min(11, 5 + index);
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

    // Coluna esquerda
    setText('rd-name', r.name);
    setText('rd-class', r.title);
    setText('rd-tag', r.zord.toUpperCase());
    setText('rd-desc', r.specialDesc || r.title);
    setText('rd-trophies', (index * 12) + '/1000');
    const tf = document.getElementById('rd-trophy-fill');
    if (tf) tf.style.width = Math.min(100, (index * 12) / 10) + '%';

    // Centro
    const av = document.getElementById('rd-avatar');
    const glow = document.getElementById('rd-glow');
    
    if (r.modelPath && !r.modelPath.startsWith('blob:')) {
      if (av) av.classList.add('hidden');
      if (glow) glow.style.background = r.color;
      
      setTimeout(() => {
        this._updatePreviewSize();
        this._loadPreviewModel(r.modelPath, r.color);
      }, 50);
    } else {
      if (av) av.classList.add('hidden');
      if (glow) glow.style.background = r.color;
      
      setTimeout(() => {
        this._updatePreviewSize();
        this._loadPreviewModel('models/sample.glb', r.color);
      }, 50);
    }

    // Coluna direita
    setText('rd-level', level);
    const pf = document.getElementById('rd-power-fill');
    if (pf) pf.style.width = (level / 11 * 100) + '%';
    setText('rd-hp', r.maxHp);
    setText('rd-atk', r.attack);
    setText('rd-super', r.specialName || '-');

    App.goTo('ranger');
  },

  _statIcon(emoji, val, color) {
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px">
      <span style="font-size:16px">${emoji}</span>
      <span style="color:${color};font-weight:700">${Math.round(val)}</span>
    </div>`;
  },
};
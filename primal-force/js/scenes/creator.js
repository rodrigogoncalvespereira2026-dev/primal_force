const CreatorScene = {
  scene: null,
  camera: null,
  renderer: null,
  charGroup: null,
  _raf: null,
  _time: 0,
  _lastTime: 0,
  _previewMixer: null,

  _camAngle: 0,
  _camPitch: 0.45,
  _camDist: 70,
  _camTargetAngle: 0,
  _camTargetPitch: 0.45,
  _camTargetDist: 70,
  _dragging: false,
  _lastMouse: null,
  _active: false,

  current: {
    name: 'Ranger Sem Nome',
    class: 'warrior',
    stats: { hp: 100, atk: 14, spd: 4, def: 8 },
    modelPath: null,
    modelFileName: null,
  },

  init() {
    this._bindNav();
    this._bindUI();
  },

  show() {
    this._active = true;
    if (!this.scene) {
      this._init3D();
    } else {
      this._onResize();
    }
    this.buildCharacter();
  },

  hide() {
    this._active = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
  },

  _bindNav() {
    const back = document.getElementById('btn-back-creator');
    if (back) back.onclick = () => {
      this.hide();
      App.goTo('menu');
    };
  },

  _bindUI() {
    document.getElementById('btn-save').onclick = () => this._save();
    document.getElementById('btn-export-json').onclick = () => this._exportJSON();
    document.getElementById('btn-export').onclick = () => this._exportGLB();
    document.getElementById('btn-import-glb').onclick = () => this._importGLB();
    document.getElementById('btn-import-glb-left').onclick = () => this._importGLB();
    document.getElementById('btn-gallery').onclick = () => this._openGallery();
    document.getElementById('btn-random').onclick = () => this._randomize();
    document.getElementById('gallery-close').onclick = () => {
      document.getElementById('gallery-modal').style.display = 'none';
    };
    document.getElementById('gallery-modal').onclick = (e) => {
      if (e.target.id === 'gallery-modal') e.target.style.display = 'none';
    };

    document.getElementById('cc-name').oninput = (e) => {
      this.current.name = e.target.value;
      document.getElementById('cc-name-label').textContent = (e.target.value || 'RANGER SEM NOME').toUpperCase();
    };

    ['hp', 'atk', 'spd', 'def'].forEach(k => {
      const el = document.getElementById('cc-' + k);
      if (el) {
        el.oninput = () => {
          this.current.stats[k] = parseInt(el.value);
          document.getElementById('cc-' + k + '-val').textContent = el.value;
          this._updateStatBar(k);
        };
      }
    });

    this._buildClasses();
    this._updateAllStatBars();
  },

  _init3D() {
    const canvas = document.getElementById('cc-canvas');
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);

    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 500);
    this.camera.position.set(0, 40, 80);
    this.camera.lookAt(0, 15, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    this._buildLights();
    this._buildPlatform();
    this._buildFloorGrid();
    this._bind3DEvents();

    this._lastTime = performance.now();
    this._loop();
  },

  _onResize() {
    const canvas = document.getElementById('cc-canvas');
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  },

  _buildLights() {
    const ambient = new THREE.AmbientLight(0x445566, 0.7);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x88aacc, 0x334422, 0.5);
    this.scene.add(hemi);

    const main = new THREE.DirectionalLight(0xffeedd, 1.2);
    main.position.set(40, 80, 60);
    main.castShadow = true;
    main.shadow.mapSize.width = 2048;
    main.shadow.mapSize.height = 2048;
    main.shadow.camera.near = 1;
    main.shadow.camera.far = 200;
    main.shadow.camera.left = -50;
    main.shadow.camera.right = 50;
    main.shadow.camera.top = 50;
    main.shadow.camera.bottom = -50;
    this.scene.add(main);

    const front = new THREE.PointLight(0xffffff, 0.4, 150);
    front.position.set(0, 50, 60);
    this.scene.add(front);

    const fill = new THREE.PointLight(0x886644, 0.25, 100);
    fill.position.set(30, 10, -20);
    this.scene.add(fill);
  },

  _buildPlatform() {
    const g = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(26, 30, 4, 48),
      new THREE.MeshLambertMaterial({ color: 0x141828 })
    );
    base.position.y = -2;
    base.receiveShadow = true;
    g.add(base);

    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(28, 1.0, 8, 64),
      new THREE.MeshPhongMaterial({ color: 0x3c82f6, emissive: 0x1a4a8a, emissiveIntensity: 0.6, shininess: 80 })
    );
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0;
    g.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(18, 0.5, 6, 48),
      new THREE.MeshPhongMaterial({ color: 0x3c82f6, emissive: 0x1a4a8a, emissiveIntensity: 0.3, shininess: 60 })
    );
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.1;
    g.add(ring2);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(25, 25, 0.5, 48),
      new THREE.MeshPhongMaterial({ color: 0x0e1220, transparent: true, opacity: 0.85, shininess: 20 })
    );
    top.position.y = 0;
    top.receiveShadow = true;
    g.add(top);

    this.scene.add(g);
  },

  _buildFloorGrid() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0x1a2040, transparent: true, opacity: 0.25 });
    for (let i = -50; i <= 50; i += 10) {
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -0.1, -50), new THREE.Vector3(i, -0.1, 50)]), mat));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-50, -0.1, i), new THREE.Vector3(50, -0.1, i)]), mat));
    }
    this.scene.add(g);
  },

  _updateCamera(dt) {
    if (dt > 0 && dt < 0.5) {
      const lerp = 1 - Math.pow(0.0001, dt);
      this._camAngle += (this._camTargetAngle - this._camAngle) * lerp;
      this._camPitch += (this._camTargetPitch - this._camPitch) * lerp;
      this._camDist += (this._camTargetDist - this._camDist) * lerp;
    } else {
      this._camAngle = this._camTargetAngle;
      this._camPitch = this._camTargetPitch;
      this._camDist = this._camTargetDist;
    }
    const x = Math.sin(this._camAngle) * Math.cos(this._camPitch) * this._camDist;
    const y = Math.sin(this._camPitch) * this._camDist;
    const z = Math.cos(this._camAngle) * Math.cos(this._camPitch) * this._camDist;
    this.camera.position.set(x, y + 15, z);
    this.camera.lookAt(0, 15, 0);
  },

  _loop() {
    if (!this._active) return;
    this._raf = requestAnimationFrame(() => this._loop());
    const now = performance.now();
    const dt = this._lastTime ? Math.min((now - this._lastTime) / 1000, 0.1) : 0.016;
    this._lastTime = now;
    this._time += dt;

    this._updateCamera(dt);

    if (this._previewMixer) {
      this._previewMixer.update(dt);
    }

    if (this.charGroup && this._charBaseY !== undefined) {
      // Gentle floating animation without going through platform
      this.charGroup.position.y = this._charBaseY + Math.sin(this._time * 1.5) * 0.5;
      this.charGroup.rotation.z = Math.sin(this._time * 1.1) * 0.05;
    }

    if (!this._dragging && this.charGroup) {
      this._camTargetAngle += dt * 0.12;
    }

    this.renderer.render(this.scene, this.camera);
  },

  _bind3DEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointerdown', e => {
      this._dragging = true;
      this._lastMouse = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', e => {
      if (!this._dragging) return;
      const dx = e.clientX - this._lastMouse.x;
      const dy = e.clientY - this._lastMouse.y;
      this._camTargetAngle -= dx * 0.007;
      this._camTargetPitch = Math.max(0.08, Math.min(1.3, this._camTargetPitch + dy * 0.005));
      this._lastMouse = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('pointerup', () => {
      this._dragging = false;
      this._lastMouse = null;
    });

    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this._camTargetDist = Math.max(35, Math.min(180, this._camTargetDist + e.deltaY * 0.08));
    }, { passive: false });
  },

  _buildClasses() {
    const grid = document.getElementById('class-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const classes = [
      { id: 'warrior', name: 'Guerreiro', emoji: '⚔️' },
      { id: 'ranger', name: 'Patrulheiro', emoji: '🏹' },
      { id: 'mage', name: 'Mago', emoji: '🔮' },
      { id: 'tank', name: 'Tanque', emoji: '🛡️' },
      { id: 'assassin', name: 'Assassino', emoji: '🗡️' },
      { id: 'healer', name: 'Curandeiro', emoji: '💚' },
    ];
    classes.forEach(cls => {
      const btn = document.createElement('button');
      btn.className = 'cc-class-btn' + (this.current.class === cls.id ? ' active' : '');
      btn.innerHTML = `<span>${cls.emoji}</span><span>${cls.name}</span>`;
      btn.onclick = () => {
        this.current.class = cls.id;
        grid.querySelectorAll('.cc-class-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('cc-class-label').textContent = cls.emoji + ' ' + cls.name;
      };
      grid.appendChild(btn);
    });
  },

  _setStat(key, val) {
    this.current.stats[key] = val;
    const el = document.getElementById('cc-' + key);
    if (el) el.value = val;
    const valEl = document.getElementById('cc-' + key + '-val');
    if (valEl) valEl.textContent = val;
    this._updateStatBar(key);
  },

  _updateStatBar(key) {
    const el = document.getElementById('cc-' + key);
    const bar = document.getElementById('bar-' + key);
    if (!el || !bar) return;
    const max = parseInt(el.max);
    const min = parseInt(el.min);
    const val = parseInt(el.value);
    const pct = ((val - min) / (max - min)) * 100;
    bar.style.width = pct + '%';
  },

  _updateAllStatBars() {
    ['hp', 'atk', 'spd', 'def'].forEach(k => this._updateStatBar(k));
  },

  buildCharacter() {
    if (!this.scene) return;
    if (this.charGroup) this.scene.remove(this.charGroup);
    this.charGroup = new THREE.Group();

    if (this.current.modelPath) {
      this._loadGLBModel(this.current.modelPath);
    } else {
      this._showPlaceholder();
    }

    this.scene.add(this.charGroup);
  },

  _showPlaceholder() {
    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 6, 15, 12),
      new THREE.MeshLambertMaterial({ color: 0x333355 })
    );
    body.position.y = 10;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 12),
      new THREE.MeshLambertMaterial({ color: 0x333355 })
    );
    head.position.y = 22;
    head.castShadow = true;
    g.add(head);

    const eyeL = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x3c82f6 })
    );
    eyeL.position.set(-2, 23, 4);
    g.add(eyeL);

    const eyeR = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x3c82f6 })
    );
    eyeR.position.set(2, 23, 4);
    g.add(eyeR);

    const text = document.createElement('div');
    text.style.cssText = 'position:absolute; bottom:20px; left:50%; transform:translateX(-50%); color:#667; font-size:13px; text-align:center; pointer-events:none;';
    text.textContent = 'Clica em "Importar GLB" para carregar um modelo';
    document.querySelector('.cc-center').appendChild(text);

    this.charGroup = g;
    this._charBaseY = 0;
  },

  _loadGLBModel(path) {
    ModelLoader.load(path, (model) => {
      // Calculate bounding box before scaling
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Scale model to fit platform
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 40;
      const scale = targetSize / maxDim;
      model.scale.setScalar(scale);

      // Recalculate after scaling
      const scaledSize = size.clone().multiplyScalar(scale);
      const scaledCenter = center.clone().multiplyScalar(scale);

      // Center horizontally and position above platform
      model.position.x = -scaledCenter.x;
      model.position.z = -scaledCenter.z;
      // Position so bottom of model sits on top of platform (y=2)
      model.position.y = 2 - (box.min.y * scale);

      // Store base Y for floating animation
      this._charBaseY = model.position.y;

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.charGroup = model;
      this.scene.add(this.charGroup);

      if (model.userData?.animations?.length > 0) {
        this._previewMixer = new THREE.AnimationMixer(model);
        const action = this._previewMixer.clipAction(model.userData.animations[0]);
        action.play();
      }

      document.getElementById('cc-model-info').textContent = this.current.modelFileName || 'Modelo carregado';
    });
  },

  _importGLB() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.glb,.gltf';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      this.current.modelPath = url;
      this.current.modelFileName = file.name;

      this.buildCharacter();
    };
    input.click();
  },

  _randomize() {
    const classes = ['warrior', 'ranger', 'mage', 'tank', 'assassin', 'healer'];
    this.current.class = classes[Math.floor(Math.random() * classes.length)];
    this.current.stats = {
      hp: 60 + Math.floor(Math.random() * 140),
      atk: 5 + Math.floor(Math.random() * 25),
      spd: 2 + Math.floor(Math.random() * 13),
      def: 3 + Math.floor(Math.random() * 22),
    };
    ['hp', 'atk', 'spd', 'def'].forEach(k => this._setStat(k, this.current.stats[k]));

    const names = ['Furioso', 'Sombrio', 'Dourado', 'Sagrado', 'Sombra', 'Titã', 'Vingador', 'Guardião'];
    const suffixes = ['de Fogo', 'da Noite', 'do Trovão', 'da Luz', 'das Trevas', 'Primordial', 'Arcano', 'Divino'];
    this.current.name = names[Math.floor(Math.random() * names.length)] + ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
    document.getElementById('cc-name').value = this.current.name;
    document.getElementById('cc-name-label').textContent = this.current.name.toUpperCase();

    this._buildClasses();
    document.getElementById('cc-class-label').textContent = this.current.class;
  },

  getData() {
    const mp = this.current.modelPath;
    // Don't save blob URLs (they expire on reload)
    const validPath = mp && !mp.startsWith('blob:') ? mp : null;
    return {
      name: this.current.name,
      class: this.current.class,
      stats: { ...this.current.stats },
      modelPath: validPath,
      createdAt: Date.now(),
    };
  },

  _save() {
    const data = this.getData();
    let rangers = [];
    try { rangers = JSON.parse(localStorage.getItem('prf_custom_rangers') || '[]'); } catch {}
    const idx = rangers.findIndex(r => r.name === data.name);
    if (idx >= 0) rangers[idx] = data;
    else rangers.push(data);
    localStorage.setItem('prf_custom_rangers', JSON.stringify(rangers));
    alert('Ranger "' + data.name + '" salvo!');
  },

  _exportJSON() {
    const data = this.getData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ranger_' + data.name.replace(/[^a-z0-9]/gi, '_') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  _exportGLB() {
    if (!this.current.modelPath) {
      alert('Nenhum modelo GLB importado para exportar!');
      return;
    }

    if (this.current.modelPath.startsWith('blob:')) {
      alert('Modelo GLB local. Para exportar, guarde o ficheiro original.');
      return;
    }

    const a = document.createElement('a');
    a.href = this.current.modelPath;
    a.download = 'ranger_' + this.current.name.replace(/[^a-z0-9]/gi, '_') + '.glb';
    a.click();
  },

  _openGallery() {
    const modal = document.getElementById('gallery-modal');
    const list = document.getElementById('gallery-list');
    list.innerHTML = '';

    let rangers = [];
    try { rangers = JSON.parse(localStorage.getItem('prf_custom_rangers') || '[]'); } catch {}

    if (rangers.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:30px;color:#667">Nenhum ranger salvo ainda.</div>';
      modal.style.display = 'flex';
      return;
    }

    rangers.forEach((r, i) => {
      const card = document.createElement('div');
      card.className = 'cc-gallery-card';
      card.innerHTML = `
        <div class="cc-gallery-name">${r.name}</div>
        <div class="cc-gallery-class">${r.class || 'Guerreiro'}</div>
        <div class="cc-gallery-actions">
          <button class="cc-gallery-btn load" data-idx="${i}">Editar</button>
          <button class="cc-gallery-btn del" data-idx="${i}">Apagar</button>
        </div>
      `;
      card.querySelector('.load').onclick = () => {
        this._loadData(r);
        modal.style.display = 'none';
      };
      card.querySelector('.del').onclick = () => {
        if (confirm('Apagar "' + r.name + '"?')) {
          rangers.splice(i, 1);
          localStorage.setItem('prf_custom_rangers', JSON.stringify(rangers));
          this._openGallery();
        }
      };
      list.appendChild(card);
    });

    modal.style.display = 'flex';
  },

  _loadData(data) {
    if (!data) return;
    this.current.name = data.name || 'Ranger Sem Nome';
    this.current.class = data.class || 'warrior';
    this.current.modelPath = data.modelPath || null;
    if (data.stats) this.current.stats = { ...data.stats };

    document.getElementById('cc-name').value = this.current.name;
    document.getElementById('cc-name-label').textContent = this.current.name.toUpperCase();
    ['hp', 'atk', 'spd', 'def'].forEach(k => {
      if (this.current.stats[k] !== undefined) this._setStat(k, this.current.stats[k]);
    });

    this._buildClasses();
    this.buildCharacter();
  },
};
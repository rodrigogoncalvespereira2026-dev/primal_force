const CreatorScene = {
  scene: null,
  camera: null,
  renderer: null,
  charGroup: null,
  petGroup: null,
  _raf: null,
  _time: 0,
  _lastTime: 0,
  _floatingOrbs: [],

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
    helmet: 'dino',
    chest: 'classic',
    weapon: 'sword',
    boots: 'standard',
    shoulder: 'none',
    accessory: 'none',
    mask: 'none',
    pet: 'none',
    colors: {
      primary:   '#2244cc',
      secondary: '#cc2222',
      accent:    '#ffcc00',
      visor:     '#22ccff',
      dark:      '#111122',
    },
    stats: { hp: 100, atk: 14, spd: 4, def: 8 },
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
    document.getElementById('btn-export').onclick = () => this._exportJSON();
    document.getElementById('btn-gallery').onclick = () => this._openGallery();
    document.getElementById('btn-random').onclick = () => this._randomize();
    document.getElementById('gallery-close').onclick = () => {
      document.getElementById('gallery-modal').style.display = 'none';
    };
    document.getElementById('gallery-modal').onclick = (e) => {
      if (e.target.id === 'gallery-modal') e.target.style.display = 'none';
    };

    document.querySelectorAll('#screen-creator .cc-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('#screen-creator .cc-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#screen-creator .cc-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById('tab-' + tab.dataset.tab);
        if (target) target.classList.add('active');
      };
    });

    document.getElementById('cc-name').oninput = (e) => {
      this.current.name = e.target.value;
      document.getElementById('cc-name-label').textContent = (e.target.value || 'RANGER SEM NOME').toUpperCase();
      document.getElementById('cc-ranger-name').textContent = (e.target.value || 'RANGER SEM NOME').toUpperCase();
    };

    ['primary', 'secondary', 'accent', 'visor', 'dark'].forEach(key => {
      const input = document.getElementById('cc-color-' + key);
      if (input) {
        input.oninput = (e) => {
          this.current.colors[key] = e.target.value;
          this.buildCharacter();
        };
      }
    });

    ['hp', 'atk', 'spd', 'def'].forEach(key => {
      const input = document.getElementById('cc-' + key);
      if (input) {
        input.oninput = (e) => {
          const val = parseInt(e.target.value);
          this.current.stats[key] = val;
          document.getElementById('cc-' + key + '-val').textContent = val;
          const max = { hp: 200, atk: 30, spd: 15, def: 25 }[key];
          const min = { hp: 30, atk: 3, spd: 1, def: 1 }[key];
          const pct = ((val - min) / (max - min)) * 100;
          const bar = document.getElementById('bar-' + key);
          if (bar) bar.style.width = pct + '%';
        };
      }
    });
  },

  _init3D() {
    const canvas = document.getElementById('cc-canvas');
    if (!canvas) return;

    const wrap = canvas.parentElement;
    const w = wrap ? wrap.clientWidth : window.innerWidth;
    const h = wrap ? wrap.clientHeight : window.innerHeight;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080c16);

    this.camera = new THREE.PerspectiveCamera(38, w / h, 1, 500);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;

    this._addLights();
    this._buildPlatform();
    this._buildFloorGrid();
    this._updateCamera(0);
    this._bind3DEvents();

    window.addEventListener('resize', () => this._onResize());

    this._loop();
  },

  _onResize() {
    if (!this.renderer) return;
    const canvas = this.renderer.domElement;
    const wrap = canvas.parentElement;
    const w = wrap ? wrap.clientWidth : window.innerWidth;
    const h = wrap ? wrap.clientHeight : window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  },

  _addLights() {
    this.scene.add(new THREE.AmbientLight(0x8899aa, 0.6));

    const dir = new THREE.DirectionalLight(0xfff4e6, 1.1);
    dir.position.set(25, 55, 35);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 5;
    dir.shadow.camera.far = 180;
    dir.shadow.camera.left = -50;
    dir.shadow.camera.right = 50;
    dir.shadow.camera.top = 70;
    dir.shadow.camera.bottom = -10;
    dir.shadow.bias = -0.001;
    this.scene.add(dir);

    this.scene.add(new THREE.HemisphereLight(0x6688bb, 0x443322, 0.5));

    const rim = new THREE.PointLight(0x4466cc, 0.7, 160);
    rim.position.set(-40, 35, -30);
    this.scene.add(rim);

    const front = new THREE.PointLight(0xffeedd, 0.35, 120);
    front.position.set(0, 25, 55);
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
    this.camera.lookAt(0, 14, 0);
  },

  _loop() {
    if (!this._active) return;
    this._raf = requestAnimationFrame(() => this._loop());
    const now = performance.now();
    const dt = this._lastTime ? Math.min((now - this._lastTime) / 1000, 0.1) : 0.016;
    this._lastTime = now;
    this._time += dt;

    this._updateCamera(dt);

    if (this.charGroup) {
      this.charGroup.position.y = Math.sin(this._time * 2.2) * 0.25;
      this.charGroup.rotation.z = Math.sin(this._time * 1.1) * 0.08;
    }

    this._floatingOrbs.forEach((orb, i) => {
      const t = this._time * 1.5 + i * (Math.PI * 2 / this._floatingOrbs.length);
      orb.position.x = Math.cos(t) * 32;
      orb.position.z = Math.sin(t) * 32;
      orb.position.y = 15 + Math.sin(t * 0.7) * 8;
      orb.material.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.2;
    });

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

  _populateUI() {
    this._populateOptions('opt-helmet', RangerParts.helmets, 'helmet');
    this._populateOptions('opt-chest', RangerParts.chests, 'chest');
    this._populateOptions('opt-weapon', RangerParts.weapons, 'weapon');
    this._populateOptions('opt-boots', RangerParts.boots, 'boots');
    this._populateOptions('opt-shoulder', RangerParts.shoulders, 'shoulder');
    this._populateOptions('opt-accessory', RangerParts.accessories, 'accessory');
    this._populateOptions('opt-mask', RangerParts.masks, 'mask');
    this._populateOptions('opt-pet', RangerParts.pets, 'pet');
    this._buildThemes();
    this._buildClasses();
  },

  _populateOptions(containerId, items, currentKey) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'cc-opt-btn' + (this.current[currentKey] === item.id ? ' active' : '');
      btn.innerHTML = `<span class="cc-opt-emoji">${item.emoji}</span><span class="cc-opt-name">${item.name}</span>`;
      btn.onclick = () => {
        this.current[currentKey] = item.id;
        container.querySelectorAll('.cc-opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.buildCharacter();
      };
      container.appendChild(btn);
    });
  },

  _buildThemes() {
    const list = document.getElementById('palette-list');
    if (!list) return;
    list.innerHTML = '';
    RangerParts.themes.forEach(theme => {
      const btn = document.createElement('button');
      btn.className = 'cc-theme-btn';
      btn.innerHTML = `
        <div class="cc-theme-colors">
          <span style="background:${theme.primary}"></span>
          <span style="background:${theme.secondary}"></span>
          <span style="background:${theme.accent}"></span>
        </div>
        <span class="cc-theme-name">${theme.name}</span>
      `;
      btn.onclick = () => {
        this.current.colors = { primary: theme.primary, secondary: theme.secondary, accent: theme.accent, visor: theme.visor, dark: theme.dark };
        ['primary', 'secondary', 'accent', 'visor', 'dark'].forEach(k => {
          const el = document.getElementById('cc-color-' + k);
          if (el) el.value = this.current.colors[k];
        });
        this.buildCharacter();
      };
      list.appendChild(btn);
    });
  },

  _buildClasses() {
    const grid = document.getElementById('class-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(RangerParts.classes).forEach(([key, cls]) => {
      const btn = document.createElement('button');
      btn.className = 'cc-class-btn' + (this.current.class === key ? ' active' : '');
      btn.dataset.class = key;
      btn.innerHTML = `<span>${cls.emoji}</span><span>${cls.name}</span><span class="cc-class-stats-mini">HP${cls.hp} ATK${cls.atk}</span>`;
      btn.onclick = () => {
        this.current.class = key;
        grid.querySelectorAll('.cc-class-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._setStat('hp', cls.hp);
        this._setStat('atk', cls.atk);
        this._setStat('spd', cls.spd);
        this._setStat('def', cls.def);
        document.getElementById('cc-class-label').textContent = cls.emoji + ' ' + cls.name;
        this.buildCharacter();
      };
      grid.appendChild(btn);
    });
  },

  _setStat(key, val) {
    const input = document.getElementById('cc-' + key);
    if (input) {
      input.value = val;
      this.current.stats[key] = val;
      document.getElementById('cc-' + key + '-val').textContent = val;
      const max = { hp: 200, atk: 30, spd: 15, def: 25 }[key];
      const min = { hp: 30, atk: 3, spd: 1, def: 1 }[key];
      const pct = ((val - min) / (max - min)) * 100;
      const bar = document.getElementById('bar-' + key);
      if (bar) bar.style.width = pct + '%';
    }
  },

  _m(color, opts) {
    return new THREE.MeshPhongMaterial({ color, shininess: 30, ...opts });
  },

  _em(color, intensity) {
    return new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: intensity || 0.4, shininess: 60 });
  },

  _glow(color, intensity) {
    return new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: intensity || 0.6, shininess: 100, transparent: true, opacity: 0.85 });
  },

  buildCharacter() {
    if (!this.scene) return;
    if (this.charGroup) this.scene.remove(this.charGroup);
    if (this.petGroup) this.scene.remove(this.petGroup);
    this._floatingOrbs = [];

    this.charGroup = new THREE.Group();
    this.charGroup.position.y = 0;

    this._populateUI();

    const c = this.current.colors;
    const pri = new THREE.Color(c.primary);
    const sec = new THREE.Color(c.secondary);
    const acc = new THREE.Color(c.accent);
    const vis = new THREE.Color(c.visor);
    const dk  = new THREE.Color(c.dark);
    const wht = new THREE.Color(0xffffff);

    this._buildHead(pri, sec, acc, vis, dk, wht);
    this._buildNeck(pri, dk);
    this._buildTorso(pri, sec, acc, dk);
    this._buildArms(pri, sec, acc);
    this._buildLegs(pri, sec, dk);
    this._buildShoulders(sec, acc);
    this._buildWeapon(acc, sec);
    this._buildMask(vis, dk, acc);

    const accDef = RangerParts.accessories.find(a => a.id === this.current.accessory);
    if (accDef && accDef.build) this['_' + accDef.build](pri, sec, acc);

    this.scene.add(this.charGroup);
    this._buildPet();
  },

  _buildHead(pri, sec, acc, vis, dk, wht) {
    const g = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(8, 20, 16), this._m(pri));
    head.position.y = 53;
    head.scale.set(1, 1.05, 1.05);
    head.castShadow = true;
    g.add(head);

    const visorGeo = this.current.helmet === 'ninja'
      ? new THREE.BoxGeometry(12, 2, 7)
      : new THREE.BoxGeometry(12, 4.5, 7);
    const visorMesh = new THREE.Mesh(visorGeo, this._glow(vis, 0.5));
    visorMesh.position.set(0, 53, 4.5);
    g.add(visorMesh);

    const crown = new THREE.Mesh(new THREE.ConeGeometry(3.5, 7, 8), this._m(sec));
    crown.position.y = 61;
    crown.castShadow = true;
    g.add(crown);

    this._buildHelmetDetails(g, pri, sec, acc, vis, dk, wht);
    this.charGroup.add(g);
  },

  _buildHelmetDetails(g, pri, sec, acc, vis, dk, wht) {
    const h = this.current.helmet;

    if (h === 'dino' || h === 'dragon') {
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(9, 3.5, 6), this._m(sec));
      jaw.position.set(0, 48, 6);
      g.add(jaw);
      for (let i = -1; i <= 1; i += 2) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 4), this._m(wht));
        tooth.position.set(i * 2.8, 46.5, 8.5);
        tooth.rotation.x = Math.PI;
        g.add(tooth);
      }
      const horns = h === 'dragon' ? acc : sec;
      for (let i = -1; i <= 1; i += 2) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(1.3, 5, 5), this._em(horns, 0.3));
        horn.position.set(i * 4.5, 59, -2.5);
        horn.rotation.z = i * 0.35;
        g.add(horn);
      }
    }

    if (h === 'wolf' || h === 'tiger' || h === 'panther' || h === 'bear') {
      for (let i = -1; i <= 1; i += 2) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(2.2, 6, 5), this._m(pri));
        ear.position.set(i * 5.5, 60, -0.5);
        ear.rotation.z = i * 0.3;
        ear.castShadow = true;
        g.add(ear);
      }
    }

    if (h === 'eagle' || h === 'phoenix') {
      const beak = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 4), this._m(acc));
      beak.position.set(0, 51.5, 8);
      beak.rotation.x = Math.PI / 2;
      g.add(beak);
      if (h === 'phoenix') {
        for (let i = -1; i <= 1; i += 2) {
          const feather = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8, 2), this._em(acc, 0.5));
          feather.position.set(i * 2, 56, -4);
          feather.rotation.z = i * 0.5;
          g.add(feather);
        }
      }
    }

    if (h === 'shark') {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(1.5, 7, 4), this._m(dk));
      fin.position.set(0, 59, -3);
      fin.rotation.x = -0.3;
      fin.castShadow = true;
      g.add(fin);
    }

    if (h === 'scorpion') {
      for (let i = -1; i <= 1; i += 2) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.5, 4), this._m(sec));
        claw.position.set(i * 7, 54, 3);
        claw.rotation.z = i * 0.6;
        g.add(claw);
      }
    }

    if (h === 'cobra') {
      const hood = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 2), this._m(pri));
      hood.position.set(0, 53, -5);
      g.add(hood);
    }

    if (h === 'samurai') {
      const crest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8, 3.5), this._em(acc, 0.4));
      crest.position.set(0, 60, 1.5);
      g.add(crest);
      for (let i = -1; i <= 1; i += 2) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.8), this._m(acc));
        plate.position.set(i * 3, 58, 4);
        g.add(plate);
      }
    }

    if (h === 'ninja') {
      const wrap = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 3, 16), this._m(dk));
      wrap.position.y = 51;
      g.add(wrap);
    }

    if (h === 'knight') {
      const visor2 = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 2), this._m(dk));
      visor2.position.set(0, 51, 7);
      g.add(visor2);
      for (let i = -1; i <= 1; i += 2) {
        const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 4), this._m(0x888888));
        bolt.position.set(i * 4, 53, 7);
        g.add(bolt);
      }
    }

    if (h === 'viking') {
      for (let i = -1; i <= 1; i += 2) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(1.2, 7, 5), this._m(0xddccaa));
        horn.position.set(i * 6, 58, -1);
        horn.rotation.z = i * 0.6;
        g.add(horn);
      }
    }

    if (h === 'cyber' || h === 'robot') {
      for (let i = -1; i <= 1; i += 2) {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 4), this._m(0x666677));
        ant.position.set(i * 3, 62, 0);
        g.add(ant);
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 4), this._glow(acc, 0.8));
        light.position.set(i * 3, 65, 0);
        g.add(light);
      }
      if (h === 'robot') {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 2), this._m(0x444455));
        plate.position.set(0, 53, 7);
        g.add(plate);
      }
    }

    if (h === 'alien') {
      const eyes = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6), this._glow(0x22ff44, 0.6));
      eyes.scale.set(0.8, 1.2, 0.5);
      eyes.position.set(0, 55, 6);
      g.add(eyes);
    }

    if (h === 'ghost') {
      const wisps = new THREE.Mesh(new THREE.SphereGeometry(10, 12, 8), this._m(pri, { transparent: true, opacity: 0.5 }));
      wisps.position.set(0, 54, 0);
      g.add(wisps);
    }

    if (h === 'kraken') {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI - Math.PI / 2;
        const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, 5, 4), this._m(sec));
        tentacle.position.set(Math.sin(angle) * 6, 58, Math.cos(angle) * 3 - 3);
        tentacle.rotation.x = Math.cos(angle) * 0.4;
        tentacle.rotation.z = Math.sin(angle) * 0.4;
        g.add(tentacle);
      }
    }

    if (h === 'spider') {
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 4), this._m(dk));
        leg.position.set((i < 2 ? -1 : 1) * 6, 52 + (i % 2) * 2, -2);
        leg.rotation.z = (i < 2 ? 1 : -1) * 0.8;
        g.add(leg);
      }
    }

    if (h === 'beetle') {
      const shell = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 6), this._m(pri));
      shell.scale.set(1, 0.6, 1.2);
      shell.position.set(0, 55, -2);
      g.add(shell);
    }

    if (h === 'crown') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 2, 16), this._em(acc, 0.4));
      base.position.y = 59;
      g.add(base);
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3, 4), this._em(acc, 0.5));
        spike.position.set(Math.sin(angle) * 8.5, 62, Math.cos(angle) * 8.5);
        g.add(spike);
      }
    }

    if (h === 'wizard') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 1, 16), this._m(sec));
      brim.position.y = 58;
      g.add(brim);
      const hat = new THREE.Mesh(new THREE.ConeGeometry(8, 10, 16), this._m(sec));
      hat.position.y = 64;
      g.add(hat);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), this._em(acc, 0.6));
      star.position.set(0, 66, 5);
      g.add(star);
    }

    if (h === 'skull') {
      const eye1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), this._m(dk));
      eye1.position.set(-2.5, 54, 6);
      g.add(eye1);
      const eye2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), this._m(dk));
      eye2.position.set(2.5, 54, 6);
      g.add(eye2);
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 3), this._m(wht));
      jaw.position.set(0, 48, 4);
      g.add(jaw);
    }
  },

  _buildNeck(pri, dk) {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 3, 10), this._m(dk));
    neck.position.y = 45;
    this.charGroup.add(neck);
  },

  _buildTorso(pri, sec, acc, dk) {
    const g = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(8, 9, 16, 12), this._m(pri));
    torso.position.y = 33;
    torso.castShadow = true;
    g.add(torso);

    const ct = this.current.chest;

    if (ct === 'armor' || ct === 'heavy') {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(14, 11, 5), this._m(sec));
      plate.position.set(0, 35, 5.5);
      plate.castShadow = true;
      g.add(plate);
      if (ct === 'heavy') {
        for (let i = -1; i <= 1; i += 2) {
          const sh = new THREE.Mesh(new THREE.SphereGeometry(4.5, 10, 8), this._m(sec));
          sh.position.set(i * 11, 40, 0);
          sh.castShadow = true;
          g.add(sh);
        }
      }
    }

    if (ct === 'slim') {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 13, 10), this._m(sec));
      stripe.position.set(0, 33, 1);
      g.add(stripe);
    }

    if (ct === 'captor') {
      const magnet = new THREE.Mesh(new THREE.TorusGeometry(3.5, 1, 8, 16, Math.PI), this._em(acc, 0.4));
      magnet.position.set(0, 37, 7);
      magnet.rotation.x = Math.PI;
      g.add(magnet);
    }

    if (ct === 'primal') {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(3.5, 0), this._glow(acc, 0.6));
      crystal.position.set(0, 37, 7);
      g.add(crystal);
    }

    if (ct === 'ninja') {
      const belt = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 10), this._m(dk));
      belt.position.set(0, 26, 0);
      g.add(belt);
    }

    if (ct === 'samurai') {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 3), this._m(acc));
      plate.position.set(0, 36, 7);
      g.add(plate);
      for (let i = -1; i <= 1; i += 2) {
        const detail = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 1), this._m(sec));
        detail.position.set(i * 4, 35, 8);
        g.add(detail);
      }
    }

    if (ct === 'cyber') {
      for (let i = 0; i < 3; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 0.5), this._glow(acc, 0.5));
        line.position.set(0, 31 + i * 3, 9);
        g.add(line);
      }
    }

    if (ct === 'royal') {
      const cape = new THREE.Mesh(new THREE.BoxGeometry(16, 18, 1), this._m(sec, { side: THREE.DoubleSide }));
      cape.position.set(0, 32, -8);
      g.add(cape);
    }

    if (ct === 'mystic') {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 8), this._glow(acc, 0.7));
      orb.position.set(0, 38, 8);
      g.add(orb);
    }

    if (ct === 'plague') {
      const beak = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 6), this._m(dk));
      beak.position.set(0, 40, 8);
      beak.rotation.x = Math.PI / 2;
      g.add(beak);
    }

    if (ct === 'dragon') {
      for (let i = 0; i < 5; i++) {
        const scale = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.8), this._m(sec));
        scale.position.set(0, 28 + i * 2.5, 9);
        g.add(scale);
      }
    }

    if (ct === 'crystal') {
      for (let i = -1; i <= 1; i += 2) {
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), this._glow(acc, 0.5));
        gem.position.set(i * 4, 38, 8);
        g.add(gem);
      }
    }

    if (ct === 'tactical') {
      for (let i = 0; i < 3; i++) {
        const pocket = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 1.5), this._m(dk));
        pocket.position.set(-5 + i * 5, 28, 9);
        g.add(pocket);
      }
      const strap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 20, 1), this._m(dk));
      strap.position.set(-5, 33, 5);
      strap.rotation.z = 0.1;
      g.add(strap);
    }

    const belt = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.5, 2.5, 12), this._m(acc));
    belt.position.y = 24;
    g.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.5, 2), this._em(acc, 0.3));
    buckle.position.set(0, 24, 9.5);
    g.add(buckle);

    this.charGroup.add(g);
  },

  _buildArms(pri, sec, acc) {
    for (let side = -1; side <= 1; side += 2) {
      const g = new THREE.Group();

      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 8), this._m(sec));
      shoulder.position.set(side * 12, 41, 0);
      shoulder.castShadow = true;
      g.add(shoulder);

      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 9, 10), this._m(pri));
      upperArm.position.set(side * 12, 33, 0);
      upperArm.castShadow = true;
      g.add(upperArm);

      const elbow = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6), this._m(sec));
      elbow.position.set(side * 12, 28, 0);
      g.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.8, 8, 10), this._m(pri));
      forearm.position.set(side * 12, 23, 0);
      forearm.castShadow = true;
      g.add(forearm);

      const glove = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 8), this._m(acc));
      glove.position.set(side * 12, 18, 0);
      glove.castShadow = true;
      g.add(glove);

      this.charGroup.add(g);
    }
  },

  _buildLegs(pri, sec, dk) {
    const acc = new THREE.Color(this.current.colors.accent);
    const bootDefs = {
      standard: dk,
      armored: sec,
      ninja: new THREE.Color(0x111111),
      heavy: sec,
      flying: acc,
      crystal: acc,
      flame: new THREE.Color(0xcc4400),
      shadow: new THREE.Color(0x0a0a14),
      cyber: new THREE.Color(0x333344),
      primal: new THREE.Color(0x225533),
    };

    for (let side = -1; side <= 1; side += 2) {
      const g = new THREE.Group();

      const hip = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 6), this._m(pri));
      hip.position.set(side * 5, 21, 0);
      g.add(hip);

      const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 9, 10), this._m(pri));
      upperLeg.position.set(side * 5, 15, 0);
      upperLeg.castShadow = true;
      g.add(upperLeg);

      const knee = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 6), this._m(sec));
      knee.position.set(side * 5, 10, 0);
      g.add(knee);

      const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 7, 10), this._m(pri));
      lowerLeg.position.set(side * 5, 6, 0);
      lowerLeg.castShadow = true;
      g.add(lowerLeg);

      const bootColor = bootDefs[this.current.boots] || dk;
      const boot = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4, 5, 10), this._m(bootColor));
      boot.position.set(side * 5, 1, 0);
      boot.castShadow = true;
      g.add(boot);

      this.charGroup.add(g);
    }
  },

  _buildShoulders(sec, acc) {
    const id = this.current.shoulder;
    if (id === 'none') return;

    const styles = {
      plate:    () => this._m(sec),
      spiked:   () => this._m(sec),
      wing:     () => this._m(acc, { transparent: true, opacity: 0.7 }),
      lion:     () => this._m(acc),
      skull:    () => this._m(new THREE.Color(0xddddcc)),
      crystal:  () => this._glow(acc, 0.4),
      flame:    () => this._em(acc, 0.6),
      cyber:    () => this._m(new THREE.Color(0x444455)),
      dragon:   () => this._m(sec),
    };

    const matFn = styles[id];
    if (!matFn) return;

    for (let side = -1; side <= 1; side += 2) {
      let mesh;
      if (id === 'plate' || id === 'cyber') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 7), matFn());
      } else if (id === 'spiked') {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(5, 8, 6), matFn());
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3, 4), this._m(new THREE.Color(0x888888)));
        spike.position.y = 5;
        mesh.add(spike);
      } else if (id === 'wing') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 5), matFn());
      } else if (id === 'lion' || id === 'dragon') {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(5.5, 10, 8), matFn());
      } else if (id === 'skull') {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(4.5, 8, 6), matFn());
        mesh.scale.set(1, 0.8, 1);
      } else if (id === 'crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(4, 0), matFn());
      } else if (id === 'flame') {
        mesh = new THREE.Mesh(new THREE.ConeGeometry(3, 7, 6), matFn());
      } else {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 6), matFn());
      }
      mesh.position.set(side * 13, 42, 0);
      mesh.castShadow = true;
      this.charGroup.add(mesh);
    }
  },

  _buildMask(vis, dk, acc) {
    const id = this.current.mask;
    if (id === 'none') return;
    const g = new THREE.Group();

    if (id === 'visor') {
      const v = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 4), this._glow(vis, 0.5));
      v.position.set(0, 53, 7);
      g.add(v);
    }
    if (id === 'bandit') {
      const mask = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 3), this._m(dk));
      mask.position.set(0, 53, 6);
      g.add(mask);
    }
    if (id === 'gas') {
      const mask = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 4), this._m(dk));
      mask.position.set(0, 50, 7);
      g.add(mask);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 8), this._m(new THREE.Color(0x555555)));
      tube.position.set(0, 50, 9);
      tube.rotation.x = Math.PI / 2;
      g.add(tube);
    }
    if (id === 'half') {
      const mask = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 2), this._m(dk));
      mask.position.set(0, 50, 7);
      g.add(mask);
    }
    if (id === 'teeth') {
      for (let i = -3; i <= 3; i++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1), this._m(new THREE.Color(0xeeeecc)));
        tooth.position.set(i * 1.5, 48, 8);
        g.add(tooth);
      }
    }
    if (id === 'tribal') {
      for (let i = -2; i <= 2; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 1), this._m(acc));
        line.position.set(i * 2, 52, 8);
        line.rotation.z = i * 0.15;
        g.add(line);
      }
    }
    if (id === 'cyber') {
      const visor2 = new THREE.Mesh(new THREE.BoxGeometry(11, 3, 3), this._glow(acc, 0.6));
      visor2.position.set(0, 53, 7);
      g.add(visor2);
    }
    if (id === 'skull') {
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 3), this._m(new THREE.Color(0xddddcc)));
      jaw.position.set(0, 49, 6);
      g.add(jaw);
    }
    if (id === 'flower') {
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 4), this._em(acc, 0.3));
        petal.position.set(Math.sin(angle) * 2.5, 52, 7 + Math.cos(angle) * 2.5);
        g.add(petal);
      }
      const center = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 4), this._em(new THREE.Color(0xffcc00), 0.5));
      center.position.set(0, 52, 9);
      g.add(center);
    }

    this.charGroup.add(g);
  },

  _buildWeapon(ac, se) {
    const id = this.current.weapon;
    if (id === 'none') return;

    const g = new THREE.Group();
    const metal = this._m(0xccccdd);
    const glow = this._glow(ac, 0.5);

    g.position.set(12, 14, 3);

    const weaponShapes = {
      sword: () => {
        g.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 18, 0.8), metal).translateY(9));
        const guard = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 1.5), this._m(se));
        g.add(guard);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 6), this._m(0x553322));
        handle.position.y = -3;
        g.add(handle);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 4), glow);
        gem.position.z = 1;
        g.add(gem);
      },
      katana: () => {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 22, 0.5), metal);
        blade.position.set(0, 11, 0);
        blade.rotation.z = -0.1;
        g.add(blade);
        const guard = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.8, 6), this._m(se));
        guard.rotation.x = Math.PI / 2;
        g.add(guard);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 6), this._m(0x332211));
        handle.position.y = -3.5;
        g.add(handle);
      },
      dual: () => {
        const blade1 = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 0.6), metal);
        blade1.position.y = 6;
        g.add(blade1);
        const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 4, 6), this._m(0x553322));
        h1.position.y = -2;
        g.add(h1);
        const blade2 = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 0.6), metal);
        blade2.position.set(5, 6, 0);
        g.add(blade2);
        const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 4, 6), this._m(0x553322));
        h2.position.set(5, -2, 0);
        g.add(h2);
      },
      lance: () => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 30, 6), this._m(0x664422));
        shaft.position.y = 15;
        g.add(shaft);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6, 6), metal);
        tip.position.y = 31;
        g.add(tip);
      },
      axe: () => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 18, 6), this._m(0x664422));
        shaft.position.y = 9;
        g.add(shaft);
        const head = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 1), metal);
        head.position.y = 16;
        g.add(head);
      },
      hammer: () => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 16, 6), this._m(0x664422));
        shaft.position.y = 8;
        g.add(shaft);
        const head = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 5), metal);
        head.position.y = 16;
        g.add(head);
      },
      mace: () => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 14, 6), this._m(0x555555));
        shaft.position.y = 7;
        g.add(shaft);
        const head = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), metal);
        head.position.y = 15;
        g.add(head);
        for (let i = 0; i < 6; i++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2, 4), metal);
          const angle = (i / 6) * Math.PI * 2;
          spike.position.set(Math.cos(angle) * 3, 15, Math.sin(angle) * 3);
          g.add(spike);
        }
      },
      flail: () => {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 10, 6), this._m(0x664422));
        handle.position.y = 5;
        g.add(handle);
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 4), this._m(0x888888));
        chain.position.y = 14;
        g.add(chain);
        const head = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6), metal);
        head.position.y = 19;
        g.add(head);
      },
      halberd: () => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 28, 6), this._m(0x664422));
        shaft.position.y = 14;
        g.add(shaft);
        const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 1), metal);
        axeBlade.position.set(-3, 26, 0);
        g.add(axeBlade);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(1, 4, 6), metal);
        tip.position.y = 30;
        g.add(tip);
      },
      scythe: () => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 26, 6), this._m(0x664422));
        shaft.position.y = 13;
        g.add(shaft);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 0.5), metal);
        blade.position.set(-2, 25, 0);
        blade.rotation.z = 0.4;
        g.add(blade);
      },
      rapier: () => {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 20, 0.3), metal);
        blade.position.y = 10;
        g.add(blade);
        const guard = new THREE.Mesh(new THREE.TorusGeometry(2, 0.4, 6, 8), this._m(se));
        guard.rotation.x = Math.PI / 2;
        g.add(guard);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), this._m(0x553322));
        handle.position.y = -3;
        g.add(handle);
      },
      staff: () => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 28, 6), this._m(0x664422));
        shaft.position.y = 14;
        g.add(shaft);
        const orb = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6), glow);
        orb.position.y = 29;
        g.add(orb);
      },
      bow: () => {
        const curve = new THREE.Mesh(new THREE.TorusGeometry(8, 0.5, 6, 12, Math.PI), metal);
        curve.position.y = 12;
        curve.rotation.z = Math.PI / 2;
        g.add(curve);
      },
      crossbow: () => {
        const stock = new THREE.Mesh(new THREE.BoxGeometry(1.5, 14, 1.5), this._m(0x664422));
        stock.position.y = 7;
        g.add(stock);
        const limbs = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 1), metal);
        limbs.position.y = 16;
        g.add(limbs);
      },
      blaster: () => {
        const body = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 6), this._m(0x444444));
        body.position.set(0, 10, 2);
        g.add(body);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 5, 8), metal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 10, 7);
        g.add(barrel);
      },
      daggers: () => {
        for (let i = 0; i < 2; i++) {
          const d = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8, 0.5), metal);
          d.position.set(i * 4, 4, 0);
          g.add(d);
          const h = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), this._m(0x553322));
          h.position.set(i * 4, -1, 0);
          g.add(h);
        }
      },
      nunchucks: () => {
        for (let i = 0; i < 2; i++) {
          const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), this._m(0x664422));
          stick.position.set(i * 5, 4, 0);
          g.add(stick);
        }
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 4), this._m(0x888888));
        chain.position.set(2.5, 8, 0);
        g.add(chain);
      },
      gauntlets: () => {
        for (let i = 0; i < 2; i++) {
          const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 3), metal);
          gauntlet.position.set(i * 8, 3, 0);
          g.add(gauntlet);
        }
      },
      claws: () => {
        for (let i = 0; i < 3; i++) {
          const claw = new THREE.Mesh(new THREE.ConeGeometry(0.4, 5, 4), metal);
          claw.position.set(i * 1.5, 3, 1);
          claw.rotation.x = -0.3;
          g.add(claw);
        }
      },
      trident: () => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 24, 6), this._m(0x664422));
        shaft.position.y = 12;
        g.add(shaft);
        for (let i = -1; i <= 1; i++) {
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.6, 4, 4), metal);
          tip.position.set(i * 2, 25, 0);
          g.add(tip);
        }
      },
      chakram: () => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(5, 0.6, 8, 16), metal);
        ring.position.y = 12;
        g.add(ring);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 4), glow);
        gem.position.y = 12;
        g.add(gem);
      },
      shield: () => {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 1, 16), this._m(se));
        body.rotation.x = Math.PI / 2;
        body.position.set(0, 12, 2);
        g.add(body);
      },
      whip: () => {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 6), this._m(0x664422));
        handle.position.y = 3;
        g.add(handle);
        for (let i = 0; i < 8; i++) {
          const seg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, 0.4), this._m(0x886644));
          const t = i / 7;
          seg.position.set(Math.sin(t * 3) * 3, 6 + i * 2.5, Math.cos(t * 2) * 2);
          g.add(seg);
        }
      },
      bomb: () => {
        const body = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8), this._m(0x222222));
        body.position.y = 12;
        g.add(body);
      },
      orb: () => {
        const orb = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), glow);
        orb.position.y = 12;
        g.add(orb);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.3, 8, 16), metal);
        ring.position.y = 12;
        g.add(ring);
      },
    };

    const builder = weaponShapes[id];
    if (builder) builder();
    this.charGroup.add(g);
  },

  _buildPet() {
    const id = this.current.pet;
    if (id === 'none') return;

    this.petGroup = new THREE.Group();

    const petDefs = {
      dragon_baby:   { color: 0x22aa44, size: 3 },
      phoenix_baby:  { color: 0xff6600, size: 2.5 },
      wolf_baby:     { color: 0x888888, size: 2.8 },
      bird:          { color: 0x4488cc, size: 2 },
      butterfly:     { color: 0xcc44aa, size: 1.5 },
      bat:           { color: 0x222222, size: 2.2 },
      ghost_wisp:    { color: 0xaabbcc, size: 2.5 },
      orbiter:       { color: 0x6c3483, size: 2.8 },
      spark:         { color: 0xffdd00, size: 1.8 },
    };

    const def = petDefs[id];
    if (!def) return;

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(def.size, 12, 8),
      this._glow(def.color, 0.5)
    );
    this.petGroup.add(body);

    const eyeGeo = new THREE.SphereGeometry(def.size * 0.2, 6, 4);
    const eyeMat = this._m(0xffffff);
    [-1, 1].forEach(side => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(side * def.size * 0.3, def.size * 0.2, def.size * 0.7);
      this.petGroup.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(def.size * 0.1, 4, 4), this._m(0x111111));
      pupil.position.set(side * def.size * 0.3, def.size * 0.2, def.size * 0.85);
      this.petGroup.add(pupil);
    });

    if (id.includes('dragon') || id.includes('phoenix')) {
      [-1, 1].forEach(side => {
        const wing = new THREE.Mesh(
          new THREE.BoxGeometry(1, def.size * 2, def.size),
          this._m(def.color, { transparent: true, opacity: 0.6 })
        );
        wing.position.set(side * def.size * 1.2, 0, -def.size * 0.3);
        wing.rotation.z = side * 0.4;
        this.petGroup.add(wing);
      });
    }

    this.petGroup.position.set(25, 30, 0);
    this.scene.add(this.petGroup);
  },

  _accCape(pri, sec) {
    const cape = new THREE.Mesh(new THREE.BoxGeometry(14, 22, 1.2), this._m(sec, { side: THREE.DoubleSide }));
    cape.position.set(0, 30, -9);
    this.charGroup.add(cape);
  },

  _accWings(pri) {
    [-1, 1].forEach(side => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.5, 18, 12), this._m(pri, { transparent: true, opacity: 0.65, side: THREE.DoubleSide }));
      wing.position.set(side * 11, 36, -7);
      wing.rotation.z = side * 0.35;
      this.charGroup.add(wing);
    });
  },

  _accAura(_, __, acc) {
    const aura = new THREE.Mesh(new THREE.SphereGeometry(24, 20, 14), this._m(acc, { transparent: true, opacity: 0.08, emissive: acc, emissiveIntensity: 0.25 }));
    aura.position.y = 30;
    this.charGroup.add(aura);
  },

  _accAntenna(_, __, acc) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 9, 4), this._m(0x888888));
    stick.position.set(0, 66, 0);
    this.charGroup.add(stick);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), this._glow(acc, 0.6));
    tip.position.set(0, 72, 0);
    this.charGroup.add(tip);
  },

  _accHalo(_, __, acc) {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(6, 0.4, 8, 24), this._glow(acc, 0.7));
    halo.position.set(0, 66, 0);
    halo.rotation.x = -Math.PI / 2;
    this.charGroup.add(halo);
  },

  _accScarf(pri, sec) {
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 14), this._m(sec));
    scarf.position.set(0, 46, 2);
    this.charGroup.add(scarf);
    [-3, 3].forEach(x => {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 10), this._m(sec));
      tail.position.set(x, 44, -6);
      tail.rotation.x = 0.4;
      this.charGroup.add(tail);
    });
  },

  _accBackpack(pri, sec, acc) {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 5), this._m(sec));
    pack.position.set(0, 33, -9);
    this.charGroup.add(pack);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 6, 6), this._m(acc));
    tube.position.set(-2, 38, -11);
    tube.rotation.z = 0.2;
    this.charGroup.add(tube);
  },

  _accTail(pri) {
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(1.5 - i * 0.2, 6, 4), this._m(pri));
      seg.position.set(0, 18 - i * 0.5, -8 - i * 2);
      this.charGroup.add(seg);
    }
  },

  _accFloating(_, __, acc) {
    for (let i = 0; i < 5; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), this._glow(acc, 0.6));
      const angle = (i / 5) * Math.PI * 2;
      orb.position.set(Math.cos(angle) * 18, 30 + Math.sin(angle) * 5, Math.sin(angle) * 18);
      this.charGroup.add(orb);
      this._floatingOrbs.push(orb);
    }
  },

  _accEnergy(_, __, acc) {
    [-1, 1].forEach(side => {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(4, 12, 4), this._glow(acc, 0.5));
      wing.position.set(side * 12, 35, -5);
      wing.rotation.z = side * 0.6;
      wing.rotation.x = -0.3;
      this.charGroup.add(wing);
    });
  },

  _accChain() {
    for (let i = 0; i < 8; i++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.3, 6, 8), this._m(0x888888));
      link.position.set(0, 45 - i * 3, -8);
      link.rotation.x = Math.PI / 2;
      this.charGroup.add(link);
    }
  },

  _accThorns() {
    for (let i = 0; i < 6; i++) {
      const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.5, 4), this._m(new THREE.Color(0x446633)));
      const angle = (i / 6) * Math.PI * 2;
      thorn.position.set(Math.sin(angle) * 9, 33 + Math.cos(angle) * 3, Math.cos(angle) * 9);
      thorn.lookAt(0, 33, 0);
      thorn.rotation.x += Math.PI;
      this.charGroup.add(thorn);
    }
  },

  _accTribal(pri, sec, acc) {
    for (let i = 0; i < 4; i++) {
      const feather = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 1.5), this._m(i % 2 === 0 ? pri : acc));
      feather.position.set(-8 + i * 2, 48, -3);
      feather.rotation.z = -0.3 + i * 0.15;
      this.charGroup.add(feather);
    }
  },

  _accTech(_, sec, acc) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(15, 0.3, 6, 24), this._glow(acc, 0.4));
    ring.position.y = 30;
    ring.rotation.x = Math.PI / 4;
    this.charGroup.add(ring);
    for (let i = 0; i < 3; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), this._glow(acc, 0.7));
      const angle = (i / 3) * Math.PI * 2;
      dot.position.set(Math.cos(angle) * 15, 30 + Math.sin(angle) * 15 * Math.sin(Math.PI / 4), Math.sin(angle) * 15 * Math.cos(Math.PI / 4));
      this.charGroup.add(dot);
    }
  },

  _randomize() {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    this.current.helmet = pick(RangerParts.helmets).id;
    this.current.chest = pick(RangerParts.chests).id;
    this.current.weapon = pick(RangerParts.weapons).id;
    this.current.boots = pick(RangerParts.boots).id;
    this.current.shoulder = pick(RangerParts.shoulders).id;
    this.current.accessory = pick(RangerParts.accessories).id;
    this.current.mask = pick(RangerParts.masks).id;
    this.current.pet = pick(RangerParts.pets).id;

    const theme = pick(RangerParts.themes);
    this.current.colors = { primary: theme.primary, secondary: theme.secondary, accent: theme.accent, visor: theme.visor, dark: theme.dark };
    ['primary', 'secondary', 'accent', 'visor', 'dark'].forEach(k => {
      const el = document.getElementById('cc-color-' + k);
      if (el) el.value = this.current.colors[k];
    });

    this.buildCharacter();
  },

  getData() {
    return {
      name: this.current.name,
      class: this.current.class,
      helmet: this.current.helmet,
      chest: this.current.chest,
      weapon: this.current.weapon,
      boots: this.current.boots,
      shoulder: this.current.shoulder,
      accessory: this.current.accessory,
      mask: this.current.mask,
      pet: this.current.pet,
      colors: { ...this.current.colors },
      stats: { ...this.current.stats },
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
      const cls = RangerParts.classes[r.class] || RangerParts.classes.warrior;
      card.innerHTML = `
        <div class="cc-gallery-colors">
          <span style="background:${r.colors.primary}"></span>
          <span style="background:${r.colors.secondary}"></span>
          <span style="background:${r.colors.accent}"></span>
        </div>
        <div class="cc-gallery-name">${r.name}</div>
        <div class="cc-gallery-class">${cls.emoji} ${cls.name}</div>
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
    Object.assign(this.current, {
      name: data.name || 'Ranger Sem Nome',
      class: data.class || 'warrior',
      helmet: data.helmet || 'dino',
      chest: data.chest || 'classic',
      weapon: data.weapon || 'sword',
      boots: data.boots || 'standard',
      shoulder: data.shoulder || 'none',
      accessory: data.accessory || 'none',
      mask: data.mask || 'none',
      pet: data.pet || 'none',
    });
    if (data.colors) Object.assign(this.current.colors, data.colors);
    if (data.stats) Object.assign(this.current.stats, data.stats);

    document.getElementById('cc-name').value = this.current.name;
    document.getElementById('cc-name-label').textContent = this.current.name.toUpperCase();
    document.getElementById('cc-ranger-name').textContent = this.current.name.toUpperCase();
    ['primary', 'secondary', 'accent', 'visor', 'dark'].forEach(k => {
      const el = document.getElementById('cc-color-' + k);
      if (el) el.value = this.current.colors[k];
    });
    ['hp', 'atk', 'spd', 'def'].forEach(k => {
      this._setStat(k, this.current.stats[k]);
    });

    this.buildCharacter();
  },
};

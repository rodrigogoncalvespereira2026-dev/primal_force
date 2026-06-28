const CharacterCreator = {
  scene: null,
  camera: null,
  renderer: null,
  charGroup: null,
  _raf: null,

  _camAngle: 0,
  _camPitch: 0.5,
  _camDist: 80,
  _dragging: false,
  _lastMouse: null,

  current: {
    name: 'Ranger Sem Nome',
    class: 'warrior',
    helmet: 'dino',
    chest: 'classic',
    weapon: 'sword',
    boots: 'standard',
    accessory: 'none',
    colors: {
      primary:   '#2244cc',
      secondary: '#cc2222',
      accent:    '#ffcc00',
      visor:     '#22ccff',
      dark:      '#111122',
    },
    stats: { hp: 100, atk: 12, spd: 5, def: 6 },
  },

  init() {
    this._setupScene();
    this._buildUI();
    this._bindEvents();
    this.buildCharacter();
    this._loop();
  },

  _setupScene() {
    const canvas = document.getElementById('cc-canvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = Math.max(rect.width, 300);
    const h = Math.max(rect.height, 300);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e18);
    this.scene.fog = new THREE.Fog(0x0a0e18, 150, 400);

    this.camera = new THREE.PerspectiveCamera(40, w / h, 1, 500);
    this._updateCamera();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    const ambient = new THREE.AmbientLight(0x445566, 0.6);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffeedd, 1.0);
    dir.position.set(30, 60, 40);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 10;
    dir.shadow.camera.far = 200;
    dir.shadow.camera.left = -60;
    dir.shadow.camera.right = 60;
    dir.shadow.camera.top = 60;
    dir.shadow.camera.bottom = -60;
    this.scene.add(dir);

    const hemi = new THREE.HemisphereLight(0x4466aa, 0x223322, 0.4);
    this.scene.add(hemi);

    const rim = new THREE.PointLight(0x6688cc, 0.6, 120);
    rim.position.set(-30, 40, -30);
    this.scene.add(rim);

    this._buildPlatform();

    window.addEventListener('resize', () => {
      const r = canvas.parentElement.getBoundingClientRect();
      const w = Math.max(r.width, 300);
      const h = Math.max(r.height, 300);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  },

  _buildPlatform() {
    const platform = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(30, 34, 6, 32);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -3;
    base.receiveShadow = true;
    platform.add(base);

    const ringGeo = new THREE.TorusGeometry(32, 1.5, 8, 48);
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x3c82f6, emissive: 0x1a4a8a, emissiveIntensity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.5;
    platform.add(ring);

    const topGeo = new THREE.CylinderGeometry(28, 28, 1, 32);
    const topMat = new THREE.MeshLambertMaterial({ color: 0x111827, transparent: true, opacity: 0.7 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.5;
    top.receiveShadow = true;
    platform.add(top);

    this.scene.add(platform);
  },

  _updateCamera() {
    const x = Math.sin(this._camAngle) * Math.cos(this._camPitch) * this._camDist;
    const y = Math.sin(this._camPitch) * this._camDist;
    const z = Math.cos(this._camAngle) * Math.cos(this._camPitch) * this._camDist;
    this.camera.position.set(x, y + 10, z);
    this.camera.lookAt(0, 18, 0);
  },

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop());
    if (this.charGroup) {
      this.charGroup.rotation.y += 0.003;
    }
    this.renderer.render(this.scene, this.camera);
  },

  destroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this.renderer) this.renderer.dispose();
  },

  _buildUI() {
    this._populateOptions('opt-helmet', RangerParts.helmets, 'helmet');
    this._populateOptions('opt-chest', RangerParts.chests, 'chest');
    this._populateOptions('opt-weapon', RangerParts.weapons, 'weapon');
    this._populateOptions('opt-boots', RangerParts.boots, 'boots');
    this._populateOptions('opt-accessory', RangerParts.accessories, 'accessory');
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

  _bindEvents() {
    const canvas = document.getElementById('cc-canvas');

    canvas.addEventListener('pointerdown', e => {
      this._dragging = true;
      this._lastMouse = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', e => {
      if (!this._dragging) return;
      const dx = e.clientX - this._lastMouse.x;
      const dy = e.clientY - this._lastMouse.y;
      this._camAngle -= dx * 0.008;
      this._camPitch = Math.max(0.1, Math.min(1.2, this._camPitch + dy * 0.005));
      this._lastMouse = { x: e.clientX, y: e.clientY };
      this._updateCamera();
    });

    canvas.addEventListener('pointerup', () => {
      this._dragging = false;
      this._lastMouse = null;
    });

    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this._camDist = Math.max(40, Math.min(200, this._camDist + e.deltaY * 0.1));
      this._updateCamera();
    }, { passive: false });

    document.getElementById('cc-name').oninput = (e) => {
      this.current.name = e.target.value;
      document.getElementById('cc-name-label').textContent = e.target.value.toUpperCase() || 'RANGER SEM NOME';
    };

    document.querySelectorAll('.cc-class-btn').forEach(btn => {
      btn.onclick = () => {
        this.current.class = btn.dataset.class;
        document.querySelectorAll('.cc-class-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cls = RangerParts.classes[this.current.class];
        this._setStat('hp', cls.hp);
        this._setStat('atk', cls.atk);
        this._setStat('spd', cls.spd);
        this._setStat('def', cls.def);
        this.buildCharacter();
      };
    });

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
          this.current.stats[key] = parseInt(e.target.value);
          document.getElementById('cc-' + key + '-val').textContent = e.target.value;
        };
      }
    });

    document.getElementById('btn-save').onclick = () => this._save();
    document.getElementById('btn-export-json').onclick = () => this._exportJSON();
    document.getElementById('btn-export').onclick = () => this._exportJSON();
    document.getElementById('btn-gallery').onclick = () => this._openGallery();
    document.getElementById('gallery-close').onclick = () => {
      document.getElementById('gallery-modal').style.display = 'none';
    };
    document.getElementById('gallery-modal').onclick = (e) => {
      if (e.target.id === 'gallery-modal') e.target.style.display = 'none';
    };
  },

  _setStat(key, val) {
    const input = document.getElementById('cc-' + key);
    if (input) {
      input.value = val;
      this.current.stats[key] = val;
      document.getElementById('cc-' + key + '-val').textContent = val;
    }
  },

  buildCharacter() {
    if (this.charGroup) {
      this.scene.remove(this.charGroup);
    }
    this.charGroup = new THREE.Group();

    const c = this.current.colors;
    const primary   = new THREE.Color(c.primary);
    const secondary = new THREE.Color(c.secondary);
    const accent    = new THREE.Color(c.accent);
    const visor     = new THREE.Color(c.visor);
    const dark      = new THREE.Color(c.dark);
    const white     = new THREE.Color(0xffffff);

    this._buildHelmet(primary, secondary, accent, visor, dark);
    this._buildBody(primary, secondary, accent, dark);
    this._buildArms(primary, secondary, accent);
    this._buildLegs(primary, secondary, dark);
    this._buildWeapon(accent, secondary);

    const accDef = RangerParts.accessories.find(a => a.id === this.current.accessory);
    if (accDef && accDef.build) {
      this['_' + accDef.build](primary, secondary, accent);
    }

    this.scene.add(this.charGroup);
  },

  _buildHelmet(pri, sec, acc, vis, dk) {
    const g = new THREE.Group();

    const headGeo = new THREE.SphereGeometry(7, 12, 10);
    const headMat = new THREE.MeshLambertMaterial({ color: pri });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 50;
    head.scale.set(1, 1.1, 1);
    head.castShadow = true;
    g.add(head);

    const visorGeo = new THREE.BoxGeometry(10, 4, 6);
    const visorMat = new THREE.MeshLambertMaterial({ color: vis, emissive: vis, emissiveIntensity: 0.4 });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 50, 4);
    g.add(visorMesh);

    const topGeo = new THREE.ConeGeometry(4, 8, 6);
    const topMat = new THREE.MeshLambertMaterial({ color: sec });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 58;
    top.castShadow = true;
    g.add(top);

    const helmetType = this.current.helmet;
    if (helmetType === 'dino' || helmetType === 'dragon') {
      const jawGeo = new THREE.BoxGeometry(8, 3, 5);
      const jawMat = new THREE.MeshLambertMaterial({ color: sec });
      const jaw = new THREE.Mesh(jawGeo, jawMat);
      jaw.position.set(0, 46, 5);
      g.add(jaw);

      for (let i = -1; i <= 1; i += 2) {
        const toothGeo = new THREE.ConeGeometry(0.8, 2, 4);
        const toothMat = new THREE.MeshLambertMaterial({ color: white });
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        tooth.position.set(i * 2.5, 45, 7);
        tooth.rotation.x = Math.PI;
        g.add(tooth);
      }
    }

    if (helmetType === 'wolf' || helmetType === 'tiger') {
      for (let i = -1; i <= 1; i += 2) {
        const earGeo = new THREE.ConeGeometry(2, 5, 4);
        const earMat = new THREE.MeshLambertMaterial({ color: pri });
        const ear = new THREE.Mesh(earGeo, earMat);
        ear.position.set(i * 5, 57, 0);
        ear.rotation.z = i * 0.3;
        g.add(ear);
      }
    }

    if (helmetType === 'eagle' || helmetType === 'phoenix') {
      const beakGeo = new THREE.ConeGeometry(2, 5, 4);
      const beakMat = new THREE.MeshLambertMaterial({ color: acc });
      const beak = new THREE.Mesh(beakGeo, beakMat);
      beak.position.set(0, 49, 7);
      beak.rotation.x = Math.PI / 2;
      g.add(beak);
    }

    if (helmetType === 'ninja') {
      const maskGeo = new THREE.BoxGeometry(10, 2, 6);
      const maskMat = new THREE.MeshLambertMaterial({ color: dk });
      const mask = new THREE.Mesh(maskGeo, maskMat);
      mask.position.set(0, 50, 4);
      g.add(mask);
    }

    if (helmetType === 'samurai') {
      const crestGeo = new THREE.BoxGeometry(1, 6, 3);
      const crestMat = new THREE.MeshLambertMaterial({ color: acc });
      const crest = new THREE.Mesh(crestGeo, crestMat);
      crest.position.set(0, 58, 2);
      g.add(crest);
    }

    this.charGroup.add(g);
  },

  _buildBody(pri, sec, acc, dk) {
    const g = new THREE.Group();

    const torsoGeo = new THREE.CylinderGeometry(7, 8, 18, 8);
    const torsoMat = new THREE.MeshLambertMaterial({ color: pri });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 30;
    torso.castShadow = true;
    g.add(torso);

    const chestType = this.current.chest;
    if (chestType === 'armor' || chestType === 'heavy') {
      const plateGeo = new THREE.BoxGeometry(12, 10, 4);
      const plateMat = new THREE.MeshLambertMaterial({ color: sec });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(0, 33, 5);
      g.add(plate);

      if (chestType === 'heavy') {
        const shoulderGeo = new THREE.SphereGeometry(4, 8, 6);
        const shoulderMat = new THREE.MeshLambertMaterial({ color: sec });
        for (let i = -1; i <= 1; i += 2) {
          const sh = new THREE.Mesh(shoulderGeo, shoulderMat);
          sh.position.set(i * 10, 38, 0);
          sh.castShadow = true;
          g.add(sh);
        }
      }
    }

    if (chestType === 'primal') {
      const crystalGeo = new THREE.OctahedronGeometry(3, 0);
      const crystalMat = new THREE.MeshLambertMaterial({ color: acc, emissive: acc, emissiveIntensity: 0.3 });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(0, 34, 6);
      g.add(crystal);
    }

    const beltGeo = new THREE.CylinderGeometry(8.5, 8.5, 3, 8);
    const beltMat = new THREE.MeshLambertMaterial({ color: acc });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 21;
    g.add(belt);

    const buckleGeo = new THREE.BoxGeometry(4, 3, 2);
    const buckleMat = new THREE.MeshLambertMaterial({ color: acc, emissive: acc, emissiveIntensity: 0.2 });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 21, 8);
    g.add(buckle);

    this.charGroup.add(g);
  },

  _buildArms(pri, sec, acc) {
    for (let side = -1; side <= 1; side += 2) {
      const g = new THREE.Group();

      const shoulderGeo = new THREE.SphereGeometry(3.5, 8, 6);
      const shoulderMat = new THREE.MeshLambertMaterial({ color: sec });
      const shoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulder.position.set(side * 11, 38, 0);
      g.add(shoulder);

      const armGeo = new THREE.CylinderGeometry(2.5, 3, 14, 8);
      const armMat = new THREE.MeshLambertMaterial({ color: pri });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(side * 11, 28, 0);
      arm.castShadow = true;
      g.add(arm);

      const gloveGeo = new THREE.SphereGeometry(3, 8, 6);
      const gloveMat = new THREE.MeshLambertMaterial({ color: acc });
      const glove = new THREE.Mesh(gloveGeo, gloveMat);
      glove.position.set(side * 11, 20, 0);
      g.add(glove);

      this.charGroup.add(g);
    }
  },

  _buildLegs(pri, sec, dk) {
    for (let side = -1; side <= 1; side += 2) {
      const g = new THREE.Group();

      const legGeo = new THREE.CylinderGeometry(3, 3.5, 16, 8);
      const legMat = new THREE.MeshLambertMaterial({ color: pri });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(side * 5, 10, 0);
      leg.castShadow = true;
      g.add(leg);

      const bootGeo = new THREE.CylinderGeometry(3.5, 4, 6, 8);
      const bootMat = new THREE.MeshLambertMaterial({ color: dk });
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(side * 5, 1, 0);
      boot.castShadow = true;
      g.add(boot);

      this.charGroup.add(g);
    }
  },

  _buildWeapon(acc, sec) {
    const weaponType = this.current.weapon;
    if (weaponType === 'none') return;

    const g = new THREE.Group();

    if (weaponType === 'sword') {
      const bladeGeo = new THREE.BoxGeometry(1.5, 22, 0.8);
      const bladeMat = new THREE.MeshLambertMaterial({ color: 0xccccdd });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(14, 35, 0);
      blade.rotation.z = -0.3;
      blade.castShadow = true;
      g.add(blade);

      const guardGeo = new THREE.BoxGeometry(5, 1.5, 2);
      const guardMat = new THREE.MeshLambertMaterial({ color: acc });
      const guard = new THREE.Mesh(guardGeo, guardMat);
      guard.position.set(12, 25, 0);
      guard.rotation.z = -0.3;
      g.add(guard);

      const handleGeo = new THREE.CylinderGeometry(0.8, 0.8, 5, 6);
      const handleMat = new THREE.MeshLambertMaterial({ color: sec });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.set(11, 22, 0);
      handle.rotation.z = -0.3;
      g.add(handle);
    }

    if (weaponType === 'lance') {
      const shaftGeo = new THREE.CylinderGeometry(0.6, 0.6, 30, 6);
      const shaftMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(13, 30, 0);
      shaft.rotation.z = -0.2;
      shaft.castShadow = true;
      g.add(shaft);

      const tipGeo = new THREE.ConeGeometry(2, 6, 4);
      const tipMat = new THREE.MeshLambertMaterial({ color: acc });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(15, 47, 0);
      tip.rotation.z = -0.2;
      g.add(tip);
    }

    if (weaponType === 'axe') {
      const shaftGeo = new THREE.CylinderGeometry(0.7, 0.7, 16, 6);
      const shaftMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(13, 30, 0);
      shaft.rotation.z = -0.3;
      g.add(shaft);

      const bladeGeo = new THREE.BoxGeometry(8, 6, 1.5);
      const bladeMat = new THREE.MeshLambertMaterial({ color: 0xaaaacc });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(14, 39, 0);
      blade.rotation.z = -0.3;
      blade.castShadow = true;
      g.add(blade);
    }

    if (weaponType === 'hammer') {
      const shaftGeo = new THREE.CylinderGeometry(0.7, 0.7, 14, 6);
      const shaftMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(13, 28, 0);
      shaft.rotation.z = -0.3;
      g.add(shaft);

      const headGeo = new THREE.BoxGeometry(6, 6, 6);
      const headMat = new THREE.MeshLambertMaterial({ color: sec });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(14, 37, 0);
      head.castShadow = true;
      g.add(head);
    }

    if (weaponType === 'staff') {
      const shaftGeo = new THREE.CylinderGeometry(0.5, 0.5, 28, 6);
      const shaftMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(13, 32, 0);
      shaft.rotation.z = -0.15;
      g.add(shaft);

      const orbGeo = new THREE.SphereGeometry(2.5, 8, 6);
      const orbMat = new THREE.MeshLambertMaterial({ color: acc, emissive: acc, emissiveIntensity: 0.5 });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(14, 47, 0);
      g.add(orb);
    }

    if (weaponType === 'blaster') {
      const bodyGeo = new THREE.BoxGeometry(3, 4, 8);
      const bodyMat = new THREE.MeshLambertMaterial({ color: 0x444455 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(14, 26, 3);
      body.castShadow = true;
      g.add(body);

      const barrelGeo = new THREE.CylinderGeometry(1, 1, 8, 6);
      const barrelMat = new THREE.MeshLambertMaterial({ color: 0x666677 });
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(14, 26, 9);
      barrel.rotation.x = Math.PI / 2;
      g.add(barrel);
    }

    if (weaponType === 'claws') {
      for (let i = 0; i < 3; i++) {
        const clawGeo = new THREE.ConeGeometry(0.6, 5, 4);
        const clawMat = new THREE.MeshLambertMaterial({ color: acc });
        const claw = new THREE.Mesh(clawGeo, clawMat);
        claw.position.set(12 + i * 1.5, 20, 2);
        claw.rotation.x = -0.5;
        g.add(claw);
      }
    }

    if (weaponType === 'shield') {
      const shieldGeo = new THREE.BoxGeometry(2, 14, 12);
      const shieldMat = new THREE.MeshLambertMaterial({ color: sec });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.set(-14, 30, 2);
      shield.castShadow = true;
      g.add(shield);

      const emblemGeo = new THREE.SphereGeometry(3, 8, 6);
      const emblemMat = new THREE.MeshLambertMaterial({ color: acc });
      const emblem = new THREE.Mesh(emblemGeo, emblemMat);
      emblem.position.set(-15, 32, 5);
      g.add(emblem);
    }

    this.charGroup.add(g);
  },

  _accCape(pri, sec, acc) {
    const capeGeo = new THREE.BoxGeometry(12, 20, 1);
    const capeMat = new THREE.MeshLambertMaterial({ color: sec, side: THREE.DoubleSide });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 28, -8);
    this.charGroup.add(cape);
  },

  _accShoulder(pri, sec, acc) {
    for (let side = -1; side <= 1; side += 2) {
      const geo = new THREE.BoxGeometry(6, 3, 6);
      const mat = new THREE.MeshLambertMaterial({ color: acc });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(side * 12, 40, 0);
      this.charGroup.add(mesh);
    }
  },

  _accWings(pri, sec, acc) {
    for (let side = -1; side <= 1; side += 2) {
      const wingGeo = new THREE.BoxGeometry(2, 16, 10);
      const wingMat = new THREE.MeshLambertMaterial({ color: pri, transparent: true, opacity: 0.7 });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(side * 10, 35, -6);
      wing.rotation.z = side * 0.4;
      this.charGroup.add(wing);
    }
  },

  _accAura(pri, sec, acc) {
    const auraGeo = new THREE.SphereGeometry(22, 16, 12);
    const auraMat = new THREE.MeshLambertMaterial({ color: acc, transparent: true, opacity: 0.12, emissive: acc, emissiveIntensity: 0.3 });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.position.y = 28;
    this.charGroup.add(aura);
  },

  _accAntenna(pri, sec, acc) {
    const stickGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 4);
    const stickMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.position.set(0, 62, 0);
    this.charGroup.add(stick);

    const tipGeo = new THREE.SphereGeometry(1, 6, 4);
    const tipMat = new THREE.MeshLambertMaterial({ color: acc, emissive: acc, emissiveIntensity: 0.5 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(0, 67, 0);
    this.charGroup.add(tip);
  },

  getData() {
    return {
      name: this.current.name,
      class: this.current.class,
      helmet: this.current.helmet,
      chest: this.current.chest,
      weapon: this.current.weapon,
      boots: this.current.boots,
      accessory: this.current.accessory,
      colors: { ...this.current.colors },
      stats: { ...this.current.stats },
      createdAt: Date.now(),
    };
  },

  loadData(data) {
    if (!data) return;
    Object.assign(this.current, {
      name: data.name || 'Ranger Sem Nome',
      class: data.class || 'warrior',
      helmet: data.helmet || 'dino',
      chest: data.chest || 'classic',
      weapon: data.weapon || 'sword',
      boots: data.boots || 'standard',
      accessory: data.accessory || 'none',
    });
    if (data.colors) Object.assign(this.current.colors, data.colors);
    if (data.stats) Object.assign(this.current.stats, data.stats);

    document.getElementById('cc-name').value = this.current.name;
    document.getElementById('cc-name-label').textContent = this.current.name.toUpperCase();
    ['primary', 'secondary', 'accent', 'visor', 'dark'].forEach(k => {
      const el = document.getElementById('cc-color-' + k);
      if (el) el.value = this.current.colors[k];
    });
    ['hp', 'atk', 'spd', 'def'].forEach(k => {
      this._setStat(k, this.current.stats[k]);
    });
    document.querySelectorAll('.cc-class-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.class === this.current.class);
    });

    this._buildUI();
    this.buildCharacter();
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
    a.download = `ranger_${data.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  _openGallery() {
    const modal = document.getElementById('gallery-modal');
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';

    let rangers = [];
    try { rangers = JSON.parse(localStorage.getItem('prf_custom_rangers') || '[]'); } catch {}

    if (rangers.length === 0) {
      grid.innerHTML = '<div class="cc-gallery-empty">Nenhum ranger salvo ainda.<br>Cria o teu primeiro ranger!</div>';
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
        <div class="cc-gallery-stats">❤️${r.stats.hp} 💥${r.stats.atk} 🏃${r.stats.spd} 🛡️${r.stats.def}</div>
        <div class="cc-gallery-actions">
          <button class="cc-gallery-btn load" data-idx="${i}">✏️ Editar</button>
          <button class="cc-gallery-btn del" data-idx="${i}">🗑️ Apagar</button>
        </div>
      `;
      card.querySelector('.load').onclick = () => {
        this.loadData(r);
        modal.style.display = 'none';
      };
      card.querySelector('.del').onclick = () => {
        if (confirm('Apagar "' + r.name + '"?')) {
          rangers.splice(i, 1);
          localStorage.setItem('prf_custom_rangers', JSON.stringify(rangers));
          this._openGallery();
        }
      };
      grid.appendChild(card);
    });

    modal.style.display = 'flex';
  },
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => CharacterCreator.init(), 50));
} else {
  setTimeout(() => CharacterCreator.init(), 50);
}

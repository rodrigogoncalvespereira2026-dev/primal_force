const World3D = {
  _group: null,
  _waterTiles: [],
  _bushTiles: [],
  _wallTiles: [],
  _ruinTiles: [],

  TILE: 48,
  WALL_H: 28,
  BUSH_H: 18,
  RUIN_H: 14,

  COLORS: {
    ground:  [0x111c11, 0x0a1a0a, 0x1a1a1a, 0x0a1220, 0x1c1410, 0xc2a050, 0xcc3300, 0xe0e8f0],
    wall:    0x555566,
    wallTop: 0x666677,
    bush:    0x1a6b1a,
    bushTop: 0x228822,
    water:   0x0a1a40,
    waterTop:0x163060,
    ruin:    0x3a2a1a,
    ruinTop: 0x4a3a2a,
    sand:    0xc2a050,
    lava:    0xcc3300,
    lavaTop: 0xff4400,
    snow:    0xe0e8f0,
    snowTop: 0xf0f4f8,
  },

  build(world, group) {
    this._group = group || new THREE.Group();
    this._waterTiles = [];
    this._bushTiles = [];
    this._wallTiles = [];
    this._ruinTiles = [];

    const T = this.TILE;
    const cols = Math.ceil(world.W / T);
    const rows = Math.ceil(world.H / T);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(world.W, world.H);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x111c11 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(world.W / 2, -1, world.H / 2);
    ground.receiveShadow = true;
    this._group.add(ground);

    // Tile grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = world.getTile(c, r);
        const x = c * T + T / 2;
        const z = r * T + T / 2;

        if (t === 3) {
          this._addWater(x, z, T);
        } else if (t === 1) {
          if ((c + r) % 4 === 0) this._addBush(x, z);
        } else if (t === 2) {
          this._addWall(x, z, T);
        } else if (t === 4) {
          this._addRuin(x, z, T);
        } else if (t === 5) {
          if ((c * 3 + r * 7) % 9 === 0) this._addRock(x, z);
        } else if (t === 6) {
          this._addLava(x, z, T);
        } else if (t === 7) {
          if ((c + r) % 3 === 0) this._addSnowRock(x, z);
        } else {
          if ((c * 7 + r * 3) % 11 === 0) this._addSmallBush(x, z);
          if ((c * 3 + r * 7) % 13 === 0) this._addRock(x, z);
        }
      }
    }

    return this._group;
  },

  _addWater(x, z, size) {
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshLambertMaterial({
      color: this.COLORS.water,
      transparent: true,
      opacity: 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.5, z);
    this._group.add(mesh);
    this._waterTiles.push(mesh);
  },

  _addWall(x, z, size) {
    // Parede principal
    const geo = new THREE.BoxGeometry(size * 0.9, this.WALL_H, size * 0.9);
    const mat = new THREE.MeshLambertMaterial({ color: this.COLORS.wall });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, this.WALL_H / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this._group.add(mesh);

    // Topo da parede
    const topGeo = new THREE.BoxGeometry(size * 0.95, 3, size * 0.95);
    const topMat = new THREE.MeshLambertMaterial({ color: this.COLORS.wallTop });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.set(x, this.WALL_H + 1.5, z);
    topMesh.castShadow = true;
    this._group.add(topMesh);

    // Detalhe de pedra
    if (Math.random() > 0.5) {
      const detGeo = new THREE.BoxGeometry(size * 0.4, 6, size * 0.2);
      const detMat = new THREE.MeshLambertMaterial({ color: 0x444455 });
      const det = new THREE.Mesh(detGeo, detMat);
      det.position.set(x + size * 0.2, this.WALL_H * 0.4, z);
      this._group.add(det);
    }

    this._wallTiles.push(mesh);
  },

  _addBush(x, z) {
    // Arbusto — combinação de esferas verdes
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Base do arbusto
    const baseGeo = new THREE.SphereGeometry(this.BUSH_H * 0.6, 8, 6);
    const baseMat = new THREE.MeshLambertMaterial({ color: this.COLORS.bush });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = this.BUSH_H * 0.4;
    base.scale.y = 0.7;
    base.castShadow = true;
    group.add(base);

    // Topo do arbusto
    const topGeo = new THREE.SphereGeometry(this.BUSH_H * 0.45, 8, 6);
    const topMat = new THREE.MeshLambertMaterial({ color: this.COLORS.bushTop });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(
      (Math.random() - 0.5) * 4,
      this.BUSH_H * 0.7,
      (Math.random() - 0.5) * 4
    );
    top.castShadow = true;
    group.add(top);

    this._group.add(group);
    this._bushTiles.push(group);
  },

  _addSmallBush(x, z) {
    const geo = new THREE.SphereGeometry(5, 6, 5);
    const mat = new THREE.MeshLambertMaterial({ color: 0x1a5a1a });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 3, z);
    mesh.scale.y = 0.6;
    mesh.castShadow = true;
    this._group.add(mesh);
  },

  _addRock(x, z) {
    const size = 3 + Math.random() * 4;
    const geo = new THREE.DodecahedronGeometry(size, 0);
    const mat = new THREE.MeshLambertMaterial({ color: 0x333340 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, size * 0.4, z);
    mesh.rotation.set(Math.random(), Math.random(), 0);
    mesh.castShadow = true;
    this._group.add(mesh);
  },

  _addRuin(x, z, size) {
    const h = this.RUIN_H + Math.random() * 10;
    const geo = new THREE.CylinderGeometry(size * 0.25, size * 0.3, h, 6);
    const mat = new THREE.MeshLambertMaterial({ color: this.COLORS.ruin });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this._group.add(mesh);

    const topGeo = new THREE.BoxGeometry(size * 0.35, 2, size * 0.35);
    const topMat = new THREE.MeshLambertMaterial({ color: this.COLORS.ruinTop });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(x, h + 1, z);
    this._group.add(top);

    this._ruinTiles.push(mesh);
  },

  _addLava(x, z, size) {
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshLambertMaterial({
      color: this.COLORS.lava,
      emissive: 0xff2200,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.3, z);
    this._group.add(mesh);
    this._waterTiles.push(mesh);

    if (Math.random() > 0.6) {
      const topGeo = new THREE.PlaneGeometry(size * 0.4, size * 0.4);
      const topMat = new THREE.MeshLambertMaterial({
        color: this.COLORS.lavaTop,
        emissive: 0xff6600,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
      });
      const topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.rotation.x = -Math.PI / 2;
      topMesh.position.set(x + (Math.random() - 0.5) * 10, 0.5, z + (Math.random() - 0.5) * 10);
      this._group.add(topMesh);
      this._waterTiles.push(topMesh);
    }
  },

  _addSnowRock(x, z) {
    const size = 4 + Math.random() * 5;
    const geo = new THREE.DodecahedronGeometry(size, 0);
    const mat = new THREE.MeshLambertMaterial({ color: 0xaab0b8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, size * 0.3, z);
    mesh.rotation.set(Math.random(), Math.random(), 0);
    mesh.castShadow = true;
    this._group.add(mesh);

    const snowGeo = new THREE.SphereGeometry(size * 0.7, 6, 4);
    const snowMat = new THREE.MeshLambertMaterial({ color: this.COLORS.snowTop });
    const snowMesh = new THREE.Mesh(snowGeo, snowMat);
    snowMesh.position.set(x, size * 0.5, z);
    snowMesh.scale.y = 0.4;
    this._group.add(snowMesh);
  },

  update(time) {
    // Animar água
    for (const w of this._waterTiles) {
      w.position.y = 0.5 + Math.sin(time * 2 + w.position.x * 0.1) * 0.8;
    }
  },

  // Verificar se uma posição世界 está sólida (parede)
  isSolidWorld(x, y) {
    return World.isSolid(x, y);
  }
};

const World3D = {
  _group: null,
  _waterTiles: [],
  _animTiles: [],
  _treeCount: 0,

  TILE: 48,
  WALL_H: 28,
  BUSH_H: 18,
  RUIN_H: 14,

  COLORS: {
    ground:  [0x1a2a12, 0x0d1a0d, 0x1a1a1a, 0x0a1220, 0x1c1410, 0xc2a050, 0xcc3300, 0xe0e8f0],
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
    trunk:   0x3d2b1f,
    trunkDark:0x2a1a10,
    leaf1:   0x1a5c1a,
    leaf2:   0x2d7a1e,
    leaf3:   0x3a8a2a,
    leafDark:0x0d3a0d,
    roof1:   0x8b4513,
    roof2:   0xa0522d,
    wallHouse: 0xd4c4a8,
    wallHouseDark: 0xb8a88c,
    window:  0x87ceeb,
    door:    0x654321,
    road:    0x333333,
    roadLine:0xcccc44,
    concrete:0x888888,
    metal:   0x666677,
    brick:   0x8b3a3a,
  },

  build(world, group) {
    this._group = group || new THREE.Group();
    this._waterTiles = [];
    this._animTiles = [];
    this._treeCount = 0;

    const T = this.TILE;
    const cols = Math.ceil(world.W / T);
    const rows = Math.ceil(world.H / T);

    // Ground plane with better material
    const groundGeo = new THREE.PlaneGeometry(world.W, world.H, 64, 64);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a2a12 });
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
          this._addGrassDetail(x, z, c, r);
        } else if (t === 2) {
          this._addWall(x, z, T);
        } else if (t === 4) {
          this._addRuin(x, z, T);
        } else if (t === 5) {
          this._addSandDetail(x, z, c, r);
        } else if (t === 6) {
          this._addLava(x, z, T);
        } else if (t === 7) {
          this._addSnowDetail(x, z, c, r);
        } else {
          this._addGroundDetail(x, z, c, r);
        }
      }
    }

    // Add objects from custom map
    const objects = world.getCustomObjects();
    if (objects) {
      for (const obj of objects) {
        const ox = obj.c * T + T / 2;
        const oz = obj.r * T + T / 2;
        this._addObject(obj.type, ox, oz);
      }
    }

    // Scatter some trees randomly on grass/ground tiles
    this._scatterTrees(world, cols, rows, T);

    return this._group;
  },

  _addWater(x, z, size) {
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x1a4a7a,
      transparent: true,
      opacity: 0.75,
      shininess: 80,
      specular: 0x4488cc,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.5, z);
    this._group.add(mesh);
    this._waterTiles.push(mesh);
    this._animTiles.push({ mesh, type: 'water' });

    // Shore foam
    if (Math.random() > 0.5) {
      const foam = new THREE.Mesh(
        new THREE.RingGeometry(size * 0.35, size * 0.48, 16),
        new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
      );
      foam.rotation.x = -Math.PI / 2;
      foam.position.set(x, 0.6, z);
      this._group.add(foam);
    }
  },

  _addGrassDetail(x, z, c, r) {
    // Grass tufts
    if ((c + r) % 3 === 0) {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 4 + Math.random() * 3, 0.8),
          new THREE.MeshLambertMaterial({ color: 0x2d7a1e })
        );
        blade.position.set((Math.random() - 0.5) * 6, 2, (Math.random() - 0.5) * 6);
        blade.rotation.z = (Math.random() - 0.5) * 0.3;
        g.add(blade);
      }
      g.position.set(x, 0, z);
      this._group.add(g);
      this._animTiles.push({ mesh: g, type: 'grass' });
    }
    // Small flowers
    if ((c * 7 + r * 3) % 17 === 0) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 6, 4),
        new THREE.MeshLambertMaterial({ color: [0xff6688, 0xffaa44, 0xffff66, 0xaa88ff][Math.floor(Math.random() * 4)] })
      );
      flower.position.set(x + (Math.random() - 0.5) * 10, 1.5, z + (Math.random() - 0.5) * 10);
      this._group.add(flower);
    }
  },

  _addSandDetail(x, z, c, r) {
    if ((c * 3 + r * 7) % 9 === 0) {
      const size = 2 + Math.random() * 3;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(size, 0),
        new THREE.MeshLambertMaterial({ color: 0xaa9060 })
      );
      rock.position.set(x, size * 0.3, z);
      rock.rotation.set(Math.random(), Math.random(), 0);
      rock.castShadow = true;
      this._group.add(rock);
    }
  },

  _addSnowDetail(x, z, c, r) {
    if ((c + r) % 3 === 0) {
      const size = 3 + Math.random() * 4;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(size, 0),
        new THREE.MeshLambertMaterial({ color: 0xaab0b8 })
      );
      rock.position.set(x, size * 0.3, z);
      rock.rotation.set(Math.random(), Math.random(), 0);
      rock.castShadow = true;
      this._group.add(rock);

      const snow = new THREE.Mesh(
        new THREE.SphereGeometry(size * 0.7, 6, 4),
        new THREE.MeshLambertMaterial({ color: 0xf0f4f8 })
      );
      snow.position.set(x, size * 0.5, z);
      snow.scale.y = 0.4;
      this._group.add(snow);
    }
  },

  _addGroundDetail(x, z, c, r) {
    // Sparse vegetation
    if ((c * 7 + r * 3) % 11 === 0) {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(4, 6, 5),
        new THREE.MeshLambertMaterial({ color: 0x1a5a1a })
      );
      bush.position.set(x, 3, z);
      bush.scale.y = 0.6;
      bush.castShadow = true;
      this._group.add(bush);
    }
    if ((c * 3 + r * 7) % 13 === 0) {
      const size = 2 + Math.random() * 3;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(size, 0),
        new THREE.MeshLambertMaterial({ color: 0x444450 })
      );
      rock.position.set(x, size * 0.4, z);
      rock.rotation.set(Math.random(), Math.random(), 0);
      rock.castShadow = true;
      this._group.add(rock);
    }
  },

  _addWall(x, z, size) {
    const g = new THREE.Group();

    // Main wall
    const wallGeo = new THREE.BoxGeometry(size * 0.9, this.WALL_H, size * 0.9);
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x555566, shininess: 10 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = this.WALL_H / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    g.add(wall);

    // Top cap
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.95, 3, size * 0.95),
      new THREE.MeshPhongMaterial({ color: 0x666677 })
    );
    cap.position.y = this.WALL_H + 1.5;
    cap.castShadow = true;
    g.add(cap);

    // Brick detail
    if (Math.random() > 0.4) {
      const brick = new THREE.Mesh(
        new THREE.BoxGeometry(size * 0.35, 4, size * 0.15),
        new THREE.MeshLambertMaterial({ color: 0x8b3a3a })
      );
      brick.position.set(size * 0.15, this.WALL_H * 0.3, size * 0.46);
      g.add(brick);
    }

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addRuin(x, z, size) {
    const g = new THREE.Group();
    const h = this.RUIN_H + Math.random() * 10;

    // Pillar
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(size * 0.25, size * 0.3, h, 8),
      new THREE.MeshPhongMaterial({ color: 0x3a2a1a, shininess: 5 })
    );
    pillar.position.y = h / 2;
    pillar.castShadow = true;
    g.add(pillar);

    // Broken top
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.35, 2, size * 0.35),
      new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
    );
    top.position.y = h + 1;
    top.rotation.y = Math.random() * 0.3;
    g.add(top);

    // Rubble at base
    if (Math.random() > 0.5) {
      for (let i = 0; i < 3; i++) {
        const rubble = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.5 + Math.random(), 0),
          new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
        );
        rubble.position.set((Math.random() - 0.5) * 12, 1, (Math.random() - 0.5) * 12);
        g.add(rubble);
      }
    }

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addLava(x, z, size) {
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xcc3300,
      emissive: 0xff2200,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.85,
      shininess: 60,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.3, z);
    this._group.add(mesh);
    this._animTiles.push({ mesh, type: 'lava' });

    // Glow spots
    if (Math.random() > 0.5) {
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(size * 0.3, size * 0.3),
        new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.4 })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(x + (Math.random() - 0.5) * 10, 0.5, z + (Math.random() - 0.5) * 10);
      this._group.add(glow);
    }
  },

  // ── Scatter Trees ──
  _scatterTrees(world, cols, rows, T) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = world.getTile(c, r);
        if (t !== 0 && t !== 1) continue;
        if (this._treeCount > 200) return;

        const hash = (c * 7919 + r * 104729) % 1000;
        const treeChance = t === 1 ? 18 : 35;
        if (hash % treeChance === 0) {
          const x = c * T + T / 2 + (Math.random() - 0.5) * 16;
          const z = r * T + T / 2 + (Math.random() - 0.5) * 16;

          const treeType = hash % 3;
          if (treeType === 0) this._addTreePine(x, z);
          else if (treeType === 1) this._addTreeOak(x, z);
          else this._addTreePalm(x, z);

          this._treeCount++;
        }
      }
    }
  },

  _addTreePine(x, z) {
    const g = new THREE.Group();
    const h = 25 + Math.random() * 15;

    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, h, 8),
      new THREE.MeshPhongMaterial({ color: 0x3d2b1f, shininess: 5 })
    );
    trunk.position.y = h / 2;
    trunk.castShadow = true;
    g.add(trunk);

    // Foliage layers (3 cones)
    const colors = [0x0d3a0d, 0x1a5c1a, 0x2d7a1e];
    for (let i = 0; i < 3; i++) {
      const coneH = 12 - i * 2;
      const coneR = 8 - i * 1.5;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(coneR, coneH, 8),
        new THREE.MeshPhongMaterial({ color: colors[i], shininess: 10 })
      );
      cone.position.y = h - 2 + i * 6;
      cone.castShadow = true;
      g.add(cone);
    }

    // Snow cap
    if (Math.random() > 0.7) {
      const snow = new THREE.Mesh(
        new THREE.ConeGeometry(3, 4, 6),
        new THREE.MeshLambertMaterial({ color: 0xf0f4f8 })
      );
      snow.position.y = h + 8;
      g.add(snow);
    }

    g.position.set(x, 0, z);
    g.rotation.y = Math.random() * Math.PI * 2;
    this._group.add(g);
  },

  _addTreeOak(x, z) {
    const g = new THREE.Group();
    const h = 18 + Math.random() * 10;

    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.5, h, 8),
      new THREE.MeshPhongMaterial({ color: 0x4a3520, shininess: 5 })
    );
    trunk.position.y = h / 2;
    trunk.castShadow = true;
    g.add(trunk);

    // Main canopy (cluster of spheres)
    const canopyColor = [0x1a5c1a, 0x2d7a1e, 0x3a8a2a][Math.floor(Math.random() * 3)];
    const mainCanopy = new THREE.Mesh(
      new THREE.SphereGeometry(10, 10, 8),
      new THREE.MeshPhongMaterial({ color: canopyColor, shininess: 8 })
    );
    mainCanopy.position.y = h + 4;
    mainCanopy.scale.set(1, 0.8, 1);
    mainCanopy.castShadow = true;
    g.add(mainCanopy);

    // Side canopies
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
      const side = new THREE.Mesh(
        new THREE.SphereGeometry(5 + Math.random() * 3, 8, 6),
        new THREE.MeshPhongMaterial({ color: canopyColor, shininess: 8 })
      );
      side.position.set(Math.cos(angle) * 7, h + 2 + Math.random() * 4, Math.sin(angle) * 7);
      side.castShadow = true;
      g.add(side);
    }

    g.position.set(x, 0, z);
    g.rotation.y = Math.random() * Math.PI * 2;
    this._group.add(g);
  },

  _addTreePalm(x, z) {
    const g = new THREE.Group();
    const h = 20 + Math.random() * 12;

    // Curved trunk (multiple segments)
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7 - i * 0.05, 0.9 - i * 0.05, h / 6, 6),
        new THREE.MeshPhongMaterial({ color: 0x6b4f2a, shininess: 8 })
      );
      const curve = Math.sin((i / 5) * 1.2) * 3;
      seg.position.set(curve, (i + 0.5) * (h / 6), 0);
      seg.rotation.z = Math.sin((i / 5) * 1.2) * 0.15;
      g.add(seg);
    }

    // Palm leaves (flat cones radiating out)
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(2, 10, 4),
        new THREE.MeshPhongMaterial({ color: 0x2d8a2e, shininess: 10, side: THREE.DoubleSide })
      );
      leaf.position.set(Math.cos(angle) * 5, h, Math.sin(angle) * 5);
      leaf.rotation.x = Math.PI / 3;
      leaf.rotation.y = angle;
      g.add(leaf);
    }

    // Coconuts
    if (Math.random() > 0.5) {
      for (let i = 0; i < 3; i++) {
        const coconut = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 6, 4),
          new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        const a = (i / 3) * Math.PI * 2;
        coconut.position.set(Math.cos(a) * 2, h - 1, Math.sin(a) * 2);
        g.add(coconut);
      }
    }

    g.position.set(x, 0, z);
    g.rotation.y = Math.random() * Math.PI * 2;
    this._group.add(g);
  },

  // ── Object builders ──
  _addObject(type, x, z) {
    switch (type) {
      case 'crate': this._addCrate(x, z); break;
      case 'barrel': this._addBarrel(x, z); break;
      case 'bush': this._addBushObj(x, z); break;
      case 'cactus': this._addCactus(x, z); break;
      case 'log': this._addLog(x, z); break;
      case 'fence': this._addFence(x, z); break;
      case 'torch': this._addTorch(x, z); break;
      case 'campfire': this._addCampfire(x, z); break;
      case 'skull': this._addSkull(x, z); break;
      case 'flag': this._addFlag(x, z); break;
      case 'chest': this._addChest(x, z); break;
      case 'bone': this._addBone(x, z); break;
      case 'house': this._addHouse(x, z); break;
      case 'building': this._addBuilding(x, z); break;
      case 'car': this._addCar(x, z); break;
      case 'truck': this._addTruck(x, z); break;
      case 'lamppost': this._addLampPost(x, z); break;
      case 'road': this._addRoadTile(x, z); break;
      case 'bridge': this._addBridge(x, z); break;
      case 'tower': this._addTower(x, z); break;
      case 'wall_short': this._addShortWall(x, z); break;
      case 'sandbag': this._addSandbag(x, z); break;
      case 'crate_stack': this._addCrateStack(x, z); break;
      case 'water_tower': this._addWaterTower(x, z); break;
      case 'antenna': this._addAntenna(x, z); break;
    }
  },

  _addCrate(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0x8b6914, shininess: 10 })
    );
    body.position.y = 4;
    body.castShadow = true;
    g.add(body);

    // Planks
    for (let i = 0; i < 2; i++) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 0.5, 0.8),
        new THREE.MeshLambertMaterial({ color: 0x6b4f14 })
      );
      plank.position.set(0, 2 + i * 4, 4.2);
      g.add(plank);
    }

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addBarrel(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4, 10, 12),
      new THREE.MeshPhongMaterial({ color: 0x6b4226, shininess: 15 })
    );
    body.position.y = 5;
    body.castShadow = true;
    g.add(body);

    // Metal bands
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(3.8, 0.3, 6, 16),
        new THREE.MeshPhongMaterial({ color: 0x555555, shininess: 30 })
      );
      band.position.y = 2 + i * 3;
      band.rotation.x = Math.PI / 2;
      g.add(band);
    }

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addBushObj(x, z) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.SphereGeometry(6, 8, 6),
      new THREE.MeshPhongMaterial({ color: 0x1a6b1a, shininess: 8 })
    );
    base.position.y = 5;
    base.scale.y = 0.7;
    base.castShadow = true;
    g.add(base);

    const top = new THREE.Mesh(
      new THREE.SphereGeometry(4.5, 8, 6),
      new THREE.MeshPhongMaterial({ color: 0x228822, shininess: 10 })
    );
    top.position.set(Math.random() * 3, 8, Math.random() * 3);
    top.castShadow = true;
    g.add(top);

    g.position.set(x, 0, z);
    this._group.add(g);
    this._animTiles.push({ mesh: g, type: 'grass' });
  },

  _addCactus(x, z) {
    const g = new THREE.Group();

    // Main trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.5, 18, 8),
      new THREE.MeshPhongMaterial({ color: 0x2d8a2e, shininess: 10 })
    );
    trunk.position.y = 9;
    trunk.castShadow = true;
    g.add(trunk);

    // Arms
    if (Math.random() > 0.3) {
      const arm1 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.5, 8, 6),
        new THREE.MeshPhongMaterial({ color: 0x2d8a2e })
      );
      arm1.position.set(4, 12, 0);
      arm1.rotation.z = -0.6;
      g.add(arm1);
    }
    if (Math.random() > 0.5) {
      const arm2 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.5, 6, 6),
        new THREE.MeshPhongMaterial({ color: 0x2d8a2e })
      );
      arm2.position.set(-3.5, 10, 0);
      arm2.rotation.z = 0.5;
      g.add(arm2);
    }

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addLog(x, z) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.5, 14, 8),
      new THREE.MeshPhongMaterial({ color: 0x5c3a1e, shininess: 5 })
    );
    log.position.set(x, 2, z);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = Math.random() * Math.PI;
    log.castShadow = true;
    this._group.add(log);
  },

  _addFence(x, z) {
    const g = new THREE.Group();

    // Posts
    for (let i = -1; i <= 1; i++) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 8, 0.8),
        new THREE.MeshPhongMaterial({ color: 0x8b6914 })
      );
      post.position.set(i * 8, 4, 0);
      post.castShadow = true;
      g.add(post);
    }

    // Rails
    for (let j = 0; j < 2; j++) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.6, 0.6),
        new THREE.MeshPhongMaterial({ color: 0xa08030 })
      );
      rail.position.set(0, 3 + j * 3, 0);
      g.add(rail);
    }

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addTorch(x, z) {
    const g = new THREE.Group();

    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 10, 6),
      new THREE.MeshLambertMaterial({ color: 0x5c3a1e })
    );
    stick.position.y = 5;
    g.add(stick);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 4, 6),
      new THREE.MeshBasicMaterial({ color: 0xff8800 })
    );
    flame.position.y = 12;
    g.add(flame);

    const light = new THREE.PointLight(0xff6600, 0.6, 40);
    light.position.y = 12;
    g.add(light);

    g.position.set(x, 0, z);
    this._group.add(g);
    this._animTiles.push({ mesh: flame, type: 'flame' });
  },

  _addCampfire(x, z) {
    const g = new THREE.Group();

    // Stones ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.2, 0),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
      );
      stone.position.set(Math.cos(angle) * 4, 0.8, Math.sin(angle) * 4);
      g.add(stone);
    }

    // Logs
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 5, 6),
        new THREE.MeshLambertMaterial({ color: 0x5c3a1e })
      );
      log.position.set(Math.cos(angle) * 2, 1, Math.sin(angle) * 2);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = angle;
      g.add(log);
    }

    // Flame
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(2, 5, 6),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 })
    );
    flame.position.y = 4;
    g.add(flame);

    const light = new THREE.PointLight(0xff4400, 0.8, 50);
    light.position.y = 5;
    g.add(light);

    g.position.set(x, 0, z);
    this._group.add(g);
    this._animTiles.push({ mesh: flame, type: 'flame' });
  },

  _addSkull(x, z) {
    const skull = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 6),
      new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 20 })
    );
    skull.scale.set(1, 0.9, 1.1);
    skull.position.set(x, 2, z);
    skull.castShadow = true;
    this._group.add(skull);

    // Eye sockets
    for (let i = -1; i <= 1; i += 2) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 6, 4),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
      );
      eye.position.set(x + i * 0.8, 2.3, z + 1);
      this._group.add(eye);
    }
  },

  _addFlag(x, z) {
    const g = new THREE.Group();

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 18, 6),
      new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 30 })
    );
    pole.position.y = 9;
    g.add(pole);

    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(8, 5, 0.3),
      new THREE.MeshPhongMaterial({ color: 0xff2222, side: THREE.DoubleSide })
    );
    banner.position.set(4, 15, 0);
    g.add(banner);

    g.position.set(x, 0, z);
    this._group.add(g);
    this._animTiles.push({ mesh: banner, type: 'flag' });
  },

  _addChest(x, z) {
    const g = new THREE.Group();

    // Box body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(7, 5, 5),
      new THREE.MeshPhongMaterial({ color: 0xc8a84a, shininess: 25 })
    );
    body.position.y = 2.5;
    body.castShadow = true;
    g.add(body);

    // Lid (slightly open)
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(7, 1, 5),
      new THREE.MeshPhongMaterial({ color: 0xb89830, shininess: 20 })
    );
    lid.position.set(0, 5.5, -1);
    lid.rotation.x = -0.3;
    g.add(lid);

    // Lock
    const lock = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1),
      new THREE.MeshPhongMaterial({ color: 0xffcc00, shininess: 40, emissive: 0xffaa00, emissiveIntensity: 0.2 })
    );
    lock.position.set(0, 3, 3);
    g.add(lock);

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addBone(x, z) {
    const g = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const bone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.5, 5, 6),
        new THREE.MeshLambertMaterial({ color: 0xd4c8a0 })
      );
      bone.position.set(i * 3, 0.8, 0);
      bone.rotation.z = Math.PI / 2;
      bone.rotation.y = i * 0.8;
      g.add(bone);
    }
    g.position.set(x, 0, z);
    this._group.add(g);
  },

  // ── NEW: Building/House ──
  _addHouse(x, z) {
    const g = new THREE.Group();
    const w = 28 + Math.random() * 8;
    const d = 22 + Math.random() * 6;
    const h = 14 + Math.random() * 4;

    // Walls
    const wallMat = new THREE.MeshPhongMaterial({ color: 0xd4c4a8, shininess: 8 });

    // Front wall (with door hole)
    const front = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.5), wallMat);
    front.position.set(0, h / 2, d / 2);
    front.castShadow = true;
    g.add(front);

    // Back wall
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.5), wallMat);
    back.position.set(0, h / 2, -d / 2);
    back.castShadow = true;
    g.add(back);

    // Side walls
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(1.5, h, d), wallMat);
    sideL.position.set(-w / 2, h / 2, 0);
    sideL.castShadow = true;
    g.add(sideL);

    const sideR = new THREE.Mesh(new THREE.BoxGeometry(1.5, h, d), wallMat);
    sideR.position.set(w / 2, h / 2, 0);
    sideR.castShadow = true;
    g.add(sideR);

    // Roof
    const roofMat = new THREE.MeshPhongMaterial({ color: 0x8b4513, shininess: 10 });
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 1, d * 0.7), roofMat);
    roofL.position.set(-w * 0.15, h + 2.5, 0);
    roofL.rotation.z = 0.3;
    roofL.castShadow = true;
    g.add(roofL);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 1, d * 0.7), roofMat);
    roofR.position.set(w * 0.15, h + 2.5, 0);
    roofR.rotation.z = -0.3;
    roofR.castShadow = true;
    g.add(roofR);

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(4, 7, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x654321, shininess: 15 })
    );
    door.position.set(0, 3.5, d / 2 + 0.8);
    g.add(door);

    // Windows
    const winMat = new THREE.MeshPhongMaterial({ color: 0x87ceeb, emissive: 0x446688, emissiveIntensity: 0.3, shininess: 60 });
    for (let i = -1; i <= 1; i += 2) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3, 0.3), winMat);
      win.position.set(i * w * 0.3, h * 0.6, d / 2 + 0.8);
      g.add(win);
    }
    for (let i = -1; i <= 1; i += 2) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 3.5), winMat);
      win.position.set(i * (w / 2 + 0.8), h * 0.6, i * 3);
      g.add(win);
    }

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addBuilding(x, z) {
    const g = new THREE.Group();
    const w = 32 + Math.random() * 10;
    const d = 28 + Math.random() * 8;
    const h = 22 + Math.random() * 8;

    const wallMat = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 12 });

    // 4 walls
    const walls = [
      { s: [w, h, 1.5], p: [0, h/2, d/2] },
      { s: [w, h, 1.5], p: [0, h/2, -d/2] },
      { s: [1.5, h, d], p: [-w/2, h/2, 0] },
      { s: [1.5, h, d], p: [w/2, h/2, 0] },
    ];
    walls.forEach(({ s, p }) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(...s), wallMat);
      wall.position.set(...p);
      wall.castShadow = true;
      wall.receiveShadow = true;
      g.add(wall);
    });

    // Flat roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(w + 2, 2, d + 2),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    roof.position.y = h + 1;
    roof.castShadow = true;
    g.add(roof);

    // Windows grid
    const winMat = new THREE.MeshPhongMaterial({ color: 0x87ceeb, emissive: 0x335577, emissiveIntensity: 0.3 });
    const cols = Math.floor(w / 8);
    const rows = Math.floor(h / 7);
    for (let wr = 0; wr < rows; wr++) {
      for (let wc = 0; wc < cols; wc++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.3), winMat);
        win.position.set(-w/2 + 5 + wc * 8, 5 + wr * 7, d/2 + 0.8);
        g.add(win);
      }
    }

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addTower(x, z) {
    const g = new THREE.Group();
    const h = 35 + Math.random() * 10;

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 7, h, 8),
      new THREE.MeshPhongMaterial({ color: 0x666677, shininess: 10 })
    );
    body.position.y = h / 2;
    body.castShadow = true;
    g.add(body);

    // Platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 2, 8),
      new THREE.MeshPhongMaterial({ color: 0x555566 })
    );
    platform.position.y = h + 1;
    g.add(platform);

    // Railings
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 4, 0.5),
        new THREE.MeshPhongMaterial({ color: 0x777788 })
      );
      rail.position.set(Math.cos(angle) * 7.5, h + 4, Math.sin(angle) * 7.5);
      g.add(rail);
    }

    // Light
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    light.position.y = h + 6;
    g.add(light);

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addCar(x, z) {
    const g = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 6),
      new THREE.MeshPhongMaterial({ color: [0xcc2222, 0x2244cc, 0x222222, 0xdddddd][Math.floor(Math.random() * 4)], shininess: 30 })
    );
    body.position.y = 4;
    body.castShadow = true;
    g.add(body);

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3.5, 5.5),
      new THREE.MeshPhongMaterial({ color: 0x334455, shininess: 40 })
    );
    cabin.position.set(0, 7.5, 0);
    g.add(cabin);

    // Wheels
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 5 });
    const wheelPositions = [[-4, 1.5, 3.5], [-4, 1.5, -3.5], [4, 1.5, 3.5], [4, 1.5, -3.5]];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1, 12), wheelMat);
      wheel.position.set(wx, wy, wz);
      wheel.rotation.x = Math.PI / 2;
      g.add(wheel);
    });

    // Headlights
    for (let i = -1; i <= 1; i += 2) {
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 6, 4),
        new THREE.MeshBasicMaterial({ color: 0xffffcc })
      );
      light.position.set(5, 4, i * 2.5);
      g.add(light);
    }

    g.position.set(x, 0, z);
    g.rotation.y = Math.random() * Math.PI * 2;
    this._group.add(g);
  },

  _addTruck(x, z) {
    const g = new THREE.Group();

    // Cargo
    const cargo = new THREE.Mesh(
      new THREE.BoxGeometry(14, 8, 8),
      new THREE.MeshPhongMaterial({ color: [0x556b2f, 0x8b4513, 0x444444][Math.floor(Math.random() * 3)], shininess: 8 })
    );
    cargo.position.set(-2, 5, 0);
    cargo.castShadow = true;
    g.add(cargo);

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 7),
      new THREE.MeshPhongMaterial({ color: 0x2244cc, shininess: 20 })
    );
    cabin.position.set(7, 5, 0);
    g.add(cabin);

    // Wheels (6)
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    [[-5, 1.5, 4.5], [-5, 1.5, -4.5], [0, 1.5, 4.5], [0, 1.5, -4.5], [6, 1.5, 4.5], [6, 1.5, -4.5]].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.2, 12), wheelMat);
      wheel.position.set(wx, wy, wz);
      wheel.rotation.x = Math.PI / 2;
      g.add(wheel);
    });

    g.position.set(x, 0, z);
    g.rotation.y = Math.random() * Math.PI * 2;
    this._group.add(g);
  },

  _addLampPost(x, z) {
    const g = new THREE.Group();

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.5, 16, 6),
      new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 20 })
    );
    pole.position.y = 8;
    g.add(pole);

    // Arm
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.5, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x444444 })
    );
    arm.position.set(2.5, 16, 0);
    g.add(arm);

    // Light fixture
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 2),
      new THREE.MeshBasicMaterial({ color: 0xffffcc })
    );
    fixture.position.set(5, 15.5, 0);
    g.add(fixture);

    const light = new THREE.PointLight(0xffeecc, 0.5, 60);
    light.position.set(5, 15, 0);
    g.add(light);

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addRoadTile(x, z) {
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 48),
      new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 5 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.1, z);
    this._group.add(road);

    // Center line
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 48),
      new THREE.MeshBasicMaterial({ color: 0xcccc44 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.2, z);
    this._group.add(line);
  },

  _addBridge(x, z) {
    const g = new THREE.Group();

    // Planks
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(48, 1.5, 16),
      new THREE.MeshPhongMaterial({ color: 0x8b6914, shininess: 5 })
    );
    deck.position.y = 3;
    deck.castShadow = true;
    g.add(deck);

    // Rails
    for (let i = -1; i <= 1; i += 2) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(48, 1, 0.8),
        new THREE.MeshPhongMaterial({ color: 0x6b4f14 })
      );
      rail.position.set(0, 6, i * 8);
      g.add(rail);

      for (let j = -2; j <= 2; j++) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 5, 0.8),
          new THREE.MeshPhongMaterial({ color: 0x8b6914 })
        );
        post.position.set(j * 12, 4, i * 8);
        g.add(post);
      }
    }

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addShortWall(x, z) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(48, 10, 4),
      new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 8 })
    );
    wall.position.set(x, 5, z);
    wall.castShadow = true;
    this._group.add(wall);
  },

  _addSandbag(x, z) {
    const g = new THREE.Group();
    for (let row = 0; row < 3; row++) {
      const count = 3 - row;
      for (let i = 0; i < count; i++) {
        const bag = new THREE.Mesh(
          new THREE.BoxGeometry(4, 2.5, 3),
          new THREE.MeshPhongMaterial({ color: 0x8b7d5a, shininess: 3 })
        );
        bag.position.set(-count * 2 + i * 4 + (row % 2) * 2, row * 2.5 + 1.25, 0);
        bag.rotation.y = (Math.random() - 0.5) * 0.2;
        g.add(bag);
      }
    }
    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addCrateStack(x, z) {
    const g = new THREE.Group();
    const crateMat = new THREE.MeshPhongMaterial({ color: 0x8b6914, shininess: 10 });
    const positions = [[0, 0, 0], [8, 0, 0], [0, 0, 8], [8, 0, 8], [4, 8, 4]];
    positions.forEach(([cx, cy, cz]) => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 7), crateMat);
      crate.position.set(cx, cy + 3.5, cz);
      crate.castShadow = true;
      g.add(crate);
    });
    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addWaterTower(x, z) {
    const g = new THREE.Group();

    // Legs
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 20, 6),
        new THREE.MeshPhongMaterial({ color: 0x555555 })
      );
      leg.position.set(Math.cos(angle) * 5, 10, Math.sin(angle) * 5);
      g.add(leg);
    }

    // Tank
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 7, 8, 12),
      new THREE.MeshPhongMaterial({ color: 0x445566, shininess: 15 })
    );
    tank.position.y = 24;
    tank.castShadow = true;
    g.add(tank);

    // Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(8, 4, 12),
      new THREE.MeshPhongMaterial({ color: 0x666666 })
    );
    roof.position.y = 30;
    g.add(roof);

    g.position.set(x, 0, z);
    this._group.add(g);
  },

  _addAntenna(x, z) {
    const g = new THREE.Group();

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 30, 4),
      new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 20 })
    );
    pole.position.y = 15;
    g.add(pole);

    // Dish
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 6, 0, Math.PI),
      new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 30, side: THREE.DoubleSide })
    );
    dish.position.set(0, 28, 0);
    dish.rotation.x = -Math.PI / 4;
    g.add(dish);

    // Blinking light
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    light.position.y = 30;
    g.add(light);

    g.position.set(x, 0, z);
    this._group.add(g);
    this._animTiles.push({ mesh: light, type: 'blink' });
  },

  // ── Animation ──
  update(time) {
    for (const item of this._animTiles) {
      if (item.type === 'water') {
        item.mesh.position.y = 0.5 + Math.sin(time * 2 + item.mesh.position.x * 0.1) * 0.8;
      } else if (item.type === 'lava') {
        item.mesh.material.emissiveIntensity = 0.4 + Math.sin(time * 3 + item.mesh.position.x * 0.2) * 0.2;
      } else if (item.type === 'grass') {
        item.mesh.rotation.z = Math.sin(time * 1.5 + item.mesh.position.x * 0.1) * 0.05;
      } else if (item.type === 'flame') {
        item.mesh.scale.x = 1 + Math.sin(time * 8) * 0.15;
        item.mesh.scale.z = 1 + Math.cos(time * 8) * 0.15;
        item.mesh.position.y = 4 + Math.sin(time * 6) * 0.5;
      } else if (item.type === 'flag') {
        item.mesh.rotation.y = Math.sin(time * 2) * 0.15;
      } else if (item.type === 'blink') {
        item.mesh.visible = Math.floor(time * 2) % 2 === 0;
      }
    }
  },

  isSolidWorld(x, y) {
    return World.isSolid(x, y);
  },
};

/**
 * AnimationSystem.js — Animações programáticas com deformação de vértices
 * 
 * Divide os vértices do modelo em zonas (braços, pernas, cabeça, torso)
 * e aplica rotações/offsets diretamente nas posições dos vértices.
 * Funciona com qualquer modelo, mesmo sendo uma mesh só.
 */

const AnimationSystem = {

  _activeAnimation: null,
  _animationFrame: null,
  _startTime: 0,
  _paused: false,
  _modelRef: null,
  _zones: null,
  _origPositions: null,

  stop() {
    this._activeAnimation = null;
    this._paused = false;
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
    this._restoreGeometry();
    this._restoreScene();
  },

  pause() {
    this._paused = !this._paused;
    return this._paused;
  },

  // ── Zonas de corpo ──

  _buildZones(model) {
    const scene = model.scene || model;
    const meshes = [];
    scene.traverse(c => { if (c.isMesh || c.isSkinnedMesh) meshes.push(c); });
    if (!meshes.length) return;

    this._origPositions = new Map();
    this._zones = new Map();

    meshes.forEach(mesh => {
      const geo = mesh.geometry;
      if (!geo || !geo.attributes.position) return;

      const posAttr = geo.attributes.position;
      const count = posAttr.count;
      const orig = new Float32Array(posAttr.array.length);
      orig.set(posAttr.array);
      this._origPositions.set(mesh, orig);

      // Bounding box local
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      const minY = bb.min.y, maxY = bb.max.y;
      const minX = bb.min.x, maxX = bb.max.x;
      const rangeY = maxY - minY || 1;
      const rangeX = maxX - minX || 1;
      const midY = (minY + maxY) / 2;
      const midX = (minX + maxX) / 2;

      const zones = {
        head: [],     // top 25%
        torso: [],    // middle band
        armL: [],     // left side, upper 60%
        armR: [],     // right side, upper 60%
        legL: [],     // left side, lower 40%
        legR: [],     // right side, lower 40%
        all: [],      // all vertices
      };

      for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);

        const normY = (y - minY) / rangeY; // 0..1
        const normX = (x - minX) / rangeX; // 0..1

        zones.all.push({ i, x, y, z });

        // Cabeça: top 25%
        if (normY > 0.75) {
          zones.head.push({ i, x, y, z, pivotY: maxY * 0.75 });
        }
        // Pernas: bottom 40%
        else if (normY < 0.4) {
          const pivotY = minY + rangeY * 0.4;
          if (normX < 0.45) {
            zones.legL.push({ i, x, y, z, pivotY });
          } else if (normX > 0.55) {
            zones.legR.push({ i, x, y, z, pivotY });
          } else {
            zones.torso.push({ i, x, y, z });
          }
        }
        // Braços: middle-upper, sides
        else if (normY >= 0.4 && normY <= 0.75) {
          const pivotY = minY + rangeY * 0.65;
          if (normX < 0.35) {
            zones.armL.push({ i, x, y, z, pivotY });
          } else if (normX > 0.65) {
            zones.armR.push({ i, x, y, z, pivotY });
          } else {
            zones.torso.push({ i, x, y, z });
          }
        }
        // Torso: middle
        else {
          zones.torso.push({ i, x, y, z });
        }
      }

      this._zones.set(mesh, zones);
    });
  },

  // ── Deformação de vértices ──

  _applyZoneRotation(mesh, zone, angleX, angleY, angleZ) {
    const posAttr = mesh.geometry.attributes.position;
    const verts = this._zones.get(mesh)[zone];
    if (!verts || !verts.length) return;

    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    const cosZ = Math.cos(angleZ), sinZ = Math.sin(angleZ);

    verts.forEach(v => {
      // Translate to pivot
      let dx = v.x;
      let dy = v.y - v.pivotY;
      let dz = v.z;

      // Rotate X
      let ry = dy * cosX - dz * sinX;
      let rz = dy * sinX + dz * cosX;
      dy = ry; dz = rz;

      // Rotate Y
      let rx = dx * cosY + dz * sinY;
      rz = -dx * sinY + dz * cosY;
      dx = rx; dz = rz;

      // Rotate Z
      rx = dx * cosZ - dy * sinZ;
      ry = dx * sinZ + dy * cosZ;
      dx = rx; dy = ry;

      // Back to origin
      posAttr.setXYZ(v.i, dx, dy + v.pivotY, dz);
    });

    posAttr.needsUpdate = true;
  },

  _applyZoneOffset(mesh, zone, offX, offY, offZ) {
    const posAttr = mesh.geometry.attributes.position;
    const verts = this._zones.get(mesh)[zone];
    if (!verts) return;

    verts.forEach(v => {
      const ox = this._origPositions.get(mesh);
      const idx = v.i * 3;
      posAttr.setXYZ(v.i, ox[idx] + offX, ox[idx + 1] + offY, ox[idx + 2] + offZ);
    });

    posAttr.needsUpdate = true;
  },

  _restoreGeometry() {
    if (!this._origPositions) return;
    this._origPositions.forEach((orig, mesh) => {
      const posAttr = mesh.geometry.attributes.position;
      posAttr.array.set(orig);
      posAttr.needsUpdate = true;
      mesh.geometry.computeBoundingBox();
    });
    this._origPositions = null;
    this._zones = null;
  },

  _restoreScene() {
    if (!this._modelRef) return;
    const scene = this._modelRef.scene || this._modelRef;
    if (this._savedScene) {
      scene.position.copy(this._savedScene.position);
      scene.rotation.copy(this._savedScene.rotation);
      scene.scale.copy(this._savedScene.scale);
    }
  },

  // ── Helpers ──

  _getAllMeshes(model) {
    const scene = model.scene || model;
    const meshes = [];
    scene.traverse(c => { if (c.isMesh || c.isSkinnedMesh) meshes.push(c); });
    return meshes;
  },

  _forEachMesh(fn) {
    if (!this._zones) return;
    this._zones.forEach((zones, mesh) => fn(mesh, zones));
  },

  // ── Animações ──

  playIdle(model, opts = {}) {
    this.stop();
    this._modelRef = model;
    const scene = model.scene || model;
    this._savedScene = { position: scene.position.clone(), rotation: scene.rotation.clone(), scale: scene.scale.clone() };
    this._buildZones(model);
    const speed = opts.speed || 1;
    const dur = 2000;

    this._activeAnimation = (elapsed) => {
      const t = (elapsed * speed) / dur;
      const s = Math.sin(t * Math.PI * 2);

      // Respiração: braços sobem/desem suavemente
      this._forEachMesh((mesh) => {
        this._applyZoneRotation(mesh, 'armL', s * 0.08, 0, s * 0.05);
        this._applyZoneRotation(mesh, 'armR', s * 0.08, 0, -s * 0.05);
        // Cabeça balança ligeiramente
        this._applyZoneRotation(mesh, 'head', 0, s * 0.04, s * 0.03);
      });

      // Body bob
      const savedY = this._savedScene.position.y;
      scene.position.y = Math.max(0, savedY + s * 0.02);
    };

    this._startLoop();
    return this;
  },

  playWalk(model, opts = {}) {
    this.stop();
    this._modelRef = model;
    const scene = model.scene || model;
    this._savedScene = { position: scene.position.clone(), rotation: scene.rotation.clone(), scale: scene.scale.clone() };
    this._buildZones(model);
    const speed = opts.speed || 1;
    const dur = 800;

    this._activeAnimation = (elapsed) => {
      const t = (elapsed * speed) / dur;
      const s = Math.sin(t * Math.PI * 2);

      this._forEachMesh((mesh) => {
        // Braços alternam
        this._applyZoneRotation(mesh, 'armL', s * 0.6, 0, 0);
        this._applyZoneRotation(mesh, 'armR', -s * 0.6, 0, 0);
        // Pernas alternam (oposto aos braços)
        this._applyZoneRotation(mesh, 'legL', -s * 0.5, 0, 0);
        this._applyZoneRotation(mesh, 'legR', s * 0.5, 0, 0);
        // Cabeça mantém-se estável
        this._applyZoneRotation(mesh, 'head', 0, 0, s * 0.02);
      });

      const savedY = this._savedScene.position.y;
      scene.position.y = Math.max(0, savedY + Math.abs(s) * 0.015);
      scene.rotation.z = s * 0.02;
    };

    this._startLoop();
    return this;
  },

  playAttack(model, opts = {}) {
    this.stop();
    this._modelRef = model;
    const scene = model.scene || model;
    this._savedScene = { position: scene.position.clone(), rotation: scene.rotation.clone(), scale: scene.scale.clone() };
    this._buildZones(model);
    const speed = opts.speed || 1;
    const dur = 500;

    this._activeAnimation = (elapsed) => {
      const p = Math.min(1, (elapsed * speed) / dur);

      this._forEachMesh((mesh) => {
        if (p < 0.3) {
          // Preparar: braço direito para trás
          const t = p / 0.3;
          this._applyZoneRotation(mesh, 'armR', -t * 1.5, 0, t * 0.3);
          this._applyZoneRotation(mesh, 'armL', t * 0.3, 0, -t * 0.2);
          this._applyZoneRotation(mesh, 'torso', 0, -t * 0.2, 0);
        } else if (p < 0.6) {
          // Golpe: braço direito para a frente
          const t = (p - 0.3) / 0.3;
          this._applyZoneRotation(mesh, 'armR', -1.5 + t * 2.5, 0, 0.3 - t * 0.5);
          this._applyZoneRotation(mesh, 'armL', 0.3 * (1 - t), 0, -0.2 * (1 - t));
          this._applyZoneRotation(mesh, 'torso', 0, -0.2 + t * 0.4, 0);
        } else {
          // Recuperar
          const t = (p - 0.6) / 0.4;
          this._applyZoneRotation(mesh, 'armR', 1.0 * (1 - t), 0, -0.2 * (1 - t));
          this._applyZoneRotation(mesh, 'torso', 0, 0.2 * (1 - t), 0);
        }
      });

      const savedZ = this._savedScene.position.z || 0;
      if (p < 0.3) scene.position.z = savedZ - (p / 0.3) * 0.1;
      else if (p < 0.6) scene.position.z = savedZ - 0.1 + ((p - 0.3) / 0.3) * 0.4;
      else scene.position.z = savedZ + 0.3 * (1 - (p - 0.6) / 0.4);

      if (p >= 1) this.stop();
    };

    this._startLoop();
    return this;
  },

  playSpecial(model, opts = {}) {
    this.stop();
    this._modelRef = model;
    const scene = model.scene || model;
    this._savedScene = { position: scene.position.clone(), rotation: scene.rotation.clone(), scale: scene.scale.clone() };
    this._buildZones(model);
    const speed = opts.speed || 1;
    const dur = 1500;

    this._activeAnimation = (elapsed) => {
      const t = (elapsed * speed) / dur;

      this._forEachMesh((mesh) => {
        // Braços levantados
        const armAngle = Math.sin(t * Math.PI * 3) * 1.2;
        this._applyZoneRotation(mesh, 'armL', -Math.abs(armAngle), 0, -armAngle * 0.5);
        this._applyZoneRotation(mesh, 'armR', -Math.abs(armAngle), 0, armAngle * 0.5);
        // Pernas afastadas
        this._applyZoneRotation(mesh, 'legL', 0, -0.15, -0.1);
        this._applyZoneRotation(mesh, 'legR', 0, 0.15, 0.1);
      });

      scene.rotation.y = t * Math.PI * 4;
      const pulse = 1 + Math.sin(t * Math.PI * 6) * 0.1;
      scene.scale.setScalar(pulse);

      if (t >= 1) this.stop();
    };

    this._startLoop();
    return this;
  },

  playDeath(model, opts = {}) {
    this.stop();
    this._modelRef = model;
    const scene = model.scene || model;
    this._savedScene = { position: scene.position.clone(), rotation: scene.rotation.clone(), scale: scene.scale.clone() };
    this._buildZones(model);
    const speed = opts.speed || 1;
    const dur = 1200;
    const meshes = this._getAllMeshes(model);

    this._activeAnimation = (elapsed) => {
      const t = Math.min(1, (elapsed * speed) / dur);

      this._forEachMesh((mesh) => {
        // Braços caem
        this._applyZoneRotation(mesh, 'armL', t * 0.8, 0, t * 0.3);
        this._applyZoneRotation(mesh, 'armR', t * 0.8, 0, -t * 0.3);
        // Cabeça cai
        this._applyZoneRotation(mesh, 'head', t * 0.5, 0, 0);
      });

      scene.rotation.x = -t * 1.2;
      scene.position.y = Math.max(0, (this._savedScene.position.y) - t * 0.3);

      meshes.forEach(m => {
        if (m.material) {
          m.material.transparent = true;
          m.material.opacity = 1 - t * 0.5;
        }
      });

      if (t >= 1) this.stop();
    };

    this._startLoop();
    return this;
  },

  playVictory(model, opts = {}) {
    this.stop();
    this._modelRef = model;
    const scene = model.scene || model;
    this._savedScene = { position: scene.position.clone(), rotation: scene.rotation.clone(), scale: scene.scale.clone() };
    this._buildZones(model);
    const speed = opts.speed || 1;
    const dur = 1500;

    this._activeAnimation = (elapsed) => {
      const t = (elapsed * speed) / dur;

      this._forEachMesh((mesh) => {
        // Braços para cima
        const armUp = Math.sin(t * Math.PI) * 1.8;
        this._applyZoneRotation(mesh, 'armL', -armUp, 0, -armUp * 0.4);
        this._applyZoneRotation(mesh, 'armR', -armUp, 0, armUp * 0.4);
        // Pernas levemente afastadas
        this._applyZoneRotation(mesh, 'legL', 0, 0, -0.15);
        this._applyZoneRotation(mesh, 'legR', 0, 0, 0.15);
      });

      const savedY = this._savedScene.position.y;
      scene.position.y = Math.max(0, savedY + Math.sin(t * Math.PI) * 0.4);
      scene.rotation.y = t * Math.PI * 2;

      if (t >= 1) this.stop();
    };

    this._startLoop();
    return this;
  },

  _startLoop() {
    this._startTime = performance.now();
    this._paused = false;
    const loop = (now) => {
      if (!this._activeAnimation) return;
      if (!this._paused) {
        this._activeAnimation(now - this._startTime);
      }
      this._animationFrame = requestAnimationFrame(loop);
    };
    this._animationFrame = requestAnimationFrame(loop);
  },

  play(model, type, opts = {}) {
    switch (type) {
      case 'idle': return this.playIdle(model, opts);
      case 'walk': return this.playWalk(model, opts);
      case 'attack': return this.playAttack(model, opts);
      case 'special': return this.playSpecial(model, opts);
      case 'death': return this.playDeath(model, opts);
      case 'victory': return this.playVictory(model, opts);
      default: return this;
    }
  },
};

if (typeof window !== 'undefined') window.AnimationSystem = AnimationSystem;
if (typeof module !== 'undefined' && module.exports) module.exports = AnimationSystem;

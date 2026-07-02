const ModelLoader = {
  _cache: new Map(),
  _loading: new Map(),
  _loader: null,

  init() {
    if (!this._loader) {
      this._loader = new THREE.GLTFLoader();
    }
  },

  load(path, callback) {
    this.init();

    if (this._cache.has(path)) {
      const cached = this._cache.get(path);
      callback(cached.clone());
      return;
    }

    if (this._loading.has(path)) {
      this._loading.get(path).push(callback);
      return;
    }

    this._loading.set(path, [callback]);

    this._loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        const animations = gltf.animations || [];

        // Process model
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Calculate bounding box and center
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Store metadata
        model.userData = {
          animations: animations,
          boundingBox: box,
          center: center,
          size: size,
          path: path
        };

        this._cache.set(path, model);

        const callbacks = this._loading.get(path);
        this._loading.delete(path);

        for (const cb of callbacks) {
          cb(model.clone());
        }
      },
      undefined,
      (error) => {
        console.error('Error loading model:', path, error);
        const callbacks = this._loading.get(path);
        this._loading.delete(path);

        // Try to load sample.glb as fallback
        if (path !== 'models/sample.glb') {
          this.load('models/sample.glb', (fallbackModel) => {
            this._cache.set(path, fallbackModel.clone());
            for (const cb of callbacks) {
              cb(fallbackModel.clone());
            }
          });
        } else {
          // Create fallback primitive model only if sample.glb also fails
          const fallback = this._createFallbackModel(path);
          this._cache.set(path, fallback);
          for (const cb of callbacks) {
            cb(fallback.clone());
          }
        }
      }
    );
  },

  _createFallbackModel(path) {
    const group = new THREE.Group();

    // Determine type from path
    let color = 0x378add;
    if (path.includes('enemy')) color = 0xff4444;
    else if (path.includes('boss')) color = 0x884488;
    else if (path.includes('roro')) color = 0xe24b4a;
    else if (path.includes('mar')) color = 0x888888;
    else if (path.includes('marc')) color = 0x378add;
    else if (path.includes('vido')) color = 0xfac775;
    else if (path.includes('mira')) color = 0xaf56f5;
    else if (path.includes('zenowing')) color = 0xc0c0c0;

    // Simple chibi shape
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.6, 12);
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.25, 12, 10);
    const headMat = new THREE.MeshLambertMaterial({ color });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.1;
    head.castShadow = true;
    group.add(head);

    // Store references for animation
    group.userData.body = body;
    group.userData.head = head;

    return group;
  },

  getModel(path) {
    return this._cache.get(path) || null;
  },

  clearCache() {
    this._cache.clear();
    this._loading.clear();
  },

  tintModel(model, hexColor) {
    if (!model) return;
    const c = new THREE.Color(hexColor);
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          const orig = m.color ? m.color.clone() : new THREE.Color(0xffffff);
          const blended = orig.clone().multiplyScalar(0.25).add(c.clone().multiplyScalar(0.75));
          m.color.copy(blended);
          if (m.emissive) {
            m.emissive.copy(c).multiplyScalar(0.1);
          }
        });
      }
    });
  },

  preload(paths, callback) {
    let loaded = 0;
    const total = paths.length;

    if (total === 0) {
      callback();
      return;
    }

    for (const path of paths) {
      this.load(path, () => {
        loaded++;
        if (loaded >= total) {
          callback();
        }
      });
    }
  }
};
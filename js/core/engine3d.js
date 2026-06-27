const Engine3D = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  _initialized: false,

  init(container) {
    if (this._initialized) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04080a);
    this.scene.fog = new THREE.Fog(0x04080a, 200, 600);

    // Câmara de terceira pessoa baixa
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, 60, 80);
    this.camera.lookAt(0, 0, 0);

    // Renderer WebGL
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(this.renderer.domElement);

    // Luzes
    this.ambientLight = new THREE.AmbientLight(0x334455, 0.6);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.0);
    this.dirLight.position.set(100, 150, 80);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 500;
    this.dirLight.shadow.camera.left = -200;
    this.dirLight.shadow.camera.right = 200;
    this.dirLight.shadow.camera.top = 200;
    this.dirLight.shadow.camera.bottom = -200;
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0x4466aa, 0x223322, 0.4);
    this.scene.add(this.hemiLight);

    this.playerLight = new THREE.PointLight(0xffffff, 0.5, 120);
    this.playerLight.position.set(0, 40, 0);
    this.scene.add(this.playerLight);

    this.clock = new THREE.Clock();

    // Resize handler
    window.addEventListener('resize', () => this._onResize());
    this._initialized = true;
  },

  _onResize() {
    if (!this.camera || !this.renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  },

  render() {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  },

  clear() {
    if (!this.scene) return;

    // Remover todas as entidades (grupos, meshes) mas manter luzes
    const toRemove = [];
    this.scene.traverse(child => {
      if (child !== this.scene && child !== this.ambientLight && child !== this.dirLight && child !== this.hemiLight && child !== this.playerLight) {
        toRemove.push(child);
      }
    });
    for (const obj of toRemove) {
      if (obj.parent) obj.parent.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
  },

  setCameraTarget(x, y, z) {
    if (!this.camera) return;
    const targetX = x;
    const targetY = y + 60;
    const targetZ = z + 80;
    // Suavização da câmara
    this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;
    this.camera.lookAt(x, y + 5, z);

    // Mover luz de acompanhamento
    if (this.playerLight) {
      this.playerLight.position.set(x, 40, z);
    }
  }
};

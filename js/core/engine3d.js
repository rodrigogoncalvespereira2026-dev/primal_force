const Engine3D = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  _initialized: false,

  // Câmara orbital
  camAngle: 0,          // ângulo horizontal (radians)
  camPitch: 0.65,       // inclinação vertical (0 = chão, PI/2 = topo)
  camDist: 100,         // distância ao jogador
  _camAngleTarget: 0,
  _camPitchTarget: 0.65,

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

    // ── Controlos de câmara ──
    // Desktop: right-click drag = orbit, scroll = zoom
    this._isDragging = false;
    this._lastMX = 0;
    this._lastMY = 0;
    this.renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
    this.renderer.domElement.addEventListener('mousedown', e => {
      if (e.button === 2) { this._isDragging = true; this._lastMX = e.clientX; this._lastMY = e.clientY; }
    });
    window.addEventListener('mouseup', e => { if (e.button === 2) this._isDragging = false; });
    window.addEventListener('mousemove', e => {
      if (!this._isDragging) return;
      const dx = e.clientX - this._lastMX;
      const dy = e.clientY - this._lastMY;
      this._lastMX = e.clientX;
      this._lastMY = e.clientY;
      this.orbitAngle(-dx * 0.005);
      this.orbitPitch(-dy * 0.003);
    });
    this.renderer.domElement.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom(e.deltaY * 0.1);
    }, { passive: false });

    // Mobile: two-finger = orbit, pinch = zoom
    this._touches = [];
    this._lastPinchDist = 0;
    this.renderer.domElement.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        e.preventDefault();
        this._touches = [
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY }
        ];
        this._lastPinchDist = Math.hypot(
          this._touches[1].x - this._touches[0].x,
          this._touches[1].y - this._touches[0].y
        );
      }
    }, { passive: false });
    this.renderer.domElement.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0], t1 = e.touches[1];
        const mx = (t0.clientX + t1.clientX) / 2;
        const my = (t0.clientY + t1.clientY) / 2;

        if (this._touches.length === 2) {
          const omx = (this._touches[0].x + this._touches[1].x) / 2;
          const omy = (this._touches[0].y + this._touches[1].y) / 2;
          this.orbitAngle(-(mx - omx) * 0.004);
          this.orbitPitch(-(my - omy) * 0.003);

          // Pinch zoom
          const pinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
          if (this._lastPinchDist > 0) {
            this.zoom((this._lastPinchDist - pinchDist) * 0.3);
          }
          this._lastPinchDist = pinchDist;
        }
        this._touches = [
          { x: t0.clientX, y: t0.clientY },
          { x: t1.clientX, y: t1.clientY }
        ];
      }
    }, { passive: false });
    this.renderer.domElement.addEventListener('touchend', e => {
      if (e.touches.length < 2) { this._touches = []; this._lastPinchDist = 0; }
    });

    // Botão de câmara (mobile) — arrastar para orbitar
    const camBtn = document.getElementById('btn-mb-camera');
    if (camBtn) {
      let camDragging = false, camLastX = 0, camLastY = 0;
      camBtn.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        camDragging = true;
        camLastX = e.clientX;
        camLastY = e.clientY;
        camBtn.setPointerCapture(e.pointerId);
      });
      camBtn.addEventListener('pointermove', e => {
        if (!camDragging) return;
        e.preventDefault();
        const dx = e.clientX - camLastX;
        const dy = e.clientY - camLastY;
        camLastX = e.clientX;
        camLastY = e.clientY;
        this.orbitAngle(-dx * 0.008);
        this.orbitPitch(-dy * 0.006);
      });
      camBtn.addEventListener('pointerup', e => { camDragging = false; });
      camBtn.addEventListener('pointercancel', e => { camDragging = false; });
    }

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

    // Suavização do ângulo e pitch
    this.camAngle  += (this._camAngleTarget - this.camAngle)  * 0.06;
    this.camPitch  += (this._camPitchTarget - this.camPitch)  * 0.06;
    this.camDist   += (this._camDistTarget  - this.camDist)   * 0.06;

    // Limitar pitch entre 0.15 e 1.2 (não ir abaixo do chão nem topo)
    this.camPitch = Math.max(0.15, Math.min(1.2, this.camPitch));

    // Posição da câmara em coordenadas esféricas
    const height = Math.sin(this.camPitch) * this.camDist;
    const radius = Math.cos(this.camPitch) * this.camDist;
    const camX = x + Math.sin(this.camAngle) * radius;
    const camZ = z + Math.cos(this.camAngle) * radius;
    const camY = y + height;

    // Suavização da posição
    this.camera.position.x += (camX - this.camera.position.x) * 0.08;
    this.camera.position.y += (camY - this.camera.position.y) * 0.08;
    this.camera.position.z += (camZ - this.camera.position.z) * 0.08;
    this.camera.lookAt(x, y + 5, z);

    // Mover luz de acompanhamento
    if (this.playerLight) {
      this.playerLight.position.set(x, 40, z);
    }
  },

  // Rodar a câmara horizontalmente (radians)
  orbitAngle(delta) {
    this._camAngleTarget += delta;
  },

  // Ajustar pitch (subir/baixar câmara)
  orbitPitch(delta) {
    this._camPitchTarget += delta;
  },

  // Zoom in/out
  zoom(delta) {
    this._camDistTarget = Math.max(40, Math.min(200, this._camDistTarget + delta));
  },

  _camDistTarget: 100,
};

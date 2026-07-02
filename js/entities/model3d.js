const Model3D = {

  createFromGLB(path, opts = {}) {
    return new Promise((resolve) => {
      ModelLoader.load(path, (model) => {
        const group = new THREE.Group();

        // Scale model
        const size = opts.size || 1;
        model.scale.setScalar(size);

        // Apply toon shading + outline
        if (typeof ToonShader !== 'undefined') {
          ToonShader.applyToModel(model, {
            steps: opts.toonSteps || 3,
            outlineThickness: opts.outlineThickness || 0.03,
            outlineColor: opts.outlineColor || 0x0a0a0a,
            skipOutline: opts.skipOutline || false,
          });
        }

        // Center model vertically
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const min = box.min.y;
        model.position.y = -min;

        group.add(model);

        // Store metadata
        group.userData.model = model;
        group.userData.animations = model.userData?.animations || [];
        group.userData.hasAnimations = group.userData.animations.length > 0;

        // Create shadow
        const shadowGeo = new THREE.CircleGeometry(0.5, 16);
        const shadowMat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.3,
          depthWrite: false
        });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.02;
        group.add(shadow);

        // If no animations, create placeholder body parts for manual animation
        if (!group.userData.hasAnimations) {
          this._createFallbackParts(group, model);
        }

        resolve(group);
      });
    });
  },

  _createFallbackParts(group, model) {
    // Try to find common body parts by name or position
    const parts = {
      body: null,
      head: null,
      armL: null,
      armR: null,
      legL: null,
      legR: null
    };

    model.traverse((child) => {
      const name = child.name.toLowerCase();
      if (name.includes('body') || name.includes('torso')) parts.body = child;
      else if (name.includes('head')) parts.head = child;
      else if (name.includes('arm') && name.includes('l')) parts.armL = child;
      else if (name.includes('arm') && name.includes('r')) parts.armR = child;
      else if (name.includes('leg') && name.includes('l')) parts.legL = child;
      else if (name.includes('leg') && name.includes('r')) parts.legR = child;
    });

    // If no named parts found, use positional heuristics
    if (!parts.body && !parts.head) {
      let highest = null;
      let lowest = null;
      let leftmost = null;
      let rightmost = null;

      model.traverse((child) => {
        if (child.isMesh) {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);

          if (!highest || worldPos.y > highest.position.y) highest = child;
          if (!lowest || worldPos.y < lowest.position.y) lowest = child;
          if (!leftmost || worldPos.x < leftmost.position.x) leftmost = child;
          if (!rightmost || worldPos.x > rightmost.position.x) rightmost = child;
        }
      });

      if (highest) parts.head = highest;
      if (lowest) parts.body = lowest;
    }

    // Store parts references
    group._body = parts.body;
    group._head = parts.head;
    group._armL = parts.armL;
    group._armR = parts.armR;
    group._legL = parts.legL;
    group._legR = parts.legR;
  },

  createProjectile(color, size) {
    const geo = new THREE.SphereGeometry(size || 3, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
    const mesh = new THREE.Mesh(geo, mat);

    const glowGeo = new THREE.SphereGeometry((size || 3) * 2, 8, 6);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glow);

    return mesh;
  },

  createBossProjectile(color, size) {
    const geo = new THREE.SphereGeometry(size || 6, 10, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);

    const glowGeo = new THREE.SphereGeometry((size || 6) * 1.5, 8, 6);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glow);

    return mesh;
  },

  createParticle(color, size) {
    const geo = new THREE.SphereGeometry(size || 3, 6, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 1.0,
      depthWrite: false
    });
    return new THREE.Mesh(geo, mat);
  },

  createPickup(type) {
    const group = new THREE.Group();
    const color = type === 'hp' ? 0xe24b4a : type === 'power' ? 0x378add : 0xfac775;

    const geo = new THREE.SphereGeometry(6, 10, 8);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 8;
    mesh.castShadow = true;
    group.add(mesh);

    const hlGeo = new THREE.SphereGeometry(3, 6, 4);
    const hlMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.set(-2, 10, 3);
    group.add(hl);

    return group;
  }
};
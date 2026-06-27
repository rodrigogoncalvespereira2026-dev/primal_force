const Model3D = {

  createChibi(color, size, opt = {}) {
    const group = new THREE.Group();
    const s = size || 22;
    const headR = s * 0.45;
    const bodyH = s * 0.35;
    const bodyW = s * 0.38;

    // Sombra no chão
    const shadowGeo = new THREE.CircleGeometry(s * 0.5, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.1;
    group.add(shadow);

    // Corpo
    const bodyGeo = new THREE.CylinderGeometry(bodyW * 0.5, bodyW * 0.6, bodyH, 12);
    const bodyMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(opt.bodyColor || color) });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyH / 2 + 0.5;
    body.castShadow = true;
    group.add(body);

    // Cabeça
    const headGeo = new THREE.SphereGeometry(headR, 16, 12);
    const headMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = bodyH + headR * 0.7;
    head.castShadow = true;
    group.add(head);

    // Brilho na cabeça
    if (!opt.mat) {
      const hlGeo = new THREE.SphereGeometry(headR * 0.35, 8, 6);
      const hlMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        depthWrite: false
      });
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(-headR * 0.3, bodyH + headR * 1.0, headR * 0.3);
      group.add(hl);
    }

    // Olhos
    const eyeSp = headR * 0.32;
    const eyeY = bodyH + headR * 0.75;
    const eyeR = headR * 0.18;

    const eyeGeo = new THREE.SphereGeometry(eyeR, 8, 6);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeL.position.set(-eyeSp, eyeY, headR * 0.8);
    group.add(eyeL);
    const eyeR2 = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeR2.position.set(eyeSp, eyeY, headR * 0.8);
    group.add(eyeR2);

    // Pupilas
    const pupilGeo = new THREE.SphereGeometry(eyeR * 0.55, 6, 4);
    const pupilMat = new THREE.MeshBasicMaterial({ color: opt.angry ? 0xaa0000 : 0x222222 });
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(-eyeSp + 0.3, eyeY + 0.2, headR * 0.92);
    group.add(pupilL);
    const pupilR3 = new THREE.Mesh(pupilGeo, pupilMat);
    pupilR3.position.set(eyeSp + 0.3, eyeY + 0.2, headR * 0.92);
    group.add(pupilR3);

    // Brilho nos olhos
    const hlEyeGeo = new THREE.SphereGeometry(eyeR * 0.25, 4, 3);
    const hlEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlEyeL = new THREE.Mesh(hlEyeGeo, hlEyeMat);
    hlEyeL.position.set(-eyeSp - 0.4, eyeY - 0.5, headR * 0.95);
    group.add(hlEyeL);
    const hlEyeR = new THREE.Mesh(hlEyeGeo, hlEyeMat);
    hlEyeR.position.set(eyeSp - 0.4, eyeY - 0.5, headR * 0.95);
    group.add(hlEyeR);

    // Boca
    if (opt.openMouth) {
      const mouthGeo = new THREE.SphereGeometry(headR * 0.18, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      const mouthMat = new THREE.MeshBasicMaterial({ color: 0x300000 });
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(0, bodyH + headR * 0.45, headR * 0.8);
      mouth.rotation.x = Math.PI;
      group.add(mouth);
    }

    // Escudo (se ativado)
    if (opt.shielded) {
      const shieldGeo = new THREE.TorusGeometry(s * 0.7, 1.5, 8, 24);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x378add,
        transparent: true,
        opacity: 0.6
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.y = bodyH / 2 + headR;
      shield.rotation.x = Math.PI / 2;
      group.add(shield);
    }

    return group;
  },

  createEnemy(type, color, size) {
    const group = new THREE.Group();
    const s = size || 14;
    const headR = s * 0.5;

    // Sombra
    const shadowGeo = new THREE.CircleGeometry(s * 0.4, 12);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.1;
    group.add(shadow);

    // Corpo
    const bodyGeo = new THREE.SphereGeometry(s * 0.3, 10, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = s * 0.2;
    body.castShadow = true;
    group.add(body);

    // Cabeça
    const headGeo = new THREE.SphereGeometry(headR, 12, 10);
    const headMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = s * 0.1 + headR * 0.5;
    head.castShadow = true;
    group.add(head);

    // Olho único grande
    const eyeR = headR * 0.35;
    const eyeGeo = new THREE.SphereGeometry(eyeR, 10, 8);
    const eyeColor = type === 3 ? 0xff4444 : 0xffff44;
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, s * 0.1 + headR * 0.5, headR * 0.7);
    group.add(eye);

    // Pupila
    const pupilGeo = new THREE.SphereGeometry(eyeR * 0.45, 6, 4);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0.5, s * 0.1 + headR * 0.5 + 0.5, headR * 0.85);
    group.add(pupil);

    // Brilho no olho
    const hlGeo = new THREE.SphereGeometry(eyeR * 0.2, 4, 3);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.set(0, s * 0.1 + headR * 0.5 - 0.5, headR * 0.9);
    group.add(hl);

    return group;
  },

  createBoss(color, colorAlt, size, opt = {}) {
    const group = new THREE.Group();
    const s = size || 38;
    const headR = s * 0.35;
    const bodyR = s * 0.28;

    // Aura (fase 2)
    if (opt.phase2) {
      const auraGeo = new THREE.SphereGeometry(s * 0.8, 16, 12);
      const auraMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorAlt),
        transparent: true,
        opacity: 0.1,
        depthWrite: false
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.y = s * 0.2;
      group.add(aura);
    }

    // Sombra
    const shadowGeo = new THREE.CircleGeometry(s * 0.55, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.1;
    group.add(shadow);

    // Corpo
    const bodyGeo = new THREE.SphereGeometry(bodyR, 12, 10);
    const bodyMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(colorAlt) });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyR * 0.3;
    body.castShadow = true;
    group.add(body);

    // Cabeça
    const headGeo = new THREE.SphereGeometry(headR, 14, 10);
    const headMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = bodyR * 0.3 + headR * 1.2;
    head.castShadow = true;
    group.add(head);

    // Brilho na cabeça
    if (!opt.mat) {
      const hlGeo = new THREE.SphereGeometry(headR * 0.3, 8, 6);
      const hlMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        depthWrite: false
      });
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(-headR * 0.3, bodyR * 0.3 + headR * 1.5, headR * 0.3);
      group.add(hl);
    }

    // Olhos
    const eyeSp = headR * 0.28;
    const eyeY = bodyR * 0.3 + headR * 1.25;
    const eyeR = headR * 0.22;

    const eyeGeo = new THREE.SphereGeometry(eyeR, 8, 6);
    const eyeColor = opt.eyeColor || 0xffffff;
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-eyeSp, eyeY, headR * 0.75);
    group.add(eyeL);
    const eyeR2 = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR2.position.set(eyeSp, eyeY, headR * 0.75);
    group.add(eyeR2);

    // Pupilas
    const pupilGeo = new THREE.SphereGeometry(eyeR * 0.5, 6, 4);
    const pupilMat = new THREE.MeshBasicMaterial({ color: opt.pupilColor || 0xaa0000 });
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(-eyeSp + 0.5, eyeY + 0.3, headR * 0.85);
    group.add(pupilL);
    const pupilR3 = new THREE.Mesh(pupilGeo, pupilMat);
    pupilR3.position.set(eyeSp + 0.5, eyeY + 0.3, headR * 0.85);
    group.add(pupilR3);

    // Boca aberta
    const mouthGeo = new THREE.SphereGeometry(headR * 0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x400000 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, bodyR * 0.3 + headR * 0.85, headR * 0.7);
    mouth.rotation.x = Math.PI;
    group.add(mouth);

    return group;
  },

  createProjectile(color, size) {
    const geo = new THREE.SphereGeometry(size || 3, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
    const mesh = new THREE.Mesh(geo, mat);

    // Glow
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

    // Glow
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
    const mat = new THREE.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 8;
    mesh.castShadow = true;
    group.add(mesh);

    // Brilho
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

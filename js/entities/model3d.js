const Model3D = {

  createChibi(color, size, opt = {}) {
    const group = new THREE.Group();
    const s = size || 22;
    const headR = s * 0.42;
    const bodyH = s * 0.3;
    const bodyW = s * 0.36;
    const c = new THREE.Color(opt.bodyColor || color);
    const cDark = c.clone().multiplyScalar(0.65);
    const cLight = c.clone().lerp(new THREE.Color(0xffffff), 0.35);

    // Sombra no chão
    const shadowGeo = new THREE.CircleGeometry(s * 0.45, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    group.add(shadow);

    // ── Pernas ──
    const legGeo = new THREE.CylinderGeometry(s * 0.07, s * 0.08, s * 0.22, 8);
    const legMat = new THREE.MeshLambertMaterial({ color: cDark });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-s * 0.1, s * 0.11, 0);
    legL.castShadow = true;
    group.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(s * 0.1, s * 0.11, 0);
    legR.castShadow = true;
    group.add(legR);

    // Botas
    const bootGeo = new THREE.BoxGeometry(s * 0.12, s * 0.07, s * 0.16);
    const bootMat = new THREE.MeshLambertMaterial({ color: cDark });
    const bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(-s * 0.1, s * 0.03, s * 0.02);
    bootL.castShadow = true;
    group.add(bootL);
    const bootR = new THREE.Mesh(bootGeo, bootMat);
    bootR.position.set(s * 0.1, s * 0.03, s * 0.02);
    bootR.castShadow = true;
    group.add(bootR);

    // ── Corpo (trajedo) ──
    const bodyGeo = new THREE.CylinderGeometry(bodyW * 0.48, bodyW * 0.55, bodyH, 12);
    const bodyMat = new THREE.MeshPhongMaterial({ color: c, shininess: 30, specular: 0x222222 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyH / 2 + s * 0.22;
    body.castShadow = true;
    group.add(body);

    // Cinto
    const beltGeo = new THREE.CylinderGeometry(bodyW * 0.52, bodyW * 0.52, s * 0.04, 12);
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = bodyH * 0.35 + s * 0.22;
    group.add(belt);

    // Fivela do cinto
    const buckleGeo = new THREE.BoxGeometry(s * 0.08, s * 0.05, s * 0.04);
    const buckleMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, bodyH * 0.35 + s * 0.22, bodyW * 0.5);
    group.add(buckle);

    // Diamante no peito (emblema do zord)
    const diamondGeo = new THREE.OctahedronGeometry(s * 0.06, 0);
    const diamondMat = new THREE.MeshPhongMaterial({ color: cLight, emissive: c, emissiveIntensity: 0.3, shininess: 80 });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.set(0, bodyH * 0.6 + s * 0.22, bodyW * 0.48);
    diamond.rotation.z = Math.PI / 4;
    group.add(diamond);

    // ── Braços ──
    const armGeo = new THREE.CylinderGeometry(s * 0.055, s * 0.065, s * 0.24, 8);
    const armMat = new THREE.MeshLambertMaterial({ color: c });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-bodyW * 0.55, bodyH * 0.5 + s * 0.22, 0);
    armL.rotation.z = 0.2;
    armL.castShadow = true;
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(bodyW * 0.55, bodyH * 0.5 + s * 0.22, 0);
    armR.rotation.z = -0.2;
    armR.castShadow = true;
    group.add(armR);

    // Mãos
    const handGeo = new THREE.SphereGeometry(s * 0.06, 6, 5);
    const handMat = new THREE.MeshLambertMaterial({ color: 0xf5c9a0 });
    const handL = new THREE.Mesh(handGeo, handMat);
    handL.position.set(-bodyW * 0.55, bodyH * 0.15 + s * 0.22, 0);
    group.add(handL);
    const handR = new THREE.Mesh(handGeo, handMat);
    handR.position.set(bodyW * 0.55, bodyH * 0.15 + s * 0.22, 0);
    group.add(handR);

    // ── Cabeça ──
    const headGeo = new THREE.SphereGeometry(headR, 16, 12);
    const headMat = new THREE.MeshPhongMaterial({ color: c, shininess: 40, specular: 0x333333 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = bodyH + headR * 0.65 + s * 0.22;
    head.castShadow = true;
    group.add(head);

    // Brilho na cabeça (highlight)
    const hlGeo = new THREE.SphereGeometry(headR * 0.3, 8, 6);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false });
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.set(-headR * 0.3, bodyH + headR * 0.95 + s * 0.22, headR * 0.35);
    group.add(hl);

    // ── Visor / Máscara ──
    const visorGeo = new THREE.BoxGeometry(headR * 1.5, headR * 0.45, headR * 0.2);
    const visorMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 100, specular: 0x444444 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, bodyH + headR * 0.72 + s * 0.22, headR * 0.75);
    group.add(visor);

    // Cristal do visor (transparente colorido)
    const crystalGeo = new THREE.BoxGeometry(headR * 1.3, headR * 0.35, headR * 0.05);
    const crystalMat = new THREE.MeshPhongMaterial({
      color: c,
      transparent: true,
      opacity: 0.7,
      shininess: 120,
      specular: 0xffffff,
      emissive: c,
      emissiveIntensity: 0.15
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0, bodyH + headR * 0.72 + s * 0.22, headR * 0.86);
    group.add(crystal);

    // Brilho no cristal
    const hlCrystalGeo = new THREE.BoxGeometry(headR * 0.5, headR * 0.15, headR * 0.03);
    const hlCrystalMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false });
    const hlCrystal = new THREE.Mesh(hlCrystalGeo, hlCrystalMat);
    hlCrystal.position.set(-headR * 0.2, bodyH + headR * 0.78 + s * 0.22, headR * 0.89);
    group.add(hlCrystal);

    // ── Olhos (atrás do visor) ──
    const eyeSp = headR * 0.3;
    const eyeY = bodyH + headR * 0.72 + s * 0.22;
    const eyeR = headR * 0.14;

    const eyeGeo = new THREE.SphereGeometry(eyeR, 8, 6);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeL.position.set(-eyeSp, eyeY, headR * 0.82);
    group.add(eyeL);
    const eyeR2 = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeR2.position.set(eyeSp, eyeY, headR * 0.82);
    group.add(eyeR2);

    // Pupilas
    const pupilGeo = new THREE.SphereGeometry(eyeR * 0.6, 6, 4);
    const pupilMat = new THREE.MeshBasicMaterial({ color: opt.angry ? 0xaa0000 : 0x111111 });
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(-eyeSp + 0.3, eyeY + 0.15, headR * 0.9);
    group.add(pupilL);
    const pupilR3 = new THREE.Mesh(pupilGeo, pupilMat);
    pupilR3.position.set(eyeSp + 0.3, eyeY + 0.15, headR * 0.9);
    group.add(pupilR3);

    // Brilho nos olhos
    const hlEyeGeo = new THREE.SphereGeometry(eyeR * 0.3, 4, 3);
    const hlEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlEyeL = new THREE.Mesh(hlEyeGeo, hlEyeMat);
    hlEyeL.position.set(-eyeSp - 0.3, eyeY - 0.3, headR * 0.93);
    group.add(hlEyeL);
    const hlEyeR = new THREE.Mesh(hlEyeGeo, hlEyeMat);
    hlEyeR.position.set(eyeSp - 0.3, eyeY - 0.3, headR * 0.93);
    group.add(hlEyeR);

    // Antenas / chifres decorativos
    const antennaGeo = new THREE.ConeGeometry(s * 0.03, s * 0.12, 6);
    const antennaMat = new THREE.MeshLambertMaterial({ color: cLight });
    const antennaL = new THREE.Mesh(antennaGeo, antennaMat);
    antennaL.position.set(-headR * 0.5, bodyH + headR * 1.15 + s * 0.22, 0);
    antennaL.rotation.z = 0.3;
    group.add(antennaL);
    const antennaR = new THREE.Mesh(antennaGeo, antennaMat);
    antennaR.position.set(headR * 0.5, bodyH + headR * 1.15 + s * 0.22, 0);
    antennaR.rotation.z = -0.3;
    group.add(antennaR);

    // Escudo (se ativado)
    if (opt.shielded) {
      const shieldGeo = new THREE.TorusGeometry(s * 0.65, 1.5, 8, 24);
      const shieldMat = new THREE.MeshBasicMaterial({ color: 0x378add, transparent: true, opacity: 0.6 });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.y = bodyH / 2 + headR + s * 0.15;
      shield.rotation.x = Math.PI / 2;
      group.add(shield);
    }

    group._body = body;
    group._head = head;
    group._armL = armL;
    group._armR = armR;
    group._legL = legL;
    group._legR = legR;

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

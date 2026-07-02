/**
 * Currency3D.js — Modelos 3D de Moedas e Jóias para o Primal Force
 *
 * Substitui/complementa o Model3D.createPickup() atual (que hoje usa
 * esferas simples para hp/power/coin). Estes modelos são geometria
 * procedural — não precisam de ficheiros .glb — e já vêm prontos para
 * o ToonShader (basta chamar ToonShader.applyToModel depois de criar).
 *
 * Uso:
 *   const coin = Currency3D.createCoin();
 *   ToonShader.applyToModel(coin, { steps: 3, outlineThickness: 0.02 });
 *   scene.add(coin);
 *
 *   const gem = Currency3D.createGem();
 *   ToonShader.applyToModel(gem, { steps: 3, outlineThickness: 0.02 });
 *   scene.add(gem);
 */

const Currency3D = {

  /**
   * Moeda: cilindro achatado com relevo (o "gravado" é simulado com
   * um segundo cilindro mais fino, ligeiramente saliente, no centro
   * de cada face — leve, sem precisar de texturas customizadas).
   */
  createCoin(opts = {}) {
    const radius = opts.radius ?? 0.5;
    const thickness = opts.thickness ?? 0.09;
    const group = new THREE.Group();
    group.name = 'coin_pickup';

    const bodyGeo = new THREE.CylinderGeometry(radius, radius, thickness, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.55,
      roughness: 0.35
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Relevo central (espiral Primal simplificada como disco elevado)
    const embossGeo = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, thickness * 1.4, 24);
    const embossMat = new THREE.MeshStandardMaterial({
      color: 0xF5DA8C,
      metalness: 0.6,
      roughness: 0.3
    });
    const emboss = new THREE.Mesh(embossGeo, embossMat);
    group.add(emboss);

    // Anel do rebordo (bevel visual)
    const rimGeo = new THREE.TorusGeometry(radius * 0.92, radius * 0.06, 8, 24);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, metalness: 0.5, roughness: 0.4 });
    const rimTop = new THREE.Mesh(rimGeo, rimMat);
    rimTop.rotation.x = Math.PI / 2;
    rimTop.position.y = thickness / 2;
    group.add(rimTop);
    const rimBottom = rimTop.clone();
    rimBottom.position.y = -thickness / 2;
    group.add(rimBottom);

    group.userData.spinAxis = 'y';       // referência para animação de rotação
    group.userData.currencyType = 'coin';
    return group;
  },

  /**
   * Jóia: cristal facetado (bipirâmide hexagonal) — construído a partir
   * de um ConeGeometry duplo para dar o corte "gema" clássico sem
   * precisar de BufferGeometry customizada.
   */
  createGem(opts = {}) {
    const radius = opts.radius ?? 0.32;
    const group = new THREE.Group();
    group.name = 'gem_pickup';

    const mat = new THREE.MeshStandardMaterial({
      color: 0x8B4FD6,
      metalness: 0.2,
      roughness: 0.15,
      transparent: true,
      opacity: 0.92,
      emissive: 0x4a1f8a,
      emissiveIntensity: 0.35
    });

    // Topo: pirâmide hexagonal (faceta superior)
    const topGeo = new THREE.ConeGeometry(radius, radius * 0.7, 6);
    const top = new THREE.Mesh(topGeo, mat);
    top.position.y = radius * 0.35;
    top.castShadow = true;
    group.add(top);

    // Base: pirâmide hexagonal invertida, mais longa (corpo da gema)
    const bottomGeo = new THREE.ConeGeometry(radius, radius * 1.6, 6);
    const bottom = new THREE.Mesh(bottomGeo, mat);
    bottom.rotation.x = Math.PI;
    bottom.position.y = -radius * 0.45;
    bottom.castShadow = true;
    group.add(bottom);

    // Glow externo (halo suave, mesma técnica usada no createPickup atual)
    const glowGeo = new THREE.SphereGeometry(radius * 1.6, 10, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xB478E8,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    group.userData.spinAxis = 'y';
    group.userData.pulseGlow = glow;     // referência para animar opacidade do halo
    group.userData.currencyType = 'gem';
    return group;
  },

  /**
   * Helper: anima rotação + bounce suave, para chamar no loop de update
   * do jogo (mesmo padrão que provavelmente já usas para os pickups
   * existentes). dt em segundos.
   */
  animatePickup(pickupGroup, dt, elapsed) {
    pickupGroup.rotation.y += dt * 1.4;
    pickupGroup.position.y = 0.15 + Math.sin(elapsed * 2.2) * 0.06;

    if (pickupGroup.userData.pulseGlow) {
      pickupGroup.userData.pulseGlow.material.opacity = 0.12 + Math.abs(Math.sin(elapsed * 3)) * 0.15;
    }
  }
};

if (typeof window !== 'undefined') window.Currency3D = Currency3D;
if (typeof module !== 'undefined' && module.exports) module.exports = Currency3D;

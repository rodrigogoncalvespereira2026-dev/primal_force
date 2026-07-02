/**
 * ToonShader.js — Sistema de shading estilo anime/toon para o Primal Force
 * Compatível com o teu setup atual (Model3D, engine3d.js, THREE r128+)
 *
 * O que faz:
 *  1. Gera um "gradient map" de 3 bandas (sombra / meio-tom / luz) para usar
 *     com THREE.MeshToonMaterial — dá aquele look de sombras "em blocos"
 *     típico de anime 3D (Genshin, Guilty Gear Strive, DBFZ).
 *  2. Aplica outline preto grosso a cada modelo usando a técnica "inverted
 *     hull" (uma cópia do mesh, normais invertidas, ligeiramente maior,
 *     material preto virado para dentro). Não precisa de postprocessing.
 *
 * Como usar (dentro do model3d.js, ver createFromGLB):
 *
 *   const model = ...; // depois de carregado o GLB
 *   ToonShader.applyToModel(model, { outlineThickness: 0.03 });
 *
 * Isso é tudo — troca os materiais para toon e adiciona outlines a cada mesh.
 */

const ToonShader = {

  // Cache da gradient map para não recriar textura a cada modelo
  _gradientMap: null,

  /**
   * Cria (ou devolve do cache) a textura de gradiente de 3 tons usada
   * pelo MeshToonMaterial. Isto é o que define quantas "bandas" de sombra
   * aparecem no modelo — 3 é o clássico estilo anime, 2 fica mais duro/comic,
   * 4-5 fica mais suave (mais perto de PBR normal).
   */
  getGradientMap(steps = 3) {
    if (this._gradientMap && this._gradientMap.userData.steps === steps) {
      return this._gradientMap;
    }

    const canvas = document.createElement('canvas');
    canvas.width = steps;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');

    // Bandas de tom: da mais escura para a mais clara.
    // Ajusta estes valores para mudar o "peso" das sombras.
    const shades = steps === 2
      ? [120, 255]
      : steps === 4
        ? [80, 140, 200, 255]
        : [100, 170, 255]; // default 3 bandas — mais brilho

    for (let i = 0; i < steps; i++) {
      ctx.fillStyle = `rgb(${shades[i]},${shades[i]},${shades[i]})`;
      ctx.fillRect(i, 0, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.userData = { steps };

    this._gradientMap = texture;
    return texture;
  },

  /**
   * Converte um material standard (MeshStandardMaterial/MeshPhysicalMaterial
   * vindo do GLB exportado) num MeshToonMaterial, preservando cor e textura.
   */
  toToonMaterial(originalMat, opts = {}) {
    const gradientMap = this.getGradientMap(opts.steps || 3);

    const toonMat = new THREE.MeshToonMaterial({
      color: originalMat.color ? originalMat.color.clone() : 0xffffff,
      map: originalMat.map || null,
      gradientMap: gradientMap,
      transparent: originalMat.transparent || false,
      opacity: originalMat.opacity ?? 1,
      alphaMap: originalMat.alphaMap || null,
      skinning: !!originalMat.skinning,
      morphTargets: !!originalMat.morphTargets,
      morphNormals: !!originalMat.morphNormals
    });

    // Emissive ajuda muito para "glow" em partes do fato/armas nos Rangers
    if (originalMat.emissive) {
      toonMat.emissive = originalMat.emissive.clone();
      toonMat.emissiveMap = originalMat.emissiveMap || null;
      toonMat.emissiveIntensity = originalMat.emissiveIntensity ?? 1;
    }

    return toonMat;
  },

  /**
   * Cria a mesh de outline (inverted hull) para uma mesh dada.
   * thickness controla a espessura do contorno (em unidades do modelo,
   * NÃO em pixels — ajusta conforme a escala dos teus modelos, normalmente
   * 0.02–0.05 fica bem para personagens de tamanho ~1-2 unidades).
   */
  createOutlineMesh(mesh, opts = {}) {
    const thickness = opts.outlineThickness ?? 0.03;
    const color = opts.outlineColor ?? 0x0a0a0a;

    const outlineMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.BackSide,   // renderiza só o "interior" da hull invertida
      skinning: !!mesh.material?.skinning,
      morphTargets: !!mesh.material?.morphTargets
    });

    const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
    outlineMesh.scale.multiplyScalar(1 + thickness);
    outlineMesh.renderOrder = mesh.renderOrder - 1; // desenha antes da mesh principal
    outlineMesh.name = (mesh.name || 'mesh') + '_outline';

    // Se for skinned mesh (com animações/esqueleto), precisamos de um SkinnedMesh
    if (mesh.isSkinnedMesh) {
      const skinnedOutline = new THREE.SkinnedMesh(mesh.geometry, outlineMat);
      skinnedOutline.scale.multiplyScalar(1 + thickness);
      skinnedOutline.renderOrder = mesh.renderOrder - 1;
      skinnedOutline.name = outlineMesh.name;
      skinnedOutline.bind(mesh.skeleton, mesh.bindMatrix);
      return skinnedOutline;
    }

    return outlineMesh;
  },

  /**
   * Função principal: percorre o modelo todo (grupo do GLB) e:
   *  - troca cada material para toon
   *  - adiciona uma mesh de outline "filha" a cada mesh original
   *
   * opts:
   *   steps: 2 | 3 | 4        (nº de bandas de sombra, default 3)
   *   outlineThickness: number (default 0.03)
   *   outlineColor: hex        (default 0x0a0a0a, quase preto)
   *   skipOutline: boolean     (true = só aplica toon shading, sem contorno)
   */
  applyToModel(model, opts = {}) {
    const meshesToProcess = [];

    model.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        meshesToProcess.push(child);
      }
    });

    meshesToProcess.forEach((mesh) => {
      // Suporta multi-material (array) e material único
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(m => this.toToonMaterial(m, opts));
      } else {
        mesh.material = this.toToonMaterial(mesh.material, opts);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (!opts.skipOutline) {
        const outline = this.createOutlineMesh(mesh, opts);
        mesh.add(outline);
      }
    });

    return model;
  },

  /**
   * Ajusta a luz da cena para combinar melhor com o visual toon.
   * Luzes toon ficam melhor mais "duras" (menos ambient, luz direcional
   * mais forte) porque o gradient map já faz o trabalho de suavizar.
   * Chama isto UMA VEZ no setup do engine3d.js, opcionalmente.
   */
  tuneSceneLighting(engine) {
    if (engine.ambientLight) engine.ambientLight.intensity = 0.8; // mais luz base = sombras toon mais limpas
    if (engine.dirLight) {
      engine.dirLight.intensity = 1.3;
      engine.dirLight.castShadow = true;
    }
    if (engine.hemiLight) engine.hemiLight.intensity = 0.3;
  }
};

// Exporta para uso global (mesmo padrão que Model3D, ModelLoader, etc.)
if (typeof window !== 'undefined') window.ToonShader = ToonShader;
if (typeof module !== 'undefined' && module.exports) module.exports = ToonShader;

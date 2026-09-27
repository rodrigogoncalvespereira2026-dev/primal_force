const Settings = {
  _key: 'prf_quality',
  quality: 'high',

  load() {
    try {
      const q = localStorage.getItem(this._key);
      if (q === 'high' || q === 'medium' || q === 'low') this.quality = q;
    } catch (e) {}
  },

  setQuality(q) {
    this.quality = (q === 'medium' || q === 'low') ? q : 'high';
    try { localStorage.setItem(this._key, this.quality); } catch (e) {}
    this.apply();
  },

  apply() {
    try {
      if (typeof Engine3D === 'undefined' || !Engine3D.renderer) return;
      const r = Engine3D.renderer;
      const dpr = window.devicePixelRatio || 1;
      const pr = this.quality === 'high' ? Math.min(dpr, 2) : (this.quality === 'medium' ? 1 : 0.75);
      r.setPixelRatio(pr);
      r.shadowMap.enabled = this.quality !== 'low';
      if (Engine3D.scene) {
        Engine3D.scene.traverse(o => {
          const m = o.material;
          if (!m) return;
          if (Array.isArray(m)) m.forEach(x => { x.needsUpdate = true; });
          else m.needsUpdate = true;
        });
      }
    } catch (e) {}
  },
};

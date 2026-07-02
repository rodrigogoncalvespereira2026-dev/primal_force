const MapStorage = {
  STORAGE_KEY: 'prf_custom_maps',

  getAll() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  save(mapData) {
    const maps = this.getAll();
    const idx = maps.findIndex(m => m.name === mapData.name);
    mapData.savedAt = Date.now();
    if (idx >= 0) {
      maps[idx] = mapData;
    } else {
      maps.push(mapData);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(maps));
    return true;
  },

  load(name) {
    const maps = this.getAll();
    return maps.find(m => m.name === name) || null;
  },

  remove(name) {
    let maps = this.getAll();
    maps = maps.filter(m => m.name !== name);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(maps));
  },

  exportJSON(mapData) {
    const json = JSON.stringify(mapData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapData.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data.grid) throw new Error('Formato inválido: sem grid');
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  saveActiveMap(mapData) {
    localStorage.setItem('prf_active_custom_map', JSON.stringify(mapData));
  },

  loadActiveMap() {
    try {
      const raw = localStorage.getItem('prf_active_custom_map');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  clearActiveMap() {
    localStorage.removeItem('prf_active_custom_map');
  },
};

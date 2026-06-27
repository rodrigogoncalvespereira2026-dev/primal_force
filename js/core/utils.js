const Utils = {
  dist(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  angle(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
  },

  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },

  randRange(min, max) {
    return min + Math.random() * (max - min);
  },

  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  normalize(vx, vy) {
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: vx / len, y: vy / len };
  },

  spawnEdge(worldW, worldH, margin = 60, isSolid = null) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const edge = Math.floor(Math.random() * 4);
      let pos;
      if (edge === 0) pos = { x: Utils.randRange(margin, worldW - margin), y: margin };
      else if (edge === 1) pos = { x: worldW - margin, y: Utils.randRange(margin, worldH - margin) };
      else if (edge === 2) pos = { x: Utils.randRange(margin, worldW - margin), y: worldH - margin };
      else pos = { x: margin, y: Utils.randRange(margin, worldH - margin) };

      if (!isSolid || !isSolid(pos.x, pos.y)) return pos;
    }
    return { x: worldW / 2, y: worldH / 2 };
  },
};

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

  spawnEdge(worldW, worldH, margin = 60) {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) return { x: Utils.randRange(0, worldW), y: margin };
    if (edge === 1) return { x: worldW - margin, y: Utils.randRange(0, worldH) };
    if (edge === 2) return { x: Utils.randRange(0, worldW), y: worldH - margin };
    return { x: margin, y: Utils.randRange(0, worldH) };
  },
};

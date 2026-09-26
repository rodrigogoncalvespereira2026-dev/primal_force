const AudioFX = {
  ctx: null,
  enabled: true,
  volume: 0.35,

  init() {
    try { this.enabled = localStorage.getItem('prf_muted') !== '1'; } catch (e) {}
    const unlock = () => { this._ensure(); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.closest && t.closest('button, .ranger-card, .shop-item, .shop-skin-chip, .wm-mission, .bp-tier-card')) {
        this.play('ui');
      }
    });
  },

  _ensure() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch (e) { return null; }
  },

  setEnabled(on) {
    this.enabled = !!on;
    try { localStorage.setItem('prf_muted', on ? '0' : '1'); } catch (e) {}
  },

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) this.play('ui');
    return this.enabled;
  },

  _tone(opts) {
    const ctx = this.ctx;
    const f    = opts.f || 440;
    const to   = opts.to;
    const dur  = opts.dur || 0.15;
    const type = opts.type || 'square';
    const gain = opts.gain || 0.25;
    const t0   = ctx.currentTime + (opts.delay || 0);
    const osc  = ctx.createOscillator();
    const g    = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * this.volume), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  },

  _noise(dur, gain, delay) {
    const ctx = this.ctx;
    const t0  = ctx.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch  = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const g   = ctx.createGain();
    const flt = ctx.createBiquadFilter();
    src.buffer = buf;
    g.gain.value = (gain || 0.3) * this.volume;
    flt.type = 'lowpass';
    flt.frequency.value = 1400;
    src.connect(flt);
    flt.connect(g);
    g.connect(ctx.destination);
    src.start(t0);
  },

  play(name) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    if (!ctx) return;
    try {
      switch (name) {
        case 'ui':
          this._tone({ f: 660, dur: 0.06, type: 'sine', gain: 0.16 });
          break;
        case 'shoot':
          this._tone({ f: 720, to: 220, dur: 0.12, type: 'square', gain: 0.14 });
          break;
        case 'hit':
          this._tone({ f: 240, to: 120, dur: 0.08, type: 'sawtooth', gain: 0.16 });
          break;
        case 'kill':
          this._tone({ f: 320, to: 720, dur: 0.12, type: 'square', gain: 0.18 });
          break;
        case 'explode':
          this._noise(0.4, 0.35);
          this._tone({ f: 130, to: 40, dur: 0.4, type: 'sawtooth', gain: 0.22 });
          break;
        case 'pickup':
          this._tone({ f: 880, to: 1320, dur: 0.1, type: 'sine', gain: 0.18 });
          break;
        case 'coin':
          this._tone({ f: 1180, dur: 0.06, type: 'square', gain: 0.14 });
          this._tone({ f: 1560, dur: 0.1, type: 'square', gain: 0.14, delay: 0.06 });
          break;
        case 'hurt':
          this._tone({ f: 180, to: 70, dur: 0.22, type: 'sawtooth', gain: 0.24 });
          break;
        case 'wave':
          this._tone({ f: 520, dur: 0.12, type: 'triangle', gain: 0.18 });
          this._tone({ f: 780, dur: 0.16, type: 'triangle', gain: 0.18, delay: 0.12 });
          break;
        case 'boss':
          this._tone({ f: 95, to: 45, dur: 0.7, type: 'sawtooth', gain: 0.26 });
          this._noise(0.5, 0.22);
          break;
        case 'victory':
          [523, 659, 784, 1046].forEach((f, i) => this._tone({ f: f, dur: 0.22, type: 'triangle', gain: 0.2, delay: i * 0.13 }));
          break;
        case 'defeat':
          [440, 349, 294, 220].forEach((f, i) => this._tone({ f: f, dur: 0.3, type: 'sawtooth', gain: 0.16, delay: i * 0.16 }));
          break;
      }
    } catch (e) {}
  },
};

function sfx(name) {
  try { AudioFX.play(name); } catch (e) {}
}

const AudioFX = {
  ctx: null,
  enabled: true,
  volume: 0.35,
  musicEnabled: true,
  _musicTrack: null,
  _musicTimer: null,
  _musicGain: null,
  _musicNext: 0,
  _musicStep: 0,

  MUSIC: {
    menu: {
      bpm: 128,
      roots: [36, 43, 45, 41],
      triads: [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]],
      melody: [
        [[0, 72, 2], [2, 76, 2], [4, 79, 2], [6, 76, 2], [8, 74, 4], [12, 72, 2], [14, 71, 2]],
        [[0, 74, 2], [2, 79, 2], [4, 83, 2], [6, 79, 2], [8, 77, 4], [12, 74, 2], [14, 76, 2]],
        [[0, 76, 2], [2, 72, 2], [4, 69, 2], [6, 72, 2], [8, 76, 4], [12, 79, 2], [14, 76, 2]],
        [[0, 77, 2], [2, 76, 2], [4, 72, 2], [6, 69, 2], [8, 65, 4], [12, 67, 2], [14, 69, 2]],
      ],
      drums: { kick: [0, 8], clap: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], crash: [0] },
      stabs: [2, 6, 10, 14],
      bassOct: [6, 14],
      lead: { type: 'square', gain: 0.15 },
      bass: { gain: 0.2, cutoff: 750 },
      stabGain: 0.045,
    },
    battle: {
      bpm: 142,
      roots: [45, 41, 48, 43],
      triads: [[57, 60, 64], [57, 60, 65], [60, 64, 67], [59, 62, 67]],
      melody: [
        [[0, 69, 2], [2, 72, 2], [4, 76, 2], [6, 72, 2], [8, 69, 2], [10, 72, 2], [12, 76, 4]],
        [[0, 65, 2], [2, 69, 2], [4, 72, 2], [6, 69, 2], [8, 77, 4], [12, 76, 2], [14, 74, 2]],
        [[0, 67, 2], [2, 72, 2], [4, 76, 2], [6, 72, 2], [8, 79, 4], [12, 76, 2], [14, 74, 2]],
        [[0, 74, 2], [2, 71, 2], [4, 67, 2], [6, 71, 2], [8, 74, 4], [12, 79, 2], [14, 76, 2]],
      ],
      drums: { kick: [0, 4, 8, 12], clap: [4, 12], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], crash: [0, 2] },
      stabs: [2, 6, 10, 14],
      bassOct: [6, 14],
      lead: { type: 'square', gain: 0.14 },
      bass: { gain: 0.22, cutoff: 900 },
      stabGain: 0.04,
    },
  },

  init() {
    try { this.enabled = localStorage.getItem('prf_muted') !== '1'; } catch (e) {}
    try {
      const v = parseFloat(localStorage.getItem('prf_volume'));
      if (!isNaN(v)) this.volume = Math.min(1, Math.max(0, v));
    } catch (e) {}
    try { this.musicEnabled = localStorage.getItem('prf_music') !== '0'; } catch (e) {}
    const unlock = () => {
      const ctx = this._ensure();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => this._startMusic(), () => {});
      } else {
        this._startMusic();
      }
    };
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
    if (on) { if (this._musicTrack) this._startMusic(); }
    else this._stopMusicNodes();
  },

  setVolume(v) {
    this.volume = Math.min(1, Math.max(0, Number(v) || 0));
    try { localStorage.setItem('prf_volume', String(this.volume)); } catch (e) {}
    this._applyMusicVolume();
  },

  setMusicEnabled(on) {
    this.musicEnabled = !!on;
    try { localStorage.setItem('prf_music', on ? '1' : '0'); } catch (e) {}
    if (on) { if (this._musicTrack) this._startMusic(); }
    else this._stopMusicNodes();
  },

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) this.play('ui');
    return this.enabled;
  },

  playMusic(track) {
    if (track && !this.MUSIC[track]) track = null;
    if (this._musicTrack === track) return;
    this._stopMusicNodes();
    this._musicTrack = track;
    if (track) this._startMusic();
  },

  _startMusic() {
    if (!this._musicTrack || !this.enabled || !this.musicEnabled || this._musicTimer) return;
    const ctx = this._ensure();
    if (!ctx || ctx.state !== 'running') return;
    try {
      this._musicGain = ctx.createGain();
      this._musicGain.connect(ctx.destination);
      this._applyMusicVolume();
      this._musicNext = ctx.currentTime + 0.2;
      this._musicStep = 0;
      this._musicTick();
      this._musicTimer = setInterval(() => this._musicTick(), 150);
    } catch (e) { this._musicTimer = null; }
  },

  _stopMusicNodes() {
    if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
    const g = this._musicGain;
    if (!g) return;
    this._musicGain = null;
    try { g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08); } catch (e) {}
    setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 600);
  },

  _applyMusicVolume() {
    if (!this._musicGain) return;
    const v = (this.enabled && this.musicEnabled) ? Math.max(0.0001, this.volume) : 0.0001;
    try { this._musicGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); } catch (e) {}
  },

  _musicTick() {
    const ctx = this.ctx;
    const spec = this.MUSIC[this._musicTrack];
    if (!ctx || !spec || !this._musicGain) return;
    if (ctx.currentTime > this._musicNext + 2) this._musicNext = ctx.currentTime + 0.1;
    const stepDur = 15 / spec.bpm;
    let guard = 0;
    while (this._musicNext < ctx.currentTime + 0.8 && guard++ < 64) {
      this._playMusicStep(spec, this._musicStep, this._musicNext);
      this._musicStep++;
      this._musicNext += stepDur;
    }
  },

  _playMusicStep(spec, step, t) {
    const ctx = this.ctx;
    const dest = this._musicGain;
    if (!ctx || !dest) return;
    const stepDur = 15 / spec.bpm;
    const bars = spec.roots.length;
    const bar = Math.floor(step / 16) % bars;
    const s = step % 16;
    const mel = spec.melody[bar] || [];

    for (let i = 0; i < mel.length; i++) {
      const n = mel[i];
      if (n[0] !== s) continue;
      this._note(dest, t, this._hz(n[1]), Math.max(0.05, n[2] * stepDur * 0.92), spec.lead.gain, spec.lead.type);
    }

    if (s % 2 === 0) {
      const oct = spec.bassOct.indexOf(s) >= 0 ? 12 : 0;
      this._bass(dest, t, this._hz(spec.roots[bar] + oct), stepDur * 2 * 0.85, spec.bass.gain, spec.bass.cutoff);
    }

    if (spec.stabs.indexOf(s) >= 0) {
      const triad = spec.triads[bar];
      for (let i = 0; i < triad.length; i++) {
        this._note(dest, t, this._hz(triad[i]), stepDur * 0.9, spec.stabGain, 'square');
      }
    }

    const d = spec.drums;
    if (d.kick.indexOf(s) >= 0)  this._kick(dest, t, 0.45);
    if (d.clap.indexOf(s) >= 0)  this._clap(dest, t, 0.2);
    if (d.hat.indexOf(s) >= 0)   this._hat(dest, t, s % 4 === 0 ? 0.075 : 0.045);
    if (s === 0 && d.crash.indexOf(bar) >= 0) this._crash(dest, t, 0.12);
  },

  _hz(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  },

  _note(dest, t, freq, dur, gain, type) {
    const ctx = this.ctx;
    if (!ctx) return;
    dur = Math.max(0.03, dur);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0003, gain), t + 0.012);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0003, gain * 0.6), t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.03);
  },

  _bass(dest, t, freq, dur, gain, cutoff) {
    const ctx = this.ctx;
    if (!ctx) return;
    dur = Math.max(0.05, dur);
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq, t);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff || 800, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0003, gain), t + 0.01);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0003, gain * 0.5), t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.03);
  },

  _noiseBuffer() {
    if (this._nbuf) return this._nbuf;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 1.0);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._nbuf = buf;
    return buf;
  },

  _drum(dest, t, gain, dur, filterType, freq, q) {
    const ctx = this.ctx;
    if (!ctx) return;
    const src = ctx.createBufferSource();
    const flt = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = this._noiseBuffer();
    flt.type = filterType;
    flt.frequency.value = freq;
    if (q) flt.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0003, gain), t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + dur + 0.02);
  },

  _kick(dest, t, gain) {
    const ctx = this.ctx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(155, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0003, gain), t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + 0.2);
  },

  _clap(dest, t, gain) {
    this._drum(dest, t, gain, 0.13, 'bandpass', 1700, 1.1);
  },

  _hat(dest, t, gain) {
    this._drum(dest, t, gain, 0.035, 'highpass', 7500, 0.7);
  },

  _crash(dest, t, gain) {
    this._drum(dest, t, gain, 0.7, 'highpass', 5200, 0.6);
  },

  _tone(opts) {
    const ctx = this.ctx;
    const f    = opts.f || 440;
    const to   = opts.to;
    const dur  = opts.dur || 0.15;
    const type = opts.type || 'square';
    const gain = opts.gain || 0.25;
    const out  = opts.noVol ? gain : gain * this.volume;
    const t0   = ctx.currentTime + (opts.delay || 0);
    const osc  = ctx.createOscillator();
    const g    = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, out), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(opts.dest || ctx.destination);
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
        case 'gotaTap':
          this._tone({ f: 640, to: 760, dur: 0.05, type: 'triangle', gain: 0.14 });
          break;
        case 'gotaMiss':
          this._tone({ f: 320, to: 190, dur: 0.16, type: 'square', gain: 0.14 });
          break;
        case 'gotaUpgrade':
          this._tone({ f: 660, dur: 0.09, type: 'triangle', gain: 0.18 });
          this._tone({ f: 880, dur: 0.09, type: 'triangle', gain: 0.18, delay: 0.08 });
          this._tone({ f: 1180, dur: 0.14, type: 'triangle', gain: 0.2, delay: 0.16 });
          this._noise(0.18, 0.16);
          break;
        case 'gotaBurst':
          this._tone({ f: 300, to: 900, dur: 0.26, type: 'sawtooth', gain: 0.2 });
          this._noise(0.3, 0.18);
          break;
        case 'gotaClaim':
          [523, 784, 1046, 1318].forEach((f, i) => this._tone({ f: f, dur: 0.2, type: 'triangle', gain: 0.2, delay: i * 0.11 }));
          this._noise(0.35, 0.14);
          break;
      }
    } catch (e) {}
  },
};

function sfx(name) {
  try { AudioFX.play(name); } catch (e) {}
}

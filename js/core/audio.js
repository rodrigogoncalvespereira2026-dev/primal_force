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
    menu:   { bpm: 96,  chordLen: 16, chords: [[110, 261.63, 329.63], [87.31, 261.63, 440], [130.81, 329.63, 392], [98, 293.66, 493.88]] },
    battle: { bpm: 150, chordLen: 16, chords: [[110, 164.81, 261.63], [87.31, 130.81, 220], [98, 146.83, 246.94], [82.41, 123.47, 196]] },
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
    const stepDur = 30 / spec.bpm;
    let guard = 0;
    while (this._musicNext < ctx.currentTime + 0.8 && guard++ < 32) {
      this._playMusicStep(spec, this._musicStep, this._musicNext);
      this._musicStep++;
      this._musicNext += stepDur;
    }
  },

  _playMusicStep(spec, step, t) {
    const ctx = this.ctx;
    const dest = this._musicGain;
    if (!ctx || !dest) return;
    const stepDur = 30 / spec.bpm;
    const chord = spec.chords[Math.floor(step / spec.chordLen) % spec.chords.length];
    const s = step % spec.chordLen;
    const delay = Math.max(0, t - ctx.currentTime);
    if (this._musicTrack === 'battle') {
      const arp = [0, 1, 2, 1];
      this._tone({ f: chord[arp[s % 4]], dur: 0.2, type: 'triangle', gain: 0.05, delay, dest, noVol: true });
      if (s % 4 === 0) this._tone({ f: chord[0] * 0.5, dur: 0.14, type: 'sine', gain: 0.09, delay, dest, noVol: true });
      if (s % 4 === 2) this._tone({ f: chord[2] * 2, dur: 0.05, type: 'square', gain: 0.014, delay, dest, noVol: true });
      return;
    }
    if (s === 0) {
      const dur = stepDur * spec.chordLen;
      chord.forEach((f, i) => this._tone({ f, dur, type: 'sine', gain: 0.055 - i * 0.008, delay, dest, noVol: true }));
    }
    if (s % 4 === 2) {
      this._tone({ f: chord[(s % 8 === 6) ? 2 : 1] * 2, dur: 0.5, type: 'triangle', gain: 0.03, delay, dest, noVol: true });
    }
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
      }
    } catch (e) {}
  },
};

function sfx(name) {
  try { AudioFX.play(name); } catch (e) {}
}

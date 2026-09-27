const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;

function makeCtx() {
  const counts = { osc: 0, gain: 0, buf: 0, filt: 0, src: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  return {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    state: 'running',
    counts,
    createOscillator() { counts.osc++; return { type: '', frequency: param(), connect() {}, start() {}, stop() {} }; },
    createGain() { counts.gain++; return { gain: param(), connect() {}, disconnect() {} }; },
    createBiquadFilter() { counts.filt++; return { type: '', frequency: param(), Q: param(), connect() {} }; },
    createBuffer(ch, len) { counts.buf++; return { length: len, getChannelData() { return new Float32Array(len); } }; },
    createBufferSource() { counts.src++; return { buffer: null, connect() {}, start() {}, stop() {} }; },
    resume() { return Promise.resolve(); },
  };
}

const src = fs.readFileSync(root + 'js/core/audio.js', 'utf8');
(0, eval)(src + '\nglobalThis.AudioFX = AudioFX;');

let fails = 0;
const check = (label, cond) => {
  if (!cond) fails++;
  console.log((cond ? 'ok:   ' : 'FAIL: ') + label);
};

const ctx = makeCtx();
AudioFX.ctx = ctx;
AudioFX._musicGain = { gain: { setValueAtTime() {}, setTargetAtTime() {} } };

check('converte midi para Hz (A4=440)', Math.abs(AudioFX._hz(69) - 440) < 0.001);
check('converte midi para Hz (C4~261.63)', Math.abs(AudioFX._hz(60) - 261.63) < 0.01);

const spec = AudioFX.MUSIC.menu;
spec.melody.forEach((bar, i) => {
  check('melodia menu barra ' + i + ' tem notas', bar.length > 0);
  bar.forEach(n => {
    if (!(n[0] >= 0 && n[0] < 16 && n[1] > 40 && n[1] < 100 && n[2] > 0)) fails++;
  });
});

const before = Object.assign({}, ctx.counts);
for (let s = 0; s < 16; s++) AudioFX._playMusicStep(spec, s, ctx.currentTime);
const oscBar = ctx.counts.osc - before.osc;
const srcBar = ctx.counts.src - before.src;
const leadNotes = spec.melody[0].length;
const stabNotes = spec.stabs.length * 3;
const bassNotes = 8;
const kicks = spec.drums.kick.length;
const claps = spec.drums.clap.length;
const hats = spec.drums.hat.length;
const crashes = spec.drums.crash.indexOf(0) >= 0 ? 1 : 0;
const expectedOsc = leadNotes + stabNotes + bassNotes + kicks;
check('barra menu: ' + expectedOsc + ' osciladores (melodia+stabs+bass+bumbo)', oscBar === expectedOsc);
check('barra menu: ' + (claps + hats + crashes) + ' fontes de ruído (clap+hi-hat+crash)', srcBar === claps + hats + crashes);

const beforeB = Object.assign({}, ctx.counts);
for (let s = 0; s < 16; s++) AudioFX._playMusicStep(AudioFX.MUSIC.battle, 3 * 16 + s, ctx.currentTime);
check('barra battle (barra 3) corre sem erro', (ctx.counts.osc - beforeB.osc) > 0);
check('battle usa 4 bumbos por barra', AudioFX.MUSIC.battle.drums.kick.length === 4);
check('battle tem hi-hat em semicolcheias', AudioFX.MUSIC.battle.drums.hat.length === 16);

AudioFX._musicTrack = 'menu';
AudioFX._musicStep = 0;
AudioFX._musicNext = 0.05;
ctx.currentTime = 0;
AudioFX._musicTick();
check('scheduler avança passos à frente', AudioFX._musicStep >= 5 && AudioFX._musicNext >= 0.8);

const stepsAfterFirst = AudioFX._musicStep;
ctx.currentTime = 10;
AudioFX._musicTick();
check('scheduler ressincroniza após pausa', AudioFX._musicNext >= 10 && AudioFX._musicNext < 11);
check('scheduler continua a marcar depois da pausa', AudioFX._musicStep > stepsAfterFirst);

AudioFX._musicGain = null;
AudioFX._playMusicStep(spec, 0, 0);
check('sem musicGain não rebenta', true);

console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : '\n' + fails + ' FALHAS');
process.exit(fails === 0 ? 0 : 1);

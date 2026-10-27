'use strict';
// ============================================================
//  Audio: sintetizador chiptune con WebAudio, música original y SFX
// ============================================================

const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteMidi(n) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) return null;
  let v = NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return v + (parseInt(m[3], 10) + 1) * 12;
}
const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

function chordTones(name) {
  const m = /^([A-G][#b]?)(m7|m|7|dim|sus)?$/.exec(name);
  const root = noteMidi(m[1] + '3') % 12;
  const q = m[2] || '';
  const iv = q === 'm' ? [0, 3, 7] : q === 'm7' ? [0, 3, 7, 10] : q === '7' ? [0, 4, 7, 10] : q === 'dim' ? [0, 3, 6] : q === 'sus' ? [0, 5, 7] : [0, 4, 7];
  return { root, iv };
}

// ---------- composiciones originales ----------
const SONGS = {
  title: { bpm: 112, chords: 'C G Am F C G F G', style: { bass: 'walk', arp: 'fast', drums: 'pop', duty: 0.5 },
    mel: 'G4:4 C5:4 E5:4 G5:4 | F5:6 E5:2 D5:4 B4:4 | C5:4 E5:4 A5:6 G5:2 | F5:4 E5:2 D5:2 C5:8 | E5:4 G5:4 C6:6 B5:2 | A5:4 G5:4 D5:8 | F5:4 A5:4 G5:2 F5:2 E5:2 D5:2 | D5:4 E5:2 F5:2 G5:8' },
  town: { bpm: 96, chords: 'F C Dm Bb F C Bb C', style: { bass: 'soft', arp: 'slow', drums: 'soft', duty: 0.25 },
    mel: 'A4:2 C5:2 F5:4 E5:2 D5:2 C5:4 | G4:2 C5:2 E5:4 D5:2 C5:2 G4:4 | F4:2 A4:2 D5:4 C5:2 A4:2 F4:4 | Bb4:4 A4:2 G4:2 F4:8 | A4:2 C5:2 F5:4 G5:2 A5:2 F5:4 | E5:4 G5:2 E5:2 C5:8 | D5:2 F5:2 Bb5:4 A5:2 G5:2 F5:4 | G5:4 F5:2 E5:2 C5:8' },
  route: { bpm: 132, chords: 'G D Em C G D C D Em C G D C D G G', style: { bass: 'drive', arp: 'fast', drums: 'pop', duty: 0.5 },
    mel: 'D5:2 G5:2 B5:2 G5:2 A5:2 B5:2 D6:4 | C6:2 B5:2 A5:2 F#5:2 D5:4 .:2 D5:2 | E5:2 G5:2 B5:2 E6:2 D6:2 B5:2 G5:4 | A5:4 G5:2 E5:2 C5:4 E5:4 | D5:2 G5:2 B5:2 G5:2 A5:2 B5:2 G5:4 | F#5:2 A5:2 D6:4 C6:2 A5:2 F#5:4 | E5:2 G5:2 C6:2 B5:2 A5:2 G5:2 E5:4 | F#5:4 A5:2 F#5:2 D5:8 | G5:4 E5:2 G5:2 B5:4 A5:2 G5:2 | E5:4 C5:2 E5:2 G5:4 F#5:2 E5:2 | D5:4 B4:2 D5:2 G5:4 A5:2 B5:2 | A5:8 F#5:4 D5:4 | E5:2 F#5:2 G5:4 E5:2 F#5:2 G5:4 | A5:2 B5:2 C6:4 B5:2 A5:2 F#5:4 | G5:4 B5:4 D6:4 B5:4 | G5:8 .:4 D5:4' },
  city: { bpm: 116, chords: 'D A Bm G D A G A', style: { bass: 'walk', arp: 'fast', drums: 'pop', duty: 0.25 },
    mel: 'F#5:2 A5:2 F#5:2 D5:2 E5:2 F#5:2 A5:4 | E5:2 C#5:2 A4:4 B4:2 C#5:2 E5:4 | D5:2 F#5:2 B5:4 A5:2 F#5:2 D5:4 | G5:4 F#5:2 E5:2 D5:4 B4:4 | F#5:2 A5:2 D6:4 C#6:2 B5:2 A5:4 | G5:2 E5:2 C#5:4 E5:2 G5:2 A5:4 | B5:4 A5:2 G5:2 F#5:2 E5:2 D5:4 | E5:4 F#5:2 G5:2 A5:8' },
  cave: { bpm: 84, chords: 'Am F G Em Am F E E', style: { bass: 'soft', arp: 'slow', drums: 'none', duty: 0.125, lead: 'triangle' },
    mel: 'A4:4 C5:4 E5:4 D5:4 | C5:6 A4:2 F4:8 | G4:4 B4:4 D5:4 C5:2 B4:2 | G4:8 E4:8 | A4:2 B4:2 C5:4 E5:4 A5:4 | F5:6 E5:2 C5:8 | B4:4 G#4:4 E4:4 B4:4 | G#4:8 E4:8' },
  forest: { bpm: 100, chords: 'Em C D Bm Em C Am B', style: { bass: 'soft', arp: 'fast', drums: 'soft', duty: 0.125 },
    mel: 'B4:2 E5:2 G5:2 B5:2 A5:4 G5:4 | E5:2 G5:2 C6:4 B5:2 G5:2 E5:4 | F#5:4 A5:4 D6:4 C6:2 A5:2 | B5:8 F#5:8 | G5:2 B5:2 E6:4 D6:2 B5:2 G5:4 | E5:4 G5:2 E5:2 C5:8 | A4:2 C5:2 E5:4 A5:4 C6:4 | B5:4 A5:2 G5:2 F#5:8' },
  center: { bpm: 100, chords: 'C Am Dm G C Am Dm G', style: { bass: 'soft', arp: 'slow', drums: 'soft', duty: 0.25 },
    mel: 'E5:2 G5:2 C6:4 B5:2 G5:2 E5:4 | A5:4 E5:2 C5:2 A4:8 | F5:2 A5:2 D5:4 F5:2 E5:2 D5:4 | B4:4 D5:2 F5:2 G5:8 | E5:2 G5:2 C6:4 D6:2 C6:2 B5:4 | A5:2 C6:2 E5:4 A5:4 G5:4 | F5:4 E5:2 D5:2 A5:4 F5:4 | D5:4 B4:4 C5:8' },
  battle: { bpm: 160, chords: 'Em C D B Em C D B', style: { bass: 'drive', arp: 'fast', drums: 'battle', duty: 0.5 },
    mel: 'E5:2 E5:2 G5:2 E5:2 B5:4 A5:2 G5:2 | E5:2 G5:2 C6:4 B5:2 G5:2 E5:4 | F#5:2 A5:2 D6:4 C6:2 A5:2 F#5:4 | D#5:4 F#5:4 B5:4 A5:4 | G5:2 F#5:2 E5:2 G5:2 B5:2 G5:2 E6:4 | C6:2 B5:2 A5:2 G5:2 E5:4 G5:4 | A5:2 B5:2 C6:2 A5:2 F#5:4 D5:4 | B4:2 D#5:2 F#5:2 A5:2 B5:4 .:4' },
  trainer: { bpm: 168, chords: 'Dm Bb C A Dm Bb Gm A', style: { bass: 'drive', arp: 'fast', drums: 'battle', duty: 0.25 },
    mel: 'D5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:4 | D5:2 F5:2 Bb5:4 A5:2 F5:2 D5:4 | E5:2 G5:2 C6:4 Bb5:2 G5:2 E5:4 | C#5:4 E5:4 A5:4 G5:2 E5:2 | F5:4 D5:2 F5:2 A5:4 D6:4 | D6:2 C6:2 Bb5:2 A5:2 F5:4 D5:4 | G5:2 Bb5:2 D6:4 C6:2 Bb5:2 G5:4 | A5:2 G5:2 F5:2 E5:2 C#5:4 A4:4' },
  boss: { bpm: 172, chords: 'Cm Ab Bb G Cm Ab Fm G', style: { bass: 'drive', arp: 'fast', drums: 'battle', duty: 0.5 },
    mel: 'C5:2 Eb5:2 G5:2 C6:4 G5:2 Eb5:2 C5:2 | Ab5:4 G5:2 F5:2 Eb5:4 C5:4 | Bb4:2 D5:2 F5:2 Bb5:4 F5:2 D5:2 Bb4:2 | B4:4 D5:4 G5:4 F5:2 D5:2 | C6:4 Bb5:2 G5:2 Eb5:4 G5:4 | Ab5:2 C6:2 Eb6:4 D6:2 C6:2 Ab5:4 | F5:2 Ab5:2 C6:4 Bb5:2 Ab5:2 F5:4 | G5:4 B5:4 D6:4 .:4' },
  victory: { bpm: 132, chords: 'C F G C Am F G C', style: { bass: 'walk', arp: 'fast', drums: 'pop', duty: 0.5 },
    mel: 'C5:2 E5:2 G5:2 C6:6 G5:4 | A5:2 C6:2 A5:2 F5:6 C5:4 | B5:2 D6:2 B5:2 G5:6 D5:4 | C6:8 G5:4 E5:4 | A5:2 C6:2 E6:4 C6:4 A5:4 | F5:2 A5:2 C6:4 A5:4 F5:4 | G5:2 B5:2 D6:4 B5:2 G5:2 D5:4 | C6:12 .:4' },
  eclipse: { bpm: 140, chords: 'Am Am F E Am Am Dm E', style: { bass: 'drive', arp: 'none', drums: 'battle', duty: 0.125 },
    mel: 'A4:2 .:2 A4:2 C5:2 E5:4 D#5:4 | E5:2 .:2 E5:2 G5:2 A5:4 G5:4 | F5:2 E5:2 D5:2 C5:2 A4:4 F4:4 | E4:4 G#4:4 B4:4 D5:4 | A5:2 .:2 A5:2 G5:2 E5:4 C5:4 | D5:2 E5:2 C5:2 B4:2 A4:8 | D5:2 F5:2 A5:4 G5:2 F5:2 D5:4 | B4:4 G#4:4 E4:8' },
  ending: { bpm: 92, chords: 'F G Em Am Dm G C C', style: { bass: 'soft', arp: 'slow', drums: 'soft', duty: 0.25 },
    mel: 'A5:4 G5:2 F5:2 E5:4 C5:4 | D5:4 E5:2 F5:2 G5:8 | G5:4 F5:2 E5:2 B4:4 E5:4 | C5:4 E5:4 A5:8 | F5:4 E5:2 D5:2 A5:4 F5:4 | D5:4 G5:4 B5:8 | C6:8 G5:4 E5:4 | C5:16' },
};
const JINGLES = {
  heal: { bpm: 140, mel: 'C5:2 E5:2 G5:2 C6:4 G5:2 E5:2 G5:2 C6:8', bass: 'C3:8 G3:8 C3:12' },
  levelup: { bpm: 180, mel: 'C5:2 E5:2 G5:2 C6:2 E6:6', bass: 'C3:4 G3:4 C4:6' },
  catch: { bpm: 150, mel: 'G5:2 G5:2 G5:2 C6:6 B5:2 C6:2 D6:2 E6:8', bass: 'C3:8 G3:6 C3:12' },
  badge: { bpm: 140, mel: 'C5:2 C5:2 C5:2 G5:6 F5:2 E5:2 F5:2 G5:4 C6:8 E6:8', bass: 'C3:8 F3:8 G3:8 C3:12' },
  evolve: { bpm: 120, mel: 'C5:2 E5:2 G5:2 C6:2 D6:2 E6:2 G6:8 E6:4 C6:8', bass: 'C3:8 A2:8 F2:4 G2:4 C3:8' },
  item: { bpm: 160, mel: 'E5:2 G5:2 C6:2 E6:6', bass: 'C3:6 C4:6' },
  fanfare: { bpm: 130, mel: 'G4:2 C5:2 E5:2 G5:4 E5:2 G5:8 A5:2 B5:2 C6:12', bass: 'C3:8 C3:8 F3:4 G3:4 C3:12' },
};

function parseLine(str) {
  const ev = []; let step = 0;
  for (const tok of str.replace(/\|/g, ' ').split(/\s+/).filter(Boolean)) {
    const [n, l] = tok.split(':');
    const len = l ? parseInt(l, 10) : 2;
    if (n !== '.') ev.push({ step, len, midi: noteMidi(n) });
    step += len;
  }
  return { ev, len: step };
}

function buildSong(def) {
  const chords = def.chords.split(' ');
  const bars = chords.length, total = bars * 16;
  const st = def.style;
  const events = []; // {step, ch, midi, len, drum}
  const mel = parseLine(def.mel);
  if (mel.len !== total) console.warn('Canción con longitud desigual', def, mel.len, total);
  for (const e of mel.ev) events.push({ step: e.step, ch: 'lead', midi: e.midi, len: e.len });
  chords.forEach((c, bar) => {
    const { root, iv } = chordTones(c);
    const b0 = bar * 16;
    const bassRoot = 36 + root + (root > 6 ? -12 : 0) + 12; // C3..F#3 aprox
    if (st.bass === 'drive') for (let i = 0; i < 8; i++) events.push({ step: b0 + i * 2, ch: 'bass', midi: bassRoot + (i % 2 ? 12 : 0) - 12, len: 2 });
    else if (st.bass === 'walk') [0, 7, 12, 7].forEach((o, i) => events.push({ step: b0 + i * 4, ch: 'bass', midi: bassRoot - 12 + o, len: 4 }));
    else events.push({ step: b0, ch: 'bass', midi: bassRoot - 12, len: 8 }, { step: b0 + 8, ch: 'bass', midi: bassRoot - 12 + 7, len: 8 });
    if (st.arp === 'fast' || st.arp === 'slow') {
      const notes = iv.concat([12]).map((x) => 60 + root + x);
      const stepL = st.arp === 'fast' ? 1 : 2;
      for (let i = 0; i < 16 / stepL; i++) events.push({ step: b0 + i * stepL, ch: 'arp', midi: notes[i % notes.length], len: stepL });
    }
    for (let s = 0; s < 16; s++) {
      let d = null;
      if (st.drums === 'battle') d = s % 8 === 0 ? 'k' : s % 8 === 4 ? 's' : s % 2 === 0 ? 'h' : null;
      else if (st.drums === 'pop') d = s === 0 || s === 6 || s === 10 ? 'k' : s === 4 || s === 12 ? 's' : s % 2 === 1 ? 'h' : null;
      else if (st.drums === 'soft') d = s === 0 ? 'k' : s % 4 === 2 ? 'h' : null;
      if (d) events.push({ step: b0 + s, ch: 'drum', drum: d });
    }
  });
  const byStep = Array.from({ length: total }, () => []);
  for (const e of events) byStep[e.step % total].push(e);
  return { stepDur: 60 / def.bpm / 4, total, byStep, style: st, loop: true };
}

function buildJingle(def) {
  const mel = parseLine(def.mel), bass = parseLine(def.bass || '');
  const total = Math.max(mel.len, bass.len);
  const byStep = Array.from({ length: total + 1 }, () => []);
  for (const e of mel.ev) byStep[e.step].push({ ch: 'lead', midi: e.midi, len: e.len });
  for (const e of bass.ev) byStep[e.step].push({ ch: 'bass', midi: e.midi, len: e.len });
  return { stepDur: 60 / def.bpm / 4, total, byStep, style: { duty: 0.5 }, loop: false };
}

const Sound = {
  ctx: null, master: null, musicGain: null, sfxGain: null,
  waves: {}, noiseBuf: null, built: {},
  musicVol: 0.55, sfxVol: 0.7,
  current: null, currentName: null, wanted: null, step: 0, nextTime: 0, timer: null, jingleRes: null, resumeAfter: null,
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.musicVol; this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = this.sfxVol; this.sfxGain.connect(this.master);
      for (const d of [0.125, 0.25, 0.5]) {
        const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
        for (let k = 1; k < n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d);
        this.waves[d] = this.ctx.createPeriodicWave(real, imag);
      }
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.timer = setInterval(() => this.schedule(), 25);
      if (this.wanted) { const w = this.wanted; this.wanted = null; this.music(w, true); }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  setVolumes(m, s) {
    this.musicVol = m; this.sfxVol = s;
    if (this.musicGain) { this.musicGain.gain.value = m; this.sfxGain.gain.value = s; }
  },
  osc(type, freq, t, dur, vol, dest, duty) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    if (type === 'square') o.setPeriodicWave(this.waves[duty || 0.5]); else o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.linearRampToValueAtTime(vol * 0.7, t + Math.min(dur * 0.5, 0.12));
    g.gain.setValueAtTime(vol * 0.7, t + Math.max(0.01, dur - 0.03));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  },
  noise(t, dur, vol, dest, filt = 'highpass', freq = 6000) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = filt; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  drum(kind, t) {
    const d = this.musicGain;
    if (kind === 'k') {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); g.connect(d); o.start(t); o.stop(t + 0.16);
    } else if (kind === 's') this.noise(t, 0.12, 0.22, d, 'bandpass', 1800);
    else this.noise(t, 0.035, 0.08, d, 'highpass', 7000);
  },
  music(name, force) {
    if (!force && this.currentName === name && (this.current || this.resumeAfter)) return;
    this.currentName = name;
    if (!this.ctx) { this.wanted = name; return; }
    if (this.jingleRes) { this.resumeAfter = name; return; }
    if (!name) { this.current = null; return; }
    if (!this.built[name]) this.built[name] = buildSong(SONGS[name]);
    this.current = this.built[name]; this.step = 0; this.nextTime = this.ctx.currentTime + 0.06;
  },
  stopMusic() { this.current = null; this.currentName = null; },
  jingle(name) {
    return new Promise((res) => {
      const j = buildJingle(JINGLES[name]);
      const dur = j.total * j.stepDur;
      if (!this.ctx || this.ctx.state !== 'running') { Timers.wait(Math.min(dur, 1.2)).then(res); return; }
      if (this.jingleRes) this.jingleRes();
      this.resumeAfter = this.currentName;
      this.current = j; this.step = 0; this.nextTime = this.ctx.currentTime + 0.05;
      let finished = false;
      // respaldo: si el audio se detiene, el juego no debe quedarse esperando
      const fin = () => {
        if (finished) return;
        finished = true;
        if (this.jingleRes === fin) this.jingleRes = null;
        const r = this.resumeAfter; this.resumeAfter = null;
        this.currentName = null;
        if (r) this.music(r, true); else this.current = null;
        res();
      };
      this.jingleRes = fin;
      Timers.wait(dur + 0.3).then(fin);
    });
  },
  schedule() {
    if (!this.ctx || !this.current) return;
    const song = this.current, ahead = this.ctx.currentTime + 0.12;
    while (this.nextTime < ahead) {
      if (this.step >= song.total) {
        if (song.loop) this.step = 0;
        else { if (this.jingleRes) this.jingleRes(); return; }
      }
      const t = this.nextTime;
      for (const e of song.byStep[this.step] || []) {
        const dur = e.len * song.stepDur;
        if (e.ch === 'lead') {
          if (song.style.lead === 'triangle') this.osc('triangle', midiFreq(e.midi), t, dur * 0.95, 0.22, this.musicGain);
          else this.osc('square', midiFreq(e.midi), t, dur * 0.9, 0.11, this.musicGain, song.style.duty);
        } else if (e.ch === 'bass') this.osc('triangle', midiFreq(e.midi), t, dur * 0.85, 0.26, this.musicGain);
        else if (e.ch === 'arp') this.osc('square', midiFreq(e.midi), t, dur * 0.7, 0.035, this.musicGain, 0.125);
        else if (e.ch === 'drum') this.drum(e.drum, t);
      }
      this.nextTime += song.stepDur;
      this.step++;
    }
  },
  // ---------- sonido ambiente en bucle ----------
  ambient(name) {
    if (!this.ctx || name === this.ambName) return;
    if (this.ambNode) { const n = this.ambNode, g = this.ambGain; g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); setTimeout(() => { try { n.stop(); } catch (e) { /* ya parado */ } }, 1500); this.ambNode = null; }
    this.ambName = name;
    if (name !== 'rain') return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
    const g = this.ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.09, this.ctx.currentTime, 0.6);
    s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start();
    this.ambNode = s; this.ambGain = g;
  },
  // ---------- efectos ----------
  sfx(name, opt = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, d = this.sfxGain;
    const sweep = (type, f0, f1, dur, vol, duty) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      if (type === 'square') o.setPeriodicWave(this.waves[duty || 0.5]); else o.type = type;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(d); o.start(t); o.stop(t + dur + 0.02);
    };
    switch (name) {
      case 'blip': this.osc('square', 1200, t, 0.04, 0.12, d, 0.25); break;
      case 'select': this.osc('square', 880, t, 0.05, 0.14, d, 0.5); this.osc('square', 1320, t + 0.05, 0.07, 0.14, d, 0.5); break;
      case 'cancel': this.osc('square', 660, t, 0.05, 0.12, d, 0.5); this.osc('square', 440, t + 0.05, 0.07, 0.12, d, 0.5); break;
      case 'bump': this.osc('square', 90, t, 0.08, 0.2, d, 0.5); break;
      case 'door': this.noise(t, 0.25, 0.25, d, 'lowpass', 900); sweep('square', 300, 120, 0.2, 0.1); break;
      case 'jump': sweep('square', 300, 900, 0.15, 0.12, 0.25); break;
      case 'text': this.osc('square', 1500, t, 0.015, 0.05, d, 0.5); break;
      case 'hit': this.noise(t, 0.12, 0.4, d, 'lowpass', 2500); sweep('square', 220, 60, 0.1, 0.18); break;
      case 'crit': this.noise(t, 0.2, 0.5, d, 'lowpass', 4000); sweep('square', 600, 80, 0.18, 0.2); break;
      case 'weak': this.noise(t, 0.08, 0.2, d, 'lowpass', 1200); break;
      case 'hurt': sweep('square', 500, 100, 0.2, 0.18, 0.25); break;
      case 'dodge': this.noise(t, 0.16, 0.18, d, 'bandpass', 3000); break;
      case 'swing': this.noise(t, 0.1, 0.18, d, 'bandpass', 2200); break;
      case 'shoot': sweep('square', 900, 300, 0.12, 0.1, 0.25); break;
      case 'fire': this.noise(t, 0.3, 0.3, d, 'bandpass', 900); sweep('sawtooth', 200, 80, 0.25, 0.06); break;
      case 'water': for (let i = 0; i < 4; i++) this.osc('sine', 500 + Math.random() * 600, t + i * 0.04, 0.05, 0.15, d); break;
      case 'zap': for (let i = 0; i < 5; i++) this.osc('square', 1600 + Math.random() * 1600, t + i * 0.025, 0.02, 0.1, d, 0.125); break;
      case 'leaf': this.noise(t, 0.2, 0.2, d, 'highpass', 4000); break;
      case 'rock': this.noise(t, 0.3, 0.45, d, 'lowpass', 600); sweep('triangle', 120, 40, 0.3, 0.3); break;
      case 'wind': this.noise(t, 0.4, 0.2, d, 'bandpass', 1400); break;
      case 'mind': sweep('sine', 300, 1200, 0.3, 0.15); sweep('sine', 310, 1220, 0.3, 0.1); break;
      case 'shadow': sweep('sawtooth', 400, 60, 0.35, 0.08); break;
      case 'buff': sweep('square', 400, 1200, 0.25, 0.1, 0.125); break;
      case 'heal': for (let i = 0; i < 4; i++) this.osc('square', 700 + i * 200, t + i * 0.06, 0.08, 0.08, d, 0.25); break;
      case 'charge': sweep('square', 200, 800, 0.4, 0.06, 0.125); break;
      case 'faint': sweep('square', 800, 60, 0.7, 0.16, 0.5); break;
      case 'throw': sweep('square', 300, 1200, 0.2, 0.1, 0.25); break;
      case 'shake': this.osc('square', 200, t, 0.06, 0.15, d, 0.5); this.noise(t, 0.06, 0.12, d, 'lowpass', 800); break;
      case 'poof': this.noise(t, 0.25, 0.3, d, 'bandpass', 1500); break;
      case 'appear': sweep('square', 200, 1000, 0.15, 0.1, 0.5); break;
      case 'super': [0, 4, 7, 12].forEach((s, i) => this.osc('square', 523 * Math.pow(2, s / 12), t + i * 0.04, 0.06, 0.1, d, 0.25)); break;
      case 'exp': sweep('square', 500, 1500, 0.08, 0.05, 0.5); break;
      case 'grass': this.noise(t, 0.08, 0.1, d, 'highpass', 3000); break;
      case 'alert': this.osc('square', 1046, t, 0.08, 0.14, d, 0.5); this.osc('square', 1396, t + 0.08, 0.15, 0.14, d, 0.5); break;
      case 'save': [0, 4, 7, 11, 12].forEach((s, i) => this.osc('square', 660 * Math.pow(2, s / 12), t + i * 0.06, 0.08, 0.09, d, 0.25)); break;
      case 'buy': this.osc('square', 1318, t, 0.06, 0.12, d, 0.25); this.osc('square', 1760, t + 0.07, 0.12, 0.12, d, 0.25); break;
      default: break;
    }
  },
};

// Web Audio API Sound Engine & General MIDI Instrument Synthesizer
// Accurately synthesizes GM sound standards, dynamic velocity curves, and precision clock

// Standard General MIDI Instrument definitions
const GM_INSTRUMENTS = [
  { id: 'gm_0_grand_piano',      gmProgram: 0,  category: 'Piano',       name: '001. Acoustic Grand Piano', icon: '🎹' },
  { id: 'gm_1_bright_piano',     gmProgram: 1,  category: 'Piano',       name: '002. Bright Acoustic Piano', icon: '🎹' },
  { id: 'gm_4_electric_piano_1', gmProgram: 4,  category: 'E-Piano',     name: '005. Electric Piano 1 (Rhodes)', icon: '✨' },
  { id: 'gm_5_electric_piano_2', gmProgram: 5,  category: 'E-Piano',     name: '006. Electric Piano 2 (DX7 FM)', icon: '⚡' },
  { id: 'gm_11_vibraphone',      gmProgram: 11, category: 'Chromatic',   name: '012. Vibraphone', icon: '🔔' },
  { id: 'gm_16_drawbar_organ',   gmProgram: 16, category: 'Organ',       name: '017. Drawbar Organ (Hammond)', icon: '📻' },
  { id: 'gm_19_church_organ',    gmProgram: 19, category: 'Organ',       name: '020. Church Pipe Organ', icon: '⛪' },
  { id: 'gm_24_nylon_guitar',    gmProgram: 24, category: 'Guitar',      name: '025. Acoustic Guitar (Nylon)', icon: '🎸' },
  { id: 'gm_25_steel_guitar',    gmProgram: 25, category: 'Guitar',      name: '026. Acoustic Guitar (Steel)', icon: '🎸' },
  { id: 'gm_27_clean_guitar',    gmProgram: 27, category: 'Guitar',      name: '028. Electric Guitar (Clean)', icon: '🎸' },
  { id: 'gm_32_acoustic_bass',   gmProgram: 32, category: 'Bass',        name: '033. Acoustic Upright Bass', icon: '🎻' },
  { id: 'gm_40_violin',          gmProgram: 40, category: 'Strings',     name: '041. Solo Strings / Violin', icon: '🎻' },
  { id: 'gm_48_string_ensemble', gmProgram: 48, category: 'Ensemble',    name: '049. String Ensemble 1', icon: '🎻' },
  { id: 'gm_56_trumpet',         gmProgram: 56, category: 'Brass',       name: '057. Trumpet / Brass Section', icon: '🎺' },
  { id: 'gm_73_flute',           gmProgram: 73, category: 'Pipe',        name: '074. Flute / Woodwind', icon: '🪈' },
  { id: 'gm_88_warm_pad',        gmProgram: 88, category: 'Synth Pad',   name: '089. Warm Synth Pad', icon: '🌌' }
];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.metronomeGain = null;
    this.reverbNode = null;
    this.reverbGain = null;
    this.compressor = null;
    this.instrument = 'gm_0_grand_piano';
    this.volume = 0.8;
    this.metronomeVolume = 0.7;
    this.strumStyle = 'gentle'; // 'none', 'gentle', 'arpeggio'
    this.defaultVelocity = 90; // Default MIDI velocity (0-127)
    this.isMuted = false;
  }

  // Lazy initialize AudioContext on first user interaction
  async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Compressor
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(5, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);
    this.compressor.connect(this.ctx.destination);

    // Master Volume Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.compressor);

    // Metronome Gain (direct clean routing)
    this.metronomeGain = this.ctx.createGain();
    this.metronomeGain.gain.setValueAtTime(this.metronomeVolume, this.ctx.currentTime);
    this.metronomeGain.connect(this.compressor);

    // Studio Hall Reverb
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.buildImpulseResponse(2.2, 2.4);

    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  buildImpulseResponse(duration = 2.0, decay = 2.4) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const env = Math.pow(1 - i / length, decay);
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }
    return impulse;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  setMetronomeVolume(val) {
    this.metronomeVolume = Math.max(0, Math.min(1, val));
    if (this.metronomeGain && this.ctx) {
      this.metronomeGain.gain.setTargetAtTime(this.metronomeVolume, this.ctx.currentTime, 0.02);
    }
  }

  setInstrument(type) {
    this.instrument = type;
  }

  setStrumStyle(style) {
    this.strumStyle = style;
  }

  // Play a note using General MIDI synthesis with dynamic Velocity scaling
  playNote(midi, startTime, duration = 1.8, velocity = 90) {
    if (!this.ctx || this.isMuted) return;

    // Normalize velocity 1..127 to 0..1 scale
    const normVel = Math.max(0.1, Math.min(1.0, velocity / 127.0));
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const isBass = midi < 48;

    switch (this.instrument) {
      case 'gm_1_bright_piano':
        this.synthPiano(freq, startTime, duration, normVel, isBass, true);
        break;
      case 'gm_4_electric_piano_1':
        this.synthRhodes(freq, startTime, duration, normVel, isBass);
        break;
      case 'gm_5_electric_piano_2':
        this.synthDX7(freq, startTime, duration, normVel, isBass);
        break;
      case 'gm_11_vibraphone':
        this.synthVibraphone(freq, startTime, duration, normVel);
        break;
      case 'gm_16_drawbar_organ':
        this.synthDrawbarOrgan(freq, startTime, duration, normVel);
        break;
      case 'gm_19_church_organ':
        this.synthChurchOrgan(freq, startTime, duration, normVel);
        break;
      case 'gm_24_nylon_guitar':
        this.synthAcousticGuitar(freq, startTime, duration, normVel, isBass, false);
        break;
      case 'gm_25_steel_guitar':
        this.synthAcousticGuitar(freq, startTime, duration, normVel, isBass, true);
        break;
      case 'gm_27_clean_guitar':
        this.synthCleanElectricGuitar(freq, startTime, duration, normVel, isBass);
        break;
      case 'gm_32_acoustic_bass':
        this.synthAcousticBass(freq, startTime, duration, normVel);
        break;
      case 'gm_40_violin':
        this.synthViolin(freq, startTime, duration, normVel);
        break;
      case 'gm_48_string_ensemble':
        this.synthStringEnsemble(freq, startTime, duration, normVel);
        break;
      case 'gm_56_trumpet':
        this.synthTrumpet(freq, startTime, duration, normVel);
        break;
      case 'gm_73_flute':
        this.synthFlute(freq, startTime, duration, normVel);
        break;
      case 'gm_88_warm_pad':
        this.synthWarmPad(freq, startTime, duration, normVel, isBass);
        break;
      case 'gm_0_grand_piano':
      default:
        this.synthPiano(freq, startTime, duration, normVel, isBass, false);
        break;
    }
  }

  // GM 0 / GM 1: Acoustic Grand Piano & Bright Piano
  synthPiano(freq, startTime, duration, vel, isBass, isBright = false) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    // Dynamic filter response to Velocity: higher velocity = much brighter acoustic overtone
    const baseCutoff = isBright ? 5200 : 3800;
    const filterStart = baseCutoff * (0.35 + vel * 0.75);
    filter.frequency.setValueAtTime(filterStart, startTime);
    filter.frequency.exponentialRampToValueAtTime(350, startTime + duration);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.type = isBright ? 'sawtooth' : 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    osc2.detune.setValueAtTime(3.5, startTime);

    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq * 3, startTime);
    osc3.detune.setValueAtTime(-4, startTime);

    const m1 = this.ctx.createGain();
    const m2 = this.ctx.createGain();
    const m3 = this.ctx.createGain();

    m1.gain.setValueAtTime(isBright ? 0.45 : 0.65, startTime);
    m2.gain.setValueAtTime(0.3, startTime);
    m3.gain.setValueAtTime(0.15, startTime);

    osc1.connect(m1); osc2.connect(m2); osc3.connect(m3);
    m1.connect(filter); m2.connect(filter); m3.connect(filter);
    filter.connect(gainNode);

    const peakGain = (isBass ? 0.42 : 0.3) * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.45, startTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime); osc2.start(startTime); osc3.start(startTime);
    const stopTime = startTime + duration + 0.05;
    osc1.stop(stopTime); osc2.stop(stopTime); osc3.stop(stopTime);
  }

  // GM 4: Electric Piano 1 (Rhodes)
  synthRhodes(freq, startTime, duration, vel, isBass) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200 + vel * 2000, startTime);
    filter.frequency.exponentialRampToValueAtTime(600, startTime + duration);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    const tine = this.ctx.createOscillator();
    tine.type = 'sine';
    tine.frequency.setValueAtTime(freq * 6.5, startTime);

    const tineGain = this.ctx.createGain();
    tineGain.gain.setValueAtTime(0.2 * vel, startTime);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

    osc1.connect(filter);
    osc2.connect(filter);
    tine.connect(tineGain);
    tineGain.connect(gainNode);
    filter.connect(gainNode);

    const peakGain = (isBass ? 0.38 : 0.26) * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.018);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.5, startTime + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime); osc2.start(startTime); tine.start(startTime);
    const stopTime = startTime + duration + 0.05;
    osc1.stop(stopTime); osc2.stop(stopTime); tine.stop(stopTime);
  }

  // GM 5: Electric Piano 2 (FM DX7 Sparkle)
  synthDX7(freq, startTime, duration, vel, isBass) {
    const gainNode = this.ctx.createGain();
    // 2-operator FM synth
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(freq, startTime);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(freq * 14, startTime); // High harmonic FM ratio

    // Mod index scales with velocity (harder = more glassy bell sparkle)
    const modIndex = freq * (1.2 + vel * 2.5);
    modGain.gain.setValueAtTime(modIndex, startTime);
    modGain.gain.exponentialRampToValueAtTime(freq * 0.1, startTime + 0.25);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const peakGain = 0.28 * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.4, startTime + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    carrier.connect(gainNode);
    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    carrier.start(startTime); modulator.start(startTime);
    const stopTime = startTime + duration + 0.05;
    carrier.stop(stopTime); modulator.stop(stopTime);
  }

  // GM 11: Vibraphone
  synthVibraphone(freq, startTime, duration, vel) {
    const gainNode = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator(); // Motor tremolo
    const lfoGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 4, startTime);

    // Motor tremolo at 4.5 Hz
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4.5, startTime);
    lfoGain.gain.setValueAtTime(0.15, startTime);
    lfo.connect(lfoGain.gain);

    const otGain = this.ctx.createGain();
    otGain.gain.setValueAtTime(0.25 * vel, startTime);
    otGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);

    const peakGain = 0.3 * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    overtone.connect(otGain);
    otGain.connect(gainNode);
    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc.start(startTime); overtone.start(startTime); lfo.start(startTime);
    const stopTime = startTime + duration + 0.05;
    osc.stop(stopTime); overtone.stop(stopTime); lfo.stop(stopTime);
  }

  // GM 16: Drawbar Organ (Hammond B3 Drawbars)
  synthDrawbarOrgan(freq, startTime, duration, vel) {
    const gainNode = this.ctx.createGain();
    // 4 Drawbars: 8' (1x), 4' (2x), 2-2/3' (3x), 2' (4x)
    const partials = [1, 2, 3, 4];
    const partialGains = [0.4, 0.3, 0.2, 0.15];
    const oscs = [];

    partials.forEach((mult, idx) => {
      const osc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * mult, startTime);
      pGain.gain.setValueAtTime(partialGains[idx], startTime);
      osc.connect(pGain);
      pGain.connect(gainNode);
      osc.start(startTime);
      oscs.push(osc);
    });

    const peakGain = 0.28 * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
    gainNode.gain.setValueAtTime(peakGain * 0.9, startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    const stopTime = startTime + duration + 0.05;
    oscs.forEach(osc => osc.stop(stopTime));
  }

  // GM 19: Church Pipe Organ
  synthChurchOrgan(freq, startTime, duration, vel) {
    const gainNode = this.ctx.createGain();
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.type = 'triangle'; osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = 'sine'; osc2.frequency.setValueAtTime(freq * 2, startTime);
    osc3.type = 'triangle'; osc3.frequency.setValueAtTime(freq * 4, startTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, startTime);

    osc1.connect(filter); osc2.connect(filter); osc3.connect(filter);
    filter.connect(gainNode);

    const peakGain = 0.26 * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.05);
    gainNode.gain.setValueAtTime(peakGain, startTime + duration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration + 0.2);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime); osc2.start(startTime); osc3.start(startTime);
    const stopTime = startTime + duration + 0.3;
    osc1.stop(stopTime); osc2.stop(stopTime); osc3.stop(stopTime);
  }

  // GM 24 & GM 25: Acoustic Guitar (Nylon & Steel)
  synthAcousticGuitar(freq, startTime, duration, vel, isBass, isSteel = false) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = isSteel ? 'bandpass' : 'lowpass';
    const baseFreq = isSteel ? freq * 2.2 : 2400;
    filter.frequency.setValueAtTime(baseFreq * (0.6 + vel * 0.7), startTime);
    filter.Q.setValueAtTime(isSteel ? 2.5 : 1.2, startTime);

    const osc1 = this.ctx.createOscillator();
    osc1.type = isSteel ? 'sawtooth' : 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    osc1.connect(filter); osc2.connect(filter);
    filter.connect(gainNode);

    const peakGain = (isBass ? 0.4 : 0.28) * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.3, startTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime); osc2.start(startTime);
    const stopTime = startTime + duration + 0.05;
    osc1.stop(stopTime); osc2.stop(stopTime);
  }

  // GM 27: Clean Electric Guitar
  synthCleanElectricGuitar(freq, startTime, duration, vel, isBass) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, startTime);
    filter.Q.setValueAtTime(1.5, startTime);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle'; osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(4, startTime);

    const m1 = this.ctx.createGain(); m1.gain.setValueAtTime(0.7, startTime);
    const m2 = this.ctx.createGain(); m2.gain.setValueAtTime(0.3, startTime);
    osc1.connect(m1); osc2.connect(m2);
    m1.connect(filter); m2.connect(filter);
    filter.connect(gainNode);

    const peakGain = 0.3 * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.4, startTime + 0.35);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime); osc2.start(startTime);
    const stopTime = startTime + duration + 0.05;
    osc1.stop(stopTime); osc2.stop(stopTime);
  }

  // GM 32: Acoustic Upright Bass
  synthAcousticBass(freq, startTime, duration, vel) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450 + vel * 600, startTime);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq * 0.5, startTime);

    osc.connect(filter); sub.connect(filter);
    filter.connect(gainNode);

    const peakGain = 0.5 * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.3, startTime + 0.35);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);

    osc.start(startTime); sub.start(startTime);
    const stopTime = startTime + duration + 0.05;
    osc.stop(stopTime); sub.stop(stopTime);
  }

  // GM 40: Solo Violin / Strings
  synthViolin(freq, startTime, duration, vel) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200 + vel * 1800, startTime);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    // Vibrato LFO at 5.5 Hz after slight delay
    const vibrato = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.5, startTime);
    vibGain.gain.setValueAtTime(0.0, startTime);
    vibGain.gain.linearRampToValueAtTime(4.0, startTime + 0.35);
    vibrato.connect(vibGain);
    vibGain.connect(osc.frequency);

    osc.connect(filter);
    filter.connect(gainNode);

    const peakGain = 0.28 * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.08); // Bow bite attack
    gainNode.gain.setValueAtTime(peakGain * 0.85, startTime + duration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc.start(startTime); vibrato.start(startTime);
    const stopTime = startTime + duration + 0.05;
    osc.stop(stopTime); vibrato.stop(stopTime);
  }

  // GM 48: String Ensemble
  synthStringEnsemble(freq, startTime, duration, vel) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600 + vel * 1500, startTime);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(freq, startTime); osc1.detune.setValueAtTime(-7, startTime);
    osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(freq, startTime); osc2.detune.setValueAtTime(7, startTime);

    osc1.connect(filter); osc2.connect(filter);
    filter.connect(gainNode);

    const peakGain = 0.22 * vel;
    const attack = 0.25;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    gainNode.gain.setValueAtTime(peakGain, startTime + duration - 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.4);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime); osc2.start(startTime);
    const stopTime = startTime + duration + 0.5;
    osc1.stop(stopTime); osc2.stop(stopTime);
  }

  // GM 56: Trumpet / Brass Section
  synthTrumpet(freq, startTime, duration, vel) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    // Brass filter envelope sweep
    const startFilter = 900;
    const peakFilter = 2800 + vel * 3000;
    filter.frequency.setValueAtTime(startFilter, startTime);
    filter.frequency.linearRampToValueAtTime(peakFilter, startTime + 0.06);
    filter.frequency.exponentialRampToValueAtTime(1400, startTime + duration);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    osc.connect(filter);
    filter.connect(gainNode);

    const peakGain = 0.28 * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.04);
    gainNode.gain.setValueAtTime(peakGain * 0.8, startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc.start(startTime);
    const stopTime = startTime + duration + 0.05;
    osc.stop(stopTime);
  }

  // GM 73: Flute / Woodwind
  synthFlute(freq, startTime, duration, vel) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800 + vel * 1200, startTime);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    // Subtle breath noise
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    const m1 = this.ctx.createGain(); m1.gain.setValueAtTime(0.8, startTime);
    const m2 = this.ctx.createGain(); m2.gain.setValueAtTime(0.2, startTime);
    osc.connect(m1); osc2.connect(m2);
    m1.connect(filter); m2.connect(filter);
    filter.connect(gainNode);

    const peakGain = 0.28 * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.06);
    gainNode.gain.setValueAtTime(peakGain * 0.9, startTime + duration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc.start(startTime); osc2.start(startTime);
    const stopTime = startTime + duration + 0.05;
    osc.stop(stopTime); osc2.stop(stopTime);
  }

  // GM 88: Warm Synth Pad
  synthWarmPad(freq, startTime, duration, vel, isBass) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200 + vel * 1200, startTime);
    filter.Q.setValueAtTime(2.0, startTime);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc1.detune.setValueAtTime(-8, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(8, startTime);

    osc1.connect(filter); osc2.connect(filter);
    filter.connect(gainNode);

    const attack = 0.22;
    const peakGain = (isBass ? 0.3 : 0.2) * vel;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    gainNode.gain.setValueAtTime(peakGain, startTime + duration - 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.4);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime); osc2.start(startTime);
    const stopTime = startTime + duration + 0.5;
    osc1.stop(stopTime); osc2.stop(stopTime);
  }

  // Play a full chord at a specific timestamp with customized or default velocity
  playChord(chord, startTime = null, duration = 2.2, velocity = null) {
    if (!chord || !chord.midiNotes) return;
    if (!this.ctx) return;

    const t = startTime !== null ? startTime : this.ctx.currentTime;
    const notes = chord.midiNotes;
    const baseVel = velocity !== null ? velocity : (chord.velocity || this.defaultVelocity);

    let staggerStep = 0;
    if (this.strumStyle === 'gentle') {
      staggerStep = 0.024;
    } else if (this.strumStyle === 'arpeggio') {
      staggerStep = 0.085;
    }

    notes.forEach((midi, idx) => {
      const noteTime = t + (idx * staggerStep);
      const isBass = idx === 0;
      // Slight musical humanization of velocity per voice
      const noteVel = Math.round(Math.min(127, Math.max(20, isBass ? baseVel * 1.05 : baseVel * (0.9 + (idx % 2) * 0.1))));
      this.playNote(midi, noteTime, duration, noteVel);
    });
  }

  // Metronome Click
  playMetronomeClick(isAccent = false, time = null) {
    if (!this.ctx || this.isMuted) return;

    const t = time !== null ? time : this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = isAccent ? 1650 : 920;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.035);

    const clickVolume = isAccent ? 0.85 : 0.5;
    gain.gain.setValueAtTime(clickVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.metronomeGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  getCurrentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }
}

// Global instances
window.GM_INSTRUMENTS = GM_INSTRUMENTS;
window.audioEngine = new AudioEngine();

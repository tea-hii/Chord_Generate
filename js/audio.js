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
    this.strumStyle = 'fingerstyle';
    this.arpRate = 'auto'; // 'auto', '1/4', '3/16', '1/8', '1/8T', '1/16'
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

  setArpRate(rate) {
    this.arpRate = rate || 'auto';
  }

  getArpStepSeconds(rate, defaultMultiplier, secPerBeat) {
    switch (rate) {
      case '1/4': return secPerBeat * 1.0;
      case '3/16': return secPerBeat * 0.75;
      case '1/8': return secPerBeat * 0.5;
      case '1/8T': return secPerBeat / 3.0;
      case '1/16': return secPerBeat * 0.25;
      case 'auto':
      default:
        return secPerBeat * defaultMultiplier;
    }
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

  // Build a rich, resonant 6-string open guitar/piano voicing
  buildVoicing(chord) {
    if (!chord) return [48, 52, 55, 60];

    // Determine root pitch class (0..11)
    let rootPitchClass = 0;
    if (chord.rootName && typeof noteNameToMidi === 'function') {
      rootPitchClass = (noteNameToMidi(chord.rootName) % 12 + 12) % 12;
    } else if (chord.midiNotes && chord.midiNotes.length > 0) {
      rootPitchClass = (chord.midiNotes[0] % 12 + 12) % 12;
    }

    const intervals = chord.intervals || (typeof CHORD_INTERVALS !== 'undefined' && CHORD_INTERVALS[chord.type]) || [0, 4, 7];
    const thirdInterval = intervals[1] !== undefined ? intervals[1] : 4;
    const fifthInterval = intervals[2] !== undefined ? intervals[2] : 7;
    const seventhInterval = intervals[3] !== undefined ? intervals[3] : (intervals[2] || 7);

    // Realistic acoustic guitar root range (E2=40 to D#3=51)
    // Low register bass notes for maximum warmth and acoustic depth
    const p = rootPitchClass;
    let bass = 36 + p;
    if (p >= 4 && p <= 8) {
      bass = 40 + (p - 4); // E2(40), F2(41), F#2(42), G2(43), G#2(44)
    } else if (p >= 9) {
      bass = 45 + (p - 9); // A2(45), A#2(46), B2(47)
    } else {
      bass = 36 + p; // C2(36), C#2(37), D2(38), D#2(39)
    }

    const string0 = bass; // String 6: Deep Root Bass
    const string1 = bass + fifthInterval; // String 5: Fifth
    const string2 = bass + 12; // String 4: Octave Root
    const string3 = bass + 12 + thirdInterval; // String 3: Third
    const string4 = bass + 12 + (chord.type && chord.type.includes('7') ? seventhInterval : fifthInterval); // String 2: 5th or 7th
    const string5 = bass + 24; // String 1: High Top Root

    return [string0, string1, string2, string3, string4, string5];
  }

  // Play a full chord with authentic accompaniment style (Fingerpicking, Strum, Walking Bass, Arpeggio, Flamenco, Soul, Bossa, Lofi, Block)
  playChord(chord, startTime = null, duration = 2.2, velocity = null, options = {}) {
    if (!chord || (!chord.midiNotes && !chord.rootName)) return;
    if (!this.ctx) return;

    const t = startTime !== null ? startTime : this.ctx.currentTime;
    const baseVel = velocity !== null ? velocity : (chord.velocity || this.defaultVelocity);
    const secPerBeat = options.secPerBeat || 0.6; // 100 BPM fallback
    const nextChord = options.nextChord || null;

    const strings = this.buildVoicing(chord);
    
    // Choose specific slot style if provided, else chord style, else fallback to global style
    let style = options.style;
    if (!style || style === 'inherit') {
      style = (chord && (chord.strumStyle || chord.style)) || this.strumStyle || 'fingerstyle';
    }
    if (style === 'inherit') {
      style = this.strumStyle || 'fingerstyle';
    }

    // Choose specific slot rate if provided, else chord rate, else fallback to global rate
    let rate = options.rate;
    if (!rate || rate === 'inherit') {
      rate = (chord && chord.arpRate) || this.arpRate || 'auto';
    }
    if (rate === 'inherit') {
      rate = this.arpRate || 'auto';
    }

    switch (style) {
      case 'fingerstyle': {
        // Authentic acoustic ballad fingerpicking pattern across the duration
        const step = this.getArpStepSeconds(rate, 0.5, secPerBeat);
        const maxSteps = Math.max(2, Math.floor(duration / step));

        // 8-step acoustic pattern index maps to strings: [Bass, 5th, MidRoot, 3rd, 5thHigh, HighTop]
        // Pluck order: Bass -> 3rd -> 5th -> HighTop -> AltBass -> 3rd -> HighTop -> 5th
        const patternIndices = [0, 3, 4, 5, 1, 3, 5, 4];
        const velMultipliers = [1.15, 0.85, 0.9, 0.98, 1.05, 0.85, 0.92, 0.8];
        const noteDurations = [step * 3.5, step * 2.0, step * 2.0, step * 2.2, step * 3.0, step * 2.0, step * 2.0, step * 1.8];

        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;

          const pIdx = i % patternIndices.length;
          const strIdx = patternIndices[pIdx];
          const midi = strings[strIdx] || strings[0];
          const v = Math.round(Math.min(127, Math.max(25, baseVel * velMultipliers[pIdx])));
          const d = Math.min(noteDurations[pIdx], (t + duration) - noteTime);

          this.playNote(midi, noteTime, d, v);
        }
        break;
      }

      case 'strum': {
        if (rate !== 'auto') {
          // Custom subdivision strumming (alternating down / up)
          const step = this.getArpStepSeconds(rate, 0.5, secPerBeat);
          const maxSteps = Math.max(1, Math.floor(duration / step));
          for (let i = 0; i < maxSteps; i++) {
            const strumTime = t + i * step;
            if (strumTime >= t + duration - 0.02) break;
            const isDown = (i % 2 === 0);
            const slice = isDown ? (i === 0 ? strings : strings.slice(1)) : strings.slice(2);
            const velScale = i === 0 ? 1.08 : (isDown ? 0.88 : 0.74);
            this.playStrumChord(slice, strumTime, Math.min(step * 1.15, (t + duration) - strumTime), baseVel * velScale, isDown);
          }
          break;
        }
        // Dynamic rhythmic acoustic guitar strumming with down/up groove
        // Beat 1 (t+0): Full Down-strum (all 6 strings)
        this.playStrumChord(strings, t, Math.min(duration, secPerBeat * 1.8), baseVel * 1.1, true);

        // If slot duration has 2 or more beats, add rhythmic strums
        if (duration >= secPerBeat * 1.8) {
          // Beat 2: Light down-strum
          this.playStrumChord(strings.slice(2), t + secPerBeat, secPerBeat * 0.9, baseVel * 0.78, true);
        }
        if (duration >= secPerBeat * 2.3) {
          // Beat 2&: Up-strum
          this.playStrumChord(strings.slice(2), t + secPerBeat * 1.5, secPerBeat * 0.8, baseVel * 0.72, false);
        }
        if (duration >= secPerBeat * 3.2) {
          // Beat 3: Driving down-strum
          this.playStrumChord(strings.slice(1), t + secPerBeat * 2.0, secPerBeat * 1.1, baseVel * 0.92, true);
        }
        if (duration >= secPerBeat * 3.7) {
          // Beat 4: Down + Up-strum
          this.playStrumChord(strings.slice(2), t + secPerBeat * 3.0, secPerBeat * 0.8, baseVel * 0.85, true);
          this.playStrumChord(strings.slice(2), t + secPerBeat * 3.5, secPerBeat * 0.6, baseVel * 0.75, false);
        }
        break;
      }

      case 'walking_bass': {
        // Melodic Bass Root + Comping + Passing Walking Bass note leading to next chord
        // 1. Beat 1: Heavy Root Bass note
        const bassMidi = strings[0];
        const bassDur = Math.min(duration, secPerBeat * 1.5);
        this.playNote(bassMidi, t, bassDur, Math.round(Math.min(127, baseVel * 1.2)));

        // 2. Off-beat Comping chord stabs
        if (duration >= secPerBeat * 1.2) {
          const compNotes = [strings[2], strings[3], strings[4]];
          compNotes.forEach(m => {
            this.playNote(m, t + secPerBeat * 0.75, secPerBeat * 0.5, Math.round(baseVel * 0.85));
          });
        }
        if (duration >= secPerBeat * 2.4) {
          const compNotes = [strings[2], strings[3], strings[4]];
          compNotes.forEach(m => {
            this.playNote(m, t + secPerBeat * 1.75, secPerBeat * 0.5, Math.round(baseVel * 0.8));
          });
        }

        // 3. Passing Walking Bass Note leading into next chord root
        if (duration >= secPerBeat * 1.8) {
          const passingTime = t + duration - (secPerBeat * 0.5);
          let passingMidi = bassMidi + 2; // Default scale step up

          if (nextChord) {
            const nextStrings = this.buildVoicing(nextChord);
            const targetBass = nextStrings[0];
            if (targetBass > bassMidi) {
              passingMidi = targetBass - 1; // Leading note from below
            } else if (targetBass < bassMidi) {
              passingMidi = targetBass + 1; // Approach from above
            } else {
              passingMidi = bassMidi + 7; // 5th of chord
            }
          } else {
            passingMidi = bassMidi - 1; // Romantic half-step leading tone
          }

          this.playNote(passingMidi, passingTime, secPerBeat * 0.65, Math.round(Math.min(127, baseVel * 1.08)));
        }
        break;
      }

      case 'piano_arpeggio': {
        // Flowing piano ballad arpeggio across 2 octaves
        const step = this.getArpStepSeconds(rate, 0.375, secPerBeat);
        const maxSteps = Math.max(3, Math.floor(duration / step));
        const arpeggioNotes = [strings[0], strings[1], strings[2], strings[3], strings[4], strings[5], strings[4], strings[3]];

        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;

          const midi = arpeggioNotes[i % arpeggioNotes.length];
          const isBass = (i % arpeggioNotes.length) === 0;
          const v = Math.round(Math.min(127, Math.max(25, isBass ? baseVel * 1.15 : baseVel * (0.82 + (i % 3) * 0.06))));
          this.playNote(midi, noteTime, step * 2.5, v);
        }
        break;
      }

      case 'flamenco': {
        // Fast passionate Spanish tremolo roll
        const step = this.getArpStepSeconds(rate, 0.25, secPerBeat);
        const maxSteps = Math.max(4, Math.floor(duration / step));
        const patternIndices = [0, 3, 4, 5, 4, 3, 5, 4];
        const velMultipliers = [1.2, 0.88, 0.95, 1.05, 0.9, 0.85, 1.0, 0.9];
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          const pIdx = i % patternIndices.length;
          const strIdx = patternIndices[pIdx];
          const midi = strings[strIdx] || strings[0];
          const v = Math.round(Math.min(127, Math.max(25, baseVel * velMultipliers[pIdx])));
          this.playNote(midi, noteTime, step * 2.2, v);
        }
        break;
      }

      case 'slow_soul': {
        // Soul / RnB: Deep Bass on 1, pinched mid-high chords on offbeats, melodic top note
        const bassMidi = strings[0];
        this.playNote(bassMidi, t, Math.min(duration, secPerBeat * 2.0), Math.round(Math.min(127, baseVel * 1.15)));

        if (duration >= secPerBeat * 1.0) {
          const pinchNotes = [strings[2], strings[3], strings[4]];
          pinchNotes.forEach(m => this.playNote(m, t + secPerBeat, secPerBeat * 1.2, Math.round(baseVel * 0.85)));
        }

        if (duration >= secPerBeat * 2.0) {
          this.playNote(strings[5], t + secPerBeat * 2.0, secPerBeat * 1.2, Math.round(baseVel * 0.95));
        }

        if (duration >= secPerBeat * 3.0) {
          const pinchNotes = [strings[3], strings[4], strings[5]];
          pinchNotes.forEach(m => this.playNote(m, t + secPerBeat * 3.0, secPerBeat * 0.9, Math.round(baseVel * 0.8)));
        }
        break;
      }

      case 'bossa_funk': {
        // Syncopated Brazilian Bossa / Funk Pinch with staccato accents
        const bassMidi = strings[0];
        this.playNote(bassMidi, t, secPerBeat * 0.6, Math.round(Math.min(127, baseVel * 1.15)));

        const pinch = (timeOffset, velScale) => {
          [strings[2], strings[3], strings[4]].forEach(m => {
            this.playNote(m, t + timeOffset, secPerBeat * 0.45, Math.round(baseVel * velScale));
          });
        };

        if (duration >= secPerBeat * 0.75) pinch(secPerBeat * 0.75, 0.85);
        if (duration >= secPerBeat * 1.5) pinch(secPerBeat * 1.5, 0.88);
        if (duration >= secPerBeat * 2.0) {
          this.playNote(strings[1], t + secPerBeat * 2.0, secPerBeat * 0.6, Math.round(baseVel * 1.05));
        }
        if (duration >= secPerBeat * 2.75) pinch(secPerBeat * 2.75, 0.82);
        if (duration >= secPerBeat * 3.5) pinch(secPerBeat * 3.5, 0.8);
        break;
      }

      case 'ambient_lofi': {
        // Cascading ethereal harp-like arpeggio with soft attack and high sustain
        const step = this.getArpStepSeconds(rate, 0.35, secPerBeat);
        const maxSteps = Math.max(3, Math.floor(duration / step));
        const harpNotes = [strings[0], strings[1], strings[2], strings[3], strings[4], strings[5], strings[4], strings[3]];
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          const midi = harpNotes[i % harpNotes.length];
          const isBass = (i % harpNotes.length) === 0;
          const v = Math.round(Math.min(127, Math.max(25, isBass ? baseVel * 1.05 : baseVel * 0.8)));
          this.playNote(midi, noteTime, step * 4.0, v);
        }
        break;
      }

      case 'travis_picking': {
        // Country / Folk Travis Picking: alternating thumb bass (Root -> 5th) + syncopated top melody plucks
        const step = this.getArpStepSeconds(rate, 0.5, secPerBeat);
        const maxSteps = Math.max(2, Math.floor(duration / step));
        // Pattern: [Thumb Root, Treble 5th, Thumb AltBass, Treble 3rd, Thumb Root, Treble High, Thumb AltBass, Treble 3rd]
        const patternIndices = [0, 4, 1, 3, 0, 5, 1, 3];
        const velMultipliers = [1.15, 0.82, 1.05, 0.88, 1.12, 0.94, 1.02, 0.85];
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          const pIdx = i % patternIndices.length;
          const midi = strings[patternIndices[pIdx]] || strings[0];
          const isThumb = (i % 2) === 0;
          const d = Math.min(isThumb ? step * 2.2 : step * 1.8, (t + duration) - noteTime);
          const v = Math.round(Math.min(127, Math.max(25, baseVel * velMultipliers[pIdx])));
          this.playNote(midi, noteTime, d, v);
        }
        break;
      }

      case 'classical_alberti': {
        // Classical Piano Alberti Bass (Low -> High -> Mid -> High)
        const step = this.getArpStepSeconds(rate, 0.25, secPerBeat);
        const maxSteps = Math.max(4, Math.floor(duration / step));
        const patternIndices = [0, 4, 2, 4, 1, 5, 3, 5];
        const velMultipliers = [1.1, 0.78, 0.85, 0.78, 1.0, 0.82, 0.88, 0.82];
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          const pIdx = i % patternIndices.length;
          const midi = strings[patternIndices[pIdx]] || strings[0];
          const v = Math.round(Math.min(127, Math.max(25, baseVel * velMultipliers[pIdx])));
          this.playNote(midi, noteTime, step * 1.9, v);
        }
        break;
      }

      case 'waltz_34': {
        // 3/4 Waltz (Oom-Pah-Pah): Deep Bass on beat 1, light upper chord plucks on beats 2 & 3
        const numBeats = Math.max(1, Math.round(duration / secPerBeat));
        for (let b = 0; b < numBeats; b++) {
          const noteTime = t + b * secPerBeat;
          if (noteTime >= t + duration - 0.02) break;
          const beatInWaltz = b % 3;
          if (beatInWaltz === 0) {
            this.playNote(strings[0], noteTime, secPerBeat * 1.4, Math.round(Math.min(127, baseVel * 1.15)));
          } else {
            const velScale = beatInWaltz === 1 ? 0.82 : 0.74;
            [strings[2], strings[3], strings[4]].forEach(m => {
              this.playNote(m, noteTime, secPerBeat * 0.75, Math.round(baseVel * velScale));
            });
          }
        }
        break;
      }

      case 'jazz_comping': {
        // Jazz Swing / Charleston Comping: Root + Chord on 1, syncopated push on "and of 2", soft turnaround on 4
        this.playNote(strings[0], t, Math.min(duration, secPerBeat * 1.5), Math.round(Math.min(127, baseVel * 1.1)));
        [strings[2], strings[3], strings[4], strings[5]].forEach((m, idx) => {
          this.playNote(m, t + idx * 0.01, secPerBeat * 0.85, Math.round(baseVel * 0.86));
        });
        // Charleston syncopation on beat 2.66 (swung "and of 2")
        if (duration >= secPerBeat * 2.2) {
          const swingOffset = secPerBeat * 1.66;
          [strings[2], strings[3], strings[4], strings[5]].forEach((m, idx) => {
            this.playNote(m, t + swingOffset + idx * 0.01, secPerBeat * 0.55, Math.round(baseVel * 0.78));
          });
        }
        // Soft comping pickup on beat 4
        if (duration >= secPerBeat * 3.6) {
          const pickupOffset = secPerBeat * 3.33;
          [strings[3], strings[4]].forEach(m => {
            this.playNote(m, t + pickupOffset, secPerBeat * 0.45, Math.round(baseVel * 0.7));
          });
        }
        break;
      }

      case 'reggae_skank': {
        // Reggae / Ska: Deep sub-bass on beats 1 & 3, crisp staccato chord skank strictly on off-beats
        const numBeats = Math.max(1, Math.floor(duration / secPerBeat));
        for (let b = 0; b < numBeats; b++) {
          const beatTime = t + b * secPerBeat;
          if (b % 2 === 0 && beatTime < t + duration - 0.02) {
            this.playNote(strings[0], beatTime, secPerBeat * 0.9, Math.round(Math.min(127, baseVel * 1.15)));
          }
          const offBeatTime = beatTime + secPerBeat * 0.5;
          if (offBeatTime < t + duration - 0.02) {
            [strings[2], strings[3], strings[4], strings[5]].forEach(m => {
              this.playNote(m, offBeatTime, secPerBeat * 0.22, Math.round(baseVel * 0.9));
            });
          }
        }
        break;
      }

      case 'cinematic_swell': {
        // Cinematic driving pulse on Root/5th with soaring crescendo top voices
        const step = this.getArpStepSeconds(rate, 0.5, secPerBeat);
        const maxSteps = Math.max(2, Math.floor(duration / step));
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          const progress = i / Math.max(1, maxSteps - 1);
          const pulseMidi = (i % 2 === 0) ? strings[0] : strings[1];
          const pulseVel = Math.round(Math.min(127, baseVel * (0.75 + progress * 0.4)));
          this.playNote(pulseMidi, noteTime, step * 1.4, pulseVel);

          // Add soaring upper voices on every 2nd step with rising intensity
          if (i % 2 === 0) {
            const topMidi = strings[3 + (Math.floor(i / 2) % 3)] || strings[5];
            const topVel = Math.round(Math.min(127, baseVel * (0.65 + progress * 0.45)));
            this.playNote(topMidi, noteTime, step * 2.5, topVel);
          }
        }
        break;
      }

      case 'chachacha': {
        // Latin Cha-Cha-Cha: Tumbao bass + Montuno "1, 2, 3, 4-and-1" syncopated chord stabs
        const step = this.getArpStepSeconds(rate, 0.5, secPerBeat);
        const bassMidi = strings[0];
        const altBass = strings[1];
        // Bass Tumbao: Beat 1, "and" of 2, Beat 4
        this.playNote(bassMidi, t, secPerBeat * 0.85, Math.round(Math.min(127, baseVel * 1.15)));
        if (duration >= secPerBeat * 1.6) {
          this.playNote(altBass, t + secPerBeat * 1.5, secPerBeat * 0.6, Math.round(baseVel * 1.0));
        }
        if (duration >= secPerBeat * 3.1) {
          this.playNote(bassMidi, t + secPerBeat * 3.0, secPerBeat * 0.75, Math.round(baseVel * 1.1));
        }

        // Cha-Cha-Cha upper Montuno pattern ("2, 3, 4-&-1" / or custom rate steps)
        const montunoOffsets = rate !== 'auto'
          ? Array.from({ length: Math.max(2, Math.floor(duration / step)) }, (_, idx) => idx * step)
          : [0, secPerBeat, secPerBeat * 2.0, secPerBeat * 3.0, secPerBeat * 3.5];

        montunoOffsets.forEach((offset, idx) => {
          const noteTime = t + offset;
          if (noteTime >= t + duration - 0.02) return;
          const isChaCha = (idx >= 3 && rate === 'auto');
          const velScale = isChaCha ? 0.92 : (idx % 2 === 0 ? 0.86 : 0.78);
          const stabDur = isChaCha ? secPerBeat * 0.32 : secPerBeat * 0.45;
          [strings[2], strings[4], strings[5]].forEach((m, j) => {
            this.playNote(m, noteTime + j * 0.008, stabDur, Math.round(baseVel * velScale));
          });
        });
        break;
      }

      case 'techno': {
        // Driving Club Techno / Trance: Rolling 16th-note octave bass + hypnotic acid/trance arp
        const step = this.getArpStepSeconds(rate, 0.25, secPerBeat);
        const maxSteps = Math.max(4, Math.floor(duration / step));
        const arpOrder = [0, 2, 0, 4, 0, 5, 3, 4];
        const accents = [1.2, 0.72, 0.95, 0.85, 1.15, 0.92, 0.75, 0.88];
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          const pIdx = i % arpOrder.length;
          const midi = strings[arpOrder[pIdx]] || strings[0];
          const v = Math.round(Math.min(127, Math.max(25, baseVel * accents[pIdx])));
          // Short punchy gate for crisp electronic feel
          this.playNote(midi, noteTime, step * 0.78, v);
        }
        break;
      }

      case 'bedroom_pop': {
        // Bedroom Pop / Indie Dream: Warm soft bass anchor + nostalgic cascading dreamy plucks
        const step = this.getArpStepSeconds(rate, 0.5, secPerBeat);
        const maxSteps = Math.max(2, Math.floor(duration / step));
        this.playNote(strings[0], t, Math.min(duration, secPerBeat * 2.5), Math.round(Math.min(127, baseVel * 1.05)));
        const dreamOrder = [2, 3, 5, 4, 3, 5, 4, 2];
        const dreamVels = [0.82, 0.88, 0.94, 0.78, 0.85, 0.92, 0.8, 0.75];
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step + (i % 2 === 1 ? 0.012 : 0); // Subtle human pocket swing
          if (noteTime >= t + duration - 0.02) break;
          const pIdx = i % dreamOrder.length;
          const midi = strings[dreamOrder[pIdx]] || strings[3];
          const v = Math.round(Math.min(127, Math.max(25, baseVel * dreamVels[pIdx])));
          this.playNote(midi, noteTime, step * 2.8, v);
        }
        break;
      }

      case 'synthwave': {
        // 80s Synthwave / Outrun: Steady driving root bass + ascending/descending neon arpeggio
        const step = this.getArpStepSeconds(rate, 0.25, secPerBeat);
        const maxSteps = Math.max(4, Math.floor(duration / step));
        const waveOrder = [0, 1, 2, 3, 4, 5, 4, 3];
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          const pIdx = i % waveOrder.length;
          const midi = strings[waveOrder[pIdx]] || strings[0];
          const isPulse = (i % 4 === 0);
          const v = Math.round(Math.min(127, Math.max(25, baseVel * (isPulse ? 1.12 : 0.84))));
          this.playNote(midi, noteTime, step * 1.15, v);
        }
        break;
      }

      case 'funk_disco': {
        // Funk / Disco Octave Groove: Punchy octave bass jumps + tight 16th syncopated upper "chank"
        const step = this.getArpStepSeconds(rate, 0.5, secPerBeat);
        const maxSteps = Math.max(2, Math.floor(duration / step));
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          if (i % 2 === 0) {
            // Downbeat: Low Root Bass
            this.playNote(strings[0], noteTime, step * 0.75, Math.round(Math.min(127, baseVel * 1.15)));
          } else {
            // Offbeat: Octave Root jump + crisp staccato upper chord chank
            this.playNote(strings[2], noteTime, step * 0.55, Math.round(baseVel * 0.95));
            [strings[3], strings[4], strings[5]].forEach(m => {
              this.playNote(m, noteTime, step * 0.35, Math.round(baseVel * 0.85));
            });
          }
        }
        break;
      }

      case 'neo_soul': {
        // Neo-Soul / Gospel Cascade: Expressive upward rolled voicings with laid-back pocket fills
        const rollStagger = 0.032; // Lush slow gospel roll
        strings.forEach((m, idx) => {
          const noteTime = t + idx * rollStagger;
          if (noteTime >= t + duration - 0.02) return;
          const v = Math.round(Math.min(127, baseVel * (idx === 0 ? 1.12 : 0.84 + idx * 0.03)));
          this.playNote(m, noteTime, Math.min(duration * 0.75, secPerBeat * 2.2), v);
        });
        // Laid-back pocket grace fill on beat 3
        if (duration >= secPerBeat * 2.5) {
          const fillTime = t + secPerBeat * 2.25;
          [strings[3], strings[4], strings[5]].forEach((m, idx) => {
            this.playNote(m, fillTime + idx * 0.04, secPerBeat * 1.1, Math.round(baseVel * 0.78));
          });
        }
        break;
      }

      case 'vn_bolero': {
        // Vietnamese Bolero / Rumba Ballad: Bass -> Pinch -> Pinch -> AltBass -> Bass -> Rolling Fill
        const bassMidi = strings[0];
        const altBass = strings[1];
        const pinch = (offset, durScale, velScale) => {
          if (offset >= duration - 0.02) return;
          [strings[2], strings[3], strings[4]].forEach((m, j) => {
            this.playNote(m, t + offset + j * 0.008, secPerBeat * durScale, Math.round(baseVel * velScale));
          });
        };

        // Beat 1: Deep Root Bass
        this.playNote(bassMidi, t, secPerBeat * 1.1, Math.round(Math.min(127, baseVel * 1.18)));
        // Beat 1&: Soft chord pinch
        pinch(secPerBeat * 0.5, 0.4, 0.8);
        // Beat 2: Chord pinch
        pinch(secPerBeat * 1.0, 0.45, 0.84);
        // Beat 2&: Alternating 5th Bass
        if (duration >= secPerBeat * 1.6) {
          this.playNote(altBass, t + secPerBeat * 1.5, secPerBeat * 0.55, Math.round(baseVel * 1.02));
        }
        // Beat 3: Anchor Root Bass
        if (duration >= secPerBeat * 2.1) {
          this.playNote(bassMidi, t + secPerBeat * 2.0, secPerBeat * 0.9, Math.round(Math.min(127, baseVel * 1.12)));
        }
        // Beat 3& -> 4&: Rolling Bolero treble fill
        if (duration >= secPerBeat * 2.7) {
          [strings[2], strings[3], strings[4], strings[5]].forEach((m, idx) => {
            const fillTime = t + secPerBeat * 2.5 + idx * (secPerBeat * 0.35);
            if (fillTime < t + duration - 0.02) {
              this.playNote(m, fillTime, secPerBeat * 0.75, Math.round(baseVel * (0.8 + idx * 0.04)));
            }
          });
        }
        break;
      }

      case 'vn_slow_rock': {
        // Vietnamese Slow Rock (6/8 V-Pop Ballad): Rolling triplet wave (Bass -> 3rd -> 5th -> High -> 5th -> 3rd)
        const step = this.getArpStepSeconds(rate, 1 / 3, secPerBeat); // Triplet 8th default
        const maxSteps = Math.max(3, Math.floor(duration / step));
        const wavePattern = [0, 3, 4, 5, 4, 3];
        const waveVels = [1.15, 0.82, 0.88, 0.98, 0.86, 0.8];
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          const pIdx = i % wavePattern.length;
          const midi = strings[wavePattern[pIdx]] || strings[0];
          const v = Math.round(Math.min(127, Math.max(25, baseVel * waveVels[pIdx])));
          this.playNote(midi, noteTime, step * 2.6, v);
        }
        break;
      }

      case 'vn_boston': {
        // Vietnamese Boston / Lyric Valse: Soft Bass on 1 -> Mid -> Gentle 2-string pinch -> Warm inner voice
        const step = this.getArpStepSeconds(rate, 0.75, secPerBeat);
        const numCycles = Math.max(1, Math.ceil(duration / (secPerBeat * 3)));
        for (let c = 0; c < numCycles; c++) {
          const baseT = t + c * secPerBeat * 3;
          if (baseT >= t + duration - 0.02) break;
          // Beat 1: Deep warm bass
          this.playNote(strings[0], baseT, secPerBeat * 2.0, Math.round(Math.min(127, baseVel * 1.12)));
          // Beat 2: Gentle mid voice
          if (baseT + step < t + duration - 0.02) {
            this.playNote(strings[2], baseT + step, secPerBeat * 1.1, Math.round(baseVel * 0.8));
          }
          // Beat 2.5: Soft 2-string lyric pinch
          if (baseT + step * 1.8 < t + duration - 0.02) {
            [strings[3], strings[5]].forEach(m => {
              this.playNote(m, baseT + step * 1.8, secPerBeat * 1.0, Math.round(baseVel * 0.85));
            });
          }
          // Beat 3: Warm resolving voice
          if (baseT + step * 2.6 < t + duration - 0.02) {
            this.playNote(strings[4], baseT + step * 2.6, secPerBeat * 0.9, Math.round(baseVel * 0.76));
          }
        }
        break;
      }

      case 'vn_dan_tranh': {
        // Vietnamese Folk Pentatonic / Dan Tranh Zither Cascade: Expressive sweeping glissando + delicate echo
        const sweepDelay = 0.045;
        strings.forEach((m, idx) => {
          const noteTime = t + idx * sweepDelay;
          if (noteTime >= t + duration - 0.02) return;
          const v = Math.round(Math.min(127, baseVel * (idx === strings.length - 1 ? 1.08 : 0.84 + idx * 0.03)));
          this.playNote(m, noteTime, Math.min(duration, secPerBeat * 2.6), v);
        });
        // Delicate mid-bar zither echo pluck
        const step = this.getArpStepSeconds(rate, 0.5, secPerBeat);
        if (duration >= secPerBeat * 2.0) {
          [strings[5], strings[4], strings[3], strings[5]].forEach((m, idx) => {
            const echoTime = t + secPerBeat * 2.0 + idx * step * 0.75;
            if (echoTime < t + duration - 0.02) {
              this.playNote(m, echoTime, step * 2.2, Math.round(baseVel * (0.82 - idx * 0.04)));
            }
          });
        }
        break;
      }

      case 'vn_vinahouse': {
        // Vinahouse / Vietnamese Remix: Driving 4-on-the-floor bass + punchy off-beat chord plucks
        const step = this.getArpStepSeconds(rate, 0.5, secPerBeat);
        const maxSteps = Math.max(2, Math.floor(duration / step));
        for (let i = 0; i < maxSteps; i++) {
          const noteTime = t + i * step;
          if (noteTime >= t + duration - 0.02) break;
          if (i % 2 === 0) {
            // Downbeat: Heavy kick-synced bass
            this.playNote(strings[0], noteTime, step * 0.8, Math.round(Math.min(127, baseVel * 1.2)));
          } else {
            // Off-beat: Bright staccato pluck
            [strings[2], strings[3], strings[4], strings[5]].forEach(m => {
              this.playNote(m, noteTime, step * 0.45, Math.round(baseVel * 0.92));
            });
          }
        }
        break;
      }

      case 'block':
      default: {
        // Classic simultaneous block chord
        const notesToPlay = chord.midiNotes && chord.midiNotes.length >= 3 ? chord.midiNotes : strings.slice(0, 4);
        notesToPlay.forEach((midi, idx) => {
          const isBass = idx === 0;
          const noteVel = Math.round(Math.min(127, Math.max(20, isBass ? baseVel * 1.05 : baseVel * (0.9 + (idx % 2) * 0.1))));
          this.playNote(midi, t, duration, noteVel);
        });
        break;
      }
    }
  }

  // Helper to strum a list of strings with humanized micro-stagger
  playStrumChord(noteList, startTime, duration, velocity, isDown = true) {
    if (!noteList || !noteList.length || !this.ctx) return;
    const notes = isDown ? [...noteList] : [...noteList].reverse();
    const stagger = 0.022 + Math.random() * 0.005; // ~24ms between strings
    notes.forEach((midi, idx) => {
      const noteTime = startTime + idx * stagger;
      const vel = Math.round(Math.min(127, Math.max(20, velocity * (0.92 + (idx % 2) * 0.08))));
      this.playNote(midi, noteTime, duration, vel);
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

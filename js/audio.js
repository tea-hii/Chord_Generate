// Web Audio API Sound Engine & Metronome
// Polyphonic sound synthesis, realistic instrument timbres, convolution reverb, and precision clock

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.metronomeGain = null;
    this.reverbNode = null;
    this.compressor = null;
    this.instrument = 'piano'; // 'piano', 'rhodes', 'pad', 'guitar'
    this.volume = 0.8;
    this.metronomeVolume = 0.7;
    this.strumStyle = 'gentle'; // 'none', 'gentle', 'arpeggio'
    this.isMuted = false;
    this.activeNodes = new Set();
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

    // Master Compressor to prevent digital clipping
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
    this.compressor.connect(this.ctx.destination);

    // Master Volume Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.compressor);

    // Metronome Gain (bypasses reverb for punchy click)
    this.metronomeGain = this.ctx.createGain();
    this.metronomeGain.gain.setValueAtTime(this.metronomeVolume, this.ctx.currentTime);
    this.metronomeGain.connect(this.compressor);

    // Procedural Studio Reverb
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.buildImpulseResponse(2.0, 2.5);

    // Dry / Wet Reverb Mix
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // Generate a lush stereo impulse response for algorithmic reverb
  buildImpulseResponse(duration = 2.0, decay = 2.5) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i;
      // Exponential decay envelope
      const env = Math.pow(1 - n / length, decay);
      // White noise with stereo difference
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

  // Play a single note at scheduled audio time
  playNote(midi, startTime, duration = 1.8, velocity = 0.8) {
    if (!this.ctx || this.isMuted) return;

    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const isBass = midi < 48; // Bass root notes get richer low end

    switch (this.instrument) {
      case 'rhodes':
        this.synthRhodes(freq, startTime, duration, velocity, isBass);
        break;
      case 'pad':
        this.synthPad(freq, startTime, duration, velocity, isBass);
        break;
      case 'guitar':
        this.synthGuitar(freq, startTime, duration, velocity, isBass);
        break;
      case 'piano':
      default:
        this.synthPiano(freq, startTime, duration, velocity, isBass);
        break;
    }
  }

  // Piano Synthesizer: rich harmonic overtone mix with warm decay
  synthPiano(freq, startTime, duration, velocity, isBass) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Filter responds dynamically to velocity & pitch
    filter.type = 'lowpass';
    const baseCutoff = isBass ? 1200 : 3500;
    filter.frequency.setValueAtTime(baseCutoff * (0.5 + velocity * 0.7), startTime);
    filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);

    // Fundamental + 2nd harmonic + 3rd harmonic slightly detuned
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    osc2.detune.setValueAtTime(3, startTime); // subtle natural beating

    osc3.type = isBass ? 'sine' : 'triangle';
    osc3.frequency.setValueAtTime(freq * 3, startTime);
    osc3.detune.setValueAtTime(-4, startTime);

    const mix1 = this.ctx.createGain();
    const mix2 = this.ctx.createGain();
    const mix3 = this.ctx.createGain();

    mix1.gain.setValueAtTime(0.7, startTime);
    mix2.gain.setValueAtTime(0.25, startTime);
    mix3.gain.setValueAtTime(0.12, startTime);

    osc1.connect(mix1);
    osc2.connect(mix2);
    osc3.connect(mix3);

    mix1.connect(filter);
    mix2.connect(filter);
    mix3.connect(filter);

    filter.connect(gainNode);

    // Amplitude envelope (ADSR for piano: very fast attack, exponential natural decay)
    const attack = 0.015;
    const peakGain = (isBass ? 0.45 : 0.28) * velocity;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.4, startTime + 0.35);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Connect to dry and wet reverb
    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);

    const stopTime = startTime + duration + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
  }

  // Rhodes / Electric Piano: warm chime, tine bell harmonics
  synthRhodes(freq, startTime, duration, velocity, isBass) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, startTime);
    filter.frequency.exponentialRampToValueAtTime(600, startTime + duration);

    // Fundamental Sine + Metallic bell tone (7x frequency)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    const bell = this.ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(freq * 6.5, startTime);

    const bellGain = this.ctx.createGain();
    bellGain.gain.setValueAtTime(0.12 * velocity, startTime);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15); // Fast tine decay

    osc1.connect(filter);
    osc2.connect(filter);
    bell.connect(bellGain);
    bellGain.connect(gainNode);
    filter.connect(gainNode);

    const peakGain = (isBass ? 0.38 : 0.24) * velocity;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.5, startTime + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime);
    osc2.start(startTime);
    bell.start(startTime);

    const stopTime = startTime + duration + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    bell.stop(stopTime);
  }

  // Lush Synth Pad: wide stereo, slow gentle attack, warm sustained ambient wash
  synthPad(freq, startTime, duration, velocity, isBass) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, startTime);
    filter.Q.setValueAtTime(2.0, startTime);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc1.detune.setValueAtTime(-8, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(8, startTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);

    const attack = 0.25;
    const peakGain = (isBass ? 0.28 : 0.18) * velocity;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    gainNode.gain.setValueAtTime(peakGain, startTime + duration - 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.5);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime);
    osc2.start(startTime);

    const stopTime = startTime + duration + 0.6;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
  }

  // Acoustic Guitar Pluck: bright Karplus-like transient with wooden resonance
  synthGuitar(freq, startTime, duration, velocity, isBass) {
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, startTime);
    filter.Q.setValueAtTime(1.8, startTime);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);

    const peakGain = (isBass ? 0.35 : 0.22) * velocity;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(peakGain * 0.2, startTime + 0.18);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    gainNode.connect(this.masterGain);
    gainNode.connect(this.reverbNode);

    osc1.start(startTime);
    osc2.start(startTime);

    const stopTime = startTime + duration + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
  }

  // Play a full chord at a specific audio context timestamp
  playChord(chord, startTime = null, duration = 2.2) {
    if (!chord || !chord.midiNotes) return;
    if (!this.ctx) return;

    const t = startTime !== null ? startTime : this.ctx.currentTime;
    const notes = chord.midiNotes;

    // Determine note staggering (strumming)
    let staggerStep = 0;
    if (this.strumStyle === 'gentle') {
      staggerStep = 0.025; // 25ms between notes for natural finger strum
    } else if (this.strumStyle === 'arpeggio') {
      staggerStep = 0.09; // 90ms arpeggiated roll
    }

    notes.forEach((midi, idx) => {
      const noteTime = t + (idx * staggerStep);
      const isBass = idx === 0;
      // Slightly vary velocity for musical humanization
      const vel = isBass ? 0.95 : (0.75 + (idx % 2) * 0.1);
      this.playNote(midi, noteTime, duration, vel);
    });
  }

  // Precision Metronome Click
  // isAccent = true on Beat 1 (high woodblock/rimshot), false on other beats
  playMetronomeClick(isAccent = false, time = null) {
    if (!this.ctx || this.isMuted) return;

    const t = time !== null ? time : this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Woodblock / Click acoustic model
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

// Global singleton instance
window.audioEngine = new AudioEngine();

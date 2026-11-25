// Progression Sequencer, Precision Audio Clock, Looper, Recorder, and 1/16th Grid Fraction Lengths
// Built with Web Audio API lookahead scheduler to ensure zero drift / jitter

// Greatest common divisor helper
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// Convert 16th count (1..32) to musical fraction string
function sixteenthsToFraction(sixteenths) {
  const s = Math.max(1, Math.min(32, Math.round(sixteenths)));
  if (s === 16) return '4/4 (1 Bar)';
  if (s === 32) return '2 (2 Bars)';

  const d = gcd(s, 16);
  const num = s / d;
  const den = 16 / d;

  if (den === 4) return `${num}/4`;
  if (den === 2) return `${num}/2`;
  if (den === 8) return `${num}/8`;
  if (den === 16) return `${num}/16`;
  if (den === 1) return `${num} Bars`;
  return `${num}/${den}`;
}

// Convert beats (quarter notes) to fractional string
function beatsToFraction(beats) {
  const sixteenths = Math.max(1, Math.min(32, Math.round(beats / 0.25)));
  return sixteenthsToFraction(sixteenths);
}

// Convert fractional string to beats (quarter notes)
function fractionToBeats(fractionStr) {
  if (!fractionStr) return 4.0;
  const clean = fractionStr.split(' ')[0].trim();
  if (clean === '2') return 8.0;
  if (clean.includes('/')) {
    const [num, den] = clean.split('/').map(Number);
    if (!isNaN(num) && !isNaN(den) && den > 0) {
      return (num / den) * 4.0;
    }
  }
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 4.0 : parsed;
}

class Sequencer {
  constructor(audioEngine) {
    this.audio = audioEngine;

    // Timing config
    this.bpm = 100;
    this.beatsPerBar = 4;
    this.bars = 2; // Default 2 bars
    this.isPlaying = false;
    this.isLooping = true;
    this.isRecording = false;
    this.isMetronomeOn = true;

    // Progression slots: array of { id, chord: Object | null, beats: Number, velocity: Number }
    this.slots = [];
    this.selectedSlotIndex = -1;

    // Scheduling state
    this.lookaheadMs = 25.0;
    this.scheduleAheadTime = 0.12;
    this.timerId = null;
    this.currentBeatIndex = 0;
    this.nextBeatTime = 0.0;

    // Tap tempo tracking
    this.tapTimes = [];
    this.lastTapTimestamp = 0;

    // Callbacks for UI updates
    this.onBeatChange = null;
    this.onSlotActive = null;
    this.onSlotsUpdate = null;
    this.onStateChange = null;
  }

  getTotalBeats() {
    const slotBeats = this.slots.reduce((sum, s) => sum + (s.beats || 0), 0);
    return slotBeats > 0 ? slotBeats : (this.beatsPerBar || 4) * 2;
  }

  getTotalBars() {
    const totalBeats = this.getTotalBeats();
    return totalBeats / (this.beatsPerBar || 4);
  }

  getSecondsPerBeat() {
    return 60.0 / this.bpm;
  }

  setBpm(newBpm) {
    this.bpm = Math.max(30, Math.min(260, Math.round(newBpm)));
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  setBars(numBars) {
    this.bars = Math.max(1, Math.min(16, parseInt(numBars, 10)));
    this.rebalanceSlotsToBeats();
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  setBeatsPerBar(beats) {
    this.beatsPerBar = parseInt(beats, 10);
    this.rebalanceSlotsToBeats();
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  tapTempo() {
    const now = performance.now();
    if (now - this.lastTapTimestamp > 2500) {
      this.tapTimes = [];
    }
    this.lastTapTimestamp = now;
    this.tapTimes.push(now);

    if (this.tapTimes.length > 5) {
      this.tapTimes.shift();
    }

    if (this.tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < this.tapTimes.length; i++) {
        intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
      }
      const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgIntervalMs);
      if (calculatedBpm >= 30 && calculatedBpm <= 260) {
        this.setBpm(calculatedBpm);
        return calculatedBpm;
      }
    }
    return null;
  }

  // Add an empty chord slot
  addEmptySlot(beats = 4.0, velocity = 90) {
    const newSlot = {
      id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      chord: null,
      beats: beats,
      velocity: velocity
    };
    this.slots.push(newSlot);
    this.rebalanceSlotsToBeats();
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    return newSlot;
  }

  // Add or assign chord
  addChord(chord, beats = null, velocity = 90) {
    const defaultBeats = beats || (this.beatsPerBar === 3 ? 3 : 4);
    
    // If a slot is explicitly selected (whether empty or filled), assign to it
    if (this.selectedSlotIndex >= 0 && this.selectedSlotIndex < this.slots.length) {
      this.slots[this.selectedSlotIndex].chord = chord;
      if (chord.velocity) this.slots[this.selectedSlotIndex].velocity = chord.velocity;
      if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
      return;
    }

    // Check if there is an empty slot that can be filled first
    const firstEmptyIndex = this.slots.findIndex(s => s.chord === null);
    if (firstEmptyIndex !== -1) {
      this.slots[firstEmptyIndex].chord = chord;
      if (chord.velocity) this.slots[firstEmptyIndex].velocity = chord.velocity;
      if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
      return;
    }

    // Otherwise append new slot
    this.slots.push({
      id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      chord: chord,
      beats: defaultBeats,
      velocity: velocity
    });

    this.rebalanceSlotsToBeats();
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
  }

  // Clear chord from slot but keep slot empty in place
  clearSlotChord(index) {
    if (index >= 0 && index < this.slots.length) {
      this.slots[index].chord = null;
      if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    }
  }

  // Completely delete slot from progression
  removeSlot(index) {
    if (index >= 0 && index < this.slots.length) {
      this.slots.splice(index, 1);
      if (this.selectedSlotIndex === index) {
        this.selectedSlotIndex = -1;
      } else if (this.selectedSlotIndex > index) {
        this.selectedSlotIndex--;
      }
      this.rebalanceSlotsToBeats();
      if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    }
  }

  // Update slot properties (beats, velocity, etc.)
  updateSlot(index, updates) {
    if (index >= 0 && index < this.slots.length) {
      Object.assign(this.slots[index], updates);
      if (this.slots[index].chord) {
        if (updates.strumStyle) this.slots[index].chord.strumStyle = updates.strumStyle;
        if (updates.arpRate) this.slots[index].chord.arpRate = updates.arpRate;
      }
      if (updates.beats) {
        this.rebalanceSlotsToBeats();
      }
      if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    }
  }

  clearSlots() {
    this.slots = [];
    this.selectedSlotIndex = -1;
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
  }

  setSlotBeats(index, beats) {
    if (this.slots[index]) {
      this.slots[index].beats = Math.max(0.25, parseFloat(beats));
      this.rebalanceSlotsToBeats();
      if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    }
  }

  rebalanceSlotsToBeats() {
    let accumulatedBeat = 0;
    this.slots.forEach((slot) => {
      slot.startBeat = accumulatedBeat;
      slot.endBeat = accumulatedBeat + slot.beats;
      accumulatedBeat += slot.beats;
    });
    this.bars = Math.ceil(this.getTotalBars());
  }

  loadProgression(chordsList, beatsPerChord = 4) {
    this.slots = chordsList.map(ch => ({
      id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      chord: ch,
      beats: beatsPerChord,
      velocity: (ch && ch.velocity) ? ch.velocity : 90
    }));

    this.rebalanceSlotsToBeats();
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  async start() {
    await this.audio.init();

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0; // In 1/16th beats (0.25 beat steps)
    this.nextStepTime = this.audio.getCurrentTime() + 0.05;

    this.timerId = setInterval(() => this.scheduler(), this.lookaheadMs);
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentStep = 0;
    if (this.onBeatChange) this.onBeatChange(0, this.getTotalBeats(), 0, 0);
    if (this.onSlotActive) this.onSlotActive(-1);
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  scheduler() {
    const totalBeats = this.getTotalBeats();
    const secPerBeat = this.getSecondsPerBeat();
    const secPerStep = secPerBeat * 0.25; // 1 sixteenth note = 0.25 beat
    const totalSteps = Math.max(1, Math.round(totalBeats / 0.25));

    while (this.nextStepTime < this.audio.getCurrentTime() + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);

      this.nextStepTime += secPerStep;
      this.currentStep++;

      if (this.currentStep >= totalSteps) {
        if (this.isLooping) {
          this.currentStep = 0;
        } else {
          setTimeout(() => this.stop(), (this.nextStepTime - this.audio.getCurrentTime()) * 1000);
          break;
        }
      }
    }
  }

  scheduleStep(stepIdx, stepTime) {
    const totalBeats = this.getTotalBeats();
    const currentBeat = stepIdx * 0.25;
    const secPerBeat = this.getSecondsPerBeat();

    // 1. Metronome Click & LED Indicator on integer beats (every 4 sixteenths)
    if (stepIdx % 4 === 0) {
      const beatNumber = Math.round(currentBeat);
      const beatInBar = beatNumber % this.beatsPerBar;
      const isFirstBeatOfBar = (beatInBar === 0);

      if (this.isMetronomeOn) {
        this.audio.playMetronomeClick(isFirstBeatOfBar, stepTime);
      }

      const delayMs = Math.max(0, (stepTime - this.audio.getCurrentTime()) * 1000);
      setTimeout(() => {
        if (!this.isPlaying) return;
        if (this.onBeatChange) {
          this.onBeatChange(beatNumber, totalBeats, Math.floor(beatNumber / this.beatsPerBar), beatInBar);
        }
      }, delayMs);
    }

    // 2. Play Chord if a slot starts on this 1/16th step
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const slotStart = slot.startBeat % totalBeats;
      if (Math.abs(slotStart - currentBeat) < 0.12) {
        if (slot.chord && (slot.chord.midiNotes || slot.chord.rootName)) {
          const chordDuration = slot.beats * secPerBeat * 0.95;
          const vel = slot.velocity || slot.chord.velocity || 90;

          // Find next active chord in progression loop for walking bass passing note
          let nextChord = null;
          for (let j = 1; j < this.slots.length; j++) {
            const nextSlot = this.slots[(i + j) % this.slots.length];
            if (nextSlot && nextSlot.chord) {
              nextChord = nextSlot.chord;
              break;
            }
          }

          const slotStyle = slot.strumStyle || (slot.chord && slot.chord.strumStyle) || null;
          const slotRate = slot.arpRate || (slot.chord && slot.chord.arpRate) || null;
          this.audio.playChord(slot.chord, stepTime, chordDuration, vel, {
            beats: slot.beats,
            secPerBeat: secPerBeat,
            nextChord: nextChord,
            style: slotStyle,
            rate: slotRate
          });
        }
        break;
      }
    }

    // 3. Find currently active slot for UI highlight
    let currentHighlightedSlot = -1;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const slotStart = slot.startBeat % totalBeats;
      if (slotStart <= currentBeat + 0.05 && (currentBeat < slot.startBeat + slot.beats - 0.05)) {
        currentHighlightedSlot = i;
        break;
      }
    }

    const highlightDelayMs = Math.max(0, (stepTime - this.audio.getCurrentTime()) * 1000);
    setTimeout(() => {
      if (!this.isPlaying) return;
      if (this.onSlotActive) {
        this.onSlotActive(currentHighlightedSlot);
      }
    }, highlightDelayMs);
  }

  recordChord(chord) {
    if (!this.isRecording) return;

    if (this.isPlaying) {
      const totalBeats = this.getTotalBeats();
      const currentBeat = this.currentBeatIndex % totalBeats;

      let replaced = false;
      for (let i = 0; i < this.slots.length; i++) {
        const slot = this.slots[i];
        if (slot.startBeat <= currentBeat && currentBeat < slot.endBeat) {
          slot.chord = chord;
          replaced = true;
          break;
        }
      }
      if (!replaced) {
        this.addChord(chord, 2);
      }
      if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    } else {
      this.addChord(chord);
    }
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      isLooping: this.isLooping,
      isRecording: this.isRecording,
      isMetronomeOn: this.isMetronomeOn,
      bpm: this.bpm,
      bars: this.bars,
      beatsPerBar: this.beatsPerBar,
      slotsCount: this.slots.length
    };
  }
}

window.sixteenthsToFraction = sixteenthsToFraction;
window.beatsToFraction = beatsToFraction;
window.fractionToBeats = fractionToBeats;
window.Sequencer = Sequencer;

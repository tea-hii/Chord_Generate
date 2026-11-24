// Progression Sequencer, Precision Audio Clock, Looper, Recorder, and Fraction Lengths
// Built with Web Audio API lookahead scheduler to ensure zero drift / jitter

const DURATION_FRACTIONS = [
  { fraction: '1/16', beats: 0.25, label: '1/16 (Sixteenth Note)' },
  { fraction: '1/8',  beats: 0.5,  label: '1/8 (Eighth Note)' },
  { fraction: '3/16', beats: 0.75, label: '3/16 (Dotted Eighth)' },
  { fraction: '1/4',  beats: 1.0,  label: '1/4 (Quarter Note)' },
  { fraction: '3/8',  beats: 1.5,  label: '3/8 (Dotted Quarter)' },
  { fraction: '1/2',  beats: 2.0,  label: '1/2 (Half Note / 2/4)' },
  { fraction: '3/4',  beats: 3.0,  label: '3/4 (Dotted Half)' },
  { fraction: '4/4',  beats: 4.0,  label: '4/4 (Whole Note / 1 Bar)' },
  { fraction: '5/4',  beats: 5.0,  label: '5/4 (5 Beats)' },
  { fraction: '6/4',  beats: 6.0,  label: '6/4 (1.5 Bars)' },
  { fraction: '7/4',  beats: 7.0,  label: '7/4 (7 Beats)' },
  { fraction: '2',    beats: 8.0,  label: '2 (Double Note / 2 Bars)' },
];

function beatsToFraction(beats) {
  const match = DURATION_FRACTIONS.find(df => Math.abs(df.beats - beats) < 0.05);
  if (match) return match.fraction;
  // Fallback representation
  if (beats === 4) return '4/4';
  if (beats === 2) return '1/2';
  if (beats === 1) return '1/4';
  if (beats === 8) return '2';
  return `${beats}/4`;
}

function fractionToBeats(fraction) {
  const match = DURATION_FRACTIONS.find(df => df.fraction === fraction);
  if (match) return match.beats;
  if (fraction === '2') return 8.0;
  if (fraction.includes('/')) {
    const [num, den] = fraction.split('/').map(Number);
    if (!isNaN(num) && !isNaN(den) && den > 0) {
      return (num / den) * 4; // normalized to quarter notes in 4/4
    }
  }
  const parsed = parseFloat(fraction);
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
    return this.bars * this.beatsPerBar;
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
  addEmptySlot(beats = 4, velocity = 90) {
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
  }

  loadProgression(chordsList, beatsPerChord = 4) {
    this.slots = chordsList.map(ch => ({
      id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      chord: ch,
      beats: beatsPerChord,
      velocity: (ch && ch.velocity) ? ch.velocity : 90
    }));

    const totalBeats = chordsList.length * beatsPerChord;
    this.bars = Math.max(2, Math.ceil(totalBeats / this.beatsPerBar));

    this.rebalanceSlotsToBeats();
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  async start() {
    await this.audio.init();

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentBeatIndex = 0;
    this.nextBeatTime = this.audio.getCurrentTime() + 0.05;

    this.timerId = setInterval(() => this.scheduler(), this.lookaheadMs);
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentBeatIndex = 0;
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

    while (this.nextBeatTime < this.audio.getCurrentTime() + this.scheduleAheadTime) {
      this.scheduleBeat(this.currentBeatIndex, this.nextBeatTime);

      this.nextBeatTime += secPerBeat;
      this.currentBeatIndex++;

      if (this.currentBeatIndex >= totalBeats) {
        if (this.isLooping) {
          this.currentBeatIndex = 0;
        } else {
          setTimeout(() => this.stop(), (this.nextBeatTime - this.audio.getCurrentTime()) * 1000);
          break;
        }
      }
    }
  }

  scheduleBeat(beatIdx, beatTime) {
    const totalBeats = this.getTotalBeats();
    const beatInBar = beatIdx % this.beatsPerBar;
    const barIndex = Math.floor(beatIdx / this.beatsPerBar);
    const isFirstBeatOfBar = (beatInBar === 0);

    // 1. Metronome Click
    if (this.isMetronomeOn) {
      this.audio.playMetronomeClick(isFirstBeatOfBar, beatTime);
    }

    // 2. Play Chord if a slot starts on this beat
    const secPerBeat = this.getSecondsPerBeat();

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const slotStart = slot.startBeat % totalBeats;
      // Allow slight floating point tolerance for fractional beat starts
      if (Math.abs(slotStart - beatIdx) < 0.15) {
        if (slot.chord && slot.chord.midiNotes) {
          const chordDuration = slot.beats * secPerBeat * 0.95;
          const vel = slot.velocity || slot.chord.velocity || 90;
          this.audio.playChord(slot.chord, beatTime, chordDuration, vel);
        }
        break;
      }
    }

    // Find currently active slot for UI highlight
    let currentHighlightedSlot = -1;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const slotStart = slot.startBeat % totalBeats;
      if (slotStart <= beatIdx && (beatIdx < slot.startBeat + slot.beats)) {
        currentHighlightedSlot = i;
        break;
      }
    }

    const delayMs = Math.max(0, (beatTime - this.audio.getCurrentTime()) * 1000);
    setTimeout(() => {
      if (!this.isPlaying) return;
      if (this.onBeatChange) {
        this.onBeatChange(beatIdx, totalBeats, barIndex, beatInBar);
      }
      if (this.onSlotActive) {
        this.onSlotActive(currentHighlightedSlot);
      }
    }, delayMs);
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

window.DURATION_FRACTIONS = DURATION_FRACTIONS;
window.beatsToFraction = beatsToFraction;
window.fractionToBeats = fractionToBeats;
window.Sequencer = Sequencer;

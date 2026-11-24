// Progression Sequencer, Precision Audio Clock, Looper, Recorder, and Tap Tempo
// Built with Web Audio API lookahead scheduler to ensure zero drift / jitter

class Sequencer {
  constructor(audioEngine) {
    this.audio = audioEngine;

    // Timing config
    this.bpm = 100;
    this.beatsPerBar = 4;
    this.bars = 2; // Default 2 khuông nhạc as requested
    this.isPlaying = false;
    this.isLooping = true;
    this.isRecording = false;
    this.isMetronomeOn = true;

    // Progression slots: array of { chord: Object, beats: Number, bar: Number, beatInBar: Number }
    this.slots = [];
    this.selectedSlotIndex = -1;

    // Scheduling state
    this.lookaheadMs = 25.0; // How often to check for events (ms)
    this.scheduleAheadTime = 0.12; // How far ahead to schedule audio (seconds)
    this.timerId = null;
    this.currentBeatIndex = 0; // Current global beat index (0 .. totalBeats - 1)
    this.nextBeatTime = 0.0; // AudioContext time for the next beat

    // Tap tempo tracking
    this.tapTimes = [];
    this.lastTapTimestamp = 0;

    // Callbacks for UI updates
    this.onBeatChange = null; // (currentBeat, totalBeats, bar, beatInBar)
    this.onSlotActive = null; // (slotIndex)
    this.onSlotsUpdate = null; // (slots)
    this.onStateChange = null; // (state)
  }

  // Get total beats for current measures
  getTotalBeats() {
    return this.bars * this.beatsPerBar;
  }

  // Seconds per beat based on current BPM
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

  // Handle Tap Tempo button clicks
  tapTempo() {
    const now = performance.now();
    if (now - this.lastTapTimestamp > 2500) {
      // Reset if paused longer than 2.5 seconds
      this.tapTimes = [];
    }
    this.lastTapTimestamp = now;
    this.tapTimes.push(now);

    if (this.tapTimes.length > 5) {
      this.tapTimes.shift(); // Keep last 5 taps
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

  // Add a chord to the progression
  addChord(chord, beats = null) {
    const defaultBeats = beats || (this.beatsPerBar === 3 ? 3 : 4);
    
    // If a slot is explicitly selected, replace it
    if (this.selectedSlotIndex >= 0 && this.selectedSlotIndex < this.slots.length) {
      this.slots[this.selectedSlotIndex].chord = chord;
      if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
      return;
    }

    // Otherwise append new slot
    this.slots.push({
      id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      chord: chord,
      beats: defaultBeats
    });

    this.rebalanceSlotsToBeats();
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
  }

  // Remove a chord slot
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

  // Clear all slots
  clearSlots() {
    this.slots = [];
    this.selectedSlotIndex = -1;
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
  }

  // Set beats duration for a slot
  setSlotBeats(index, beats) {
    if (this.slots[index]) {
      this.slots[index].beats = Math.max(1, parseInt(beats, 10));
      this.rebalanceSlotsToBeats();
      if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    }
  }

  // Calculate start beats for each slot in the timeline
  rebalanceSlotsToBeats() {
    let accumulatedBeat = 0;
    this.slots.forEach((slot, idx) => {
      slot.startBeat = accumulatedBeat;
      slot.endBeat = accumulatedBeat + slot.beats;
      accumulatedBeat += slot.beats;
    });
  }

  // Load a full progression from chords array
  loadProgression(chordsList, beatsPerChord = 4) {
    this.slots = chordsList.map(ch => ({
      id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      chord: ch,
      beats: beatsPerChord
    }));

    // Auto-fit bars to contain all chords
    const totalBeats = chordsList.length * beatsPerChord;
    this.bars = Math.max(2, Math.ceil(totalBeats / this.beatsPerBar));

    this.rebalanceSlotsToBeats();
    if (this.onSlotsUpdate) this.onSlotsUpdate(this.slots);
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  // Start playback
  async start() {
    await this.audio.init();

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentBeatIndex = 0;
    this.nextBeatTime = this.audio.getCurrentTime() + 0.05;

    this.timerId = setInterval(() => this.scheduler(), this.lookaheadMs);
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  // Stop playback and reset
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

  // Toggle Play / Pause
  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  // Precision lookahead scheduling loop
  scheduler() {
    const totalBeats = this.getTotalBeats();
    const secPerBeat = this.getSecondsPerBeat();

    while (this.nextBeatTime < this.audio.getCurrentTime() + this.scheduleAheadTime) {
      this.scheduleBeat(this.currentBeatIndex, this.nextBeatTime);

      // Advance clock
      this.nextBeatTime += secPerBeat;
      this.currentBeatIndex++;

      // Handle loop or end
      if (this.currentBeatIndex >= totalBeats) {
        if (this.isLooping) {
          this.currentBeatIndex = 0;
        } else {
          // Reached end without loop
          setTimeout(() => this.stop(), (this.nextBeatTime - this.audio.getCurrentTime()) * 1000);
          break;
        }
      }
    }
  }

  // Schedule metronome click and chord triggering for a specific beat
  scheduleBeat(beatIdx, beatTime) {
    const totalBeats = this.getTotalBeats();
    const beatInBar = beatIdx % this.beatsPerBar;
    const barIndex = Math.floor(beatIdx / this.beatsPerBar);
    const isFirstBeatOfBar = (beatInBar === 0);

    // 1. Schedule Metronome Click
    if (this.isMetronomeOn) {
      this.audio.playMetronomeClick(isFirstBeatOfBar, beatTime);
    }

    // 2. Schedule Chord Triggering if a slot starts on this beat
    const secPerBeat = this.getSecondsPerBeat();
    let activeSlotIdx = -1;

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      // Check if slot starts at this beat (or looped back)
      const slotStart = slot.startBeat % totalBeats;
      if (slotStart === beatIdx) {
        const chordDuration = slot.beats * secPerBeat * 0.95;
        this.audio.playChord(slot.chord, beatTime, chordDuration);
        activeSlotIdx = i;
        break;
      }
    }

    // Find which slot is currently playing during this beat for UI highlight
    let currentHighlightedSlot = -1;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const slotStart = slot.startBeat % totalBeats;
      const slotEnd = (slot.startBeat + slot.beats) % totalBeats;
      if (slotStart <= beatIdx && (beatIdx < slot.startBeat + slot.beats)) {
        currentHighlightedSlot = i;
        break;
      }
    }

    // 3. UI sync update via setTimeout synchronized with Web Audio clock
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

  // When recording is active and user clicks a chord, assign to current or next slot
  recordChord(chord) {
    if (!this.isRecording) return;

    if (this.isPlaying) {
      // Live recording: find which slot corresponds to current beat or create one
      const totalBeats = this.getTotalBeats();
      const currentBeat = this.currentBeatIndex % totalBeats;

      // Find or insert slot
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
      // Step recording: just append chord
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

window.Sequencer = Sequencer;

// Main Application Orchestrator for ChordFlow
// Binds Theory, AudioEngine, Sequencer, CircleOfFifths, and DOM UI

document.addEventListener('DOMContentLoaded', () => {
  // Current app state
  const state = {
    selectedRoot: 'C',
    selectedMode: 'major',
    use7ths: false,
    currentScaleChords: [],
    borrowedChords: [],
    selectedSlotIdx: -1
  };

  // Instantiate core modules
  const audio = window.audioEngine;
  const sequencer = new Sequencer(audio);

  // Initialize Circle of Fifths
  const circle = new CircleOfFifths('circle-container', (newKey, newMode) => {
    state.selectedRoot = newKey;
    state.selectedMode = newMode;
    // Sync mode dropdown
    document.getElementById('scale-mode-select').value = newMode;
    updateKeyAndChords();
  });

  // DOM Elements
  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');
  const loopBtn = document.getElementById('loop-btn');
  const recordBtn = document.getElementById('record-btn');
  const metronomeToggle = document.getElementById('metronome-toggle');
  const tapBtn = document.getElementById('tap-tempo-btn');
  const tapBpmDisplay = document.getElementById('tap-bpm-display');
  const bpmSlider = document.getElementById('bpm-slider');
  const bpmInput = document.getElementById('bpm-input');
  const bpmMinusBtn = document.getElementById('bpm-minus');
  const bpmPlusBtn = document.getElementById('bpm-plus');
  const barsSelect = document.getElementById('bars-select');
  const timeSigSelect = document.getElementById('time-sig-select');
  const scaleModeSelect = document.getElementById('scale-mode-select');
  const chordsToggle7th = document.getElementById('toggle-7th');
  const chordPadsContainer = document.getElementById('chord-pads-container');
  const borrowedPadsContainer = document.getElementById('borrowed-pads-container');
  const timelineSlots = document.getElementById('timeline-slots');
  const presetsSelect = document.getElementById('presets-select');
  const exportMidiBtn = document.getElementById('export-midi-btn');
  const copyProgressionBtn = document.getElementById('copy-progression-btn');
  const clearProgressionBtn = document.getElementById('clear-progression-btn');
  const instrumentSelect = document.getElementById('instrument-select');
  const strumSelect = document.getElementById('strum-select');
  const masterVolumeSlider = document.getElementById('master-volume');
  const metronomeVolumeSlider = document.getElementById('metronome-volume');
  const currentKeyTitle = document.getElementById('current-key-title');
  const beatLeds = document.querySelectorAll('.beat-led');

  // Load Presets in Dropdown
  PROGRESSION_TEMPLATES.forEach((tpl, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${tpl.genre}: ${tpl.name}`;
    presetsSelect.appendChild(opt);
  });

  // 1. Update Key and Diatonic Chords
  function updateKeyAndChords() {
    const { chords, borrowed } = getScaleChords(state.selectedRoot, state.selectedMode, state.use7ths);
    state.currentScaleChords = chords;
    state.borrowedChords = borrowed;

    // Update Circle of Fifths
    circle.setKey(state.selectedRoot, state.selectedMode);

    // Update Header Display
    const modeName = SCALE_MODES[state.selectedMode] ? SCALE_MODES[state.selectedMode].name.split(' (')[0] : 'Trưởng';
    currentKeyTitle.textContent = `${state.selectedRoot} ${modeName}`;

    // Render Diatonic Chord Pads
    renderChordPads();
    renderBorrowedPads();
  }

  // Render 7 Scale Degree Chord Pads
  function renderChordPads() {
    chordPadsContainer.innerHTML = '';

    state.currentScaleChords.forEach((chord, idx) => {
      const pad = document.createElement('button');
      pad.className = 'chord-pad relative flex flex-col items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/80 text-left cursor-pointer shadow-md';
      pad.dataset.index = idx;

      // Color coding for function (Tonic = Indigo, Subdominant = Sky, Dominant = Amber, Diminished = Rose)
      let badgeColor = 'bg-slate-700 text-slate-300';
      if (idx === 0) badgeColor = 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/50';
      else if (idx === 3 || idx === 1) badgeColor = 'bg-sky-600/40 text-sky-300 border border-sky-500/50';
      else if (idx === 4) badgeColor = 'bg-amber-600/40 text-amber-300 border border-amber-500/50';
      else if (idx === 6) badgeColor = 'bg-rose-900/40 text-rose-300 border border-rose-800/50';

      const notesText = chord.midiNotes.slice(1).map(m => NOTE_NAMES[m % 12]).join(' - ');

      pad.innerHTML = `
        <div class="w-full flex items-center justify-between mb-1.5">
          <span class="text-xs px-2 py-0.5 rounded font-mono font-bold ${badgeColor}">${chord.degree}</span>
          <span class="text-[10px] text-slate-400 font-mono hidden sm:inline">[Phím ${idx + 1}]</span>
        </div>
        <div class="text-xl sm:text-2xl font-black text-white tracking-wide my-1">${chord.fullName}</div>
        <div class="text-[11px] text-slate-400 truncate w-full text-center mt-0.5">${notesText}</div>
        <div class="text-[10px] text-slate-500 truncate w-full text-center mt-0.5">${chord.functionName.split(' (')[0]}</div>
        <div class="mt-2.5 w-full pt-1.5 border-t border-slate-700/50 flex justify-between items-center text-[11px]">
          <span class="text-indigo-400 font-medium hover:text-indigo-300">Nghe thử</span>
          <span class="text-xs text-sky-400 font-semibold px-1.5 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900">+ Thêm</span>
        </div>
      `;

      // Click to play and add to progression
      pad.addEventListener('click', async (e) => {
        await audio.init();
        playChordWithPadAnimation(chord, pad);

        // If clicking "+ Thêm" or in record mode
        if (e.target.closest('span:last-child') || sequencer.isRecording) {
          sequencer.recordChord(chord);
        } else {
          // If no slots exist yet, auto add first chord
          if (sequencer.slots.length === 0) {
            sequencer.addChord(chord);
          }
        }
      });

      chordPadsContainer.appendChild(pad);
    });
  }

  // Render Borrowed Chords (Vay mượn bậc iv, bVII, bVI...)
  function renderBorrowedPads() {
    borrowedPadsContainer.innerHTML = '';
    if (!state.borrowedChords || state.borrowedChords.length === 0) {
      document.getElementById('borrowed-section').classList.add('hidden');
      return;
    }
    document.getElementById('borrowed-section').classList.remove('hidden');

    state.borrowedChords.forEach((chord) => {
      const pad = document.createElement('button');
      pad.className = 'chord-pad relative flex flex-col items-center justify-between p-3 rounded-lg border border-purple-800/40 bg-purple-950/30 hover:bg-purple-900/40 text-left cursor-pointer';
      
      pad.innerHTML = `
        <div class="w-full flex items-center justify-between mb-1">
          <span class="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-purple-900/60 text-purple-200">${chord.degree}</span>
          <span class="text-[10px] text-purple-300">Vay mượn</span>
        </div>
        <div class="text-lg font-bold text-white my-0.5">${chord.fullName}</div>
        <div class="text-[10px] text-purple-300/80 truncate w-full text-center">${chord.functionName}</div>
      `;

      pad.addEventListener('click', async () => {
        await audio.init();
        playChordWithPadAnimation(chord, pad);
        sequencer.recordChord(chord);
      });

      borrowedPadsContainer.appendChild(pad);
    });
  }

  // Helper to trigger audio and visual pad flash
  function playChordWithPadAnimation(chord, padElement) {
    audio.playChord(chord, null, 1.8);
    if (padElement) {
      padElement.classList.add('playing');
      setTimeout(() => padElement.classList.remove('playing'), 250);
    }
  }

  // 2. Render Progression Timeline Slots
  function renderTimelineSlots(slots) {
    timelineSlots.innerHTML = '';

    if (slots.length === 0) {
      timelineSlots.innerHTML = `
        <div class="w-full text-center py-8 text-slate-500 flex flex-col items-center justify-center">
          <p class="text-sm">Chưa có hợp âm nào trong vòng hòa thanh.</p>
          <p class="text-xs mt-1 text-slate-600">Bấm vào các hợp âm bậc I - VII ở dưới hoặc chọn một mẫu gợi ý để bắt đầu!</p>
        </div>
      `;
      return;
    }

    slots.forEach((slot, index) => {
      const barNum = Math.floor(slot.startBeat / sequencer.beatsPerBar) + 1;
      const beatInBar = (slot.startBeat % sequencer.beatsPerBar) + 1;

      const slotEl = document.createElement('div');
      slotEl.className = `slot-item relative flex-shrink-0 w-32 sm:w-36 p-3 rounded-xl border border-slate-700 bg-slate-800/90 flex flex-col justify-between transition-all shadow-md ${
        sequencer.selectedSlotIndex === index ? 'ring-2 ring-indigo-500' : ''
      }`;
      slotEl.dataset.index = index;

      slotEl.innerHTML = `
        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span class="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">Khuông ${barNum}</span>
          <button class="delete-slot-btn text-slate-500 hover:text-rose-400 p-0.5 rounded transition" title="Xóa hợp âm">✕</button>
        </div>
        
        <div class="text-center py-2 cursor-pointer hover:opacity-90">
          <div class="text-2xl font-black text-white tracking-wide">${slot.chord.fullName}</div>
          <div class="text-xs text-indigo-400 font-mono mt-0.5">${slot.chord.degree || ''}</div>
        </div>

        <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/60 text-xs">
          <div class="flex items-center space-x-1">
            <span class="text-[10px] text-slate-400">Dài:</span>
            <select class="slot-beats-select bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs px-1 py-0.5">
              <option value="1" ${slot.beats === 1 ? 'selected' : ''}>1 phách</option>
              <option value="2" ${slot.beats === 2 ? 'selected' : ''}>2 phách</option>
              <option value="3" ${slot.beats === 3 ? 'selected' : ''}>3 phách</option>
              <option value="4" ${slot.beats === 4 ? 'selected' : ''}>4 phách (1 ô)</option>
            </select>
          </div>
          <button class="play-single-slot-btn text-sky-400 hover:text-sky-300 text-xs" title="Nghe thử">▶</button>
        </div>
      `;

      // Select slot to replace
      slotEl.addEventListener('click', (e) => {
        if (e.target.closest('.delete-slot-btn') || e.target.closest('.slot-beats-select') || e.target.closest('.play-single-slot-btn')) return;
        sequencer.selectedSlotIndex = (sequencer.selectedSlotIndex === index) ? -1 : index;
        renderTimelineSlots(sequencer.slots);
      });

      // Delete Slot
      slotEl.querySelector('.delete-slot-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        sequencer.removeSlot(index);
      });

      // Change Beats Duration
      slotEl.querySelector('.slot-beats-select').addEventListener('change', (e) => {
        e.stopPropagation();
        sequencer.setSlotBeats(index, parseInt(e.target.value, 10));
      });

      // Play Single Slot
      slotEl.querySelector('.play-single-slot-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await audio.init();
        audio.playChord(slot.chord, null, slot.beats * sequencer.getSecondsPerBeat());
      });

      timelineSlots.appendChild(slotEl);
    });

    // Add Slot Placeholder (+) button at the end
    const addBtn = document.createElement('button');
    addBtn.className = 'flex-shrink-0 w-24 h-full min-h-[110px] rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 hover:bg-slate-800/40 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 transition cursor-pointer';
    addBtn.innerHTML = `
      <span class="text-2xl font-light">+</span>
      <span class="text-[11px] mt-1">Thêm ô</span>
    `;
    addBtn.addEventListener('click', () => {
      // Default add tonic chord
      const tonic = state.currentScaleChords[0];
      if (tonic) sequencer.addChord(tonic);
    });
    timelineSlots.appendChild(addBtn);
  }

  // 3. Sequencer Callbacks & UI Sync
  sequencer.onSlotsUpdate = (slots) => {
    renderTimelineSlots(slots);
  };

  sequencer.onSlotActive = (slotIndex) => {
    const slotElements = timelineSlots.querySelectorAll('.slot-item');
    slotElements.forEach((el, idx) => {
      if (idx === slotIndex) {
        el.classList.add('playing-slot');
      } else {
        el.classList.remove('playing-slot');
      }
    });
  };

  sequencer.onBeatChange = (beatIdx, totalBeats, barIndex, beatInBar) => {
    // Light up corresponding Beat LED
    beatLeds.forEach((led, idx) => {
      led.classList.remove('active-first', 'active-other');
      if (idx === beatInBar) {
        if (beatInBar === 0) {
          led.classList.add('active-first');
        } else {
          led.classList.add('active-other');
        }
      }
    });

    // Turn off LED after brief flash
    setTimeout(() => {
      beatLeds.forEach(led => led.classList.remove('active-first', 'active-other'));
    }, 120);
  };

  sequencer.onStateChange = (st) => {
    // Sync Play button icon & color
    if (st.isPlaying) {
      playBtn.innerHTML = `
        <svg class="w-5 h-5 mr-1 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        <span>Tạm dừng</span>
      `;
      playBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
      playBtn.classList.add('bg-amber-600', 'hover:bg-amber-500');
    } else {
      playBtn.innerHTML = `
        <svg class="w-5 h-5 mr-1 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        <span>Phát</span>
      `;
      playBtn.classList.remove('bg-amber-600', 'hover:bg-amber-500');
      playBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
    }

    // Loop button badge
    if (st.isLooping) {
      loopBtn.classList.add('bg-indigo-600/30', 'text-indigo-400', 'border-indigo-500');
      loopBtn.classList.remove('text-slate-400');
    } else {
      loopBtn.classList.remove('bg-indigo-600/30', 'text-indigo-400', 'border-indigo-500');
      loopBtn.classList.add('text-slate-400');
    }

    // Record button badge
    if (st.isRecording) {
      recordBtn.classList.add('bg-rose-600', 'text-white', 'animate-pulse');
      recordBtn.classList.remove('text-slate-400');
    } else {
      recordBtn.classList.remove('bg-rose-600', 'text-white', 'animate-pulse');
      recordBtn.classList.add('text-slate-400');
    }

    // BPM Slider & Input
    bpmSlider.value = st.bpm;
    bpmInput.value = st.bpm;
  };

  // 4. UI Event Listeners

  // Play / Pause
  playBtn.addEventListener('click', () => {
    sequencer.togglePlay();
  });

  // Stop
  stopBtn.addEventListener('click', () => {
    sequencer.stop();
  });

  // Loop toggle
  loopBtn.addEventListener('click', () => {
    sequencer.isLooping = !sequencer.isLooping;
    sequencer.onStateChange(sequencer.getState());
  });

  // Record toggle
  recordBtn.addEventListener('click', () => {
    sequencer.isRecording = !sequencer.isRecording;
    sequencer.onStateChange(sequencer.getState());
  });

  // Metronome toggle
  metronomeToggle.addEventListener('change', (e) => {
    sequencer.isMetronomeOn = e.target.checked;
  });

  // Tap Tempo button
  tapBtn.addEventListener('click', () => {
    const tappedBpm = sequencer.tapTempo();
    if (tappedBpm) {
      tapBpmDisplay.textContent = `${tappedBpm} BPM`;
      tapBpmDisplay.classList.add('text-emerald-400');
      setTimeout(() => tapBpmDisplay.classList.remove('text-emerald-400'), 400);
    }
  });

  // BPM Slider & Input
  bpmSlider.addEventListener('input', (e) => {
    sequencer.setBpm(e.target.value);
  });
  bpmInput.addEventListener('change', (e) => {
    sequencer.setBpm(e.target.value);
  });
  bpmMinusBtn.addEventListener('click', () => {
    sequencer.setBpm(sequencer.bpm - 1);
  });
  bpmPlusBtn.addEventListener('click', () => {
    sequencer.setBpm(sequencer.bpm + 1);
  });

  // Measures / Bars select (2, 4, 8)
  barsSelect.addEventListener('change', (e) => {
    sequencer.setBars(e.target.value);
  });

  // Time signature select (4/4, 3/4)
  timeSigSelect.addEventListener('change', (e) => {
    sequencer.setBeatsPerBar(e.target.value);
  });

  // Scale Mode selector
  scaleModeSelect.addEventListener('change', (e) => {
    state.selectedMode = e.target.value;
    updateKeyAndChords();
  });

  // 7th Chords toggle
  chordsToggle7th.addEventListener('change', (e) => {
    state.use7ths = e.target.checked;
    updateKeyAndChords();
  });

  // Sound Instrument Selector
  instrumentSelect.addEventListener('change', (e) => {
    audio.setInstrument(e.target.value);
  });

  // Strumming selector
  strumSelect.addEventListener('change', (e) => {
    audio.setStrumStyle(e.target.value);
  });

  // Volume Sliders
  masterVolumeSlider.addEventListener('input', (e) => {
    audio.setVolume(parseFloat(e.target.value));
  });
  metronomeVolumeSlider.addEventListener('input', (e) => {
    audio.setMetronomeVolume(parseFloat(e.target.value));
  });

  // Load Progression Preset
  presetsSelect.addEventListener('change', (e) => {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx)) return;
    const tpl = PROGRESSION_TEMPLATES[idx];
    if (!tpl) return;

    // Switch mode if needed
    if (tpl.mode && tpl.mode !== state.selectedMode) {
      state.selectedMode = tpl.mode;
      scaleModeSelect.value = tpl.mode;
    }
    if (tpl.use7ths !== undefined) {
      state.use7ths = tpl.use7ths;
      chordsToggle7th.checked = tpl.use7ths;
    }
    updateKeyAndChords();

    // Map degrees to chords
    const progressionChords = tpl.degrees.map(degIdx => state.currentScaleChords[degIdx]).filter(Boolean);
    sequencer.loadProgression(progressionChords, tpl.defaultBeats || 4);

    // Reset dropdown
    presetsSelect.value = '';
  });

  // Export to MIDI file (.mid)
  exportMidiBtn.addEventListener('click', () => {
    if (sequencer.slots.length === 0) {
      alert('Chưa có hợp âm nào để xuất MIDI!');
      return;
    }
    const filename = `chord-progression-${state.selectedRoot}-${state.selectedMode}.mid`;
    MidiWriter.download(sequencer.slots, sequencer.bpm, sequencer.beatsPerBar, filename);
  });

  // Copy Progression as Text
  copyProgressionBtn.addEventListener('click', () => {
    if (sequencer.slots.length === 0) return;
    const textProg = sequencer.slots.map(s => s.chord.fullName).join(' - ');
    navigator.clipboard.writeText(textProg).then(() => {
      const origText = copyProgressionBtn.innerHTML;
      copyProgressionBtn.innerHTML = `<span>✓ Đã sao chép!</span>`;
      setTimeout(() => copyProgressionBtn.innerHTML = origText, 1600);
    });
  });

  // Clear Progression
  clearProgressionBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ vòng hòa thanh hiện tại?')) {
      sequencer.clearSlots();
    }
  });

  // 5. Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Avoid triggering when focused on input/select
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    // Space: Play / Stop
    if (e.code === 'Space') {
      e.preventDefault();
      sequencer.togglePlay();
      return;
    }

    // Number keys 1-7: Play corresponding scale degree chord
    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= 7) {
      e.preventDefault();
      const chord = state.currentScaleChords[num - 1];
      if (chord) {
        const pads = chordPadsContainer.querySelectorAll('.chord-pad');
        const pad = pads[num - 1];
        audio.init();
        playChordWithPadAnimation(chord, pad);
        if (sequencer.isRecording) {
          sequencer.recordChord(chord);
        }
      }
      return;
    }

    // Key T: Tap Tempo
    if (e.key === 't' || e.key === 'T') {
      tapBtn.click();
      return;
    }

    // Key L: Toggle Loop
    if (e.key === 'l' || e.key === 'L') {
      loopBtn.click();
      return;
    }

    // Key R: Toggle Record
    if (e.key === 'r' || e.key === 'R') {
      recordBtn.click();
      return;
    }

    // Key M: Toggle Metronome
    if (e.key === 'm' || e.key === 'M') {
      metronomeToggle.checked = !metronomeToggle.checked;
      sequencer.isMetronomeOn = metronomeToggle.checked;
      return;
    }
  });

  // Initial load: Set C Major and load Pop 4 Chords preset by default
  updateKeyAndChords();
  const defaultProgression = [0, 4, 5, 3].map(deg => state.currentScaleChords[deg]); // C - G - Am - F
  sequencer.loadProgression(defaultProgression, 4);
});

// Main Application Orchestrator for ChordFlow
// Binds Theory, AudioEngine (General MIDI), Sequencer, PianoRollModal, SlotModal, Drag & Drop, and DOM UI

document.addEventListener('DOMContentLoaded', () => {
  // Current app state
  const state = {
    selectedRoot: 'C',
    selectedMode: 'major',
    use7ths: false,
    currentScaleChords: [],
    borrowedChords: []
  };

  // Instantiate core modules
  const audio = window.audioEngine;
  const sequencer = new Sequencer(audio);

  // Initialize Modals
  const pianoRoll = new PianoRollModal(audio, sequencer);
  const slotModal = new SlotModal(pianoRoll);

  // DOM Elements
  const rootKeyButtonsContainer = document.getElementById('root-key-buttons');
  const scaleModeSelect = document.getElementById('scale-mode-select');
  const chordsToggle7th = document.getElementById('toggle-7th');
  const currentKeyTitle = document.getElementById('current-key-title');
  const chordPadsContainer = document.getElementById('chord-pads-container');
  const borrowedPadsContainer = document.getElementById('borrowed-pads-container');
  const timelineSlots = document.getElementById('timeline-slots');

  // Transport & Metronome DOM Elements
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

  // Actions & Presets
  const presetsSelect = document.getElementById('presets-select');
  const exportMidiBtn = document.getElementById('export-midi-btn');
  const copyProgressionBtn = document.getElementById('copy-progression-btn');
  const clearProgressionBtn = document.getElementById('clear-progression-btn');
  const openPianoRollBtn = document.getElementById('open-pianoroll-btn');

  // Audio settings
  const instrumentSelect = document.getElementById('instrument-select');
  const strumSelect = document.getElementById('strum-select');
  const masterVolumeSlider = document.getElementById('master-volume');
  const metronomeVolumeSlider = document.getElementById('metronome-volume');
  const beatLeds = document.querySelectorAll('.beat-led');

  // 1. Populate Root Key Buttons (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
  const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  rootKeyButtonsContainer.innerHTML = '';
  rootNotes.forEach(note => {
    const btn = document.createElement('button');
    btn.className = `root-key-btn px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-bold text-xs hover:border-indigo-500 hover:text-white transition cursor-pointer ${
      note === state.selectedRoot ? 'active' : ''
    }`;
    btn.textContent = note;
    btn.dataset.note = note;
    btn.addEventListener('click', () => {
      state.selectedRoot = note;
      updateRootButtons();
      updateKeyAndChords();
    });
    rootKeyButtonsContainer.appendChild(btn);
  });

  function updateRootButtons() {
    const btns = rootKeyButtonsContainer.querySelectorAll('.root-key-btn');
    btns.forEach(btn => {
      if (btn.dataset.note === state.selectedRoot) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // 2. Populate General MIDI Instruments Dropdown
  instrumentSelect.innerHTML = '';
  const categories = {};
  GM_INSTRUMENTS.forEach(inst => {
    if (!categories[inst.category]) categories[inst.category] = [];
    categories[inst.category].push(inst);
  });

  for (const [catName, instList] of Object.entries(categories)) {
    const optGroup = document.createElement('optgroup');
    optGroup.label = catName;
    instList.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.id;
      opt.textContent = `${inst.icon} ${inst.name}`;
      optGroup.appendChild(opt);
    });
    instrumentSelect.appendChild(optGroup);
  }

  // 3. Populate Progression Presets
  PROGRESSION_TEMPLATES.forEach((tpl, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${tpl.genre}: ${tpl.name}`;
    presetsSelect.appendChild(opt);
  });

  // 4. Update Key and Diatonic Chords
  function updateKeyAndChords() {
    const { chords, borrowed } = getScaleChords(state.selectedRoot, state.selectedMode, state.use7ths);
    state.currentScaleChords = chords;
    state.borrowedChords = borrowed;

    // Update Header Display
    const modeName = SCALE_MODES[state.selectedMode] ? SCALE_MODES[state.selectedMode].name : 'Major';
    currentKeyTitle.textContent = `${state.selectedRoot} ${modeName}`;

    renderChordPads();
    renderBorrowedPads();
  }

  // Render Compact Chord Degree Pads with Drag & Drop capability
  function renderChordPads() {
    chordPadsContainer.innerHTML = '';

    state.currentScaleChords.forEach((chord, idx) => {
      const pad = document.createElement('div');
      pad.className = 'chord-pad relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border border-slate-700/80 bg-slate-800/90 hover:bg-slate-700/80 text-left cursor-grab shadow-sm transition';
      pad.dataset.index = idx;
      pad.setAttribute('draggable', 'true');

      let badgeColor = 'bg-slate-700 text-slate-300';
      if (idx === 0) badgeColor = 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/50';
      else if (idx === 3 || idx === 1) badgeColor = 'bg-sky-600/40 text-sky-300 border border-sky-500/50';
      else if (idx === 4) badgeColor = 'bg-amber-600/40 text-amber-300 border border-amber-500/50';
      else if (idx === 6) badgeColor = 'bg-rose-900/40 text-rose-300 border border-rose-800/50';

      const notesText = chord.midiNotes.slice(1).map(m => NOTE_NAMES[m % 12]).join(' ');

      pad.innerHTML = `
        <div class="w-full flex items-center justify-between mb-0.5 pointer-events-none">
          <span class="text-[11px] px-1.5 py-0.2 rounded font-mono font-bold ${badgeColor}">${chord.degree}</span>
          <span class="text-[10px] text-slate-400 font-mono hidden sm:inline">[${idx + 1}]</span>
        </div>
        <div class="flex items-baseline justify-between w-full my-0.5 pointer-events-none">
          <span class="text-lg sm:text-xl font-black text-white tracking-wide">${chord.fullName}</span>
          <span class="text-[10px] text-slate-400 font-mono">${notesText}</span>
        </div>
        <div class="w-full flex items-center justify-between text-[10px] pt-1 border-t border-slate-700/50 text-slate-400">
          <span class="truncate max-w-[90px] pointer-events-none">${chord.functionName}</span>
          <button type="button" class="text-sky-400 font-semibold hover:text-sky-300 add-chord-btn cursor-pointer">+ Add</button>
        </div>
      `;

      pad.addEventListener('click', async (e) => {
        await audio.init();
        playChordWithPadAnimation(chord, pad);

        if (e.target.classList.contains('add-chord-btn') || sequencer.isRecording) {
          sequencer.recordChord(chord);
        } else {
          // If an empty slot or any slot is selected, assign chord to it
          if (sequencer.selectedSlotIndex !== -1) {
            sequencer.addChord(chord);
          } else if (sequencer.slots.length === 0) {
            sequencer.addChord(chord);
          }
        }
      });

      // Drag and Drop Start
      pad.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(chord));
        e.dataTransfer.effectAllowed = 'copy';
        pad.classList.add('opacity-50');
      });

      pad.addEventListener('dragend', () => {
        pad.classList.remove('opacity-50');
      });

      chordPadsContainer.appendChild(pad);
    });
  }

  // Render Compact Borrowed Chords with Drag & Drop
  function renderBorrowedPads() {
    borrowedPadsContainer.innerHTML = '';
    const section = document.getElementById('borrowed-section');
    if (!state.borrowedChords || state.borrowedChords.length === 0) {
      if (section) section.classList.add('hidden');
      return;
    }
    if (section) section.classList.remove('hidden');

    state.borrowedChords.forEach((chord) => {
      const pad = document.createElement('div');
      pad.className = 'chord-pad relative flex items-center justify-between px-3 py-2 rounded-lg border border-purple-800/40 bg-purple-950/30 hover:bg-purple-900/40 text-left cursor-grab';
      pad.setAttribute('draggable', 'true');

      pad.innerHTML = `
        <div class="flex items-center space-x-2 pointer-events-none">
          <span class="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-purple-900/60 text-purple-200">${chord.degree}</span>
          <span class="text-sm font-bold text-white">${chord.fullName}</span>
        </div>
        <div class="text-[10px] text-purple-300/80 truncate max-w-[120px] hidden sm:block pointer-events-none">${chord.functionName}</div>
        <button type="button" class="text-xs text-purple-400 font-semibold add-borrowed-btn cursor-pointer">+ Add</button>
      `;

      pad.addEventListener('click', async (e) => {
        await audio.init();
        playChordWithPadAnimation(chord, pad);
        if (e.target.classList.contains('add-borrowed-btn') || sequencer.isRecording || sequencer.selectedSlotIndex !== -1) {
          sequencer.recordChord(chord);
        }
      });

      pad.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(chord));
        e.dataTransfer.effectAllowed = 'copy';
        pad.classList.add('opacity-50');
      });

      pad.addEventListener('dragend', () => {
        pad.classList.remove('opacity-50');
      });

      borrowedPadsContainer.appendChild(pad);
    });
  }

  function playChordWithPadAnimation(chord, padElement) {
    if (!chord) return;
    audio.playChord(chord, null, 1.8, chord.velocity || 90);
    if (padElement) {
      padElement.classList.add('playing');
      setTimeout(() => padElement.classList.remove('playing'), 220);
    }
  }

  // 5. Render Progression Timeline Slots (With Empty Slots, Trash Bin, Edit Pencil & Drag-and-Drop)
  function renderTimelineSlots(slots) {
    timelineSlots.innerHTML = '';

    if (slots.length === 0) {
      timelineSlots.innerHTML = `
        <div class="w-full text-center py-6 text-slate-500 flex flex-col items-center justify-center">
          <p class="text-sm">No chords in the progression track yet.</p>
          <p class="text-xs mt-1 text-slate-600">Click "+ Add Empty Slot" below, drag any chord onto it, or choose a preset!</p>
        </div>
      `;
    }

    slots.forEach((slot, index) => {
      const barNum = Math.floor(slot.startBeat / sequencer.beatsPerBar) + 1;
      const fractionStr = beatsToFraction(slot.beats);
      const isSelected = sequencer.selectedSlotIndex === index;
      const isEmpty = (slot.chord === null);

      const slotEl = document.createElement('div');
      slotEl.dataset.index = index;

      if (isEmpty) {
        // --- EMPTY CHORD SLOT ---
        slotEl.className = `slot-item empty-slot relative flex-shrink-0 w-32 sm:w-36 p-2.5 rounded-xl border-2 border-dashed border-slate-600 hover:border-indigo-400 bg-slate-900/70 flex flex-col justify-between transition shadow-sm ${
          isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
        }`;

        slotEl.innerHTML = `
          <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span class="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 text-[10px]">Bar ${barNum}</span>
            <div class="flex items-center space-x-1">
              <!-- Edit Pencil Button -->
              <button type="button" class="edit-slot-btn px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition cursor-pointer" title="Edit Duration (${fractionStr}) & Velocity">✏️ Edit</button>
              <!-- Delete Empty Slot Trash Bin -->
              <button type="button" class="delete-slot-btn px-1.5 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900 text-rose-400 text-[11px] transition cursor-pointer" title="Delete Empty Slot Entirely">🗑️</button>
            </div>
          </div>
          
          <div class="text-center py-2.5 cursor-pointer flex flex-col items-center justify-center select-none">
            <span class="text-2xl text-sky-400 font-light">+</span>
            <span class="text-[11px] text-sky-300 font-bold mt-0.5">Drop Chord Here</span>
            <span class="text-[9px] text-slate-500 mt-0.5">Drag from below or click</span>
          </div>

          <div class="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-800 text-[11px] text-slate-400">
            <!-- Duration Badge (Click to open edit modal) -->
            <button type="button" class="edit-duration-badge font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded text-sky-400 border border-slate-800 hover:bg-slate-800 transition cursor-pointer" title="Click to edit duration">
              ${fractionStr} ▾
            </button>
            <span class="text-[9px] text-slate-500 font-mono">Empty Slot</span>
          </div>
        `;
      } else {
        // --- FILLED CHORD SLOT ---
        slotEl.className = `slot-item relative flex-shrink-0 w-32 sm:w-36 p-2.5 rounded-xl border border-slate-700 bg-slate-800/90 flex flex-col justify-between transition-all shadow-md ${
          isSelected ? 'ring-2 ring-indigo-500' : ''
        }`;

        slotEl.innerHTML = `
          <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span class="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 text-[10px]">Bar ${barNum}</span>
            <div class="flex items-center space-x-1">
              <!-- Edit Pencil Button -->
              <button type="button" class="edit-slot-btn px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition cursor-pointer" title="Edit Duration (${fractionStr}) & Velocity">✏️</button>
              <!-- Trash Button: Clears chord from slot, KEEPING the slot empty in place -->
              <button type="button" class="clear-chord-btn px-1.5 py-0.5 rounded bg-amber-950/40 hover:bg-amber-900 text-amber-300 text-[11px] transition cursor-pointer" title="Clear chord (keep empty slot in place)">🗑️</button>
              <!-- Delete Entire Slot Button -->
              <button type="button" class="delete-slot-btn px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-white text-[11px] transition cursor-pointer" title="Remove slot completely">✕</button>
            </div>
          </div>
          
          <div class="play-chord-zone text-center py-1 cursor-pointer hover:opacity-90 select-none">
            <div class="text-xl sm:text-2xl font-black text-white tracking-wide">${slot.chord.fullName}</div>
            <div class="text-[11px] text-indigo-400 font-mono mt-0.5">${slot.chord.degree || ''}</div>
          </div>

          <div class="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-700/60 text-xs">
            <!-- Duration Badge (Click to open edit modal) -->
            <button type="button" class="edit-duration-badge font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded text-sky-400 border border-slate-800 hover:bg-slate-800 transition cursor-pointer" title="Click to edit duration">
              ${fractionStr} ▾
            </button>
            <button type="button" class="play-single-slot-btn text-sky-400 hover:text-sky-300 text-xs cursor-pointer font-bold px-1.5 py-0.5 rounded bg-sky-950/50" title="Preview Chord Audio">▶ Play</button>
          </div>
        `;
      }

      // 1. Click on slot
      slotEl.addEventListener('click', (e) => {
        if (e.target.closest('.delete-slot-btn') || e.target.closest('.clear-chord-btn') || e.target.closest('.edit-slot-btn') || e.target.closest('.edit-duration-badge') || e.target.closest('.play-single-slot-btn')) {
          return;
        }

        if (slot.chord) {
          audio.init().then(() => {
            audio.playChord(slot.chord, null, slot.beats * sequencer.getSecondsPerBeat(), slot.velocity || 90);
          });
        }

        sequencer.selectedSlotIndex = (sequencer.selectedSlotIndex === index) ? -1 : index;
        renderTimelineSlots(sequencer.slots);
      });

      // 2. Edit Pencil & Duration Badge click -> Open SlotModal
      const openEditModal = (e) => {
        e.stopPropagation();
        slotModal.open(
          index,
          slot,
          (slotIdx, updates) => {
            sequencer.updateSlot(slotIdx, updates);
          },
          (slotIdx) => {
            sequencer.clearSlotChord(slotIdx);
          },
          (slotIdx) => {
            sequencer.removeSlot(slotIdx);
          }
        );
      };

      const editBtn = slotEl.querySelector('.edit-slot-btn');
      if (editBtn) editBtn.addEventListener('click', openEditModal);

      const durationBadge = slotEl.querySelector('.edit-duration-badge');
      if (durationBadge) durationBadge.addEventListener('click', openEditModal);

      // 3. Clear Chord Trash Button (keeps slot empty in place)
      const clearChordBtn = slotEl.querySelector('.clear-chord-btn');
      if (clearChordBtn) {
        clearChordBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sequencer.clearSlotChord(index);
        });
      }

      // 4. Delete Slot Button (completely removes the slot)
      const deleteSlotBtn = slotEl.querySelector('.delete-slot-btn');
      if (deleteSlotBtn) {
        deleteSlotBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sequencer.removeSlot(index);
        });
      }

      // 5. Play Single Slot Audio Preview
      const playSingleBtn = slotEl.querySelector('.play-single-slot-btn');
      if (playSingleBtn && slot.chord) {
        playSingleBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await audio.init();
          audio.playChord(slot.chord, null, slot.beats * sequencer.getSecondsPerBeat(), slot.velocity || 90);
        });
      }

      // 6. Drag and Drop onto this Slot
      slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        slotEl.classList.add('drop-target-active');
      });

      slotEl.addEventListener('dragleave', () => {
        slotEl.classList.remove('drop-target-active');
      });

      slotEl.addEventListener('drop', async (e) => {
        e.preventDefault();
        slotEl.classList.remove('drop-target-active');
        try {
          const chordData = JSON.parse(e.dataTransfer.getData('application/json'));
          if (chordData && chordData.fullName) {
            slot.chord = chordData;
            sequencer.rebalanceSlotsToBeats();
            renderTimelineSlots(sequencer.slots);

            await audio.init();
            audio.playChord(chordData, null, slot.beats * sequencer.getSecondsPerBeat(), slot.velocity || 90);
          }
        } catch (err) {
          console.error('Drop error:', err);
        }
      });

      timelineSlots.appendChild(slotEl);
    });

    // 7. Add Empty Slot Button (+)
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'flex-shrink-0 w-28 h-full min-h-[100px] rounded-xl border border-dashed border-slate-700 hover:border-indigo-400 bg-slate-900/50 hover:bg-slate-800/60 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-300 transition cursor-pointer';
    addBtn.innerHTML = `
      <span class="text-xl font-light text-indigo-400">+</span>
      <span class="text-[11px] font-bold mt-0.5 text-indigo-300">Add Slot</span>
      <span class="text-[9px] text-slate-500">Empty Slot</span>
    `;
    addBtn.addEventListener('click', () => {
      sequencer.addEmptySlot(4.0, 90);
    });
    timelineSlots.appendChild(addBtn);
  }

  // 6. Sequencer Callbacks & UI Sync
  sequencer.onSlotsUpdate = (slots) => {
    renderTimelineSlots(slots);
    if (pianoRoll.isOpen) {
      pianoRoll.syncFromSequencer();
      pianoRoll.resizeAndDraw();
    }
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

    setTimeout(() => {
      beatLeds.forEach(led => led.classList.remove('active-first', 'active-other'));
    }, 120);
  };

  sequencer.onStateChange = (st) => {
    if (st.isPlaying) {
      playBtn.innerHTML = `
        <svg class="w-5 h-5 mr-1 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        <span>Pause</span>
      `;
      playBtn.classList.replace('bg-indigo-600', 'bg-amber-600');
    } else {
      playBtn.innerHTML = `
        <svg class="w-5 h-5 mr-1 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        <span>Play</span>
      `;
      playBtn.classList.replace('bg-amber-600', 'bg-indigo-600');
    }

    if (st.isLooping) {
      loopBtn.classList.add('bg-indigo-600/30', 'text-indigo-400', 'border-indigo-500');
      loopBtn.classList.remove('text-slate-400');
    } else {
      loopBtn.classList.remove('bg-indigo-600/30', 'text-indigo-400', 'border-indigo-500');
      loopBtn.classList.add('text-slate-400');
    }

    if (st.isRecording) {
      recordBtn.classList.add('bg-rose-600', 'text-white', 'animate-pulse');
      recordBtn.classList.remove('text-slate-400');
    } else {
      recordBtn.classList.remove('bg-rose-600', 'text-white', 'animate-pulse');
      recordBtn.classList.add('text-slate-400');
    }

    bpmSlider.value = st.bpm;
    bpmInput.value = st.bpm;

    if (pianoRoll.isOpen) {
      pianoRoll.syncPlayBtn();
      pianoRoll.syncLoopBtn();
    }
  };

  // 7. UI Event Listeners
  playBtn.addEventListener('click', () => sequencer.togglePlay());
  stopBtn.addEventListener('click', () => sequencer.stop());
  loopBtn.addEventListener('click', () => {
    sequencer.isLooping = !sequencer.isLooping;
    sequencer.onStateChange(sequencer.getState());
  });
  recordBtn.addEventListener('click', () => {
    sequencer.isRecording = !sequencer.isRecording;
    sequencer.onStateChange(sequencer.getState());
  });
  metronomeToggle.addEventListener('change', (e) => {
    sequencer.isMetronomeOn = e.target.checked;
  });

  tapBtn.addEventListener('click', () => {
    const tappedBpm = sequencer.tapTempo();
    if (tappedBpm) {
      tapBpmDisplay.textContent = `${tappedBpm} BPM`;
      tapBpmDisplay.classList.add('text-emerald-400');
      setTimeout(() => tapBpmDisplay.classList.remove('text-emerald-400'), 400);
    }
  });

  bpmSlider.addEventListener('input', (e) => sequencer.setBpm(e.target.value));
  bpmInput.addEventListener('change', (e) => sequencer.setBpm(e.target.value));
  bpmMinusBtn.addEventListener('click', () => sequencer.setBpm(sequencer.bpm - 1));
  bpmPlusBtn.addEventListener('click', () => sequencer.setBpm(sequencer.bpm + 1));
  barsSelect.addEventListener('change', (e) => sequencer.setBars(e.target.value));
  timeSigSelect.addEventListener('change', (e) => sequencer.setBeatsPerBar(e.target.value));

  scaleModeSelect.addEventListener('change', (e) => {
    state.selectedMode = e.target.value;
    updateKeyAndChords();
  });

  chordsToggle7th.addEventListener('change', (e) => {
    state.use7ths = e.target.checked;
    updateKeyAndChords();
  });

  instrumentSelect.addEventListener('change', (e) => {
    audio.setInstrument(e.target.value);
  });

  strumSelect.addEventListener('change', (e) => {
    audio.setStrumStyle(e.target.value);
  });

  masterVolumeSlider.addEventListener('input', (e) => {
    audio.setVolume(parseFloat(e.target.value));
  });
  metronomeVolumeSlider.addEventListener('input', (e) => {
    audio.setMetronomeVolume(parseFloat(e.target.value));
  });

  openPianoRollBtn.addEventListener('click', () => {
    pianoRoll.open();
  });

  presetsSelect.addEventListener('change', (e) => {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx)) return;
    const tpl = PROGRESSION_TEMPLATES[idx];
    if (!tpl) return;

    if (tpl.mode && tpl.mode !== state.selectedMode) {
      state.selectedMode = tpl.mode;
      scaleModeSelect.value = tpl.mode;
    }
    if (tpl.use7ths !== undefined) {
      state.use7ths = tpl.use7ths;
      chordsToggle7th.checked = tpl.use7ths;
    }
    updateKeyAndChords();

    const progressionChords = tpl.degrees.map(degIdx => ({ ...state.currentScaleChords[degIdx], velocity: 90 })).filter(Boolean);
    sequencer.loadProgression(progressionChords, tpl.defaultBeats || 4);
    presetsSelect.value = '';
  });

  exportMidiBtn.addEventListener('click', () => {
    const filledSlots = sequencer.slots.filter(s => s.chord !== null);
    if (filledSlots.length === 0) {
      alert('No chords available to export to MIDI!');
      return;
    }
    const filename = `chord-progression-${state.selectedRoot}-${state.selectedMode}.mid`;
    MidiWriter.download(sequencer.slots, sequencer.bpm, sequencer.beatsPerBar, filename);
  });

  copyProgressionBtn.addEventListener('click', () => {
    const filledSlots = sequencer.slots.filter(s => s.chord !== null);
    if (filledSlots.length === 0) return;
    const textProg = sequencer.slots.map(s => s.chord ? s.chord.fullName : '_').join(' - ');
    navigator.clipboard.writeText(textProg).then(() => {
      const origText = copyProgressionBtn.innerHTML;
      copyProgressionBtn.innerHTML = `<span>✓ Copied!</span>`;
      setTimeout(() => copyProgressionBtn.innerHTML = origText, 1600);
    });
  });

  clearProgressionBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the progression track?')) {
      sequencer.clearSlots();
    }
  });

  // 8. Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      sequencer.togglePlay();
      return;
    }

    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= state.currentScaleChords.length) {
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

    if (e.key === 't' || e.key === 'T') {
      tapBtn.click();
      return;
    }
    if (e.key === 'l' || e.key === 'L') {
      loopBtn.click();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      recordBtn.click();
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      metronomeToggle.checked = !metronomeToggle.checked;
      sequencer.isMetronomeOn = metronomeToggle.checked;
      return;
    }
  });

  // Initial setup: C Major with 1 filled chord (C) and 3 Empty Slots ready for dragging!
  updateRootButtons();
  updateKeyAndChords();

  const tonicChord = state.currentScaleChords[0];
  sequencer.slots = [
    {
      id: 'slot_init_1',
      chord: tonicChord ? { ...tonicChord, velocity: 90 } : null,
      beats: 4.0,
      velocity: 90
    },
    {
      id: 'slot_init_2',
      chord: null, // Empty Slot 2
      beats: 4.0,
      velocity: 90
    },
    {
      id: 'slot_init_3',
      chord: null, // Empty Slot 3
      beats: 4.0,
      velocity: 90
    },
    {
      id: 'slot_init_4',
      chord: null, // Empty Slot 4
      beats: 4.0,
      velocity: 90
    }
  ];
  sequencer.rebalanceSlotsToBeats();
  renderTimelineSlots(sequencer.slots);
});

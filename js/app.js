// Main Application Orchestrator for ChordFlow
// Binds Theory, AudioEngine (General MIDI), Sequencer, PianoRollModal, SlotModal, Drag & Drop, and DOM UI

document.addEventListener('DOMContentLoaded', () => {
  // Current app state
  const state = {
    selectedRoot: 'C',
    selectedMode: 'major',
    use7ths: false,
    currentScaleChords: [],
    borrowedChords: [],
    activeVariationIndex: null
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
  const chordVariationsDrawer = document.getElementById('chord-variations-drawer');
  const variationsDrawerTitle = document.getElementById('variations-drawer-title');
  const variationsExtContainer = document.getElementById('variations-ext-container');
  const variationsAdvContainer = document.getElementById('variations-adv-container');
  const closeVariationsBtn = document.getElementById('close-variations-btn');
  const borrowedPadsContainer = document.getElementById('borrowed-pads-container');
  const timelineSlots = document.getElementById('timeline-slots');

  // Transport & Metronome DOM Elements
  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');
  const loopBtn = document.getElementById('loop-btn');
  const metronomeToggle = document.getElementById('metronome-toggle');
  const tapBtn = document.getElementById('tap-tempo-btn');
  const tapBpmDisplay = document.getElementById('tap-bpm-display');
  const bpmSlider = document.getElementById('bpm-slider');
  const bpmInput = document.getElementById('bpm-input');
  const bpmMinusBtn = document.getElementById('bpm-minus');
  const bpmPlusBtn = document.getElementById('bpm-plus');
  const timeSigSelect = document.getElementById('time-sig-select');
  const totalBarsDisplay = document.getElementById('total-bars-display');
  const totalBeatsDisplay = document.getElementById('total-beats-display');
  const trackBarsBadge = document.getElementById('track-bars-badge');

  // Actions & Presets
  const presetsSelect = document.getElementById('presets-select');
  const exportMidiBtn = document.getElementById('export-midi-btn');
  const copyProgressionBtn = document.getElementById('copy-progression-btn');
  const clearProgressionBtn = document.getElementById('clear-progression-btn');
  const openPianoRollBtn = document.getElementById('open-pianoroll-btn');

  // Audio settings
  const instrumentSelect = document.getElementById('instrument-select');
  const strumSelect = document.getElementById('strum-select');
  const arpRateSelect = document.getElementById('arp-rate-select');
  const applyStyleAllBtn = document.getElementById('apply-style-all-btn');
  const masterVolumeSlider = document.getElementById('master-volume');
  const metronomeVolumeSlider = document.getElementById('metronome-volume');
  const beatLeds = document.querySelectorAll('.beat-led');

  // Minimalist 2D SVGs
  const SVG_PENCIL = `
    <svg class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="m15 5 4 4"/>
    </svg>
  `;

  const SVG_TRASH = `
    <svg class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <line x1="10" x2="10" y1="11" y2="17"/>
      <line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  `;

  const SVG_CLOSE = `
    <svg class="w-3 h-3 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;

  const SVG_DUPLICATE = `
    <svg class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  `;

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
  instrumentSelect.value = audio.instrument;
  if (strumSelect) strumSelect.value = audio.strumStyle;
  if (arpRateSelect) arpRateSelect.value = audio.arpRate;

  // 3. Populate Progression Presets (Compact clean labels to prevent overflow)
  PROGRESSION_TEMPLATES.forEach((tpl, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = tpl.name;
    presetsSelect.appendChild(opt);
  });

  // 4. Update Key and Diatonic Chords
  function updateKeyAndChords() {
    const { chords, borrowed } = getScaleChords(state.selectedRoot, state.selectedMode, state.use7ths);
    state.currentScaleChords = chords;
    state.borrowedChords = borrowed;

    const modeName = SCALE_MODES[state.selectedMode] ? SCALE_MODES[state.selectedMode].name : 'Major';
    currentKeyTitle.textContent = `${state.selectedRoot} ${modeName}`;

    state.activeVariationIndex = null;
    if (chordVariationsDrawer) chordVariationsDrawer.classList.add('hidden');

    renderChordPads();
    renderBorrowedPads();
  }

  function createVariationChip(chord, isAdv = false) {
    const chip = document.createElement('div');
    const colorCls = isAdv
      ? 'border-purple-700/60 bg-purple-950/40 hover:bg-purple-900/50 text-purple-100'
      : 'border-sky-700/60 bg-sky-950/40 hover:bg-sky-900/50 text-sky-100';
    chip.className = `chord-pad flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${colorCls} text-xs cursor-grab transition select-none`;
    chip.setAttribute('draggable', 'true');
    chip.title = `${chord.functionName || chord.fullName} — Click to preview or drag onto track`;

    chip.innerHTML = `
      <span class="text-[10px] font-mono opacity-75 pointer-events-none">${chord.degree}</span>
      <span class="font-bold text-white pointer-events-none">${chord.fullName}</span>
    `;

    chip.addEventListener('click', async () => {
      await audio.init();
      playChordWithPadAnimation(chord, chip);
    });

    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('application/json', JSON.stringify(chord));
      e.dataTransfer.effectAllowed = 'copy';
      chip.classList.add('opacity-50');
    });

    chip.addEventListener('dragend', () => {
      chip.classList.remove('opacity-50');
    });

    return chip;
  }

  function openChordVariationsDrawer(idx, baseChord) {
    if (!chordVariationsDrawer || !baseChord) return;
    state.activeVariationIndex = idx;

    // Highlight active pad
    chordPadsContainer.querySelectorAll('.chord-pad').forEach((el, i) => {
      if (i === idx) {
        el.classList.add('ring-2', 'ring-indigo-400', 'border-indigo-400');
      } else {
        el.classList.remove('ring-2', 'ring-indigo-400', 'border-indigo-400');
      }
    });

    const { extensions, advanced } = getChordVariations(baseChord, state.selectedRoot, state.selectedMode);
    if (variationsDrawerTitle) {
      variationsDrawerTitle.textContent = `${baseChord.degree} (${baseChord.fullName}) — Extended, Sus & Secondary Variations`;
    }

    if (variationsExtContainer) {
      variationsExtContainer.innerHTML = '';
      extensions.forEach(v => variationsExtContainer.appendChild(createVariationChip(v, false)));
    }
    if (variationsAdvContainer) {
      variationsAdvContainer.innerHTML = '';
      advanced.forEach(v => variationsAdvContainer.appendChild(createVariationChip(v, true)));
    }

    chordVariationsDrawer.classList.remove('hidden');
  }

  if (closeVariationsBtn) {
    closeVariationsBtn.addEventListener('click', () => {
      state.activeVariationIndex = null;
      if (chordVariationsDrawer) chordVariationsDrawer.classList.add('hidden');
      chordPadsContainer.querySelectorAll('.chord-pad').forEach(el => {
        el.classList.remove('ring-2', 'ring-indigo-400', 'border-indigo-400');
      });
    });
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
          <span class="text-[10px] text-slate-400 font-mono hidden sm:inline">[${idx + 1}] ▾</span>
        </div>
        <div class="flex items-baseline justify-between w-full my-0.5 pointer-events-none">
          <span class="text-lg sm:text-xl font-black text-white tracking-wide">${chord.fullName}</span>
          <span class="text-[10px] text-slate-400 font-mono">${notesText}</span>
        </div>
        <div class="w-full flex items-center justify-between text-[10px] pt-1 border-t border-slate-700/50 text-slate-400 pointer-events-none">
          <span class="truncate">${chord.functionName}</span>
        </div>
      `;

      pad.addEventListener('click', async () => {
        await audio.init();
        playChordWithPadAnimation(chord, pad);
        openChordVariationsDrawer(idx, chord);
      });

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
        <div class="text-[10px] text-purple-300/80 truncate max-w-[140px] hidden sm:block pointer-events-none">${chord.functionName}</div>
      `;

      pad.addEventListener('click', async () => {
        await audio.init();
        playChordWithPadAnimation(chord, pad);
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
    const secPerBeat = sequencer ? sequencer.getSecondsPerBeat() : 0.6;
    audio.playChord(chord, null, 2.2, chord.velocity || 90, {
      beats: 4.0,
      secPerBeat: secPerBeat
    });
    if (padElement) {
      padElement.classList.add('playing');
      setTimeout(() => padElement.classList.remove('playing'), 220);
    }
  }

  // Helper to format short picking style badges on chord cards
  function getStyleBadge(style) {
    switch (style) {
      case 'fingerstyle': return '🎸 Ballad';
      case 'strum': return '🎸 Strum';
      case 'walking_bass': return '🚶 Walking';
      case 'piano_arpeggio': return '🎹 Arp';
      case 'flamenco': return '✨ Flamenco';
      case 'slow_soul': return '🎶 Soul';
      case 'bossa_funk': return '⚡ Bossa';
      case 'ambient_lofi': return '🌊 Lofi';
      case 'travis_picking': return '🤠 Travis';
      case 'classical_alberti': return '🎼 Alberti';
      case 'waltz_34': return '💃 Waltz';
      case 'jazz_comping': return '🎷 Jazz';
      case 'reggae_skank': return '🌴 Reggae';
      case 'cinematic_swell': return '🎬 Pulse';
      case 'chachacha': return '💃 ChaCha';
      case 'techno': return '⚡ Techno';
      case 'bedroom_pop': return '🎧 BedPop';
      case 'synthwave': return '🌆 Synth80s';
      case 'funk_disco': return '🪩 Disco';
      case 'neo_soul': return '🎹 NeoSoul';
      case 'vn_bolero': return '🇻🇳 Bolero';
      case 'vn_slow_rock': return '🎸 Slow6/8';
      case 'vn_boston': return '🥀 Boston';
      case 'vn_dan_tranh': return '🌾 DanTranh';
      case 'vn_vinahouse': return '🔊 Vina';
      case 'block': return '⏹️ Block';
      default: return '🎸 Ballad';
    }
  }

  // 5. Render Progression Timeline Slots (With 2D Minimalist Icons, Empty Slots & 1/16th Grid)
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
      const effectiveStyle = slot.strumStyle || (slot.chord && slot.chord.strumStyle) || audio.strumStyle;
      const effectiveRate = slot.arpRate || (slot.chord && slot.chord.arpRate) || audio.arpRate;
      const styleBadge = getStyleBadge(effectiveStyle);
      const rateBadge = (effectiveRate && effectiveRate !== 'auto' && effectiveRate !== 'inherit') ? ` · ${effectiveRate}` : '';

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
              <!-- Minimalist 2D Pencil Edit Button -->
              <button type="button" class="edit-slot-btn p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center" title="Edit Duration (${fractionStr}) & Velocity">
                ${SVG_PENCIL}
              </button>
              <!-- Minimalist 2D Trash Bin Delete Slot Button -->
              <button type="button" class="delete-slot-btn p-1 rounded bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-rose-200 transition cursor-pointer flex items-center justify-center" title="Delete Empty Slot Entirely">
                ${SVG_TRASH}
              </button>
            </div>
          </div>
          
          <div class="text-center py-2.5 cursor-pointer flex flex-col items-center justify-center select-none">
            <span class="text-2xl text-sky-400 font-light">+</span>
            <span class="text-[11px] text-sky-300 font-bold mt-0.5">Drop Chord Here</span>
            <span class="text-[9px] text-slate-500 mt-0.5">Drag from below or click</span>
          </div>

          <div class="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-800 text-[11px] text-slate-400">
            <button type="button" class="edit-duration-badge font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded text-sky-400 border border-slate-800 hover:bg-slate-800 transition cursor-pointer" title="Click to edit duration">
              ${fractionStr} ▾
            </button>
            <span class="text-[9px] text-slate-500 font-mono">Empty Slot</span>
          </div>
        `;
      } else {
        // --- FILLED CHORD SLOT (Draggable between slots) ---
        slotEl.className = `slot-item relative flex-shrink-0 w-32 sm:w-36 p-2.5 rounded-xl border border-slate-700 bg-slate-800/90 flex flex-col justify-between transition-all shadow-md cursor-grab ${
          isSelected ? 'ring-2 ring-indigo-500' : ''
        }`;
        slotEl.setAttribute('draggable', 'true');

        slotEl.innerHTML = `
          <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <div class="flex items-center space-x-1">
              <span class="font-mono bg-slate-950 px-1 py-0.5 rounded text-indigo-300 text-[10px]">B${barNum}</span>
              <span class="text-[9px] px-1 py-0.5 rounded bg-indigo-950/80 text-indigo-300 font-mono border border-indigo-800/50 truncate max-w-[78px]" title="Picking Style: ${styleBadge}${rateBadge}">${styleBadge}${rateBadge}</span>
            </div>
            <div class="flex items-center space-x-1">
              <!-- Minimalist 2D Pencil Edit Button -->
              <button type="button" class="edit-slot-btn p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center" title="Edit Duration (${fractionStr}), Style & Velocity">
                ${SVG_PENCIL}
              </button>
              <!-- Minimalist 2D Trash Button: Clears chord from slot, KEEPING the slot empty in place -->
              <button type="button" class="clear-chord-btn p-1 rounded bg-amber-950/40 hover:bg-amber-900 text-amber-300 transition cursor-pointer flex items-center justify-center" title="Clear chord (keep empty slot in place)">
                ${SVG_TRASH}
              </button>
              <!-- Minimalist 2D Duplicate Button: Appends a copy of this chord to the end -->
              <button type="button" class="duplicate-slot-btn p-1 rounded bg-indigo-950/50 hover:bg-indigo-600 text-indigo-300 hover:text-white transition cursor-pointer flex items-center justify-center" title="Duplicate chord to end of progression">
                ${SVG_DUPLICATE}
              </button>
            </div>
          </div>
          
          <div class="play-chord-zone text-center py-1 cursor-pointer hover:opacity-90 select-none">
            <div class="text-xl sm:text-2xl font-black text-white tracking-wide">${slot.chord.fullName}</div>
            <div class="text-[11px] text-indigo-400 font-mono mt-0.5">${slot.chord.degree || ''}</div>
          </div>

          <div class="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-700/60 text-xs">
            <button type="button" class="edit-duration-badge font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded text-sky-400 border border-slate-800 hover:bg-slate-800 transition cursor-pointer" title="Click to edit duration">
              ${fractionStr} ▾
            </button>
            <button type="button" class="play-single-slot-btn text-sky-400 hover:text-sky-300 text-xs cursor-pointer font-bold px-1.5 py-0.5 rounded bg-sky-950/50" title="Preview Chord Audio">▶ Play</button>
          </div>
        `;
      }

      // 1. Click on slot
      slotEl.addEventListener('click', (e) => {
        if (e.target.closest('.delete-slot-btn') || e.target.closest('.duplicate-slot-btn') || e.target.closest('.clear-chord-btn') || e.target.closest('.edit-slot-btn') || e.target.closest('.edit-duration-badge') || e.target.closest('.play-single-slot-btn')) {
          return;
        }

        if (slot.chord) {
          audio.init().then(() => {
            let nextChord = null;
            for (let j = 1; j < sequencer.slots.length; j++) {
              const nextSlot = sequencer.slots[(index + j) % sequencer.slots.length];
              if (nextSlot && nextSlot.chord) {
                nextChord = nextSlot.chord;
                break;
              }
            }
            const slotStyle = slot.strumStyle || (slot.chord && slot.chord.strumStyle) || null;
            const slotRate = slot.arpRate || (slot.chord && slot.chord.arpRate) || null;
            audio.playChord(slot.chord, null, slot.beats * sequencer.getSecondsPerBeat(), slot.velocity || 90, {
              beats: slot.beats,
              secPerBeat: sequencer.getSecondsPerBeat(),
              nextChord: nextChord,
              style: slotStyle,
              rate: slotRate
            });
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

      // 4. Delete Empty Slot Button (completely removes empty slot)
      const deleteSlotBtn = slotEl.querySelector('.delete-slot-btn');
      if (deleteSlotBtn) {
        deleteSlotBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sequencer.removeSlot(index);
        });
      }

      // 4b. Duplicate Chord Button (appends copy to end of progression)
      const duplicateSlotBtn = slotEl.querySelector('.duplicate-slot-btn');
      if (duplicateSlotBtn) {
        duplicateSlotBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sequencer.duplicateSlot(index);
        });
      }

      // 4c. Drag Start / End for moving filled chords between slots
      if (!isEmpty) {
        slotEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('application/json', JSON.stringify({
            __fromSlotIndex: index,
            chord: slot.chord
          }));
          e.dataTransfer.effectAllowed = 'move';
          slotEl.classList.add('opacity-50');
        });

        slotEl.addEventListener('dragend', () => {
          slotEl.classList.remove('opacity-50');
        });
      }

      // 5. Play Single Slot Audio Preview
      const playSingleBtn = slotEl.querySelector('.play-single-slot-btn');
      if (playSingleBtn && slot.chord) {
        playSingleBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await audio.init();
          let nextChord = null;
          for (let j = 1; j < sequencer.slots.length; j++) {
            const nextSlot = sequencer.slots[(index + j) % sequencer.slots.length];
            if (nextSlot && nextSlot.chord) {
              nextChord = nextSlot.chord;
              break;
            }
          }
          audio.playChord(slot.chord, null, slot.beats * sequencer.getSecondsPerBeat(), slot.velocity || 90, {
            beats: slot.beats,
            secPerBeat: sequencer.getSecondsPerBeat(),
            nextChord: nextChord,
            style: slot.strumStyle || (slot.chord && slot.chord.strumStyle) || null,
            rate: slot.arpRate || (slot.chord && slot.chord.arpRate) || null
          });
        });
      }

      // 6. Drag and Drop onto this Slot (from Chord Pads OR moved from another Slot)
      slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        slotEl.classList.add('drop-target-active');
      });

      slotEl.addEventListener('dragleave', () => {
        slotEl.classList.remove('drop-target-active');
      });

      slotEl.addEventListener('drop', async (e) => {
        e.preventDefault();
        slotEl.classList.remove('drop-target-active');
        try {
          const payload = JSON.parse(e.dataTransfer.getData('application/json'));
          if (payload && payload.__fromSlotIndex !== undefined) {
            // Move or swap chord between Progression Track slots
            const srcIdx = payload.__fromSlotIndex;
            if (srcIdx === index) return;
            sequencer.moveOrSwapSlotChord(srcIdx, index);
            const movedSlot = sequencer.slots[index];
            if (movedSlot && movedSlot.chord) {
              await audio.init();
              audio.playChord(movedSlot.chord, null, movedSlot.beats * sequencer.getSecondsPerBeat(), movedSlot.velocity || 90, {
                beats: movedSlot.beats,
                secPerBeat: sequencer.getSecondsPerBeat(),
                style: movedSlot.strumStyle || (movedSlot.chord && movedSlot.chord.strumStyle) || null,
                rate: movedSlot.arpRate || (movedSlot.chord && movedSlot.chord.arpRate) || null
              });
            }
          } else if (payload && payload.fullName) {
            slot.chord = payload;
            sequencer.rebalanceSlotsToBeats();
            renderTimelineSlots(sequencer.slots);

            await audio.init();
            let nextChord = null;
            for (let j = 1; j < sequencer.slots.length; j++) {
              const nextSlot = sequencer.slots[(index + j) % sequencer.slots.length];
              if (nextSlot && nextSlot.chord) {
                nextChord = nextSlot.chord;
                break;
              }
            }
            audio.playChord(payload, null, slot.beats * sequencer.getSecondsPerBeat(), slot.velocity || 90, {
              beats: slot.beats,
              secPerBeat: sequencer.getSecondsPerBeat(),
              nextChord: nextChord,
              style: slot.strumStyle || (slot.chord && slot.chord.strumStyle) || null,
              rate: slot.arpRate || (slot.chord && slot.chord.arpRate) || null
            });
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

  // 6. Update Total Progression Length (Sum of slot lengths in bars and beats)
  function updateTotalProgressionLength() {
    const totalBeats = sequencer.getTotalBeats();
    const beatsPerBar = sequencer.beatsPerBar || 4;
    const totalBars = totalBeats / beatsPerBar;

    let formattedBars;
    if (Number.isInteger(totalBars)) {
      formattedBars = `${totalBars}.0 ${totalBars === 1 ? 'Bar' : 'Bars'}`;
    } else {
      formattedBars = `${parseFloat(totalBars.toFixed(3))} Bars`;
    }

    const beatsStr = `${totalBeats % 1 === 0 ? totalBeats : totalBeats.toFixed(2)} beats`;

    if (totalBarsDisplay) totalBarsDisplay.textContent = formattedBars;
    if (totalBeatsDisplay) totalBeatsDisplay.textContent = `(${beatsStr})`;
    if (trackBarsBadge) trackBarsBadge.textContent = `${formattedBars} (${beatsStr})`;
  }

  // 7. Sequencer Callbacks & UI Sync
  sequencer.onSlotsUpdate = (slots) => {
    renderTimelineSlots(slots);
    updateTotalProgressionLength();
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

    bpmSlider.value = st.bpm;
    bpmInput.value = st.bpm;

    if (pianoRoll.isOpen) {
      pianoRoll.syncPlayBtn();
      pianoRoll.syncLoopBtn();
    }
  };

  // 8. UI Event Listeners
  playBtn.addEventListener('click', () => sequencer.togglePlay());
  stopBtn.addEventListener('click', () => sequencer.stop());
  loopBtn.addEventListener('click', () => {
    sequencer.isLooping = !sequencer.isLooping;
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
  timeSigSelect.addEventListener('change', (e) => {
    sequencer.setBeatsPerBar(e.target.value);
    updateTotalProgressionLength();
  });

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

  function applyStyleToAllSlots(selectedStyle, selectedRate) {
    audio.setStrumStyle(selectedStyle);
    if (selectedRate !== undefined) {
      audio.setArpRate(selectedRate);
    }
    const rateToApply = selectedRate !== undefined ? selectedRate : (arpRateSelect ? arpRateSelect.value : 'auto');
    sequencer.slots.forEach(s => {
      s.strumStyle = selectedStyle;
      s.arpRate = rateToApply;
      if (s.chord) {
        s.chord.strumStyle = selectedStyle;
        s.chord.arpRate = rateToApply;
      }
    });
    renderTimelineSlots(sequencer.slots);
  }

  strumSelect.addEventListener('change', (e) => {
    applyStyleToAllSlots(e.target.value, arpRateSelect ? arpRateSelect.value : 'auto');
  });

  if (arpRateSelect) {
    arpRateSelect.addEventListener('change', (e) => {
      applyStyleToAllSlots(strumSelect.value, e.target.value);
    });
  }

  if (applyStyleAllBtn) {
    applyStyleAllBtn.addEventListener('click', () => {
      applyStyleToAllSlots(strumSelect.value, arpRateSelect ? arpRateSelect.value : 'auto');
      const originalHtml = applyStyleAllBtn.innerHTML;
      applyStyleAllBtn.innerHTML = `
        <svg class="w-3.5 h-3.5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span class="text-[11px] font-semibold text-emerald-300">Done!</span>
      `;
      applyStyleAllBtn.classList.add('border-emerald-500/60', 'bg-emerald-500/10');
      setTimeout(() => {
        applyStyleAllBtn.innerHTML = originalHtml;
        applyStyleAllBtn.classList.remove('border-emerald-500/60', 'bg-emerald-500/10');
      }, 1000);
    });
  }

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
      chord: null,
      beats: 4.0,
      velocity: 90
    },
    {
      id: 'slot_init_3',
      chord: null,
      beats: 4.0,
      velocity: 90
    },
    {
      id: 'slot_init_4',
      chord: null,
      beats: 4.0,
      velocity: 90
    }
  ];
  sequencer.rebalanceSlotsToBeats();
  renderTimelineSlots(sequencer.slots);
  updateTotalProgressionLength();
});

// Piano Roll / MIDI Grid Visualizer and Editor (FL Studio & FL Studio Mobile Mode)
// Features: Left Click Draw/Move, Right Click Delete, Edge Drag Resize, Tool Palette, Snap, and Multiple Exit Paths

class PianoRollModal {
  constructor(audioEngine, sequencer) {
    this.audio = audioEngine;
    this.sequencer = sequencer;

    this.isOpen = false;
    this.modalEl = null;
    this.canvasEl = null;
    this.ctx = null;
    this.keysContainer = null;
    this.gridContainer = null;
    this.playheadEl = null;
    this.rulerEl = null;
    this.statusCoordEl = null;

    // Pitch Range: MIDI 36 (C2) to MIDI 84 (C6) -> 49 notes
    this.minMidi = 36;
    this.maxMidi = 84;
    this.numNotes = this.maxMidi - this.minMidi + 1;

    // Grid Dimensions
    this.noteHeight = 18; // Height per pitch row in px
    this.pixelsPerBeat = 80; // Width per beat in px
    this.keyWidth = 56; // Width of piano keys on the left

    // Interactive notes list
    this.customNotes = [];

    // FL Studio Editing State
    this.currentTool = 'draw'; // 'draw', 'erase', 'select'
    this.snapDivision = 0.25; // 1/16 beat = 0.25; 1/8 beat = 0.5; 1/4 = 1.0
    this.isDragging = false;
    this.dragMode = null; // 'move', 'resize', 'create', 'erase_brush'
    this.draggedNote = null;
    this.dragStartPos = { x: 0, y: 0, rawBeat: 0, midi: 0 };
    this.noteOriginalState = { startBeat: 0, duration: 0, midi: 0 };

    // Animation frame for smooth playhead
    this.animFrameId = null;

    this.buildModal();
    this.bindEvents();
  }

  buildModal() {
    this.modalEl = document.createElement('div');
    this.modalEl.id = 'pianoroll-modal';
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md hidden select-none';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-6xl h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/90 gap-2">
          
          <!-- Left: Title & Subtitle -->
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold">
              🎹
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                MIDI Piano Roll Editor
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">FL Studio Mode</span>
              </h3>
              <p class="text-[11px] text-slate-400 hidden sm:block">Left Click = Draw/Move | Right Click = Erase | Drag Right Edge = Stretch</p>
            </div>
          </div>

          <!-- Center: FL Studio Tool Selection & Snap Controls -->
          <div class="flex items-center flex-wrap gap-1.5 text-xs">
            
            <!-- Tool Buttons (Draw, Erase, Move) -->
            <div class="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5" role="group">
              <button id="pr-tool-draw" type="button" class="pr-tool-btn px-2.5 py-1 rounded-md font-bold text-xs transition cursor-pointer bg-indigo-600 text-white shadow" title="Pencil: Click to add notes, drag body to move, drag right edge to stretch">
                ✏️ Draw
              </button>
              <button id="pr-tool-erase" type="button" class="pr-tool-btn px-2.5 py-1 rounded-md font-bold text-xs text-slate-400 hover:text-white transition cursor-pointer" title="Eraser: Click on any note to delete it (or Right Click anytime)">
                🗑️ Erase
              </button>
              <button id="pr-tool-select" type="button" class="pr-tool-btn px-2.5 py-1 rounded-md font-bold text-xs text-slate-400 hover:text-white transition cursor-pointer" title="Select / Move: Drag notes across the grid">
                ↔️ Move
              </button>
            </div>

            <!-- Grid Snap Selector -->
            <div class="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
              <span class="text-slate-400 font-medium text-[11px]">Snap:</span>
              <select id="pr-snap-select" class="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs">
                <option value="0.25" selected class="bg-slate-900">1/16</option>
                <option value="0.5" class="bg-slate-900">1/8</option>
                <option value="1.0" class="bg-slate-900">1/4 (Beat)</option>
                <option value="2.0" class="bg-slate-900">1/2 (2 Beats)</option>
                <option value="4.0" class="bg-slate-900">1 Bar</option>
              </select>
            </div>

            <!-- Transport Play & Loop -->
            <button id="pr-play-btn" class="flex items-center space-x-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer shadow-sm">
              <span>▶ Play</span>
            </button>
            <button id="pr-loop-btn" class="px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-medium hover:border-indigo-500 transition cursor-pointer" title="Toggle Loop">
              🔁 Loop
            </button>
            <button id="pr-refresh-btn" class="px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer" title="Reset from chord slots">
              🔄 Reset
            </button>
          </div>

          <!-- Top-Right: BIG UNMISSABLE EXIT BUTTON -->
          <div class="flex items-center space-x-2">
            <button id="pr-close-btn" class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition cursor-pointer" title="Exit Piano Roll (or press ESC)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>✕ Exit</span>
            </button>
          </div>

        </div>

        <!-- Toolbar Legend Bar -->
        <div class="flex items-center justify-between px-4 py-1.5 bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400">
          <div class="flex items-center space-x-3">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-2.5 rounded bg-indigo-500 inline-block"></span>
              <span>Chord Voices</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-2.5 rounded bg-emerald-400 inline-block"></span>
              <span>Bass Notes</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-0.5 h-3 bg-rose-500 inline-block"></span>
              <span>Playhead Laser</span>
            </span>
          </div>
          <div class="text-[11px] text-slate-400 hidden sm:block">
            <span>FL Studio: Right-click note to delete | Drag right edge to stretch duration</span>
          </div>
        </div>

        <!-- Main Piano Roll Body: Left Keys + Scrollable Canvas -->
        <div class="relative flex-1 flex overflow-hidden bg-slate-950">
          
          <!-- Left Piano Keyboard Column -->
          <div id="pr-piano-keys" class="flex-shrink-0 w-14 bg-slate-900 border-r border-slate-700 select-none overflow-hidden relative shadow-lg z-10"></div>

          <!-- Right Grid Area -->
          <div id="pr-grid-container" class="flex-1 relative overflow-auto custom-scrollbar">
            <!-- Time ruler header -->
            <div id="pr-ruler" class="sticky top-0 z-20 h-6 bg-slate-900/95 border-b border-slate-700 flex items-center font-mono text-[10px] text-slate-400"></div>

            <!-- Canvas Grid -->
            <canvas id="pr-canvas" class="block cursor-crosshair"></canvas>

            <!-- Playhead cursor overlay line -->
            <div id="pr-playhead" class="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-[0_0_12px_2px_#f43f5e] pointer-events-none z-30 hidden"></div>
          </div>

        </div>

        <!-- Bottom Action Bar / Footer with Status and Done & Apply Button -->
        <div class="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950/90 text-xs">
          <div class="flex items-center space-x-3 text-slate-400 text-[11px]">
            <span id="pr-status-coord" class="font-mono text-indigo-300 font-semibold">Ready</span>
            <span class="hidden md:inline text-slate-500">| Press ESC or click Exit to return</span>
          </div>

          <div class="flex items-center space-x-2">
            <button id="pr-clear-btn" class="px-2.5 py-1 rounded-lg border border-slate-700 hover:border-rose-600 bg-slate-800/80 text-rose-400 hover:text-white font-semibold transition cursor-pointer text-xs">
              🗑️ Clear Grid
            </button>
            <button id="pr-done-btn" class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30 text-xs">
              <span>✓ Done & Apply (ESC)</span>
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(this.modalEl);

    this.canvasEl = this.modalEl.querySelector('#pr-canvas');
    this.ctx = this.canvasEl.getContext('2d');
    this.keysContainer = this.modalEl.querySelector('#pr-piano-keys');
    this.gridContainer = this.modalEl.querySelector('#pr-grid-container');
    this.playheadEl = this.modalEl.querySelector('#pr-playhead');
    this.rulerEl = this.modalEl.querySelector('#pr-ruler');
    this.statusCoordEl = this.modalEl.querySelector('#pr-status-coord');
  }

  bindEvents() {
    // 1. Exit Buttons (Top-Right Exit, Bottom Done, Backdrop Click)
    const closeBtn = this.modalEl.querySelector('#pr-close-btn');
    closeBtn.addEventListener('click', () => this.close());

    const doneBtn = this.modalEl.querySelector('#pr-done-btn');
    doneBtn.addEventListener('click', () => this.close());

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    // 2. Escape Key & Space Bar in Piano Roll
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        this.close();
        e.preventDefault();
      } else if (e.code === 'Space') {
        this.sequencer.togglePlay();
        this.syncPlayBtn();
        e.preventDefault();
      }
    });

    // 3. FL Studio Tool Palette
    const toolDrawBtn = this.modalEl.querySelector('#pr-tool-draw');
    const toolEraseBtn = this.modalEl.querySelector('#pr-tool-erase');
    const toolSelectBtn = this.modalEl.querySelector('#pr-tool-select');
    const toolBtns = [toolDrawBtn, toolEraseBtn, toolSelectBtn];

    const setTool = (toolName, activeBtn) => {
      this.currentTool = toolName;
      toolBtns.forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow');
        btn.classList.add('text-slate-400');
      });
      activeBtn.classList.remove('text-slate-400');
      activeBtn.classList.add('bg-indigo-600', 'text-white', 'shadow');
      this.updateStatusCoord(`Selected Tool: ${toolName.toUpperCase()}`);
    };

    toolDrawBtn.addEventListener('click', () => setTool('draw', toolDrawBtn));
    toolEraseBtn.addEventListener('click', () => setTool('erase', toolEraseBtn));
    toolSelectBtn.addEventListener('click', () => setTool('select', toolSelectBtn));

    // 4. Snap Selector
    const snapSelect = this.modalEl.querySelector('#pr-snap-select');
    snapSelect.addEventListener('change', (e) => {
      this.snapDivision = parseFloat(e.target.value) || 0.25;
      this.updateStatusCoord(`Snap: ${snapSelect.options[snapSelect.selectedIndex].text}`);
    });

    // 5. Transport Controls
    const playBtn = this.modalEl.querySelector('#pr-play-btn');
    playBtn.addEventListener('click', () => {
      this.sequencer.togglePlay();
      this.syncPlayBtn();
    });

    const loopBtn = this.modalEl.querySelector('#pr-loop-btn');
    loopBtn.addEventListener('click', () => {
      this.sequencer.isLooping = !this.sequencer.isLooping;
      this.syncLoopBtn();
    });

    // 6. Reset & Clear Buttons
    const refreshBtn = this.modalEl.querySelector('#pr-refresh-btn');
    refreshBtn.addEventListener('click', () => {
      this.syncFromSequencer();
      this.resizeAndDraw();
      this.updateStatusCoord('Synchronized from progression track chords');
    });

    const clearBtn = this.modalEl.querySelector('#pr-clear-btn');
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all notes on the MIDI grid?')) {
        this.customNotes = [];
        this.draw();
        this.syncToSequencer();
        this.updateStatusCoord('Grid cleared');
      }
    });

    // 7. Synchronized Vertical Scrolling between Piano Keys and Grid
    this.gridContainer.addEventListener('scroll', () => {
      this.keysContainer.scrollTop = this.gridContainer.scrollTop;
    });

    // 8. FL Studio Canvas Pointer Events (PointerDown, PointerMove, PointerUp, ContextMenu)
    this.canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvasEl.addEventListener('pointerdown', (e) => {
      this.canvasEl.setPointerCapture(e.pointerId);
      this.handlePointerDown(e);
    });

    this.canvasEl.addEventListener('pointermove', (e) => {
      this.handlePointerMove(e);
    });

    this.canvasEl.addEventListener('pointerup', (e) => {
      this.canvasEl.releasePointerCapture(e.pointerId);
      this.handlePointerUp();
    });

    this.canvasEl.addEventListener('pointercancel', () => {
      this.handlePointerUp();
    });
  }

  updateStatusCoord(text) {
    if (this.statusCoordEl) {
      this.statusCoordEl.textContent = text;
    }
  }

  getCanvasCoords(e) {
    const rect = this.canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rowIndex = Math.floor(y / this.noteHeight);
    const midi = this.maxMidi - rowIndex;
    const rawBeat = x / this.pixelsPerBeat;
    return { x, y, midi, rawBeat };
  }

  findNoteAt(rawBeat, midi) {
    return this.customNotes.find(note => {
      if (note.midi !== midi) return false;
      return rawBeat >= note.startBeat && rawBeat <= note.startBeat + note.duration;
    });
  }

  findNoteRightEdge(rawBeat, midi, x) {
    return this.customNotes.find(note => {
      if (note.midi !== midi) return false;
      const noteEndX = (note.startBeat + note.duration) * this.pixelsPerBeat;
      return Math.abs(x - noteEndX) <= 10;
    });
  }

  async handlePointerDown(e) {
    const { x, y, midi, rawBeat } = this.getCanvasCoords(e);
    if (midi < this.minMidi || midi > this.maxMidi || rawBeat < 0) return;

    await this.audio.init();

    // FL Studio Signature: Right Click on note deletes it instantly!
    if (e.button === 2) {
      const note = this.findNoteAt(rawBeat, midi);
      if (note) {
        this.deleteNote(note);
      }
      this.dragMode = 'erase_brush';
      this.isDragging = true;
      return;
    }

    // Left Click (button === 0)
    if (e.button === 0) {
      // 1. If Erase tool active:
      if (this.currentTool === 'erase') {
        const note = this.findNoteAt(rawBeat, midi);
        if (note) {
          this.deleteNote(note);
        }
        this.dragMode = 'erase_brush';
        this.isDragging = true;
        return;
      }

      // 2. Check if clicking on existing note's right edge -> Stretch Resize
      const edgeNote = this.findNoteRightEdge(rawBeat, midi, x);
      if (edgeNote) {
        this.draggedNote = edgeNote;
        this.dragMode = 'resize';
        this.isDragging = true;
        this.dragStartPos = { x, y, rawBeat, midi };
        this.noteOriginalState = { ...edgeNote };
        this.canvasEl.style.cursor = 'ew-resize';
        return;
      }

      // 3. Check if clicking on existing note's body -> Move note in time/pitch
      const bodyNote = this.findNoteAt(rawBeat, midi);
      if (bodyNote) {
        this.draggedNote = bodyNote;
        this.dragMode = 'move';
        this.isDragging = true;
        this.dragStartPos = { x, y, rawBeat, midi };
        this.noteOriginalState = { ...bodyNote };
        this.canvasEl.style.cursor = 'grabbing';
        this.audio.playNote(bodyNote.midi, null, 0.8, bodyNote.velocity || 90);
        return;
      }

      // 4. Otherwise: clicking empty cell in Draw mode -> Create note and allow dragging duration!
      if (this.currentTool === 'draw' || this.currentTool === 'select') {
        const quantizedBeat = Math.floor(rawBeat / this.snapDivision) * this.snapDivision;
        const newNote = {
          id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          midi: midi,
          startBeat: quantizedBeat,
          duration: this.snapDivision >= 1.0 ? this.snapDivision : 1.0,
          velocity: 95,
          isBass: midi < 48
        };
        this.customNotes.push(newNote);
        this.draggedNote = newNote;
        this.dragMode = 'create';
        this.isDragging = true;
        this.dragStartPos = { x, y, rawBeat: quantizedBeat, midi };
        this.noteOriginalState = { ...newNote };
        this.audio.playNote(midi, null, 1.0, 95);
        this.draw();
        this.syncToSequencer();
        this.updateStatusCoord(`Created Note: ${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1} at Beat ${quantizedBeat}`);
      }
    }
  }

  handlePointerMove(e) {
    const { x, y, midi, rawBeat } = this.getCanvasCoords(e);

    // If dragging active:
    if (this.isDragging) {
      if (this.dragMode === 'erase_brush') {
        const note = this.findNoteAt(rawBeat, midi);
        if (note) {
          this.deleteNote(note);
        }
        return;
      }

      if ((this.dragMode === 'resize' || this.dragMode === 'create') && this.draggedNote) {
        const deltaBeat = rawBeat - this.draggedNote.startBeat;
        const newDuration = Math.max(this.snapDivision, Math.round(deltaBeat / this.snapDivision) * this.snapDivision);
        this.draggedNote.duration = newDuration;
        this.draw();
        this.updateStatusCoord(`Stretch Duration: ${newDuration} Beats (${beatsToFraction(newDuration)})`);
        return;
      }

      if (this.dragMode === 'move' && this.draggedNote) {
        const beatDelta = Math.round((rawBeat - this.dragStartPos.rawBeat) / this.snapDivision) * this.snapDivision;
        const midiDelta = midi - this.dragStartPos.midi;

        const newStartBeat = Math.max(0, this.noteOriginalState.startBeat + beatDelta);
        const newMidi = Math.max(this.minMidi, Math.min(this.maxMidi, this.noteOriginalState.midi + midiDelta));

        if (this.draggedNote.startBeat !== newStartBeat || this.draggedNote.midi !== newMidi) {
          this.draggedNote.startBeat = newStartBeat;
          if (this.draggedNote.midi !== newMidi) {
            this.draggedNote.midi = newMidi;
            this.draggedNote.isBass = newMidi < 48;
            this.audio.playNote(newMidi, null, 0.4, 90);
          }
          this.draw();
          this.updateStatusCoord(`Move Note: ${NOTE_NAMES[newMidi % 12]}${Math.floor(newMidi / 12) - 1} | Beat ${newStartBeat}`);
        }
        return;
      }
    }

    // Hover feedback when not dragging
    if (this.currentTool === 'erase') {
      this.canvasEl.style.cursor = 'not-allowed';
      return;
    }

    const edgeNote = this.findNoteRightEdge(rawBeat, midi, x);
    if (edgeNote) {
      this.canvasEl.style.cursor = 'ew-resize';
      this.updateStatusCoord(`Stretch note right edge: ${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`);
      return;
    }

    const bodyNote = this.findNoteAt(rawBeat, midi);
    if (bodyNote) {
      this.canvasEl.style.cursor = 'grab';
      this.updateStatusCoord(`Note: ${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1} | Range: ${bodyNote.startBeat} - ${(bodyNote.startBeat + bodyNote.duration).toFixed(2)} beats`);
      return;
    }

    this.canvasEl.style.cursor = 'crosshair';
    const pc = (midi % 12 + 12) % 12;
    const oct = Math.floor(midi / 12) - 1;
    this.updateStatusCoord(`Pitch: ${NOTE_NAMES[pc]}${oct} (MIDI ${midi}) | Beat ${rawBeat.toFixed(2)}`);
  }

  handlePointerUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragMode = null;
      this.draggedNote = null;
      this.syncToSequencer();
      this.draw();
      this.canvasEl.style.cursor = 'crosshair';
    }
  }

  deleteNote(note) {
    const idx = this.customNotes.findIndex(n => n.id === note.id);
    if (idx !== -1) {
      this.customNotes.splice(idx, 1);
      this.draw();
      this.syncToSequencer();
      this.updateStatusCoord(`Deleted note`);
    }
  }

  syncFromSequencer() {
    this.customNotes = [];

    this.sequencer.slots.forEach(slot => {
      if (!slot.chord || !slot.chord.midiNotes) return;
      const startBeat = slot.startBeat;
      const durationBeats = slot.beats;
      const vel = slot.chord.velocity || 90;

      slot.chord.midiNotes.forEach((midi, idx) => {
        const isBass = idx === 0;
        this.customNotes.push({
          id: 'note_' + Math.random().toString(36).substr(2, 6),
          midi: midi,
          startBeat: startBeat,
          duration: durationBeats,
          velocity: vel,
          isBass: isBass,
          chordName: slot.chord.fullName
        });
      });
    });
  }

  syncToSequencer() {
    if (!this.sequencer || !this.sequencer.slots) return;

    this.sequencer.slots.forEach(slot => {
      // Find all custom notes belonging to this slot's time window
      const slotNotes = this.customNotes.filter(n => {
        const center = n.startBeat + n.duration * 0.1;
        return center >= slot.startBeat && center < slot.endBeat;
      });

      if (slotNotes.length > 0) {
        const uniquePitches = [...new Set(slotNotes.map(n => n.midi))].sort((a, b) => a - b);
        if (slot.chord) {
          slot.chord.midiNotes = uniquePitches;
        }
      }
    });

    if (window.renderTimelineSlots) {
      window.renderTimelineSlots(this.sequencer.slots);
    }
  }

  open() {
    this.isOpen = true;
    this.modalEl.classList.remove('hidden');
    this.syncFromSequencer();
    this.renderPianoKeys();
    this.resizeAndDraw();
    this.syncPlayBtn();
    this.syncLoopBtn();
    this.startPlayheadAnimation();

    const middleY = (this.maxMidi - 60) * this.noteHeight;
    this.gridContainer.scrollTop = Math.max(0, middleY - 150);
  }

  close() {
    this.isOpen = false;
    this.modalEl.classList.add('hidden');
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.syncToSequencer();
  }

  syncPlayBtn() {
    const playBtn = this.modalEl.querySelector('#pr-play-btn');
    if (this.sequencer.isPlaying) {
      playBtn.innerHTML = '<span>⏸ Pause</span>';
      playBtn.classList.replace('bg-indigo-600', 'bg-amber-600');
    } else {
      playBtn.innerHTML = '<span>▶ Play</span>';
      playBtn.classList.replace('bg-amber-600', 'bg-indigo-600');
    }
  }

  syncLoopBtn() {
    const loopBtn = this.modalEl.querySelector('#pr-loop-btn');
    if (this.sequencer.isLooping) {
      loopBtn.classList.add('bg-indigo-600/30', 'text-indigo-400', 'border-indigo-500');
    } else {
      loopBtn.classList.remove('bg-indigo-600/30', 'text-indigo-400', 'border-indigo-500');
    }
  }

  renderPianoKeys() {
    this.keysContainer.innerHTML = '';
    const totalHeight = this.numNotes * this.noteHeight;
    this.keysContainer.style.height = `${totalHeight}px`;

    const blackNoteIndices = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

    for (let midi = this.maxMidi; midi >= this.minMidi; midi--) {
      const pitchClass = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const isBlack = blackNoteIndices.includes(pitchClass);
      const noteName = NOTE_NAMES[pitchClass];

      const keyEl = document.createElement('div');
      keyEl.className = `flex items-center justify-end pr-1.5 text-[9px] font-mono border-b border-slate-800 transition cursor-pointer select-none ${
        isBlack ? 'bg-slate-950 text-slate-400 hover:bg-slate-800' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold'
      }`;
      keyEl.style.height = `${this.noteHeight}px`;

      keyEl.textContent = (pitchClass === 0 || isBlack) ? `${noteName}${octave}` : (pitchClass === 0 ? `C${octave}` : '');

      keyEl.addEventListener('pointerdown', async () => {
        await this.audio.init();
        this.audio.playNote(midi, null, 1.2, 95);
        keyEl.classList.add('bg-indigo-600', 'text-white');
        setTimeout(() => keyEl.classList.remove('bg-indigo-600', 'text-white'), 200);
      });

      this.keysContainer.appendChild(keyEl);
    }
  }

  resizeAndDraw() {
    const totalBeats = Math.max(8, this.sequencer.getTotalBeats());
    const totalWidth = totalBeats * this.pixelsPerBeat;
    const totalHeight = this.numNotes * this.noteHeight;

    this.canvasEl.width = totalWidth;
    this.canvasEl.height = totalHeight;
    this.canvasEl.style.width = `${totalWidth}px`;
    this.canvasEl.style.height = `${totalHeight}px`;

    this.renderRuler(totalBeats);
    this.draw();
  }

  renderRuler(totalBeats) {
    this.rulerEl.innerHTML = '';
    const beatsPerBar = this.sequencer.beatsPerBar;
    const totalBars = Math.ceil(totalBeats / beatsPerBar);

    for (let b = 0; b < totalBars; b++) {
      const barEl = document.createElement('div');
      barEl.className = 'border-r border-slate-700 px-2 flex-shrink-0 flex items-center font-bold text-indigo-300';
      barEl.style.width = `${beatsPerBar * this.pixelsPerBeat}px`;
      barEl.textContent = `Bar ${b + 1}`;
      this.rulerEl.appendChild(barEl);
    }
  }

  draw() {
    if (!this.ctx) return;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    const totalBeats = Math.max(8, this.sequencer.getTotalBeats());
    const beatsPerBar = this.sequencer.beatsPerBar;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Draw Background Rows for Pitch Keys
    const blackNoteIndices = [1, 3, 6, 8, 10];
    for (let midi = this.maxMidi; midi >= this.minMidi; midi--) {
      const rowIndex = this.maxMidi - midi;
      const y = rowIndex * this.noteHeight;
      const pc = midi % 12;
      const isBlack = blackNoteIndices.includes(pc);

      this.ctx.fillStyle = isBlack ? '#090d16' : '#111827';
      this.ctx.fillRect(0, y, w, this.noteHeight);

      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + this.noteHeight);
      this.ctx.lineTo(w, y + this.noteHeight);
      this.ctx.stroke();

      if (pc === 0) {
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y + this.noteHeight);
        this.ctx.lineTo(w, y + this.noteHeight);
        this.ctx.stroke();
      }
    }

    // 2. Draw Vertical Grid Lines (Quarter Notes and 16th/8th Subdivisions)
    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = beat * this.pixelsPerBeat;
      const isBarStart = (beat % beatsPerBar === 0);

      // Subdivisions (1/8 notes)
      if (beat < totalBeats) {
        const subX = x + this.pixelsPerBeat / 2;
        this.ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(subX, 0);
        this.ctx.lineTo(subX, h);
        this.ctx.stroke();
      }

      this.ctx.strokeStyle = isBarStart ? '#475569' : '#1e293b';
      this.ctx.lineWidth = isBarStart ? 1.5 : 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    // 3. Draw MIDI Note Blocks with FL Studio rounded gradient and resize handle
    this.customNotes.forEach(note => {
      if (note.midi < this.minMidi || note.midi > this.maxMidi) return;

      const rowIndex = this.maxMidi - note.midi;
      const x = note.startBeat * this.pixelsPerBeat;
      const y = rowIndex * this.noteHeight + 1.5;
      const noteW = Math.max(6, note.duration * this.pixelsPerBeat - 2);
      const noteH = this.noteHeight - 3;

      const gradient = this.ctx.createLinearGradient(x, y, x + noteW, y);
      if (note.isBass) {
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#059669');
      } else {
        gradient.addColorStop(0, '#38bdf8');
        gradient.addColorStop(1, '#6366f1');
      }

      this.ctx.fillStyle = gradient;
      this.ctx.strokeStyle = note.isBass ? '#34d399' : '#818cf8';
      this.ctx.lineWidth = 1;

      this.roundRect(this.ctx, x, y, noteW, noteH, 3, true, true);

      // Right edge resize grip highlight
      if (noteW > 14) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.fillRect(x + noteW - 4, y + 2, 2, noteH - 4);
      }

      // Pitch label inside note block
      if (noteW > 24) {
        const pc = (note.midi % 12 + 12) % 12;
        const oct = Math.floor(note.midi / 12) - 1;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px sans-serif';
        this.ctx.fillText(`${NOTE_NAMES[pc]}${oct}`, x + 4, y + noteH - 3.5);
      }
    });
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  startPlayheadAnimation() {
    const animate = () => {
      if (!this.isOpen) return;

      if (this.sequencer.isPlaying) {
        this.playheadEl.classList.remove('hidden');
        const totalBeats = this.sequencer.getTotalBeats();
        const currentBeat = (this.sequencer.currentStep ? (this.sequencer.currentStep * 0.25) : 0) % totalBeats;
        const playheadX = currentBeat * this.pixelsPerBeat;
        this.playheadEl.style.left = `${playheadX}px`;
      } else {
        this.playheadEl.classList.add('hidden');
      }

      this.animFrameId = requestAnimationFrame(animate);
    };

    animate();
  }
}

window.PianoRollModal = PianoRollModal;

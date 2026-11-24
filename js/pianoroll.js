// Piano Roll / MIDI Grid Visualizer and Editor
// Displays recorded chords, note blocks, piano keys, beat grid, and animated playhead

class PianoRollModal {
  constructor(audioEngine, sequencer) {
    this.audio = audioEngine;
    this.sequencer = sequencer;

    this.isOpen = false;
    this.modalEl = null;
    this.canvasEl = null;
    this.ctx = null;
    this.keysContainer = null;

    // Pitch Range: MIDI 36 (C2) to MIDI 84 (C6) -> 49 notes
    this.minMidi = 36;
    this.maxMidi = 84;
    this.numNotes = this.maxMidi - this.minMidi + 1;

    // Dimensions
    this.noteHeight = 18; // Height per pitch row in px
    this.pixelsPerBeat = 80; // Width per beat in px
    this.keyWidth = 56; // Width of piano keys on the left

    // Interactive notes list (can be derived from sequencer slots or edited)
    this.customNotes = [];

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
      <div class="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold">
              🎹
            </div>
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                Cửa Sổ Lưới MIDI (Piano Roll Editor)
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">Visualizer & Vẽ Nốt</span>
              </h3>
              <p class="text-xs text-slate-400">Xem vòng hợp âm đã ghi, nhấp vào lưới để vẽ/thêm nốt, hoặc click vào nốt để xóa</p>
            </div>
          </div>

          <!-- Controls in Header -->
          <div class="flex items-center space-x-2 text-xs">
            <button id="pr-play-btn" class="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer">
              <span>▶ Phát</span>
            </button>
            <button id="pr-loop-btn" class="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-medium hover:border-indigo-500 transition cursor-pointer">
              🔁 Lặp lại
            </button>
            <button id="pr-refresh-btn" class="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer" title="Đồng bộ lại từ vòng hợp âm">
              🔄 Tải lại hợp âm
            </button>
            <button id="pr-close-btn" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-white flex items-center justify-center text-base font-bold transition cursor-pointer">
              ✕
            </button>
          </div>
        </div>

        <!-- Toolbar / Help Bar -->
        <div class="flex items-center justify-between px-5 py-2 bg-slate-950/40 border-b border-slate-800/80 text-[11px] text-slate-400">
          <div class="flex items-center space-x-4">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-indigo-500 inline-block"></span>
              <span>Nốt hợp âm (Vòng lặp)</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-emerald-400 inline-block"></span>
              <span>Nốt bass</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-0.5 h-3 bg-rose-500 inline-block"></span>
              <span>Con trỏ phát sáng (Playhead)</span>
            </span>
          </div>
          <div>
            <span>Mẹo: Nhấp phím đàn bên trái để nghe thử nốt | Bấm chuột vào ô trống để vẽ nốt mới</span>
          </div>
        </div>

        <!-- Main Piano Roll Body: Split into Left Piano Keys & Right Scrollable Grid -->
        <div class="relative flex-1 flex overflow-hidden bg-slate-950">
          
          <!-- Left Piano Keyboard Column (Frozen on X, scrolls with Y) -->
          <div id="pr-piano-keys" class="flex-shrink-0 w-14 bg-slate-900 border-r border-slate-700 select-none overflow-hidden relative shadow-lg z-10">
            <!-- Piano keys rendered dynamically -->
          </div>

          <!-- Right Grid Area (Scrollable in both X and Y) -->
          <div id="pr-grid-container" class="flex-1 relative overflow-auto custom-scrollbar">
            <!-- Time ruler header -->
            <div id="pr-ruler" class="sticky top-0 z-20 h-6 bg-slate-900/95 border-b border-slate-700 flex items-center font-mono text-[10px] text-slate-400">
              <!-- Bar & beat markers -->
            </div>

            <!-- Canvas Grid -->
            <canvas id="pr-canvas" class="block cursor-crosshair"></canvas>

            <!-- Playhead cursor overlay line -->
            <div id="pr-playhead" class="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-[0_0_12px_2px_#f43f5e] pointer-events-none z-30 hidden"></div>
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
  }

  bindEvents() {
    const closeBtn = this.modalEl.querySelector('#pr-close-btn');
    closeBtn.addEventListener('click', () => this.close());

    // Close on background click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    // Play button in modal
    const playBtn = this.modalEl.querySelector('#pr-play-btn');
    playBtn.addEventListener('click', () => {
      this.sequencer.togglePlay();
      this.syncPlayBtn();
    });

    // Loop button in modal
    const loopBtn = this.modalEl.querySelector('#pr-loop-btn');
    loopBtn.addEventListener('click', () => {
      this.sequencer.isLooping = !this.sequencer.isLooping;
      this.syncLoopBtn();
    });

    // Refresh from progression
    const refreshBtn = this.modalEl.querySelector('#pr-refresh-btn');
    refreshBtn.addEventListener('click', () => {
      this.syncFromSequencer();
      this.draw();
    });

    // Sync vertical scroll between piano keys and grid
    this.gridContainer.addEventListener('scroll', () => {
      this.keysContainer.scrollTop = this.gridContainer.scrollTop;
    });

    // Canvas click to add or remove notes ("vẽ midi")
    this.canvasEl.addEventListener('click', (e) => {
      this.handleCanvasClick(e);
    });
  }

  // Synchronize notes list from sequencer chord slots
  syncFromSequencer() {
    this.customNotes = [];
    const totalBeats = this.sequencer.getTotalBeats();

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

  // Open modal and render
  open() {
    this.isOpen = true;
    this.modalEl.classList.remove('hidden');
    this.syncFromSequencer();
    this.renderPianoKeys();
    this.resizeAndDraw();
    this.syncPlayBtn();
    this.syncLoopBtn();
    this.startPlayheadAnimation();

    // Scroll to middle register (around C4)
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
  }

  syncPlayBtn() {
    const playBtn = this.modalEl.querySelector('#pr-play-btn');
    if (this.sequencer.isPlaying) {
      playBtn.innerHTML = '<span>⏸ Tạm dừng</span>';
      playBtn.classList.replace('bg-indigo-600', 'bg-amber-600');
    } else {
      playBtn.innerHTML = '<span>▶ Phát</span>';
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

  // Render Left Vertical Piano Keys
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

      // Only label C notes and sharps for cleaner look
      keyEl.textContent = (pitchClass === 0 || isBlack) ? `${noteName}${octave}` : (pitchClass === 0 ? `C${octave}` : '');

      // Click piano key to preview note
      keyEl.addEventListener('pointerdown', async () => {
        await this.audio.init();
        this.audio.playNote(midi, null, 1.2, 95);
        keyEl.classList.add('bg-indigo-600', 'text-white');
        setTimeout(() => keyEl.classList.remove('bg-indigo-600', 'text-white'), 200);
      });

      this.keysContainer.appendChild(keyEl);
    }
  }

  // Resize canvas to match total beats and pitches
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

  // Render Time Ruler (Bars & Beats header)
  renderRuler(totalBeats) {
    this.rulerEl.innerHTML = '';
    const beatsPerBar = this.sequencer.beatsPerBar;
    const totalBars = Math.ceil(totalBeats / beatsPerBar);

    for (let b = 0; b < totalBars; b++) {
      const barEl = document.createElement('div');
      barEl.className = 'border-r border-slate-700 px-2 flex-shrink-0 flex items-center font-bold text-indigo-300';
      barEl.style.width = `${beatsPerBar * this.pixelsPerBeat}px`;
      barEl.textContent = `Khuông ${b + 1}`;
      this.rulerEl.appendChild(barEl);
    }
  }

  // Draw Grid and MIDI Notes
  draw() {
    if (!this.ctx) return;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    const totalBeats = Math.max(8, this.sequencer.getTotalBeats());
    const beatsPerBar = this.sequencer.beatsPerBar;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Draw Background Rows for Pitch Keys (alternating dark shades for black/white keys)
    const blackNoteIndices = [1, 3, 6, 8, 10];
    for (let midi = this.maxMidi; midi >= this.minMidi; midi--) {
      const rowIndex = this.maxMidi - midi;
      const y = rowIndex * this.noteHeight;
      const pc = midi % 12;
      const isBlack = blackNoteIndices.includes(pc);

      this.ctx.fillStyle = isBlack ? '#090d16' : '#111827';
      this.ctx.fillRect(0, y, w, this.noteHeight);

      // Horizontal pitch divider line
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + this.noteHeight);
      this.ctx.lineTo(w, y + this.noteHeight);
      this.ctx.stroke();

      // Octave boundary line (C note)
      if (pc === 0) {
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y + this.noteHeight);
        this.ctx.lineTo(w, y + this.noteHeight);
        this.ctx.stroke();
      }
    }

    // 2. Draw Vertical Grid Lines (Bars, Beats, Subdivisions)
    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = beat * this.pixelsPerBeat;
      const isBarStart = (beat % beatsPerBar === 0);

      // 1/2 beat subdivision line
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

    // 3. Draw MIDI Note Blocks
    this.customNotes.forEach(note => {
      if (note.midi < this.minMidi || note.midi > this.maxMidi) return;

      const rowIndex = this.maxMidi - note.midi;
      const x = note.startBeat * this.pixelsPerBeat;
      const y = rowIndex * this.noteHeight + 1.5;
      const noteW = Math.max(6, note.duration * this.pixelsPerBeat - 2);
      const noteH = this.noteHeight - 3;

      // Color scheme: Bass notes in Emerald/Teal; Upper chord voices in Indigo/Cyan
      const gradient = this.ctx.createLinearGradient(x, y, x + noteW, y);
      if (note.isBass) {
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#059669');
      } else {
        gradient.addColorStop(0, '#38bdf8');
        gradient.addColorStop(1, '#6366f1');
      }

      // Rounded rectangle note block
      this.ctx.fillStyle = gradient;
      this.ctx.strokeStyle = note.isBass ? '#34d399' : '#818cf8';
      this.ctx.lineWidth = 1;

      this.roundRect(this.ctx, x, y, noteW, noteH, 3, true, true);

      // Note text label inside block
      if (noteW > 24) {
        const pc = note.midi % 12;
        const oct = Math.floor(note.midi / 12) - 1;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px sans-serif';
        this.ctx.fillText(`${NOTE_NAMES[pc]}${oct}`, x + 4, y + noteH - 3.5);
      }
    });
  }

  // Draw rounded rectangle helper
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

  // Handle click on canvas to add or remove notes ("vẽ midi")
  async handleCanvasClick(e) {
    const rect = this.canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rowIndex = Math.floor(y / this.noteHeight);
    const midi = this.maxMidi - rowIndex;
    // Quantize click to nearest half-beat (0.5)
    const rawBeat = x / this.pixelsPerBeat;
    const quantizedBeat = Math.floor(rawBeat * 2) / 2;

    // Check if clicked an existing note to delete it
    const existingIndex = this.customNotes.findIndex(note => {
      const noteX = note.startBeat * this.pixelsPerBeat;
      const noteW = note.duration * this.pixelsPerBeat;
      return note.midi === midi && x >= noteX && x <= noteX + noteW;
    });

    if (existingIndex !== -1) {
      // Remove note
      this.customNotes.splice(existingIndex, 1);
      this.draw();
      return;
    }

    // Add new note (default 1 or 2 beats)
    await this.audio.init();
    this.audio.playNote(midi, null, 1.2, 95);

    this.customNotes.push({
      id: 'note_' + Math.random().toString(36).substr(2, 6),
      midi: midi,
      startBeat: quantizedBeat,
      duration: 1.0,
      velocity: 95,
      isBass: midi < 48
    });

    this.draw();
  }

  // Animated Playhead cursor tracking Web Audio time
  startPlayheadAnimation() {
    const animate = () => {
      if (!this.isOpen) return;

      if (this.sequencer.isPlaying) {
        this.playheadEl.classList.remove('hidden');
        const totalBeats = this.sequencer.getTotalBeats();
        const secPerBeat = this.sequencer.getSecondsPerBeat();

        // Calculate continuous beat position
        const currentBeat = (this.sequencer.currentBeatIndex % totalBeats);
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

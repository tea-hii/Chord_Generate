// Slot Edit Pop-up Modal
// Configures slot duration as musical fractions (1/16 to 2 bars), velocity, and MIDI options

class SlotModal {
  constructor(pianoRollModal) {
    this.pianoRoll = pianoRollModal;
    this.currentSlotIndex = -1;
    this.currentSlot = null;
    this.onSave = null;
    this.onClearChord = null;
    this.onDeleteSlot = null;

    this.selectedFractionIndex = 7; // Default 4/4 (index 7 in DURATION_FRACTIONS)
    this.selectedVelocity = 90;

    this.buildModal();
    this.bindEvents();
  }

  buildModal() {
    this.modalEl = document.createElement('div');
    this.modalEl.id = 'slot-edit-modal';
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm hidden select-none';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div class="flex items-center space-x-2.5">
            <span class="text-xl">✏️</span>
            <div>
              <h3 id="modal-slot-title" class="text-sm font-bold text-white">Edit Chord Slot</h3>
              <p id="modal-slot-subtitle" class="text-[11px] text-slate-400">Configure duration meter, velocity, and voicing</p>
            </div>
          </div>
          <button id="modal-close-btn" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 flex flex-col gap-4 text-xs">
          
          <!-- Section 1: Musical Meter Duration / Length (Fractions from 1/16 to 2) -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200">Duration Meter (Length):</label>
              <span id="modal-fraction-display" class="font-mono font-bold text-sm text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">4/4 (1 Bar)</span>
            </div>

            <!-- Slider across fractions -->
            <input id="modal-fraction-slider" type="range" min="0" max="11" step="1" value="7" class="w-full accent-sky-400 cursor-pointer my-1" />

            <!-- Quick Fraction Pills -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[10px] text-slate-500 mr-0.5">Quick:</span>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-frac="1/16">1/16</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-frac="1/8">1/8</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-frac="3/16">3/16</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-frac="1/4">1/4</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-frac="3/8">3/8</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-frac="1/2">1/2</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-frac="4/4">4/4</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-frac="2">2 (2 Bars)</button>
            </div>
          </div>

          <!-- Section 2: Velocity Input (1 - 127) -->
          <div class="flex flex-col gap-2 pt-3 border-t border-slate-800">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200">Velocity (Dynamic Touch):</label>
              <div class="flex items-center space-x-1.5">
                <input id="modal-velocity-input" type="number" min="1" max="127" value="90" class="w-14 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono font-bold text-indigo-400 py-1 focus:outline-none" />
                <span id="modal-velocity-label" class="text-[11px] text-slate-400">(mf)</span>
              </div>
            </div>
            <input id="modal-velocity-slider" type="range" min="1" max="127" step="1" value="90" class="w-full accent-indigo-500 cursor-pointer" />
          </div>

          <!-- Section 3: Chord MIDI & Voicing -->
          <div class="flex flex-col gap-1.5 pt-3 border-t border-slate-800">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200">Chord MIDI & Voicing:</label>
              <span class="text-[10px] text-amber-400/90 font-medium">Custom Voice Editor</span>
            </div>
            <p class="text-[11px] text-slate-400">View and fine-tune individual note pitches and timings on the MIDI Grid.</p>
            <button id="modal-open-midi-btn" type="button" class="mt-1 w-full py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
              <span>🎹 Open in MIDI Piano Roll</span>
            </button>
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          <!-- Clear Chord button (keeps slot empty) -->
          <button id="modal-clear-chord-btn" type="button" class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-950/30 transition flex items-center gap-1" title="Clear chord from slot but keep slot empty in place">
            <span>🗑️ Clear Chord</span>
          </button>

          <div class="flex items-center space-x-2">
            <button id="modal-cancel-btn" type="button" class="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition">
              Cancel
            </button>
            <button id="modal-save-btn" type="button" class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 transition">
              Save Changes
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(this.modalEl);

    this.titleEl = this.modalEl.querySelector('#modal-slot-title');
    this.subtitleEl = this.modalEl.querySelector('#modal-slot-subtitle');
    this.fractionDisplay = this.modalEl.querySelector('#modal-fraction-display');
    this.fractionSlider = this.modalEl.querySelector('#modal-fraction-slider');
    this.velocityInput = this.modalEl.querySelector('#modal-velocity-input');
    this.velocitySlider = this.modalEl.querySelector('#modal-velocity-slider');
    this.velocityLabel = this.modalEl.querySelector('#modal-velocity-label');
  }

  bindEvents() {
    const closeBtn = this.modalEl.querySelector('#modal-close-btn');
    const cancelBtn = this.modalEl.querySelector('#modal-cancel-btn');
    const saveBtn = this.modalEl.querySelector('#modal-save-btn');
    const clearChordBtn = this.modalEl.querySelector('#modal-clear-chord-btn');
    const openMidiBtn = this.modalEl.querySelector('#modal-open-midi-btn');

    closeBtn.addEventListener('click', () => this.close());
    cancelBtn.addEventListener('click', () => this.close());

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    // Fraction Slider change
    this.fractionSlider.addEventListener('input', (e) => {
      const idx = parseInt(e.target.value, 10);
      this.setFractionByIndex(idx);
    });

    // Quick Fraction buttons
    this.modalEl.querySelectorAll('.quick-frac-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const frac = btn.dataset.frac;
        const idx = DURATION_FRACTIONS.findIndex(df => df.fraction === frac);
        if (idx !== -1) {
          this.setFractionByIndex(idx);
        }
      });
    });

    // Velocity Slider & Input sync
    this.velocitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.selectedVelocity = val;
      this.velocityInput.value = val;
      this.updateVelocityLabel(val);
    });

    this.velocityInput.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) val = 90;
      val = Math.max(1, Math.min(127, val));
      this.selectedVelocity = val;
      this.velocityInput.value = val;
      this.velocitySlider.value = val;
      this.updateVelocityLabel(val);
    });

    // Save Changes
    saveBtn.addEventListener('click', () => {
      const selectedDf = DURATION_FRACTIONS[this.selectedFractionIndex];
      const beats = selectedDf ? selectedDf.beats : 4.0;
      if (this.onSave) {
        this.onSave(this.currentSlotIndex, {
          beats: beats,
          velocity: this.selectedVelocity
        });
      }
      this.close();
    });

    // Clear Chord (keeping slot empty)
    clearChordBtn.addEventListener('click', () => {
      if (this.onClearChord) {
        this.onClearChord(this.currentSlotIndex);
      }
      this.close();
    });

    // Open in Piano Roll
    openMidiBtn.addEventListener('click', () => {
      this.close();
      if (this.pianoRoll) {
        this.pianoRoll.open();
      }
    });
  }

  setFractionByIndex(idx) {
    this.selectedFractionIndex = Math.max(0, Math.min(DURATION_FRACTIONS.length - 1, idx));
    this.fractionSlider.value = this.selectedFractionIndex;
    const item = DURATION_FRACTIONS[this.selectedFractionIndex];
    if (item) {
      this.fractionDisplay.textContent = `${item.fraction} (${item.label.split(' (')[1] || item.label}`;
    }
  }

  updateVelocityLabel(val) {
    let lbl = 'mf';
    if (val < 50) lbl = 'p (Piano)';
    else if (val < 75) lbl = 'mp (Mezzo-piano)';
    else if (val < 100) lbl = 'mf (Mezzo-forte)';
    else if (val < 120) lbl = 'f (Forte)';
    else lbl = 'ff (Fortissimo)';
    this.velocityLabel.textContent = `(${lbl})`;
  }

  open(slotIndex, slot, onSave, onClearChord, onDeleteSlot) {
    this.currentSlotIndex = slotIndex;
    this.currentSlot = slot;
    this.onSave = onSave;
    this.onClearChord = onClearChord;
    this.onDeleteSlot = onDeleteSlot;

    // Set Title
    if (slot.chord) {
      this.titleEl.textContent = `Edit Chord: ${slot.chord.fullName}`;
      this.subtitleEl.textContent = `${slot.chord.functionName || 'Diatonic chord'} in Bar ${Math.floor(slot.startBeat / 4) + 1}`;
      this.modalEl.querySelector('#modal-clear-chord-btn').classList.remove('hidden');
    } else {
      this.titleEl.textContent = 'Edit Empty Chord Slot';
      this.subtitleEl.textContent = 'Configure slot duration before dropping a chord';
      this.modalEl.querySelector('#modal-clear-chord-btn').classList.add('hidden');
    }

    // Match Fraction
    const fracStr = beatsToFraction(slot.beats);
    const fracIdx = DURATION_FRACTIONS.findIndex(df => df.fraction === fracStr);
    this.setFractionByIndex(fracIdx !== -1 ? fracIdx : 7);

    // Match Velocity
    const vel = slot.velocity || (slot.chord && slot.chord.velocity) || 90;
    this.selectedVelocity = vel;
    this.velocityInput.value = vel;
    this.velocitySlider.value = vel;
    this.updateVelocityLabel(vel);

    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }
}

window.SlotModal = SlotModal;

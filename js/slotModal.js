// Slot Edit Pop-up Modal with 1/16th Precision Fraction Slider and Minimalist 2D Icons
// Configures slot duration with any 1/16th subdivision (e.g. 5/8, 5/16, 7/16, 3/8...) up to 2 bars

class SlotModal {
  constructor(pianoRollModal) {
    this.pianoRoll = pianoRollModal;
    this.currentSlotIndex = -1;
    this.currentSlot = null;
    this.onSave = null;
    this.onClearChord = null;
    this.onDeleteSlot = null;

    this.selectedSixteenths = 16; // 16 sixteenths = 4.0 beats = 4/4 (1 Bar)
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
            <!-- 2D Minimalist Pencil SVG -->
            <div class="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </div>
            <div>
              <h3 id="modal-slot-title" class="text-sm font-bold text-white">Edit Chord Slot</h3>
              <p id="modal-slot-subtitle" class="text-[11px] text-slate-400">Configure duration in 1/16th steps, velocity, and voicing</p>
            </div>
          </div>
          <button id="modal-close-btn" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 flex flex-col gap-4 text-xs">
          
          <!-- Section 1: Musical Meter Duration / Length (Fractions in 1/16 increments from 1/16 to 2) -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200">Duration Meter (Length):</label>
              <span id="modal-fraction-display" class="font-mono font-bold text-sm text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">4/4 (1 Bar)</span>
            </div>

            <!-- Continuous 1/16th range slider: 1 to 32 sixteenths -->
            <input id="modal-fraction-slider" type="range" min="1" max="32" step="1" value="16" class="w-full accent-sky-400 cursor-pointer my-1" />

            <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>1/16 (Min)</span>
              <span id="modal-sixteenth-counter" class="text-sky-400 font-semibold">16 / 16</span>
              <span>2 (32/16 = 2 Bars Max)</span>
            </div>

            <!-- Quick Fraction Preset Pills -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1.5">
              <span class="text-[10px] text-slate-500 mr-0.5">Quick:</span>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="1">1/16</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="2">1/8</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="3">3/16</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="4">1/4</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="5">5/16</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="6">3/8</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="8">1/2</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="10">5/8</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="12">3/4</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="16">4/4</button>
              <button type="button" class="quick-frac-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700" data-sixteenths="32">2</button>
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

          <!-- Section 3: Picking & Arpeggio Style for THIS Chord -->
          <div class="flex flex-col gap-1.5 pt-3 border-t border-slate-800">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200">Picking / Arpeggio Style:</label>
              <span class="text-[10px] text-emerald-400/90 font-medium">Per-Chord Voicing</span>
            </div>
            <p class="text-[11px] text-slate-400">Choose how this individual chord is plucked, strummed, or arpeggiated.</p>
            <select id="modal-style-select" class="w-full bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs px-2.5 py-1.5 font-medium focus:outline-none cursor-pointer">
              <option value="inherit">Default (Follow Global Song Style)</option>
              <option value="fingerstyle">🎸 Fingerpicking Ballad (4/4 Pluck)</option>
              <option value="strum">🎸 Acoustic Strum (Down/Up Groove)</option>
              <option value="walking_bass">🚶 Walking Bass + Comping</option>
              <option value="piano_arpeggio">🎹 Piano Ballad Arpeggio</option>
              <option value="flamenco">✨ Spanish Flamenco Roll (16th Tremolo)</option>
              <option value="slow_soul">🎶 Slow Soul / RnB Pluck</option>
              <option value="bossa_funk">⚡ Bossa Nova / Funk Pinch</option>
              <option value="ambient_lofi">🌊 Ambient Lofi Harp Arpeggio</option>
              <option value="travis_picking">🤠 Travis Picking (Country / Folk)</option>
              <option value="classical_alberti">🎼 Alberti Bass (Classical Piano)</option>
              <option value="waltz_34">💃 3/4 Waltz (Oom-Pah-Pah)</option>
              <option value="jazz_comping">🎷 Jazz Swing Comping (Charleston)</option>
              <option value="reggae_skank">🌴 Reggae / Ska Off-Beat Skank</option>
              <option value="cinematic_swell">🎬 Cinematic Pulse (8th Ostinato)</option>
              <option value="chachacha">💃 Cha-Cha-Cha (Latin Montuno)</option>
              <option value="techno">⚡ Techno / Trance Rolling Arp</option>
              <option value="bedroom_pop">🎧 Bedroom Pop (Dreamy Pluck)</option>
              <option value="synthwave">🌆 Synthwave / 80s Arp</option>
              <option value="funk_disco">🪩 Funk / Disco Octave Groove</option>
              <option value="neo_soul">🎹 Neo-Soul / Gospel Cascade</option>
              <option value="vn_bolero">🇻🇳 Vietnamese Bolero (Rumba Ballad)</option>
              <option value="vn_slow_rock">🎸 Slow Rock 6/8 (V-Pop Ballad)</option>
              <option value="vn_boston">🥀 Boston / Lyric Valse</option>
              <option value="vn_dan_tranh">🌾 Folk Pentatonic (Dan Tranh)</option>
              <option value="vn_vinahouse">🔊 Vinahouse / Remix Off-Beat</option>
              <option value="block">⏹️ Block Chord (Simultaneous)</option>
            </select>

            <div class="flex items-center justify-between mt-1.5">
              <label class="font-semibold text-slate-300 text-[11px]">Picking Speed (Note Subdivision):</label>
              <select id="modal-rate-select" class="bg-slate-950 border border-slate-700 rounded-lg text-sky-300 text-xs px-2.5 py-1 font-bold focus:outline-none cursor-pointer">
                <option value="inherit">Follow Global Rate</option>
                <option value="auto">Auto (Style Default)</option>
                <option value="1/4">1/4 (Slow / 1 Beat)</option>
                <option value="3/16">3/16 (Dotted 8th)</option>
                <option value="1/8">1/8 (Ballad Standard)</option>
                <option value="1/8T">1/8T (Triplet Swing)</option>
                <option value="1/16">1/16 (Fast Roll)</option>
              </select>
            </div>
          </div>

          <!-- Section 4: MIDI Grid Inspector -->
          <div class="flex flex-col gap-1.5 pt-3 border-t border-slate-800">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200">MIDI Grid Inspector:</label>
              <span class="text-[10px] text-sky-400/90 font-medium">Visualizer</span>
            </div>
            <p class="text-[11px] text-slate-400">View notes and playback laser across the time grid.</p>
            <button id="modal-open-midi-btn" type="button" class="mt-1 w-full py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
              <span>🎹 View in MIDI Grid Inspector</span>
            </button>
          </div>

        </div>

        <!-- Footer Actions with Minimalist 2D Icons -->
        <div class="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          <!-- Clear Chord button (2D Trash Icon) -->
          <button id="modal-clear-chord-btn" type="button" class="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-950/30 transition flex items-center gap-1.5" title="Clear chord from slot but keep slot empty in place">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" x2="10" y1="11" y2="17"/>
              <line x1="14" x2="14" y1="11" y2="17"/>
            </svg>
            <span>Clear Chord</span>
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
    this.sixteenthCounter = this.modalEl.querySelector('#modal-sixteenth-counter');
    this.velocityInput = this.modalEl.querySelector('#modal-velocity-input');
    this.velocitySlider = this.modalEl.querySelector('#modal-velocity-slider');
    this.velocityLabel = this.modalEl.querySelector('#modal-velocity-label');
    this.styleSelect = this.modalEl.querySelector('#modal-style-select');
    this.rateSelect = this.modalEl.querySelector('#modal-rate-select');
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

    // 1/16th Fraction Slider (1 to 32)
    this.fractionSlider.addEventListener('input', (e) => {
      const s = parseInt(e.target.value, 10);
      this.setSixteenths(s);
    });

    // Quick Fraction pills
    this.modalEl.querySelectorAll('.quick-frac-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = parseInt(btn.dataset.sixteenths, 10);
        this.setSixteenths(s);
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
      const beats = this.selectedSixteenths * 0.25;
      const strumStyle = this.styleSelect ? this.styleSelect.value : 'inherit';
      const arpRate = this.rateSelect ? this.rateSelect.value : 'inherit';
      if (this.onSave) {
        this.onSave(this.currentSlotIndex, {
          beats: beats,
          velocity: this.selectedVelocity,
          strumStyle: strumStyle,
          arpRate: arpRate
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

  setSixteenths(s) {
    this.selectedSixteenths = Math.max(1, Math.min(32, s));
    this.fractionSlider.value = this.selectedSixteenths;
    const fracText = sixteenthsToFraction(this.selectedSixteenths);
    this.fractionDisplay.textContent = fracText;
    this.sixteenthCounter.textContent = `${this.selectedSixteenths}/16 (${fracText.split(' ')[0]})`;
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
      this.subtitleEl.textContent = 'Configure duration meter in 1/16th steps before dropping a chord';
      this.modalEl.querySelector('#modal-clear-chord-btn').classList.add('hidden');
    }

    // Convert slot.beats to sixteenths (0.25 beat = 1 sixteenth)
    const sixteenths = Math.max(1, Math.min(32, Math.round((slot.beats || 4.0) / 0.25)));
    this.setSixteenths(sixteenths);

    // Match Velocity
    const vel = slot.velocity || (slot.chord && slot.chord.velocity) || 90;
    this.selectedVelocity = vel;
    this.velocityInput.value = vel;
    this.velocitySlider.value = vel;
    this.updateVelocityLabel(vel);

    // Match Picking Style & Speed Rate
    if (this.styleSelect) {
      this.styleSelect.value = slot.strumStyle || (slot.chord && slot.chord.strumStyle) || 'inherit';
    }
    if (this.rateSelect) {
      this.rateSelect.value = slot.arpRate || (slot.chord && slot.chord.arpRate) || 'inherit';
    }

    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }
}

window.SlotModal = SlotModal;

# ChordFlow 🎵 - Streamlined Chord Progression Looper & MIDI Studio

A modern, fast, and responsive client-side web application designed for songwriters, beatmakers, producers, and musicians to quickly build chord progressions, explore scale chords (including **Major, Minor, Pentatonic, and Blues** scales), drag and drop chords into customizable slots, inspect and draw notes with an interactive **MIDI Piano Roll Grid**, and improvise toplines with an audio-synced **Metronome & Tap Tempo**.

Built entirely with standard **HTML5 and Web Audio API**, requiring zero backend installations, and ready for instant **1-click GitHub Pages deployment**.

---

## ✨ Key Features

### 1. 🎯 Drag & Drop Progression Workflow & Empty Slots
- **Add Empty Slots**: Click **"+ Add Slot"** to insert an empty chord slot (`+ Drop Chord Here`).
- **Drag & Drop**: Drag any Scale Degree Chord (I, ii, iii, IV, V...) or Borrowed Chord and drop it directly into any slot!
- **Sound on Click**: Clicking any chord in the progression track plays its audio voicing in real-time.
- **Minimalist 2D Vector Trash Bin Functionality**:
  - Clicking the trash bin on a **filled chord slot** clears the chord from that slot while **keeping the empty slot in place** so you can drop a different chord into it without disrupting your progression arrangement.
  - Clicking the trash bin or remove icon (`✕`) on an **empty slot** deletes the slot entirely from the track.
- **Minimalist 2D Vector Pencil Edit Button & Pop-up Modal**:
  - Click the pencil icon on any slot (or click its duration badge) to open the **Slot Configuration Modal**.
  - **Fine-Grained 1/16th Subdivision Meter**: Change durations continuously in precise `1/16th` increments from `1/16` up to `2` (2 full bars = 32 sixteenths), allowing any odd or even fraction such as `1/16`, `3/16`, `5/16`, `3/8` (6/16), `5/8` (10/16), `7/16`, `1/4`, `1/2`, `3/4`, `4/4`, or `2`.
  - **Velocity Control**: Set dynamic velocity numerically (1 to 127) with dynamic label feedback (`p`, `mp`, `mf`, `f`, `ff`).
  - **MIDI Voicing**: Direct link to open the slot in the MIDI Piano Roll Grid.

### 2. 🎼 Streamlined Scale & Key Selection
- **Instant Root Key Selection**: One-tap button strip for all 12 chromatic pitches (`C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`).
- **Comprehensive Scale Modes**:
  - `Major (Ionian)`
  - `Natural Minor (Aeolian)`
  - `Harmonic Minor`
  - `Major Pentatonic`
  - `Minor Pentatonic`
  - `Blues Scale`
  - `Dorian (Folk / Jazz)`
  - `Mixolydian (Blues / Rock)`
- **Triad vs. 7th Chords**: Quick toggle to instantly convert triads into lush 7th chords (`maj7`, `m7`, `7`, `m7b5`).

### 3. 🎹 Compact Chord Degree Pads (Draggable)
- Slim, compact cards displaying degree numeral (`I`, `ii`, `IV`, `V`), chord name, note breakdown, and `+ Add` button.
- Draggable directly onto progression slots.
- **Borrowed Chords (Modal Interchange)**: Suggestions for poignant non-diatonic chords (minor `iv`, `bVII`, `bVI`, `V/vi`).

### 4. 🎹 Interactive MIDI Piano Roll & Note Drawer
- Click **"🎹 MIDI Grid (Piano Roll)"** or click the MIDI icon on any chord slot to open the Piano Roll editor.
- **DAW-grade Grid**: Spans piano keys from C2 to C6 horizontally divided into Bars, Beats, and Subdivisions.
- **Real-Time Playhead**: Sweeps smoothly across the grid in real-time synchronization with the Web Audio clock.
- **Draw & Edit Notes**: Click any empty grid cell to draw a new MIDI note, click an existing note to delete it, or click piano keys on the left to preview pitch.

### 5. 🎸 Emotional Accompaniment Styles & 6-String Guitar Voicing Engine
- **Fingerpicking (Ballad Pluck)**: Emulates a singer-songwriter picking an acoustic guitar or ballad piano. Triggers a deep, resonant bass note on beat 1, followed by rolling 8th-note string plucks (Bass -> 3rd -> 5th -> High Melody -> Alternating Bass -> 3rd -> High Melody -> 5th) that ring out and breathe naturally.
- **Acoustic Strum (Groove)**: Authentic rhythmic acoustic guitar strumming with humanized micro-staggers (~24ms delay between strings) and musical down/up strum velocity contours across the measure.
- **Walking Bass + Comping (Passing Notes)**: Plays a strong, punchy root bass note on beat 1, off-beat syncopated chord comping, and calculates an automatic **single passing note (walking bass leading tone)** right before the next chord transition (e.g., C -> B passing note -> Am).
- **Piano Ballad Arpeggio**: Flowing, cascading 2-octave rolling arpeggio ideal for emotional pop and ballad compositions.
- **Block Chord**: Direct simultaneous trigger for checking raw harmony and voicings.
- **6-String Open Voicing Engine**: Expands traditional closed 3-note triads into wide, studio-grade 6-string open voicings spanning 2.5 octaves (e.g., C2 - G2 - C3 - E3 - G3 - C4; A2 - E3 - A3 - C4 - E4 - A4), delivering immense warmth, fullness, and emotional resonance.

### 6. 🎹 General MIDI (GM) Standard Instrument Soundbank
Features 16 standard General MIDI instruments synthesized via Web Audio API with studio convolution reverb:
- **Pianos**: `001. Acoustic Grand Piano`, `002. Bright Acoustic Piano`
- **Electric Pianos**: `005. Electric Piano 1 (Rhodes)`, `006. Electric Piano 2 (DX7 FM Sparkle)`
- **Chromatic Percussion**: `012. Vibraphone`
- **Organs**: `017. Drawbar Organ (Hammond B3)`, `020. Church Pipe Organ`
- **Guitars**: `025. Acoustic Guitar (Nylon)`, `026. Acoustic Guitar (Steel)`, `028. Electric Guitar (Clean)`
- **Bass**: `033. Acoustic Upright Bass`
- **Strings & Ensemble**: `041. Solo Strings / Violin`, `049. String Ensemble 1`
- **Brass & Woodwinds**: `057. Trumpet / Brass Section`, `074. Flute / Woodwind`
- **Synth Pad**: `089. Warm Synth Pad`

### 6. ⏱️ Sequencer, Looper & Tap Tempo
- Configurable measures (2 Bars, 4 Bars, 8 Bars) and time signatures (4/4, 3/4 Waltz).
- **Zero-Drift Web Audio Clock**: Jitter-free lookahead scheduling for continuous looping.
- **Metronome**: Distinct woodblock/rimshot click with high accent on beat 1.
- **4-LED Flashing Beat Row**: Synchronized visual tempo indicator.
- **Tap Tempo**: Tap rhythmically on the button to instantly calculate and set your song's BPM.
- **Standard MIDI Export (.mid)**: Export Type 0 MIDI files ready to drag and drop straight into FL Studio, Ableton Live, Logic Pro, GarageBand, Cubase, Studio One, etc.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **Space** | Play / Pause Progression Playback |
| **Keys 1 - 7** | Trigger Scale Degree Chords 1 through 7 |
| **T** | Tap Tempo |
| **L** | Toggle Loop |
| **R** | Toggle Record Mode |
| **M** | Toggle Metronome |

---

## 🚀 Instant GitHub Pages Deployment

```bash
git add .
git commit -m "feat: Add empty slots, drag-and-drop chords, slot edit modal with fractions and velocity"
git push -u origin main
```

Then in your GitHub repository:
1. Navigate to **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**: select **Deploy from a branch**.
3. Under **Branch**: select `main` and `/ (root)`, then click **Save**.
4. Within 30-60 seconds, your application will be live at:
   `https://tea-hii.github.io/Chord_Generate/`

---

## 📂 Project Structure

```
Chord_generate/
├── index.html        # Main streamlined application interface
├── css/
│   └── style.css     # Studio dark mode theme and slot styling
├── js/
│   ├── theory.js     # Music theory engine (Scales, Pentatonic, Blues, Voicings)
│   ├── audio.js      # General MIDI synthesis engine & precision clock
│   ├── sequencer.js  # Audio-synchronized looper & musical fraction lengths
│   ├── slotModal.js  # Pop-up modal for meter fractions (1/16 to 2) & velocity
│   ├── pianoroll.js  # Interactive MIDI Piano Roll grid and note editor
│   ├── midi.js       # Standard MIDI file generator (.mid)
│   └── app.js        # Main UI orchestrator, Drag & Drop & event bus
├── .gitignore        # Git ignore rules (keeps local agent rules strictly private)
└── README.md         # Comprehensive documentation
```

---

*Enjoy creating chord progressions, discovering new harmonies, and crafting beautiful melodies with ChordFlow!* 🎹✨

# ChordFlow 🎵 - Streamlined Chord Progression Looper & MIDI Studio

A modern, fast, and responsive client-side web application designed for songwriters, beatmakers, producers, and musicians to quickly build chord progressions, explore scale chords (including **Major, Minor, Pentatonic, and Blues** scales), inspect and draw notes with an interactive **MIDI Piano Roll Grid**, and improvise toplines with an audio-synced **Metronome & Tap Tempo**.

Built entirely with standard **HTML5 and Web Audio API**, requiring zero backend installations, and ready for instant **1-click GitHub Pages deployment**.

---

## ✨ Key Features

### 1. 🎯 Streamlined Scale & Key Selection
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

### 2. 🎹 Compact & Ergonomic Chord Degree Pads
- Slim, compact cards displaying degree numeral (`I`, `ii`, `IV`, `V`), chord name, and note breakdown.
- Optimized for distraction-free songwriting: each pad triggers a rich, clean polyphonic chord sound on click and adds it to your progression in one tap.
- **Borrowed Chords (Modal Interchange)**: Sleek suggestions for evocative non-diatonic chords (e.g. minor `iv`, `bVII`, `bVI`, `V/vi`).

### 3. 🎼 Interactive MIDI Piano Roll & Note Drawer
- Click **"🎹 MIDI Grid (Piano Roll)"** or click the MIDI icon on any chord slot to open the Piano Roll editor.
- **DAW-grade Grid**: Spans piano keys from C2 to C6 horizontally divided into Bars, Beats, and Subdivisions.
- **Real-Time Playhead**: Sweeps smoothly across the grid in real-time synchronization with the Web Audio clock.
- **Draw & Edit Notes**: Click any empty grid cell to draw a new MIDI note, click an existing note to delete it, or click piano keys on the left to preview pitch.

### 4. 🎹 General MIDI (GM) Standard Instrument Soundbank
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

### 5. ⏱️ Sequencer, Looper & Tap Tempo
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
git commit -m "feat: Streamline scale selector, compact chord pads, and add pentatonic/blues scales"
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
│   └── style.css     # Studio dark mode theme and compact pad styling
├── js/
│   ├── theory.js     # Music theory engine (Scales, Pentatonic, Blues, Voicings)
│   ├── audio.js      # General MIDI synthesis engine & precision clock
│   ├── sequencer.js  # Audio-synchronized looper, recorder & tap tempo
│   ├── pianoroll.js  # Interactive MIDI Piano Roll grid and note editor
│   ├── midi.js       # Standard MIDI file generator (.mid)
│   └── app.js        # Main UI orchestrator & event bus
├── .gitignore        # Git ignore rules (keeps local agent rules strictly private)
└── README.md         # Comprehensive documentation
```

---

*Enjoy creating chord progressions, discovering new harmonies, and crafting beautiful melodies with ChordFlow!* 🎹✨

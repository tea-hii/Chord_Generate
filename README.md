# ChordFlow 🎵 - Visual Chord Progression Looper, Circle of Fifths & MIDI Studio

A modern, responsive, client-side web application designed for songwriters, beatmakers, producers, and music lovers to generate chord progressions, explore the **Circle of Fifths**, inspect and draw notes with an interactive **MIDI Piano Roll Grid**, feel dynamic touch **Velocity**, and practice or improvise toplines with an audio-synced **Metronome & Tap Tempo**.

Built entirely with standard **HTML5 and Web Audio API**, requiring zero backend installations, and ready for instant **1-click GitHub Pages deployment**.

---

## ✨ Key Features

### 1. 🎹 Interactive MIDI Piano Roll & Grid Editor
- Click **"🎹 Open MIDI Grid (Piano Roll)"** or click the MIDI icon on any chord slot to launch the full-featured Piano Roll modal.
- **DAW-grade Grid**: Vertical axis spans piano keys from C2 to C6; horizontal axis displays measures (Bars 1, 2...), beats (1, 2, 3, 4), and half-beat subdivisions.
- **Loop Visualizer**: Visualizes chord notes in real time with distinct color coding for bass roots and upper chord voices.
- **Precision Playhead Laser**: Sweeps smoothly across the grid in real-time synchronization with the Web Audio clock, illuminating notes as they ring out.
- **Interactive Note Drawer**:
  - Click on any empty grid cell to **draw a new MIDI note**.
  - Click on an existing note block to **delete it**.
  - Click on any piano key on the left sidebar to preview its pitch.

### 2. ⚡ Dynamic Touch Velocity Sensitivity
- **Circle of Fifths Wedges**:
  - Clicking/touching near the **outer edge** produces **Fortissimo (ff / 110 - 127)**: High acoustic volume, wide-open filter cutoff, and bright overtone bite.
  - Clicking/touching near the **inner edge** produces **Piano (p / 40 - 65)**: Gentle volume and warm, mellow acoustic body.
- **Scale Degree Chord Pads (I - VII)**:
  - Clicking the **upper half** triggers **Forte (f)**.
  - Clicking the **lower half** triggers **Piano (p)**.
  - Seamlessly integrates with hardware pointer pressure on touchscreen and stylus devices.
- **Live Velocity HUD**: Real-time HUD banner displays the detected velocity and dynamics rating (`Vel 115 (ff)` or `Vel 55 (p)`).
- Captured velocities are preserved in chord slots and encoded directly into exported standard MIDI files!

### 3. 🎼 General MIDI (GM) Standard Instrument Soundbank
Features 16 standard General MIDI instruments crafted with algorithmic Web Audio API synthesis and studio convolution reverb:
- **Pianos**: `001. Acoustic Grand Piano`, `002. Bright Acoustic Piano`
- **Electric Pianos**: `005. Electric Piano 1 (Rhodes)`, `006. Electric Piano 2 (DX7 FM Sparkle)`
- **Chromatic Percussion**: `012. Vibraphone` (with acoustic motor tremolo)
- **Organs**: `017. Drawbar Organ (Hammond B3 multi-drawbar)`, `020. Church Pipe Organ`
- **Guitars**: `025. Acoustic Guitar (Nylon)`, `026. Acoustic Guitar (Steel)`, `028. Electric Guitar (Clean)`
- **Bass**: `033. Acoustic Upright Bass`
- **Strings & Ensemble**: `041. Solo Strings / Violin` (bow attack and vibrato), `049. String Ensemble 1`
- **Brass & Woodwinds**: `057. Trumpet / Brass Section`, `074. Flute / Woodwind`
- **Synth Pad**: `089. Warm Synth Pad`

### 4. ⭕ Interactive Circle of Fifths
- 12-wedge interactive wheel: Outer ring features **Major keys**, inner ring features **Minor keys**.
- Selecting any key automatically highlights its functional diatonic chords: **Tonic (I)**, **Subdominant (IV)**, and **Dominant (V)**.
- Multiple scale modes supported: Major (Ionian), Natural Minor (Aeolian), Harmonic Minor, Dorian, and Mixolydian.
- Quick toggle between 3-note Triads and **7th Chords (maj7, m7, 7, m7b5)**.
- **Borrowed Chords (Modal Interchange)**: Instant suggestions for poignant non-diatonic chords such as minor `iv` (Radiohead ballad weep chord), `bVII` (epic backdoor dominant), `bVI`, and `V/vi`.

### 5. ⏱️ Sequencer, Looper & Tap Tempo
- Configurable measures (2 Bars, 4 Bars, 8 Bars) and time signatures (4/4, 3/4 Waltz).
- **Jitter-Free Looper**: Built with Web Audio lookahead scheduling for zero timing drift.
- **Metronome**: Distinct woodblock/rimshot click with high accent on beat 1.
- **Flashing 4-LED Beat Row**: Synchronized visual tempo indicator for humming and improvising toplines.
- **Tactile Tap Tempo Button**: Tap rhythmically to automatically detect and set your song's BPM.
- **MIDI Export (.mid)**: Export standard Type 0 MIDI files directly drag-and-drop ready for any DAW (FL Studio, Ableton Live, Logic Pro, GarageBand, Cubase, Studio One).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **Space** | Play / Pause Progression Playback |
| **Keys 1 - 7** | Trigger Scale Degree Chords I through VII |
| **T** | Tap Tempo |
| **L** | Toggle Loop |
| **R** | Toggle Record Mode |
| **M** | Toggle Metronome |

---

## 🚀 Instant GitHub Pages Deployment

This project is a standalone static web application that requires no build step:

```bash
git add .
git commit -m "feat: Complete English localization and MIDI studio enhancements"
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
├── index.html        # Main responsive application interface
├── css/
│   └── style.css     # Studio dark mode theme and animation effects
├── js/
│   ├── theory.js     # Music theory engine (scales, degrees, chords, voicings)
│   ├── audio.js      # General MIDI synthesis engine, reverb & precision clock
│   ├── circle.js     # Interactive SVG Circle of Fifths with velocity detection
│   ├── sequencer.js  # Audio-synchronized looper, recorder & tap tempo
│   ├── pianoroll.js  # Interactive MIDI Piano Roll grid and note editor
│   ├── midi.js       # Standard MIDI file generator (.mid)
│   └── app.js        # Main UI orchestrator & event bus
├── .gitignore        # Git ignore rules (keeps local agent rules strictly private)
└── README.md         # Comprehensive documentation
```

---

*Enjoy creating chord progressions, discovering new harmonies, and crafting beautiful melodies with ChordFlow!* 🎹✨

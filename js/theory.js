// Music Theory Engine for Chord Progression App
// Provides notes, scales, diatonic degrees, chords, voicings, and progression templates

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Scale intervals (semitones from tonic)
const SCALE_MODES = {
  major: {
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degreeNames: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    triadTypes: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
    seventhTypes: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
    functions: ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Leading Tone']
  },
  minor: {
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degreeNames: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    triadTypes: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
    seventhTypes: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'],
    functions: ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Subtonic']
  },
  harmonic_minor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degreeNames: ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'],
    triadTypes: ['min', 'dim', 'aug', 'min', 'maj', 'maj', 'dim'],
    seventhTypes: ['m(maj7)', 'm7b5', 'maj7#5', 'm7', '7', 'maj7', 'dim7'],
    functions: ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dramatic Dominant', 'Submediant', 'Leading Tone']
  },
  major_penta: {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    degreeNames: ['I', 'ii', 'iii', 'V', 'vi'],
    triadTypes: ['maj', 'min', 'min', 'maj', 'min'],
    seventhTypes: ['maj7', 'm7', 'm7', '7', 'm7'],
    functions: ['Tonic', 'Supertonic', 'Mediant', 'Dominant', 'Submediant']
  },
  minor_penta: {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    degreeNames: ['i', 'bIII', 'iv', 'v', 'bVII'],
    triadTypes: ['min', 'maj', 'min', 'min', 'maj'],
    seventhTypes: ['m7', 'maj7', 'm7', 'm7', '7'],
    functions: ['Tonic', 'Flat Mediant', 'Subdominant', 'Dominant', 'Subtonic']
  },
  blues: {
    name: 'Blues Scale',
    intervals: [0, 3, 5, 6, 7, 10],
    degreeNames: ['I7', 'bIII', 'IV7', 'bV°', 'V7', 'bVII7'],
    triadTypes: ['maj', 'maj', 'maj', 'dim', 'maj', 'maj'],
    seventhTypes: ['7', '7', '7', 'dim7', '7', '7'],
    functions: ['Tonic 7th', 'Blue 3rd', 'Subdominant 7th', 'Blue Note', 'Dominant 7th', 'Backdoor 7th']
  },
  dorian: {
    name: 'Dorian (Folk / Jazz Minor)',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degreeNames: ['i', 'ii', 'III', 'IV', 'v', 'vi°', 'VII'],
    triadTypes: ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj'],
    seventhTypes: ['m7', 'm7', 'maj7', '7', 'm7', 'm7b5', 'maj7'],
    functions: ['Tonic', 'Supertonic', 'Mediant', 'Characteristic Major IV', 'Dominant', 'Submediant', 'Subtonic']
  },
  mixolydian: {
    name: 'Mixolydian (Blues / Rock Major)',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degreeNames: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'bVII'],
    triadTypes: ['maj', 'min', 'dim', 'maj', 'min', 'min', 'maj'],
    seventhTypes: ['7', 'm7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7'],
    functions: ['Tonic Dominant', 'Supertonic', 'Mediant', 'Subdominant', 'Minor Dominant', 'Submediant', 'Characteristic bVII']
  }
};

// Chord definitions: intervals relative to chord root
const CHORD_INTERVALS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  '7': [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  'm(maj7)': [0, 3, 7, 11],
  'maj7#5': [0, 4, 8, 11],
  add9: [0, 4, 7, 14],
  m9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14]
};

// Helpful chord symbols formatting
const CHORD_DISPLAY_SUFFIX = {
  maj: '',
  min: 'm',
  dim: '°',
  aug: '+',
  sus2: 'sus2',
  sus4: 'sus4',
  maj7: 'maj7',
  m7: 'm7',
  '7': '7',
  m7b5: 'm7b5',
  dim7: 'dim7',
  'm(maj7)': 'm(maj7)',
  'maj7#5': 'maj7#5',
  add9: 'add9',
  m9: 'm9',
  maj9: 'maj9'
};

// Pre-defined popular chord progressions for instant songwriting inspiration
const PROGRESSION_TEMPLATES = [
  {
    name: 'Pop Wonder (I - V - vi - IV)',
    genre: 'Pop / Ballad',
    description: 'The timeless 4-chord progression heard in thousands of global hits (Someone Like You, Perfect, Don\'t Stop Believin\')',
    mode: 'major',
    degrees: [0, 4, 5, 3],
    defaultBeats: 4
  },
  {
    name: 'Emotional / Sad Mood (vi - IV - I - V)',
    genre: 'Emotional / Indie',
    description: 'Starts on the vi chord, evocative, introspective and nostalgic (Faded, Apologize)',
    mode: 'major',
    degrees: [5, 3, 0, 4],
    defaultBeats: 4
  },
  {
    name: 'Royal Road / Odo Shinkou (IV - V - iii - vi)',
    genre: 'J-Pop / Anime / Asian Pop',
    description: 'The quintessential Asian Pop and Anime progression with powerful dramatic emotional lift',
    mode: 'major',
    degrees: [3, 4, 2, 5],
    defaultBeats: 4
  },
  {
    name: '50s Doo-Wop / Retro (I - vi - IV - V)',
    genre: 'Retro / RnB / Oldies',
    description: 'The classic mid-century progression of timeless golden standards (Stand By Me, Beautiful Girls)',
    mode: 'major',
    degrees: [0, 5, 3, 4],
    defaultBeats: 4
  },
  {
    name: 'Jazz Cadence (ii7 - V7 - Imaj7 - VI7)',
    genre: 'Jazz / Neo-Soul',
    description: 'The standard harmonic turnaround of jazz, smooth and sophisticated',
    mode: 'major',
    use7ths: true,
    degrees: [1, 4, 0, 5],
    defaultBeats: 4
  },
  {
    name: 'Pachelbel Canon (I - V - vi - iii - IV - I - IV - V)',
    genre: 'Classical / Anthem',
    description: '8-bar progression creating continuous forward melodic motion and resolution',
    mode: 'major',
    degrees: [0, 4, 5, 2, 3, 0, 3, 4],
    defaultBeats: 4
  },
  {
    name: 'Andalusian Cadence (i - VII - VI - V)',
    genre: 'Flamenco / Latin Rock',
    description: 'Descending chromatic bassline with suspenseful and driving momentum (Hit The Road Jack, Sultans of Swing)',
    mode: 'minor',
    degrees: [0, 6, 5, 4],
    defaultBeats: 4
  },
  {
    name: 'Hopeful Journey (I - iii - IV - V)',
    genre: 'Acoustic / Hopeful',
    description: 'Bright, acoustic, open-hearted and optimistic',
    mode: 'major',
    degrees: [0, 2, 3, 4],
    defaultBeats: 4
  },
  {
    name: 'Lofi Chill / R&B (IVmaj7 - iii7 - ii7 - Imaj7)',
    genre: 'Lofi / Neo-Soul',
    description: 'Stepwise descending cadence, perfect for relaxing beats and vocal melodies',
    mode: 'major',
    use7ths: true,
    degrees: [3, 2, 1, 0],
    defaultBeats: 4
  }
];

// Helper: Normalize note name to chromatic pitch class (0..11)
function noteNameToMidi(name) {
  const clean = name.trim();
  const idxSharp = NOTE_NAMES.indexOf(clean);
  if (idxSharp !== -1) return idxSharp;
  const idxFlat = FLAT_NAMES.indexOf(clean);
  if (idxFlat !== -1) return idxFlat;
  return 0; // Default C
}

// Convert pitch class (0..11) to name considering key accidentals
function midiToNoteName(pitchClass, preferFlat = false) {
  const p = (pitchClass % 12 + 12) % 12;
  return preferFlat ? FLAT_NAMES[p] : NOTE_NAMES[p];
}

// Check if a key prefers flats (F, Bb, Eb, Ab, Db, Gb or minor keys Dm, Gm, Cm, Fm, Bbm)
function prefersFlats(rootNote, isMinor = false) {
  const flatRoots = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'd', 'g', 'c', 'f', 'bb'];
  return flatRoots.includes(rootNote);
}

// Get the diatonic chords for a key and scale mode
function getScaleChords(rootName, modeKey = 'major', use7ths = false) {
  const rootMidi = noteNameToMidi(rootName);
  const mode = SCALE_MODES[modeKey] || SCALE_MODES.major;
  const useFlat = prefersFlats(rootName, modeKey.includes('minor') || modeKey.includes('penta'));

  const chords = [];

  for (let i = 0; i < mode.intervals.length; i++) {
    const interval = mode.intervals[i];
    const chordRootMidi = (rootMidi + interval) % 12;
    const chordRootName = midiToNoteName(chordRootMidi, useFlat);

    const type = use7ths ? mode.seventhTypes[i] : mode.triadTypes[i];
    const intervals = CHORD_INTERVALS[type] || CHORD_INTERVALS.maj;
    const suffix = CHORD_DISPLAY_SUFFIX[type] || '';
    const fullName = chordRootName + suffix;
    const degree = mode.degreeNames[i];
    const funcName = mode.functions[i];

    // Compute notes in octave 3/4 for voicing
    const bassMidi = 36 + chordRootMidi;
    const chordMidiNotes = [bassMidi];

    // Voicing: triad/7th in octave 3/4
    const baseOctave = chordRootMidi < 4 ? 48 : 48;
    for (const semitone of intervals) {
      chordMidiNotes.push(baseOctave + chordRootMidi + semitone);
    }

    chords.push({
      index: i,
      degree,
      rootName: chordRootName,
      type,
      fullName,
      functionName: funcName,
      midiNotes: chordMidiNotes,
      intervals,
      isDiatonic: true
    });
  }

  // Bonus: Add useful "Borrowed Chords" (Modal Interchange) for creative inspiration
  const borrowed = [];
  if (modeKey === 'major' || modeKey === 'major_penta') {
    // iv (Minor 4th - famous tearjerker)
    const ivMidi = (rootMidi + 5) % 12;
    borrowed.push({
      degree: 'iv',
      rootName: midiToNoteName(ivMidi, true),
      type: use7ths ? 'm7' : 'min',
      fullName: midiToNoteName(ivMidi, true) + (use7ths ? 'm7' : 'm'),
      functionName: 'Borrowed Minor iv (Deep Emotion / Radiohead Ballad)',
      midiNotes: [36 + ivMidi, 48 + ivMidi, 48 + ivMidi + 3, 48 + ivMidi + 7],
      isBorrowed: true
    });
    // bVII (Flat 7th - rock & soul vibe)
    const bviMidi = (rootMidi + 10) % 12;
    borrowed.push({
      degree: 'bVII',
      rootName: midiToNoteName(bviMidi, true),
      type: use7ths ? '7' : 'maj',
      fullName: midiToNoteName(bviMidi, true) + (use7ths ? '7' : ''),
      functionName: 'Borrowed bVII (Rock, Epic, Backdoor Dominant)',
      midiNotes: [36 + bviMidi, 48 + bviMidi, 48 + bviMidi + 4, 48 + bviMidi + 7],
      isBorrowed: true
    });
    // bVI (Flat 6th - epic cinematic)
    const b6Midi = (rootMidi + 8) % 12;
    borrowed.push({
      degree: 'bVI',
      rootName: midiToNoteName(b6Midi, true),
      type: 'maj',
      fullName: midiToNoteName(b6Midi, true),
      functionName: 'Borrowed bVI (Cinematic Drama, Sudden Wonder)',
      midiNotes: [36 + b6Midi, 48 + b6Midi, 48 + b6Midi + 4, 48 + b6Midi + 7],
      isBorrowed: true
    });
    // V/vi (Secondary dominant E7 in C major)
    const v6Midi = (rootMidi + 4) % 12;
    borrowed.push({
      degree: 'V/vi',
      rootName: midiToNoteName(v6Midi, useFlat),
      type: '7',
      fullName: midiToNoteName(v6Midi, useFlat) + '7',
      functionName: 'Secondary Dominant V/vi (Leading to Relative Minor)',
      midiNotes: [36 + v6Midi, 48 + v6Midi, 48 + v6Midi + 4, 48 + v6Midi + 7, 48 + v6Midi + 10],
      isBorrowed: true
    });
  } else if (modeKey.includes('minor') || modeKey === 'blues') {
    // V7 (Major/Dominant V in minor - harmonic minor feel)
    const vMidi = (rootMidi + 7) % 12;
    borrowed.push({
      degree: 'V7',
      rootName: midiToNoteName(vMidi, useFlat),
      type: '7',
      fullName: midiToNoteName(vMidi, useFlat) + '7',
      functionName: 'Major Dominant V7 (Harmonic Minor Resolution)',
      midiNotes: [36 + vMidi, 48 + vMidi, 48 + vMidi + 4, 48 + vMidi + 7, 48 + vMidi + 10],
      isBorrowed: true
    });
    // IV (Major 4th - Dorian bright vibe)
    const ivMidi = (rootMidi + 5) % 12;
    borrowed.push({
      degree: 'IV',
      rootName: midiToNoteName(ivMidi, useFlat),
      type: 'maj',
      fullName: midiToNoteName(ivMidi, useFlat),
      functionName: 'Major IV (Bright Dorian Mode Color)',
      midiNotes: [36 + ivMidi, 48 + ivMidi, 48 + ivMidi + 4, 48 + ivMidi + 7],
      isBorrowed: true
    });
  }

  return { chords, borrowed };
}

// Convert MIDI number (e.g. 60 = C4) to frequency (Hz)
function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Format a chord into a human readable description with notes
function describeChordNotes(chord) {
  if (!chord || !chord.midiNotes) return '';
  const noteList = chord.midiNotes.slice(1).map(m => {
    const pc = m % 12;
    const oct = Math.floor(m / 12) - 1;
    return `${NOTE_NAMES[pc]}${oct}`;
  });
  return noteList.join(' - ');
}

// Export module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NOTE_NAMES,
    FLAT_NAMES,
    SCALE_MODES,
    CHORD_INTERVALS,
    CHORD_DISPLAY_SUFFIX,
    PROGRESSION_TEMPLATES,
    getScaleChords,
    midiToFreq,
    noteNameToMidi,
    midiToNoteName,
    describeChordNotes
  };
}

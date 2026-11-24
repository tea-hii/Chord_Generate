// Music Theory Engine for Chord Progression App
// Provides notes, scales, diatonic degrees, chords, voicings, and progression templates

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Circle of Fifths order starting from C
const CIRCLE_OF_FIFTHS = [
  { root: 'C',  midi: 0,  minor: 'Am',  accidentals: 0,  label: 'C' },
  { root: 'G',  midi: 7,  minor: 'Em',  accidentals: 1,  label: 'G (1#)' },
  { root: 'D',  midi: 2,  minor: 'Bm',  accidentals: 2,  label: 'D (2#)' },
  { root: 'A',  midi: 9,  minor: 'F#m', accidentals: 3,  label: 'A (3#)' },
  { root: 'E',  midi: 4,  minor: 'C#m', accidentals: 4,  label: 'E (4#)' },
  { root: 'B',  midi: 11, minor: 'G#m', accidentals: 5,  label: 'B (5#)' },
  { root: 'F#', midi: 6,  minor: 'D#m', accidentals: 6,  label: 'F# / Gb (6#)' },
  { root: 'Db', midi: 1,  minor: 'Bbm', accidentals: -5, label: 'Db / C# (5b)' },
  { root: 'Ab', midi: 8,  minor: 'Fm',  accidentals: -4, label: 'Ab (4b)' },
  { root: 'Eb', midi: 3,  minor: 'Cm',  accidentals: -3, label: 'Eb (3b)' },
  { root: 'Bb', midi: 10, minor: 'Gm',  accidentals: -2, label: 'Bb (2b)' },
  { root: 'F',  midi: 5,  minor: 'Dm',  accidentals: -1, label: 'F (1b)' },
];

// Scale intervals (semitones from tonic)
const SCALE_MODES = {
  major: {
    name: 'Major (Trưởng / Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degreeNames: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    triadTypes: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
    seventhTypes: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
    functions: ['Chủ âm (Tonic)', 'Tiền át (Subdominant)', 'Trung gian (Mediant)', 'Hạ át (Subdominant)', 'Át âm (Dominant)', 'Hạ trung gian (Submediant)', 'Cảm âm (Leading)']
  },
  minor: {
    name: 'Natural Minor (Thứ tự nhiên / Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degreeNames: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    triadTypes: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
    seventhTypes: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'],
    functions: ['Chủ âm (Tonic)', 'Tiền át (Subdominant)', 'Trung gian (Mediant)', 'Hạ át (Subdominant)', 'Át âm (Dominant)', 'Hạ trung gian (Submediant)', 'Dưới chủ âm (Subtonic)']
  },
  harmonic_minor: {
    name: 'Harmonic Minor (Thứ hòa âm)',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degreeNames: ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'],
    triadTypes: ['min', 'dim', 'aug', 'min', 'maj', 'maj', 'dim'],
    seventhTypes: ['m(maj7)', 'm7b5', 'maj7#5', 'm7', '7', 'maj7', 'dim7'],
    functions: ['Chủ âm', 'Tiền át', 'Trung gian', 'Hạ át', 'Át âm kịch tính', 'Hạ trung gian', 'Cảm âm']
  },
  dorian: {
    name: 'Dorian (Thứ tươi / Folk / Jazz)',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degreeNames: ['i', 'ii', 'III', 'IV', 'v', 'vi°', 'VII'],
    triadTypes: ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj'],
    seventhTypes: ['m7', 'm7', 'maj7', '7', 'm7', 'm7b5', 'maj7'],
    functions: ['Chủ âm', 'Hạ át', 'Trung gian', 'Đặc trưng Dorian', 'Át âm', 'Giảm', 'Dưới chủ']
  },
  mixolydian: {
    name: 'Mixolydian (Trưởng Blues / Rock)',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degreeNames: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'bVII'],
    triadTypes: ['maj', 'min', 'dim', 'maj', 'min', 'min', 'maj'],
    seventhTypes: ['7', 'm7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7'],
    functions: ['Chủ âm át', 'Tiền át', 'Giảm', 'Hạ át', 'Át thứ', 'Hạ trung', 'Đặc trưng Mixo']
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

// Pre-defined popular chord progressions for instant inspiration
const PROGRESSION_TEMPLATES = [
  {
    name: 'Pop Wonder (I - V - vi - IV)',
    genre: 'Pop / Ballad',
    description: 'Vòng 4 hợp âm bất hủ trong hàng ngàn bài hit (Someone Like You, Perfect, Don\'t Stop Believin\')',
    mode: 'major',
    degrees: [0, 4, 5, 3], // 0-based indices in scale: I, V, vi, IV
    defaultBeats: 4
  },
  {
    name: 'Emotional / Sad Mood (vi - IV - I - V)',
    genre: 'Emotional / Indie',
    description: 'Bắt đầu bằng bậc vi gợi cảm giác sâu lắng, hoài niệm (Faded, Nơi này có anh, Apologize)',
    mode: 'major',
    degrees: [5, 3, 0, 4],
    defaultBeats: 4
  },
  {
    name: 'Royal Road / Odo Shinkou (IV - V - iii - vi)',
    genre: 'J-Pop / Anime / V-Pop',
    description: 'Vòng hòa thanh hoàng kim cảm xúc mãnh liệt đặc trưng Anime & nhạc trẻ châu Á',
    mode: 'major',
    degrees: [3, 4, 2, 5],
    defaultBeats: 4
  },
  {
    name: '50s Doo-Wop / Retro (I - vi - IV - V)',
    genre: 'Retro / RnB / Oldies',
    description: 'Vòng kinh điển của thập niên 50-60 (Stand By Me, Beautiful Girls, Dấu mưa)',
    mode: 'major',
    degrees: [0, 5, 3, 4],
    defaultBeats: 4
  },
  {
    name: 'Jazz Cadence (ii7 - V7 - Imaj7 - VI7)',
    genre: 'Jazz / Neo-Soul',
    description: 'Cặp hòa thanh chuyển bậc chuẩn mực của nhạc Jazz, mượt mà và sang trọng',
    mode: 'major',
    use7ths: true,
    degrees: [1, 4, 0, 5],
    defaultBeats: 4
  },
  {
    name: 'Pachelbel Canon (I - V - vi - iii - IV - I - IV - V)',
    genre: 'Classical / Wedding Pop',
    description: '8 ô nhịp tròn trịa, nâng đỡ giai điệu thăng hoa liên tục',
    mode: 'major',
    degrees: [0, 4, 5, 2, 3, 0, 3, 4],
    defaultBeats: 4
  },
  {
    name: 'Andalusian Cadence (i - VII - VI - V)',
    genre: 'Flamenco / Latin Rock',
    description: 'Bước đi chromatic đi xuống bí ẩn, dồn dập (Hit The Road Jack, Sultans of Swing)',
    mode: 'minor',
    degrees: [0, 6, 5, 4],
    defaultBeats: 4
  },
  {
    name: 'Hopeful Journey (I - iii - IV - V)',
    genre: 'Acoustic / Hopeful',
    description: 'Âm thanh tươi sáng, hi vọng và mộc mạc',
    mode: 'major',
    degrees: [0, 2, 3, 4],
    defaultBeats: 4
  },
  {
    name: 'Lofi Chill / R&B (IVmaj7 - iii7 - ii7 - Imaj7)',
    genre: 'Lofi / Neo-Soul',
    description: 'Hạ dần nhẹ nhàng êm dịu, rất hợp để chill hoặc viết rap/melody',
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
  const useFlat = prefersFlats(rootName, modeKey.includes('minor'));

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
    // Root bass in octave 2 (36 + rootMidi) or octave 3 (48 + rootMidi)
    const bassMidi = 36 + chordRootMidi;
    const chordMidiNotes = [bassMidi];

    // Voicing: triad/7th in octave 3/4
    // Root note in upper register:
    const baseOctave = chordRootMidi < 4 ? 48 : 48; // keep close voicing around middle C
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

  // Bonus: Add useful "Borrowed Chords" (Hợp âm vay mượn) for creative spark
  const borrowed = [];
  if (modeKey === 'major') {
    // iv (Minor 4th - famous tearjerker)
    const ivMidi = (rootMidi + 5) % 12;
    borrowed.push({
      degree: 'iv',
      rootName: midiToNoteName(ivMidi, true),
      type: use7ths ? 'm7' : 'min',
      fullName: midiToNoteName(ivMidi, true) + (use7ths ? 'm7' : 'm'),
      functionName: 'Vay mượn bậc iv thứ (cực kỳ cảm xúc / Radiohead)',
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
      functionName: 'Vay mượn bVII (Rock, Epic, hào hùng)',
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
      functionName: 'Vay mượn bVI (Điện ảnh, kịch tính, bất ngờ)',
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
      functionName: 'Át phụ về bậc vi (Dẫn về nốt trầm da diết)',
      midiNotes: [36 + v6Midi, 48 + v6Midi, 48 + v6Midi + 4, 48 + v6Midi + 7, 48 + v6Midi + 10],
      isBorrowed: true
    });
  } else if (modeKey === 'minor') {
    // V7 (Major/Dominant V in minor - harmonic minor feel)
    const vMidi = (rootMidi + 7) % 12;
    borrowed.push({
      degree: 'V7',
      rootName: midiToNoteName(vMidi, useFlat),
      type: '7',
      fullName: midiToNoteName(vMidi, useFlat) + '7',
      functionName: 'Át trưởng V7 (Cổ điển, kết dứt khoát về i)',
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
      functionName: 'Bậc IV trưởng (Màu Dorian, tươi sáng)',
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
    CIRCLE_OF_FIFTHS,
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

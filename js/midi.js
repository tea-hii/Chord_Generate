// Lightweight client-side Standard MIDI File (.mid) Generator
// Allows instant Drag & Drop into DAWs (FL Studio, Ableton, Logic, GarageBand, etc.)

class MidiWriter {
  // Convert variable length quantity
  static writeVarLen(value) {
    let buffer = value & 0x7F;
    while ((value >>= 7)) {
      buffer <<= 8;
      buffer |= ((value & 0x7F) | 0x80);
    }
    const bytes = [];
    while (true) {
      bytes.push(buffer & 0xFF);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
    return bytes;
  }

  // Generate binary MIDI Uint8Array from progression slots
  static generateMidi(slots, bpm = 120, beatsPerBar = 4) {
    const ticksPerBeat = 480;
    const trackEvents = [];

    // Meta event: Set Tempo (microsec per quarter note)
    const microsecPerBeat = Math.round(60000000 / bpm);
    trackEvents.push(
      0x00, // Delta time 0
      0xFF, 0x51, 0x03,
      (microsecPerBeat >> 16) & 0xFF,
      (microsecPerBeat >> 8) & 0xFF,
      microsecPerBeat & 0xFF
    );

    // Meta event: Time Signature
    trackEvents.push(
      0x00, // Delta time 0
      0xFF, 0x58, 0x04,
      beatsPerBar, 0x02, 0x18, 0x08 // 4/4 or 3/4
    );

    // Track Name Meta Event
    const trackName = "Chord Progression";
    const nameBytes = Array.from(trackName).map(c => c.charCodeAt(0));
    trackEvents.push(0x00, 0xFF, 0x03, nameBytes.length, ...nameBytes);

    // Write chord events
    for (const slot of slots) {
      if (!slot.chord || !slot.chord.midiNotes) continue;

      const durationTicks = Math.round(slot.beats * ticksPerBeat);
      const notes = slot.chord.midiNotes;

      // Note Ons (all at delta time 0)
      notes.forEach((midi, idx) => {
        trackEvents.push(idx === 0 ? 0x00 : 0x00);
        trackEvents.push(0x90, midi, 85); // Note on, channel 0, vel 85
      });

      // Note Offs after durationTicks
      notes.forEach((midi, idx) => {
        if (idx === 0) {
          trackEvents.push(...MidiWriter.writeVarLen(durationTicks));
        } else {
          trackEvents.push(0x00);
        }
        trackEvents.push(0x80, midi, 0); // Note off
      });
    }

    // End of Track Meta Event
    trackEvents.push(0x00, 0xFF, 0x2F, 0x00);

    // MTrk Header
    const trackLength = trackEvents.length;
    const mtrkChunk = [
      0x4D, 0x54, 0x72, 0x6B, // "MTrk"
      (trackLength >> 24) & 0xFF,
      (trackLength >> 16) & 0xFF,
      (trackLength >> 8) & 0xFF,
      trackLength & 0xFF,
      ...trackEvents
    ];

    // MThd Header: Format 0, 1 track, 480 ticks/beat
    const mthdChunk = [
      0x4D, 0x54, 0x68, 0x64, // "MThd"
      0x00, 0x00, 0x00, 0x06, // Chunk length 6
      0x00, 0x00,             // Format 0
      0x00, 0x01,             // 1 track
      (ticksPerBeat >> 8) & 0xFF,
      ticksPerBeat & 0xFF
    ];

    const fileBytes = new Uint8Array([...mthdChunk, ...mtrkChunk]);
    return fileBytes;
  }

  // Trigger download of MIDI file in browser
  static download(slots, bpm = 120, beatsPerBar = 4, filename = 'chord-progression.mid') {
    const midiBytes = MidiWriter.generateMidi(slots, bpm, beatsPerBar);
    const blob = new Blob([midiBytes], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.MidiWriter = MidiWriter;

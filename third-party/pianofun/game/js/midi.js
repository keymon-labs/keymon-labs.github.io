// midi.js — MIDI connection + note event handling

const MidiManager = {
  access: null,
  input: null,
  activeNotes: new Set(),
  connected: false,
  deviceName: '',
  onNoteOn: null,   // callback(midi, velocity)
  onNoteOff: null,  // callback(midi)
  onConnectionChange: null, // callback(connected, deviceName)

  async init() {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not supported in this browser');
      this._updateStatus(false, 'Web MIDI not supported — use Chrome');
      return false;
    }

    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
      this.access.onstatechange = (e) => this._onStateChange(e);
      this._findInput();
      return true;
    } catch (err) {
      console.error('MIDI access denied:', err);
      this._updateStatus(false, 'MIDI access denied');
      return false;
    }
  },

  _findInput() {
    // Look through all MIDI inputs for a connected device
    let found = false;
    for (const input of this.access.inputs.values()) {
      if (input.state === 'connected') {
        this._connectInput(input);
        found = true;
        break;
      }
    }
    if (!found) {
      this._updateStatus(false, 'No piano detected — use keyboard or plug in USB');
    }
  },

  _connectInput(input) {
    // Disconnect previous if any
    if (this.input) {
      this.input.onmidimessage = null;
    }

    this.input = input;
    this.input.onmidimessage = (msg) => this._onMessage(msg);
    this.connected = true;
    this.deviceName = input.name || 'MIDI Piano';
    this._updateStatus(true, this.deviceName);
    console.log('MIDI connected:', this.deviceName);
  },

  _onStateChange(event) {
    const port = event.port;
    if (port.type !== 'input') return;

    if (port.state === 'connected') {
      this._connectInput(port);
    } else if (port.state === 'disconnected' && this.input === port) {
      this.input = null;
      this.connected = false;
      this.activeNotes.clear();
      this._updateStatus(false, 'Piano disconnected');
    }
  },

  _onMessage(msg) {
    const [status, note, velocity] = msg.data;
    const command = status & 0xF0;

    if (command === 0x90 && velocity > 0) {
      // Note On
      this.activeNotes.add(note);
      if (this.onNoteOn) this.onNoteOn(note, velocity);
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      // Note Off
      this.activeNotes.delete(note);
      if (this.onNoteOff) this.onNoteOff(note);
    }
  },

  _updateStatus(connected, text) {
    this.connected = connected;
    if (this.onConnectionChange) {
      this.onConnectionChange(connected, text);
    }

    // Update UI indicators
    const dot = document.getElementById('midi-dot');
    const label = document.getElementById('midi-label');
    if (dot) {
      dot.className = 'midi-dot ' + (connected ? 'connected' : 'disconnected');
    }
    if (label) {
      label.textContent = text;
    }
  },

  isNoteActive(midi) {
    return this.activeNotes.has(midi);
  }
};

// Piano Drift input: MIDI/Bluetooth/computer keys -> a synth voice fed into stereoDrift's own `analyser`
// (a global of the vendored script), so every visual style reacts to the playing. Markup: index.html, styles: piano.css.
import { connectMidi, connectBluetoothMidi, keyboardNotes } from "../shared/midi.js";
import { voiceParams } from "./voice.js";

const $ = (id) => document.getElementById(id);
const state = { notes: 0, voices: 0, instrument: false, started: false };

function start() {
  window.audioCtx.resume();
  if (state.started) return;
  state.started = true;
  window.isAudioPlaying = true; // their draw loops only run while this is true
  window.refresh();
}

// Sound goes to the speakers only when asked, or when no real instrument is connected (it would double the piano).
const audible = () => $("sound").value === "on" || ($("sound").value === "auto" && !state.instrument);

function onNote(midi, velocity = 90) {
  start();
  const ctx = window.audioCtx, p = voiceParams(midi, velocity), t = ctx.currentTime;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(p.peak, t + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
  // The analyser hears the bright signal so the upper frequency bins move; the speakers get it filtered.
  amp.connect(window.analyser);
  if (audible()) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = p.cutoff;
    amp.connect(lp).connect(ctx.destination);
  }
  const oscs = [["triangle", 1, 1], ["sawtooth", 1, 0.3], ["sine", 2, 0.4]].map(([type, mult, gain]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = p.freq * mult; g.gain.value = gain;
    o.connect(g).connect(amp); o.start(t); o.stop(t + p.decay + 0.05);
    return o;
  });
  state.notes++; state.voices++;
  oscs[0].onended = () => { state.voices--; amp.disconnect(); };
}

function onStatus(s) {
  state.instrument = s.ok;
  $("status").textContent = s.ok ? `🎹 ${s.name}` : s.message;
  $("dot").className = "dot" + (s.ok ? " on" : "");
}

$("btnMidi").onclick = () => { start(); connectMidi(onNote, onStatus); };
$("btnBle").onclick = () => { start(); connectBluetoothMidi(onNote, onStatus); };
keyboardNotes(onNote);

window.__pianoDrift = {
  onNote, state,
  /** Sum of the analyser's frequency bins: > 0 when the visuals are being fed. */
  energy() { const a = new Uint8Array(window.analyser.frequencyBinCount); window.analyser.getByteFrequencyData(a); return a.reduce((x, y) => x + y, 0); },
};

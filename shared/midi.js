// Note input from a real instrument: Web MIDI (USB or OS-paired), Bluetooth LE MIDI, or the computer keyboard.
// Only note-on events are reported. Chrome/Edge only: Safari/iOS has neither Web MIDI nor Web Bluetooth.
//
// Callbacks:  onNote(midiNumber)
//             onStatus({ ok: true, name })            connected (name of device(s))
//             onStatus({ ok: false, message })        unsupported / refused / no device / disconnected

const noteOn = (onNote) => (s, a, b) => { if ((s & 0xF0) === 0x90 && b > 0) onNote(a); };

/** Web MIDI: binds every input, re-binds when devices come and go. Call from a user gesture. */
export async function connectMidi(onNote, onStatus) {
  if (!navigator.requestMIDIAccess) return onStatus({ ok: false, message: "No Web MIDI in this browser. Use Chrome or Edge." });
  const msg = noteOn(onNote);
  try {
    const acc = await navigator.requestMIDIAccess();
    const bind = () => {
      const ins = [...acc.inputs.values()];
      ins.forEach((i) => (i.onmidimessage = (e) => msg(e.data[0], e.data[1], e.data[2] ?? 0)));
      onStatus(ins.length ? { ok: true, name: ins.map((i) => i.name).join(", ") }
                          : { ok: false, message: "MIDI ready, but no instrument found. Plug in USB or pair it first." });
    };
    acc.onstatechange = bind; bind();
  } catch { onStatus({ ok: false, message: "MIDI access was refused." }); }
}

// Standard BLE-MIDI service/characteristic UUIDs.
const BLE_SVC = "03b80e5a-ede8-4b33-a751-6ce34ec4c700", BLE_CHR = "7772e5db-3868-4112-a1a9-f2669d106bf3";
const dataLen = (s) => { const t = s & 0xF0; return (t === 0xC0 || t === 0xD0) ? 1 : (s >= 0xF0 ? 0 : 2); };

/** Bluetooth LE MIDI via Web Bluetooth (no OS pairing needed). Call from a user gesture. */
export async function connectBluetoothMidi(onNote, onStatus) {
  if (!navigator.bluetooth) return onStatus({ ok: false, message: "No Web Bluetooth in this browser. Use Chrome or Edge." });
  const msg = noteOn(onNote);
  let run = 0; // running status
  // BLE-MIDI packet: header byte, then [timestamp byte] status data… with running status.
  const parse = (p) => {
    let i = 1;
    while (i < p.length) {
      let b = p[i];
      if (b & 0x80) { i++; if (i >= p.length) break; b = p[i]; if (b & 0x80) { if (b >= 0xF8) { i++; continue; } if (b === 0xF0) return; run = b; i++; } }
      if (!run) { i++; continue; }
      const n = dataLen(run); if (i + n > p.length) break;
      msg(run, p[i], n > 1 ? p[i + 1] : 0); i += n;
    }
  };
  try {
    const dev = await navigator.bluetooth.requestDevice({ filters: [{ services: [BLE_SVC] }] });
    dev.addEventListener("gattserverdisconnected", () => onStatus({ ok: false, message: "Instrument disconnected. Tap Connect again.", disconnected: true }));
    const chr = await (await (await dev.gatt.connect()).getPrimaryService(BLE_SVC)).getCharacteristic(BLE_CHR);
    chr.addEventListener("characteristicvaluechanged", (e) => parse(new Uint8Array(e.target.value.buffer)));
    await chr.startNotifications();
    onStatus({ ok: true, name: dev.name || "Bluetooth instrument" });
  } catch (e) {
    if (e.name !== "NotFoundError") onStatus({ ok: false, message: "Bluetooth failed. Turn on Bluetooth MIDI on the instrument and unpair it from other devices." });
  }
}

// Piano-style computer keys: A W S E D F T G Y H U J K = C4..C5, Shift = one octave down.
const KEYS = { a:60, w:61, s:62, e:63, d:64, f:65, t:66, g:67, y:68, h:69, u:70, j:71, k:72 };

/** Computer keyboard as a fallback instrument. Ignores keys typed into form fields. */
export function keyboardNotes(onNote) {
  addEventListener("keydown", (e) => {
    if (/^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.repeat) return;
    let n = KEYS[e.key.toLowerCase()]; if (n === undefined) return;
    if (e.shiftKey) n -= 12;
    onNote(n);
  });
}

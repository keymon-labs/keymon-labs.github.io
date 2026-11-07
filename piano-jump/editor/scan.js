// "Scan a page": photo or image file → straighten, contrast, crop to one staff → recogniser → notes handed to the editor for review.
// Everything stays in this page's memory: no upload, no storage. The full photo is dropped once its staff has been read; only the
// cropped staff stays beside the editor (until "Discard photo") so the notes can be checked against it. Markup: index.html #scan, #photoPane.
import { recognize } from "./omr/engine.js";      // swap engines here: anything with recognize(imageData, { clef }) → [{ pitch, beats, bar, confidence, x, y }]
import { LOW_CONFIDENCE } from "./song-model.js";

const $ = (id) => document.getElementById(id);
const MAX_PHOTO = 1600, MAX_STAFF = 1400;            // pixel caps: keep phones fast and the staff line gap in a range the recogniser likes
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const contrastFactor = (c) => 1 + c / 20;            // slider 0..100 → ×1..×6 around mid grey

export function initScan({ onOpen, onClose, onResult, onPhotoGone }) {
  let src = null, rotated = null, quarter = 0, crop = { x0: 0.04, y0: 0.04, x1: 0.96, y1: 0.96 }, drag = null, lastCrop = null, raf = 0;
  const view = $("cropCanvas"), box = $("cropBox"), wrap = $("cropWrap");

  const step = (name) => { for (const id of ["scanPick", "scanAdjust", "scanBusy", "scanFail"]) $(id).hidden = id !== name; };
  const msg = (t) => { $("scanMsg").textContent = t || ""; };
  const clef = () => document.querySelector('input[name="clef"]:checked').value;

  function dropSource() {                              // forget the full photo
    for (const c of [src, rotated]) if (c) { c.width = 0; c.height = 0; }
    src = rotated = null; view.width = 0; view.height = 0;
  }
  function open() { msg(""); step("scanPick"); $("scan").hidden = false; onOpen(); }
  function close() { dropSource(); lastCrop = null; $("scan").hidden = true; onClose(); }
  function discardPhoto() { const p = $("photoCanvas"); p.width = 0; p.height = 0; $("photoPane").hidden = true; onPhotoGone(); }

  async function load(file) {
    if (!file) return;
    msg("");
    let bmp, url;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch {
      try { url = URL.createObjectURL(file); bmp = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = url; }); }
      catch { if (url) URL.revokeObjectURL(url); return msg("That file could not be opened as a picture. Try a JPG or PNG photo."); }
    }
    dropSource();
    const k = Math.min(1, MAX_PHOTO / Math.max(bmp.width, bmp.height));
    src = document.createElement("canvas"); src.width = Math.round(bmp.width * k); src.height = Math.round(bmp.height * k);
    src.getContext("2d").drawImage(bmp, 0, 0, src.width, src.height);
    bmp.close?.(); if (url) URL.revokeObjectURL(url);
    quarter = 0; $("rngTilt").value = 0; crop = { x0: 0.04, y0: 0.04, x1: 0.96, y1: 0.96 };
    step("scanAdjust"); renderView();
  }

  /** Photo turned by the quarter turns plus the straighten slider, on a white background. */
  function renderView() {
    if (!src) return;
    const a = (quarter * 90 + +$("rngTilt").value) * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    const w = Math.round(src.width * c + src.height * s), h = Math.round(src.width * s + src.height * c);
    rotated = rotated || document.createElement("canvas"); rotated.width = w; rotated.height = h;
    const g = rotated.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    g.translate(w / 2, h / 2); g.rotate(a); g.drawImage(src, -src.width / 2, -src.height / 2);
    view.width = w; view.height = h; view.getContext("2d").drawImage(rotated, 0, 0);
    view.style.filter = `grayscale(1) contrast(${contrastFactor(+$("rngContrast").value)})`;
    placeBox();
  }
  const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(renderView); };
  function placeBox() {
    const W = view.clientWidth, H = view.clientHeight;
    Object.assign(box.style, { left: crop.x0 * W + "px", top: crop.y0 * H + "px", width: (crop.x1 - crop.x0) * W + "px", height: (crop.y1 - crop.y0) * H + "px" });
  }

  wrap.addEventListener("pointerdown", (e) => {
    const h = e.target.closest("i[data-h]")?.dataset.h;
    if (!h && e.target !== box) return;
    drag = { h: h || "move", x: e.clientX, y: e.clientY, from: { ...crop } };
    wrap.setPointerCapture(e.pointerId); e.preventDefault();
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = view.getBoundingClientRect(), dx = (e.clientX - drag.x) / r.width, dy = (e.clientY - drag.y) / r.height, min = 0.06;
    let { x0, y0, x1, y1 } = drag.from;
    if (drag.h === "move") { const w = x1 - x0, h = y1 - y0; x0 = clamp(x0 + dx, 0, 1 - w); y0 = clamp(y0 + dy, 0, 1 - h); x1 = x0 + w; y1 = y0 + h; }
    else {
      if (drag.h.includes("w")) x0 = clamp(x0 + dx, 0, x1 - min);
      if (drag.h.includes("e")) x1 = clamp(x1 + dx, x0 + min, 1);
      if (drag.h.includes("n")) y0 = clamp(y0 + dy, 0, y1 - min);
      if (drag.h.includes("s")) y1 = clamp(y1 + dy, y0 + min, 1);
    }
    crop = { x0, y0, x1, y1 }; placeBox();
  });
  for (const t of ["pointerup", "pointercancel"]) wrap.addEventListener(t, () => { drag = null; });
  addEventListener("resize", () => { if (src) placeBox(); });

  /** The chosen box as an image with the contrast boost applied (grey levels). */
  function cropped() {
    const sx = crop.x0 * rotated.width, sy = crop.y0 * rotated.height, sw = (crop.x1 - crop.x0) * rotated.width, sh = (crop.y1 - crop.y0) * rotated.height;
    const k = Math.min(1, MAX_STAFF / sw), canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw * k)); canvas.height = Math.max(1, Math.round(sh * k));
    const g = canvas.getContext("2d", { willReadFrequently: true }); g.imageSmoothingQuality = "high";
    g.drawImage(rotated, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const image = g.getImageData(0, 0, canvas.width, canvas.height), d = image.data, f = contrastFactor(+$("rngContrast").value);
    for (let i = 0; i < d.length; i += 4) { const v = clamp(((d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) - 128) * f + 128, 0, 255); d[i] = d[i + 1] = d[i + 2] = v; }
    g.putImageData(image, 0, 0);
    return { canvas, image };
  }

  /** Show the cropped staff beside the editor; dots mark where each note was read (orange = unsure). */
  function showPhoto(canvas, found) {
    const p = $("photoCanvas"); p.width = canvas.width; p.height = canvas.height;
    const g = p.getContext("2d"); g.drawImage(canvas, 0, 0); g.lineWidth = 3;
    for (const n of found) { g.strokeStyle = n.confidence < LOW_CONFIDENCE ? "#ff7a00" : "#1f9d55"; g.beginPath(); g.arc(n.x, n.y, 12, 0, 7); g.stroke(); }
    $("photoPane").hidden = false;
  }

  function fail(text, canvas) {
    lastCrop = canvas || lastCrop; $("scanFailMsg").textContent = text; step("scanFail");
    $("btnTryAgain").hidden = !src;
  }
  async function read() {
    if (!src) return;
    step("scanBusy");
    try {
      const { canvas, image } = cropped();
      const found = await recognize(image, { clef: clef() });
      if (!found.length) return fail("No notes were found in that crop. Try a tighter box around one staff, more contrast, or Straighten if the lines slope. Or enter the notes by tapping, with your photo beside the editor.", canvas);
      showPhoto(canvas, found); dropSource(); lastCrop = null;
      onResult(found); $("scan").hidden = true; onClose();
    } catch (e) { fail(`Something went wrong while reading that picture (${e.message}). Try a smaller crop.`); }
  }

  $("btnCam").onclick = () => $("fileCam").click();
  $("btnImg").onclick = () => $("fileImg").click();
  for (const id of ["fileCam", "fileImg"]) $(id).onchange = (e) => { const f = e.target.files[0]; e.target.value = ""; load(f); };
  $("btnRotL").onclick = () => { quarter = (quarter + 3) % 4; crop = { x0: 0.04, y0: 0.04, x1: 0.96, y1: 0.96 }; renderView(); };
  $("btnRotR").onclick = () => { quarter = (quarter + 1) % 4; crop = { x0: 0.04, y0: 0.04, x1: 0.96, y1: 0.96 }; renderView(); };
  $("rngTilt").oninput = later;
  $("rngContrast").oninput = () => { view.style.filter = `grayscale(1) contrast(${contrastFactor(+$("rngContrast").value)})`; };
  $("btnRead").onclick = read;
  $("btnOther").onclick = () => { dropSource(); step("scanPick"); };
  $("btnTryAgain").onclick = () => step("scanAdjust");
  $("btnManual").onclick = () => { if (lastCrop) showPhoto(lastCrop, []); close(); };
  $("btnScanClose").onclick = close;
  $("btnScanMore").onclick = open;
  $("btnPhotoDiscard").onclick = discardPhoto;

  return { open, close, discardPhoto, setCrop: (x0, y0, x1, y1) => { crop = { x0, y0, x1, y1 }; placeBox(); } };
}

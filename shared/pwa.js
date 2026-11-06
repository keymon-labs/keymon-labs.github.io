// Installable-app helpers: service worker, install button, screen wake lock.

/** Register ./sw.js next to the page (HTTPS or localhost only). */
export function registerServiceWorker(url = "sw.js") {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost"))
    navigator.serviceWorker.register(url).catch(() => {});
}

/** Show `button` when the browser offers installation; clicking it opens the prompt. */
export function setupInstallButton(button) {
  let evt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); evt = e; button.hidden = false; });
  button.onclick = async () => {
    if (!evt) return;
    evt.prompt(); await evt.userChoice.catch(() => {});
    evt = null; button.hidden = true;
  };
}

let wakeLock = null;

/** Keep the screen on while visible. Safe to call repeatedly; re-call on visibilitychange. */
export async function keepAwake() {
  try {
    if ("wakeLock" in navigator && !wakeLock && document.visibilityState === "visible") {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => (wakeLock = null));
    }
  } catch {}
}

export function releaseWake() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

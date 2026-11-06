// "Open in Claude" buttons: send the visitor to the keymon-labs loader artifact on claude.ai (runs apps on their own Claude account).
// The link is public but kept out of plain text so crawlers and code search don't index it; it's built only on click.
const LOADER = atob("aHR0cHM6Ly9jbGF1ZGUuYWkvYXJ0aWZhY3QvVjdxa1hGSEVCRm9icWtwYk51dmhMZA==");

/** Wire every button with data-open-in-claude="<app id>" (empty = app list). */
export function wireOpenInClaude(root = document) {
  for (const b of root.querySelectorAll("[data-open-in-claude]")) {
    b.addEventListener("click", () => window.open(LOADER + (b.dataset.openInClaude ? "#" + b.dataset.openInClaude : ""), "_blank", "noopener"));
  }
}

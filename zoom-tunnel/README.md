# Zoom Tunnel (prototype)

Pictures nested inside each other: each picture has a doorway (a polygon) where the next picture lives, and you zoom through them forever. Draw or photograph the pictures, mark the doorway, press play. Made for kids' drawings; works with finger or pen.

## Similar things (ideas only, nothing copied)
- [The Zoomquilt](https://zoomquilt.org/): the classic collaborative infinite-zoom painting (2004), seamless by hand-matching each layer to the next.
- [infipix](https://www.producthunt.com/products/infipix): recursive canvas where every pixel holds another canvas.
- Droste-effect apps: apply the same trick to one picture.
Ours differs by letting a child draw or photograph each layer and choose the doorway shape.

## How it works
- Every frame is a 1024px square bitmap plus a portal polygon. The next frame is drawn clipped inside that polygon, scaled and rotated so its square fits the polygon's widest inner circle (`place()`), up to 5 levels deep.
- The camera is one complex similarity `screen = A*z + B` on the current level. When the screen is fully inside the portal (or leaves it) the code switches level with the same transform, so there is no visible jump (checked by pixel-diffing frames either side of a switch).
- **Auto**: constant log-zoom speed toward each portal's fixed point. **Manual**: one finger drags, two fingers pinch/twist, limited to the layer's square. **Full**: "cover" fit so the picture always fills the screen. **Loop**: the last frame's portal holds the first frame.
- **Edit**: pinch to zoom the frame, **Draw** a loop (rdp simplify + Chaikin smoothing, so sides are smooth), or **Fill**: tap an area and a colour flood-fill finds its borders (Moore contour tracing, then the same smoothing). Once a pen is used, fingers only move the view (palm rejection).
- **Catalog**: all frames in order; 👁 hides a frame from the sequence, the ⠿ grip drags to reorder, **+** adds a photo from the camera or gallery. Photos are centre-cropped to a square, shrunk to 1024px and saved as JPEG (about 30-250 KB).

## Storage and privacy
IndexedDB `zoomtunnel` in the browser on this device: the order, hidden frames, edited portals and photos. Nothing is uploaded and nothing is committed to the repo. Clearing browser data deletes it. If the browser blocks storage the app says so and works until the page is closed.

## Files
| File | What |
|---|---|
| `index.html`, `style.css` | Markup and styles |
| `zoom-tunnel.js` | Everything: geometry, rendering, camera, input, edit tools, catalog, storage. Test hook `window.__zt` |

## Shortcuts (grep `shortcut:`)
No PWA or offline; no tests (checked by headless smoke and pixel-diff at level switches); photos are centre-cropped with no align or rotate UI; level switching samples only the screen edge, so very thin portals may switch late; one-step undo; self-intersecting loops are not repaired; auto zoom path bends slightly at each level when portals are off-centre.

Uses no `shared/` modules.

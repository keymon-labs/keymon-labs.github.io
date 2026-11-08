# Brick Beats: ideas and to-do (not built yet)

Public file: invented examples only, nothing personal.

## Song history and library
- **History**: the last songs played, kept on the device so a mat can be reopened without a new photo.
- **Library**: saved songs with a small low-resolution image, the grid (corners, lanes, columns, gap), the notes, and metadata: name, date, stars (favourites), instruments, tempo.
- Starred songs first; rename, delete.
- Storage idea: localStorage index + IndexedDB for images. Keep a version number so old saves can be migrated.

## Same data, other uses
- **Debug feedback**: send a library entry (image + grid + notes) so a bad reading can be reproduced and tuned.
- **Test sets**: library entries become fixtures next to the generated `examples/` photos.
- **Predefined songs**: shipped entries (traditional / public-domain tunes only) in the library from the start.
- **Sharing** (later): export/import one entry as a file or link. Needs a privacy review first: photos of rooms or people must never leave the device by default, so share the low-res rectified mat only, with the user choosing.

## Playing
- Variable loop length (4 to 8 beats per bar).
- 1:1 and 1:2 time scale (a stud is a beat, or half a beat).

## Reading
- Tune corner finding on real floor and tape photos (tape ends past the plate can pull the sides out). Needs real examples added to the test set once they can be shared.
- Plates with no tape or cut off by the frame still cannot be straightened automatically.

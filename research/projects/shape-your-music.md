---
type: project
summary: Geometric sequencer: draw polygons and a node walking each perimeter plays a looping phrase; angles set pitch leaps; records wav and exports MIDI
status: studied
url: https://shapeyourmusic.dev/
repo: https://github.com/ejarzo/Shape-Your-Music
licence: unknown
licence_checked: no
reuse: unknown
free: yes
tech: [react, tonejs, konva, teoria]
themes: [music, visual-programming, inspiration, kids-music]
related: [projects/tonejs, projects/tonejs-demos, projects/music-blocks]
captured: 2026-11-23
---
# Shape Your Music

"What does a shape sound like?" A musical geoboard by ejarzo (created 2018, about 130 to 150 stars). Each polygon is a loop: a node travels the perimeter at constant speed and sounds a note at each vertex. Height on the canvas sets the starting pitch; the angle between edges sets the next note (sharper turn, bigger leap). Loop length follows the perimeter, with doubling and halving controls. Colours assign instruments; position sets stereo pan. Modes Draw and Edit (Tab), tempo, key, scale, proximity mode, sync. Records .wav and exports one MIDI file per shape. Stack: React, Tone.js, React Konva, Teoria, Ant Design; saving uses FaunaDB and Netlify.

## Learn
- A drawing-first music toy: no notation, geometry is the score. Very close to our "draw to play" ideas for young kids.
- Constrain to a scale so every shape sounds good.

## Reuse
Licence not confirmed: the LICENSE file could not be fetched. Treat as all rights reserved until checked; borrow the idea only.

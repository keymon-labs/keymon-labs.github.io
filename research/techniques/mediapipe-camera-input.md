---
type: technique
summary: MediaPipe Hands or Pose in the browser is the common base for webcam games; one shared camera module could serve many games
status: studied
related: [projects/collidingscopes-fruit-ninja, projects/collidingscopes-arpeggiator, projects/pugs-hunt, authors/collidingscopes, ideas/shared-camera-module]
themes: [hand-tracking, camera-games]
captured: 2026-11-22
---
# MediaPipe camera input

Nearly every browser camera game found uses MediaPipe Hands or Pose. It runs on the device (WebAssembly), so nothing is uploaded.

Pattern: capture a frame, run the model, read landmarks (fingertip, wrist, joints), map them to game or music parameters, draw feedback. Needs camera permission, a mirrored preview and a performance mode for slow devices.

Gestures seen: pinch for volume or shoot, hand height for pitch, finger count for a pattern, fast hand swipe for slicing.

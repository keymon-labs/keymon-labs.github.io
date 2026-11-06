# keymon-labs

Small web apps and experiments, published at https://keymon-labs.github.io

Each app lives in its own folder and is listed in the root `index.html`.

## Versions

```
/<app>/        latest version (what the menu's main link opens)
/<app>/vN/     frozen copy of each released version, never edited after release
```

To release a new version: copy the new build into `/<app>/` and into `/<app>/vN/`,
then add a `vN` link to the app's entry in `index.html`.

## Apps

- **piano-jump**: platform game played on a MIDI/Bluetooth piano.
  - v2: real grand staff, hand and finger guide, big-letter feedback with auto-retry, installable (PWA), screen wake lock
  - v1: first playable version

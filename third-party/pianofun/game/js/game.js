// game.js — Game engine: timing, hit detection, scoring

const Game = {
  song: null,
  notes: [],
  songTime: 0,        // ms into the song
  scrollSpeed: 2000,   // ms from top to hit line
  playing: false,
  paused: false,
  lastFrameTime: 0,
  countdown: null,     // 3, 2, 1, 'GO!', or null
  countdownTimer: 0,

  // Scoring
  score: 0,
  streak: 0,
  bestStreak: 0,
  notesHit: 0,
  notesMissed: 0,
  totalNotes: 0,
  lastStreakMilestone: 0,

  // Hit note display (for keyboard coloring)
  hitNotes: {},
  hitNoteTimers: {},

  // Metronome / beat
  beatEnabled: false,
  beatInterval: 0,     // ms per beat
  lastBeatTime: 0,
  beatCount: 0,

  // Timing windows (ms)
  PERFECT_WINDOW: 50,
  GREAT_WINDOW: 150,
  GOOD_WINDOW: 300,

  // Callbacks
  onComplete: null,
  onScoreUpdate: null,

  start(song) {
    this.song = song;
    // Deep copy notes so we can mark them as hit
    this.notes = song.notes.map(n => ({ ...n, hit: false, missed: false }));
    this.totalNotes = this.notes.length;
    this.songTime = -this.scrollSpeed; // start with notes offscreen
    this.playing = false;
    this.paused = false;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.notesHit = 0;
    this.notesMissed = 0;
    this.lastStreakMilestone = 0;
    this.hitNotes = {};
    this.hitNoteTimers = {};
    this.lastFrameTime = 0;
    this.beatInterval = 60000 / song.bpm;
    this.lastBeatTime = -this.beatInterval;
    this.beatCount = 0;

    // Start countdown
    this.countdown = 3;
    this.countdownTimer = 0;

    // Wire MIDI
    MidiManager.onNoteOn = (midi, vel) => this._onNoteOn(midi, vel);

    // Start animation loop
    this.lastFrameTime = performance.now();
    this._loop(this.lastFrameTime);
  },

  stop() {
    this.playing = false;
    this.paused = false;
    this.countdown = null;
    MidiManager.onNoteOn = null;
  },

  togglePause() {
    if (this.countdown !== null) return;
    this.paused = !this.paused;
    if (!this.paused) {
      this.lastFrameTime = performance.now();
      this._loop(this.lastFrameTime);
    }
    return this.paused;
  },

  _loop(timestamp) {
    if (!this.playing && this.countdown === null) return;
    if (this.paused) return;

    const dt = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Countdown phase
    if (this.countdown !== null) {
      this.countdownTimer += dt;
      if (this.countdownTimer >= 800) {
        this.countdownTimer = 0;
        if (this.countdown === 3) {
          AudioFX.countdownBeep(false);
          this.countdown = 2;
        } else if (this.countdown === 2) {
          AudioFX.countdownBeep(false);
          this.countdown = 1;
        } else if (this.countdown === 1) {
          AudioFX.countdownBeep(true);
          this.countdown = 'GO!';
        } else {
          this.countdown = null;
          this.playing = true;
        }
      }
    }

    // Advance song time
    if (this.playing) {
      this.songTime += dt;
      this._checkMisses();
      this._checkSongEnd();

      // Metronome beat
      if (this.beatEnabled && this.songTime - this.lastBeatTime >= this.beatInterval) {
        this.lastBeatTime += this.beatInterval;
        this.beatCount++;
        AudioFX.metronome(this.beatCount % 4 === 1);
      }
    }

    // Clear hit note highlights
    for (const midi in this.hitNoteTimers) {
      this.hitNoteTimers[midi] -= dt;
      if (this.hitNoteTimers[midi] <= 0) {
        delete this.hitNotes[midi];
        delete this.hitNoteTimers[midi];
      }
    }

    // Render
    Renderer.renderFrame({
      notes: this.notes,
      songTime: this.songTime,
      scrollSpeed: this.scrollSpeed,
      activeNotes: MidiManager.activeNotes,
      hitNotes: this.hitNotes,
      countdown: this.countdown
    }, dt);

    // Draw score bar
    this._drawScoreBar();

    requestAnimationFrame((t) => this._loop(t));
  },

  _onNoteOn(midi, velocity) {
    if (!this.playing) return;

    // Find the closest upcoming note that matches this MIDI note
    let bestNote = null;
    let bestDiff = Infinity;

    for (const note of this.notes) {
      if (note.hit || note.missed) continue;
      if (note.midi !== midi) continue;

      const diff = Math.abs(note.time - this.songTime);
      if (diff < bestDiff && diff <= this.GOOD_WINDOW) {
        bestDiff = diff;
        bestNote = note;
      }
    }

    if (bestNote) {
      bestNote.hit = true;
      bestNote.hitTime = this.songTime; // when the player pressed the key
      let quality, points;

      if (bestDiff <= this.PERFECT_WINDOW) {
        quality = 'perfect'; points = 100;
      } else if (bestDiff <= this.GREAT_WINDOW) {
        quality = 'great'; points = 75;
      } else {
        quality = 'good'; points = 50;
      }

      this.score += points;
      this.streak++;
      this.notesHit++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;

      // Streak milestones
      if (this.streak === 5 && this.lastStreakMilestone < 5) {
        AudioFX.streak();
        this.lastStreakMilestone = 5;
      } else if (this.streak === 10 && this.lastStreakMilestone < 10) {
        AudioFX.streak();
        this.lastStreakMilestone = 10;
      } else if (this.streak === 20 && this.lastStreakMilestone < 20) {
        AudioFX.streak();
        Renderer.spawnConfetti(50);
        this.lastStreakMilestone = 20;
      }

      AudioFX.correct();
      Renderer.addHitEffect(midi, quality);
      this.hitNotes[midi] = quality;
      this.hitNoteTimers[midi] = 200;

      if (this.onScoreUpdate) this.onScoreUpdate(this._getStats());
    } else {
      // Wrong note — flash but no penalty
      AudioFX.wrong();
      Renderer.addMissEffect(midi);
      this.hitNotes[midi] = 'wrong';
      this.hitNoteTimers[midi] = 200;
    }
  },

  _checkMisses() {
    for (const note of this.notes) {
      if (note.hit || note.missed) continue;
      // If the note has passed the hit window
      if (this.songTime - note.time > this.GOOD_WINDOW) {
        note.missed = true;
        this.notesMissed++;
        this.streak = 0;
        this.lastStreakMilestone = 0;
        if (this.onScoreUpdate) this.onScoreUpdate(this._getStats());
      }
    }
  },

  _checkSongEnd() {
    if (!this.notes.length) return;
    const lastNote = this.notes[this.notes.length - 1];
    const songEndTime = lastNote.time + lastNote.duration + 1000;

    if (this.songTime >= songEndTime) {
      this.playing = false;
      AudioFX.complete();
      if (this.onComplete) {
        setTimeout(() => this.onComplete(this._getStats()), 500);
      }
    }
  },

  _getStats() {
    const accuracy = this.totalNotes > 0
      ? Math.round((this.notesHit / this.totalNotes) * 100)
      : 0;
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 40 ? 1 : 0;
    return {
      score: this.score,
      streak: this.streak,
      bestStreak: this.bestStreak,
      notesHit: this.notesHit,
      notesMissed: this.notesMissed,
      totalNotes: this.totalNotes,
      accuracy,
      stars
    };
  },

  _drawScoreBar() {
    const ctx = Renderer.ctx;
    const w = Renderer.width;

    // Semi-transparent bar at top
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, 50);

    ctx.font = 'bold 18px "Fredoka", sans-serif';
    ctx.textBaseline = 'middle';

    // Score
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 20, 25);

    // Streak
    const streakText = this.streak >= 20 ? `${this.streak} AMAZING!`
      : this.streak >= 10 ? `${this.streak} GREAT!`
      : this.streak >= 5 ? `${this.streak} NICE!`
      : `${this.streak}`;
    ctx.fillStyle = this.streak >= 5 ? '#FF6B6B' : '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`Streak: ${streakText}`, w / 2, 25);

    // Accuracy
    const stats = this._getStats();
    ctx.fillStyle = '#88ff88';
    ctx.textAlign = 'right';
    ctx.fillText(`${stats.accuracy}%`, w - 20, 25);

    // Progress bar
    const progress = this.totalNotes > 0
      ? (this.notesHit + this.notesMissed) / this.totalNotes
      : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, 46, w, 4);
    ctx.fillStyle = '#44ff88';
    ctx.fillRect(0, 46, w * progress, 4);
  }
};

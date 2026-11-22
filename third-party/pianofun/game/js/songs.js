// songs.js — All song data (5 beginner songs)
// MIDI notes: C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, Bb4=70, B4=71, C5=72

const SONGS = [
  {
    id: 'hotcross',
    title: 'Hot Cross Buns',
    difficulty: 1,
    bpm: 110,
    color: '#FF6B6B',
    description: 'Only 3 notes — super easy!',
    notes: (() => {
      // E D C rest E D C rest C C D D E D C
      const E = 64, D = 62, C = 60;
      const q = 545; // quarter note ms at 110bpm
      const h = q * 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };
      const rest = (dur) => { t += dur; };

      add(E, q, 3); add(D, q, 2); add(C, h, 1); // Hot cross buns
      add(E, q, 3); add(D, q, 2); add(C, h, 1); // Hot cross buns
      add(C, q/2, 1); add(C, q/2, 1); add(C, q/2, 1); add(C, q/2, 1); // One a pen-ny
      add(D, q/2, 2); add(D, q/2, 2); add(D, q/2, 2); add(D, q/2, 2); // Two a pen-ny
      add(E, q, 3); add(D, q, 2); add(C, h, 1); // Hot cross buns

      return n;
    })()
  },
  {
    id: 'mary',
    title: 'Mary Had a Little Lamb',
    difficulty: 1,
    bpm: 120,
    color: '#FFB347',
    description: 'A fun classic everyone knows!',
    notes: (() => {
      const E = 64, D = 62, C = 60, G = 67;
      const q = 500; // quarter at 120bpm
      const h = q * 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Mary had a little lamb
      add(E, q, 3); add(D, q, 2); add(C, q, 1); add(D, q, 2);
      add(E, q, 3); add(E, q, 3); add(E, h, 3);
      // Little lamb, little lamb
      add(D, q, 2); add(D, q, 2); add(D, h, 2);
      add(E, q, 3); add(G, q, 5); add(G, h, 5);
      // Mary had a little lamb
      add(E, q, 3); add(D, q, 2); add(C, q, 1); add(D, q, 2);
      add(E, q, 3); add(E, q, 3); add(E, q, 3); add(E, q, 3);
      // Its fleece was white as snow
      add(D, q, 2); add(D, q, 2); add(E, q, 3); add(D, q, 2);
      add(C, h * 2, 1);

      return n;
    })()
  },
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    difficulty: 1,
    bpm: 100,
    color: '#FFD700',
    description: 'A classic lullaby!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69;
      const q = 600; // quarter at 100bpm
      const h = q * 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Twinkle twinkle little star
      add(C, q, 1); add(C, q, 1); add(G, q, 5); add(G, q, 5);
      add(A, q, 5); add(A, q, 5); add(G, h, 5);
      // How I wonder what you are
      add(F, q, 4); add(F, q, 4); add(E, q, 3); add(E, q, 3);
      add(D, q, 2); add(D, q, 2); add(C, h, 1);
      // Up above the world so high
      add(G, q, 5); add(G, q, 5); add(F, q, 4); add(F, q, 4);
      add(E, q, 3); add(E, q, 3); add(D, h, 2);
      // Like a diamond in the sky
      add(G, q, 5); add(G, q, 5); add(F, q, 4); add(F, q, 4);
      add(E, q, 3); add(E, q, 3); add(D, h, 2);
      // Twinkle twinkle little star
      add(C, q, 1); add(C, q, 1); add(G, q, 5); add(G, q, 5);
      add(A, q, 5); add(A, q, 5); add(G, h, 5);
      // How I wonder what you are
      add(F, q, 4); add(F, q, 4); add(E, q, 3); add(E, q, 3);
      add(D, q, 2); add(D, q, 2); add(C, h, 1);

      return n;
    })()
  },
  {
    id: 'ode',
    title: 'Ode to Joy',
    difficulty: 2,
    bpm: 108,
    color: '#77DD77',
    description: 'Beethoven made this for you!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67;
      const q = 556; // quarter at 108bpm
      const h = q * 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Line 1
      add(E, q, 3); add(E, q, 3); add(F, q, 4); add(G, q, 5);
      add(G, q, 5); add(F, q, 4); add(E, q, 3); add(D, q, 2);
      add(C, q, 1); add(C, q, 1); add(D, q, 2); add(E, q, 3);
      add(E, q + q/2, 3); add(D, q/2, 2); add(D, h, 2);
      // Line 2
      add(E, q, 3); add(E, q, 3); add(F, q, 4); add(G, q, 5);
      add(G, q, 5); add(F, q, 4); add(E, q, 3); add(D, q, 2);
      add(C, q, 1); add(C, q, 1); add(D, q, 2); add(E, q, 3);
      add(D, q + q/2, 2); add(C, q/2, 1); add(C, h, 1);
      // Bridge
      add(D, q, 2); add(D, q, 2); add(E, q, 3); add(C, q, 1);
      add(D, q, 2); add(E, q/2, 3); add(F, q/2, 4); add(E, q, 3); add(C, q, 1);
      add(D, q, 2); add(E, q/2, 3); add(F, q/2, 4); add(E, q, 3); add(D, q, 2);
      add(C, q, 1); add(D, q, 2); add(G, h, 5);
      // Line 1 repeat
      add(E, q, 3); add(E, q, 3); add(F, q, 4); add(G, q, 5);
      add(G, q, 5); add(F, q, 4); add(E, q, 3); add(D, q, 2);
      add(C, q, 1); add(C, q, 1); add(D, q, 2); add(E, q, 3);
      add(D, q + q/2, 2); add(C, q/2, 1); add(C, h, 1);

      return n;
    })()
  },
  {
    id: 'birthday',
    title: 'Happy Birthday',
    difficulty: 2,
    bpm: 100,
    color: '#AEC6CF',
    description: 'Play this at every party!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69, Bb = 70;
      const q = 600; // quarter at 100bpm
      const h = q * 2;
      const dq = q * 1.5; // dotted quarter
      const e = q / 2; // eighth
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Happy birthday to you
      add(C, dq, 1); add(C, e, 1); add(D, h, 2); add(C, h, 1);
      add(F, h, 4); add(E, h * 2, 3);
      // Happy birthday to you
      add(C, dq, 1); add(C, e, 1); add(D, h, 2); add(C, h, 1);
      add(G, h, 5); add(F, h * 2, 4);
      // Happy birthday dear [name]
      add(C, dq, 1); add(C, e, 1); add(C + 12, h, 5); add(A, h, 5);
      add(F, h, 4); add(E, h, 3); add(D, h * 2, 2);
      // Happy birthday to you
      add(Bb, dq, 4); add(Bb, e, 4); add(A, h, 5); add(F, h, 4);
      add(G, h, 5); add(F, h * 2, 4);

      return n;
    })()
  },

  // ===================== LEVEL 2-3 SONGS =====================

  {
    id: 'jingle',
    title: 'Jingle Bells',
    difficulty: 2,
    bpm: 120,
    color: '#FF6B9D',
    description: 'Dashing through the snow!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69, B = 71;
      const q = 500; // quarter at 120bpm
      const h = q * 2;
      const dh = h + q; // dotted half
      const e = q / 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Jingle bells, jingle bells, jingle all the way
      add(E, q, 3); add(E, q, 3); add(E, h, 3);
      add(E, q, 3); add(E, q, 3); add(E, h, 3);
      add(E, q, 3); add(G, q, 5); add(C, q, 1); add(D, q, 2);
      add(E, h * 2, 3);
      // Oh what fun it is to ride
      add(F, q, 4); add(F, q, 4); add(F, q, 4); add(F, q, 4);
      add(F, q, 4); add(E, q, 3); add(E, q, 3); add(E, e, 3); add(E, e, 3);
      // In a one-horse open sleigh
      add(E, q, 3); add(D, q, 2); add(D, q, 2); add(E, q, 3);
      add(D, h, 2); add(G, h, 5);

      return n;
    })()
  },
  {
    id: 'london',
    title: 'London Bridge',
    difficulty: 2,
    bpm: 112,
    color: '#B39DDB',
    description: 'Is falling down... can you keep up?',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69;
      const q = 535; // quarter at 112bpm
      const h = q * 2;
      const dq = q * 1.5;
      const e = q / 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // London Bridge is falling down
      add(G, dq, 5); add(A, e, 5); add(G, q, 5); add(F, q, 4);
      add(E, q, 3); add(F, q, 4); add(G, h, 5);
      // Falling down, falling down
      add(D, q, 2); add(E, q, 3); add(F, h, 4);
      add(E, q, 3); add(F, q, 4); add(G, h, 5);
      // London Bridge is falling down
      add(G, dq, 5); add(A, e, 5); add(G, q, 5); add(F, q, 4);
      add(E, q, 3); add(F, q, 4); add(G, h, 5);
      // My fair lady
      add(D, h, 2); add(G, q, 5); add(E, q, 3);
      add(C, h * 2, 1);

      return n;
    })()
  },
  {
    id: 'rowboat',
    title: 'Row Row Row Your Boat',
    difficulty: 2,
    bpm: 100,
    color: '#4FC3F7',
    description: 'Gently down the stream!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67;
      const q = 600;
      const h = q * 2;
      const dq = q * 1.5;
      const e = q / 2;
      const dh = h + q;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Row row row your boat
      add(C, dq, 1); add(C, e, 1); add(C, q, 1); add(D, e, 2); add(E, dq, 3);
      // Gently down the stream
      add(E, q, 3); add(D, e, 2); add(E, q, 3); add(F, e, 4); add(G, dh, 5);
      // Merrily merrily merrily merrily
      add(G, e, 5); add(G, e, 5); add(G, e, 5);
      add(E, e, 3); add(E, e, 3); add(E, e, 3);
      add(C, e, 1); add(C, e, 1); add(C, e, 1);
      // Life is but a dream (not "but" — keeping notes for melody)
      add(G, q, 5); add(F, e, 4); add(E, q, 3); add(D, e, 2); add(C, dh, 1);

      return n;
    })()
  },
  {
    id: 'cancan',
    title: 'Can-Can',
    difficulty: 3,
    bpm: 132,
    color: '#FF7043',
    description: 'Fast and exciting — can you keep up?',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69, B = 71, C5 = 72;
      const q = 455; // quarter at 132bpm
      const e = q / 2;
      const h = q * 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Main theme (simplified)
      add(E, e, 3); add(F, e, 4); add(G, e, 5); add(E, e, 3);
      add(F, e, 4); add(G, e, 5); add(A, q, 5); add(G, q, 5);
      add(E, e, 3); add(F, e, 4); add(G, e, 5); add(E, e, 3);
      add(F, e, 4); add(G, e, 5); add(A, q, 5); add(G, q, 5);
      // High section
      add(A, e, 5); add(G, e, 5); add(F, e, 4); add(E, e, 3);
      add(F, e, 4); add(G, e, 5); add(E, q, 3);
      add(D, e, 2); add(E, e, 3); add(F, e, 4); add(D, e, 2);
      add(E, e, 3); add(F, e, 4); add(G, q, 5);
      // Ending run
      add(C, e, 1); add(D, e, 2); add(E, e, 3); add(F, e, 4);
      add(G, e, 5); add(A, e, 5); add(G, e, 5); add(F, e, 4);
      add(E, q, 3); add(D, q, 2); add(C, h, 1);

      return n;
    })()
  },
  {
    id: 'lightly',
    title: 'Lightly Row',
    difficulty: 2,
    bpm: 108,
    color: '#81C784',
    description: 'A gentle, flowing melody!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67;
      const q = 556;
      const h = q * 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Lightly row, lightly row
      add(E, q, 3); add(D, q, 2); add(C, q, 1); add(D, q, 2);
      add(E, q, 3); add(E, q, 3); add(E, h, 3);
      // O'er the glassy waves we go
      add(D, q, 2); add(D, q, 2); add(D, h, 2);
      add(E, q, 3); add(G, q, 5); add(G, h, 5);
      // Smoothly glide, smoothly glide
      add(E, q, 3); add(D, q, 2); add(C, q, 1); add(D, q, 2);
      add(E, q, 3); add(E, q, 3); add(E, q, 3); add(E, q, 3);
      // On the silent tide
      add(D, q, 2); add(D, q, 2); add(E, q, 3); add(D, q, 2);
      add(C, h * 2, 1);

      return n;
    })()
  },
  {
    id: 'alouette',
    title: 'Alouette',
    difficulty: 3,
    bpm: 120,
    color: '#FFB74D',
    description: 'A French classic — tricky rhythm!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69;
      const q = 500;
      const h = q * 2;
      const e = q / 2;
      const dq = q * 1.5;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // A-lou-et-te, gentille alouette
      add(E, q, 3); add(E, q, 3); add(F, q, 4); add(G, q, 5);
      add(G, q, 5); add(F, q, 4); add(E, q, 3); add(F, q, 4);
      add(G, q, 5); add(A, h, 5);
      // A-lou-et-te, je te plumerai
      add(E, q, 3); add(E, q, 3); add(F, q, 4); add(G, q, 5);
      add(G, q, 5); add(F, q, 4); add(E, q, 3); add(D, q, 2);
      add(C, h * 2, 1);
      // Je te plumerai la tête
      add(G, e, 5); add(G, e, 5); add(G, e, 5); add(G, e, 5);
      add(F, q, 4); add(F, q, 4);
      add(G, e, 5); add(G, e, 5); add(G, e, 5); add(G, e, 5);
      add(F, h, 4);
      // Et la tête, alouette — ah!
      add(E, q, 3); add(F, q, 4); add(G, q, 5); add(E, q, 3);
      add(D, q, 2); add(C, h, 1);

      return n;
    })()
  },

  // ===================== ROMANIAN & MOLDOVAN SONGS =====================

  {
    id: 'capra',
    title: 'Am O Capră',
    difficulty: 1,
    bpm: 112,
    color: '#E57373',
    description: 'Am o capră cu trei iezi!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69;
      const q = 535;
      const h = q * 2;
      const e = q / 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Am o capră cu trei iezi
      add(C, q, 1); add(E, q, 3); add(G, q, 5); add(E, q, 3);
      add(C, q, 1); add(E, q, 3); add(G, h, 5);
      // Cu trei iezi frumoși
      add(G, q, 5); add(F, q, 4); add(E, q, 3); add(D, q, 2);
      add(C, h, 1); add(C, h, 1);
      // Și-i trimise la grădină
      add(C, q, 1); add(D, q, 2); add(E, q, 3); add(F, q, 4);
      add(G, q, 5); add(G, q, 5); add(G, h, 5);
      // Să mănânce drobul fin
      add(G, q, 5); add(F, q, 4); add(E, q, 3); add(D, q, 2);
      add(C, h * 2, 1);

      return n;
    })()
  },
  {
    id: 'radu',
    title: 'Radu Mamii',
    difficulty: 2,
    bpm: 120,
    color: '#CE93D8',
    description: 'Un cântecel vesel de copii!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69;
      const q = 500;
      const h = q * 2;
      const e = q / 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Radu mamii, Radule
      add(G, q, 5); add(E, q, 3); add(E, q, 3); add(F, q, 4);
      add(D, q, 2); add(D, h, 2);
      // Du-te sus la dealuri
      add(E, q, 3); add(F, q, 4); add(G, q, 5); add(G, q, 5);
      add(A, q, 5); add(G, h, 5);
      // Adu-ne și nouă
      add(G, q, 5); add(E, q, 3); add(E, q, 3); add(F, q, 4);
      add(D, q, 2); add(D, h, 2);
      // Mere de pe ramuri
      add(E, q, 3); add(D, q, 2); add(E, q, 3); add(F, q, 4);
      add(C, h * 2, 1);

      return n;
    })()
  },
  {
    id: 'cucul',
    title: 'Cucu, Cucu',
    difficulty: 1,
    bpm: 108,
    color: '#A5D6A7',
    description: 'Cucul cântă-n crâng!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67;
      const q = 556;
      const h = q * 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Cu-cu, cu-cu, nu mai plânge
      add(G, q, 5); add(E, h, 3); add(G, q, 5); add(E, h, 3);
      add(G, q, 5); add(F, q, 4); add(E, q, 3); add(D, q, 2);
      add(C, h, 1);
      // Primăvara vine dulce
      add(D, q, 2); add(E, q, 3); add(F, q, 4); add(D, q, 2);
      add(E, q, 3); add(F, q, 4); add(G, h, 5);
      // Cu-cu, cu-cu
      add(G, q, 5); add(E, h, 3); add(G, q, 5); add(E, h, 3);
      // Iarba crește sus pe munte
      add(F, q, 4); add(E, q, 3); add(D, q, 2); add(E, q, 3);
      add(C, h * 2, 1);

      return n;
    })()
  },
  {
    id: 'gradinita',
    title: 'La Grădiniță',
    difficulty: 2,
    bpm: 116,
    color: '#90CAF9',
    description: 'Hai la grădiniță!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69;
      const q = 517;
      const h = q * 2;
      const e = q / 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Hai la grădiniță
      add(C, q, 1); add(D, q, 2); add(E, q, 3); add(C, q, 1);
      add(C, q, 1); add(D, q, 2); add(E, q, 3); add(C, q, 1);
      // Unde e frumos
      add(E, q, 3); add(F, q, 4); add(G, h, 5);
      add(E, q, 3); add(F, q, 4); add(G, h, 5);
      // Ne jucăm cu toții
      add(G, e, 5); add(A, e, 5); add(G, e, 5); add(F, e, 4);
      add(E, q, 3); add(C, q, 1);
      add(G, e, 5); add(A, e, 5); add(G, e, 5); add(F, e, 4);
      add(E, q, 3); add(C, q, 1);
      // E cel mai frumos
      add(C, q, 1); add(G, q, 5); add(C, h * 2, 1);

      return n;
    })()
  },
  {
    id: 'albinuta',
    title: 'Albinuța',
    difficulty: 2,
    bpm: 120,
    color: '#FFF176',
    description: 'Zum zum zum, albinuța!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69;
      const q = 500;
      const h = q * 2;
      const e = q / 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Zum zum zum, albinuța zum
      add(E, e, 3); add(E, e, 3); add(E, q, 3); add(G, q, 5); add(E, q, 3);
      add(E, e, 3); add(E, e, 3); add(E, q, 3); add(G, q, 5); add(E, q, 3);
      // Ea adună miere-n stup
      add(F, q, 4); add(F, q, 4); add(E, q, 3); add(E, q, 3);
      add(D, q, 2); add(D, q, 2); add(C, h, 1);
      // Zum zum zum, din floare-n floare
      add(E, e, 3); add(E, e, 3); add(E, q, 3); add(G, q, 5); add(E, q, 3);
      add(E, e, 3); add(E, e, 3); add(E, q, 3); add(G, q, 5); add(E, q, 3);
      // Albinuța noastră zboară
      add(F, q, 4); add(E, q, 3); add(D, q, 2); add(E, q, 3);
      add(C, h * 2, 1);

      return n;
    })()
  },
  {
    id: 'moldoveneasca',
    title: 'Hora Din Moldova',
    difficulty: 3,
    bpm: 132,
    color: '#FFAB91',
    description: 'O horă tradițională moldovenească!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69, B = 71;
      const q = 455;
      const h = q * 2;
      const e = q / 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Hora melody — fast and danceable
      add(E, e, 3); add(F, e, 4); add(G, q, 5); add(G, e, 5); add(A, e, 5);
      add(G, e, 5); add(F, e, 4); add(E, q, 3); add(D, q, 2);
      add(E, e, 3); add(F, e, 4); add(G, q, 5); add(A, q, 5);
      add(G, q, 5); add(E, h, 3);
      // Second part
      add(A, e, 5); add(A, e, 5); add(G, e, 5); add(F, e, 4);
      add(G, e, 5); add(G, e, 5); add(F, e, 4); add(E, e, 3);
      add(F, q, 4); add(E, q, 3); add(D, q, 2); add(C, q, 1);
      // Reprise with energy
      add(C, e, 1); add(D, e, 2); add(E, e, 3); add(F, e, 4);
      add(G, q, 5); add(A, q, 5); add(G, q, 5);
      add(F, e, 4); add(E, e, 3); add(D, e, 2); add(E, e, 3);
      add(C, h, 1);

      return n;
    })()
  },
  {
    id: 'oile',
    title: 'Cine-A Pus Oile La Număr',
    difficulty: 2,
    bpm: 108,
    color: '#80CBC4',
    description: 'Un cântec popular vesel!',
    notes: (() => {
      const C = 60, D = 62, E = 64, F = 65, G = 67, A = 69;
      const q = 556;
      const h = q * 2;
      const e = q / 2;
      let t = 0;
      const n = [];
      const add = (midi, dur, finger) => { n.push({ midi, time: t, duration: dur, finger, hand: 'R' }); t += dur; };

      // Cine-a pus oile la număr
      add(G, q, 5); add(G, q, 5); add(A, q, 5); add(G, q, 5);
      add(F, q, 4); add(E, q, 3); add(D, h, 2);
      // Mânca-le-ar lupul pe toate
      add(E, q, 3); add(E, q, 3); add(F, q, 4); add(E, q, 3);
      add(D, q, 2); add(C, h, 1); add(C, q, 1);
      // Numa' una mi-a lăsat
      add(C, q, 1); add(D, q, 2); add(E, q, 3); add(F, q, 4);
      add(G, q, 5); add(G, q, 5); add(G, h, 5);
      // Și pe-aia rău o-a mușcat
      add(A, q, 5); add(G, q, 5); add(F, q, 4); add(E, q, 3);
      add(D, q, 2); add(C, h * 2, 1);

      return n;
    })()
  }
];

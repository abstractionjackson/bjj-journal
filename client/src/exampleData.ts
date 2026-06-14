import type { Move, MoveCategory, Partner, Session } from "./types";

// Deterministic mock journal: ~6 months of training, three classes a week
// (Mon/Wed evening class, Sat open mat), with holiday and sick breaks.
// Timestamps are written without a UTC offset so the demo reads as local
// evening/morning classes in every visitor's timezone.

interface ExampleDocument {
  sessions: Session[];
  partners: Partner[];
  moves: Move[];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOVES: Array<{ name: string; category: MoveCategory }> = [
  { name: "Armbar from Guard", category: "attack" },
  { name: "Triangle Choke", category: "attack" },
  { name: "Kimura from Side Control", category: "attack" },
  { name: "Cross Collar Choke", category: "attack" },
  { name: "Guillotine", category: "attack" },
  { name: "Hip Bump Sweep", category: "attack" },
  { name: "Scissor Sweep", category: "attack" },
  { name: "Double Leg Takedown", category: "attack" },
  { name: "Single Leg Takedown", category: "attack" },
  { name: "Knee Cut Pass", category: "transition" },
  { name: "Toreando Pass", category: "transition" },
  { name: "Back Take from Turtle", category: "transition" },
  { name: "Mount to S-Mount", category: "transition" },
  { name: "Upa Mount Escape", category: "defense" },
  { name: "Side Control Escape", category: "defense" },
  { name: "Guard Retention", category: "defense" },
  { name: "Triangle Defense", category: "defense" },
  { name: "Frame and Shrimp", category: "defense" },
];

const PARTNERS = [
  "Marcus",
  "Dani",
  "Leo",
  "Priya",
  "Sam",
  "Kenji",
  "Rosa",
  "Alex",
];

const ROLL_NOTES = [
  "Got caught in a triangle — posture broke down when I reached.",
  "Held top position most of the round. Knee cut is clicking.",
  "Survived mount for two minutes, escaped with the upa.",
  "Took the back off a scramble but lost it going for the choke.",
  "Good back-and-forth round. Guard retention felt sharper.",
  "Tapped to a guillotine off a sloppy shot. Keep my head up.",
  "Swept twice with the hip bump. Set it up off the failed kimura.",
  "Spent the round defending side control. Frames too late.",
  "Hit the scissor sweep clean, finished with a cross collar.",
  "Lost the underhook battle from half guard all round.",
  "",
  "",
];

const SESSION_NOTES = [
  "Focused drilling, then situational rounds from guard.",
  "Coach stressed **grips first** — everything starts from the grip fight.",
  "Conditioning heavy class. Drilled until the movement felt automatic.",
  "## Takeaways\n\n- Angle out before attacking the arm\n- Keep elbows tight in bottom positions\n- Breathe during rolls, not just between them",
  "Light class, mostly positional sparring from mount.",
  "Worked the technique slow, then added resistance in waves.",
  "## Notes\n\nGood energy tonight. The pass-and-retain game is improving — fewer panicked frames, more early hip movement.",
  "",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localIso(d: Date, hours: number, minutes: number): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    hours
  )}:${pad(minutes)}:00`;
}

function inRange(d: Date, from: string, to: string): boolean {
  const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return key >= from && key <= to;
}

export function exampleDocument(): ExampleDocument {
  const rand = mulberry32(20260611);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

  const sessions: Session[] = [];
  const first = new Date(2025, 11, 8); // Mon, Dec 8 2025
  const last = new Date(2026, 5, 10); // Wed, Jun 10 2026

  let weeklyFocus = pick(MOVES);
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day === 1) weeklyFocus = pick(MOVES); // new focus each Monday
    const isClassDay = day === 1 || day === 3 || day === 6;
    if (!isClassDay) continue;
    if (inRange(d, "2025-12-22", "2026-01-04")) continue; // holiday break
    if (inRange(d, "2026-03-16", "2026-03-22")) continue; // out sick
    if (rand() < 0.12) continue; // the occasional missed class

    const openMat = day === 6;
    const dateId = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const id = `ex-${dateId}`;

    const drills: Session["drills"] = [];
    if (!openMat) {
      const names = [weeklyFocus.name];
      if (rand() < 0.6) {
        const second = pick(MOVES);
        if (second.name !== weeklyFocus.name) names.push(second.name);
      }
      drills.push({ id: `${id}-d1`, moveNames: names });
    } else if (rand() < 0.3) {
      drills.push({ id: `${id}-d1`, moveNames: [pick(MOVES).name] });
    }

    const rollCount = openMat
      ? 4 + Math.floor(rand() * 3)
      : 2 + Math.floor(rand() * 3);
    const rolls: Session["rolls"] = [];
    for (let i = 0; i < rollCount; i++) {
      rolls.push({
        id: `${id}-r${i + 1}`,
        partnerName: rand() < 0.06 ? "Generic" : pick(PARTNERS),
        notes: pick(ROLL_NOTES),
      });
    }

    sessions.push({
      id,
      start: openMat ? localIso(d, 10, 0) : localIso(d, 18, 30),
      end: openMat ? localIso(d, 11, 30) : localIso(d, 20, 0),
      drills,
      rolls,
      notes: openMat ? (rand() < 0.4 ? "Open mat — all rolling." : "") : pick(SESSION_NOTES),
    });
  }

  const partners: Partner[] = [
    { id: "generic", name: "Generic" },
    ...PARTNERS.map((name, i) => ({ id: `ex-p${i + 1}`, name })),
  ];

  const moves: Move[] = MOVES.map((m) => ({
    name: m.name,
    category: m.category,
    notes: "",
  }));

  return { sessions, partners, moves };
}

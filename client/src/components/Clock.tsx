import { fmtDate, fmtTime } from "../lib";

const CX = 12;
const CY = 12;
const R = 9;
// Softer than belt-black so the clock isn't harshly high-contrast.
const SOFT_BLACK = "#45474d";

/** Fraction (0–1) around a 12-hour dial, 0 = 12 o'clock at the top. */
function frac12(d: Date): number {
  return ((d.getHours() % 12) + d.getMinutes() / 60) / 12;
}

function pointAt(frac: number): [number, number] {
  const angle = frac * 2 * Math.PI - Math.PI / 2; // 0 at top, clockwise
  return [CX + R * Math.cos(angle), CY + R * Math.sin(angle)];
}

/**
 * A small clock showing a session's time range as a filled wedge on a 12-hour
 * dial. AM sessions are a white face with a black wedge; PM sessions invert it.
 */
export default function Clock({ start, end }: { start: string; end: string }) {
  const s = new Date(start);
  const e = new Date(end);
  const label = `${fmtDate(start)} · ${fmtTime(start)}–${fmtTime(end)}`;

  const isAM = s.getHours() < 12;
  const face = isAM ? "#fff" : SOFT_BLACK;
  const wedge = isAM ? SOFT_BLACK : "#fff";
  const stroke = SOFT_BLACK;

  let f0 = frac12(s);
  let f1 = frac12(e);
  if (f1 <= f0) f1 += 1; // range wraps past the top of the dial
  const sweep = f1 - f0;

  const [x0, y0] = pointAt(f0);
  const [x1, y1] = pointAt(f1);
  const largeArc = sweep > 0.5 ? 1 : 0;
  const wedgePath = `M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 ${largeArc} 1 ${x1} ${y1} Z`;

  return (
    <span className="clock-wrap" data-tip={label}>
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        role="img"
        aria-label={label}
        className="clock"
      >
        <circle cx={CX} cy={CY} r={R} fill={face} stroke={stroke} strokeWidth="1" />
        {sweep >= 1 ? (
          <circle cx={CX} cy={CY} r={R} fill={wedge} />
        ) : (
          <path d={wedgePath} fill={wedge} />
        )}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={stroke} strokeWidth="1" />
      </svg>
    </span>
  );
}

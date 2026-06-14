import { useState } from "react";
import { Link } from "react-router-dom";
import {
  aggregatePartners,
  dateKey,
  durationMinutes,
  fmtDuration,
  moveStats,
  useMoves,
  useSessions,
} from "../lib";

// Single-letter headers keep the month grid compact enough to fit one viewport.
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function Home() {
  const { sessions } = useSessions();
  const { moves: catalog } = useMoves();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const totalMinutes = sessions.reduce((sum, s) => sum + durationMinutes(s), 0);
  const totalRolls = sessions.reduce((sum, s) => sum + s.rolls.length, 0);
  const drilledCount = moveStats(sessions, catalog).filter(
    (m) => m.timesDrilled > 0
  ).length;
  const partners = aggregatePartners(sessions);

  // Count sessions per local day so calendar cells can mark training days.
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const key = dateKey(s.start);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const monthLabel = month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const leadingBlanks = month.getDay(); // weekday the 1st falls on (0=Sun)
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();
  const todayKey = dateKey(new Date().toISOString());
  const shiftMonth = (delta: number) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <>
      <h2>Training summary</h2>
      <div className="stat-grid">
        <article>
          <span className="value">{sessions.length}</span>
          <span className="label">Sessions</span>
        </article>
        <article>
          <span className="value">{fmtDuration(totalMinutes)}</span>
          <span className="label">Mat time</span>
        </article>
        <article>
          <span className="value">{drilledCount}</span>
          <span className="label">Moves drilled</span>
        </article>
        <article>
          <span className="value">{totalRolls}</span>
          <span className="label">Rolls</span>
        </article>
        <article>
          <span className="value">{partners.length}</span>
          <span className="label">Partners</span>
        </article>
      </div>

      <hgroup>
        <h3>Recent sessions</h3>
        <p>
          <Link to="/sessions">View all sessions →</Link>
        </p>
      </hgroup>
      {sessions.length === 0 ? (
        <p>
          Nothing logged yet. Head to the <Link to="/log">Log</Link> to record
          your first session.
        </p>
      ) : (
        <div className="calendar-card">
          <div className="calendar-nav">
            <button
              className="outline"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <strong>{monthLabel}</strong>
            <button
              className="outline"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>
          <div className="calendar" role="grid" aria-label={monthLabel}>
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="calendar-head" role="columnheader">
                {w}
              </div>
            ))}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} className="calendar-cell is-empty" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const d = new Date(month.getFullYear(), month.getMonth(), day);
              const key = dateKey(d.toISOString());
              const count = byDay.get(key) ?? 0;
              const cls = [
                "calendar-cell",
                count > 0 ? "has-session" : "",
                key === todayKey ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const label = `${d.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })}${count ? ` — ${count} session${count === 1 ? "" : "s"}` : ""}`;
              return count > 0 ? (
                <Link key={key} to={`/dates/${key}`} className={cls} aria-label={label}>
                  {day}
                </Link>
              ) : (
                <div key={key} className={cls} role="gridcell" aria-label={label}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

const ROWS = [
  { rank: "01", title: "Township Lights", artist: "Kabelo M.", votes: "9,214" },
  { rank: "02", title: "Night Drive", artist: "Amara Voss", votes: "8,640" },
  { rank: "03", title: "Midnight Gqom", artist: "Naledi", votes: "7,191" },
  { rank: "04", title: "Amapiano Dawn", artist: "Lerato", votes: "6,088" },
  { rank: "05", title: "Cape Current", artist: "The Shoreline", votes: "5,472" },
];

export function LandingLeaderboard() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-4xl tracking-wide text-landing-ink sm:text-5xl">
          Leaderboard
        </h2>
        <p className="mt-3 text-landing-muted">
          A preview of how top-voted videos surface for funding.
        </p>
        <ol className="mt-10 overflow-hidden rounded-2xl border border-landing-raised bg-landing-surface">
          {ROWS.map((row, index) => (
            <li
              key={row.title}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${
                index < ROWS.length - 1 ? "border-b border-landing-raised" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="font-display text-2xl text-landing-accent">
                  {row.rank}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-landing-ink">
                    {row.title}
                  </p>
                  <p className="text-sm text-landing-muted">{row.artist}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-medium text-landing-muted">
                {row.votes} votes
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

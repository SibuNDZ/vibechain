const STATS = [
  { value: "12.4k", label: "Videos streamed" },
  { value: "86k", label: "Votes cast" },
  { value: "420 SOL", label: "Funds raised" },
  { value: "100%", label: "On-chain transparency" },
];

export function LandingStats() {
  return (
    <section className="border-y border-landing-raised bg-landing-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-4xl tracking-wide text-landing-accent">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-landing-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

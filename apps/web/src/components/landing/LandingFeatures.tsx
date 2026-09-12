const FEATURES = [
  {
    title: "Upload and stream",
    body: "Artists publish music videos with HLS playback. The community watches in one place.",
  },
  {
    title: "Community voting",
    body: "Each person gets a limited number of votes, so attention goes to work the crowd actually backs.",
  },
  {
    title: "Crowdfund winners",
    body: "Top-voted videos can open a campaign. Supporters send SOL and see every contribution.",
  },
  {
    title: "Wallet sign-in",
    body: "Connect any Solana wallet, or use email. Same account, same votes, same campaigns.",
  },
  {
    title: "On-chain transparency",
    body: "Funding lives on Solana. Transaction signatures stay attached to each contribution record.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl tracking-wide text-landing-ink sm:text-5xl">
          Built for the crowd
        </h2>
        <p className="mt-3 max-w-xl text-landing-muted">
          Five pieces that turn a music video into a public vote and a public raise.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-landing-raised bg-landing-surface p-6"
            >
              <h3 className="text-lg font-semibold text-landing-ink">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-landing-muted">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

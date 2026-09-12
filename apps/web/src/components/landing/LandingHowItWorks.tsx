const STEPS = [
  {
    step: "01",
    title: "Upload",
    body: "Artists submit a music video. It sits under review, then goes live for the crowd.",
  },
  {
    step: "02",
    title: "Get voted up",
    body: "Viewers spend a limited vote budget. Rankings decide what deserves a campaign.",
  },
  {
    step: "03",
    title: "Launch a campaign",
    body: "Top videos open crowdfunding. Supporters fund on Solana and watch the raise in public.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="bg-landing-surface px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl tracking-wide text-landing-ink sm:text-5xl">
          How it works
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((item) => (
            <article key={item.step}>
              <p className="font-display text-5xl text-landing-accent">{item.step}</p>
              <h3 className="mt-4 text-xl font-semibold text-landing-ink">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-landing-muted">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

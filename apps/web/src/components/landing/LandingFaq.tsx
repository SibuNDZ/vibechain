const FAQS = [
  {
    q: "Do I need a wallet?",
    a: "No. You can sign in with email. A Solana wallet is only required to fund a campaign or sign in with a wallet. Any installed wallet in your browser works.",
  },
  {
    q: "How many votes do I get?",
    a: "Each account has a limited vote budget so no one can flood the board. You can change a vote, but you cannot stack unlimited votes on one video.",
  },
  {
    q: "What fees apply?",
    a: "Streaming and voting are free. Crowdfunding takes a small platform fee on successful campaigns, capped well below 10%, plus normal Solana network fees.",
  },
  {
    q: "Where do the funds go?",
    a: "Contributions are recorded on-chain and attributed to the campaign. If the raise succeeds, the creator can claim the pot minus the platform fee. Failed campaigns can be refunded.",
  },
];

export function LandingFaq() {
  return (
    <section className="bg-landing-surface px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-4xl tracking-wide text-landing-ink sm:text-5xl">
          FAQ
        </h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-landing-raised bg-landing-bg px-5 py-4"
            >
              <summary className="cursor-pointer list-none font-semibold text-landing-ink">
                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-landing-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

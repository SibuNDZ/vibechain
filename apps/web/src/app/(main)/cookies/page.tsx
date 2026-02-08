"use client";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-10">
      <div className="max-w-3xl mx-auto px-4 text-gray-200">
        <h1 className="text-3xl font-bold text-white mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: February 8, 2026</p>

        <section className="space-y-6 text-sm leading-6">
          <p>
            This Cookie Policy explains how VibeChain uses cookies and similar
            technologies to recognize you when you visit our website.
          </p>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device to store
              information about your visit and preferences.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. How We Use Cookies</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Essential functionality (authentication, security).</li>
              <li>Performance and analytics.</li>
              <li>Personalization and preferences.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Managing Cookies</h2>
            <p>
              You can control cookies through your browser settings. Disabling
              cookies may affect some features of the service.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Updates</h2>
            <p>
              We may update this Cookie Policy. We will post the updated policy
              and revise the "Last updated" date above.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Contact</h2>
            <p>
              For questions about this Cookie Policy, contact us at{" "}
              <span className="text-gray-100">[PRIVACY_EMAIL]</span>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

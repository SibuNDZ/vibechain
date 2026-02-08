"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-10">
      <div className="max-w-3xl mx-auto px-4 text-gray-200">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: February 8, 2026</p>

        <section className="space-y-6 text-sm leading-6">
          <p>
            These Terms of Service ("Terms") govern your access to and use of
            VibeChain ("VibeChain", "we", "us", or "our"). By accessing or using
            the service, you agree to these Terms. If you do not agree, do not
            use the service.
          </p>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Eligibility</h2>
            <p>
              You must be at least the age of majority in your jurisdiction to
              use VibeChain. By using the service, you represent that you meet
              this requirement.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activity under your account.
              Notify us immediately of any unauthorized use.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. User Content</h2>
            <p>
              You retain ownership of content you upload. You grant VibeChain a
              worldwide, non-exclusive, royalty-free license to host, store,
              reproduce, display, and distribute your content for the purpose of
              operating and improving the service.
            </p>
            <p>
              You may only upload content you own or are authorized to use. We
              may remove content that violates these Terms or applicable law.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Prohibited Use</h2>
            <p>
              You agree not to misuse the service, including by interfering with
              its operation, attempting to access other users' accounts, or
              uploading unlawful, harmful, or infringing content.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Payments and Blockchain</h2>
            <p>
              If you contribute to crowdfunding campaigns or interact with
              blockchain features, you are responsible for complying with
              applicable laws and for any fees or taxes associated with those
              transactions.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">6. Termination</h2>
            <p>
              We may suspend or terminate access to the service at any time for
              violations of these Terms or for other lawful reasons.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">7. Disclaimer</h2>
            <p>
              The service is provided "as is" without warranties of any kind. We
              do not guarantee that the service will be uninterrupted or error
              free.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, VibeChain is not liable
              for indirect, incidental, special, or consequential damages.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">9. Changes</h2>
            <p>
              We may update these Terms from time to time. We will post the
              updated Terms and revise the "Last updated" date above.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">10. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <span className="text-gray-100">[SUPPORT_EMAIL]</span>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

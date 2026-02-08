"use client";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-10">
      <div className="max-w-3xl mx-auto px-4 text-gray-200">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: February 8, 2026</p>

        <section className="space-y-6 text-sm leading-6">
          <p>
            This Privacy Policy explains how VibeChain collects, uses, and
            shares information when you use our services.
          </p>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account details (e.g., username, email, wallet address).</li>
              <li>Profile info you choose to provide (bio, avatar).</li>
              <li>Content you upload (videos, descriptions, thumbnails).</li>
              <li>Usage data (pages viewed, interactions, votes).</li>
              <li>Device and log data (IP address, browser type).</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and improve the service.</li>
              <li>Authenticate users and secure accounts.</li>
              <li>Personalize recommendations and content.</li>
              <li>Moderate content and enforce our policies.</li>
              <li>Communicate important updates.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Sharing</h2>
            <p>
              We may share information with service providers who help us
              operate the service (e.g., hosting, analytics, media delivery).
              We may also disclose information if required by law or to protect
              our rights and users.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Security</h2>
            <p>
              We use reasonable security measures, but no method of transmission
              or storage is 100% secure.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Data Retention</h2>
            <p>
              We retain information as long as necessary to provide the service
              and comply with legal obligations.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">6. Your Choices</h2>
            <p>
              You can update your profile, manage cookies, or request deletion
              of your account by contacting us.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">7. International Transfers</h2>
            <p>
              Your information may be processed in countries other than your
              own. We take steps to protect data when it is transferred.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">8. Children</h2>
            <p>
              The service is not intended for children under the age of 13 (or
              the age of digital consent in your jurisdiction).
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">9. Changes</h2>
            <p>
              We may update this Privacy Policy. We will post the updated policy
              and revise the "Last updated" date above.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">10. Contact</h2>
            <p>
              For privacy questions, contact us at{" "}
              <span className="text-gray-100">[PRIVACY_EMAIL]</span>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

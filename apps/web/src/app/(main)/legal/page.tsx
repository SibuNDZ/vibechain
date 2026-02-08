"use client";

import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-10">
      <div className="max-w-3xl mx-auto px-4 text-gray-200">
        <h1 className="text-3xl font-bold text-white mb-2">Legal</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: February 8, 2026</p>

        <section className="space-y-4 text-sm leading-6">
          <p>
            This Legal page provides high-level information about your rights and
            responsibilities when using VibeChain. It is not legal advice. Please
            read the full Terms of Service, Privacy Policy, and Cookie Policy.
          </p>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Key documents</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <Link href="/terms" className="text-purple-300 hover:text-purple-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-purple-300 hover:text-purple-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-purple-300 hover:text-purple-200">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Copyright and IP</h2>
            <p>
              You may only upload content you own or are authorized to use. We may
              remove content that infringes intellectual property rights.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p>
              For legal inquiries, contact us at{" "}
              <span className="text-gray-100">[LEGAL_EMAIL]</span>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

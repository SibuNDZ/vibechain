"use client";

import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-3xl mx-auto px-4 text-slate-700">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Legal</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: February 8, 2026</p>

        <section className="space-y-4 text-sm leading-6">
          <p>
            This Legal page provides high-level information about your rights and
            responsibilities when using VibeChain. It is not legal advice. Please
            read the full Terms of Service, Privacy Policy, and Cookie Policy.
          </p>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Key documents</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <Link href="/terms" className="text-red-600 hover:text-red-700">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-red-600 hover:text-red-700">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-red-600 hover:text-red-700">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Copyright and IP</h2>
            <p>
              You may only upload content you own or are authorized to use. We may
              remove content that infringes intellectual property rights.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
            <p>
              For legal inquiries, contact us at{" "}
              <span className="text-slate-900">info@dsnresearch.com</span>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

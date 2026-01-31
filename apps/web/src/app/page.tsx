import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          Discover. Vote. Fund.
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mb-8">
          The decentralized platform where music videos compete for your votes
          and top creators get crowdfunded by the community.
        </p>
        <div className="flex gap-4">
          <Link
            href="/videos"
            className="px-8 py-3 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 transition"
          >
            Explore Videos
          </Link>
          <Link
            href="/crowdfunding"
            className="px-8 py-3 border border-purple-500 text-purple-300 rounded-lg text-lg font-semibold hover:bg-purple-900/50 transition"
          >
            View Campaigns
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 px-6 py-16 max-w-6xl mx-auto">
        <div className="bg-gray-800/50 p-6 rounded-xl">
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Upload & Share
          </h3>
          <p className="text-gray-400">
            Share your music videos with a global audience and build your fanbase.
          </p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl">
          <div className="text-4xl mb-4">🗳️</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Community Voting
          </h3>
          <p className="text-gray-400">
            Vote for your favorite videos. Top voted content enters the funding phase.
          </p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl">
          <div className="text-4xl mb-4">⛓️</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Blockchain Funding
          </h3>
          <p className="text-gray-400">
            Transparent crowdfunding powered by smart contracts. Every contribution tracked on-chain.
          </p>
        </div>
      </section>
    </main>
  );
}

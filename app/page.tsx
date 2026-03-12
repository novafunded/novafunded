export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">

        <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
          Launch pricing — first 50 traders
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-6xl">
          Get Your $5,000 Funded Demo Account — $11
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-white/70">
          Prove your trading skill with our low-cost demo challenge.
          Pass and you'll receive priority access to NovaFunded real funded accounts when we launch.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button className="rounded-xl bg-white px-8 py-4 font-semibold text-black hover:opacity-90">
            Start $11 Challenge
          </button>

          <button className="rounded-xl border border-white/20 px-8 py-4 font-semibold">
            View Rules
          </button>
        </div>

        <div className="mt-16 grid w-full max-w-5xl gap-6 md:grid-cols-4">

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Account Size</p>
            <p className="mt-2 text-2xl font-bold">$5,000</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Profit Target</p>
            <p className="mt-2 text-2xl font-bold">8%</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Daily Loss</p>
            <p className="mt-2 text-2xl font-bold">5%</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Max Drawdown</p>
            <p className="mt-2 text-2xl font-bold">10%</p>
          </div>

        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10">

          <h2 className="text-3xl font-bold">Challenge Rules</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            <div className="rounded-xl border border-white/10 p-5">
              Profit Target: $400 (8%)
            </div>

            <div className="rounded-xl border border-white/10 p-5">
              Maximum Daily Loss: $250 (5%)
            </div>

            <div className="rounded-xl border border-white/10 p-5">
              Maximum Drawdown: $500 (10%)
            </div>

            <div className="rounded-xl border border-white/10 p-5">
              Minimum Trading Days: 3
            </div>

          </div>

          <div className="mt-8 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-yellow-300">
            This is a demo evaluation. Traders who pass will receive priority access to NovaFunded funded accounts when we launch.
          </div>

        </div>
      </section>
    </main>
  );
}
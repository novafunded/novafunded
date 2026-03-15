export default function TournamentsPage() {
  const leaderboard = [
    {
      rank: 1,
      name: "M. Carter",
      country: "Canada",
      pnl: "+18.42%",
      trades: 31,
      winRate: "74%",
      reward: "$12,500",
    },
    {
      rank: 2,
      name: "A. Rahman",
      country: "UAE",
      pnl: "+16.97%",
      trades: 28,
      winRate: "71%",
      reward: "$7,500",
    },
    {
      rank: 3,
      name: "J. Bennett",
      country: "United Kingdom",
      pnl: "+15.88%",
      trades: 24,
      winRate: "69%",
      reward: "$5,000",
    },
    {
      rank: 4,
      name: "L. Moreau",
      country: "France",
      pnl: "+14.21%",
      trades: 22,
      winRate: "67%",
      reward: "$2,500",
    },
    {
      rank: 5,
      name: "S. Kim",
      country: "South Korea",
      pnl: "+13.76%",
      trades: 20,
      winRate: "70%",
      reward: "$1,500",
    },
    {
      rank: 6,
      name: "D. Novak",
      country: "Germany",
      pnl: "+12.94%",
      trades: 26,
      winRate: "64%",
      reward: "$1,000",
    },
  ]

  const rewards = [
    { place: "1st Place", reward: "$12,500", bonus: "Featured on NovaFunded Hall of Fame" },
    { place: "2nd Place", reward: "$7,500", bonus: "Fast-track evaluation discount" },
    { place: "3rd Place", reward: "$5,000", bonus: "Priority payout processing badge" },
    { place: "Top 10", reward: "$500", bonus: "Exclusive tournament profile badge" },
  ]

  const requirements = [
    {
      title: "Minimum Trading Days",
      value: "5 Days",
      note: "Traders must be active across at least 5 separate trading days.",
    },
    {
      title: "Maximum Daily Loss",
      value: "4%",
      note: "Breaching the daily drawdown threshold removes ranking eligibility.",
    },
    {
      title: "Maximum Overall Drawdown",
      value: "8%",
      note: "Participants must stay within tournament risk parameters at all times.",
    },
    {
      title: "Consistency Score",
      value: "70%+",
      note: "Ranking favors disciplined performance over one oversized trade.",
    },
  ]

  const activity = [
    {
      time: "2 min ago",
      title: "M. Carter moved into 1st place",
      desc: "A strong NASDAQ session pushed total tournament return to +18.42%.",
    },
    {
      time: "17 min ago",
      title: "127 new participants joined",
      desc: "The April Global Sprint is filling fast ahead of the weekly reset.",
    },
    {
      time: "43 min ago",
      title: "Leaderboard reshuffle",
      desc: "Three traders entered the top 10 after London session momentum.",
    },
    {
      time: "1 hr ago",
      title: "Prize pool milestone reached",
      desc: "Tournament rewards crossed $30,000 with sponsor bonus funding added.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="space-y-8">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                🏆 Premium Tournaments
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Compete with top traders and climb the NovaFunded leaderboard
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Enter premium trading competitions designed to reward consistency, discipline,
                and elite execution. Compete for cash prizes, profile recognition, and exclusive
                NovaFunded perks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Live Prize Pool</p>
                <p className="mt-2 text-xl font-semibold text-emerald-400">$31,500</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Participants</p>
                <p className="mt-2 text-xl font-semibold">2,184</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Your Position</p>
                <p className="mt-2 text-xl font-semibold">#248</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Status</p>
                <p className="mt-2 text-xl font-semibold text-emerald-400">Open</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                🔥 Active Tournament
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                April Global Sprint
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Trade for precision. Rank for real rewards.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
                  The April Global Sprint is a 14-day tournament for funded-style traders who
                  want to prove consistency under pressure. Rankings are based on percentage gain,
                  drawdown control, and execution quality across active trading days.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Tournament Period</p>
                  <p className="mt-2 text-lg font-semibold">14 Days</p>
                  <p className="mt-1 text-xs text-white/50">Apr 8 — Apr 22</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Entry Fee</p>
                  <p className="mt-2 text-lg font-semibold">$79</p>
                  <p className="mt-1 text-xs text-white/50">One-time competition access</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Account Size</p>
                  <p className="mt-2 text-lg font-semibold">$100,000 Sim</p>
                  <p className="mt-1 text-xs text-white/50">Standardized risk environment</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
                  Join Tournament
                </button>
                <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  View Rules
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Countdown & Status</p>
                <p className="mt-1 text-xs text-white/40">Registration closes soon</p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                🟢 Live
              </span>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-3">
              {[
                { label: "Days", value: "05" },
                { label: "Hours", value: "18" },
                { label: "Min", value: "42" },
                { label: "Sec", value: "19" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center"
                >
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs text-white/40">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Current Tournament Status</p>
                  <p className="text-sm font-medium text-emerald-400">Open for Entry</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Your Eligibility</p>
                  <p className="text-sm font-medium">Eligible to Join</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Competition Tier</p>
                  <p className="text-sm font-medium">Global Standard</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prize Pool + Rewards */}
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Prize Pool Breakdown</h3>
                <p className="mt-1 text-sm text-white/40">
                  Structured rewards designed to feel premium and competitive
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                Total: $31,500
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-emerald-400">Champion Reward</p>
                    <p className="mt-2 text-3xl font-semibold text-white">$12,500</p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                      Awarded to the highest-ranked trader who completes the tournament within all
                      risk parameters and maintains elite consistency.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/60">
                    👑 Rank #1
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs text-white/40">2nd Place</p>
                  <p className="mt-2 text-2xl font-semibold">$7,500</p>
                  <p className="mt-2 text-sm text-white/50">Cash reward + premium profile badge</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs text-white/40">3rd Place</p>
                  <p className="mt-2 text-2xl font-semibold">$5,000</p>
                  <p className="mt-2 text-sm text-white/50">Cash reward + priority recognition</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs text-white/40">Top 10 Pool</p>
                  <p className="mt-2 text-2xl font-semibold">$6,500</p>
                  <p className="mt-2 text-sm text-white/50">Distributed across high-ranking finishers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Ranking Rewards</h3>
              <p className="mt-1 text-sm text-white/40">
                More than payouts — every finish tier unlocks added prestige
              </p>
            </div>

            <div className="space-y-3">
              {rewards.map((item) => (
                <div
                  key={item.place}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.place}</p>
                      <p className="mt-1 text-sm text-white/50">{item.bonus}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{item.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Live Tournament Leaderboard</h3>
              <p className="mt-1 text-sm text-white/40">
                Realistic performance rankings based on current competition results
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                Updated every 15 minutes
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                Verified tournament metrics
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Trader</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Return</th>
                  <th className="px-4 py-3">Trades</th>
                  <th className="px-4 py-3">Win Rate</th>
                  <th className="px-4 py-3">Reward</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((trader) => (
                  <tr
                    key={trader.rank}
                    className="border-b border-white/5 text-sm text-white/80 transition hover:bg-white/5"
                  >
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                          trader.rank <= 3
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-white/5 text-white/70"
                        }`}
                      >
                        {trader.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium">{trader.name}</td>
                    <td className="px-4 py-4 text-white/60">{trader.country}</td>
                    <td className="px-4 py-4 font-semibold text-emerald-400">{trader.pnl}</td>
                    <td className="px-4 py-4 text-white/60">{trader.trades}</td>
                    <td className="px-4 py-4 text-white/60">{trader.winRate}</td>
                    <td className="px-4 py-4 font-medium">{trader.reward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Requirements + Activity */}
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Performance Requirements</h3>
              <p className="mt-1 text-sm text-white/40">
                Built to reward disciplined traders, not reckless spikes
              </p>
            </div>

            <div className="space-y-3">
              {requirements.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-white/50">{item.note}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Recent Tournament Activity</h3>
              <p className="mt-1 text-sm text-white/40">
                Live-style updates to make the competition panel feel active and believable
              </p>
            </div>

            <div className="space-y-4">
              {activity.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      ⚡
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className="text-xs text-white/40">{item.time}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
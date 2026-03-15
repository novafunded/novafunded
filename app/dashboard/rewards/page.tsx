export default function RewardsPage() {
  const rewardStats = [
    {
      label: "Reward Points",
      value: "12,480",
      subtext: "Earned through trading activity and milestones",
      tone: "positive",
    },
    {
      label: "Current Tier",
      value: "Elite",
      subtext: "Unlocked higher-value account perks",
      tone: "positive",
    },
    {
      label: "Available Credits",
      value: "$320",
      subtext: "Can be applied to new evaluations",
      tone: "neutral",
    },
    {
      label: "Lifetime Rewards",
      value: "$1,140",
      subtext: "Across discounts, credits, and account perks",
      tone: "neutral",
    },
  ]

  const perks = [
    {
      title: "Evaluation Discounts",
      desc: "Redeem reward credits on new challenge purchases and upgrades.",
      value: "Up to 25% off",
    },
    {
      title: "Priority Payout Queue",
      desc: "Higher-tier members receive faster payout review positioning.",
      value: "Elite perk",
    },
    {
      title: "Tournament Access",
      desc: "Use reward points for exclusive entries and bonus competitions.",
      value: "Points eligible",
    },
    {
      title: "Profile Recognition",
      desc: "Earn visible badges and status boosts on your account dashboard.",
      value: "Tier based",
    },
  ]

  const milestones = [
    {
      title: "Complete 5 payout cycles",
      progress: "5 / 5",
      status: "Completed",
    },
    {
      title: "Maintain 30 active trading days",
      progress: "24 / 30",
      status: "In Progress",
    },
    {
      title: "Place in a tournament top 10",
      progress: "1 / 1",
      status: "Completed",
    },
    {
      title: "Refer 3 funded traders",
      progress: "2 / 3",
      status: "In Progress",
    },
  ]

  const activity = [
    {
      title: "Elite rewards tier unlocked",
      time: "Today, 9:18 AM",
      desc: "Your account crossed the required points threshold and upgraded into Elite status.",
    },
    {
      title: "Reward credits added",
      time: "Yesterday, 6:04 PM",
      desc: "A new trading consistency bonus was applied to your reward balance.",
    },
    {
      title: "Tournament placement bonus received",
      time: "Mar 09, 2026",
      desc: "You earned bonus credits after finishing inside the top 10 of the latest event.",
    },
    {
      title: "Referral progress updated",
      time: "Mar 04, 2026",
      desc: "Your account referral milestone moved closer to the next reward unlock.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                🎁 Rewards Center
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Track your NovaFunded perks, credits, and trader reward progress
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                This page adds a premium loyalty layer to the dashboard with points, tier status,
                milestones, challenge credits, and perk-style benefits that make the platform feel
                more complete.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
                Redeem Rewards
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                View Reward Rules
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rewardStats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="text-sm text-white/40">{item.label}</p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  item.tone === "positive" ? "text-emerald-400" : "text-white"
                }`}
              >
                {item.value}
              </p>
              <p className="mt-2 text-sm text-white/50">{item.subtext}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Reward Perks</h3>
                <p className="mt-1 text-sm text-white/40">
                  Extra platform value that makes the ecosystem feel stronger
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                Elite Tier
              </span>
            </div>

            <div className="space-y-3">
              {perks.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.desc}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Tier Progress</h3>
            <p className="mt-1 text-sm text-white/40">
              Clean loyalty-style progression inside the trader dashboard
            </p>

            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <p className="text-sm text-emerald-400">Current Tier</p>
              <h2 className="mt-2 text-2xl font-semibold">Elite Trader Rewards</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Continue trading consistently and completing platform milestones to unlock higher
                credits, better visibility, and extra perks.
              </p>

              <div className="mt-4">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/50">
                  Tier Progress
                </p>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[82%] rounded-full bg-emerald-500" />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                  <span>12,480 / 15,000 points to next tier</span>
                  <span>82%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Reward Milestones</h3>
            <p className="mt-1 text-sm text-white/40">
              Achievement tracking that ties into the prop-firm feel
            </p>

            <div className="mt-5 space-y-3">
              {milestones.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-2 text-sm text-white/50">Progress: {item.progress}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.status === "Completed"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border border-white/10 bg-white/5 text-white/60"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Recent Reward Activity</h3>
            <p className="mt-1 text-sm text-white/40">
              Live-style account reward updates
            </p>

            <div className="mt-5 space-y-4">
              {activity.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      🎁
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
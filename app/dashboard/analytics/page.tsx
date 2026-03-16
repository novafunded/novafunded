export default function PayoutsPage() {
  const payoutStats = [
    {
      label: "Available for Withdrawal",
      value: "$4,820.00",
      subtext: "Eligible after current cycle closes",
      tone: "positive",
    },
    {
      label: "Next Payout Window",
      value: "Apr 26, 2026",
      subtext: "Estimated processing begins in 4 days",
      tone: "neutral",
    },
    {
      label: "Profit Split",
      value: "90 / 10",
      subtext: "Trader / NovaFunded",
      tone: "positive",
    },
    {
      label: "Total Paid Out",
      value: "$18,460.00",
      subtext: "Across 6 completed withdrawals",
      tone: "neutral",
    },
  ]

  const payoutMethods = [
    {
      method: "Crypto Transfer",
      desc: "Fast settlement for supported payout requests.",
      eta: "Within 6-18 hours",
      fee: "Low fee",
      status: "Preferred",
    },
    {
      method: "Bank Transfer",
      desc: "Standard withdrawal route for verified accounts.",
      eta: "1-3 business days",
      fee: "Standard fee",
      status: "Available",
    },
    {
      method: "Rise / Deel",
      desc: "Alternative payout rail for global traders.",
      eta: "Up to 24 hours",
      fee: "Varies by region",
      status: "Supported",
    },
  ]

  const payoutHistory = [
    {
      id: "#NV-10482",
      date: "Mar 01, 2026",
      amount: "$3,240.00",
      method: "Crypto Transfer",
      status: "Completed",
    },
    {
      id: "#NV-10391",
      date: "Feb 12, 2026",
      amount: "$2,180.00",
      method: "Bank Transfer",
      status: "Completed",
    },
    {
      id: "#NV-10314",
      date: "Jan 29, 2026",
      amount: "$4,920.00",
      method: "Crypto Transfer",
      status: "Completed",
    },
    {
      id: "#NV-10277",
      date: "Jan 11, 2026",
      amount: "$1,860.00",
      method: "Rise / Deel",
      status: "Completed",
    },
    {
      id: "#NV-10241",
      date: "Dec 20, 2025",
      amount: "$2,940.00",
      method: "Crypto Transfer",
      status: "Completed",
    },
  ]

  const requirements = [
    {
      title: "Minimum Profit Threshold",
      value: "$100",
      desc: "Your account must exceed the minimum withdrawal threshold before a request can be submitted.",
    },
    {
      title: "Consistency Review",
      value: "Required",
      desc: "Payouts are reviewed for risk compliance, trading behavior, and rule adherence before approval.",
    },
    {
      title: "Open Positions",
      value: "Must Be Closed",
      desc: "All active trades must be closed before entering a payout request window.",
    },
    {
      title: "Account Status",
      value: "In Good Standing",
      desc: "Breaches, violations, or ongoing investigations may pause or deny payout eligibility.",
    },
  ]

  const recentActivity = [
    {
      title: "Your next payout window has been unlocked",
      time: "Today, 8:14 AM",
      desc: "Your funded account completed the required cycle and is now eligible for a withdrawal request.",
    },
    {
      title: "Profit split updated to 90/10",
      time: "Yesterday, 4:32 PM",
      desc: "Your account advanced to the higher payout tier based on current performance and standing.",
    },
    {
      title: "Latest withdrawal completed",
      time: "Mar 01, 2026",
      desc: "A payout of $3,240.00 was sent successfully through your selected transfer method.",
    },
    {
      title: "Compliance review passed",
      time: "Feb 28, 2026",
      desc: "Your recent trading cycle cleared all risk checks and remained within payout policy limits.",
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
                💸 Payout Center
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Manage withdrawals, payout cycles, and trader profit splits
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Built to feel like a real funded account payout dashboard. Track your available
                balance, review completed withdrawals, monitor compliance status, and prepare for
                upcoming payout windows with full visibility.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
                Request Payout
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                View Payout Rules
              </button>
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                ✅ Payouts Enabled
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                NovaFunded Prime Account
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Your funded account is payout eligible this cycle
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
                  Based on your current standing, your account has remained within drawdown rules,
                  passed compliance review, and is eligible to submit a withdrawal during the next
                  available payout window. Keep performance steady and avoid unnecessary risk before
                  processing begins.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Current Cycle Profit</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-400">+$5,355.00</p>
                  <p className="mt-1 text-xs text-white/50">Net realized PnL</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Eligible Withdrawal</p>
                  <p className="mt-2 text-lg font-semibold">$4,820.00</p>
                  <p className="mt-1 text-xs text-white/50">After split adjustment</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Payout Frequency</p>
                  <p className="mt-2 text-lg font-semibold">Bi-Weekly</p>
                  <p className="mt-1 text-xs text-white/50">Standard funded cycle</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                  Payout Readiness
                </p>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[86%] rounded-full bg-emerald-500" />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                  <span>Compliance review, cycle completion, and balance verification</span>
                  <span>86%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Next Withdrawal Window</p>
                <p className="mt-1 text-xs text-white/40">Countdown until submission opens</p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                ⏳ Pending
              </span>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-3">
              {[
                { label: "Days", value: "04" },
                { label: "Hours", value: "11" },
                { label: "Min", value: "26" },
                { label: "Sec", value: "08" },
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
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Status</p>
                  <p className="text-sm font-medium text-emerald-400">Eligible</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Risk Review</p>
                  <p className="text-sm font-medium">Passed</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Method on File</p>
                  <p className="text-sm font-medium">Crypto Transfer</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Estimated Release</p>
                  <p className="text-sm font-medium">Same Day</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {payoutStats.map((item) => (
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

        {/* Methods + Rules */}
        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Payout Methods</h3>
              <p className="mt-1 text-sm text-white/40">
                Supported transfer options for funded account withdrawals
              </p>
            </div>

            <div className="space-y-3">
              {payoutMethods.map((item) => (
                <div
                  key={item.method}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.method}</p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/50">{item.desc}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:min-w-[220px]">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[11px] text-white/40">Speed</p>
                        <p className="mt-1 text-sm font-medium">{item.eta}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[11px] text-white/40">Fees</p>
                        <p className="mt-1 text-sm font-medium">{item.fee}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Payout Requirements</h3>
              <p className="mt-1 text-sm text-white/40">
                Standard funded-account rules before withdrawal approval
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
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.desc}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* History */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Payout History</h3>
              <p className="mt-1 text-sm text-white/40">
                Completed withdrawals and funded-account payout records
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                6 lifetime payouts
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                No failed withdrawals
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 text-sm text-white/80 transition hover:bg-white/5"
                  >
                    <td className="px-4 py-4 font-medium">{item.id}</td>
                    <td className="px-4 py-4 text-white/60">{item.date}</td>
                    <td className="px-4 py-4 font-semibold text-emerald-400">{item.amount}</td>
                    <td className="px-4 py-4 text-white/60">{item.method}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Activity */}
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Payout Summary</h3>
              <p className="mt-1 text-sm text-white/40">
                Quick view of your current withdrawal standing
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Average Processing Time</p>
                  <p className="text-sm font-medium">11 hours</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Highest Payout</p>
                  <p className="text-sm font-medium text-emerald-400">$4,920.00</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Current Compliance Flag</p>
                  <p className="text-sm font-medium">None</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Verification Status</p>
                  <p className="text-sm font-medium">Approved</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Recent Payout Activity</h3>
              <p className="mt-1 text-sm text-white/40">
                Latest funded-account withdrawal updates and account events
              </p>
            </div>

            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      💰
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
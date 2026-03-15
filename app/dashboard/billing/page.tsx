export default function BillingPage() {
  const billingStats = [
    {
      label: "Active Plan",
      value: "NovaFunded Prime",
      subtext: "Professional funded trader access",
      tone: "neutral",
    },
    {
      label: "Next Renewal",
      value: "Apr 28, 2026",
      subtext: "Auto-renewal currently enabled",
      tone: "neutral",
    },
    {
      label: "Total Spend",
      value: "$1,187.00",
      subtext: "Across evaluations and upgrades",
      tone: "positive",
    },
    {
      label: "Payment Status",
      value: "In Good Standing",
      subtext: "No failed invoices or past due items",
      tone: "positive",
    },
  ]

  const currentPlan = [
    {
      title: "Account Type",
      value: "$100,000 Evaluation",
    },
    {
      title: "Platform Access",
      value: "Prime Dashboard",
    },
    {
      title: "Profit Split Tier",
      value: "Up to 90%",
    },
    {
      title: "Billing Cycle",
      value: "Monthly",
    },
  ]

  const paymentMethods = [
    {
      type: "Visa ending in 4242",
      status: "Primary",
      expires: "08/28",
    },
    {
      type: "USDT Wallet",
      status: "Backup",
      expires: "Active",
    },
  ]

  const invoices = [
    {
      id: "INV-20418",
      date: "Mar 28, 2026",
      description: "NovaFunded Prime Monthly Access",
      amount: "$87.00",
      status: "Paid",
    },
    {
      id: "INV-20311",
      date: "Feb 28, 2026",
      description: "$100,000 Evaluation Purchase",
      amount: "$249.00",
      status: "Paid",
    },
    {
      id: "INV-20244",
      date: "Feb 14, 2026",
      description: "Add-on: Fast Track Upgrade",
      amount: "$59.00",
      status: "Paid",
    },
    {
      id: "INV-20197",
      date: "Jan 28, 2026",
      description: "NovaFunded Prime Monthly Access",
      amount: "$87.00",
      status: "Paid",
    },
    {
      id: "INV-20110",
      date: "Jan 03, 2026",
      description: "$50,000 Challenge Purchase",
      amount: "$169.00",
      status: "Paid",
    },
  ]

  const recentActivity = [
    {
      title: "Latest invoice paid successfully",
      time: "Mar 28, 2026",
      desc: "Your monthly NovaFunded Prime access fee was processed without interruption.",
    },
    {
      title: "Primary card updated",
      time: "Mar 12, 2026",
      desc: "Your account payment method was refreshed and remains set as the default billing source.",
    },
    {
      title: "Evaluation purchase recorded",
      time: "Feb 28, 2026",
      desc: "A new $100,000 evaluation was added to your billing history and linked to your dashboard access.",
    },
    {
      title: "Billing profile verified",
      time: "Feb 10, 2026",
      desc: "Your account remains in good standing with no disputes, overdue invoices, or payment flags.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                💳 Billing & Plans
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Manage your plan, invoices, and challenge purchases
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                This billing area makes NovaFunded feel like a real paid prop firm platform with
                active plan management, invoice history, stored payment methods, and subscription-style
                controls.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
                Upgrade Plan
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Download Invoices
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {billingStats.map((item) => (
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

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Current Plan Overview</h3>
                <p className="mt-1 text-sm text-white/40">
                  Active subscription and challenge profile details
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                ✅ Active
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm text-emerald-400">NovaFunded Prime</p>
                  <h2 className="mt-2 text-2xl font-semibold">$87/month</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                    Premium dashboard access, prop-firm style analytics, payout tracking,
                    certificates, tournament participation, and challenge management.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/70">
                  Next bill: Apr 28, 2026
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {currentPlan.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-xs text-white/40">{item.title}</p>
                  <p className="mt-2 text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Saved Payment Methods</h3>
              <p className="mt-1 text-sm text-white/40">
                Clean payment UI for a more believable platform experience
              </p>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((item) => (
                <div
                  key={item.type}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.type}</p>
                      <p className="mt-1 text-sm text-white/50">Expires / Status: {item.expires}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <button className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400">
                Add Method
              </button>
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Edit Billing
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Invoice History</h3>
              <p className="mt-1 text-sm text-white/40">
                Previous plan renewals, challenge purchases, and upgrades
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                100% paid on time
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                No disputed charges
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 text-sm text-white/80 transition hover:bg-white/5"
                  >
                    <td className="px-4 py-4 font-medium">{item.id}</td>
                    <td className="px-4 py-4 text-white/60">{item.date}</td>
                    <td className="px-4 py-4 text-white/60">{item.description}</td>
                    <td className="px-4 py-4 font-semibold">{item.amount}</td>
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

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Billing Controls</h3>
              <p className="mt-1 text-sm text-white/40">
                Premium-looking account management actions
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Change active plan",
                "Update billing email",
                "Download invoice archive",
                "Pause renewal reminders",
                "Review purchase history",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm text-white/70">{item}</p>
                  <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Recent Billing Activity</h3>
              <p className="mt-1 text-sm text-white/40">
                Live-style platform updates for your billing profile
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
                      💳
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
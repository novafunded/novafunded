"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { loadTradingContext, type TradingContext } from "@/lib/tradingAccount"
import { deriveTradingMetrics } from "@/lib/tradingMetrics"

function formatMoney(value: number, withPlus = false) {
  const sign = withPlus && value > 0 ? "+" : ""
  return `${sign}$${value.toFixed(2)}`
}

export default function PayoutsPage() {
  const [context, setContext] = useState<TradingContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setContext({
          status: "signed_out",
          userProfile: null,
          account: null,
          trades: [],
        })
        setLoading(false)
        return
      }

      const next = await loadTradingContext(user.uid, {
        includeTrades: true,
        tradeLimit: 250,
      })

      setContext(next)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  const metrics = useMemo(() => {
    return deriveTradingMetrics(context?.account ?? null, context?.trades ?? [])
  }, [context])

  const payoutStats = useMemo(() => {
    return [
      {
        label: "Available for Withdrawal",
        value: formatMoney(metrics.availableWithdrawal),
        subtext: metrics.payoutEligible
          ? "Eligible based on current account stats"
          : "Locked until requirements are met",
        tone: "positive",
      },
      {
        label: "Readiness",
        value: `${metrics.payoutReadinessPercent}%`,
        subtext: metrics.payoutBlockedReason ?? "Ready for request",
        tone: "neutral",
      },
      {
        label: "Profit Split",
        value: "90 / 10",
        subtext: "Trader / NovaFunded",
        tone: "positive",
      },
      {
        label: "Current Cycle Profit",
        value: formatMoney(metrics.currentCycleProfit, true),
        subtext: "Derived from active account balance",
        tone: "neutral",
      },
    ]
  }, [metrics])

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
      id: "No live payout records yet",
      date: "--",
      amount: "--",
      method: "--",
      status: "Pending Integration",
    },
  ]

  const requirements = [
    {
      title: "Minimum Profit Threshold",
      value: metrics.currentCycleProfit >= 100 ? "Met" : "Not Met",
      desc: "Your account must exceed the minimum withdrawal threshold before a request can be submitted.",
    },
    {
      title: "Consistency Review",
      value: context?.account && !context.account.breached ? "Passed" : "Blocked",
      desc: "Payouts are reviewed for risk compliance, trading behavior, and rule adherence before approval.",
    },
    {
      title: "Open Positions",
      value: metrics.openTrades.length === 0 && metrics.pendingTrades.length === 0 ? "Closed" : "Still Open",
      desc: "All active trades must be closed before entering a payout request window.",
    },
    {
      title: "Account Status",
      value:
        context?.account &&
        !context.account.breached &&
        !["breached", "locked"].includes(context.account.status.toLowerCase())
          ? "In Good Standing"
          : "Not Eligible",
      desc: "Breaches, violations, or ongoing investigations may pause or deny payout eligibility.",
    },
  ]

  const recentActivity = [
    {
      title: metrics.payoutEligible ? "Payout request is unlocked" : "Payout request is currently locked",
      time: "Live",
      desc: metrics.payoutBlockedReason ?? "All payout checks are currently passing.",
    },
    {
      title: "Current cycle profit",
      time: "Live",
      desc: `${formatMoney(metrics.currentCycleProfit, true)} based on the active account balance.`,
    },
    {
      title: "Closed trades counted",
      time: "Live",
      desc: `${metrics.closedTrades.length} closed trades are currently included in payout review.`,
    },
    {
      title: "Open position check",
      time: "Live",
      desc:
        metrics.openTrades.length === 0 && metrics.pendingTrades.length === 0
          ? "No open or pending trades are blocking payout eligibility."
          : "Open or pending trades are still blocking payout eligibility.",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          Loading payouts...
        </div>
      </div>
    )
  }

  if (!context?.account) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          No active trading account found.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="space-y-8">
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
                Live payout eligibility pulled from your active account and trade history.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                disabled={!metrics.payoutEligible}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  metrics.payoutEligible
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "cursor-not-allowed border border-white/10 bg-white/5 text-white/40"
                }`}
              >
                {metrics.payoutEligible ? "Request Payout" : "Payout Locked"}
              </button>

              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                View Payout Rules
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  metrics.payoutEligible
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border border-red-500/20 bg-red-500/10 text-red-300"
                }`}
              >
                {metrics.payoutEligible ? "✅ Payouts Enabled" : "⛔ Payouts Locked"}
              </span>

              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                {context.account.planName}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  {metrics.payoutEligible
                    ? "Your funded account is payout eligible this cycle"
                    : "Your account is not payout eligible yet"}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
                  {metrics.payoutBlockedReason ??
                    "Your account currently meets the payout checks shown below."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Current Cycle Profit</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-400">
                    {formatMoney(metrics.currentCycleProfit, true)}
                  </p>
                  <p className="mt-1 text-xs text-white/50">From active account balance</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Eligible Withdrawal</p>
                  <p className="mt-2 text-lg font-semibold">
                    {formatMoney(metrics.availableWithdrawal)}
                  </p>
                  <p className="mt-1 text-xs text-white/50">After 90 / 10 split</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Closed Trades Counted</p>
                  <p className="mt-2 text-lg font-semibold">{metrics.closedTrades.length}</p>
                  <p className="mt-1 text-xs text-white/50">Used for payout review</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                  Payout Readiness
                </p>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${metrics.payoutReadinessPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                  <span>{metrics.payoutBlockedReason ?? "All payout checks currently passing"}</span>
                  <span>{metrics.payoutReadinessPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Eligibility Snapshot</p>
                <p className="mt-1 text-xs text-white/40">Live funded-account payout checks</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  metrics.payoutEligible
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border border-red-500/20 bg-red-500/10 text-red-300"
                }`}
              >
                {metrics.payoutEligible ? "Eligible" : "Blocked"}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Status</p>
                  <p className="text-sm font-medium">
                    {metrics.payoutEligible ? "Eligible" : "Not Eligible"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Risk Review</p>
                  <p className="text-sm font-medium">
                    {context.account.breached ? "Failed" : "Passed"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Open Positions</p>
                  <p className="text-sm font-medium">
                    {metrics.openTrades.length === 0 && metrics.pendingTrades.length === 0
                      ? "None"
                      : `${metrics.openTrades.length + metrics.pendingTrades.length} active`}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Account Standing</p>
                  <p className="text-sm font-medium">{context.account.status}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                Live funded-account rules before withdrawal approval
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
                Live data pending
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                Eligibility now enforced
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
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
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
              <h3 className="text-xl font-semibold">Payout Summary</h3>
              <p className="mt-1 text-sm text-white/40">
                Quick view of your current withdrawal standing
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Closed Trades</p>
                  <p className="text-sm font-medium">{metrics.closedTrades.length}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Highest Winning Trade</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {formatMoney(metrics.largestWin)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Current Compliance Flag</p>
                  <p className="text-sm font-medium">
                    {context.account.breached ? "Breached" : "None"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Verification Status</p>
                  <p className="text-sm font-medium">Pending Integration</p>
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
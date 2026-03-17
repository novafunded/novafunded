"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { deriveTradingMetrics } from "@/lib/tradingMetrics"
import {
  getAccountDisplayStatus,
  loadTradingContext,
  type AccountData,
  type TradeRecord,
} from "@/lib/tradingAccount"

export default function TournamentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [contextStatus, setContextStatus] = useState("")
  const [account, setAccount] = useState<AccountData | null>(null)
  const [trades, setTrades] = useState<TradeRecord[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAccount(null)
        setTrades([])
        setContextStatus("signed_out")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      try {
        const context = await loadTradingContext(user.uid, {
          includeTrades: true,
          tradeLimit: 300,
        })

        setContextStatus(context.status)
        setAccount(context.account)
        setTrades(context.trades)
      } catch (err) {
        console.error("Failed to load tournaments page:", err)
        setError("Failed to load tournament data.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const metrics = useMemo(() => deriveTradingMetrics(account, trades), [account, trades])

  const eligible =
    !!account &&
    metrics.accountInGoodStanding &&
    metrics.closedTrades.length >= 5 &&
    metrics.tradingDays >= 5 &&
    metrics.openTrades.length === 0 &&
    metrics.pendingTrades.length === 0

  const summaryCards = [
    {
      label: "Tournament System",
      value: "Coming Soon",
      subtext: "No fake prize pools or fake leaderboards",
    },
    {
      label: "Your Eligibility",
      value: eligible ? "Ready when live" : "Not ready yet",
      subtext: "Based on real account and trade data",
    },
    {
      label: "Closed Trades",
      value: String(metrics.closedTrades.length),
      subtext: "Real completed trades",
    },
    {
      label: "Trading Days",
      value: String(metrics.tradingDays),
      subtext: "Real active closed-trade days",
    },
  ]

  const requirements = [
    {
      title: "Active account",
      value: account ? "Met" : "Missing",
      note: "A linked live account is required before tournament entry.",
    },
    {
      title: "Good standing",
      value: metrics.accountInGoodStanding ? "Met" : "Not met",
      note: "Breached or locked accounts should never be eligible.",
    },
    {
      title: "Closed trades history",
      value: metrics.closedTrades.length >= 5 ? "Met" : "Not met",
      note: "At least 5 closed trades are required for future tournament readiness.",
    },
    {
      title: "Trading days history",
      value: metrics.tradingDays >= 5 ? "Met" : "Not met",
      note: "At least 5 trading days are required before joining.",
    },
    {
      title: "No open exposure",
      value:
        metrics.openTrades.length === 0 && metrics.pendingTrades.length === 0 ? "Met" : "Not met",
      note: "Open or pending orders should block participation until flattened.",
    },
  ]

  const activity = [
    {
      time: "Live",
      title: "Tournament page cleaned up",
      desc: "Fake leaderboard rows, fake participants, and fake rewards were removed.",
    },
    {
      time: "Live",
      title: "Eligibility tied to real data",
      desc: "Tournament readiness now reflects account standing, closed trades, trading days, and open exposure.",
    },
    {
      time: "Live",
      title: "Safe for launch",
      desc: "The page remains premium without pretending the tournament backend is already live.",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-10 w-72 rounded bg-white/10" />
            <div className="h-64 rounded-2xl bg-white/5" />
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <h1 className="text-2xl font-semibold text-red-300">Tournaments failed to load</h1>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
        </section>
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
                🏆 Tournaments
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Tournament mode is coming soon
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                This page no longer pretends there are live tournaments, prize pools, or rankings.
                It now shows whether your current account would qualify once the real tournament
                engine is built.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {summaryCards.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-xs text-white/40">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-xs text-white/50">{item.subtext}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  eligible
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                }`}
              >
                {eligible ? "✅ Ready when live" : "⏳ Not ready yet"}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                {account?.planName || "No Active Account"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Honest now, expandable later
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
                  This structure is ready for a future tournament backend, but it does not show made-up
                  rewards or fake competition stats today.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Account Status</p>
                  <p className="mt-2 text-lg font-semibold">{getAccountDisplayStatus(account)}</p>
                  <p className="mt-1 text-xs text-white/50">Live account state</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Current Profit</p>
                  <p className="mt-2 text-lg font-semibold">
                    ${metrics.currentCycleProfit.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-white/50">Cycle profit from account balance</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Open Exposure</p>
                  <p className="mt-2 text-lg font-semibold">
                    {metrics.openTrades.length + metrics.pendingTrades.length}
                  </p>
                  <p className="mt-1 text-xs text-white/50">Open and pending trades</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <p className="text-sm font-medium text-white">Tournament readiness</p>
              <p className="mt-1 text-xs text-white/40">Future-entry checklist</p>
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
                    <p
                      className={`text-sm font-semibold ${
                        item.value === "Met" ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Recent tournament system activity</h3>
            <p className="mt-1 text-sm text-white/40">
              Platform-side notes until the real tournament engine exists
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

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            Context status: {contextStatus || "unknown"}
          </div>
        </section>
      </div>
    </div>
  )
}
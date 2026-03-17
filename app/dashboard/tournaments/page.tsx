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
          tradeLimit: 200,
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
    !account.breached &&
    metrics.closedTrades.length >= 1 &&
    metrics.tradingDays >= 1

  const statusLabel = eligible ? "Eligible When Live" : "Not Ready Yet"

  const summaryCards = [
    {
      label: "Tournament Status",
      value: "Coming Soon",
      subtext: "No real tournament engine is live yet",
    },
    {
      label: "Your Eligibility",
      value: statusLabel,
      subtext: "Based on your real account and trade data",
    },
    {
      label: "Closed Trades",
      value: String(metrics.closedTrades.length),
      subtext: "Used as a simple eligibility signal",
    },
    {
      label: "Trading Days",
      value: String(metrics.tradingDays),
      subtext: "Pulled from your live trade history",
    },
  ]

  const requirements = [
    {
      title: "Active Account",
      value: account ? "Met" : "Missing",
      note: "A linked active account is required before tournament entry.",
    },
    {
      title: "Good Standing",
      value: account && !account.breached ? "Met" : "Not Met",
      note: "Breached or locked accounts should not be eligible.",
    },
    {
      title: "Closed Trades",
      value: metrics.closedTrades.length >= 1 ? "Met" : "Not Met",
      note: "At least one closed trade helps confirm live usage.",
    },
    {
      title: "Trading Days",
      value: metrics.tradingDays >= 1 ? "Met" : "Not Met",
      note: "Basic history exists before competition participation.",
    },
  ]

  const activity = [
    {
      time: "Live",
      title: "Tournament page cleaned up",
      desc: "This section no longer shows fake participants, fake prizes, or fake rankings.",
    },
    {
      time: "Live",
      title: "Eligibility synced to account state",
      desc: "Your readiness now reflects real account standing and trade history.",
    },
    {
      time: "Live",
      title: "Competition system pending",
      desc: "A real tournament backend can be added later without rebuilding this page design.",
    },
  ]

  const yourPositionText = eligible
    ? "Ready for future entry"
    : "Complete account activity first"

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
                🏆 Premium Tournaments
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Compete when the real tournament system goes live
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                This section is now honest and account-aware. Instead of fake prize pools and fake
                leaderboards, it shows whether your current account would be eligible once
                tournaments are actually launched.
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

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {eligible ? "✅ Eligibility Detected" : "⏳ Not Ready Yet"}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                {account?.planName || "No Active Account"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Tournament infrastructure can come later without fake frontend stats
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
                  Your current page now reads your live account state to determine whether you would
                  qualify for future events. That is way cleaner than pretending thousands of traders
                  and prize pools already exist.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Account Status</p>
                  <p className="mt-2 text-lg font-semibold">{getAccountDisplayStatus(account)}</p>
                  <p className="mt-1 text-xs text-white/50">Live account state</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Current Plan</p>
                  <p className="mt-2 text-lg font-semibold">{account?.planName || "—"}</p>
                  <p className="mt-1 text-xs text-white/50">Pulled from Firestore</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Your Position</p>
                  <p className="mt-2 text-lg font-semibold">{yourPositionText}</p>
                  <p className="mt-1 text-xs text-white/50">No live rankings yet</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
                  Coming Soon
                </button>
                <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
                  Rules later
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Tournament Readiness</p>
                <p className="mt-1 text-xs text-white/40">Basic eligibility checklist</p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {eligible ? "Ready" : "Pending"}
              </span>
            </div>

            <div className="mt-6 space-y-3">
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
            <h3 className="text-xl font-semibold">Recent Tournament Activity</h3>
            <p className="mt-1 text-sm text-white/40">
              Honest platform updates until the real system exists
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
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

function formatMoney(value: number) {
  const sign = value < 0 ? "-" : ""
  return `${sign}$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatNumber(value: number, digits = 2) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatPercent(value: number) {
  return `${formatNumber(value, 2)}%`
}

function formatDateTime(value?: number | null) {
  if (!value) return "—"

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getTradeStatusTone(status: TradeRecord["status"]) {
  if (status === "closed") {
    return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
  }

  if (status === "open") {
    return "text-blue-400 border-blue-500/20 bg-blue-500/10"
  }

  if (status === "pending") {
    return "text-amber-400 border-amber-500/20 bg-amber-500/10"
  }

  return "text-white/70 border-white/10 bg-white/5"
}

function getPnLTone(value: number) {
  if (value > 0) return "text-emerald-400"
  if (value < 0) return "text-red-400"
  return "text-white"
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [contextStatus, setContextStatus] = useState<string>("")
  const [account, setAccount] = useState<AccountData | null>(null)
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthReady(true)

      if (!user) {
        setIsSignedIn(false)
        setAccount(null)
        setTrades([])
        setContextStatus("signed_out")
        setLoading(false)
        return
      }

      setIsSignedIn(true)
      setLoading(true)
      setError("")

      try {
        const context = await loadTradingContext(user.uid, {
          includeTrades: true,
          tradeLimit: 500,
        })

        setContextStatus(context.status)
        setAccount(context.account)
        setTrades(context.trades)
      } catch (err) {
        console.error("Failed to load analytics context:", err)
        setError("Failed to load analytics data.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const metrics = useMemo(() => {
    return deriveTradingMetrics(account, trades)
  }, [account, trades])

  const recentTrades = useMemo(() => {
    return [...trades]
      .sort((a, b) => {
        const aTime = a.closedAtMs ?? a.openedAtMs ?? a.createdAtMs ?? 0
        const bTime = b.closedAtMs ?? b.openedAtMs ?? b.createdAtMs ?? 0
        return bTime - aTime
      })
      .slice(0, 10)
  }, [trades])

  const accountStatus = getAccountDisplayStatus(account)

  const accountStatusTone =
    accountStatus === "Breached" || accountStatus === "Locked"
      ? "text-red-400 border-red-500/20 bg-red-500/10"
      : accountStatus === "Passed"
        ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
        : "text-white border-white/10 bg-white/5"

  const payoutStatusTone = metrics.payoutEligible
    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
    : "text-amber-400 border-amber-500/20 bg-amber-500/10"

  if (loading || !authReady) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="space-y-8">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-32 rounded bg-white/10" />
              <div className="h-10 w-72 rounded bg-white/10" />
              <div className="h-4 w-full max-w-2xl rounded bg-white/10" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="h-4 w-24 rounded bg-white/10" />
                    <div className="mt-3 h-8 w-28 rounded bg-white/10" />
                    <div className="mt-3 h-4 w-32 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (!isSignedIn || contextStatus === "signed_out") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
              Analytics
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Sign in to view your trading analytics
            </h1>
            <p className="text-sm leading-6 text-white/60 md:text-base">
              Your account data, trading history, payout readiness, and performance metrics will
              appear here once you’re signed in.
            </p>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <h1 className="text-2xl font-semibold text-red-300">Analytics failed to load</h1>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
        </section>
      </div>
    )
  }

  if (!account || contextStatus !== "ready") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
              Analytics
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              No active trading account found
            </h1>
            <p className="text-sm leading-6 text-white/60 md:text-base">
              Your analytics page needs an active account in Firestore before it can show
              performance, trade stats, and payout data.
            </p>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">
              Current status: {contextStatus || "unknown"}
            </div>
          </div>
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
                📊 Trading Analytics
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Real account performance, payout readiness, and trade metrics
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                This page reads your live account and trade data from Firestore so analytics match
                your actual NovaFunded activity instead of old hardcoded values.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`rounded-2xl border px-4 py-2 text-sm font-medium ${accountStatusTone}`}
              >
                Account: {accountStatus}
              </span>
              <span
                className={`rounded-2xl border px-4 py-2 text-sm font-medium ${payoutStatusTone}`}
              >
                {metrics.payoutEligible ? "Payout Eligible" : "Payout Locked"}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm text-white/40">Account Balance</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatMoney(account.balance)}</p>
            <p className="mt-2 text-sm text-white/50">
              Start balance: {formatMoney(account.startBalance)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm text-white/40">Equity</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatMoney(account.equity)}</p>
            <p className="mt-2 text-sm text-white/50">Live account equity snapshot</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm text-white/40">Current Cycle Profit</p>
            <p className={`mt-2 text-2xl font-semibold ${getPnLTone(metrics.currentCycleProfit)}`}>
              {formatMoney(metrics.currentCycleProfit)}
            </p>
            <p className="mt-2 text-sm text-white/50">Based on balance vs start balance</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm text-white/40">Available Withdrawal</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {formatMoney(metrics.availableWithdrawal)}
            </p>
            <p className="mt-2 text-sm text-white/50">
              {metrics.payoutEligible
                ? "90% split available right now"
                : metrics.payoutBlockedReason || "Not eligible yet"}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                {account.planName}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                {account.phase}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                {metrics.totalTrades} total trades
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Win Rate</p>
                <p className="mt-2 text-lg font-semibold">{formatPercent(metrics.winRate)}</p>
                <p className="mt-1 text-xs text-white/50">
                  {metrics.wins} wins / {metrics.losses} losses
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Realized PnL</p>
                <p className={`mt-2 text-lg font-semibold ${getPnLTone(metrics.realizedPnl)}`}>
                  {formatMoney(metrics.realizedPnl)}
                </p>
                <p className="mt-1 text-xs text-white/50">Closed trades only</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Profit Factor</p>
                <p className="mt-2 text-lg font-semibold">
                  {metrics.profitFactor === 999 ? "∞" : formatNumber(metrics.profitFactor)}
                </p>
                <p className="mt-1 text-xs text-white/50">Gross profit / gross loss</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Average Winner</p>
                <p className="mt-2 text-lg font-semibold text-emerald-400">
                  {formatMoney(metrics.averageWinner)}
                </p>
                <p className="mt-1 text-xs text-white/50">Mean winning trade</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Average Loser</p>
                <p className="mt-2 text-lg font-semibold text-red-400">
                  {formatMoney(metrics.averageLoser)}
                </p>
                <p className="mt-1 text-xs text-white/50">Mean losing trade</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Expectancy</p>
                <p className={`mt-2 text-lg font-semibold ${getPnLTone(metrics.expectancy)}`}>
                  {formatMoney(metrics.expectancy)}
                </p>
                <p className="mt-1 text-xs text-white/50">Average outcome per closed trade</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Payout Readiness</h2>
              <p className="mt-1 text-sm text-white/40">
                Based on your real account and trade conditions
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-white/40">
                  <span>Readiness progress</span>
                  <span>{metrics.payoutReadinessPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${metrics.payoutReadinessPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/60">Account Standing</p>
                    <p className="text-sm font-medium">{accountStatus}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/60">Closed Trades</p>
                    <p className="text-sm font-medium">{metrics.closedTrades.length}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/60">Open / Pending</p>
                    <p className="text-sm font-medium">
                      {metrics.openTrades.length} / {metrics.pendingTrades.length}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/60">Current Profit</p>
                    <p className={`text-sm font-medium ${getPnLTone(metrics.currentCycleProfit)}`}>
                      {formatMoney(metrics.currentCycleProfit)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/60">Eligibility</p>
                    <p
                      className={`text-sm font-medium ${
                        metrics.payoutEligible ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {metrics.payoutEligible ? "Eligible" : "Blocked"}
                    </p>
                  </div>
                </div>

                {!metrics.payoutEligible && metrics.payoutBlockedReason ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
                      Blocking reason
                    </p>
                    <p className="mt-2 text-sm text-amber-100/90">
                      {metrics.payoutBlockedReason}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Trade Breakdown</h3>
            <p className="mt-1 text-sm text-white/40">Live totals from Firestore</p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Total Trades</p>
                  <p className="text-sm font-medium">{metrics.totalTrades}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Closed Trades</p>
                  <p className="text-sm font-medium">{metrics.closedTrades.length}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Open Trades</p>
                  <p className="text-sm font-medium">{metrics.openTrades.length}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Pending Trades</p>
                  <p className="text-sm font-medium">{metrics.pendingTrades.length}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Trading Days</p>
                  <p className="text-sm font-medium">{metrics.tradingDays}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Risk Metrics</h3>
            <p className="mt-1 text-sm text-white/40">Based on current account snapshot</p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Max Loss Limit</p>
                  <p className="text-sm font-medium">{formatMoney(account.maxLossLimit)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Daily Loss Limit</p>
                  <p className="text-sm font-medium">{formatMoney(account.dailyLossLimit)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Drawdown Used</p>
                  <p className="text-sm font-medium text-red-400">
                    {formatMoney(metrics.drawdownUsed)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Drawdown Remaining</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {formatMoney(metrics.drawdownRemaining)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Daily Loss Remaining</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {formatMoney(metrics.dailyLossRemaining)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Best / Worst Trades</h3>
            <p className="mt-1 text-sm text-white/40">Closed trade performance extremes</p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Largest Win</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {formatMoney(metrics.largestWin)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Largest Loss</p>
                  <p className="text-sm font-medium text-red-400">
                    {formatMoney(metrics.largestLoss)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Gross Profit</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {formatMoney(metrics.grossProfit)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Gross Loss</p>
                  <p className="text-sm font-medium text-red-400">
                    {formatMoney(metrics.grossLoss)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Activated At</p>
                  <p className="text-sm font-medium">
                    {account.activatedAtMs ? formatDateTime(account.activatedAtMs) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Recent Trades</h3>
              <p className="mt-1 text-sm text-white/40">
                Latest trade records pulled from Firestore
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                {metrics.closedTrades.length} closed
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                {metrics.openTrades.length} open
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                {metrics.pendingTrades.length} pending
              </span>
            </div>
          </div>

          {recentTrades.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/50">
              No trades found yet. Once trades are written to Firestore, they’ll show here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Side</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Entry</th>
                    <th className="px-4 py-3">Close</th>
                    <th className="px-4 py-3">PnL</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-white/5 text-sm text-white/80 transition hover:bg-white/5"
                    >
                      <td className="px-4 py-4 font-medium">{trade.symbol}</td>
                      <td className="px-4 py-4">
                        <span className={trade.side === "buy" ? "text-emerald-400" : "text-red-400"}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-white/60">{trade.orderType}</td>
                      <td className="px-4 py-4 text-white/60">
                        {trade.entry !== null ? formatNumber(trade.entry, 2) : "—"}
                      </td>
                      <td className="px-4 py-4 text-white/60">
                        {trade.closePrice !== null && trade.closePrice !== undefined
                          ? formatNumber(trade.closePrice, 2)
                          : "—"}
                      </td>
                      <td className={`px-4 py-4 font-semibold ${getPnLTone(trade.pnl)}`}>
                        {formatMoney(trade.pnl)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${getTradeStatusTone(
                            trade.status,
                          )}`}
                        >
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-white/50">
                        {formatDateTime(
                          trade.closedAtMs ?? trade.openedAtMs ?? trade.createdAtMs ?? null,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
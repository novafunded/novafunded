"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  AccountData,
  TradeRecord,
  getAccountDisplayStatus,
  isFreshActivatedAccount,
  isTradingLocked,
  loadTradingContext,
} from "@/lib/tradingAccount"
import { deriveTradingMetrics } from "@/lib/tradingMetrics"

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatTime(timestamp?: number | null) {
  if (!timestamp) return "--"

  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

type EmptyStateKind =
  | "none"
  | "signed_out"
  | "missing_user_profile"
  | "no_active_account"
  | "account_not_found"
  | "error"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<AccountData | null>(null)
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [emptyState, setEmptyState] = useState<EmptyStateKind>("none")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true)

      if (!user) {
        setAccount(null)
        setTrades([])
        setEmptyState("signed_out")
        setLoading(false)
        return
      }

      try {
        const context = await loadTradingContext(user.uid, {
          includeTrades: true,
          tradeLimit: 100,
        })

        if (context.status !== "ready" || !context.account) {
          setAccount(null)
          setTrades([])

          if (context.status === "signed_out") {
            setEmptyState("signed_out")
          } else if (context.status === "missing_user_profile") {
            setEmptyState("missing_user_profile")
          } else if (context.status === "no_active_account") {
            setEmptyState("no_active_account")
          } else if (context.status === "account_not_found") {
            setEmptyState("account_not_found")
          } else {
            setEmptyState("error")
          }

          setLoading(false)
          return
        }

        setAccount(context.account)
        setTrades(context.trades)
        setEmptyState("none")
      } catch (error) {
        console.error("Dashboard load failed:", error)
        setAccount(null)
        setTrades([])
        setEmptyState("error")
      } finally {
        setLoading(false)
      }
    })

    return () => unsub()
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
      .slice(0, 8)
  }, [trades])

  const pnl = metrics.currentCycleProfit
  const drawdownUsed = metrics.drawdownUsed
  const drawdownLeft = metrics.drawdownRemaining

  const profitTarget = Math.max((account?.startBalance ?? 0) * 0.1, 1)

  const targetProgress = useMemo(() => {
    return clamp((pnl / profitTarget) * 100, 0, 100)
  }, [pnl, profitTarget])

  const winRate = Math.round(metrics.winRate)

  const equitySeries = useMemo(() => {
    if (!account) return []

    const closedTrades = [...trades]
      .filter((trade) => trade.status === "closed")
      .sort((a, b) => {
        const aTime = a.closedAtMs ?? a.openedAtMs ?? a.createdAtMs ?? 0
        const bTime = b.closedAtMs ?? b.openedAtMs ?? b.createdAtMs ?? 0
        return aTime - bTime
      })

    let running = account.startBalance

    const points =
      closedTrades.length > 0
        ? closedTrades.map((trade) => {
            running += trade.pnl
            return Number(running.toFixed(2))
          })
        : [
            account.startBalance,
            Number((account.startBalance + pnl * 0.25).toFixed(2)),
            Number((account.startBalance + pnl * 0.5).toFixed(2)),
            Number((account.startBalance + pnl * 0.75).toFixed(2)),
            Number(account.balance.toFixed(2)),
          ]

    return points
  }, [account, trades, pnl])

  const chartPath = useMemo(() => {
    if (equitySeries.length === 0) return ""

    const width = 100
    const height = 36
    const min = Math.min(...equitySeries)
    const max = Math.max(...equitySeries)
    const range = max - min || 1

    return equitySeries
      .map((value, index) => {
        const x =
          equitySeries.length === 1
            ? width / 2
            : (index / (equitySeries.length - 1)) * width
        const y = height - ((value - min) / range) * height
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(" ")
  }, [equitySeries])

  const accountStatus = useMemo(() => {
    if (!account) return "No Account"
    if (account.breached) return "Breached"
    if (targetProgress >= 100 && !account.breached) return "Target Hit"
    return getAccountDisplayStatus(account)
  }, [account, targetProgress])

  const statusTone =
    account?.breached || accountStatus === "Breached" || accountStatus === "Locked"
      ? "text-red-400"
      : targetProgress >= 100 || accountStatus === "Passed" || accountStatus === "Funded"
        ? "text-emerald-400"
        : "text-cyan-300"

  const freshActivated = isFreshActivatedAccount(account, trades)
  const tradingLocked = isTradingLocked(account)

  if (loading) {
    return <div className="p-10 text-white/60">Loading dashboard...</div>
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-[#050816] p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
            NovaFunded Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-lg font-semibold">
              {emptyState === "no_active_account"
                ? "No active challenge found"
                : emptyState === "account_not_found"
                  ? "Your account record could not be loaded"
                  : emptyState === "missing_user_profile"
                    ? "Your user profile is not ready yet"
                    : "Dashboard unavailable"}
            </h2>

            <p className="mt-2 text-sm text-white/60">
              {emptyState === "no_active_account"
                ? "Complete checkout to activate your challenge. Once payment is confirmed, your account will appear here automatically."
                : emptyState === "account_not_found"
                  ? "Your user profile exists, but the active account record is missing. Check the latest Stripe confirmation or create a new challenge."
                  : emptyState === "missing_user_profile"
                    ? "Your login worked, but your NovaFunded user document has not been created yet."
                    : "We could not load your trading dashboard right now."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/checkout"
                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-[#04111f] transition hover:bg-cyan-300"
              >
                Activate Challenge
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] p-6 text-white">
      {freshActivated ? (
        <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">
            Challenge Activated
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Your {account.planName} challenge is now live.
          </h2>
          <p className="mt-2 text-sm text-white/70">
            Your account has been created, your balance is funded, and you can start trading from the terminal.
          </p>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_40px_rgba(0,0,0,0.35)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
            NovaFunded Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Trading Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">
            {account.planName} · {account.phase}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-xs text-white/45">Status</p>
            <p className={`mt-1 text-lg font-semibold ${statusTone}`}>{accountStatus}</p>
          </div>

          {tradingLocked ? (
            <div className="cursor-not-allowed rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/40">
              Trading Locked
            </div>
          ) : (
            <Link
              href="/dashboard/trade"
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-[#04111f] transition hover:bg-cyan-300"
            >
              Open Terminal
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Stat title="Balance" value={formatMoney(account.balance)} />
        <Stat title="Equity" value={formatMoney(account.equity)} />
        <Stat
          title="Net PnL"
          value={`${pnl >= 0 ? "+" : ""}${formatMoney(Math.abs(pnl)).replace("$", "$")}`}
          positive={pnl >= 0}
        />
        <Stat
          title="Drawdown Left"
          value={formatMoney(drawdownLeft)}
          positive={drawdownLeft > 0}
        />
        <Stat title="Target Progress" value={`${targetProgress.toFixed(0)}%`} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="Closed Trades" value={metrics.closedTrades.length} />
        <Stat title="Trading Days" value={metrics.tradingDays} />
        <Stat title="Max Loss Limit" value={formatMoney(account.maxLossLimit)} />
        <Stat title="Daily Loss Limit" value={formatMoney(account.dailyLossLimit)} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                Equity Curve
              </p>
              <h2 className="mt-1 text-lg font-semibold">Performance Snapshot</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
              {equitySeries.length} points
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-white/45">
              <span>Start {formatMoney(account.startBalance)}</span>
              <span>Current {formatMoney(account.balance)}</span>
            </div>

            <svg viewBox="0 0 100 36" className="h-40 w-full">
              <path
                d={chartPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={pnl >= 0 ? "text-emerald-400" : "text-red-400"}
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                <span>Profit target progress</span>
                <span>{targetProgress.toFixed(0)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                Account Status
              </p>
              <h2 className="mt-1 text-lg font-semibold">Evaluation Health</h2>
            </div>
          </div>

          <div className="grid gap-4">
            <InfoRow label="Plan" value={account.planName} />
            <InfoRow label="Phase" value={account.phase} />
            <InfoRow label="Status" value={accountStatus} tone={statusTone} />
            <InfoRow label="Win Rate" value={`${winRate}%`} />
            <InfoRow label="User ID" value={account.userId || "--"} />
            <InfoRow label="Account ID" value={account.id} />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">
              Recent Trades
            </p>
            <h2 className="mt-1 text-lg font-semibold">Latest Activity</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
            {recentTrades.length} loaded
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-white/45">
              <tr className="border-b border-white/10">
                <th className="px-3 py-3 font-medium">Symbol</th>
                <th className="px-3 py-3 font-medium">Side</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">PnL</th>
                <th className="px-3 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-white/40">
                    No recent trades found yet.
                  </td>
                </tr>
              ) : (
                recentTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-white/5">
                    <td className="px-3 py-3 font-medium">{trade.symbol}</td>
                    <td className="px-3 py-3 uppercase">{trade.side}</td>
                    <td className="px-3 py-3 text-white/55">{trade.status}</td>
                    <td
                      className={`px-3 py-3 font-medium ${
                        trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {trade.pnl >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(trade.pnl))}
                    </td>
                    <td className="px-3 py-3 text-white/55">
                      {formatTime(trade.closedAtMs ?? trade.openedAtMs ?? trade.createdAtMs)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Stat({
  title,
  value,
  positive,
}: {
  title: string
  value: string | number
  positive?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-white/45">{title}</p>
      <p
        className={`mt-2 text-lg font-semibold ${
          positive === undefined
            ? ""
            : positive
              ? "text-emerald-400"
              : "text-red-400"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function InfoRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-white/50">{label}</span>
      <span className={`max-w-[60%] truncate text-sm font-medium ${tone ?? "text-white"}`}>
        {value}
      </span>
    </div>
  )
}
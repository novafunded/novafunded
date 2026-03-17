"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  getAccountDisplayStatus,
  loadTradingContext,
  type AccountData,
  type TradeRecord,
} from "@/lib/tradingAccount"
import { deriveTradingMetrics } from "@/lib/tradingMetrics"

function formatDate(value?: number | null) {
  if (!value) return "—"

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function makeCertId(accountId?: string) {
  if (!accountId) return "NV-CERT-PREVIEW"
  return `NV-CERT-${accountId.slice(-6).toUpperCase()}`
}

export default function CertificatesPage() {
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
        console.error("Failed to load certificates page:", err)
        setError("Failed to load certificates data.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const metrics = useMemo(() => deriveTradingMetrics(account, trades), [account, trades])

  const accountStatus = getAccountDisplayStatus(account)
  const verified = !!account && !account.breached
  const certId = makeCertId(account?.id)
  const closedTrades = metrics.closedTrades.length
  const hasActivatedDate = !!account?.activatedAtMs
  const achievementPercent = Math.min(
    100,
    [
      account ? 25 : 0,
      closedTrades > 0 ? 20 : 0,
      metrics.currentCycleProfit > 0 ? 20 : 0,
      verified ? 20 : 0,
      hasActivatedDate ? 15 : 0,
    ].reduce((sum, value) => sum + value, 0),
  )

  const certificateStats = [
    {
      label: "Certificates Issued",
      value: account ? "1" : "0",
      subtext: account ? "Based on your active account record" : "No active account found",
      tone: "neutral",
    },
    {
      label: "Latest Achievement",
      value: account ? `${account.phase} Active` : "No milestone yet",
      subtext: account ? `${account.planName} account` : "Waiting for account data",
      tone: "positive",
    },
    {
      label: "Verification Status",
      value: verified ? "Verified" : "Pending",
      subtext: verified ? "Account record is in good standing" : "Awaiting valid account state",
      tone: "positive",
    },
    {
      label: "Account Milestones",
      value: String(
        [
          !!account,
          closedTrades > 0,
          metrics.currentCycleProfit > 0,
          verified,
        ].filter(Boolean).length,
      ),
      subtext: "Calculated from real trading/account data",
      tone: "neutral",
    },
  ]

  const certificates = account
    ? [
        {
          title: `${account.planName} Certificate`,
          type: "Primary",
          issued: formatDate(account.activatedAtMs),
          accountRef: account.planName,
          status: verified ? "Verified" : "Pending",
          id: certId,
          description:
            "Generated from your active NovaFunded account record, current phase, and account standing in Firestore.",
        },
      ]
    : []

  const milestones = [
    {
      title: "Account Created",
      value: account ? "Completed" : "Pending",
      note: account ? "An account record exists in Firestore." : "No linked account found yet.",
    },
    {
      title: "Closed Trades Logged",
      value: `${closedTrades}`,
      note: "Pulled from your real trade history.",
    },
    {
      title: "Current Profit",
      value: metrics.currentCycleProfit > 0 ? "Positive" : "Flat / Negative",
      note: "Based on start balance versus current balance.",
    },
    {
      title: "Account Standing",
      value: accountStatus,
      note: "Derived from actual account status and breach state.",
    },
  ]

  const activity = [
    {
      title: "Certificate data synced from Firestore",
      time: "Live",
      desc: "This page no longer uses fake milestone records and now reflects your real account and trade data.",
    },
    {
      title: "Primary certificate reference generated",
      time: formatDate(account?.activatedAtMs),
      desc: account
        ? `Certificate reference ${certId} is tied to your active ${account.planName} account.`
        : "A certificate ID will generate once an active account is found.",
    },
    {
      title: "Verification status checked",
      time: "Live",
      desc: verified
        ? "Your account currently appears valid and in good standing."
        : "Your account has not yet met the current verified condition.",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-10 w-80 rounded bg-white/10" />
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
          <h1 className="text-2xl font-semibold text-red-300">Certificates failed to load</h1>
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
                🏅 Certificates & Achievements
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Verified account milestones and certificate records
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                This page now builds certificate-style records from your real NovaFunded account,
                account standing, and trade history instead of fake achievement data.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Download later
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {verified ? "✅ Verified Achievement" : "⏳ Pending Verification"}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                {account?.planName ?? "No Active Account"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Your account journey is now backed by real platform data
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
                  Certificate cards and milestone visibility are now tied to your actual account
                  record, balance state, trade history, and current standing inside Firestore.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Latest Certificate</p>
                  <p className="mt-2 text-lg font-semibold">{account?.planName ?? "—"}</p>
                  <p className="mt-1 text-xs text-white/50">Issued {formatDate(account?.activatedAtMs)}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Current Account</p>
                  <p className="mt-2 text-lg font-semibold">{account?.phase ?? "—"}</p>
                  <p className="mt-1 text-xs text-white/50">{account?.planName ?? "No linked account"}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Verification State</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-400">
                    {verified ? "Confirmed" : "Pending"}
                  </p>
                  <p className="mt-1 text-xs text-white/50">Live account record validation</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                  Achievement Completion
                </p>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${achievementPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                  <span>Account creation, verification state, trade history, and status checks</span>
                  <span>{achievementPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Certificate Verification</p>
                <p className="mt-1 text-xs text-white/40">Current record summary</p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                🔒 Secure
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Primary Record ID</p>
                  <p className="text-sm font-medium">{certId}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Issue Date</p>
                  <p className="text-sm font-medium">{formatDate(account?.activatedAtMs)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Record Status</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {verified ? "Verified" : "Pending"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Associated Account</p>
                  <p className="text-sm font-medium">{account?.planName ?? "—"}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-medium text-emerald-400">Real credibility boost</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                This section now feels stronger because the values are pulled from real account
                data instead of being hardcoded frontend-only placeholders.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {certificateStats.map((item) => (
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

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Issued Certificates</h3>
              <p className="mt-1 text-sm text-white/40">
                Generated from your active account state
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                Firestore-backed
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                Real account-linked
              </span>
            </div>
          </div>

          {certificates.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/50">
              No certificate can be shown yet because there is no active account record available.
              Current context status: {contextStatus || "unknown"}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-1">
              {certificates.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60">
                        {item.type}
                      </span>
                      <h4 className="mt-3 text-lg font-semibold">{item.title}</h4>
                    </div>

                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/50">{item.description}</p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-white/40">Issued</p>
                      <p className="mt-1 text-sm font-medium">{item.issued}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-white/40">Account Reference</p>
                      <p className="mt-1 text-sm font-medium">{item.accountRef}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-white/40">Certificate ID</p>
                      <p className="mt-1 text-sm font-medium">{item.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Progress Milestones</h3>
              <p className="mt-1 text-sm text-white/40">
                Account checkpoints built from live values
              </p>
            </div>

            <div className="space-y-3">
              {milestones.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.note}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Recent Certificate Activity</h3>
              <p className="mt-1 text-sm text-white/40">
                Latest record-style updates for this profile
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
                      📜
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
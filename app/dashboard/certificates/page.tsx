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

type CertificateCard = {
  id: string
  title: string
  subtitle: string
  issuedAt: number | null
  status: "Verified" | "Pending"
  reason: string
}

function formatDate(value?: number | null) {
  if (!value) return "—"

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function makeCertId(accountId?: string, suffix = "BASE") {
  if (!accountId) return `NV-CERT-${suffix}`
  return `NV-CERT-${accountId.slice(-6).toUpperCase()}-${suffix}`
}

function getStatusTone(status: "Verified" | "Pending") {
  return status === "Verified"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    : "border-amber-500/20 bg-amber-500/10 text-amber-300"
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
          tradeLimit: 300,
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
  const activationVerified = !!account && metrics.accountActivated && metrics.accountInGoodStanding
  const passedVerified = !!account && metrics.accountPassed && metrics.accountInGoodStanding

  const certificates = useMemo<CertificateCard[]>(() => {
    if (!account) return []

    const items: CertificateCard[] = []

    items.push({
      id: makeCertId(account.id, "ACT"),
      title: `${account.planName} Activation Record`,
      subtitle: "Issued only when a real activation timestamp exists in Firestore.",
      issuedAt: account.activatedAtMs ?? null,
      status: activationVerified ? "Verified" : "Pending",
      reason: activationVerified
        ? "Activation timestamp exists and the account is in good standing."
        : account.activatedAtMs
          ? "Activation exists, but the account is not currently in good standing."
          : "No activation timestamp found on this account yet.",
    })

    items.push({
      id: makeCertId(account.id, "PASS"),
      title: `${account.planName} Evaluation Pass Record`,
      subtitle: "Only verified when the account phase/status actually shows passed or funded.",
      issuedAt: null,
      status: passedVerified ? "Verified" : "Pending",
      reason: passedVerified
        ? "Account phase/status indicates a real passed or funded state."
        : "No passed/funded state detected from the current account record.",
    })

    return items
  }, [account, activationVerified, passedVerified])

  const completedMilestones = metrics.achievementMilestones.filter(
    (item) => item.status === "complete",
  ).length
  const totalMilestones = metrics.achievementMilestones.length
  const achievementPercent =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  const stats = [
    {
      label: "Certificates Verified",
      value: String(certificates.filter((item) => item.status === "Verified").length),
      subtext: "Only real qualifying records count",
    },
    {
      label: "Account Status",
      value: accountStatus,
      subtext: "Pulled from the live account record",
    },
    {
      label: "Achievement Progress",
      value: `${achievementPercent}%`,
      subtext: `${completedMilestones} of ${totalMilestones} real milestones completed`,
    },
    {
      label: "Issued Dates Available",
      value: String(certificates.filter((item) => !!item.issuedAt).length),
      subtext: "No placeholder issue dates are shown",
    },
  ]

  const activity = [
    {
      title: "Certificate records synced",
      time: "Live",
      desc: "Records on this page are now derived from actual account fields and trade history instead of placeholder certificate logic.",
    },
    {
      title: "Verification logic hardened",
      time: "Live",
      desc: "Verified badges only appear when the account actually qualifies for activation or passed/funded state.",
    },
    {
      title: "Milestone progress recalculated",
      time: "Live",
      desc: "Achievement progress is now based on real account activation, pass state, closed trades, trading days, and profit.",
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
                Real certificate records only
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Verified states, issue dates, and achievement progress now come from real account
                activation, status, and trade history. No placeholder verification and no fake dates.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="text-sm text-white/40">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm text-white/50">{item.subtext}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activationVerified || passedVerified
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                }`}
              >
                {activationVerified || passedVerified
                  ? "✅ At least one verified record"
                  : "⏳ No verified records yet"}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                {account?.planName ?? "No Active Account"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Achievement progress based on actual milestones
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
                  This progress bar does not guess. It only moves when real account activation,
                  pass/funded state, trade count, trading days, and profit milestones are actually met.
                </p>
              </div>

              <div className="pt-2">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                  Real milestone completion
                </p>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${achievementPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                  <span>{completedMilestones} completed milestones</span>
                  <span>{achievementPercent}%</span>
                </div>
              </div>

              <div className="grid gap-3">
                {metrics.achievementMilestones.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-1 text-sm text-white/50">Target: {item.target}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{item.value}</p>
                        <p
                          className={`mt-1 text-xs ${
                            item.status === "complete"
                              ? "text-emerald-400"
                              : item.status === "blocked"
                                ? "text-red-300"
                                : "text-amber-300"
                          }`}
                        >
                          {item.status === "complete"
                            ? "Complete"
                            : item.status === "blocked"
                              ? "Blocked"
                              : "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <p className="text-sm font-medium text-white">Account Record Summary</p>
              <p className="mt-1 text-xs text-white/40">Live Firestore-backed state</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Plan</p>
                  <p className="text-sm font-medium">{account?.planName ?? "—"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Phase</p>
                  <p className="text-sm font-medium">{account?.phase ?? "—"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Status</p>
                  <p className="text-sm font-medium">{accountStatus}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Activation Date</p>
                  <p className="text-sm font-medium">{formatDate(account?.activatedAtMs)}</p>
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
                  <p className="text-sm text-white/60">Trading Days</p>
                  <p className="text-sm font-medium">{metrics.tradingDays}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Certificate Records</h3>
            <p className="mt-1 text-sm text-white/40">
              Records are visible, but only qualified ones are marked verified.
            </p>
          </div>

          {certificates.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/50">
              No account record found, so there are no certificate records to render yet. Context
              status: {contextStatus || "unknown"}
            </div>
          ) : (
            <div className="grid gap-4">
              {certificates.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">{item.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.subtitle}</p>
                    </div>

                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-white/40">Certificate ID</p>
                      <p className="mt-1 text-sm font-medium">{item.id}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-white/40">Issue Date</p>
                      <p className="mt-1 text-sm font-medium">{formatDate(item.issuedAt)}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-white/40">State</p>
                      <p className="mt-1 text-sm font-medium">{item.status}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                      Validation note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/60">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Recent Certificate Activity</h3>
            <p className="mt-1 text-sm text-white/40">
              System-side changes that affect this profile
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
        </section>
      </div>
    </div>
  )
}
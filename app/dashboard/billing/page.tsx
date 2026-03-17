"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { db } from "@/lib/firebase"
import {
  loadTradingContext,
  type AccountData,
  type TradeRecord,
  type UserProfile,
} from "@/lib/tradingAccount"

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value?: number | null) {
  if (!value) return "—"

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function addThirtyDays(timestampMs?: number | null) {
  if (!timestampMs) return null
  return timestampMs + 30 * 24 * 60 * 60 * 1000
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [contextStatus, setContextStatus] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [account, setAccount] = useState<AccountData | null>(null)
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [accountCount, setAccountCount] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserProfile(null)
        setAccount(null)
        setTrades([])
        setAccountCount(0)
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
        setUserProfile(context.userProfile)
        setAccount(context.account)
        setTrades(context.trades)

        const accountsSnap = await getDocs(
          query(collection(db, "accounts"), where("userId", "==", user.uid)),
        )

        setAccountCount(accountsSnap.size)
      } catch (err) {
        console.error("Failed to load billing page:", err)
        setError("Failed to load billing data.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const activeAccounts = accountCount
  const monthlyTotal = activeAccounts * 11
  const totalClosedTrades = trades.filter((trade) => trade.status === "closed").length
  const lastActivatedAtMs =
    account?.activatedAtMs ??
    userProfile?.lastChallengeActivatedAtMs ??
    null

  const nextRenewal = addThirtyDays(lastActivatedAtMs)
  const hasAccount = !!account

  const billingStats = useMemo(
    () => [
      {
        label: "Per Account Price",
        value: "$11.00",
        subtext: "Base monthly platform fee per account",
        tone: "positive",
      },
      {
        label: "Active Accounts",
        value: String(activeAccounts),
        subtext: activeAccounts === 1 ? "1 account currently linked" : `${activeAccounts} accounts currently linked`,
        tone: "neutral",
      },
      {
        label: "Monthly Total",
        value: formatMoney(monthlyTotal),
        subtext: "$11 × account count",
        tone: "positive",
      },
      {
        label: "Billing Status",
        value: hasAccount ? "Active" : "No Active Account",
        subtext: hasAccount ? "Ready for future live Stripe sync" : "Create or activate an account first",
        tone: hasAccount ? "positive" : "neutral",
      },
    ],
    [activeAccounts, monthlyTotal, hasAccount],
  )

  const currentPlan = [
    {
      title: "Selected Account",
      value: account?.planName ?? "—",
    },
    {
      title: "Phase",
      value: account?.phase ?? "—",
    },
    {
      title: "Account Status",
      value: account?.status ?? "—",
    },
    {
      title: "Billing Cycle",
      value: "Monthly",
    },
  ]

  const invoiceRows = [
    {
      id: account?.id ? `INV-${account.id.slice(-6).toUpperCase()}` : "INV-PREVIEW",
      date: nextRenewal ? formatDate(nextRenewal) : "—",
      description: activeAccounts > 0 ? `NovaFunded account billing (${activeAccounts} account${activeAccounts === 1 ? "" : "s"})` : "No active account billing yet",
      amount: formatMoney(monthlyTotal),
      status: hasAccount ? "Projected" : "Pending",
    },
  ]

  const recentActivity = [
    {
      title: "Billing model synced to account count",
      time: "Live",
      desc: "This page now calculates monthly billing from your real Firestore account count at $11 per account.",
    },
    {
      title: "Selected account linked",
      time: formatDate(lastActivatedAtMs),
      desc: hasAccount
        ? `Your current dashboard is linked to ${account?.planName ?? "your active account"}.`
        : "No active account is currently attached to this profile.",
    },
    {
      title: "Next billing placeholder ready",
      time: nextRenewal ? formatDate(nextRenewal) : "—",
      desc: "Once you connect full Stripe subscription logic later, this section can swap from projected values to real invoices automatically.",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-10 w-80 rounded bg-white/10" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="h-4 w-24 rounded bg-white/10" />
                  <div className="mt-3 h-8 w-28 rounded bg-white/10" />
                  <div className="mt-3 h-4 w-36 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <h1 className="text-2xl font-semibold text-red-300">Billing failed to load</h1>
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
                💳 Billing & Plans
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Manage account billing and platform charges
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Billing is now synced to your real Firestore account count. NovaFunded currently charges
                $11 per account, with totals updating from your linked account records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Stripe sync later
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
                <h3 className="text-xl font-semibold">Current Billing Overview</h3>
                <p className="mt-1 text-sm text-white/40">
                  Based on your actual account records
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {hasAccount ? "✅ Active" : "⏳ Pending"}
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm text-emerald-400">NovaFunded Account Billing</p>
                  <h2 className="mt-2 text-2xl font-semibold">{formatMoney(monthlyTotal)}/month</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                    Billing is calculated at $11 per account. As you add more funded or evaluation
                    accounts later, this total can scale automatically from Firestore.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/70">
                  Next bill: {nextRenewal ? formatDate(nextRenewal) : "—"}
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
              <h3 className="text-xl font-semibold">Billing Summary</h3>
              <p className="mt-1 text-sm text-white/40">
                Simple live numbers instead of fake subscription data
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Signed-in Email</p>
                  <p className="text-sm font-medium">{userProfile?.email || auth.currentUser?.email || "—"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Active Account ID</p>
                  <p className="text-sm font-medium">{userProfile?.activeAccountId || "—"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Closed Trades</p>
                  <p className="text-sm font-medium">{totalClosedTrades}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Plan Price Model</p>
                  <p className="text-sm font-medium">$11 / account</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Invoice Preview</h3>
              <p className="mt-1 text-sm text-white/40">
                Placeholder until full Stripe invoice syncing is added
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                Real account-linked totals
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                Stripe-ready later
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
                {invoiceRows.map((item) => (
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
                Kept clean for now until full payments are wired in
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Add more accounts to increase platform billing total",
                "Wire real Stripe subscription renewal later",
                "Attach invoice download logic later",
                "Add plan tiers when more account packages launch",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm text-white/70">{item}</p>
                  <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Recent Billing Activity</h3>
              <p className="mt-1 text-sm text-white/40">
                Synced account-side updates
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
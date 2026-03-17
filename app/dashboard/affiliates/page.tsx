"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  loadTradingContext,
  type AccountData,
  type UserProfile,
} from "@/lib/tradingAccount"

export default function AffiliatesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [contextStatus, setContextStatus] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [account, setAccount] = useState<AccountData | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserProfile(null)
        setAccount(null)
        setContextStatus("signed_out")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      try {
        const context = await loadTradingContext(user.uid, {
          includeTrades: false,
        })

        setContextStatus(context.status)
        setUserProfile(context.userProfile)
        setAccount(context.account)
      } catch (err) {
        console.error("Failed to load affiliates page:", err)
        setError("Failed to load affiliate data.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const reservedCode = useMemo(() => {
    const raw =
      userProfile?.displayName ||
      userProfile?.email ||
      auth.currentUser?.email ||
      "novafunded-user"

    return (
      raw
        .toLowerCase()
        .replace(/@.*$/, "")
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 20) || "novafunded-user"
    )
  }, [userProfile])

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
          <h1 className="text-2xl font-semibold text-red-300">Affiliates failed to load</h1>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
        </section>
      </div>
    )
  }

  const summaryCards = [
    {
      label: "Affiliate Program",
      value: "Coming Soon",
      subtext: "No fake clicks, conversions, or commissions shown",
    },
    {
      label: "Profile Email",
      value: userProfile?.email || auth.currentUser?.email || "—",
      subtext: "Current signed-in profile",
    },
    {
      label: "Linked Account",
      value: account?.planName || "No active account",
      subtext: "Live account context",
    },
    {
      label: "Context Status",
      value: contextStatus || "unknown",
      subtext: "Current dashboard load state",
    },
  ]

  const launchChecklist = [
    "Create affiliate profile collection",
    "Generate real referral codes",
    "Track clicks and signups",
    "Attach checkout conversions to referrers",
    "Store commission ledger entries",
    "Build affiliate payout request flow",
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-400">
                NovaFunded Affiliate Center
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Affiliates coming soon
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-white/60">
                This page is intentionally honest for launch. There is no fake affiliate revenue,
                fake conversion data, or fake leaderboard. Real affiliate tracking can be added later
                on top of this clean shell.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Program not live yet
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="text-sm text-white/40">{item.label}</p>
              <p className="mt-2 break-words text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm text-white/50">{item.subtext}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Reserved referral identity</h3>
              <p className="mt-1 text-sm text-white/40">
                This is only a reserved profile-based code preview, not a live tracking link.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Reserved code</p>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                {reservedCode}
              </div>
              <p className="mt-3 text-xs text-white/40">
                A real affiliate system should create a Firestore-backed referral code and connect it
                to click, signup, purchase, and payout records.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Tracking</p>
                <p className="mt-2 text-2xl font-semibold text-white">Inactive</p>
                <p className="mt-2 text-xs text-white/40">No live event tracking yet</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Commission Ledger</p>
                <p className="mt-2 text-2xl font-semibold text-white">Unavailable</p>
                <p className="mt-2 text-xs text-white/40">No fake balances shown</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Withdrawals</p>
                <p className="mt-2 text-2xl font-semibold text-white">Locked</p>
                <p className="mt-2 text-xs text-white/40">Requires real payout workflow</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Launch checklist</h3>
              <p className="mt-1 text-sm text-white/40">
                What needs to exist before this page becomes a real affiliate dashboard
              </p>
            </div>

            <div className="space-y-3">
              {launchChecklist.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-medium text-emerald-400">Launch-safe state</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                This page is now intentionally clean and non-deceptive. It will not mislead users
                with fake affiliate metrics before the backend exists.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
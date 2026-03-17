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

  const referralSlug = useMemo(() => {
    const raw =
      userProfile?.displayName ||
      userProfile?.email ||
      auth.currentUser?.email ||
      "novafunded-user"

    return raw
      .toLowerCase()
      .replace(/@.*$/, "")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "novafunded-user"
  }, [userProfile])

  const referralLink = `https://novafunded.space/signup?ref=${referralSlug}`

  const linkedItems = [
    {
      label: "Affiliate Status",
      value: "Coming Soon",
      subtext: "Affiliate tracking is not wired yet",
    },
    {
      label: "Linked Profile",
      value: userProfile?.email || auth.currentUser?.email || "—",
      subtext: "Current signed-in profile",
    },
    {
      label: "Selected Account",
      value: account?.planName || "No active account",
      subtext: "Pulled from your live account context",
    },
    {
      label: "Context Status",
      value: contextStatus || "unknown",
      subtext: "Current dashboard load state",
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
          <h1 className="text-2xl font-semibold text-red-300">Affiliates failed to load</h1>
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
              <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-400">
                NovaFunded Affiliate Center
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Affiliate Dashboard
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-white/60">
                The affiliate system is being set up properly. This page now shows real account-linked
                context instead of fake clicks, conversions, and commission numbers.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white">
                Coming Soon
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {linkedItems.map((item) => (
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

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Referral Link Preview</h3>
              <p className="mt-1 text-sm text-white/40">
                Placeholder link format ready for real tracking later
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Future Primary Referral Link</p>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 break-all">
                {referralLink}
              </div>
              <p className="mt-3 text-xs text-white/40">
                This is a clean placeholder built from your real signed-in profile. Real attribution,
                clicks, conversions, and payouts can be wired in later.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Tracking</p>
                <p className="mt-2 text-2xl font-semibold text-white">Pending</p>
                <p className="mt-2 text-xs text-white/40">No real affiliate events stored yet</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Commission</p>
                <p className="mt-2 text-2xl font-semibold text-white">$0.00</p>
                <p className="mt-2 text-xs text-white/40">Will stay honest until wired in</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Withdrawals</p>
                <p className="mt-2 text-2xl font-semibold text-white">Locked</p>
                <p className="mt-2 text-xs text-white/40">Requires real affiliate payout logic</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Launch Checklist</h3>
              <p className="mt-1 text-sm text-white/40">
                Best next steps for a real affiliate rollout
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Create affiliate profile + referral code collection",
                "Track clicks and signups from referral links",
                "Store conversions from checkout",
                "Calculate commission by plan purchase",
                "Add payout request / approval flow",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-medium text-emerald-400">Good call</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Leaving this page honest and premium-looking is better than showing fake affiliate
                revenue and fake leaderboard numbers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
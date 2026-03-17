"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  getAccountDisplayStatus,
  loadTradingContext,
  type AccountData,
  type UserProfile,
} from "@/lib/tradingAccount"

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

export default function SettingsPage() {
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
        console.error("Failed to load settings page:", err)
        setError("Failed to load settings data.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const profileItems = useMemo(
    () => [
      { label: "Full Name", value: userProfile?.displayName || auth.currentUser?.displayName || "Not set" },
      { label: "Email Address", value: userProfile?.email || auth.currentUser?.email || "—" },
      { label: "Role", value: userProfile?.role || "user" },
      { label: "Time Zone", value: Intl.DateTimeFormat().resolvedOptions().timeZone || "—" },
    ],
    [userProfile],
  )

  const preferences = [
    { title: "Email Notifications", status: "Coming Soon" },
    { title: "Tournament Alerts", status: "Coming Soon" },
    { title: "Payout Updates", status: "Coming Soon" },
    { title: "Dark Mode Theme", status: "Active" },
  ]

  const security = [
    { title: "Firebase Auth", status: auth.currentUser ? "Signed in" : "Signed out" },
    { title: "Two-Step Verification", status: "Not wired yet" },
    { title: "Login Session", status: auth.currentUser ? "Active session detected" : "No session" },
    { title: "Profile Updated", status: formatDateTime(userProfile?.lastChallengeActivatedAtMs) },
  ]

  const linkedAccess = [
    { title: "Active Account ID", status: userProfile?.activeAccountId || "None" },
    { title: "Selected Plan", status: account?.planName || "None" },
    { title: "Account Status", status: getAccountDisplayStatus(account) },
    { title: "Account Phase", status: account?.phase || "—" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-10 w-72 rounded bg-white/10" />
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="h-64 rounded-2xl bg-white/5" />
              <div className="h-64 rounded-2xl bg-white/5" />
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
          <h1 className="text-2xl font-semibold text-red-300">Settings failed to load</h1>
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
                ⚙️ Account Settings
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Manage profile details and account-linked settings
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                This page now reflects your real Firebase profile and selected trading account instead
                of fake hardcoded settings data.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Editing later
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Profile Information</h3>
            <p className="mt-1 text-sm text-white/40">
              Live user identity and account details
            </p>

            <div className="mt-5 space-y-3">
              {profileItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm text-white/60">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Preferences</h3>
            <p className="mt-1 text-sm text-white/40">
              UI preferences and future notification switches
            </p>

            <div className="mt-5 space-y-3">
              {preferences.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Security</h3>
            <p className="mt-1 text-sm text-white/40">
              Current auth and account session visibility
            </p>

            <div className="mt-5 space-y-3">
              {security.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-white/40">{item.status}</p>
                  </div>
                  <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white">
                    View
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Linked Access</h3>
            <p className="mt-1 text-sm text-white/40">
              Connected account and dashboard state
            </p>

            <div className="mt-5 space-y-3">
              {linkedAccess.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-xl font-semibold">Quick Account Actions</h3>
          <p className="mt-1 text-sm text-white/40">
            Clean placeholders until editing controls are wired in
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Update profile later",
              "Add password flow later",
              "Add real alerts later",
              `Context status: ${contextStatus || "unknown"}`,
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-sm font-medium text-white"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
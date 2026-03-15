"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/firebase"

const challengeRules = [
  { icon: "📈", label: "Profit Target", value: "8%" },
  { icon: "🛡️", label: "Daily Loss Limit", value: "5%" },
  { icon: "⚠️", label: "Max Drawdown", value: "10%" },
  { icon: "⏱️", label: "Minimum Trading Days", value: "3" },
]

const includedFeatures = [
  "8% profit target",
  "5% daily loss limit",
  "10% max drawdown",
  "3 minimum trading days",
  "Real-time challenge tracking",
  "Instant dashboard access after payment",
]

const checkoutHighlights = [
  {
    title: "Premium dashboard included",
    desc: "Get access to analytics, payouts, certificates, tournaments, and rewards-style tracking.",
  },
  {
    title: "Simple evaluation structure",
    desc: "A clean entry offer that keeps the trader journey clear from purchase to dashboard access.",
  },
  {
    title: "Launch-ready experience",
    desc: "Designed to feel like a polished funded platform instead of a basic checkout page.",
  },
]

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!nextUser) {
        router.replace("/login")
        return
      }

      setUser(nextUser)
      setCheckingAuth(false)
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const checkoutState = searchParams.get("checkout")

    if (checkoutState === "cancelled") {
      setError("Checkout was cancelled. You can try again when you're ready.")
    }
  }, [searchParams])

  async function handleCheckout() {
    if (!user) {
      setError("You must be logged in before starting checkout.")
      return
    }

    if (!user.email) {
      setError("Your account is missing an email address.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      })

      const data = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to create Stripe checkout session.")
      }

      window.location.href = data.url
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout."
      setError(message)
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70 backdrop-blur-sm">
            Loading checkout...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-[30%] h-[320px] w-[320px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative">
        <header className="border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1520px] items-center justify-between px-4 py-4 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-semibold text-black">
                N
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">NovaFunded</p>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Secure Checkout
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 sm:inline-flex"
              >
                Back Home
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Account
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 py-10 md:px-6 md:py-14">
          <div className="mx-auto grid w-full max-w-[1520px] gap-6 xl:grid-cols-[1fr_0.92fr]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
                <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-400">
                  Final Step Before Dashboard Access
                </div>

                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  Complete your NovaFunded purchase
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
                  You’re one step away from starting your challenge and unlocking the full
                  NovaFunded platform experience with dashboard access, tracking systems, and
                  premium trader-style account flow.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {checkoutHighlights.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <p className="text-base font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/55">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-400/80">
                      Challenge Summary
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                      NovaFunded $5K Challenge
                    </h2>
                  </div>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    Entry Model
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-sm text-white/50">Challenge Type</span>
                    <span className="text-sm font-semibold text-white">$5,000 Evaluation</span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {challengeRules.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white/60">
                          <span>{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-emerald-400">✓</span>
                      <p className="text-sm leading-6 text-white/60">
                        After successful payment, the flow continues into your NovaFunded
                        dashboard where the trader can view account stats and open the trade terminal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm font-medium text-emerald-400">Purchase notice</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  By completing this purchase, you confirm that you understand the challenge rules,
                  platform conditions, and the evaluation-style nature of the NovaFunded experience.
                </p>
              </div>
            </section>

            <section>
              <div className="sticky top-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-400">Challenge Checkout</p>
                      <h3 className="mt-2 text-3xl font-semibold text-white">NovaFunded 5K</h3>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-5xl font-semibold text-white">
                        $11
                        <span className="ml-2 text-lg font-normal text-white/40">one-time</span>
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/70">
                    Simple entry pricing designed to move traders cleanly into the NovaFunded
                    platform.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {includedFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <span className="text-emerald-400">✓</span>
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="my-6 h-px bg-white/10" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <span className="text-sm text-white/60">Subtotal</span>
                    <span className="text-sm font-semibold text-white">$11.00</span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <span className="text-sm text-white/60">Processing</span>
                    <span className="text-sm font-semibold text-white">$0.00</span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                    <span className="text-sm font-medium text-white">Total Due Today</span>
                    <span className="text-lg font-semibold text-white">$11.00</span>
                  </div>
                </div>

                {user?.email ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/65">
                    Signed in as <span className="font-medium text-white">{user.email}</span>
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-3">
                  <button
                    onClick={handleCheckout}
                    disabled={loading || !user}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-base font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Redirecting to Stripe..." : "Start Challenge Now"}
                  </button>

                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Need another account?
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-white/40">Checkout Status</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-400">Secure Session</p>
                    <p className="mt-1 text-xs text-white/45">Protected platform flow</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-white/40">Access Delivery</p>
                    <p className="mt-2 text-sm font-semibold text-white">After payment</p>
                    <p className="mt-1 text-xs text-white/45">Redirect into dashboard</p>
                  </div>
                </div>

                <p className="mt-6 text-center text-xs text-white/35">
                  Secure payment • instant access • premium trader experience
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] text-white">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70 backdrop-blur-sm">
              Loading checkout...
            </div>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
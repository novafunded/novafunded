"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function confirmSession() {
      const sessionId = searchParams.get("session_id")

      if (!sessionId) {
        if (!isMounted) return
        setStatus("error")
        setError("Missing Stripe session ID.")
        return
      }

      try {
        const res = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
          }),
        })

        const data = (await res.json()) as {
          success?: boolean
          error?: string
        }

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to activate your challenge.")
        }

        if (!isMounted) return

        setStatus("success")

        setTimeout(() => {
          router.replace("/dashboard?checkout=success")
        }, 1200)
      } catch (err: unknown) {
        if (!isMounted) return

        const message =
          err instanceof Error
            ? err.message
            : "Failed to activate your challenge."

        setError(message)
        setStatus("error")
      }
    }

    void confirmSession()

    return () => {
      isMounted = false
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#060913] px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <div className="text-sm uppercase tracking-[0.2em] text-emerald-400">
          NovaFunded
        </div>

        {status === "loading" ? (
          <>
            <h1 className="mt-3 text-3xl font-semibold">Confirming payment...</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              We’re verifying your Stripe session and activating your challenge
              account now.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
              Please wait a moment. Do not close this page.
            </div>
          </>
        ) : null}

        {status === "success" ? (
          <>
            <h1 className="mt-3 text-3xl font-semibold text-emerald-400">
              Challenge activated
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Your payment was confirmed and your NovaFunded account is now being
              loaded.
            </p>
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Redirecting you to the dashboard...
            </div>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <h1 className="mt-3 text-3xl font-semibold text-red-300">
              Activation issue
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Your payment may have completed, but we could not finish activating
              the challenge automatically.
            </p>
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:opacity-90"
              >
                Go to dashboard
              </Link>
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Back to checkout
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
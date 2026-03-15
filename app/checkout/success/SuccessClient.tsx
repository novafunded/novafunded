"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

type ConfirmResponse = {
  success?: boolean
  accountId?: string
  error?: string
}

type Status = "loading" | "success" | "error"

export default function SuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sessionId = useMemo(() => {
    return searchParams.get("session_id")?.trim() ?? ""
  }, [searchParams])

  const [status, setStatus] = useState<Status>("loading")
  const [message, setMessage] = useState(
    "We’re activating your NovaFunded challenge now."
  )

  useEffect(() => {
    let isMounted = true

    async function confirmPayment() {
      if (!sessionId) {
        if (!isMounted) return
        setStatus("error")
        setMessage("Missing Stripe session ID. Please contact support if you were charged.")
        return
      }

      try {
        const response = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        })

        const data = (await response.json()) as ConfirmResponse

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to activate your challenge.")
        }

        if (!isMounted) return

        setStatus("success")
        setMessage("Payment confirmed. Redirecting you to your dashboard...")

        window.setTimeout(() => {
          router.replace("/dashboard")
        }, 1400)
      } catch (error) {
        if (!isMounted) return

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Something went wrong while activating your challenge."

        setStatus("error")
        setMessage(errorMessage)
      }
    }

    void confirmPayment()

    return () => {
      isMounted = false
    }
  }, [router, sessionId])

  return (
    <div className="min-h-screen bg-[#060913] px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <div className="text-sm uppercase tracking-[0.2em] text-emerald-400">
          NovaFunded
        </div>

        <h1 className="mt-3 text-3xl font-semibold">
          {status === "loading" && "Finalizing your purchase..."}
          {status === "success" && "Challenge activated"}
          {status === "error" && "We hit a problem"}
        </h1>

        <p className="mt-3 text-white/70">{message}</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          {status === "loading" && (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
              <span className="text-sm text-white/80">
                Verifying Stripe payment and setting up your account...
              </span>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                Your Flash 5K challenge is ready. Sending you to the dashboard now.
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                We couldn’t finish activating your challenge automatically.
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400"
                >
                  Try again
                </button>

                <Link
                  href="/dashboard"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
                >
                  Go to dashboard
                </Link>

                <Link
                  href="/checkout"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
                >
                  Back to checkout
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 text-sm text-white/50">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
            Plan: Flash 5K
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
            Status: {status === "success" ? "Active" : status === "error" ? "Needs attention" : "Processing"}
          </div>
        </div>
      </div>
    </div>
  )
}
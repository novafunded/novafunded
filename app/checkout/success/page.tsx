import { Suspense } from "react"
import SuccessClient from "./SuccessClient"

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060913] px-4 py-10 text-white">
          <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
            <div className="text-sm uppercase tracking-[0.2em] text-emerald-400">
              NovaFunded
            </div>
            <h1 className="mt-3 text-3xl font-semibold">Loading success page...</h1>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
              Please wait a moment.
            </div>
          </div>
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  )
}
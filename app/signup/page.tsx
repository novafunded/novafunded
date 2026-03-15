"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { createUserAccount } from "@/lib/createUserAccount"

function getAuthErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    const code = (error as { code: string }).code

    switch (code) {
      case "auth/email-already-in-use":
        return "That email is already in use. Try logging in instead."
      case "auth/invalid-email":
        return "Please enter a valid email address."
      case "auth/weak-password":
        return "Password should be at least 6 characters."
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again."
      default:
        return "Failed to create your account."
    }
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message
  }

  return "Failed to create your account."
}

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      )

      const safeName = fullName.trim()

      if (safeName) {
        await updateProfile(credential.user, {
          displayName: safeName,
        })
      }

      await createUserAccount({
        uid: credential.user.uid,
        email: credential.user.email ?? email.trim(),
        displayName: safeName,
      })

      router.push("/checkout")
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060913] px-4 py-10 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
        <div className="mb-6">
          <div className="text-sm uppercase tracking-[0.2em] text-emerald-400">
            NovaFunded
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Create account</h1>
          <p className="mt-2 text-sm text-white/50">
            Create your trader account to continue to challenge checkout.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-500/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-500/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-500/40"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-white/45">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

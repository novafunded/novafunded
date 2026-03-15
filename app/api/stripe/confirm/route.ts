import { NextResponse } from "next/server"
import Stripe from "stripe"
import { FieldValue } from "firebase-admin/firestore"
import { getStripe } from "@/lib/stripe"
import { adminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

type ConfirmRequestBody = {
  sessionId?: string
}

type ChallengePreset = {
  planName: string
  startBalance: number
  dailyLossLimit: number
  maxLossLimit: number
}

const DEFAULT_CHALLENGE: ChallengePreset = {
  planName: "Flash 5K",
  startBalance: 5000,
  dailyLossLimit: 250,
  maxLossLimit: 500,
}

function buildChallengePreset(
  challengeKey: string | null | undefined,
): ChallengePreset {
  if (challengeKey === "flash_5k") {
    return DEFAULT_CHALLENGE
  }

  return DEFAULT_CHALLENGE
}

async function activatePaidChallenge(params: {
  uid: string
  email: string
  challengeKey?: string | null
}) {
  const { uid, email, challengeKey } = params
  const preset = buildChallengePreset(challengeKey)

  const userRef = adminDb.collection("users").doc(uid)
  const userSnap = await userRef.get()

  const normalizedEmail = email.trim().toLowerCase()

  if (!userSnap.exists) {
    await userRef.set({
      uid,
      email: normalizedEmail,
      role: "user",
      activeAccountId: "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  } else {
    const userData = userSnap.data() as {
      email?: string
      activeAccountId?: string
    }

    const userUpdates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (
      typeof userData.email !== "string" ||
      userData.email.trim().toLowerCase() !== normalizedEmail
    ) {
      userUpdates.email = normalizedEmail
    }

    await userRef.update(userUpdates)
  }

  const refreshedUserSnap = await userRef.get()
  const refreshedUserData = refreshedUserSnap.data() as
    | {
        activeAccountId?: string
      }
    | undefined

  const existingActiveAccountId =
    typeof refreshedUserData?.activeAccountId === "string"
      ? refreshedUserData.activeAccountId.trim()
      : ""

  if (existingActiveAccountId) {
    const existingAccountRef = adminDb
      .collection("accounts")
      .doc(existingActiveAccountId)
    const existingAccountSnap = await existingAccountRef.get()

    if (existingAccountSnap.exists) {
      return existingActiveAccountId
    }
  }

  const newAccountRef = adminDb.collection("accounts").doc()

  await newAccountRef.set({
    userId: uid,
    planName: preset.planName,
    startBalance: preset.startBalance,
    balance: preset.startBalance,
    equity: preset.startBalance,
    dailyLossLimit: preset.dailyLossLimit,
    maxLossLimit: preset.maxLossLimit,
    breached: false,
    phase: "Phase 1",
    status: "active",
    tradingDays: 0,
    closedTrades: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  await userRef.update({
    activeAccountId: newAccountRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return newAccountRef.id
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ConfirmRequestBody
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : ""

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId." },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const paid =
      session.payment_status === "paid" || session.status === "complete"

    const userId =
      typeof session.metadata?.userId === "string"
        ? session.metadata.userId.trim()
        : ""

    const emailFromMetadata =
      typeof session.metadata?.email === "string"
        ? session.metadata.email.trim()
        : ""

    const email =
      session.customer_details?.email?.trim() ||
      session.customer_email?.trim() ||
      emailFromMetadata

    const challengeKey =
      typeof session.metadata?.challenge === "string"
        ? session.metadata.challenge
        : "flash_5k"

    if (!paid) {
      return NextResponse.json(
        { error: "Stripe session is not paid yet." },
        { status: 400 }
      )
    }

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing Stripe session metadata for activation." },
        { status: 400 }
      )
    }

    const accountId = await activatePaidChallenge({
      uid: userId,
      email,
      challengeKey,
    })

    return NextResponse.json({
      success: true,
      accountId,
    })
  } catch (error: unknown) {
    console.error("Stripe session confirmation failed:", error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: error.message || "Stripe confirmation failed.",
        },
        { status: 500 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message || "Failed to confirm Stripe session.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to confirm Stripe session.",
      },
      { status: 500 }
    )
  }
}

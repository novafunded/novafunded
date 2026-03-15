import Stripe from "stripe"
import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getStripe } from "@/lib/stripe"
import { adminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

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
  const refreshedUserData = refreshedUserSnap.data() as {
    activeAccountId?: string
  } | null

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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 },
    )
  }

  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    )
  }

  const rawBody = await req.text()
  const stripe = getStripe()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Webhook signature verification failed."

    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const paid =
        session.payment_status === "paid" ||
        session.status === "complete"

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

      if (paid && userId && email) {
        await activatePaidChallenge({
          uid: userId,
          email,
          challengeKey,
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed."

    console.error("Stripe webhook processing failed:", error)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getStripe } from "@/lib/stripe"

type CheckoutRequestBody = {
  userId?: string
  email?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequestBody

    const userId =
      typeof body.userId === "string" ? body.userId.trim() : ""
    const email =
      typeof body.email === "string" ? body.email.trim() : ""

    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: "Missing email." }, { status: 400 })
    }

    const priceId = process.env.STRIPE_PRICE_ID_FLASH_5K
    if (!priceId || priceId.trim() === "") {
      return NextResponse.json(
        { error: "Missing STRIPE_PRICE_ID_FLASH_5K in .env.local." },
        { status: 500 }
      )
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      req.headers.get("origin") ||
      "http://localhost:3000"

    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        userId,
        email,
        challenge: "flash_5k",
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?checkout=cancelled`,
    })

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe session was created without a redirect URL." },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error("Stripe checkout session creation failed:", error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: error.message || "Stripe checkout failed.",
          type: error.type,
          code: "code" in error ? error.code ?? null : null,
        },
        { status: 500 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message || "Failed to create checkout session.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create checkout session.",
      },
      { status: 500 }
    )
  }
}

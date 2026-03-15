import Link from "next/link"

const stats = [
  { label: "Challenge Size", value: "$5K Evaluation" },
  { label: "One-Time Entry", value: "$11" },
  { label: "Platform Access", value: "Instant After Payment" },
]

const trustPoints = [
  "Clean signup → checkout → dashboard flow",
  "Separate dashboard and trade terminal experience",
  "Simple challenge structure with clear rules",
  "Built to feel like a premium prop firm platform",
]

const challengeRules = [
  { label: "Profit Target", value: "8%" },
  { label: "Daily Loss Limit", value: "5%" },
  { label: "Max Drawdown", value: "10%" },
  { label: "Minimum Trading Days", value: "3" },
]

const steps = [
  {
    step: "01",
    title: "Create your account",
    text: "Sign up in minutes and get into the NovaFunded member flow.",
  },
  {
    step: "02",
    title: "Buy your challenge",
    text: "Complete checkout securely and activate your evaluation account.",
  },
  {
    step: "03",
    title: "Access dashboard and trade",
    text: "Track your account in the dashboard, then open the terminal only when you’re ready to execute.",
  },
]

const faqs = [
  {
    question: "How fast do I get access?",
    answer: "Immediately after payment, the flow sends you into your NovaFunded dashboard.",
  },
  {
    question: "Do I go straight into the trading terminal?",
    answer: "No. You enter the regular dashboard first, then open the terminal when you want to trade.",
  },
  {
    question: "What challenge am I buying?",
    answer: "The current entry offer is the NovaFunded $5K Evaluation challenge.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-140px] top-[20%] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-180px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative">
        <header className="border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1520px] items-center justify-between px-4 py-4 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-lg font-bold text-[#04111f]">
                N
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">NovaFunded</p>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Prop Trading
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-[#04111f] transition hover:bg-cyan-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="px-4 py-14 md:px-6 md:py-20">
            <div className="mx-auto grid w-full max-w-[1520px] gap-10 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
              <div>
                <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-300">
                  Built for serious challenge traders
                </div>

                <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  Start your NovaFunded challenge and trade through a cleaner prop firm platform.
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
                  Buy the NovaFunded $5K Evaluation, get instant dashboard access after payment,
                  and use a separate trade terminal built for a more premium prop firm experience.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/checkout"
                    className="rounded-2xl bg-cyan-400 px-5 py-3.5 text-sm font-semibold text-[#04111f] transition hover:bg-cyan-300"
                  >
                    Start $5K Challenge
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Create Account
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/45">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Instant access after payment
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Dashboard first, terminal second
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    One-time $11 entry
                  </span>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {stats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
                <div className="rounded-3xl border border-cyan-400/15 bg-gradient-to-b from-cyan-400/10 to-transparent p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                        Entry Offer
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold text-white">
                        NovaFunded $5K Evaluation
                      </h2>
                      <p className="mt-2 text-sm text-white/55">
                        Simple entry pricing with immediate platform access after successful checkout.
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-5xl font-semibold text-white">
                        $11
                      </p>
                      <p className="mt-1 text-sm text-white/40">one-time payment</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {trustPoints.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                      >
                        <span className="text-cyan-300">✓</span>
                        <span className="text-sm text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-xs uppercase tracking-[0.18em] text-white/35">
                      Challenge Rules
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {challengeRules.map((rule) => (
                        <div
                          key={rule.label}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          <span className="text-sm text-white/60">{rule.label}</span>
                          <span className="text-sm font-semibold text-emerald-400">
                            {rule.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/checkout"
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
                    >
                      Buy Challenge Now
                    </Link>

                    <Link
                      href="/login"
                      className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Already Have an Account?
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-white/10 px-4 py-14 md:px-6">
            <div className="mx-auto w-full max-w-[1520px]">
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">How it works</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Simple trader journey
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {steps.map((item) => (
                  <div
                    key={item.step}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                  >
                    <div className="text-sm font-semibold text-cyan-300">{item.step}</div>
                    <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/55">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-white/10 px-4 py-14 md:px-6">
            <div className="mx-auto grid w-full max-w-[1520px] gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                  Why traders like it
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Built to feel more premium from the start.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                  The goal is simple: remove friction, make the offer easier to understand,
                  and guide the trader through the exact order they expect — landing page,
                  signup, checkout, dashboard, then terminal.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">Regular dashboard first</p>
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      Traders land in the dashboard overview before opening the execution terminal.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">Cleaner conversion flow</p>
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      Less confusion, stronger CTA placement, and clearer offer framing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">FAQ</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Quick answers before checkout
                </h2>

                <div className="mt-6 space-y-4">
                  {faqs.map((item) => (
                    <div
                      key={item.question}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <p className="text-sm font-semibold text-white">{item.question}</p>
                      <p className="mt-2 text-sm leading-6 text-white/55">{item.answer}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Link
                    href="/checkout"
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3.5 text-sm font-semibold text-[#04111f] transition hover:bg-cyan-300"
                  >
                    Continue to Checkout
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

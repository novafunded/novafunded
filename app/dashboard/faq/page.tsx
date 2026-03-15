export default function FAQPage() {
  const faqs = [
    {
      question: "How do NovaFunded evaluations work?",
      answer:
        "Evaluations are structured trading challenges where traders aim to hit profit objectives while staying within daily loss, max drawdown, and consistency rules.",
    },
    {
      question: "When can I request a payout?",
      answer:
        "Payout windows typically open after the required cycle is completed, all positions are closed, and the account remains in good standing under current rules.",
    },
    {
      question: "Are tournaments separate from funded accounts?",
      answer:
        "Yes. Tournaments are competition-based events with their own ranking metrics, prize structures, and participation rules, separate from regular funded performance tracking.",
    },
    {
      question: "How are certificates and achievements used?",
      answer:
        "Certificates provide visible proof of progress across evaluations, verification phases, funded activation, and milestone tracking inside your dashboard profile.",
    },
    {
      question: "What happens if I breach a rule?",
      answer:
        "A rule breach may remove eligibility for payouts, leaderboard ranking, or continued account progression depending on the section and account type involved.",
    },
    {
      question: "Can I change my billing or plan later?",
      answer:
        "Yes. Billing sections are designed to support upgrades, payment method updates, invoice records, and future plan changes from one place.",
    },
  ]

  const categories = [
    "Evaluations",
    "Funded Accounts",
    "Payouts",
    "Billing",
    "Tournaments",
    "Community",
  ]

  const supportOptions = [
    {
      title: "Help Center",
      desc: "Browse official platform guidance and policy explanations.",
    },
    {
      title: "Discord Support",
      desc: "Join the community and ask questions in the support channels.",
    },
    {
      title: "Account Help",
      desc: "Use dashboard support routes for account and profile concerns.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                ❓ Help & FAQ
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Answers to the most common NovaFunded questions
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                A clean FAQ page helps the platform feel fully launched by giving users a proper
                support area with categories, policy-style answers, and help routes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
                Contact Support
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                View Rules
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Browse by Category</h3>
            <p className="mt-1 text-sm text-white/40">
              Structured like a real prop-firm help center
            </p>

            <div className="mt-5 space-y-3">
              {categories.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm font-medium">{item}</p>
                  <span className="text-xs text-white/40">Open</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-medium text-emerald-400">Support response target</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Most account and platform questions are answered through help documentation before
                direct support is needed.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
            <p className="mt-1 text-sm text-white/40">
              Minimal, believable copy for a launched support section
            </p>

            <div className="mt-5 space-y-3">
              {faqs.map((item) => (
                <div
                  key={item.question}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <p className="text-sm font-medium">{item.question}</p>
                  <p className="mt-3 text-sm leading-6 text-white/50">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {supportOptions.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <p className="text-lg font-semibold">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-white/50">{item.desc}</p>
              <button className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Open
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
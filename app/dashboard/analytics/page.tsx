import ProgressBar from "@/components/dashboard/ProgressBar"
import SectionCard from "@/components/dashboard/SectionCard"

const statCards = [
  {
    icon: "📊",
    label: "Net PnL",
    value: "+$2,430",
    subtext: "Last 30 trading days",
    tone: "positive",
  },
  {
    icon: "🎯",
    label: "Win Rate",
    value: "63.8%",
    subtext: "Based on 94 total trades",
    tone: "default",
  },
  {
    icon: "⚠️",
    label: "Avg Risk Per Trade",
    value: "0.42%",
    subtext: "Kept within firm-friendly sizing",
    tone: "default",
  },
  {
    icon: "🏦",
    label: "Best Trading Day",
    value: "+$684",
    subtext: "New York session breakout",
    tone: "positive",
  },
]

const performanceRows = [
  { label: "Gross Profit", value: "$4,960", tone: "positive" },
  { label: "Gross Loss", value: "-$2,530", tone: "negative" },
  { label: "Profit Factor", value: "1.96", tone: "default" },
  { label: "Average Winner", value: "$132", tone: "positive" },
  { label: "Average Loser", value: "-$78", tone: "negative" },
  { label: "Expectancy", value: "+$25.85", tone: "positive" },
  { label: "Largest Win", value: "$684", tone: "positive" },
  { label: "Largest Loss", value: "-$245", tone: "negative" },
]

const sessionStats = [
  {
    session: "Asia",
    trades: 14,
    winRate: "57%",
    pnl: "+$310",
    focus: 48,
  },
  {
    session: "London",
    trades: 36,
    winRate: "66%",
    pnl: "+$1,280",
    focus: 76,
  },
  {
    session: "New York",
    trades: 44,
    winRate: "64%",
    pnl: "+$840",
    focus: 69,
  },
]

const pairBreakdown = [
  {
    pair: "XAUUSD",
    trades: 28,
    winRate: "68%",
    pnl: "+$1,120",
    note: "Strongest pair with trend continuation setups",
  },
  {
    pair: "NAS100",
    trades: 22,
    winRate: "64%",
    pnl: "+$710",
    note: "Best during New York volatility windows",
  },
  {
    pair: "EURUSD",
    trades: 19,
    winRate: "58%",
    pnl: "+$290",
    note: "More stable but lower expansion follow-through",
  },
  {
    pair: "BTCUSD",
    trades: 13,
    winRate: "54%",
    pnl: "-$85",
    note: "Needs tighter selectivity around sweep entries",
  },
]

const disciplineMetrics = [
  {
    title: "Daily Loss Control",
    value: "91%",
    helper: "Stayed under daily loss threshold on most sessions",
    progress: 91,
    color: "emerald" as const,
  },
  {
    title: "Rule Compliance",
    value: "96%",
    helper: "No major challenge violations in the last 30 days",
    progress: 96,
    color: "emerald" as const,
  },
  {
    title: "Consistency Score",
    value: "78%",
    helper: "Some variance in sizing after winning streaks",
    progress: 78,
    color: "emerald" as const,
  },
  {
    title: "Drawdown Efficiency",
    value: "61%",
    helper: "Recoveries are strong, but losses can cluster too fast",
    progress: 61,
    color: "red" as const,
  },
]

const weeklyBars = [
  { label: "Week 1", value: 38 },
  { label: "Week 2", value: 64 },
  { label: "Week 3", value: 51 },
  { label: "Week 4", value: 82 },
  { label: "Week 5", value: 57 },
  { label: "Week 6", value: 73 },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 bg-[#0A0A0A] text-white">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="relative p-5 md:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400">
                Trader Analytics
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Performance analytics
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
                Review trading performance, session behavior, instrument strength, and
                discipline metrics in a cleaner Topstep-style analytics workspace built for
                challenge tracking and funded-account decision making.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400">
                Export Report
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Filter Range
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const valueClass =
            card.tone === "positive" ? "text-emerald-400" : "text-white"

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:border-white/15"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                    {card.label}
                  </p>
                  <p className={`mt-3 text-2xl font-semibold ${valueClass}`}>{card.value}</p>
                  <p className="mt-2 text-sm text-white/50">{card.subtext}</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg">
                  {card.icon}
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="30-Day Performance Trend"
          subtitle="Visual momentum snapshot across recent trading weeks"
        >
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex h-[280px] items-end gap-3">
              {weeklyBars.map((bar) => (
                <div key={bar.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-full w-full items-end">
                    <div
                      className="w-full rounded-t-2xl border border-emerald-500/20 bg-gradient-to-t from-emerald-500/80 to-emerald-400/30"
                      style={{ height: `${bar.value}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/40">{bar.label}</p>
                    <p className="mt-1 text-xs font-medium text-white/70">{bar.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Discipline Overview"
          subtitle="Rule-aware performance behavior"
        >
          <div className="space-y-4">
            {disciplineMetrics.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/70">{item.title}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
                  </div>
                </div>

                <ProgressBar
                  value={item.progress}
                  max={100}
                  label={item.title}
                  helper={item.helper}
                  color={item.color}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Performance Breakdown"
          subtitle="Core trader metrics"
          className="lg:col-span-2"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {performanceRows.map((row) => {
              const valueClass =
                row.tone === "positive"
                  ? "text-emerald-400"
                  : row.tone === "negative"
                    ? "text-red-400"
                    : "text-white"

              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition duration-300 hover:border-white/15"
                >
                  <span className="text-sm text-white/60">{row.label}</span>
                  <span className={`text-sm font-semibold ${valueClass}`}>{row.value}</span>
                </div>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Trading Profile"
          subtitle="Behavior summary"
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Preferred Style</p>
              <p className="mt-1 text-lg font-semibold text-white">Intraday momentum</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Average Hold Time</p>
              <p className="mt-1 text-lg font-semibold text-white">22m 18s</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Most Active Session</p>
              <p className="mt-1 text-lg font-semibold text-white">New York Open</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Risk Character</p>
              <p className="mt-1 text-lg font-semibold text-white">Controlled with mild overtrade spikes</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Session Analytics"
          subtitle="Where your best trading comes from"
        >
          <div className="space-y-4">
            {sessionStats.map((session) => (
              <div
                key={session.session}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-300 hover:border-white/15"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-white/60">{session.session} Session</p>
                    <p className="mt-1 text-xl font-semibold text-white">{session.pnl}</p>
                    <p className="mt-2 text-xs text-white/40">
                      {session.trades} trades • {session.winRate} win rate
                    </p>
                  </div>

                  <div className="min-w-[170px]">
                    <ProgressBar
                      value={session.focus}
                      max={100}
                      label="Execution Quality"
                      helper="Cleaner decision making in this session"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Instrument Breakdown"
          subtitle="Markets you perform best on"
        >
          <div className="space-y-4">
            {pairBreakdown.map((item) => {
              const pnlClass = item.pnl.startsWith("-") ? "text-red-400" : "text-emerald-400"

              return (
                <div
                  key={item.pair}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-300 hover:border-white/15"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-white">{item.pair}</p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-white/50">
                          {item.trades} trades
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-white/50">{item.note}</p>
                    </div>

                    <div className="sm:text-right">
                      <p className={`text-lg font-semibold ${pnlClass}`}>{item.pnl}</p>
                      <p className="mt-1 text-xs text-white/40">{item.winRate} win rate</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </section>
    </div>
  )
}
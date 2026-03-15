type Trade = {
  pair?: string
  symbol?: string
  side?: string
  result?: string
  setup?: string
  pnl?: string
  status?: string
  time?: string
}

type TradeTableProps = {
  title?: string
  subtitle?: string
  trades: Trade[]
}

export default function TradeTable({
  title = "Recent Trades",
  subtitle = "Latest simulated execution activity",
  trades,
}: TradeTableProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(16,185,129,0.05)]">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -left-16 top-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        </div>

        <div className="inline-flex w-fit rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/45">
          {trades.length} Rows
        </div>
      </div>

      <div className="relative z-10 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div className="hidden grid-cols-[1fr_0.8fr_1.5fr_0.8fr_0.9fr_0.7fr] gap-3 border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-white/35 md:grid">
          <span>Pair</span>
          <span>Side</span>
          <span>Setup</span>
          <span>Time</span>
          <span>Status</span>
          <span className="text-right">PnL</span>
        </div>

        <div className="divide-y divide-white/10">
          {trades.length === 0 ? (
            <div className="px-4 py-6 text-sm text-white/50">No trades yet.</div>
          ) : (
            trades.map((trade, index) => {
              const pair = trade.pair ?? trade.symbol ?? "—"
              const side = trade.side ?? "—"
              const setup = trade.result ?? trade.setup ?? "No details"
              const status = trade.status ?? "—"
              const time = trade.time ?? "—"
              const pnl = trade.pnl ?? "—"

              const normalizedSide = side.toLowerCase()
              const normalizedStatus = status.toLowerCase()

              const sideClass =
                normalizedSide === "buy"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : normalizedSide === "sell"
                    ? "border-red-400/20 bg-red-400/10 text-red-400"
                    : "border-white/10 bg-white/5 text-white/60"

              const statusClass =
                normalizedStatus === "win" || normalizedStatus === "paid" || normalizedStatus === "active"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : normalizedStatus === "loss" || normalizedStatus === "failed" || normalizedStatus === "inactive"
                    ? "border-red-400/20 bg-red-400/10 text-red-400"
                    : "border-white/10 bg-white/5 text-white/60"

              const pnlClass =
                typeof pnl === "string" && pnl.trim().startsWith("-")
                  ? "text-red-400"
                  : typeof pnl === "string" && pnl !== "—"
                    ? "text-emerald-400"
                    : "text-white/60"

              return (
                <div
                  key={`${pair}-${time}-${index}`}
                  className="transition duration-200 hover:bg-white/[0.03]"
                >
                  <div className="hidden items-center gap-3 px-4 py-4 md:grid md:grid-cols-[1fr_0.8fr_1.5fr_0.8fr_0.9fr_0.7fr]">
                    <div>
                      <p className="font-semibold text-white">{pair}</p>
                      <p className="mt-1 text-xs text-white/35">Simulated account</p>
                    </div>

                    <div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${sideClass}`}>
                        {side}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-white/70">{setup}</p>
                    </div>

                    <div>
                      <p className="text-sm text-white/55">{time}</p>
                    </div>

                    <div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass}`}>
                        {status}
                      </span>
                    </div>

                    <div className={`text-right text-sm font-semibold ${pnlClass}`}>
                      {pnl}
                    </div>
                  </div>

                  <div className="space-y-3 px-4 py-4 md:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{pair}</p>
                        <p className="mt-1 text-xs text-white/35">{time}</p>
                      </div>

                      <p className={`text-sm font-semibold ${pnlClass}`}>{pnl}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${sideClass}`}>
                        {side}
                      </span>

                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass}`}>
                        {status}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-white/60">{setup}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
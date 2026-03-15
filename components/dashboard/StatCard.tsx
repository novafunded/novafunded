type StatCardProps = {
  icon: string
  label: string
  value: string
  subtext?: string
  trend?: string
  trendPositive?: boolean
}

export default function StatCard({
  icon,
  label,
  value,
  subtext,
  trend,
  trendPositive = true,
}: StatCardProps) {
  const trendClass = trendPositive
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    : "border-red-400/20 bg-red-400/10 text-red-400"

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_0_35px_rgba(16,185,129,0.06)]">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg transition group-hover:border-emerald-500/20 group-hover:bg-emerald-500/5">
            {icon}
          </div>

          {trend ? (
            <div className={`rounded-full border px-2.5 py-1 text-xs font-medium ${trendClass}`}>
              {trend}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            {label}
          </p>

          <p className="text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>

          {subtext ? (
            <p className="text-xs leading-relaxed text-white/45">
              {subtext}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
type LeaderboardEntry = {
  rank: number
  name: string
  value: string
  badge?: string
}

type LeaderboardCardProps = {
  title?: string
  subtitle?: string
  entries: LeaderboardEntry[]
}

export default function LeaderboardCard({
  title = "Top Traders",
  subtitle = "Leaderboard performance",
  entries,
}: LeaderboardCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(16,185,129,0.05)]">
      
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -right-16 top-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mb-5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/45">{subtitle}</p>
      </div>

      <div className="relative z-10 space-y-3">
        {entries.map((entry) => {
          const medal =
            entry.rank === 1
              ? "🥇"
              : entry.rank === 2
              ? "🥈"
              : entry.rank === 3
              ? "🥉"
              : `#${entry.rank}`

          return (
            <div
              key={entry.rank}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition duration-200 hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-white/70 w-6">
                  {medal}
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {entry.name}
                  </p>

                  {entry.badge && (
                    <p className="text-xs text-white/40">
                      {entry.badge}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-sm font-semibold text-emerald-400">
                {entry.value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
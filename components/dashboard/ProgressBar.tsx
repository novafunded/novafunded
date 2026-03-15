type ProgressBarProps = {
  value: number
  max?: number
  label?: string
  helper?: string
  color?: "emerald" | "red" | "white"
  showValue?: boolean
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  helper,
  color = "emerald",
  showValue = true,
}: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100))

  const barClass =
    color === "emerald"
      ? "bg-emerald-500"
      : color === "red"
      ? "bg-red-400"
      : "bg-white"

  const pillClass =
    color === "emerald"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : color === "red"
      ? "text-red-400 bg-red-400/10 border-red-400/20"
      : "text-white bg-white/10 border-white/10"

  const glowClass =
    color === "emerald"
      ? "shadow-[0_0_20px_rgba(16,185,129,0.18)]"
      : color === "red"
      ? "shadow-[0_0_20px_rgba(248,113,113,0.16)]"
      : ""

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {label ? (
            <p className="text-sm font-medium text-white">{label}</p>
          ) : null}

          {helper ? (
            <p className="mt-1 text-xs leading-relaxed text-white/40">
              {helper}
            </p>
          ) : null}
        </div>

        {showValue ? (
          <div
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${pillClass}`}
          >
            {percentage.toFixed(0)}%
          </div>
        ) : null}
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${barClass} ${glowClass} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
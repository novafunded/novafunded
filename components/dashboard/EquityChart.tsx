type EquityChartProps = {
  title?: string
  data?: number[]
  labels?: string[]
}

export default function EquityChart({
  title = "Equity Curve",
  data = [25000, 25120, 24980, 25240, 25420, 25310, 25680, 25810, 26040, 25920, 26210, 26480],
  labels = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12"],
}: EquityChartProps) {
  const width = 1000
  const height = 320
  const padding = 30

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const growth = data[data.length - 1] - data[0]
  const growthPercent = ((growth / data[0]) * 100).toFixed(2)

  const getX = (index: number) =>
    padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2)

  const getY = (value: number) =>
    height - padding - ((value - min) / range) * (height - padding * 2)

  const linePoints = data
    .map((value, index) => `${getX(index)},${getY(value)}`)
    .join(" ")

  const areaPoints = `${padding},${height - padding} ${linePoints} ${width - padding},${height - padding}`

  const yGuides = [0, 1, 2, 3, 4]
  const currentValue = data[data.length - 1]
  const currentX = getX(data.length - 1)
  const currentY = getY(currentValue)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(16,185,129,0.05)]">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -left-16 top-0 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            Performance
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm text-white/45">
            Simulated account progression over the last {labels.length} trading sessions
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/55">
            Start ${data[0].toLocaleString()}
          </div>

          <div
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              growth >= 0
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-red-400/20 bg-red-400/10 text-red-400"
            }`}
          >
            {growth >= 0 ? "+" : "-"}${Math.abs(growth).toLocaleString()} ({growth >= 0 ? "+" : ""}
            {growthPercent}%)
          </div>
        </div>
      </div>

      <div className="relative z-10 rounded-2xl border border-white/10 bg-black/20 p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[280px] w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(16,185,129,0.30)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0.02)" />
            </linearGradient>

            <linearGradient id="equityStroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {yGuides.map((line) => {
            const y = padding + (line * (height - padding * 2)) / 4

            return (
              <line
                key={line}
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            )
          })}

          {data.map((_, index) => (
            <line
              key={index}
              x1={getX(index)}
              x2={getX(index)}
              y1={padding}
              y2={height - padding}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          <polyline
            points={areaPoints}
            fill="url(#equityFill)"
            stroke="none"
          />

          <polyline
            points={linePoints}
            fill="none"
            stroke="url(#equityStroke)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((value, index) => {
            const isLast = index === data.length - 1

            return (
              <circle
                key={index}
                cx={getX(index)}
                cy={getY(value)}
                r={isLast ? "6" : "4.5"}
                fill="#10B981"
                stroke="#0A0A0A"
                strokeWidth="2"
              />
            )
          })}

          <circle
            cx={currentX}
            cy={currentY}
            r="12"
            fill="rgba(16,185,129,0.12)"
          />

          <line
            x1={currentX}
            x2={currentX}
            y1={currentY}
            y2={height - padding}
            stroke="rgba(16,185,129,0.25)"
            strokeDasharray="5 5"
          />
        </svg>

        <div className="mt-5 grid grid-cols-6 gap-y-2 text-center text-xs text-white/35 md:grid-cols-12">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            Current Equity
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            ${currentValue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            Lowest Point
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            ${min.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            Highest Point
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            ${max.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
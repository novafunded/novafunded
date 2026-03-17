"use client"

type OrderSide = "buy" | "sell"
type OrderType = "market" | "limit"

type ChartTradeOverlayProps = {
  enabled: boolean
  symbol: string
  side: OrderSide
  orderType: OrderType
  livePrice: number
  entry: number
  stopLoss: number | null
  takeProfit: number | null
  chartLow: number
  chartHigh: number
  size: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getLineY(price: number, low: number, high: number) {
  const range = high - low || 1
  const raw = ((high - price) / range) * 100
  return clamp(raw, 8, 92)
}

export default function ChartTradeOverlay({
  enabled,
  livePrice,
  entry,
  stopLoss,
  takeProfit,
  chartLow,
  chartHigh,
}: ChartTradeOverlayProps) {
  if (!enabled) return null

  const entryY = getLineY(entry, chartLow, chartHigh)
  const liveY = getLineY(livePrice, chartLow, chartHigh)
  const stopY = stopLoss !== null ? getLineY(stopLoss, chartLow, chartHigh) : null
  const takeY = takeProfit !== null ? getLineY(takeProfit, chartLow, chartHigh) : null

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {takeY !== null ? (
        <div
          className="absolute left-0 right-0"
          style={{
            top: `${Math.min(entryY, takeY)}%`,
            height: `${Math.max(Math.abs(takeY - entryY), 0.7)}%`,
            background:
              "linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.02) 100%)",
          }}
        />
      ) : null}

      {stopY !== null ? (
        <div
          className="absolute left-0 right-0"
          style={{
            top: `${Math.min(entryY, stopY)}%`,
            height: `${Math.max(Math.abs(stopY - entryY), 0.7)}%`,
            background:
              "linear-gradient(180deg, rgba(239,68,68,0.05) 0%, rgba(239,68,68,0.02) 100%)",
          }}
        />
      ) : null}

      <div
        className="absolute left-0 right-0 border-t border-dashed border-cyan-300/70"
        style={{ top: `${entryY}%` }}
      />

      <div
        className="absolute left-0 right-0 border-t border-white/15"
        style={{ top: `${liveY}%` }}
      />

      {stopY !== null ? (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-red-300/70"
          style={{ top: `${stopY}%` }}
        />
      ) : null}

      {takeY !== null ? (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-emerald-300/70"
          style={{ top: `${takeY}%` }}
        />
      ) : null}

      <div className="absolute inset-y-0 right-[8.4rem] w-px bg-white/[0.045]" />
    </div>
  )
}
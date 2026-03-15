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

function getChartRange(values: number[], symbol: string) {
  const min = Math.min(...values)
  const max = Math.max(...values)

  const basePadding =
    symbol === "EURUSD" || symbol === "GBPUSD"
      ? 0.004
      : symbol === "XAUUSD"
        ? 8
        : symbol === "NAS100"
          ? 80
          : 1200

  const padding = Math.max((max - min) * 0.35, basePadding)

  return {
    low: min - padding,
    high: max + padding,
  }
}

export default function ChartTradeOverlay({
  enabled,
  symbol,
  livePrice,
  entry,
  stopLoss,
  takeProfit,
}: ChartTradeOverlayProps) {
  if (!enabled) return null

  const values = [livePrice, entry]
  if (stopLoss !== null) values.push(stopLoss)
  if (takeProfit !== null) values.push(takeProfit)

  const { low, high } = getChartRange(values, symbol)

  const entryY = getLineY(entry, low, high)
  const stopY = stopLoss !== null ? getLineY(stopLoss, low, high) : null
  const takeY = takeProfit !== null ? getLineY(takeProfit, low, high) : null

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {takeY !== null ? (
        <div
          className="absolute left-0 right-0 bg-emerald-500/10"
          style={{
            top: `${Math.min(entryY, takeY)}%`,
            height: `${Math.max(Math.abs(takeY - entryY), 0.8)}%`,
          }}
        />
      ) : null}

      {stopY !== null ? (
        <div
          className="absolute left-0 right-0 bg-red-500/10"
          style={{
            top: `${Math.min(entryY, stopY)}%`,
            height: `${Math.max(Math.abs(stopY - entryY), 0.8)}%`,
          }}
        />
      ) : null}

      <div
        className="absolute left-0 right-0 border-t border-dashed border-cyan-400/70"
        style={{ top: `${entryY}%` }}
      />

      {stopY !== null ? (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-red-400/70"
          style={{ top: `${stopY}%` }}
        />
      ) : null}

      {takeY !== null ? (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-emerald-400/70"
          style={{ top: `${takeY}%` }}
        />
      ) : null}
    </div>
  )
}
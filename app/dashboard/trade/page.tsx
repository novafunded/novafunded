"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import TradingViewChart from "@/components/dashboard/TradingViewChart"

type OrderSide = "buy" | "sell"

const SYMBOLS = {
  BTCUSD: { label: "Bitcoin", startPrice: 68169, minMove: 18 },
  XAUUSD: { label: "Gold", startPrice: 2165.4, minMove: 0.35 },
  NAS100: { label: "Nasdaq 100", startPrice: 18125, minMove: 6 },
  EURUSD: { label: "Euro / US Dollar", startPrice: 1.0842, minMove: 0.00035 },
  GBPUSD: { label: "British Pound / US Dollar", startPrice: 1.2718, minMove: 0.0004 },
} as const

type SymbolKey = keyof typeof SYMBOLS

type OpenPosition = {
  id: string
  symbol: SymbolKey
  side: OrderSide
  size: number
  entryPrice: number
  openedAtMs: number
}

type ClosedPosition = {
  id: string
  symbol: SymbolKey
  side: OrderSide
  size: number
  entryPrice: number
  closePrice: number
  pnl: number
  openedAtMs: number
  closedAtMs: number
}

function formatPrice(value: number, symbol: SymbolKey) {
  if (symbol === "EURUSD" || symbol === "GBPUSD") return value.toFixed(4)
  if (symbol === "XAUUSD") return value.toFixed(1)
  if (symbol === "NAS100") return value.toFixed(1)
  return value.toFixed(0)
}

function formatMoney(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getPriceStep(symbol: SymbolKey) {
  if (symbol === "EURUSD" || symbol === "GBPUSD") return 0.0001
  if (symbol === "XAUUSD") return 0.1
  if (symbol === "NAS100") return 0.1
  return 1
}

function roundPriceForSymbol(value: number, symbol: SymbolKey) {
  const step = getPriceStep(symbol)
  return Math.round(value / step) * step
}

function calculatePnl(position: OpenPosition, livePrice: number) {
  const delta =
    position.side === "buy"
      ? livePrice - position.entryPrice
      : position.entryPrice - livePrice

  return delta * position.size
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "positive" | "negative"
}) {
  const styles =
    tone === "positive"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
      : tone === "negative"
        ? "border-red-400/20 bg-red-500/10 text-red-300"
        : "border-[#25344a] bg-[#0e1724] text-white/70"

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${styles}`}
    >
      {children}
    </span>
  )
}

function SymbolButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-xs font-semibold tracking-[0.08em] transition ${
        active
          ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
          : "border-[#233248] bg-[#0a1320] text-white/70 hover:border-[#31445e] hover:bg-[#0e1828] hover:text-white"
      }`}
    >
      {label}
    </button>
  )
}

function TerminalStat({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "positive" | "negative" | "accent"
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-red-300"
        : tone === "accent"
          ? "text-cyan-300"
          : "text-white"

  return (
    <div className="rounded-md border border-[#182435] bg-[#0a121d] px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#6d8199]">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${valueClass}`}>{value}</div>
    </div>
  )
}

function TicketField({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "positive" | "negative" | "accent"
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-red-300"
        : tone === "accent"
          ? "text-cyan-300"
          : "text-white"

  return (
    <div className="rounded-md border border-[#182435] bg-[#0a121d] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#6d8199]">{label}</p>
      <p className={`mt-2 font-mono text-base font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70839a]">
      {children}
    </th>
  )
}

function TableCell({
  children,
  tone = "default",
}: {
  children: ReactNode
  tone?: "default" | "positive" | "negative" | "muted"
}) {
  const textClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-red-300"
        : tone === "muted"
          ? "text-white/45"
          : "text-white/85"

  return <td className={`px-3 py-3 text-sm ${textClass}`}>{children}</td>
}

export default function TradePage() {
  const [symbol, setSymbol] = useState<SymbolKey>("BTCUSD")
  const [size, setSize] = useState(5)
  const [livePrices, setLivePrices] = useState<Record<SymbolKey, number>>({
    BTCUSD: SYMBOLS.BTCUSD.startPrice,
    XAUUSD: SYMBOLS.XAUUSD.startPrice,
    NAS100: SYMBOLS.NAS100.startPrice,
    EURUSD: SYMBOLS.EURUSD.startPrice,
    GBPUSD: SYMBOLS.GBPUSD.startPrice,
  })
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([])
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLivePrices((prev) => {
        const next = { ...prev }

        ;(Object.keys(SYMBOLS) as SymbolKey[]).forEach((key) => {
          const current = prev[key]
          const { minMove } = SYMBOLS[key]
          const drift = (Math.random() - 0.5) * minMove * 2.2
          const nudged = current + drift
          next[key] = roundPriceForSymbol(Math.max(0.0001, nudged), key)
        })

        return next
      })
    }, 1200)

    return () => window.clearInterval(interval)
  }, [])

  const meta = SYMBOLS[symbol]
  const livePrice = livePrices[symbol]

  const currentSymbolPositions = useMemo(
    () => openPositions.filter((position) => position.symbol === symbol),
    [openPositions, symbol],
  )

  const openCount = openPositions.length
  const closedCount = closedPositions.length

  const openPnlTotal = useMemo(() => {
    return openPositions.reduce((sum, position) => {
      const mark = livePrices[position.symbol]
      return sum + calculatePnl(position, mark)
    }, 0)
  }, [openPositions, livePrices])

  const chartLow = useMemo(() => {
    const prices = [livePrice, ...currentSymbolPositions.map((position) => position.entryPrice)]
    return Math.min(...prices) * 0.96
  }, [livePrice, currentSymbolPositions])

  const chartHigh = useMemo(() => {
    const prices = [livePrice, ...currentSymbolPositions.map((position) => position.entryPrice)]
    return Math.max(...prices) * 1.04
  }, [livePrice, currentSymbolPositions])

  const notionalValue = livePrice * size

  function getLineY(price: number) {
    const range = chartHigh - chartLow || 1
    const raw = ((chartHigh - price) / range) * 100
    return clamp(raw, 7, 93)
  }

  function placeMarketOrder(side: OrderSide) {
    const entryPrice = livePrices[symbol]
    const newPosition: OpenPosition = {
      id: `POS-${Date.now()}`,
      symbol,
      side,
      size,
      entryPrice,
      openedAtMs: Date.now(),
    }

    setOpenPositions((prev) => [newPosition, ...prev])
  }

  function closePosition(positionId: string) {
    setOpenPositions((prev) => {
      const target = prev.find((position) => position.id === positionId)
      if (!target) return prev

      const closePrice = livePrices[target.symbol]
      const pnl = calculatePnl(target, closePrice)

      const closedTrade: ClosedPosition = {
        id: `TRD-${Date.now()}`,
        symbol: target.symbol,
        side: target.side,
        size: target.size,
        entryPrice: target.entryPrice,
        closePrice,
        pnl,
        openedAtMs: target.openedAtMs,
        closedAtMs: Date.now(),
      }

      setClosedPositions((current) => [closedTrade, ...current])
      return prev.filter((position) => position.id !== positionId)
    })
  }

  return (
    <div className="min-h-screen bg-[#060b12] p-4 text-white">
      <div className="mx-auto max-w-[1680px] space-y-4">
        <section className="overflow-hidden rounded-lg border border-[#162131] bg-[#09111b] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-3 border-b border-[#132030] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#6a7d96]">
                NovaFunded Execution
              </p>
              <h1 className="mt-1 text-[22px] font-semibold text-white">Trade Terminal</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="positive">Flash 5K</StatusPill>
              <StatusPill>{symbol}</StatusPill>
              <StatusPill>{meta.label}</StatusPill>
            </div>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.7fr)_380px]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="flex flex-col gap-3 border-b border-[#132030] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {(Object.keys(SYMBOLS) as SymbolKey[]).map((key) => (
                      <SymbolButton
                        key={key}
                        active={symbol === key}
                        onClick={() => setSymbol(key)}
                        label={key}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <TerminalStat label="Open" value={String(openCount)} />
                    <TerminalStat label="Pending" value="0" />
                    <TerminalStat label="Closed" value={String(closedCount)} />
                    <TerminalStat
                      label="Live"
                      value={formatPrice(livePrice, symbol)}
                      tone="accent"
                    />
                  </div>
                </div>

                <div className="grid border-b border-[#132030] lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="border-b border-[#132030] px-4 py-3 lg:border-b-0 lg:border-r">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">
                      Instrument
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xl font-semibold text-white">{symbol}</span>
                      <span className="text-sm text-white/45">{meta.label}</span>
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">
                      Last Price
                    </p>
                    <p className="mt-2 font-mono text-[28px] font-semibold text-white">
                      {formatPrice(livePrice, symbol)}
                    </p>
                    <p className="mt-1 text-xs text-white/45">Market orders execute at current in-app live price</p>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-[#050a11]">
                  <TradingViewChart symbol={symbol} />

                  <div className="pointer-events-none absolute inset-0 z-10">
                    <div
                      className="absolute left-0 right-0 border-t border-white/20"
                      style={{ top: `${getLineY(livePrice)}%` }}
                    />

                    {currentSymbolPositions.map((position) => {
                      const y = getLineY(position.entryPrice)
                      const pnl = calculatePnl(position, livePrice)
                      const pnlPositive = pnl >= 0

                      return (
                        <div
                          key={position.id}
                          className="absolute left-0 right-0"
                          style={{ top: `${y}%` }}
                        >
                          <div
                            className={`border-t border-dashed ${
                              position.side === "buy"
                                ? "border-emerald-300/80"
                                : "border-red-300/80"
                            }`}
                          />
                          <div
                            className={`absolute right-4 top-[-14px] rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                              position.side === "buy"
                                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                                : "border-red-400/20 bg-red-500/10 text-red-300"
                            }`}
                          >
                            {position.side} {formatPrice(position.entryPrice, symbol)} •{" "}
                            <span className={pnlPositive ? "text-emerald-300" : "text-red-300"}>
                              {formatMoney(pnl)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="flex flex-col gap-2 border-b border-[#132030] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">
                      Open Positions
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-white">Active Exposure</h2>
                  </div>
                  <StatusPill tone={openCount > 0 ? "positive" : "neutral"}>
                    {openCount > 0 ? `${openCount} Open` : "No Open Trades"}
                  </StatusPill>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#0b1521]">
                      <tr className="border-b border-[#132030]">
                        <TableHeader>ID</TableHeader>
                        <TableHeader>Instrument</TableHeader>
                        <TableHeader>Side</TableHeader>
                        <TableHeader>Qty</TableHeader>
                        <TableHeader>Entry</TableHeader>
                        <TableHeader>Mark</TableHeader>
                        <TableHeader>PnL</TableHeader>
                        <TableHeader>Action</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {openPositions.length === 0 ? (
                        <tr className="border-b border-[#132030] bg-[#08111b]">
                          <td
                            colSpan={8}
                            className="px-3 py-8 text-center text-sm text-white/45"
                          >
                            No open positions yet.
                          </td>
                        </tr>
                      ) : (
                        openPositions.map((position) => {
                          const mark = livePrices[position.symbol]
                          const pnl = calculatePnl(position, mark)
                          const pnlPositive = pnl >= 0

                          return (
                            <tr
                              key={position.id}
                              className="border-b border-[#132030] bg-[#08111b]"
                            >
                              <TableCell tone="muted">{position.id}</TableCell>
                              <TableCell>{position.symbol}</TableCell>
                              <TableCell
                                tone={position.side === "buy" ? "positive" : "negative"}
                              >
                                {position.side.toUpperCase()}
                              </TableCell>
                              <TableCell>{position.size.toFixed(2)}</TableCell>
                              <TableCell>
                                {formatPrice(position.entryPrice, position.symbol)}
                              </TableCell>
                              <TableCell>{formatPrice(mark, position.symbol)}</TableCell>
                              <TableCell tone={pnlPositive ? "positive" : "negative"}>
                                {formatMoney(pnl)}
                              </TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => closePosition(position.id)}
                                  className="rounded-md border border-[#31445e] bg-[#0a1320] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/80 transition hover:border-[#445c7d] hover:bg-[#0f1a2a] hover:text-white"
                                >
                                  Close
                                </button>
                              </TableCell>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="flex flex-col gap-2 border-b border-[#132030] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">
                      Execution History
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-white">Recent Fills</h2>
                  </div>
                  <StatusPill>{closedCount} Closed</StatusPill>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#0b1521]">
                      <tr className="border-b border-[#132030]">
                        <TableHeader>ID</TableHeader>
                        <TableHeader>Instrument</TableHeader>
                        <TableHeader>Side</TableHeader>
                        <TableHeader>Qty</TableHeader>
                        <TableHeader>Entry</TableHeader>
                        <TableHeader>Exit</TableHeader>
                        <TableHeader>PnL</TableHeader>
                        <TableHeader>Time</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {closedPositions.length === 0 ? (
                        <tr className="border-b border-[#132030] bg-[#08111b]">
                          <td
                            colSpan={8}
                            className="px-3 py-8 text-center text-sm text-white/45"
                          >
                            No closed trades yet.
                          </td>
                        </tr>
                      ) : (
                        closedPositions.map((position) => (
                          <tr
                            key={position.id}
                            className="border-b border-[#132030] bg-[#08111b]"
                          >
                            <TableCell tone="muted">{position.id}</TableCell>
                            <TableCell>{position.symbol}</TableCell>
                            <TableCell
                              tone={position.side === "buy" ? "positive" : "negative"}
                            >
                              {position.side.toUpperCase()}
                            </TableCell>
                            <TableCell>{position.size.toFixed(2)}</TableCell>
                            <TableCell>
                              {formatPrice(position.entryPrice, position.symbol)}
                            </TableCell>
                            <TableCell>
                              {formatPrice(position.closePrice, position.symbol)}
                            </TableCell>
                            <TableCell
                              tone={position.pnl >= 0 ? "positive" : "negative"}
                            >
                              {formatMoney(position.pnl)}
                            </TableCell>
                            <TableCell tone="muted">
                              {formatTime(position.closedAtMs)}
                            </TableCell>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <section className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="border-b border-[#132030] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">
                    Execution Controls
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-white">Market Ticket</h2>
                </div>

                <div className="space-y-4 p-4">
                  <div className="rounded-lg border border-[#182435] bg-[#0a121d] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#70839a]">
                          Position Size
                        </p>
                        <p className="mt-2 text-[34px] font-semibold leading-none text-white">
                          {size}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#70839a]">
                          Max
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">25</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {[-5, -1, 1, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSize((prev) => Math.max(1, Math.min(25, prev + value)))}
                          className="rounded-md border border-[#233248] bg-[#0a1320] px-3 py-2.5 text-sm font-medium text-white/75 transition hover:border-[#31445e] hover:bg-[#0e1828] hover:text-white"
                        >
                          {value > 0 ? `+${value}` : value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <TicketField label="Instrument" value={symbol} />
                    <TicketField label="Live Price" value={formatPrice(livePrice, symbol)} tone="accent" />
                    <TicketField label="Order Type" value="Market" />
                    <TicketField label="Notional" value={formatMoney(notionalValue)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => placeMarketOrder("buy")}
                      className="rounded-md bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
                    >
                      Buy Market
                    </button>
                    <button
                      type="button"
                      onClick={() => placeMarketOrder("sell")}
                      className="rounded-md bg-red-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-red-400"
                    >
                      Sell Market
                    </button>
                  </div>

                  <p className="text-xs text-white/45">
                    Orders execute immediately at the current in-app live price shown above.
                  </p>
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="border-b border-[#132030] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">
                    Account Snapshot
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-white">Risk & Progress</h2>
                </div>

                <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <TerminalStat label="Balance" value="$5,125.00" />
                  <TerminalStat label="Equity" value="$5,182.00" />
                  <TerminalStat
                    label="Open PnL"
                    value={formatMoney(openPnlTotal)}
                    tone={openPnlTotal >= 0 ? "positive" : "negative"}
                  />
                  <TerminalStat label="Drawdown Left" value="$318.00" />
                  <TerminalStat label="Daily Loss Left" value="$143.00" />
                  <TerminalStat label="Target Progress" value="46%" tone="accent" />
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}
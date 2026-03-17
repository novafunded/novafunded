"use client"

import { useMemo, useState, type ReactNode } from "react"
import TradingViewChart from "@/components/dashboard/TradingViewChart"
import ChartTradeOverlay from "@/components/dashboard/ChartTradeOverlay"

type OrderSide = "buy" | "sell"
type OrderType = "market" | "limit"

const SYMBOLS = {
  BTCUSD: { label: "Bitcoin", livePrice: 68169, entry: 68169, stopLoss: 67750, takeProfit: 69050 },
  XAUUSD: { label: "Gold", livePrice: 2165.4, entry: 2165.4, stopLoss: 2140.0, takeProfit: 2225.0 },
  NAS100: { label: "Nasdaq 100", livePrice: 18125, entry: 18125, stopLoss: 18040, takeProfit: 18280 },
  EURUSD: { label: "Euro / US Dollar", livePrice: 1.0842, entry: 1.0842, stopLoss: 1.0815, takeProfit: 1.0898 },
  GBPUSD: { label: "British Pound / US Dollar", livePrice: 1.2718, entry: 1.2718, stopLoss: 1.2688, takeProfit: 1.2778 },
} as const

type SymbolKey = keyof typeof SYMBOLS

function formatPrice(value: number, symbol: SymbolKey) {
  if (symbol === "EURUSD" || symbol === "GBPUSD") return value.toFixed(4)
  if (symbol === "XAUUSD") return value.toFixed(1)
  if (symbol === "NAS100") return value.toFixed(1)
  return value.toFixed(0)
}

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "positive" | "negative" | "warning"
}) {
  const styles =
    tone === "positive"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
      : tone === "negative"
        ? "border-red-400/20 bg-red-500/10 text-red-300"
        : tone === "warning"
          ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
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

function ToggleButton({
  active,
  onClick,
  children,
  activeClassName,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  activeClassName?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2.5 text-sm font-medium transition ${
        active
          ? activeClassName ?? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
          : "border-[#233248] bg-[#0a1320] text-white/70 hover:border-[#31445e] hover:bg-[#0e1828] hover:text-white"
      }`}
    >
      {children}
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
  return <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70839a]">{children}</th>
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
  const [side, setSide] = useState<OrderSide>("buy")
  const [orderType, setOrderType] = useState<OrderType>("market")
  const [size, setSize] = useState(5)
  const [useTp, setUseTp] = useState(true)
  const [useSl, setUseSl] = useState(true)

  const meta = SYMBOLS[symbol]

  const chartLow = useMemo(() => {
    const values = [meta.livePrice, meta.entry, meta.stopLoss, meta.takeProfit]
    return Math.min(...values) * 0.96
  }, [meta])

  const chartHigh = useMemo(() => {
    const values = [meta.livePrice, meta.entry, meta.stopLoss, meta.takeProfit]
    return Math.max(...values) * 1.04
  }, [meta])

  const sideTone = side === "buy" ? "positive" : "negative"

  const estimatedRisk = useMemo(() => {
    const slDistance = useSl ? Math.abs(meta.entry - meta.stopLoss) : 0
    return slDistance * size
  }, [meta.entry, meta.stopLoss, size, useSl])

  const estimatedReward = useMemo(() => {
    const tpDistance = useTp ? Math.abs(meta.takeProfit - meta.entry) : 0
    return tpDistance * size
  }, [meta.entry, meta.takeProfit, size, useTp])

  const rr = useMemo(() => {
    if (!useSl || !useTp || estimatedRisk <= 0) return "—"
    return `1:${(estimatedReward / estimatedRisk).toFixed(2)}`
  }, [estimatedRisk, estimatedReward, useSl, useTp])

  const mockOpenRows = [
    {
      id: "POS-1028",
      instrument: symbol,
      side: side.toUpperCase(),
      qty: `${size}.00`,
      entry: formatPrice(meta.entry, symbol),
      mark: formatPrice(meta.livePrice, symbol),
      pnl:
        side === "buy"
          ? meta.livePrice >= meta.entry
            ? "+$42.80"
            : "-$42.80"
          : meta.livePrice <= meta.entry
            ? "+$42.80"
            : "-$42.80",
      status: "Open",
    },
  ]

  const mockHistoryRows = [
    {
      id: "TRD-9012",
      instrument: "XAUUSD",
      side: "BUY",
      qty: "3.00",
      exit: "TP",
      pnl: "+$86.40",
      time: "09:32 UTC",
    },
    {
      id: "TRD-9011",
      instrument: "NAS100",
      side: "SELL",
      qty: "2.00",
      exit: "Manual",
      pnl: "-$34.50",
      time: "08:11 UTC",
    },
    {
      id: "TRD-9010",
      instrument: "BTCUSD",
      side: "BUY",
      qty: "1.00",
      exit: "TP",
      pnl: "+$112.00",
      time: "Yesterday",
    },
  ]

  return (
    <div className="min-h-screen bg-[#060b12] p-4 text-white">
      <div className="mx-auto max-w-[1680px] space-y-4">
        <section className="overflow-hidden rounded-lg border border-[#162131] bg-[#09111b] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-3 border-b border-[#132030] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#6a7d96]">NovaFunded Execution</p>
              <h1 className="mt-1 text-[22px] font-semibold text-white">Trade Terminal</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="positive">Flash 5K</StatusPill>
              <StatusPill>{symbol}</StatusPill>
              <StatusPill tone={sideTone}>{side === "buy" ? "Long Bias" : "Short Bias"}</StatusPill>
              <StatusPill tone="warning">{orderType === "market" ? "Market" : "Limit"}</StatusPill>
            </div>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.7fr)_380px]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="flex flex-col gap-3 border-b border-[#132030] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(SYMBOLS).map(([key]) => (
                      <SymbolButton
                        key={key}
                        active={symbol === key}
                        onClick={() => setSymbol(key as SymbolKey)}
                        label={key}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <TerminalStat label="Open" value="1" />
                    <TerminalStat label="Pending" value="0" />
                    <TerminalStat label="Closed" value="12" />
                    <TerminalStat
                      label="Live"
                      value={formatPrice(meta.livePrice, symbol)}
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
                      {formatPrice(meta.livePrice, symbol)}
                    </p>
                    <p className="mt-1 text-xs text-white/45">Streaming chart shell active</p>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-[#050a11]">
                  <TradingViewChart symbol={symbol} />

                  <ChartTradeOverlay
                    enabled
                    symbol={symbol}
                    side={side}
                    orderType={orderType}
                    livePrice={meta.livePrice}
                    entry={meta.entry}
                    stopLoss={useSl ? meta.stopLoss : null}
                    takeProfit={useTp ? meta.takeProfit : null}
                    chartLow={chartLow}
                    chartHigh={chartHigh}
                    size={size}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="flex flex-col gap-2 border-b border-[#132030] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">Open Positions</p>
                    <h2 className="mt-1 text-base font-semibold text-white">Active Exposure</h2>
                  </div>
                  <StatusPill tone={sideTone}>{mockOpenRows[0].status}</StatusPill>
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
                        <TableHeader>Status</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {mockOpenRows.map((row) => {
                        const pnlPositive = row.pnl.startsWith("+")
                        return (
                          <tr key={row.id} className="border-b border-[#132030] bg-[#08111b]">
                            <TableCell tone="muted">{row.id}</TableCell>
                            <TableCell>{row.instrument}</TableCell>
                            <TableCell tone={row.side === "BUY" ? "positive" : "negative"}>{row.side}</TableCell>
                            <TableCell>{row.qty}</TableCell>
                            <TableCell>{row.entry}</TableCell>
                            <TableCell>{row.mark}</TableCell>
                            <TableCell tone={pnlPositive ? "positive" : "negative"}>{row.pnl}</TableCell>
                            <TableCell>{row.status}</TableCell>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="flex flex-col gap-2 border-b border-[#132030] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">Execution History</p>
                    <h2 className="mt-1 text-base font-semibold text-white">Recent Fills</h2>
                  </div>
                  <StatusPill>Session Log</StatusPill>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#0b1521]">
                      <tr className="border-b border-[#132030]">
                        <TableHeader>ID</TableHeader>
                        <TableHeader>Instrument</TableHeader>
                        <TableHeader>Side</TableHeader>
                        <TableHeader>Qty</TableHeader>
                        <TableHeader>Exit</TableHeader>
                        <TableHeader>PnL</TableHeader>
                        <TableHeader>Time</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {mockHistoryRows.map((row) => (
                        <tr key={row.id} className="border-b border-[#132030] bg-[#08111b]">
                          <TableCell tone="muted">{row.id}</TableCell>
                          <TableCell>{row.instrument}</TableCell>
                          <TableCell tone={row.side === "BUY" ? "positive" : "negative"}>{row.side}</TableCell>
                          <TableCell>{row.qty}</TableCell>
                          <TableCell>{row.exit}</TableCell>
                          <TableCell tone={row.pnl.startsWith("+") ? "positive" : "negative"}>
                            {row.pnl}
                          </TableCell>
                          <TableCell tone="muted">{row.time}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <section className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="border-b border-[#132030] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">Execution Controls</p>
                  <h2 className="mt-1 text-base font-semibold text-white">Order Ticket</h2>
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#70839a]">Direction</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ToggleButton
                        active={side === "buy"}
                        onClick={() => setSide("buy")}
                        activeClassName="border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                      >
                        Buy
                      </ToggleButton>
                      <ToggleButton
                        active={side === "sell"}
                        onClick={() => setSide("sell")}
                        activeClassName="border-red-400/20 bg-red-500/10 text-red-300"
                      >
                        Sell
                      </ToggleButton>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#70839a]">Order Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ToggleButton active={orderType === "market"} onClick={() => setOrderType("market")}>
                        Market
                      </ToggleButton>
                      <ToggleButton active={orderType === "limit"} onClick={() => setOrderType("limit")}>
                        Limit
                      </ToggleButton>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#70839a]">Protection</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ToggleButton
                        active={useTp}
                        onClick={() => setUseTp((prev) => !prev)}
                        activeClassName="border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                      >
                        {useTp ? "TP Enabled" : "Enable TP"}
                      </ToggleButton>
                      <ToggleButton
                        active={useSl}
                        onClick={() => setUseSl((prev) => !prev)}
                        activeClassName="border-red-400/20 bg-red-500/10 text-red-300"
                      >
                        {useSl ? "SL Enabled" : "Enable SL"}
                      </ToggleButton>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#182435] bg-[#0a121d] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#70839a]">Position Size</p>
                        <p className="mt-2 text-[34px] font-semibold leading-none text-white">{size}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#70839a]">Max</p>
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
                    <TicketField label="Entry" value={formatPrice(meta.entry, symbol)} tone="accent" />
                    <TicketField label="Live" value={formatPrice(meta.livePrice, symbol)} />
                    <TicketField
                      label="Take Profit"
                      value={useTp ? formatPrice(meta.takeProfit, symbol) : "Disabled"}
                      tone="positive"
                    />
                    <TicketField
                      label="Stop Loss"
                      value={useSl ? formatPrice(meta.stopLoss, symbol) : "Disabled"}
                      tone="negative"
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <TicketField
                      label="Est. Risk"
                      value={useSl ? formatMoney(estimatedRisk) : "Off"}
                      tone="negative"
                    />
                    <TicketField
                      label="Est. Reward"
                      value={useTp ? formatMoney(estimatedReward) : "Off"}
                      tone="positive"
                    />
                    <TicketField label="R:R" value={rr} />
                    <TicketField label="Instrument" value={symbol} />
                  </div>

                  <button
                    type="button"
                    className={`w-full rounded-md px-4 py-3.5 text-sm font-semibold transition ${
                      side === "buy"
                        ? "bg-emerald-500 text-black hover:bg-emerald-400"
                        : "bg-red-500 text-white hover:bg-red-400"
                    }`}
                  >
                    {orderType === "market"
                      ? `Place ${side === "buy" ? "Buy" : "Sell"} Market`
                      : `Confirm ${side === "buy" ? "Buy" : "Sell"} Limit`}
                  </button>
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border border-[#162131] bg-[#08111b]">
                <div className="border-b border-[#132030] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#70839a]">Account Snapshot</p>
                  <h2 className="mt-1 text-base font-semibold text-white">Risk & Progress</h2>
                </div>

                <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <TerminalStat label="Balance" value={formatMoney(5125)} />
                  <TerminalStat label="Equity" value={formatMoney(5182)} />
                  <TerminalStat label="Net PnL" value={formatMoney(182)} tone="positive" />
                  <TerminalStat label="Drawdown Left" value={formatMoney(318)} />
                  <TerminalStat label="Daily Loss Left" value={formatMoney(143)} />
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
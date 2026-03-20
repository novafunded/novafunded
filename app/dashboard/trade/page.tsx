"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import TradingViewChart from "@/components/dashboard/TradingViewChart"
import {
  getAccountDisplayStatus,
  isTradingLocked,
  loadTradingContext,
  syncTradeAccountSnapshot,
  type AccountData,
  type TradeRecord,
} from "@/lib/tradingAccount"
import { deriveTradingMetrics, getTradingDaysFromTrades } from "@/lib/tradingMetrics"
import {
  syncTerminalState,
  type TerminalTradeSnapshot,
} from "@/lib/tradeTerminalSync"

type OrderSide = "buy" | "sell"

const SYMBOLS = {
  BTCUSD: { label: "Bitcoin", startPrice: 68169, minMove: 18 },
  XAUUSD: { label: "Gold", startPrice: 2165.4, minMove: 0.35 },
  NAS100: { label: "Nasdaq 100", startPrice: 18125, minMove: 6 },
  EURUSD: { label: "Euro / US Dollar", startPrice: 1.0842, minMove: 0.00035 },
  GBPUSD: { label: "British Pound / US Dollar", startPrice: 1.2718, minMove: 0.0004 },
} as const

type SymbolKey = keyof typeof SYMBOLS

function round2(value: number) {
  return Number(value.toFixed(2))
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

function calculatePnl(
  trade: TerminalTradeSnapshot,
  livePrice: number,
) {
  const entry = trade.entry ?? trade.requestedEntry ?? 0
  const delta =
    trade.side === "buy" ? livePrice - entry : entry - livePrice

  return round2(delta * trade.size)
}

function mapTradeRecordToTerminalTrade(trade: TradeRecord): TerminalTradeSnapshot {
  return {
    id: trade.id,
    symbol: (trade.symbol in SYMBOLS ? trade.symbol : "BTCUSD") as SymbolKey,
    side: trade.side,
    orderType: trade.orderType,
    requestedEntry: trade.requestedEntry,
    entry: trade.entry,
    useStopLoss: trade.useStopLoss,
    useTakeProfit: trade.useTakeProfit,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    size: trade.size,
    status: trade.status,
    openedAt: trade.openedAtMs ?? null,
    closedAt: trade.closedAtMs ?? null,
    closePrice: trade.closePrice ?? null,
    pnl: trade.pnl,
    closeReason: trade.closeReason,
    createdAt: trade.createdAtMs ?? Date.now(),
  }
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
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#70839a]">{label}</p>
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
  const [uid, setUid] = useState<string | null>(null)
  const [account, setAccount] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedTerminalTrades, setLoadedTerminalTrades] = useState<TerminalTradeSnapshot[]>([])
  const [livePrices, setLivePrices] = useState<Record<SymbolKey, number>>({
    BTCUSD: SYMBOLS.BTCUSD.startPrice,
    XAUUSD: SYMBOLS.XAUUSD.startPrice,
    NAS100: SYMBOLS.NAS100.startPrice,
    EURUSD: SYMBOLS.EURUSD.startPrice,
    GBPUSD: SYMBOLS.GBPUSD.startPrice,
  })

  const hasInitializedPriceRef = useRef(false)
  const hasHydratedTradesRef = useRef(false)
  const lastSyncedPayloadRef = useRef("")
  const syncTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUid(null)
        setAccount(null)
        setLoadedTerminalTrades([])
        setLoading(false)
        setLoadError("You must be signed in to access the trade terminal.")
        return
      }

      try {
        setUid(user.uid)
        setLoading(true)
        setLoadError(null)

        const context = await loadTradingContext(user.uid, {
          includeTrades: true,
          tradeLimit: 250,
        })

        if (context.status !== "ready" || !context.account) {
          setAccount(null)
          setLoadedTerminalTrades([])
          setLoadError("No active trading account was found.")
          setLoading(false)
          return
        }

        const nextAccount = context.account
        const nextTrades = context.trades.map(mapTradeRecordToTerminalTrade)

        setAccount(nextAccount)
        setLoadedTerminalTrades(nextTrades)

        if (!hasInitializedPriceRef.current) {
          setLivePrices((prev) => {
            const next = { ...prev }

            nextTrades.forEach((trade) => {
              const tradeSymbol = trade.symbol as SymbolKey
              const entry = trade.entry ?? trade.requestedEntry
              if (tradeSymbol in next && typeof entry === "number" && entry > 0) {
                next[tradeSymbol] = roundPriceForSymbol(entry, tradeSymbol)
              }
            })

            return next
          })

          hasInitializedPriceRef.current = true
        }

        setLoading(false)
      } catch (error) {
        console.error(error)
        setLoadError("Failed to load your live trading account.")
        setLoading(false)
      }
    })

    return () => unsub()
  }, [])

  useEffect(() => {
    if (!account) return
    if (hasHydratedTradesRef.current) return

    hasHydratedTradesRef.current = true
  }, [account])

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

  const openTrades = useMemo(
    () => loadedTerminalTrades.filter((trade) => trade.status === "open"),
    [loadedTerminalTrades],
  )

  const closedTrades = useMemo(
    () => loadedTerminalTrades.filter((trade) => trade.status === "closed"),
    [loadedTerminalTrades],
  )

  const pendingTrades = useMemo(
    () => loadedTerminalTrades.filter((trade) => trade.status === "pending"),
    [loadedTerminalTrades],
  )

  const currentSymbolPositions = useMemo(
    () => openTrades.filter((trade) => trade.symbol === symbol),
    [openTrades, symbol],
  )

  const openPnlTotal = useMemo(() => {
    return round2(
      openTrades.reduce((sum, trade) => {
        const mark = livePrices[trade.symbol as SymbolKey]
        return sum + calculatePnl(trade, mark)
      }, 0),
    )
  }, [openTrades, livePrices])

  const realizedClosedPnl = useMemo(() => {
    return round2(closedTrades.reduce((sum, trade) => sum + trade.pnl, 0))
  }, [closedTrades])

  const computedBalance = useMemo(() => {
    if (!account) return 0
    return round2(account.startBalance + realizedClosedPnl)
  }, [account, realizedClosedPnl])

  const computedEquity = useMemo(() => {
    return round2(computedBalance + openPnlTotal)
  }, [computedBalance, openPnlTotal])

  const computedTradingDays = useMemo(() => {
    return Math.max(account?.tradingDays ?? 0, getTradingDaysFromTrades(closedTrades))
  }, [account, closedTrades])

  const maxLossBreach = useMemo(() => {
    if (!account) return false
    return computedEquity <= account.startBalance - account.maxLossLimit
  }, [account, computedEquity])

  const dailyLossBreach = useMemo(() => {
    if (!account) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStartMs = today.getTime()

    const todayRealized = closedTrades
      .filter((trade) => (trade.closedAt ?? 0) >= todayStartMs)
      .reduce((sum, trade) => sum + trade.pnl, 0)

    const todayTotal = todayRealized + openPnlTotal
    return todayTotal <= -account.dailyLossLimit
  }, [account, closedTrades, openPnlTotal])

  const computedBreached = useMemo(() => {
    return !!account && (account.breached || maxLossBreach || dailyLossBreach)
  }, [account, maxLossBreach, dailyLossBreach])

  const computedStatus = useMemo(() => {
    if (!account) return "locked"
    if (computedBreached) return "breached"
    const normalized = account.status.trim().toLowerCase()
    if (normalized === "locked") return "locked"
    return account.status || "active"
  }, [account, computedBreached])

  const terminalAccountSnapshot = useMemo(() => {
    if (!account) return null

    return {
      ...account,
      balance: computedBalance,
      equity: computedEquity,
      closedTrades: closedTrades.length,
      tradingDays: computedTradingDays,
      breached: computedBreached,
      status: computedStatus,
    }
  }, [
    account,
    computedBalance,
    computedEquity,
    closedTrades.length,
    computedTradingDays,
    computedBreached,
    computedStatus,
  ])

  const derivedMetrics = useMemo(() => {
    if (!terminalAccountSnapshot) return null

    const normalizedTradeRecords: TradeRecord[] = loadedTerminalTrades.map((trade) => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      orderType: trade.orderType,
      status: trade.status,
      requestedEntry: trade.requestedEntry,
      entry: trade.entry,
      useStopLoss: trade.useStopLoss,
      useTakeProfit: trade.useTakeProfit,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      size: trade.size,
      pnl:
        trade.status === "open"
          ? calculatePnl(trade, livePrices[trade.symbol as SymbolKey])
          : trade.pnl,
      closeReason: trade.closeReason,
      accountId: terminalAccountSnapshot.id,
      userId: terminalAccountSnapshot.userId,
      createdAtMs: trade.createdAt,
      openedAtMs: trade.openedAt,
      closedAtMs: trade.closedAt,
      closePrice: trade.closePrice,
    }))

    return deriveTradingMetrics(terminalAccountSnapshot, normalizedTradeRecords)
  }, [terminalAccountSnapshot, loadedTerminalTrades, livePrices])

  const tradeLocked = useMemo(() => {
    return isTradingLocked(terminalAccountSnapshot)
  }, [terminalAccountSnapshot])

  useEffect(() => {
    if (!account || !uid || !terminalAccountSnapshot) return

    syncTradeAccountSnapshot(terminalAccountSnapshot)

    const payload = JSON.stringify({
      accountId: terminalAccountSnapshot.id,
      balance: terminalAccountSnapshot.balance,
      equity: terminalAccountSnapshot.equity,
      tradingDays: terminalAccountSnapshot.tradingDays,
      closedTrades: terminalAccountSnapshot.closedTrades,
      breached: terminalAccountSnapshot.breached,
      status: terminalAccountSnapshot.status,
      trades: loadedTerminalTrades.map((trade) => ({
        id: trade.id,
        status: trade.status,
        pnl: trade.pnl,
        closePrice: trade.closePrice,
        openedAt: trade.openedAt,
        closedAt: trade.closedAt,
      })),
    })

    if (payload === lastSyncedPayloadRef.current) return
    lastSyncedPayloadRef.current = payload

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      syncTerminalState({
        uid,
        account,
        trades: loadedTerminalTrades,
        balance: terminalAccountSnapshot.balance,
        equity: terminalAccountSnapshot.equity,
        tradingDays: terminalAccountSnapshot.tradingDays,
        closedTrades: terminalAccountSnapshot.closedTrades,
        breached: terminalAccountSnapshot.breached,
        status: terminalAccountSnapshot.status,
      }).catch((error) => {
        console.error("syncTerminalState failed", error)
      })
    }, 500)

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [uid, account, loadedTerminalTrades, terminalAccountSnapshot])

  useEffect(() => {
    if (!account || !computedBreached) return

    const breachOpenTrades = loadedTerminalTrades.filter((trade) => trade.status === "open")
    if (breachOpenTrades.length === 0) return

    setLoadedTerminalTrades((prev) =>
      prev.map((trade) => {
        if (trade.status !== "open") return trade

        const live = livePrices[trade.symbol as SymbolKey]
        return {
          ...trade,
          status: "closed",
          closeReason: "breach",
          closePrice: live,
          closedAt: Date.now(),
          pnl: calculatePnl(trade, live),
        }
      }),
    )
  }, [account, computedBreached, livePrices, loadedTerminalTrades])

  const chartLow = useMemo(() => {
    const prices = [livePrice, ...currentSymbolPositions.map((trade) => trade.entry ?? trade.requestedEntry)]
    return Math.min(...prices) * 0.96
  }, [livePrice, currentSymbolPositions])

  const chartHigh = useMemo(() => {
    const prices = [livePrice, ...currentSymbolPositions.map((trade) => trade.entry ?? trade.requestedEntry)]
    return Math.max(...prices) * 1.04
  }, [livePrice, currentSymbolPositions])

  const notionalValue = livePrice * size

  function getLineY(price: number) {
    const range = chartHigh - chartLow || 1
    const raw = ((chartHigh - price) / range) * 100
    return clamp(raw, 7, 93)
  }

  function placeMarketOrder(side: OrderSide) {
    if (!account || tradeLocked) return

    const entryPrice = livePrices[symbol]
    const now = Date.now()

    const newTrade: TerminalTradeSnapshot = {
      id: `TRD-${now}-${Math.floor(Math.random() * 10000)}`,
      symbol,
      side,
      orderType: "market",
      requestedEntry: entryPrice,
      entry: entryPrice,
      useStopLoss: false,
      useTakeProfit: false,
      stopLoss: null,
      takeProfit: null,
      size,
      status: "open",
      openedAt: now,
      closedAt: null,
      closePrice: null,
      pnl: 0,
      createdAt: now,
    }

    setLoadedTerminalTrades((prev) => [newTrade, ...prev])
  }

  function closePosition(positionId: string) {
    setLoadedTerminalTrades((prev) =>
      prev.map((trade) => {
        if (trade.id !== positionId || trade.status !== "open") return trade

        const closePrice = livePrices[trade.symbol as SymbolKey]
        const pnl = calculatePnl(trade, closePrice)

        return {
          ...trade,
          status: "closed",
          closePrice,
          closedAt: Date.now(),
          closeReason: "manual",
          pnl,
        }
      }),
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b12] p-4 text-white">
        <div className="mx-auto max-w-[1680px] rounded-lg border border-[#162131] bg-[#09111b] p-8">
          Loading trade terminal...
        </div>
      </div>
    )
  }

  if (loadError || !account || !terminalAccountSnapshot || !derivedMetrics) {
    return (
      <div className="min-h-screen bg-[#060b12] p-4 text-white">
        <div className="mx-auto max-w-[1680px] rounded-lg border border-[#162131] bg-[#09111b] p-8">
          <h1 className="text-xl font-semibold">Trade terminal unavailable</h1>
          <p className="mt-2 text-white/65">{loadError ?? "No active account found."}</p>
        </div>
      </div>
    )
  }

  const displayStatus = getAccountDisplayStatus(terminalAccountSnapshot)

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
              <StatusPill tone={tradeLocked ? "negative" : "positive"}>
                {terminalAccountSnapshot.planName}
              </StatusPill>
              <StatusPill tone={tradeLocked ? "negative" : "neutral"}>
                {displayStatus}
              </StatusPill>
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
                    <TerminalStat label="Open" value={String(openTrades.length)} />
                    <TerminalStat label="Pending" value={String(pendingTrades.length)} />
                    <TerminalStat label="Closed" value={String(closedTrades.length)} />
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
                    <p className="mt-1 text-xs text-white/45">
                      Market orders execute at the current in-app live price
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-[#050a11]">
                  <TradingViewChart symbol={symbol} />

                  <div className="pointer-events-none absolute inset-0 z-10">
                    <div
                      className="absolute left-0 right-0 border-t border-white/20"
                      style={{ top: `${getLineY(livePrice)}%` }}
                    />

                    {currentSymbolPositions.map((trade) => {
                      const entry = trade.entry ?? trade.requestedEntry
                      const y = getLineY(entry)
                      const pnl = calculatePnl(trade, livePrice)
                      const pnlPositive = pnl >= 0

                      return (
                        <div
                          key={trade.id}
                          className="absolute left-0 right-0"
                          style={{ top: `${y}%` }}
                        >
                          <div
                            className={`border-t border-dashed ${
                              trade.side === "buy"
                                ? "border-emerald-300/80"
                                : "border-red-300/80"
                            }`}
                          />
                          <div
                            className={`absolute right-4 top-[-14px] rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                              trade.side === "buy"
                                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                                : "border-red-400/20 bg-red-500/10 text-red-300"
                            }`}
                          >
                            {trade.side} {formatPrice(entry, symbol)} •{" "}
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
                  <StatusPill tone={openTrades.length > 0 ? "positive" : "neutral"}>
                    {openTrades.length > 0 ? `${openTrades.length} Open` : "No Open Trades"}
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
                      {openTrades.length === 0 ? (
                        <tr className="border-b border-[#132030] bg-[#08111b]">
                          <td
                            colSpan={8}
                            className="px-3 py-8 text-center text-sm text-white/45"
                          >
                            No open positions yet.
                          </td>
                        </tr>
                      ) : (
                        openTrades.map((trade) => {
                          const mark = livePrices[trade.symbol as SymbolKey]
                          const pnl = calculatePnl(trade, mark)
                          const pnlPositive = pnl >= 0

                          return (
                            <tr
                              key={trade.id}
                              className="border-b border-[#132030] bg-[#08111b]"
                            >
                              <TableCell tone="muted">{trade.id}</TableCell>
                              <TableCell>{trade.symbol}</TableCell>
                              <TableCell tone={trade.side === "buy" ? "positive" : "negative"}>
                                {trade.side.toUpperCase()}
                              </TableCell>
                              <TableCell>{trade.size.toFixed(2)}</TableCell>
                              <TableCell>
                                {formatPrice(trade.entry ?? trade.requestedEntry, trade.symbol as SymbolKey)}
                              </TableCell>
                              <TableCell>{formatPrice(mark, trade.symbol as SymbolKey)}</TableCell>
                              <TableCell tone={pnlPositive ? "positive" : "negative"}>
                                {formatMoney(pnl)}
                              </TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => closePosition(trade.id)}
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
                  <StatusPill>{closedTrades.length} Closed</StatusPill>
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
                      {closedTrades.length === 0 ? (
                        <tr className="border-b border-[#132030] bg-[#08111b]">
                          <td
                            colSpan={8}
                            className="px-3 py-8 text-center text-sm text-white/45"
                          >
                            No closed trades yet.
                          </td>
                        </tr>
                      ) : (
                        closedTrades.map((trade) => (
                          <tr
                            key={trade.id}
                            className="border-b border-[#132030] bg-[#08111b]"
                          >
                            <TableCell tone="muted">{trade.id}</TableCell>
                            <TableCell>{trade.symbol}</TableCell>
                            <TableCell tone={trade.side === "buy" ? "positive" : "negative"}>
                              {trade.side.toUpperCase()}
                            </TableCell>
                            <TableCell>{trade.size.toFixed(2)}</TableCell>
                            <TableCell>
                              {formatPrice(trade.entry ?? trade.requestedEntry, trade.symbol as SymbolKey)}
                            </TableCell>
                            <TableCell>
                              {formatPrice(
                                trade.closePrice ?? trade.entry ?? trade.requestedEntry,
                                trade.symbol as SymbolKey,
                              )}
                            </TableCell>
                            <TableCell tone={trade.pnl >= 0 ? "positive" : "negative"}>
                              {formatMoney(trade.pnl)}
                            </TableCell>
                            <TableCell tone="muted">
                              {formatTime(trade.closedAt ?? trade.createdAt)}
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

                  {tradeLocked && (
                    <div className="rounded-md border border-red-400/20 bg-red-500/10 px-3 py-3 text-sm text-red-200">
                      Trading is locked because this account is {displayStatus.toLowerCase()}.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => placeMarketOrder("buy")}
                      disabled={tradeLocked}
                      className="rounded-md bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Buy Market
                    </button>
                    <button
                      type="button"
                      onClick={() => placeMarketOrder("sell")}
                      disabled={tradeLocked}
                      className="rounded-md bg-red-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <TerminalStat
                    label="Balance"
                    value={formatMoney(terminalAccountSnapshot.balance).replace("+", "")}
                  />
                  <TerminalStat
                    label="Equity"
                    value={formatMoney(terminalAccountSnapshot.equity).replace("+", "")}
                  />
                  <TerminalStat
                    label="Open PnL"
                    value={formatMoney(openPnlTotal)}
                    tone={openPnlTotal >= 0 ? "positive" : "negative"}
                  />
                  <TerminalStat
                    label="Drawdown Left"
                    value={formatMoney(derivedMetrics.drawdownRemaining).replace("+", "")}
                    tone={derivedMetrics.drawdownRemaining > 0 ? "default" : "negative"}
                  />
                  <TerminalStat
                    label="Daily Loss Left"
                    value={formatMoney(derivedMetrics.dailyLossRemaining).replace("+", "")}
                    tone={derivedMetrics.dailyLossRemaining > 0 ? "default" : "negative"}
                  />
                  <TerminalStat
                    label="Payout Progress"
                    value={`${derivedMetrics.payoutReadinessPercent}%`}
                    tone="accent"
                  />
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}
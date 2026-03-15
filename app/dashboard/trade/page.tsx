"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import TradingViewChart from "@/components/dashboard/TradingViewChart"
import ChartTradeOverlay from "@/components/dashboard/ChartTradeOverlay"

type OrderSide = "buy" | "sell"
type OrderType = "market" | "limit"
type TradeStatus = "pending" | "open" | "closed" | "cancelled"
type CloseReason = "tp" | "sl" | "manual" | "breach"

type Trade = {
  id: string
  symbol: string
  side: OrderSide
  orderType: OrderType
  requestedEntry: number
  entry: number | null
  useStopLoss: boolean
  useTakeProfit: boolean
  stopLoss: number | null
  takeProfit: number | null
  size: number
  status: TradeStatus
  openedAt: number | null
  closedAt: number | null
  closePrice: number | null
  pnl: number
  closeReason?: CloseReason
}

type DragTarget = "entry" | "tp" | "sl" | null

const SYMBOLS: Record<
  string,
  {
    label: string
    startPrice: number
    minMove: number
    defaultRisk: number
    defaultReward: number
  }
> = {
  XAUUSD: {
    label: "Gold",
    startPrice: 2165.4,
    minMove: 0.1,
    defaultRisk: 25,
    defaultReward: 60,
  },
  EURUSD: {
    label: "Euro / US Dollar",
    startPrice: 1.0842,
    minMove: 0.0001,
    defaultRisk: 0.01,
    defaultReward: 0.02,
  },
  GBPUSD: {
    label: "British Pound / US Dollar",
    startPrice: 1.2718,
    minMove: 0.0001,
    defaultRisk: 0.01,
    defaultReward: 0.02,
  },
  NAS100: {
    label: "Nasdaq 100",
    startPrice: 18125,
    minMove: 1,
    defaultRisk: 50,
    defaultReward: 120,
  },
  BTCUSD: {
    label: "Bitcoin",
    startPrice: 68169,
    minMove: 1,
    defaultRisk: 400,
    defaultReward: 1200,
  },
}

const START_BALANCE = 5000
const MAX_LOSS_LIMIT = 500
const DAILY_LOSS_LIMIT = 250
const PROFIT_TARGET = 400

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatPrice(value: number, symbol: string) {
  if (symbol === "EURUSD" || symbol === "GBPUSD") return value.toFixed(4)
  if (symbol === "XAUUSD") return value.toFixed(1)
  if (symbol === "NAS100") return value.toFixed(1)
  return value.toFixed(0)
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

function priceToPercent(price: number, low: number, high: number) {
  const range = high - low || 1
  return clamp(((high - price) / range) * 100, 8, 92)
}

function percentToPrice(percent: number, low: number, high: number, step: number) {
  const safePercent = clamp(percent, 8, 92)
  const price = high - (safePercent / 100) * (high - low)
  return roundToStep(price, step)
}

function computePnl(trade: Trade, price: number) {
  const filledEntry = trade.entry ?? trade.requestedEntry
  const diff = trade.side === "buy" ? price - filledEntry : filledEntry - price
  return Number((diff * trade.size).toFixed(2))
}

function normalizeLevels(
  side: OrderSide,
  orderType: OrderType,
  livePrice: number,
  entry: number,
  stopLoss: number | null,
  takeProfit: number | null,
  step: number,
  useStopLoss: boolean,
  useTakeProfit: boolean
) {
  const minGap = step * (step >= 1 ? 5 : 10)

  let nextEntry = roundToStep(entry, step)
  let nextStop = stopLoss !== null ? roundToStep(stopLoss, step) : null
  let nextTake = takeProfit !== null ? roundToStep(takeProfit, step) : null

  if (orderType === "market") {
    nextEntry = roundToStep(livePrice, step)
  }

  if (side === "buy") {
    if (useStopLoss) {
      nextStop = Math.min(nextStop ?? nextEntry - minGap, nextEntry - minGap)
    }
    if (useTakeProfit) {
      nextTake = Math.max(nextTake ?? nextEntry + minGap, nextEntry + minGap)
    }
  } else {
    if (useStopLoss) {
      nextStop = Math.max(nextStop ?? nextEntry + minGap, nextEntry + minGap)
    }
    if (useTakeProfit) {
      nextTake = Math.min(nextTake ?? nextEntry - minGap, nextEntry - minGap)
    }
  }

  return {
    entry: roundToStep(nextEntry, step),
    stopLoss: useStopLoss ? roundToStep(nextStop ?? nextEntry, step) : null,
    takeProfit: useTakeProfit ? roundToStep(nextTake ?? nextEntry, step) : null,
  }
}

export default function TradePage() {
  const [symbol, setSymbol] = useState<keyof typeof SYMBOLS>("BTCUSD")
  const [side, setSide] = useState<OrderSide>("buy")
  const [orderType, setOrderType] = useState<OrderType>("market")
  const [size, setSize] = useState(10)

  const [livePrice, setLivePrice] = useState(SYMBOLS.BTCUSD.startPrice)

  const [entry, setEntry] = useState(SYMBOLS.BTCUSD.startPrice)
  const [confirmedEntry, setConfirmedEntry] = useState<number | null>(null)

  const [stopLoss, setStopLoss] = useState<number | null>(SYMBOLS.BTCUSD.startPrice - 400)
  const [confirmedStopLoss, setConfirmedStopLoss] = useState<number | null>(SYMBOLS.BTCUSD.startPrice - 400)

  const [takeProfit, setTakeProfit] = useState<number | null>(SYMBOLS.BTCUSD.startPrice + 1200)
  const [confirmedTakeProfit, setConfirmedTakeProfit] = useState<number | null>(SYMBOLS.BTCUSD.startPrice + 1200)

  const [useStopLoss, setUseStopLoss] = useState(true)
  const [useTakeProfit, setUseTakeProfit] = useState(true)

  const [trades, setTrades] = useState<Trade[]>([])
  const [dragTarget, setDragTarget] = useState<DragTarget>(null)
  const [chartMounted, setChartMounted] = useState(false)

  const chartRef = useRef<HTMLDivElement | null>(null)
  const symbolMeta = SYMBOLS[symbol]

  const balance = useMemo(() => {
    const closedPnl = trades
      .filter((trade) => trade.status === "closed")
      .reduce((sum, trade) => sum + trade.pnl, 0)

    return Number((START_BALANCE + closedPnl).toFixed(2))
  }, [trades])

  const floatingPnl = useMemo(() => {
    return trades
      .filter((trade) => trade.status === "open")
      .reduce((sum, trade) => sum + computePnl(trade, livePrice), 0)
  }, [trades, livePrice])

  const equity = Number((balance + floatingPnl).toFixed(2))
  const drawdownLeft = Number((equity - (START_BALANCE - MAX_LOSS_LIMIT)).toFixed(2))
  const dailyLossLeft = Number((equity - (START_BALANCE - DAILY_LOSS_LIMIT)).toFixed(2))
  const netPnl = Number((equity - START_BALANCE).toFixed(2))
  const closedTrades = trades.filter((trade) => trade.status === "closed")
  const openTrades = trades.filter((trade) => trade.status === "open")
  const pendingTrades = trades.filter((trade) => trade.status === "pending")
  const isBreached =
    equity <= START_BALANCE - MAX_LOSS_LIMIT || equity <= START_BALANCE - DAILY_LOSS_LIMIT
  const isPassed = !isBreached && balance >= START_BALANCE + PROFIT_TARGET

  const tradingDays = useMemo(() => {
    const opened = trades
      .map((trade) => trade.openedAt)
      .filter((value): value is number => typeof value === "number")
      .map((value) => new Date(value).toDateString())

    return new Set(opened).size
  }, [trades])

  const overlayRange = useMemo(() => {
    const values: number[] = [livePrice, entry]

    if (stopLoss !== null) values.push(stopLoss)
    if (takeProfit !== null) values.push(takeProfit)
    if (confirmedEntry !== null) values.push(confirmedEntry)
    if (confirmedStopLoss !== null) values.push(confirmedStopLoss)
    if (confirmedTakeProfit !== null) values.push(confirmedTakeProfit)

    for (const trade of trades) {
      values.push(trade.requestedEntry)
      values.push(trade.entry ?? trade.requestedEntry)
      if (trade.stopLoss !== null) values.push(trade.stopLoss)
      if (trade.takeProfit !== null) values.push(trade.takeProfit)
      if (trade.closePrice !== null) values.push(trade.closePrice)
    }

    return getChartRange(values, symbol)
  }, [
    confirmedEntry,
    confirmedStopLoss,
    confirmedTakeProfit,
    entry,
    livePrice,
    stopLoss,
    symbol,
    takeProfit,
    trades,
  ])

  const syncedAccount = useMemo(() => {
    return {
      balance,
      equity,
      status: isBreached ? "Breached" : isPassed ? "Passed" : "On Track",
      statusTone: isBreached ? "negative" : "positive",
      tradingDays,
      closedTrades: closedTrades.length,
    }
  }, [balance, closedTrades.length, equity, isBreached, isPassed, tradingDays])

  useEffect(() => {
    const savedTrades = window.localStorage.getItem("novafunded-trades")
    const savedState = window.localStorage.getItem("novafunded-trade-page-state")

    if (savedTrades) {
      try {
        setTrades(JSON.parse(savedTrades) as Trade[])
      } catch {}
    }

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as Partial<{
          symbol: keyof typeof SYMBOLS
          side: OrderSide
          orderType: OrderType
          size: number
          entry: number
          confirmedEntry: number | null
          stopLoss: number | null
          confirmedStopLoss: number | null
          takeProfit: number | null
          confirmedTakeProfit: number | null
          useStopLoss: boolean
          useTakeProfit: boolean
          livePrice: number
        }>

        if (parsed.symbol && SYMBOLS[parsed.symbol]) setSymbol(parsed.symbol)
        if (parsed.side) setSide(parsed.side)
        if (parsed.orderType) setOrderType(parsed.orderType)
        if (typeof parsed.size === "number") setSize(parsed.size)
        if (typeof parsed.entry === "number") setEntry(parsed.entry)
        if (parsed.confirmedEntry === null || typeof parsed.confirmedEntry === "number") {
          setConfirmedEntry(parsed.confirmedEntry ?? null)
        }
        if (parsed.stopLoss === null || typeof parsed.stopLoss === "number") setStopLoss(parsed.stopLoss ?? null)
        if (parsed.confirmedStopLoss === null || typeof parsed.confirmedStopLoss === "number") {
          setConfirmedStopLoss(parsed.confirmedStopLoss ?? null)
        }
        if (parsed.takeProfit === null || typeof parsed.takeProfit === "number") {
          setTakeProfit(parsed.takeProfit ?? null)
        }
        if (parsed.confirmedTakeProfit === null || typeof parsed.confirmedTakeProfit === "number") {
          setConfirmedTakeProfit(parsed.confirmedTakeProfit ?? null)
        }
        if (typeof parsed.useStopLoss === "boolean") setUseStopLoss(parsed.useStopLoss)
        if (typeof parsed.useTakeProfit === "boolean") setUseTakeProfit(parsed.useTakeProfit)
        if (typeof parsed.livePrice === "number") setLivePrice(parsed.livePrice)
      } catch {}
    }

    setChartMounted(true)
  }, [])

  useEffect(() => {
    if (!chartMounted) return
    window.localStorage.setItem("novafunded-trades", JSON.stringify(trades))
  }, [chartMounted, trades])

  useEffect(() => {
    if (!chartMounted) return

    window.localStorage.setItem(
      "novafunded-trade-page-state",
      JSON.stringify({
        symbol,
        side,
        orderType,
        size,
        entry,
        confirmedEntry,
        stopLoss,
        confirmedStopLoss,
        takeProfit,
        confirmedTakeProfit,
        useStopLoss,
        useTakeProfit,
        livePrice,
      })
    )
  }, [
    chartMounted,
    confirmedEntry,
    confirmedStopLoss,
    confirmedTakeProfit,
    entry,
    livePrice,
    orderType,
    side,
    size,
    stopLoss,
    symbol,
    takeProfit,
    useStopLoss,
    useTakeProfit,
  ])

  useEffect(() => {
    window.localStorage.setItem("novafunded-trade-account", JSON.stringify(syncedAccount))
    window.dispatchEvent(new Event("novafunded-account-sync"))
  }, [syncedAccount])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const moveBase =
        symbol === "EURUSD" || symbol === "GBPUSD"
          ? 0.00035
          : symbol === "XAUUSD"
            ? 0.9
            : symbol === "NAS100"
              ? 10
              : 75

      const randomMove = (Math.random() - 0.5) * moveBase * 2.2
      setLivePrice((prev) => roundToStep(prev + randomMove, symbolMeta.minMove))
    }, 1400)

    return () => window.clearInterval(interval)
  }, [symbol, symbolMeta.minMove])

  useEffect(() => {
    setTrades((prev) => {
      let changed = false
      const now = Date.now()

      const next = prev.map((trade) => {
        if (trade.status === "pending") {
          const fill =
            trade.side === "buy"
              ? livePrice <= trade.requestedEntry
              : livePrice >= trade.requestedEntry

          if (!fill) return trade

          changed = true
          return {
            ...trade,
            status: "open" as const,
            entry: trade.requestedEntry,
            openedAt: now,
            pnl: computePnl({ ...trade, entry: trade.requestedEntry }, livePrice),
          }
        }

        if (trade.status === "open") {
          const runningPnl = computePnl(trade, livePrice)

          const hitTp =
            trade.useTakeProfit && trade.takeProfit !== null
              ? trade.side === "buy"
                ? livePrice >= trade.takeProfit
                : livePrice <= trade.takeProfit
              : false

          const hitSl =
            trade.useStopLoss && trade.stopLoss !== null
              ? trade.side === "buy"
                ? livePrice <= trade.stopLoss
                : livePrice >= trade.stopLoss
              : false

          if (isBreached) {
            changed = true
            return {
              ...trade,
              status: "closed" as const,
              closedAt: now,
              closePrice: livePrice,
              pnl: runningPnl,
              closeReason: "breach" as const,
            }
          }

          if (hitTp) {
            changed = true
            return {
              ...trade,
              status: "closed" as const,
              closedAt: now,
              closePrice: trade.takeProfit ?? livePrice,
              pnl: computePnl(trade, trade.takeProfit ?? livePrice),
              closeReason: "tp" as const,
            }
          }

          if (hitSl) {
            changed = true
            return {
              ...trade,
              status: "closed" as const,
              closedAt: now,
              closePrice: trade.stopLoss ?? livePrice,
              pnl: computePnl(trade, trade.stopLoss ?? livePrice),
              closeReason: "sl" as const,
            }
          }

          if (trade.pnl !== runningPnl) {
            changed = true
            return {
              ...trade,
              pnl: runningPnl,
            }
          }
        }

        return trade
      })

      return changed ? next : prev
    })
  }, [isBreached, livePrice])

  useEffect(() => {
    const base = symbolMeta.startPrice
    const step = symbolMeta.minMove

    setLivePrice(base)

    const defaults =
      side === "buy"
        ? {
            entry: base,
            stopLoss: base - symbolMeta.defaultRisk,
            takeProfit: base + symbolMeta.defaultReward,
          }
        : {
            entry: base,
            stopLoss: base + symbolMeta.defaultRisk,
            takeProfit: base - symbolMeta.defaultReward,
          }

    const normalized = normalizeLevels(
      side,
      orderType,
      base,
      defaults.entry,
      defaults.stopLoss,
      defaults.takeProfit,
      step,
      useStopLoss,
      useTakeProfit
    )

    setEntry(normalized.entry)
    setConfirmedEntry(orderType === "limit" ? normalized.entry : null)
    setStopLoss(normalized.stopLoss)
    setConfirmedStopLoss(useStopLoss ? normalized.stopLoss : null)
    setTakeProfit(normalized.takeProfit)
    setConfirmedTakeProfit(useTakeProfit ? normalized.takeProfit : null)
  }, [
    orderType,
    side,
    symbol,
    symbolMeta.defaultReward,
    symbolMeta.defaultRisk,
    symbolMeta.minMove,
    symbolMeta.startPrice,
    useStopLoss,
    useTakeProfit,
  ])

  useEffect(() => {
    if (!useStopLoss) {
      setConfirmedStopLoss(null)
    } else if (stopLoss !== null && confirmedStopLoss === null) {
      setConfirmedStopLoss(stopLoss)
    }
  }, [confirmedStopLoss, stopLoss, useStopLoss])

  useEffect(() => {
    if (!useTakeProfit) {
      setConfirmedTakeProfit(null)
    } else if (takeProfit !== null && confirmedTakeProfit === null) {
      setConfirmedTakeProfit(takeProfit)
    }
  }, [confirmedTakeProfit, takeProfit, useTakeProfit])

  function placeTrade() {
    if (isBreached) return

    const step = symbolMeta.minMove

    const entryToUse =
      orderType === "market"
        ? livePrice
        : confirmedEntry ?? entry

    const stopToUse =
      useStopLoss
        ? confirmedStopLoss ?? stopLoss
        : null

    const takeToUse =
      useTakeProfit
        ? confirmedTakeProfit ?? takeProfit
        : null

    const normalized = normalizeLevels(
      side,
      orderType,
      livePrice,
      entryToUse,
      stopToUse,
      takeToUse,
      step,
      useStopLoss,
      useTakeProfit
    )

    if (orderType === "limit") {
      setConfirmedEntry(normalized.entry)
    }
    setConfirmedStopLoss(normalized.stopLoss)
    setConfirmedTakeProfit(normalized.takeProfit)

    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol,
      side,
      orderType,
      requestedEntry: orderType === "market" ? livePrice : normalized.entry,
      entry: orderType === "market" ? livePrice : null,
      useStopLoss,
      useTakeProfit,
      stopLoss: normalized.stopLoss,
      takeProfit: normalized.takeProfit,
      size,
      status: orderType === "market" ? "open" : "pending",
      openedAt: orderType === "market" ? Date.now() : null,
      closedAt: null,
      closePrice: null,
      pnl: 0,
    }

    setTrades((prev) => [trade, ...prev])
  }

  function closeTradeManually(id: string) {
    setTrades((prev) =>
      prev.map((trade) => {
        if (trade.id !== id || trade.status !== "open") return trade

        return {
          ...trade,
          status: "closed",
          closedAt: Date.now(),
          closePrice: livePrice,
          pnl: computePnl(trade, livePrice),
          closeReason: "manual",
        }
      })
    )
  }

  function cancelPendingTrade(id: string) {
    setTrades((prev) =>
      prev.map((trade) => {
        if (trade.id !== id || trade.status !== "pending") return trade
        return { ...trade, status: "cancelled" }
      })
    )
  }

  function resetChallengeLocally() {
    setTrades([])
    setLivePrice(symbolMeta.startPrice)

    const defaults =
      side === "buy"
        ? {
            entry: symbolMeta.startPrice,
            stopLoss: symbolMeta.startPrice - symbolMeta.defaultRisk,
            takeProfit: symbolMeta.startPrice + symbolMeta.defaultReward,
          }
        : {
            entry: symbolMeta.startPrice,
            stopLoss: symbolMeta.startPrice + symbolMeta.defaultRisk,
            takeProfit: symbolMeta.startPrice - symbolMeta.defaultReward,
          }

    const normalized = normalizeLevels(
      side,
      orderType,
      symbolMeta.startPrice,
      defaults.entry,
      defaults.stopLoss,
      defaults.takeProfit,
      symbolMeta.minMove,
      useStopLoss,
      useTakeProfit
    )

    setEntry(normalized.entry)
    setConfirmedEntry(orderType === "limit" ? normalized.entry : null)
    setStopLoss(normalized.stopLoss)
    setConfirmedStopLoss(useStopLoss ? normalized.stopLoss : null)
    setTakeProfit(normalized.takeProfit)
    setConfirmedTakeProfit(useTakeProfit ? normalized.takeProfit : null)
  }

  function updateDraggedLevel(clientY: number, target: Exclude<DragTarget, null>) {
    if (!chartRef.current) return

    const rect = chartRef.current.getBoundingClientRect()
    const percent = ((clientY - rect.top) / rect.height) * 100
    const nextPrice = percentToPrice(
      percent,
      overlayRange.low,
      overlayRange.high,
      symbolMeta.minMove
    )

    const minGap = symbolMeta.minMove * (symbolMeta.minMove >= 1 ? 5 : 10)
    const referenceEntry = orderType === "market" ? livePrice : entry

    if (target === "entry") {
      if (orderType !== "limit") return

      let nextEntry = nextPrice

      if (side === "buy") {
        if (useStopLoss && stopLoss !== null) nextEntry = Math.max(nextEntry, stopLoss + minGap)
        if (useTakeProfit && takeProfit !== null) nextEntry = Math.min(nextEntry, takeProfit - minGap)
      } else {
        if (useStopLoss && stopLoss !== null) nextEntry = Math.min(nextEntry, stopLoss - minGap)
        if (useTakeProfit && takeProfit !== null) nextEntry = Math.max(nextEntry, takeProfit + minGap)
      }

      setEntry(roundToStep(nextEntry, symbolMeta.minMove))
      return
    }

    if (target === "tp") {
      if (!useTakeProfit) return

      if (side === "buy") {
        const minTp = referenceEntry + minGap
        setTakeProfit(roundToStep(Math.max(nextPrice, minTp), symbolMeta.minMove))
      } else {
        const maxTp = referenceEntry - minGap
        setTakeProfit(roundToStep(Math.min(nextPrice, maxTp), symbolMeta.minMove))
      }
      return
    }

    if (target === "sl") {
      if (!useStopLoss) return

      if (side === "buy") {
        const maxSl = referenceEntry - minGap
        setStopLoss(roundToStep(Math.min(nextPrice, maxSl), symbolMeta.minMove))
      } else {
        const minSl = referenceEntry + minGap
        setStopLoss(roundToStep(Math.max(nextPrice, minSl), symbolMeta.minMove))
      }
    }
  }

  useEffect(() => {
    if (!dragTarget) return

    const activeDragTarget = dragTarget

    function onMove(event: MouseEvent) {
      updateDraggedLevel(event.clientY, activeDragTarget)
    }

    function onUp() {
      setDragTarget(null)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [
    dragTarget,
    entry,
    livePrice,
    orderType,
    overlayRange.high,
    overlayRange.low,
    side,
    stopLoss,
    symbolMeta.minMove,
    takeProfit,
    useStopLoss,
    useTakeProfit,
  ])

  const previewEntry = orderType === "market" ? livePrice : entry
  const effectiveStopLoss = useStopLoss ? stopLoss : null
  const effectiveTakeProfit = useTakeProfit ? takeProfit : null

  const targetProgress = clamp((Math.max(balance - START_BALANCE, 0) / PROFIT_TARGET) * 100, 0, 100)

  const labelY = {
    entry: priceToPercent(previewEntry, overlayRange.low, overlayRange.high),
    sl:
      useStopLoss && stopLoss !== null
        ? priceToPercent(stopLoss, overlayRange.low, overlayRange.high)
        : null,
    tp:
      useTakeProfit && takeProfit !== null
        ? priceToPercent(takeProfit, overlayRange.low, overlayRange.high)
        : null,
  }

  const entryConfirmed =
    orderType === "market" || confirmedEntry === entry

  const tpConfirmed =
    !useTakeProfit ||
    (takeProfit !== null && confirmedTakeProfit === takeProfit)

  const slConfirmed =
    !useStopLoss ||
    (stopLoss !== null && confirmedStopLoss === stopLoss)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#08101d] p-5 shadow-2xl">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-400/70">
                NovaFunded
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Trade Terminal</h1>
              <p className="mt-2 text-sm text-white/50">
                Simulated execution with draggable overlay levels and challenge rules.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(SYMBOLS).map(([key]) => (
                <button
                  key={key}
                  onClick={() => setSymbol(key as keyof typeof SYMBOLS)}
                  className={`rounded-2xl border px-4 py-2 text-sm transition ${
                    symbol === key
                      ? "border-cyan-400/30 bg-cyan-400/15 text-cyan-300"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={chartRef}
            className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20"
          >
            <TradingViewChart symbol={symbol} />

            <ChartTradeOverlay
              enabled
              symbol={symbol}
              side={side}
              orderType={orderType}
              livePrice={livePrice}
              entry={previewEntry}
              stopLoss={effectiveStopLoss}
              takeProfit={effectiveTakeProfit}
              size={size}
            />

            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-28">
              <div
                className="pointer-events-auto absolute right-2 top-0 -translate-y-1/2"
                style={{ top: `${labelY.entry}%` }}
              >
                <button
                  onMouseDown={() => {
                    if (orderType === "limit") setDragTarget("entry")
                  }}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium shadow-lg backdrop-blur-sm ${
                    orderType === "limit"
                      ? entryConfirmed
                        ? "border border-cyan-400/40 bg-cyan-500/15 text-cyan-300"
                        : "border border-amber-400/40 bg-amber-500/15 text-amber-300"
                      : "border border-cyan-400/25 bg-cyan-500/10 text-cyan-300/80"
                  }`}
                >
                  Entry {formatPrice(previewEntry, symbol)}
                </button>
              </div>

              {useTakeProfit && takeProfit !== null && labelY.tp !== null ? (
                <div
                  className="pointer-events-auto absolute right-2 top-0 -translate-y-1/2"
                  style={{ top: `${labelY.tp}%` }}
                >
                  <button
                    onMouseDown={() => setDragTarget("tp")}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium shadow-lg backdrop-blur-sm ${
                      tpConfirmed
                        ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                        : "border border-amber-400/40 bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    TP {formatPrice(takeProfit, symbol)}
                  </button>
                </div>
              ) : null}

              {useStopLoss && stopLoss !== null && labelY.sl !== null ? (
                <div
                  className="pointer-events-auto absolute right-2 top-0 -translate-y-1/2"
                  style={{ top: `${labelY.sl}%` }}
                >
                  <button
                    onMouseDown={() => setDragTarget("sl")}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium shadow-lg backdrop-blur-sm ${
                      slConfirmed
                        ? "border border-red-400/40 bg-red-500/15 text-red-300"
                        : "border border-amber-400/40 bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    SL {formatPrice(stopLoss, symbol)}
                  </button>
                </div>
              ) : null}
            </div>

            {isBreached ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 backdrop-blur-[2px]">
                <div className="w-full max-w-md rounded-[26px] border border-red-400/20 bg-[#0f1118] p-6 text-center shadow-2xl">
                  <p className="text-xs uppercase tracking-[0.22em] text-red-300/70">
                    Account breached
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Trading is locked</h2>
                  <p className="mt-2 text-sm text-white/55">
                    This account can’t place new trades. Send users to checkout to buy another challenge.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <a
                      href="/checkout"
                      className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                    >
                      Buy New Account
                    </a>
                    <button
                      onClick={resetChallengeLocally}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      Reset Demo
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-white/45">Open</p>
              <p className="mt-2 text-2xl font-semibold text-white">{openTrades.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-white/45">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-white">{pendingTrades.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-white/45">Closed</p>
              <p className="mt-2 text-2xl font-semibold text-white">{closedTrades.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-white/45">Live Price</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">
                {formatPrice(livePrice, symbol)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[#08101d] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-400/70">
                  Order Ticket
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Place Trade</h2>
              </div>

              <div
                className={`rounded-full border px-3 py-1 text-xs ${
                  isBreached
                    ? "border-red-400/20 bg-red-500/10 text-red-300"
                    : isPassed
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {isBreached ? "Breached" : isPassed ? "Passed" : "On Track"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSide("buy")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  side === "buy"
                    ? "bg-emerald-500 text-black"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide("sell")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  side === "sell"
                    ? "bg-red-500 text-white"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                Sell
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderType("market")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  orderType === "market"
                    ? "border border-cyan-400/30 bg-cyan-400/15 text-cyan-300"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType("limit")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  orderType === "limit"
                    ? "border border-cyan-400/30 bg-cyan-400/15 text-cyan-300"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                Limit
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => setUseTakeProfit((prev) => !prev)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  useTakeProfit
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                    : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {useTakeProfit ? "TP Enabled" : "Enable TP"}
              </button>

              <button
                onClick={() => setUseStopLoss((prev) => !prev)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  useStopLoss
                    ? "border border-red-400/30 bg-red-500/15 text-red-300"
                    : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {useStopLoss ? "SL Enabled" : "Enable SL"}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/45">Size</span>
                  <span className="text-sm text-white">{size}</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[-5, -1, 1, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSize((prev) => Math.max(1, prev + value))}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      {value > 0 ? `+${value}` : value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/45">Entry</p>
                      <p className="mt-2 text-lg font-semibold text-cyan-300">
                        {formatPrice(previewEntry, symbol)}
                      </p>
                      <p className="mt-1 text-[11px] text-white/35">
                        {orderType === "market" ? "Tracks live price" : "Drag Entry label on chart"}
                      </p>
                    </div>

                    {orderType === "limit" ? (
                      <button
                        onClick={() => setConfirmedEntry(entry)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          entryConfirmed
                            ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                            : "border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15"
                        }`}
                      >
                        {entryConfirmed ? "Set" : "Set Entry"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/45">Live Price</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatPrice(livePrice, symbol)}
                  </p>
                  <p className="mt-1 text-[11px] text-white/35">{symbolMeta.label}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/45">Take Profit</p>
                      <p className="mt-2 text-lg font-semibold text-emerald-300">
                        {useTakeProfit && takeProfit !== null
                          ? formatPrice(takeProfit, symbol)
                          : "Disabled"}
                      </p>
                      <p className="mt-1 text-[11px] text-white/35">Drag TP label on chart</p>
                    </div>

                    {useTakeProfit && takeProfit !== null ? (
                      <button
                        onClick={() => setConfirmedTakeProfit(takeProfit)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          tpConfirmed
                            ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                            : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                        }`}
                      >
                        {tpConfirmed ? "Set" : "Set TP"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/45">Stop Loss</p>
                      <p className="mt-2 text-lg font-semibold text-red-300">
                        {useStopLoss && stopLoss !== null
                          ? formatPrice(stopLoss, symbol)
                          : "Disabled"}
                      </p>
                      <p className="mt-1 text-[11px] text-white/35">Drag SL label on chart</p>
                    </div>

                    {useStopLoss && stopLoss !== null ? (
                      <button
                        onClick={() => setConfirmedStopLoss(stopLoss)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          slConfirmed
                            ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                            : "border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/15"
                        }`}
                      >
                        {slConfirmed ? "Set" : "Set SL"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                onClick={placeTrade}
                disabled={isBreached}
                className={`w-full rounded-2xl px-4 py-4 text-sm font-semibold transition ${
                  isBreached
                    ? "cursor-not-allowed border border-red-400/20 bg-red-500/10 text-red-300"
                    : side === "buy"
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "bg-red-500 text-white hover:bg-red-400"
                }`}
              >
                {isBreached
                  ? "Trading Locked"
                  : orderType === "market"
                    ? `Place ${side === "buy" ? "Buy" : "Sell"} Market`
                    : `Confirm ${side === "buy" ? "Buy" : "Sell"} Limit`}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#08101d] p-5 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-400/70">
              Account Snapshot
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/45">Balance</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  $
                  {balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/45">Equity</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  $
                  {equity.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/45">Net PnL</p>
                <p
                  className={`mt-2 text-2xl font-semibold ${
                    netPnl >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {netPnl >= 0 ? "+" : ""}${netPnl.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/45">Drawdown Left</p>
                <p
                  className={`mt-2 text-2xl font-semibold ${
                    drawdownLeft > 0 ? "text-white" : "text-red-300"
                  }`}
                >
                  ${drawdownLeft.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/45">Daily Loss Left</p>
                <p
                  className={`mt-2 text-2xl font-semibold ${
                    dailyLossLeft > 0 ? "text-white" : "text-red-300"
                  }`}
                >
                  ${dailyLossLeft.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/45">Target Progress</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {targetProgress.toFixed(0)}%
                </p>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-[#08101d] p-5 shadow-2xl">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-400/70">
              Open + Pending
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">Trade Queue</h3>
          </div>

          <div className="space-y-3">
            {[...openTrades, ...pendingTrades].length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/50">
                No open or pending trades yet.
              </div>
            ) : (
              [...openTrades, ...pendingTrades].map((trade) => (
                <div
                  key={trade.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{trade.symbol}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] uppercase ${
                            trade.side === "buy"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {trade.side}
                        </span>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase text-white/50">
                          {trade.status}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-white/45">
                        {trade.orderType} • size {trade.size}
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white/70">
                        <div>
                          Entry: {formatPrice(trade.entry ?? trade.requestedEntry, trade.symbol)}
                        </div>
                        <div>
                          TP:{" "}
                          {trade.takeProfit !== null
                            ? formatPrice(trade.takeProfit, trade.symbol)
                            : "Disabled"}
                        </div>
                        <div>
                          SL:{" "}
                          {trade.stopLoss !== null
                            ? formatPrice(trade.stopLoss, trade.symbol)
                            : "Disabled"}
                        </div>
                        <div className={trade.pnl >= 0 ? "text-emerald-300" : "text-red-300"}>
                          PnL: {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {trade.status === "open" ? (
                      <button
                        onClick={() => closeTradeManually(trade.id)}
                        className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/15"
                      >
                        Close
                      </button>
                    ) : trade.status === "pending" ? (
                      <button
                        onClick={() => cancelPendingTrade(trade.id)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#08101d] p-5 shadow-2xl">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-400/70">
              Trade History
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">Closed Trades</h3>
          </div>

          <div className="space-y-3">
            {closedTrades.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/50">
                No closed trades yet.
              </div>
            ) : (
              closedTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{trade.symbol}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] uppercase ${
                            trade.side === "buy"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {trade.side}
                        </span>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase text-white/50">
                          {trade.closeReason ?? "closed"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white/70">
                        <div>
                          Entry: {formatPrice(trade.entry ?? trade.requestedEntry, trade.symbol)}
                        </div>
                        <div>
                          Exit:{" "}
                          {formatPrice(
                            trade.closePrice ?? (trade.entry ?? trade.requestedEntry),
                            trade.symbol
                          )}
                        </div>
                        <div>
                          TP:{" "}
                          {trade.takeProfit !== null
                            ? formatPrice(trade.takeProfit, trade.symbol)
                            : "Disabled"}
                        </div>
                        <div>
                          SL:{" "}
                          {trade.stopLoss !== null
                            ? formatPrice(trade.stopLoss, trade.symbol)
                            : "Disabled"}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-right text-lg font-semibold ${
                        trade.pnl >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
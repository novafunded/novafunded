"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import TradingViewChart from "@/components/dashboard/TradingViewChart"
import ChartTradeOverlay from "@/components/dashboard/ChartTradeOverlay"

type OrderSide = "buy" | "sell"
type OrderType = "market" | "limit"
type TradeStatus = "pending" | "open" | "closed" | "cancelled"
type CloseReason = "tp" | "sl" | "manual" | "breach"
type DragTarget = "entry" | "tp" | "sl" | null

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

type LevelLocks = {
  entry: boolean
  tp: boolean
  sl: boolean
}

const SYMBOLS: Record<
  string,
  {
    label: string
    startPrice: number
    minMove: number
    defaultRisk: number
    defaultReward: number
    pnlPerPoint: number
    maxSize: number
  }
> = {
  XAUUSD: {
    label: "Gold",
    startPrice: 2165.4,
    minMove: 0.1,
    defaultRisk: 25,
    defaultReward: 60,
    pnlPerPoint: 1.2,
    maxSize: 25,
  },
  EURUSD: {
    label: "Euro / US Dollar",
    startPrice: 1.0842,
    minMove: 0.0001,
    defaultRisk: 0.01,
    defaultReward: 0.02,
    pnlPerPoint: 1000,
    maxSize: 20,
  },
  GBPUSD: {
    label: "British Pound / US Dollar",
    startPrice: 1.2718,
    minMove: 0.0001,
    defaultRisk: 0.01,
    defaultReward: 0.02,
    pnlPerPoint: 1000,
    maxSize: 20,
  },
  NAS100: {
    label: "Nasdaq 100",
    startPrice: 18125,
    minMove: 1,
    defaultRisk: 50,
    defaultReward: 120,
    pnlPerPoint: 0.7,
    maxSize: 15,
  },
  BTCUSD: {
    label: "Bitcoin",
    startPrice: 68169,
    minMove: 1,
    defaultRisk: 400,
    defaultReward: 1200,
    pnlPerPoint: 0.08,
    maxSize: 10,
  },
}

const START_BALANCE = 5000
const MAX_LOSS_LIMIT = 500
const DAILY_LOSS_LIMIT = 250
const PROFIT_TARGET = 400

function getStepDecimals(step: number) {
  const stepText = step.toString()
  if (!stepText.includes(".")) return 0
  return stepText.split(".")[1]?.length ?? 0
}

function roundToStep(value: number, step: number) {
  const rounded = Math.round(value / step) * step
  const decimals = getStepDecimals(step)
  return Number(rounded.toFixed(decimals))
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
  const raw = high - (safePercent / 100) * (high - low)
  return roundToStep(raw, step)
}

function computePnl(
  trade: Pick<Trade, "entry" | "requestedEntry" | "side" | "size" | "symbol">,
  price: number
) {
  const filledEntry = trade.entry ?? trade.requestedEntry
  const diff = trade.side === "buy" ? price - filledEntry : filledEntry - price
  const meta = SYMBOLS[trade.symbol]
  return Number((diff * trade.size * meta.pnlPerPoint).toFixed(2))
}

function getMinGap(step: number) {
  return step * (step >= 1 ? 5 : 10)
}

function buildDefaultLevels(
  side: OrderSide,
  base: number,
  risk: number,
  reward: number,
  step: number
) {
  const rawEntry = roundToStep(base, step)

  if (side === "buy") {
    return {
      entry: rawEntry,
      stopLoss: roundToStep(rawEntry - risk, step),
      takeProfit: roundToStep(rawEntry + reward, step),
    }
  }

  return {
    entry: rawEntry,
    stopLoss: roundToStep(rawEntry + risk, step),
    takeProfit: roundToStep(rawEntry - reward, step),
  }
}

function normalizeDraftLevels(params: {
  side: OrderSide
  orderType: OrderType
  livePrice: number
  entry: number
  stopLoss: number | null
  takeProfit: number | null
  step: number
  useStopLoss: boolean
  useTakeProfit: boolean
}) {
  const {
    side,
    orderType,
    livePrice,
    entry,
    stopLoss,
    takeProfit,
    step,
    useStopLoss,
    useTakeProfit,
  } = params

  const minGap = getMinGap(step)
  const effectiveEntry =
    orderType === "market" ? roundToStep(livePrice, step) : roundToStep(entry, step)

  let nextStop = useStopLoss ? roundToStep(stopLoss ?? effectiveEntry, step) : null
  let nextTake = useTakeProfit ? roundToStep(takeProfit ?? effectiveEntry, step) : null

  if (side === "buy") {
    if (nextStop !== null) nextStop = Math.min(nextStop, effectiveEntry - minGap)
    if (nextTake !== null) nextTake = Math.max(nextTake, effectiveEntry + minGap)
  } else {
    if (nextStop !== null) nextStop = Math.max(nextStop, effectiveEntry + minGap)
    if (nextTake !== null) nextTake = Math.min(nextTake, effectiveEntry - minGap)
  }

  return {
    entry: effectiveEntry,
    stopLoss: nextStop,
    takeProfit: nextTake,
  }
}

function getValidLimitEntry(side: OrderSide, livePrice: number, entry: number, step: number) {
  const minGap = getMinGap(step)

  if (side === "buy") {
    return Math.min(roundToStep(entry, step), roundToStep(livePrice - minGap, step))
  }

  return Math.max(roundToStep(entry, step), roundToStep(livePrice + minGap, step))
}

export default function TradePage() {
  const [symbol, setSymbol] = useState<keyof typeof SYMBOLS>("BTCUSD")
  const [side, setSide] = useState<OrderSide>("buy")
  const [orderType, setOrderType] = useState<OrderType>("market")
  const [size, setSize] = useState(5)

  const symbolMeta = SYMBOLS[symbol]

  const [livePrice, setLivePrice] = useState(SYMBOLS.BTCUSD.startPrice)

  const [entry, setEntry] = useState(SYMBOLS.BTCUSD.startPrice)
  const [stopLoss, setStopLoss] = useState<number | null>(SYMBOLS.BTCUSD.startPrice - 400)
  const [takeProfit, setTakeProfit] = useState<number | null>(SYMBOLS.BTCUSD.startPrice + 1200)

  const [useStopLoss, setUseStopLoss] = useState(true)
  const [useTakeProfit, setUseTakeProfit] = useState(true)

  const [levelLocks, setLevelLocks] = useState<LevelLocks>({
    entry: false,
    tp: false,
    sl: false,
  })

  const [trades, setTrades] = useState<Trade[]>([])
  const [dragTarget, setDragTarget] = useState<DragTarget>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  const chartRef = useRef<HTMLDivElement | null>(null)
  const frozenDragRangeRef = useRef<{ low: number; high: number } | null>(null)

  const balance = useMemo(() => {
    const closedPnl = trades
      .filter((trade) => trade.status === "closed")
      .reduce((sum, trade) => sum + trade.pnl, 0)

    return Number((START_BALANCE + closedPnl).toFixed(2))
  }, [trades])

  const floatingPnl = useMemo(() => {
    return Number(
      trades
        .filter((trade) => trade.status === "open")
        .reduce((sum, trade) => sum + computePnl(trade, livePrice), 0)
        .toFixed(2)
    )
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

  const previewEntry =
    orderType === "market"
      ? roundToStep(livePrice, symbolMeta.minMove)
      : getValidLimitEntry(side, livePrice, entry, symbolMeta.minMove)

  const effectiveStopLoss = useStopLoss ? stopLoss : null
  const effectiveTakeProfit = useTakeProfit ? takeProfit : null

  const overlayRangeBase = useMemo(() => {
    const values: number[] = [livePrice, previewEntry]

    if (effectiveStopLoss !== null) values.push(effectiveStopLoss)
    if (effectiveTakeProfit !== null) values.push(effectiveTakeProfit)

    for (const trade of trades) {
      values.push(trade.requestedEntry)
      values.push(trade.entry ?? trade.requestedEntry)
      if (trade.stopLoss !== null) values.push(trade.stopLoss)
      if (trade.takeProfit !== null) values.push(trade.takeProfit)
      if (trade.closePrice !== null) values.push(trade.closePrice)
    }

    return getChartRange(values, symbol)
  }, [effectiveStopLoss, effectiveTakeProfit, livePrice, previewEntry, symbol, trades])

  const activeOverlayRange =
    dragTarget && frozenDragRangeRef.current ? frozenDragRangeRef.current : overlayRangeBase

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

  function resetSetup(next?: Partial<{
    nextSymbol: keyof typeof SYMBOLS
    nextSide: OrderSide
    nextOrderType: OrderType
    keepLivePrice: boolean
  }>) {
    const selectedSymbol = next?.nextSymbol ?? symbol
    const selectedSide = next?.nextSide ?? side
    const selectedOrderType = next?.nextOrderType ?? orderType
    const meta = SYMBOLS[selectedSymbol]
    const base = next?.keepLivePrice ? livePrice : meta.startPrice

    const defaults = buildDefaultLevels(
      selectedSide,
      base,
      meta.defaultRisk,
      meta.defaultReward,
      meta.minMove
    )

    const validEntry =
      selectedOrderType === "limit"
        ? getValidLimitEntry(selectedSide, base, defaults.entry, meta.minMove)
        : defaults.entry

    const normalized = normalizeDraftLevels({
      side: selectedSide,
      orderType: selectedOrderType,
      livePrice: base,
      entry: validEntry,
      stopLoss: defaults.stopLoss,
      takeProfit: defaults.takeProfit,
      step: meta.minMove,
      useStopLoss,
      useTakeProfit,
    })

    if (!next?.keepLivePrice) {
      setLivePrice(meta.startPrice)
    }

    setEntry(selectedOrderType === "limit" ? validEntry : normalized.entry)
    setStopLoss(normalized.stopLoss)
    setTakeProfit(normalized.takeProfit)
    setLevelLocks({
      entry: selectedOrderType === "market",
      tp: false,
      sl: false,
    })
    setDragTarget(null)
    frozenDragRangeRef.current = null
  }

  useEffect(() => {
    const savedTrades = window.localStorage.getItem("novafunded-trades")
    const savedState = window.localStorage.getItem("novafunded-trade-page-state-v3")

    if (savedTrades) {
      try {
        setTrades(JSON.parse(savedTrades) as Trade[])
      } catch {
        // ignore bad local data
      }
    }

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as Partial<{
          symbol: keyof typeof SYMBOLS
          side: OrderSide
          orderType: OrderType
          size: number
          entry: number
          stopLoss: number | null
          takeProfit: number | null
          useStopLoss: boolean
          useTakeProfit: boolean
          livePrice: number
          levelLocks: LevelLocks
        }>

        const nextSymbol = parsed.symbol && SYMBOLS[parsed.symbol] ? parsed.symbol : "BTCUSD"
        const nextSide = parsed.side ?? "buy"
        const nextOrderType = parsed.orderType ?? "market"

        setSymbol(nextSymbol)
        setSide(nextSide)
        setOrderType(nextOrderType)

        if (typeof parsed.size === "number") {
          setSize(clamp(Math.round(parsed.size), 1, SYMBOLS[nextSymbol].maxSize))
        }

        if (typeof parsed.useStopLoss === "boolean") setUseStopLoss(parsed.useStopLoss)
        if (typeof parsed.useTakeProfit === "boolean") setUseTakeProfit(parsed.useTakeProfit)
        if (typeof parsed.livePrice === "number") setLivePrice(parsed.livePrice)

        const baseDefaults = buildDefaultLevels(
          nextSide,
          SYMBOLS[nextSymbol].startPrice,
          SYMBOLS[nextSymbol].defaultRisk,
          SYMBOLS[nextSymbol].defaultReward,
          SYMBOLS[nextSymbol].minMove
        )

        const restoredEntry =
          typeof parsed.entry === "number" ? parsed.entry : baseDefaults.entry

        setEntry(
          nextOrderType === "limit"
            ? getValidLimitEntry(
                nextSide,
                typeof parsed.livePrice === "number"
                  ? parsed.livePrice
                  : SYMBOLS[nextSymbol].startPrice,
                restoredEntry,
                SYMBOLS[nextSymbol].minMove
              )
            : restoredEntry
        )

        setStopLoss(
          parsed.stopLoss === null || typeof parsed.stopLoss === "number"
            ? parsed.stopLoss
            : baseDefaults.stopLoss
        )

        setTakeProfit(
          parsed.takeProfit === null || typeof parsed.takeProfit === "number"
            ? parsed.takeProfit
            : baseDefaults.takeProfit
        )

        setLevelLocks(
          parsed.levelLocks ?? {
            entry: nextOrderType === "market",
            tp: false,
            sl: false,
          }
        )
      } catch {
        resetSetup({
          nextSymbol: "BTCUSD",
          nextSide: "buy",
          nextOrderType: "market",
        })
      }
    } else {
      resetSetup({
        nextSymbol: "BTCUSD",
        nextSide: "buy",
        nextOrderType: "market",
      })
    }

    setIsHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    window.localStorage.setItem("novafunded-trades", JSON.stringify(trades))
  }, [isHydrated, trades])

  useEffect(() => {
    if (!isHydrated) return

    window.localStorage.setItem(
      "novafunded-trade-page-state-v3",
      JSON.stringify({
        symbol,
        side,
        orderType,
        size,
        entry,
        stopLoss,
        takeProfit,
        useStopLoss,
        useTakeProfit,
        livePrice,
        levelLocks,
      })
    )
  }, [
    isHydrated,
    symbol,
    side,
    orderType,
    size,
    entry,
    stopLoss,
    takeProfit,
    useStopLoss,
    useTakeProfit,
    livePrice,
    levelLocks,
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
          const shouldFill =
            trade.side === "buy"
              ? livePrice <= trade.requestedEntry
              : livePrice >= trade.requestedEntry

          if (!shouldFill) return trade

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
    if (!useStopLoss) {
      setStopLoss(null)
      setLevelLocks((prev) => ({ ...prev, sl: true }))
    } else {
      if (stopLoss === null) {
        const defaults = buildDefaultLevels(
          side,
          orderType === "market" ? livePrice : previewEntry,
          symbolMeta.defaultRisk,
          symbolMeta.defaultReward,
          symbolMeta.minMove
        )
        setStopLoss(defaults.stopLoss)
      }
      setLevelLocks((prev) => ({ ...prev, sl: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useStopLoss])

  useEffect(() => {
    if (!useTakeProfit) {
      setTakeProfit(null)
      setLevelLocks((prev) => ({ ...prev, tp: true }))
    } else {
      if (takeProfit === null) {
        const defaults = buildDefaultLevels(
          side,
          orderType === "market" ? livePrice : previewEntry,
          symbolMeta.defaultRisk,
          symbolMeta.defaultReward,
          symbolMeta.minMove
        )
        setTakeProfit(defaults.takeProfit)
      }
      setLevelLocks((prev) => ({ ...prev, tp: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useTakeProfit])

  function handleSymbolChange(nextSymbol: keyof typeof SYMBOLS) {
    setSymbol(nextSymbol)
    setSize((prev) => clamp(prev, 1, SYMBOLS[nextSymbol].maxSize))
    resetSetup({
      nextSymbol,
      nextSide: side,
      nextOrderType: orderType,
    })
  }

  function handleSideChange(nextSide: OrderSide) {
    setSide(nextSide)
    resetSetup({
      nextSymbol: symbol,
      nextSide,
      nextOrderType: orderType,
    })
  }

  function handleOrderTypeChange(nextOrderType: OrderType) {
    setOrderType(nextOrderType)
    resetSetup({
      nextSymbol: symbol,
      nextSide: side,
      nextOrderType,
      keepLivePrice: true,
    })
  }

  function lockEntry() {
    if (orderType !== "limit" || isBreached) return

    const validEntry = getValidLimitEntry(side, livePrice, entry, symbolMeta.minMove)

    const normalized = normalizeDraftLevels({
      side,
      orderType,
      livePrice,
      entry: validEntry,
      stopLoss,
      takeProfit,
      step: symbolMeta.minMove,
      useStopLoss,
      useTakeProfit,
    })

    setEntry(normalized.entry)
    if (useStopLoss) setStopLoss(normalized.stopLoss)
    if (useTakeProfit) setTakeProfit(normalized.takeProfit)
    setLevelLocks((prev) => ({ ...prev, entry: true }))
  }

  function lockTp() {
    if (!useTakeProfit || takeProfit === null || isBreached) return

    const normalized = normalizeDraftLevels({
      side,
      orderType,
      livePrice,
      entry: previewEntry,
      stopLoss,
      takeProfit,
      step: symbolMeta.minMove,
      useStopLoss,
      useTakeProfit,
    })

    setEntry(normalized.entry)
    setTakeProfit(normalized.takeProfit)
    if (useStopLoss) setStopLoss(normalized.stopLoss)
    setLevelLocks((prev) => ({ ...prev, tp: true }))
  }

  function lockSl() {
    if (!useStopLoss || stopLoss === null || isBreached) return

    const normalized = normalizeDraftLevels({
      side,
      orderType,
      livePrice,
      entry: previewEntry,
      stopLoss,
      takeProfit,
      step: symbolMeta.minMove,
      useStopLoss,
      useTakeProfit,
    })

    setEntry(normalized.entry)
    setStopLoss(normalized.stopLoss)
    if (useTakeProfit) setTakeProfit(normalized.takeProfit)
    setLevelLocks((prev) => ({ ...prev, sl: true }))
  }

  function unlockAllLevels() {
    if (isBreached) return

    setLevelLocks({
      entry: orderType === "market",
      tp: !useTakeProfit,
      sl: !useStopLoss,
    })
  }

  function placeTrade() {
    if (isBreached) return

    const clampedSize = clamp(size, 1, symbolMeta.maxSize)

    if (orderType === "limit") {
      const needsEntry = !levelLocks.entry
      const needsTp = useTakeProfit && !levelLocks.tp
      const needsSl = useStopLoss && !levelLocks.sl

      if (needsEntry || needsTp || needsSl) return
    }

    const normalized = normalizeDraftLevels({
      side,
      orderType,
      livePrice,
      entry: previewEntry,
      stopLoss,
      takeProfit,
      step: symbolMeta.minMove,
      useStopLoss,
      useTakeProfit,
    })

    const requestedEntry =
      orderType === "market"
        ? roundToStep(livePrice, symbolMeta.minMove)
        : getValidLimitEntry(side, livePrice, normalized.entry, symbolMeta.minMove)

    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol,
      side,
      orderType,
      requestedEntry,
      entry: orderType === "market" ? requestedEntry : null,
      useStopLoss,
      useTakeProfit,
      stopLoss: normalized.stopLoss,
      takeProfit: normalized.takeProfit,
      size: clampedSize,
      status: orderType === "market" ? "open" : "pending",
      openedAt: orderType === "market" ? Date.now() : null,
      closedAt: null,
      closePrice: null,
      pnl: 0,
    }

    setTrades((prev) => [trade, ...prev])

    resetSetup({
      nextSymbol: symbol,
      nextSide: side,
      nextOrderType: orderType,
      keepLivePrice: true,
    })
  }

  function closeTradeManually(id: string) {
    if (isBreached) return

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
    if (isBreached) return

    setTrades((prev) =>
      prev.map((trade) => {
        if (trade.id !== id || trade.status !== "pending") return trade
        return { ...trade, status: "cancelled" }
      })
    )
  }

  function updateDraggedLevel(clientY: number, target: Exclude<DragTarget, null>) {
    if (!chartRef.current || isBreached) return

    const rect = chartRef.current.getBoundingClientRect()
    const percent = ((clientY - rect.top) / rect.height) * 100
    const activeRange = frozenDragRangeRef.current ?? activeOverlayRange
    const rawPrice = percentToPrice(percent, activeRange.low, activeRange.high, symbolMeta.minMove)
    const minGap = getMinGap(symbolMeta.minMove)

    const currentEntry =
      orderType === "market" ? roundToStep(livePrice, symbolMeta.minMove) : previewEntry

    if (target === "entry") {
      if (orderType !== "limit" || levelLocks.entry) return

      let nextEntry = rawPrice

      if (side === "buy") {
        nextEntry = Math.min(nextEntry, livePrice - minGap)
        if (useStopLoss && stopLoss !== null) nextEntry = Math.max(nextEntry, stopLoss + minGap)
        if (useTakeProfit && takeProfit !== null) nextEntry = Math.min(nextEntry, takeProfit - minGap)
      } else {
        nextEntry = Math.max(nextEntry, livePrice + minGap)
        if (useStopLoss && stopLoss !== null) nextEntry = Math.min(nextEntry, stopLoss - minGap)
        if (useTakeProfit && takeProfit !== null) nextEntry = Math.max(nextEntry, takeProfit + minGap)
      }

      setEntry(roundToStep(nextEntry, symbolMeta.minMove))
      return
    }

    if (target === "tp") {
      if (!useTakeProfit || takeProfit === null || levelLocks.tp) return

      if (side === "buy") {
        const minTp = currentEntry + minGap
        setTakeProfit(roundToStep(Math.max(rawPrice, minTp), symbolMeta.minMove))
      } else {
        const maxTp = currentEntry - minGap
        setTakeProfit(roundToStep(Math.min(rawPrice, maxTp), symbolMeta.minMove))
      }
      return
    }

    if (target === "sl") {
      if (!useStopLoss || stopLoss === null || levelLocks.sl) return

      if (side === "buy") {
        const maxSl = currentEntry - minGap
        setStopLoss(roundToStep(Math.min(rawPrice, maxSl), symbolMeta.minMove))
      } else {
        const minSl = currentEntry + minGap
        setStopLoss(roundToStep(Math.max(rawPrice, minSl), symbolMeta.minMove))
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
      frozenDragRangeRef.current = null
      setDragTarget(null)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [dragTarget, activeOverlayRange, symbolMeta.minMove, livePrice, previewEntry, orderType, side, levelLocks, useStopLoss, useTakeProfit, isBreached])

  const targetProgress = clamp(
    (Math.max(balance - START_BALANCE, 0) / PROFIT_TARGET) * 100,
    0,
    100
  )

  const labelY = {
    entry: priceToPercent(previewEntry, activeOverlayRange.low, activeOverlayRange.high),
    sl:
      effectiveStopLoss !== null
        ? priceToPercent(effectiveStopLoss, activeOverlayRange.low, activeOverlayRange.high)
        : null,
    tp:
      effectiveTakeProfit !== null
        ? priceToPercent(effectiveTakeProfit, activeOverlayRange.low, activeOverlayRange.high)
        : null,
  }

  const limitReady =
    orderType === "market" ||
    (levelLocks.entry && (!useTakeProfit || levelLocks.tp) && (!useStopLoss || levelLocks.sl))

  const riskPerTrade =
    useStopLoss && effectiveStopLoss !== null
      ? Number(
          (
            Math.abs(previewEntry - effectiveStopLoss) *
            size *
            symbolMeta.pnlPerPoint
          ).toFixed(2)
        )
      : null

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
                Stable levels, safer trade math, valid limit behavior.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(SYMBOLS).map(([key]) => (
                <button
                  key={key}
                  onClick={() => handleSymbolChange(key as keyof typeof SYMBOLS)}
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
              chartLow={activeOverlayRange.low}
              chartHigh={activeOverlayRange.high}
              size={size}
            />

            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-28">
              <div
                className="pointer-events-auto absolute right-2 top-0 -translate-y-1/2"
                style={{ top: `${labelY.entry}%` }}
              >
                <button
                  onMouseDown={() => {
                    if (isBreached) return
                    if (orderType === "limit" && !levelLocks.entry) {
                      frozenDragRangeRef.current = overlayRangeBase
                      setDragTarget("entry")
                    }
                  }}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium shadow-lg backdrop-blur-sm ${
                    orderType === "market"
                      ? "border border-cyan-400/25 bg-cyan-500/10 text-cyan-300/80"
                      : levelLocks.entry
                        ? "border border-cyan-400/40 bg-cyan-500/15 text-cyan-300"
                        : "border border-amber-400/40 bg-amber-500/15 text-amber-300"
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
                    onMouseDown={() => {
                      if (isBreached) return
                      if (!levelLocks.tp) {
                        frozenDragRangeRef.current = overlayRangeBase
                        setDragTarget("tp")
                      }
                    }}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium shadow-lg backdrop-blur-sm ${
                      levelLocks.tp
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
                    onMouseDown={() => {
                      if (isBreached) return
                      if (!levelLocks.sl) {
                        frozenDragRangeRef.current = overlayRangeBase
                        setDragTarget("sl")
                      }
                    }}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium shadow-lg backdrop-blur-sm ${
                      levelLocks.sl
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
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/40">
                      Reset Disabled
                    </div>
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
                onClick={() => handleSideChange("buy")}
                disabled={isBreached}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  side === "buy"
                    ? "bg-emerald-500 text-black"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                } ${isBreached ? "cursor-not-allowed opacity-60" : ""}`}
              >
                Buy
              </button>
              <button
                onClick={() => handleSideChange("sell")}
                disabled={isBreached}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  side === "sell"
                    ? "bg-red-500 text-white"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                } ${isBreached ? "cursor-not-allowed opacity-60" : ""}`}
              >
                Sell
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOrderTypeChange("market")}
                disabled={isBreached}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  orderType === "market"
                    ? "border border-cyan-400/30 bg-cyan-400/15 text-cyan-300"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                } ${isBreached ? "cursor-not-allowed opacity-60" : ""}`}
              >
                Market
              </button>
              <button
                onClick={() => handleOrderTypeChange("limit")}
                disabled={isBreached}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  orderType === "limit"
                    ? "border border-cyan-400/30 bg-cyan-400/15 text-cyan-300"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                } ${isBreached ? "cursor-not-allowed opacity-60" : ""}`}
              >
                Limit
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => setUseTakeProfit((prev) => !prev)}
                disabled={isBreached}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  useTakeProfit
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                    : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                } ${isBreached ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {useTakeProfit ? "TP Enabled" : "Enable TP"}
              </button>

              <button
                onClick={() => setUseStopLoss((prev) => !prev)}
                disabled={isBreached}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  useStopLoss
                    ? "border border-red-400/30 bg-red-500/15 text-red-300"
                    : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                } ${isBreached ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {useStopLoss ? "SL Enabled" : "Enable SL"}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/45">Size</span>
                  <span className="text-sm text-white">
                    {size} / max {symbolMeta.maxSize}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[-5, -1, 1, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() =>
                        setSize((prev) =>
                          clamp(prev + value, 1, symbolMeta.maxSize)
                        )
                      }
                      disabled={isBreached}
                      className={`rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white ${
                        isBreached ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    >
                      {value > 0 ? `+${value}` : value}
                    </button>
                  ))}
                </div>

                {riskPerTrade !== null ? (
                  <p className="mt-3 text-xs text-white/45">
                    Estimated max loss at SL:{" "}
                    <span className="text-white">${riskPerTrade.toFixed(2)}</span>
                  </p>
                ) : null}
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
                        {orderType === "market"
                          ? "Tracks live price"
                          : levelLocks.entry
                            ? "Locked"
                            : "Drag on chart, then lock"}
                      </p>
                    </div>

                    {orderType === "limit" ? (
                      <button
                        onClick={lockEntry}
                        disabled={levelLocks.entry || isBreached}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          levelLocks.entry
                            ? "cursor-not-allowed border border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                            : "border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15"
                        } ${isBreached ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        {levelLocks.entry ? "Locked" : "Lock Entry"}
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
                      <p className="mt-1 text-[11px] text-white/35">
                        {!useTakeProfit
                          ? "Disabled"
                          : levelLocks.tp
                            ? "Locked"
                            : "Drag on chart, then lock"}
                      </p>
                    </div>

                    {useTakeProfit && takeProfit !== null ? (
                      <button
                        onClick={lockTp}
                        disabled={levelLocks.tp || isBreached}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          levelLocks.tp
                            ? "cursor-not-allowed border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                            : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                        } ${isBreached ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        {levelLocks.tp ? "Locked" : "Lock TP"}
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
                      <p className="mt-1 text-[11px] text-white/35">
                        {!useStopLoss
                          ? "Disabled"
                          : levelLocks.sl
                            ? "Locked"
                            : "Drag on chart, then lock"}
                      </p>
                    </div>

                    {useStopLoss && stopLoss !== null ? (
                      <button
                        onClick={lockSl}
                        disabled={levelLocks.sl || isBreached}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          levelLocks.sl
                            ? "cursor-not-allowed border border-red-400/30 bg-red-500/10 text-red-300"
                            : "border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/15"
                        } ${isBreached ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        {levelLocks.sl ? "Locked" : "Lock SL"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {orderType === "limit" ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Limit workflow</p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <div
                      className={`rounded-xl px-3 py-2 ${
                        levelLocks.entry
                          ? "bg-cyan-500/15 text-cyan-300"
                          : "bg-white/5 text-white/45"
                      }`}
                    >
                      Entry
                    </div>
                    <div
                      className={`rounded-xl px-3 py-2 ${
                        !useTakeProfit || levelLocks.tp
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/5 text-white/45"
                      }`}
                    >
                      TP
                    </div>
                    <div
                      className={`rounded-xl px-3 py-2 ${
                        !useStopLoss || levelLocks.sl
                          ? "bg-red-500/15 text-red-300"
                          : "bg-white/5 text-white/45"
                      }`}
                    >
                      SL
                    </div>
                    <div
                      className={`rounded-xl px-3 py-2 ${
                        limitReady
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-white/5 text-white/45"
                      }`}
                    >
                      Confirm
                    </div>
                  </div>

                  <button
                    onClick={unlockAllLevels}
                    disabled={isBreached}
                    className={`mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white ${
                      isBreached ? "cursor-not-allowed opacity-60" : ""
                    }`}
                  >
                    Edit Levels
                  </button>
                </div>
              ) : null}

              <button
                onClick={placeTrade}
                disabled={isBreached || !limitReady}
                className={`w-full rounded-2xl px-4 py-4 text-sm font-semibold transition ${
                  isBreached
                    ? "cursor-not-allowed border border-red-400/20 bg-red-500/10 text-red-300"
                    : !limitReady
                      ? "cursor-not-allowed border border-amber-400/20 bg-amber-500/10 text-amber-300"
                      : side === "buy"
                        ? "bg-emerald-500 text-black hover:bg-emerald-400"
                        : "bg-red-500 text-white hover:bg-red-400"
                }`}
              >
                {isBreached
                  ? "Trading Locked"
                  : orderType === "market"
                    ? `Place ${side === "buy" ? "Buy" : "Sell"} Market`
                    : limitReady
                      ? `Confirm ${side === "buy" ? "Buy" : "Sell"} Limit`
                      : "Lock Entry / TP / SL First"}
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
                        disabled={isBreached}
                        className={`rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 ${
                          isBreached ? "cursor-not-allowed opacity-60" : ""
                        }`}
                      >
                        Close
                      </button>
                    ) : trade.status === "pending" ? (
                      <button
                        onClick={() => cancelPendingTrade(trade.id)}
                        disabled={isBreached}
                        className={`rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white ${
                          isBreached ? "cursor-not-allowed opacity-60" : ""
                        }`}
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
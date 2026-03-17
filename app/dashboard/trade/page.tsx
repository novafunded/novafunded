"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import TradingViewChart from "@/components/dashboard/TradingViewChart"
import ChartTradeOverlay from "@/components/dashboard/ChartTradeOverlay"
import { auth } from "@/lib/firebase"
import { loadTradingContext, type AccountData } from "@/lib/tradingAccount"
import { syncTerminalState } from "@/lib/tradeTerminalSync"

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
  createdAt: number
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

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatSignedMoney(value: number) {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`
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
  price: number,
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
  step: number,
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

function Panel({
  title,
  subtitle,
  right,
  children,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-[18px] border border-white/10 bg-[#08111b] shadow-[0_10px_40px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#5c7389]">
            {subtitle ?? "NovaFunded"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  tone = "default",
  subtext,
}: {
  label: string
  value: string
  tone?: "default" | "positive" | "negative" | "accent"
  subtext?: string
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-red-300"
        : tone === "accent"
          ? "text-cyan-300"
          : "text-white"

  return (
    <div className="rounded-[14px] border border-white/8 bg-[#0b1623] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#6d8194]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {subtext ? <p className="mt-1 text-xs text-white/40">{subtext}</p> : null}
    </div>
  )
}

function SegmentedButton({
  active,
  onClick,
  disabled,
  children,
  activeClassName,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  activeClassName?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[12px] border px-4 py-3 text-sm font-medium transition ${
        active
          ? activeClassName ?? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
          : "border-white/10 bg-[#0d1826] text-white/70 hover:border-white/15 hover:bg-white/[0.03] hover:text-white"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  )
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
  const [currentUid, setCurrentUid] = useState("")
  const [accountData, setAccountData] = useState<AccountData | null>(null)

  const chartRef = useRef<HTMLDivElement | null>(null)
  const frozenDragRangeRef = useRef<{ low: number; high: number } | null>(null)
  const dragEntryRef = useRef<number | null>(null)

  const startBalance = accountData?.startBalance ?? 5000
  const maxLossLimit = accountData?.maxLossLimit ?? 500
  const dailyLossLimit = accountData?.dailyLossLimit ?? 250
  const profitTarget = 400

  const balance = useMemo(() => {
    const closedPnl = trades
      .filter((trade) => trade.status === "closed")
      .reduce((sum, trade) => sum + trade.pnl, 0)

    return Number((startBalance + closedPnl).toFixed(2))
  }, [startBalance, trades])

  const floatingPnl = useMemo(() => {
    return Number(
      trades
        .filter((trade) => trade.status === "open")
        .reduce((sum, trade) => sum + computePnl(trade, livePrice), 0)
        .toFixed(2),
    )
  }, [trades, livePrice])

  const equity = Number((balance + floatingPnl).toFixed(2))
  const drawdownLeft = Number((equity - (startBalance - maxLossLimit)).toFixed(2))
  const dailyLossLeft = Number((equity - (startBalance - dailyLossLimit)).toFixed(2))
  const netPnl = Number((equity - startBalance).toFixed(2))
  const closedTrades = trades.filter((trade) => trade.status === "closed")
  const openTrades = trades.filter((trade) => trade.status === "open")
  const pendingTrades = trades.filter((trade) => trade.status === "pending")
  const isBreached =
    equity <= startBalance - maxLossLimit || equity <= startBalance - dailyLossLimit
  const isPassed = !isBreached && balance >= startBalance + profitTarget

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

  function resetSetup(
    next?: Partial<{
      nextSymbol: keyof typeof SYMBOLS
      nextSide: OrderSide
      nextOrderType: OrderType
      keepLivePrice: boolean
    }>,
  ) {
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
      meta.minMove,
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
    dragEntryRef.current = null
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUid("")
        setAccountData(null)
        return
      }

      setCurrentUid(user.uid)

      const context = await loadTradingContext(user.uid, {
        includeTrades: false,
      })

      if (context.account) {
        setAccountData(context.account)
      } else {
        setAccountData(null)
      }
    })

    return () => unsub()
  }, [])

  useEffect(() => {
    const savedTrades = window.localStorage.getItem("novafunded-trades")
    const savedState = window.localStorage.getItem("novafunded-trade-page-state-v3")

    if (savedTrades) {
      try {
        const parsedTrades = JSON.parse(savedTrades) as Array<Trade & { createdAt?: number }>
        setTrades(
          parsedTrades.map((trade) => ({
            ...trade,
            createdAt:
              typeof trade.createdAt === "number"
                ? trade.createdAt
                : trade.openedAt ?? trade.closedAt ?? Date.now(),
          })),
        )
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
          SYMBOLS[nextSymbol].minMove,
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
                SYMBOLS[nextSymbol].minMove,
              )
            : restoredEntry,
        )

        setStopLoss(
          parsed.stopLoss === null || typeof parsed.stopLoss === "number"
            ? parsed.stopLoss
            : baseDefaults.stopLoss,
        )

        setTakeProfit(
          parsed.takeProfit === null || typeof parsed.takeProfit === "number"
            ? parsed.takeProfit
            : baseDefaults.takeProfit,
        )

        setLevelLocks(
          parsed.levelLocks ?? {
            entry: nextOrderType === "market",
            tp: false,
            sl: false,
          },
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
      }),
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
    if (!isHydrated || !currentUid || !accountData) return

    const timeout = window.setTimeout(() => {
      void syncTerminalState({
        uid: currentUid,
        account: accountData,
        trades: trades.map((trade) => ({
          ...trade,
          createdAt: trade.createdAt,
        })),
        balance,
        equity,
        tradingDays,
        closedTrades: closedTrades.length,
        breached: isBreached,
        status: isBreached ? "breached" : isPassed ? "passed" : "active",
      })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [
    isHydrated,
    currentUid,
    accountData,
    trades,
    balance,
    equity,
    tradingDays,
    closedTrades.length,
    isBreached,
    isPassed,
  ])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (dragTarget) return

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
  }, [dragTarget, symbol, symbolMeta.minMove])

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
          symbolMeta.minMove,
        )
        setStopLoss(defaults.stopLoss)
      }
      setLevelLocks((prev) => ({ ...prev, sl: false }))
    }
  }, [useStopLoss, side, orderType, livePrice, previewEntry, symbolMeta, stopLoss])

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
          symbolMeta.minMove,
        )
        setTakeProfit(defaults.takeProfit)
      }
      setLevelLocks((prev) => ({ ...prev, tp: false }))
    }
  }, [useTakeProfit, side, orderType, livePrice, previewEntry, symbolMeta, takeProfit])

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
      createdAt: Date.now(),
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
          status: "closed" as const,
          closedAt: Date.now(),
          closePrice: livePrice,
          pnl: computePnl(trade, livePrice),
          closeReason: "manual" as const,
        }
      }),
    )
  }

  function cancelPendingTrade(id: string) {
    if (isBreached) return

    setTrades((prev) =>
      prev.map((trade) => {
        if (trade.id !== id || trade.status !== "pending") return trade
        return { ...trade, status: "cancelled" as const }
      }),
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
      dragEntryRef.current ??
      (orderType === "market" ? roundToStep(livePrice, symbolMeta.minMove) : previewEntry)

    if (target === "entry") {
      if (orderType !== "limit" || levelLocks.entry) return

      let nextEntry = rawPrice

      if (side === "buy") {
        nextEntry = Math.min(nextEntry, livePrice - minGap)
        if (useStopLoss && stopLoss !== null) nextEntry = Math.max(nextEntry, stopLoss + minGap)
        if (useTakeProfit && takeProfit !== null)
          nextEntry = Math.min(nextEntry, takeProfit - minGap)
      } else {
        nextEntry = Math.max(nextEntry, livePrice + minGap)
        if (useStopLoss && stopLoss !== null) nextEntry = Math.min(nextEntry, stopLoss - minGap)
        if (useTakeProfit && takeProfit !== null)
          nextEntry = Math.max(nextEntry, takeProfit + minGap)
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

    function onPointerMove(event: PointerEvent) {
      updateDraggedLevel(event.clientY, activeDragTarget)
    }

    function onPointerUp() {
      frozenDragRangeRef.current = null
      dragEntryRef.current = null
      setDragTarget(null)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [
    dragTarget,
    activeOverlayRange,
    symbolMeta.minMove,
    livePrice,
    previewEntry,
    orderType,
    side,
    levelLocks,
    useStopLoss,
    useTakeProfit,
    isBreached,
  ])

  const targetProgress = clamp((Math.max(balance - startBalance, 0) / profitTarget) * 100, 0, 100)

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
          (Math.abs(previewEntry - effectiveStopLoss) * size * symbolMeta.pnlPerPoint).toFixed(2),
        )
      : null

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.82fr]">
        <Panel
          title="Trade Terminal"
          subtitle="Execution"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300">
                {accountData?.planName ?? "Live Account"}
              </div>
              <div className="rounded-full border border-white/10 bg-[#0d1826] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                {symbol}
              </div>
            </div>
          }
        >
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-white/55">
                Minimal execution layout with active breach controls and existing account logic.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(SYMBOLS).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => handleSymbolChange(key as keyof typeof SYMBOLS)}
                  className={`rounded-[12px] border px-3.5 py-2 text-sm font-medium transition ${
                    symbol === key
                      ? "border-cyan-400/25 bg-cyan-500/10 text-cyan-300"
                      : "border-white/10 bg-[#0d1826] text-white/65 hover:border-white/15 hover:bg-white/[0.03] hover:text-white"
                  }`}
                  title={meta.label}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={chartRef}
            className="relative overflow-hidden rounded-[16px] border border-white/10 bg-[#050a11]"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#698095]">
                  {symbolMeta.label}
                </p>
                <p className="mt-1 text-sm text-white/65">
                  {orderType === "market" ? "Market execution" : "Limit execution"} ·{" "}
                  {side === "buy" ? "Long bias" : "Short bias"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#698095]">
                  Live price
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-white">
                  {formatPrice(livePrice, symbol)}
                </p>
              </div>
            </div>

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

            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-36">
              <div
                className="pointer-events-auto absolute right-3 top-0 -translate-y-1/2"
                style={{ top: `${labelY.entry}%` }}
              >
                <button
                  onPointerDown={(event) => {
                    event.preventDefault()
                    if (isBreached) return
                    if (orderType === "limit" && !levelLocks.entry) {
                      frozenDragRangeRef.current = overlayRangeBase
                      dragEntryRef.current = previewEntry
                      setDragTarget("entry")
                    }
                  }}
                  className={`touch-none rounded-[10px] border px-3 py-1.5 text-[11px] font-medium shadow-lg backdrop-blur-sm ${
                    orderType === "market"
                      ? "border-cyan-400/20 bg-[#0b1b2b]/95 text-cyan-300"
                      : levelLocks.entry
                        ? "border-cyan-400/25 bg-[#0b1b2b]/95 text-cyan-300"
                        : "border-amber-400/25 bg-[#23190a]/95 text-amber-300"
                  }`}
                >
                  ENTRY {formatPrice(previewEntry, symbol)}
                </button>
              </div>

              {useTakeProfit && takeProfit !== null && labelY.tp !== null ? (
                <div
                  className="pointer-events-auto absolute right-3 top-0 -translate-y-1/2"
                  style={{ top: `${labelY.tp}%` }}
                >
                  <button
                    onPointerDown={(event) => {
                      event.preventDefault()
                      if (isBreached) return
                      if (!levelLocks.tp) {
                        frozenDragRangeRef.current = overlayRangeBase
                        dragEntryRef.current = previewEntry
                        setDragTarget("tp")
                      }
                    }}
                    className={`touch-none rounded-[10px] border px-3 py-1.5 text-[11px] font-medium shadow-lg backdrop-blur-sm ${
                      levelLocks.tp
                        ? "border-emerald-400/25 bg-[#0b1d18]/95 text-emerald-300"
                        : "border-amber-400/25 bg-[#23190a]/95 text-amber-300"
                    }`}
                  >
                    TP {formatPrice(takeProfit, symbol)}
                  </button>
                </div>
              ) : null}

              {useStopLoss && stopLoss !== null && labelY.sl !== null ? (
                <div
                  className="pointer-events-auto absolute right-3 top-0 -translate-y-1/2"
                  style={{ top: `${labelY.sl}%` }}
                >
                  <button
                    onPointerDown={(event) => {
                      event.preventDefault()
                      if (isBreached) return
                      if (!levelLocks.sl) {
                        frozenDragRangeRef.current = overlayRangeBase
                        dragEntryRef.current = previewEntry
                        setDragTarget("sl")
                      }
                    }}
                    className={`touch-none rounded-[10px] border px-3 py-1.5 text-[11px] font-medium shadow-lg backdrop-blur-sm ${
                      levelLocks.sl
                        ? "border-red-400/25 bg-[#220d12]/95 text-red-300"
                        : "border-amber-400/25 bg-[#23190a]/95 text-amber-300"
                    }`}
                  >
                    SL {formatPrice(stopLoss, symbol)}
                  </button>
                </div>
              ) : null}
            </div>

            {isBreached ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#03070dcc]/80 backdrop-blur-[3px]">
                <div className="w-full max-w-md rounded-[18px] border border-red-400/15 bg-[#0a0f17] p-6 text-center shadow-2xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-red-300/75">
                    Account breached
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Trading locked</h2>
                  <p className="mt-2 text-sm text-white/55">
                    This account can’t place new trades. Purchase another challenge to continue.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <a
                      href="/checkout"
                      className="rounded-[12px] bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                    >
                      Buy New Account
                    </a>
                    <div className="rounded-[12px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/40">
                      Reset Disabled
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Open positions" value={String(openTrades.length)} />
            <MetricCard label="Pending orders" value={String(pendingTrades.length)} />
            <MetricCard label="Closed trades" value={String(closedTrades.length)} />
            <MetricCard
              label="Live price"
              value={formatPrice(livePrice, symbol)}
              tone="accent"
              subtext={symbolMeta.label}
            />
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Order Ticket"
            subtitle="Execution controls"
            right={
              <div
                className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${
                  isBreached
                    ? "border-red-400/15 bg-red-500/8 text-red-300"
                    : isPassed
                      ? "border-emerald-400/15 bg-emerald-500/8 text-emerald-300"
                      : "border-white/10 bg-[#0d1826] text-white/60"
                }`}
              >
                {isBreached ? "Breached" : isPassed ? "Passed" : "On Track"}
              </div>
            }
          >
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[#6f8497]">
                  Direction
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <SegmentedButton
                    active={side === "buy"}
                    onClick={() => handleSideChange("buy")}
                    disabled={isBreached}
                    activeClassName="border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                  >
                    Buy
                  </SegmentedButton>
                  <SegmentedButton
                    active={side === "sell"}
                    onClick={() => handleSideChange("sell")}
                    disabled={isBreached}
                    activeClassName="border-red-400/20 bg-red-500/10 text-red-300"
                  >
                    Sell
                  </SegmentedButton>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[#6f8497]">
                  Order type
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <SegmentedButton
                    active={orderType === "market"}
                    onClick={() => handleOrderTypeChange("market")}
                    disabled={isBreached}
                  >
                    Market
                  </SegmentedButton>
                  <SegmentedButton
                    active={orderType === "limit"}
                    onClick={() => handleOrderTypeChange("limit")}
                    disabled={isBreached}
                  >
                    Limit
                  </SegmentedButton>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[#6f8497]">
                  Protection
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <SegmentedButton
                    active={useTakeProfit}
                    onClick={() => setUseTakeProfit((prev) => !prev)}
                    disabled={isBreached}
                    activeClassName="border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                  >
                    {useTakeProfit ? "TP Enabled" : "Enable TP"}
                  </SegmentedButton>

                  <SegmentedButton
                    active={useStopLoss}
                    onClick={() => setUseStopLoss((prev) => !prev)}
                    disabled={isBreached}
                    activeClassName="border-red-400/20 bg-red-500/10 text-red-300"
                  >
                    {useStopLoss ? "SL Enabled" : "Enable SL"}
                  </SegmentedButton>
                </div>
              </div>

              <div className="rounded-[14px] border border-white/8 bg-[#0b1623] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f8497]">
                      Position size
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">{size}</p>
                  </div>
                  <div className="text-right text-xs text-white/45">
                    <p>Maximum</p>
                    <p className="mt-1 text-sm text-white">{symbolMeta.maxSize}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[-5, -1, 1, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSize((prev) => clamp(prev + value, 1, symbolMeta.maxSize))}
                      disabled={isBreached}
                      className={`rounded-[10px] border border-white/10 bg-[#0d1826] px-3 py-2.5 text-sm font-medium text-white/75 transition hover:border-white/15 hover:bg-white/[0.03] hover:text-white ${
                        isBreached ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      {value > 0 ? `+${value}` : value}
                    </button>
                  ))}
                </div>

                {riskPerTrade !== null ? (
                  <p className="mt-3 text-xs text-white/45">
                    Estimated max loss at SL:{" "}
                    <span className="font-medium text-white">{formatMoney(riskPerTrade)}</span>
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[14px] border border-white/8 bg-[#0b1623] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f8497]">
                        Entry
                      </p>
                      <p className="mt-2 font-mono text-xl font-semibold text-cyan-300">
                        {formatPrice(previewEntry, symbol)}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {orderType === "market"
                          ? "Tracking live price"
                          : levelLocks.entry
                            ? "Locked and ready"
                            : "Drag on chart, then lock"}
                      </p>
                    </div>

                    {orderType === "limit" ? (
                      <button
                        onClick={lockEntry}
                        disabled={levelLocks.entry || isBreached}
                        className={`rounded-[10px] border px-3 py-2 text-xs font-semibold transition ${
                          levelLocks.entry
                            ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
                            : "border-cyan-400/20 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15"
                        } ${isBreached ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        {levelLocks.entry ? "Locked" : "Lock"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[14px] border border-white/8 bg-[#0b1623] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f8497]">
                    Live price
                  </p>
                  <p className="mt-2 font-mono text-xl font-semibold text-white">
                    {formatPrice(livePrice, symbol)}
                  </p>
                  <p className="mt-1 text-xs text-white/40">{symbolMeta.label}</p>
                </div>

                <div className="rounded-[14px] border border-white/8 bg-[#0b1623] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f8497]">
                        Take profit
                      </p>
                      <p className="mt-2 font-mono text-xl font-semibold text-emerald-300">
                        {useTakeProfit && takeProfit !== null
                          ? formatPrice(takeProfit, symbol)
                          : "Disabled"}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {!useTakeProfit
                          ? "Disabled"
                          : levelLocks.tp
                            ? "Locked and ready"
                            : "Drag on chart, then lock"}
                      </p>
                    </div>

                    {useTakeProfit && takeProfit !== null ? (
                      <button
                        onClick={lockTp}
                        disabled={levelLocks.tp || isBreached}
                        className={`rounded-[10px] border px-3 py-2 text-xs font-semibold transition ${
                          levelLocks.tp
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                            : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                        } ${isBreached ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        {levelLocks.tp ? "Locked" : "Lock"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[14px] border border-white/8 bg-[#0b1623] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f8497]">
                        Stop loss
                      </p>
                      <p className="mt-2 font-mono text-xl font-semibold text-red-300">
                        {useStopLoss && stopLoss !== null
                          ? formatPrice(stopLoss, symbol)
                          : "Disabled"}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {!useStopLoss
                          ? "Disabled"
                          : levelLocks.sl
                            ? "Locked and ready"
                            : "Drag on chart, then lock"}
                      </p>
                    </div>

                    {useStopLoss && stopLoss !== null ? (
                      <button
                        onClick={lockSl}
                        disabled={levelLocks.sl || isBreached}
                        className={`rounded-[10px] border px-3 py-2 text-xs font-semibold transition ${
                          levelLocks.sl
                            ? "border-red-400/20 bg-red-500/10 text-red-300"
                            : "border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/15"
                        } ${isBreached ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        {levelLocks.sl ? "Locked" : "Lock"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {orderType === "limit" ? (
                <div className="rounded-[14px] border border-white/8 bg-[#0b1623] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f8497]">
                        Limit workflow
                      </p>
                      <p className="mt-1 text-sm text-white/55">
                        Lock all active levels before confirming the order.
                      </p>
                    </div>

                    <button
                      onClick={unlockAllLevels}
                      disabled={isBreached}
                      className={`rounded-[10px] border border-white/10 bg-[#0d1826] px-3 py-2 text-sm font-medium text-white/75 transition hover:border-white/15 hover:bg-white/[0.03] hover:text-white ${
                        isBreached ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      Edit Levels
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] uppercase tracking-[0.12em]">
                    <div
                      className={`rounded-[10px] px-3 py-2 ${
                        levelLocks.entry ? "bg-cyan-500/10 text-cyan-300" : "bg-white/[0.03] text-white/40"
                      }`}
                    >
                      Entry
                    </div>
                    <div
                      className={`rounded-[10px] px-3 py-2 ${
                        !useTakeProfit || levelLocks.tp
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-white/[0.03] text-white/40"
                      }`}
                    >
                      TP
                    </div>
                    <div
                      className={`rounded-[10px] px-3 py-2 ${
                        !useStopLoss || levelLocks.sl
                          ? "bg-red-500/10 text-red-300"
                          : "bg-white/[0.03] text-white/40"
                      }`}
                    >
                      SL
                    </div>
                    <div
                      className={`rounded-[10px] px-3 py-2 ${
                        limitReady ? "bg-amber-500/10 text-amber-300" : "bg-white/[0.03] text-white/40"
                      }`}
                    >
                      Ready
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                onClick={placeTrade}
                disabled={isBreached || !limitReady}
                className={`w-full rounded-[14px] px-4 py-4 text-sm font-semibold transition ${
                  isBreached
                    ? "cursor-not-allowed border border-red-400/15 bg-red-500/8 text-red-300"
                    : !limitReady
                      ? "cursor-not-allowed border border-amber-400/15 bg-amber-500/8 text-amber-300"
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
          </Panel>

          <Panel title="Account Snapshot" subtitle="Risk and progress">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Balance" value={formatMoney(balance)} />
              <MetricCard label="Equity" value={formatMoney(equity)} />
              <MetricCard
                label="Net PnL"
                value={formatSignedMoney(netPnl)}
                tone={netPnl >= 0 ? "positive" : "negative"}
              />
              <MetricCard
                label="Drawdown left"
                value={formatMoney(drawdownLeft)}
                tone={drawdownLeft > 0 ? "default" : "negative"}
              />
              <MetricCard
                label="Daily loss left"
                value={formatMoney(dailyLossLeft)}
                tone={dailyLossLeft > 0 ? "default" : "negative"}
              />
              <div className="rounded-[14px] border border-white/8 bg-[#0b1623] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#6d8194]">
                  Target progress
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {targetProgress.toFixed(0)}%
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Trade Queue" subtitle="Open and pending">
          <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[#0b1623]">
            <div className="hidden grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-white/8 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[#6d8194] md:grid">
              <div>Instrument</div>
              <div>Status</div>
              <div>Entry</div>
              <div>TP</div>
              <div>SL</div>
              <div>PnL</div>
              <div>Action</div>
            </div>

            {[...openTrades, ...pendingTrades].length === 0 ? (
              <div className="px-4 py-8 text-sm text-white/45">No open or pending trades yet.</div>
            ) : (
              <div className="divide-y divide-white/8">
                {[...openTrades, ...pendingTrades].map((trade) => {
                  const displayPnl =
                    trade.status === "open" ? computePnl(trade, livePrice) : trade.pnl

                  return (
                    <div key={trade.id} className="px-4 py-4">
                      <div className="grid gap-3 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] md:items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{trade.symbol}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                                trade.side === "buy"
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-red-500/10 text-red-300"
                              }`}
                            >
                              {trade.side}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-white/40">
                            {trade.orderType} · size {trade.size}
                          </p>
                        </div>

                        <div>
                          <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[10px] uppercase text-white/60">
                            {trade.status}
                          </span>
                        </div>

                        <div className="text-sm text-white/75">
                          {formatPrice(trade.entry ?? trade.requestedEntry, trade.symbol)}
                        </div>

                        <div className="text-sm text-white/75">
                          {trade.takeProfit !== null
                            ? formatPrice(trade.takeProfit, trade.symbol)
                            : "—"}
                        </div>

                        <div className="text-sm text-white/75">
                          {trade.stopLoss !== null
                            ? formatPrice(trade.stopLoss, trade.symbol)
                            : "—"}
                        </div>

                        <div
                          className={`text-sm font-semibold ${
                            displayPnl >= 0 ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {formatSignedMoney(displayPnl)}
                        </div>

                        <div className="md:text-right">
                          {trade.status === "open" ? (
                            <button
                              onClick={() => closeTradeManually(trade.id)}
                              disabled={isBreached}
                              className={`rounded-[10px] border border-red-400/15 bg-red-500/8 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/12 ${
                                isBreached ? "cursor-not-allowed opacity-50" : ""
                              }`}
                            >
                              Close
                            </button>
                          ) : trade.status === "pending" ? (
                            <button
                              onClick={() => cancelPendingTrade(trade.id)}
                              disabled={isBreached}
                              className={`rounded-[10px] border border-white/10 bg-[#0d1826] px-3 py-2 text-sm font-medium text-white/75 transition hover:border-white/15 hover:bg-white/[0.03] hover:text-white ${
                                isBreached ? "cursor-not-allowed opacity-50" : ""
                              }`}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Closed Trades" subtitle="History">
          <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[#0b1623]">
            <div className="hidden grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-white/8 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[#6d8194] md:grid">
              <div>Instrument</div>
              <div>Reason</div>
              <div>Entry</div>
              <div>Exit</div>
              <div>TP / SL</div>
              <div>PnL</div>
            </div>

            {closedTrades.length === 0 ? (
              <div className="px-4 py-8 text-sm text-white/45">No closed trades yet.</div>
            ) : (
              <div className="divide-y divide-white/8">
                {closedTrades.map((trade) => (
                  <div key={trade.id} className="px-4 py-4">
                    <div className="grid gap-3 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr] md:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{trade.symbol}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                              trade.side === "buy"
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-red-500/10 text-red-300"
                            }`}
                          >
                            {trade.side}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/40">
                          {trade.orderType} · size {trade.size}
                        </p>
                      </div>

                      <div>
                        <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[10px] uppercase text-white/60">
                          {trade.closeReason ?? "closed"}
                        </span>
                      </div>

                      <div className="text-sm text-white/75">
                        {formatPrice(trade.entry ?? trade.requestedEntry, trade.symbol)}
                      </div>

                      <div className="text-sm text-white/75">
                        {formatPrice(
                          trade.closePrice ?? (trade.entry ?? trade.requestedEntry),
                          trade.symbol,
                        )}
                      </div>

                      <div className="text-sm text-white/60">
                        TP{" "}
                        {trade.takeProfit !== null
                          ? formatPrice(trade.takeProfit, trade.symbol)
                          : "—"}{" "}
                        / SL{" "}
                        {trade.stopLoss !== null ? formatPrice(trade.stopLoss, trade.symbol) : "—"}
                      </div>

                      <div
                        className={`text-sm font-semibold ${
                          trade.pnl >= 0 ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {formatSignedMoney(trade.pnl)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
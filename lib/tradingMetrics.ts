import type { AccountData, TradeRecord } from "@/lib/tradingAccount"

export type DerivedTradingMetrics = {
  closedTrades: TradeRecord[]
  openTrades: TradeRecord[]
  pendingTrades: TradeRecord[]
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  realizedPnl: number
  grossProfit: number
  grossLoss: number
  largestWin: number
  largestLoss: number
  averageWinner: number
  averageLoser: number
  profitFactor: number
  expectancy: number
  tradingDays: number
  currentCycleProfit: number
  drawdownUsed: number
  drawdownRemaining: number
  dailyLossRemaining: number
  payoutEligible: boolean
  payoutBlockedReason: string | null
  payoutReadinessPercent: number
  availableWithdrawal: number
}

function round2(value: number) {
  return Number(value.toFixed(2))
}

export function getTradingDaysFromTrades(trades: TradeRecord[]) {
  const days = new Set(
    trades
      .map((trade) => trade.openedAtMs ?? trade.createdAtMs)
      .filter((value): value is number => typeof value === "number")
      .map((value) => new Date(value).toDateString()),
  )

  return days.size
}

export function deriveTradingMetrics(
  account: AccountData | null,
  trades: TradeRecord[],
): DerivedTradingMetrics {
  const closedTrades = trades.filter((trade) => trade.status === "closed")
  const openTrades = trades.filter((trade) => trade.status === "open")
  const pendingTrades = trades.filter((trade) => trade.status === "pending")

  const wins = closedTrades.filter((trade) => trade.pnl > 0)
  const losses = closedTrades.filter((trade) => trade.pnl < 0)

  const realizedPnl = round2(closedTrades.reduce((sum, trade) => sum + trade.pnl, 0))
  const grossProfit = round2(wins.reduce((sum, trade) => sum + trade.pnl, 0))
  const grossLoss = round2(Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0)))

  const largestWin = wins.length ? Math.max(...wins.map((trade) => trade.pnl)) : 0
  const largestLoss = losses.length ? Math.min(...losses.map((trade) => trade.pnl)) : 0

  const averageWinner = wins.length ? round2(grossProfit / wins.length) : 0
  const averageLoser = losses.length ? round2(-grossLoss / losses.length) : 0

  const totalClosed = closedTrades.length
  const winRate = totalClosed ? round2((wins.length / totalClosed) * 100) : 0
  const profitFactor = grossLoss > 0 ? round2(grossProfit / grossLoss) : grossProfit > 0 ? 999 : 0
  const expectancy = totalClosed ? round2(realizedPnl / totalClosed) : 0

  const startBalance = account?.startBalance ?? 0
  const balance = account?.balance ?? startBalance
  const equity = account?.equity ?? balance
  const maxLossLimit = account?.maxLossLimit ?? 0
  const dailyLossLimit = account?.dailyLossLimit ?? 0

  const currentCycleProfit = round2(Math.max(balance - startBalance, 0))
  const drawdownUsed = round2(Math.max(startBalance - equity, 0))
  const drawdownRemaining = round2(Math.max(maxLossLimit - drawdownUsed, 0))
  const dailyLossRemaining = round2(Math.max(dailyLossLimit - drawdownUsed, 0))
  const tradingDays = getTradingDaysFromTrades(closedTrades)

  const hasClosedTrades = closedTrades.length > 0
  const hasProfit = currentCycleProfit >= 100
  const noOpenPositions = openTrades.length === 0 && pendingTrades.length === 0
  const goodStanding =
    !!account &&
    !account.breached &&
    !["breached", "locked"].includes(account.status.trim().toLowerCase())

  let payoutBlockedReason: string | null = null

  if (!account) {
    payoutBlockedReason = "No active account."
  } else if (!goodStanding) {
    payoutBlockedReason = "Account is not in good standing."
  } else if (!hasClosedTrades) {
    payoutBlockedReason = "No closed trades yet."
  } else if (!hasProfit) {
    payoutBlockedReason = "Minimum profit threshold not reached."
  } else if (!noOpenPositions) {
    payoutBlockedReason = "All open and pending positions must be closed."
  }

  const payoutEligible = payoutBlockedReason === null

  const readinessChecks = [
    !!account,
    goodStanding,
    hasClosedTrades,
    hasProfit,
    noOpenPositions,
  ]

  const payoutReadinessPercent = Math.round(
    (readinessChecks.filter(Boolean).length / readinessChecks.length) * 100,
  )

  const availableWithdrawal = payoutEligible ? round2(currentCycleProfit * 0.9) : 0

  return {
    closedTrades,
    openTrades,
    pendingTrades,
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    realizedPnl,
    grossProfit,
    grossLoss,
    largestWin: round2(largestWin),
    largestLoss: round2(largestLoss),
    averageWinner,
    averageLoser,
    profitFactor,
    expectancy,
    tradingDays,
    currentCycleProfit,
    drawdownUsed,
    drawdownRemaining,
    dailyLossRemaining,
    payoutEligible,
    payoutBlockedReason,
    payoutReadinessPercent,
    availableWithdrawal,
  }
}
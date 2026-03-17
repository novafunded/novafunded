import type { AccountData, TradeRecord } from "@/lib/tradingAccount"

export type PayoutReadinessStage =
  | "not_started"
  | "account_problem"
  | "build_history"
  | "reach_profit"
  | "close_positions"
  | "ready"

export type MilestoneStatus = "complete" | "pending" | "blocked"

export type TradingMilestone = {
  key: string
  label: string
  target: string
  value: string
  status: MilestoneStatus
}

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
  payoutReadinessStage: PayoutReadinessStage
  payoutReadinessLabel: string
  availableWithdrawal: number
  accountInGoodStanding: boolean
  accountActivated: boolean
  accountPassed: boolean
  payoutMilestones: TradingMilestone[]
  achievementMilestones: TradingMilestone[]
}

function round2(value: number) {
  return Number(value.toFixed(2))
}

export function normalizeAccountStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase()
}

export function isAccountInGoodStanding(account: AccountData | null) {
  if (!account) return false

  const status = normalizeAccountStatus(account.status)
  return !account.breached && !["breached", "locked"].includes(status)
}

export function isAccountActivated(account: AccountData | null) {
  return !!account?.activatedAtMs
}

export function isAccountPassed(account: AccountData | null) {
  if (!account) return false

  const phaseValue = String(account.phase ?? "").trim().toLowerCase()
  const statusValue = normalizeAccountStatus(account.status)

  return (
    phaseValue.includes("passed") ||
    phaseValue.includes("funded") ||
    statusValue.includes("passed") ||
    statusValue.includes("funded") ||
    statusValue.includes("active-funded")
  )
}

export function getTradingDaysFromTrades(trades: TradeRecord[]) {
  const days = new Set(
    trades
      .map((trade) => trade.closedAtMs ?? trade.openedAtMs ?? trade.createdAtMs)
      .filter((value): value is number => typeof value === "number")
      .map((value) => new Date(value).toDateString()),
  )

  return days.size
}

function getPayoutReadinessStage(args: {
  hasAccount: boolean
  goodStanding: boolean
  minClosedTradesMet: boolean
  minTradingDaysMet: boolean
  minProfitMet: boolean
  noOpenPositions: boolean
}) {
  const {
    hasAccount,
    goodStanding,
    minClosedTradesMet,
    minTradingDaysMet,
    minProfitMet,
    noOpenPositions,
  } = args

  if (!hasAccount) {
    return {
      stage: "not_started" as const,
      percent: 0,
      label: "No active account",
    }
  }

  if (!goodStanding) {
    return {
      stage: "account_problem" as const,
      percent: 0,
      label: "Account issue detected",
    }
  }

  if (!minClosedTradesMet || !minTradingDaysMet) {
    return {
      stage: "build_history" as const,
      percent: 25,
      label: "Build trading history",
    }
  }

  if (!minProfitMet) {
    return {
      stage: "reach_profit" as const,
      percent: 50,
      label: "Reach minimum profit",
    }
  }

  if (!noOpenPositions) {
    return {
      stage: "close_positions" as const,
      percent: 75,
      label: "Close open positions",
    }
  }

  return {
    stage: "ready" as const,
    percent: 100,
    label: "Ready for payout",
  }
}

function formatMilestoneValue(current: number, target: number, prefix = "") {
  return `${prefix}${current} / ${prefix}${target}`
}

export function deriveTradingMetrics(
  account: AccountData | null,
  trades: TradeRecord[],
): DerivedTradingMetrics {
  const closedTrades = trades.filter((trade) => trade.status === "closed")
  const openTrades = trades.filter((trade) => trade.status === "open")
  const pendingTrades = trades.filter((trade) => trade.status === "pending")

  const winningTrades = closedTrades.filter((trade) => trade.pnl > 0)
  const losingTrades = closedTrades.filter((trade) => trade.pnl < 0)

  const realizedPnl = round2(closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0))
  const grossProfit = round2(winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0))
  const grossLoss = round2(
    Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)),
  )

  const largestWin = winningTrades.length
    ? Math.max(...winningTrades.map((trade) => trade.pnl || 0))
    : 0

  const largestLoss = losingTrades.length
    ? Math.min(...losingTrades.map((trade) => trade.pnl || 0))
    : 0

  const totalClosed = closedTrades.length
  const wins = winningTrades.length
  const losses = losingTrades.length

  const averageWinner = wins ? round2(grossProfit / wins) : 0
  const averageLoser = losses ? round2(-grossLoss / losses) : 0
  const winRate = totalClosed ? round2((wins / totalClosed) * 100) : 0
  const profitFactor = grossLoss > 0 ? round2(grossProfit / grossLoss) : grossProfit > 0 ? 999 : 0
  const expectancy = totalClosed ? round2(realizedPnl / totalClosed) : 0

  const startBalance = account?.startBalance ?? 0
  const balance = account?.balance ?? startBalance
  const equity = account?.equity ?? balance
  const maxLossLimit = account?.maxLossLimit ?? 0
  const dailyLossLimit = account?.dailyLossLimit ?? 0

  const currentCycleProfit = round2(balance - startBalance)
  const drawdownUsed = round2(Math.max(startBalance - equity, 0))
  const drawdownRemaining = round2(Math.max(maxLossLimit - drawdownUsed, 0))
  const dailyLossRemaining = round2(Math.max(dailyLossLimit - drawdownUsed, 0))
  const tradingDays = getTradingDaysFromTrades(closedTrades)

  const accountInGoodStanding = isAccountInGoodStanding(account)
  const accountActivated = isAccountActivated(account)
  const accountPassed = isAccountPassed(account)

  const minProfitMet = currentCycleProfit >= 100
  const minClosedTradesMet = closedTrades.length >= 5
  const minTradingDaysMet = tradingDays >= 5
  const noOpenPositions = openTrades.length === 0 && pendingTrades.length === 0

  let payoutBlockedReason: string | null = null

  if (!account) {
    payoutBlockedReason = "No active account found."
  } else if (!accountInGoodStanding) {
    payoutBlockedReason = "Account is breached or not in good standing."
  } else if (!minClosedTradesMet) {
    payoutBlockedReason = "At least 5 closed trades are required."
  } else if (!minTradingDaysMet) {
    payoutBlockedReason = "At least 5 trading days are required."
  } else if (!minProfitMet) {
    payoutBlockedReason = "Minimum $100 profit is required."
  } else if (!noOpenPositions) {
    payoutBlockedReason = "All open and pending trades must be closed first."
  }

  const payoutEligible = payoutBlockedReason === null

  const readiness = getPayoutReadinessStage({
    hasAccount: !!account,
    goodStanding: accountInGoodStanding,
    minClosedTradesMet,
    minTradingDaysMet,
    minProfitMet,
    noOpenPositions,
  })

  const availableWithdrawal = payoutEligible ? round2(Math.max(currentCycleProfit, 0) * 0.9) : 0

  const payoutMilestones: TradingMilestone[] = [
    {
      key: "profit",
      label: "Profit threshold",
      target: "$100 minimum",
      value: `$${currentCycleProfit.toFixed(2)}`,
      status: !account
        ? "blocked"
        : accountInGoodStanding && minProfitMet
          ? "complete"
          : accountInGoodStanding
            ? "pending"
            : "blocked",
    },
    {
      key: "closed_trades",
      label: "Closed trades",
      target: "5 minimum",
      value: formatMilestoneValue(closedTrades.length, 5),
      status: !account
        ? "blocked"
        : accountInGoodStanding && minClosedTradesMet
          ? "complete"
          : accountInGoodStanding
            ? "pending"
            : "blocked",
    },
    {
      key: "trading_days",
      label: "Trading days",
      target: "5 minimum",
      value: formatMilestoneValue(tradingDays, 5),
      status: !account
        ? "blocked"
        : accountInGoodStanding && minTradingDaysMet
          ? "complete"
          : accountInGoodStanding
            ? "pending"
            : "blocked",
    },
    {
      key: "flat_book",
      label: "No open or pending trades",
      target: "Required",
      value:
        openTrades.length === 0 && pendingTrades.length === 0
          ? "No open exposure"
          : `${openTrades.length + pendingTrades.length} active`,
      status: !account
        ? "blocked"
        : accountInGoodStanding && noOpenPositions
          ? "complete"
          : accountInGoodStanding
            ? "pending"
            : "blocked",
    },
    {
      key: "standing",
      label: "Account standing",
      target: "Not breached",
      value: accountInGoodStanding ? "Good standing" : "Blocked",
      status: accountInGoodStanding ? "complete" : "blocked",
    },
  ]

  const achievementMilestones: TradingMilestone[] = [
    {
      key: "activation",
      label: "Account activated",
      target: "Activation on record",
      value: accountActivated ? "Activated" : "Not activated",
      status: accountActivated ? "complete" : account ? "pending" : "blocked",
    },
    {
      key: "passed",
      label: "Evaluation passed / funded",
      target: "Passed or funded state",
      value: accountPassed ? "Qualified" : "Not yet",
      status: accountPassed ? "complete" : account ? "pending" : "blocked",
    },
    {
      key: "closed_trades",
      label: "Closed trade history",
      target: "5 closed trades",
      value: formatMilestoneValue(closedTrades.length, 5),
      status: closedTrades.length >= 5 ? "complete" : account ? "pending" : "blocked",
    },
    {
      key: "trading_days",
      label: "Consistent trading days",
      target: "5 trading days",
      value: formatMilestoneValue(tradingDays, 5),
      status: tradingDays >= 5 ? "complete" : account ? "pending" : "blocked",
    },
    {
      key: "profit",
      label: "Positive account performance",
      target: "$100+ cycle profit",
      value: `$${currentCycleProfit.toFixed(2)}`,
      status: currentCycleProfit >= 100 ? "complete" : account ? "pending" : "blocked",
    },
  ]

  return {
    closedTrades,
    openTrades,
    pendingTrades,
    totalTrades: trades.length,
    wins,
    losses,
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
    payoutReadinessPercent: readiness.percent,
    payoutReadinessStage: readiness.stage,
    payoutReadinessLabel: readiness.label,
    availableWithdrawal,
    accountInGoodStanding,
    accountActivated,
    accountPassed,
    payoutMilestones,
    achievementMilestones,
  }
}
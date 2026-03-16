import { doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { AccountData } from "@/lib/tradingAccount"

export type TerminalTradeSnapshot = {
  id: string
  symbol: string
  side: "buy" | "sell"
  orderType: "market" | "limit"
  requestedEntry: number
  entry: number | null
  useStopLoss: boolean
  useTakeProfit: boolean
  stopLoss: number | null
  takeProfit: number | null
  size: number
  status: "pending" | "open" | "closed" | "cancelled"
  openedAt: number | null
  closedAt: number | null
  closePrice: number | null
  pnl: number
  closeReason?: "tp" | "sl" | "manual" | "breach"
  createdAt: number
}

type SyncTerminalStateParams = {
  uid: string
  account: AccountData
  trades: TerminalTradeSnapshot[]
  balance: number
  equity: number
  tradingDays: number
  closedTrades: number
  breached: boolean
  status: string
}

export async function syncTerminalState({
  uid,
  account,
  trades,
  balance,
  equity,
  tradingDays,
  closedTrades,
  breached,
  status,
}: SyncTerminalStateParams) {
  const batch = writeBatch(db)

  const accountRef = doc(db, "accounts", account.id)
  batch.set(
    accountRef,
    {
      userId: account.userId || uid,
      planName: account.planName,
      phase: account.phase,
      startBalance: account.startBalance,
      balance,
      equity,
      maxLossLimit: account.maxLossLimit,
      dailyLossLimit: account.dailyLossLimit,
      closedTrades,
      tradingDays,
      breached,
      status,
      activatedAt: account.activatedAtMs ?? null,
      updatedAtMs: Date.now(),
    },
    { merge: true },
  )

  for (const trade of trades) {
    const tradeRef = doc(db, "trades", trade.id)

    batch.set(
      tradeRef,
      {
        accountId: account.id,
        userId: uid,
        symbol: trade.symbol,
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
        openedAtMs: trade.openedAt,
        closedAtMs: trade.closedAt,
        closePrice: trade.closePrice,
        pnl: trade.pnl,
        closeReason: trade.closeReason ?? null,
        createdAtMs: trade.createdAt,
        updatedAtMs: Date.now(),
      },
      { merge: true },
    )
  }

  await batch.commit()
}
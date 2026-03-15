import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export type TradeInput = {
  symbol: string
  side: "buy" | "sell" | string
  pnl: number
  accountId: string
  userId: string
}

type FirestoreAccount = {
  userId?: string
  planName?: string
  balance?: number
  equity?: number
  startBalance?: number
  phase?: string
  status?: string
  dailyLossLimit?: number
  maxLossLimit?: number
  tradingDays?: number
  closedTrades?: number
  breached?: boolean
  createdAt?: unknown
}

export async function syncTradeAccount(trade: TradeInput): Promise<void> {
  if (!trade.accountId || !trade.userId) {
    console.error("syncTradeAccount: missing accountId or userId", trade)
    return
  }

  if (typeof trade.pnl !== "number" || Number.isNaN(trade.pnl)) {
    console.error("syncTradeAccount: invalid pnl", trade)
    return
  }

  try {
    const accountRef = doc(db, "accounts", trade.accountId)
    const accountSnap = await getDoc(accountRef)

    if (!accountSnap.exists()) {
      console.error("syncTradeAccount: account not found", {
        accountId: trade.accountId,
        userId: trade.userId,
      })
      return
    }

    const account = accountSnap.data() as FirestoreAccount

    const startBalance =
      typeof account.startBalance === "number" ? account.startBalance : 0

    const currentBalance =
      typeof account.balance === "number" ? account.balance : startBalance

    const currentClosedTrades =
      typeof account.closedTrades === "number" ? account.closedTrades : 0

    const newBalance = Number((currentBalance + trade.pnl).toFixed(2))
    const newEquity = newBalance

    await updateDoc(accountRef, {
      balance: newBalance,
      equity: newEquity,
      closedTrades: currentClosedTrades + 1,
    })

    await addDoc(collection(db, "trades"), {
      symbol: trade.symbol,
      side: trade.side,
      pnl: Number(trade.pnl.toFixed(2)),
      accountId: trade.accountId,
      userId: trade.userId,
      createdAtMs: Date.now(),
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("syncTradeAccount failed:", error)
    throw error
  }
}
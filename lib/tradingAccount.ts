import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export type AccountData = {
  id: string
  userId: string
  planName: string
  phase: string
  status: string
  startBalance: number
  balance: number
  equity: number
  maxLossLimit: number
  dailyLossLimit: number
  closedTrades: number
  tradingDays: number
  breached: boolean
  activatedAtMs?: number
}

export type TradeRecord = {
  id: string
  symbol: string
  side: string
  pnl: number
  accountId?: string
  userId?: string
  createdAtMs?: number
}

export type UserProfile = {
  uid?: string
  email?: string
  role?: string
  activeAccountId?: string
  displayName?: string
  lastChallengeActivatedAtMs?: number
}

export type TradingContextStatus =
  | "signed_out"
  | "missing_user_profile"
  | "no_active_account"
  | "account_not_found"
  | "ready"

export type TradingContext = {
  status: TradingContextStatus
  userProfile: UserProfile | null
  account: AccountData | null
  trades: TradeRecord[]
}

type LoadTradingContextOptions = {
  includeTrades?: boolean
  tradeLimit?: number
}

function readTimestampMs(value: unknown): number | undefined {
  if (typeof value === "number") return value

  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis()
  }

  return undefined
}

export function normalizePhase(value: unknown) {
  if (typeof value === "string" && value.trim() !== "") return value
  if (typeof value === "number") return `Phase ${value}`
  return "Phase 1"
}

function mapAccountDoc(
  accountId: string,
  uid: string,
  data: Record<string, unknown>,
): AccountData {
  return {
    id: accountId,
    userId: typeof data.userId === "string" ? data.userId : uid,
    planName: typeof data.planName === "string" ? data.planName : "Flash 5K",
    phase: normalizePhase(data.phase),
    status: typeof data.status === "string" ? data.status : "active",
    startBalance: typeof data.startBalance === "number" ? data.startBalance : 5000,
    balance: typeof data.balance === "number" ? data.balance : 5000,
    equity: typeof data.equity === "number" ? data.equity : 5000,
    maxLossLimit: typeof data.maxLossLimit === "number" ? data.maxLossLimit : 500,
    dailyLossLimit: typeof data.dailyLossLimit === "number" ? data.dailyLossLimit : 250,
    closedTrades: typeof data.closedTrades === "number" ? data.closedTrades : 0,
    tradingDays: typeof data.tradingDays === "number" ? data.tradingDays : 0,
    breached: typeof data.breached === "boolean" ? data.breached : false,
    activatedAtMs: readTimestampMs(data.activatedAt),
  }
}

function mapTradeDoc(
  tradeId: string,
  data: Record<string, unknown>,
): TradeRecord {
  return {
    id: tradeId,
    symbol: typeof data.symbol === "string" ? data.symbol : "XAUUSD",
    side: typeof data.side === "string" ? data.side : "buy",
    pnl: typeof data.pnl === "number" ? data.pnl : 0,
    accountId: typeof data.accountId === "string" ? data.accountId : undefined,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    createdAtMs:
      typeof data.createdAtMs === "number"
        ? data.createdAtMs
        : readTimestampMs(data.createdAt),
  }
}

export function getAccountDisplayStatus(account: AccountData | null) {
  if (!account) return "No Account"
  if (account.breached) return "Breached"

  const normalized = account.status.trim().toLowerCase()
  if (normalized === "passed") return "Passed"
  if (normalized === "breached") return "Breached"
  if (normalized === "locked") return "Locked"
  if (normalized === "active") return "Active"

  return account.status
}

export function isTradingLocked(account: AccountData | null) {
  if (!account) return true
  if (account.breached) return true

  const normalized = account.status.trim().toLowerCase()
  return normalized === "breached" || normalized === "locked"
}

export function isFreshActivatedAccount(
  account: AccountData | null,
  trades: TradeRecord[],
) {
  if (!account) return false

  return (
    trades.length === 0 &&
    account.balance === account.startBalance &&
    account.equity === account.startBalance &&
    account.closedTrades === 0 &&
    account.tradingDays === 0
  )
}

export function syncTradeAccountSnapshot(account: AccountData | null) {
  if (typeof window === "undefined") return

  if (!account) {
    window.localStorage.removeItem("novafunded-trade-account")
    window.dispatchEvent(new Event("novafunded-account-sync"))
    return
  }

  const status = getAccountDisplayStatus(account)
  const statusTone =
    status === "Breached" || status === "Locked" ? "negative" : "positive"

  window.localStorage.setItem(
    "novafunded-trade-account",
    JSON.stringify({
      balance: account.balance,
      equity: account.equity,
      status,
      statusTone,
      tradingDays: account.tradingDays,
      closedTrades: account.closedTrades,
      planName: account.planName,
      phase: account.phase,
      accountId: account.id,
    }),
  )

  window.dispatchEvent(new Event("novafunded-account-sync"))
}

export async function loadTradingContext(
  uid: string,
  options?: LoadTradingContextOptions,
): Promise<TradingContext> {
  const includeTrades = options?.includeTrades ?? true
  const tradeLimit = options?.tradeLimit ?? 8

  const userRef = doc(db, "users", uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    syncTradeAccountSnapshot(null)
    return {
      status: "missing_user_profile",
      userProfile: null,
      account: null,
      trades: [],
    }
  }

  const rawUser = userSnap.data() as Record<string, unknown>
  const userProfile: UserProfile = {
    uid: typeof rawUser.uid === "string" ? rawUser.uid : uid,
    email: typeof rawUser.email === "string" ? rawUser.email : "",
    role: typeof rawUser.role === "string" ? rawUser.role : "user",
    displayName: typeof rawUser.displayName === "string" ? rawUser.displayName : "",
    activeAccountId:
      typeof rawUser.activeAccountId === "string" ? rawUser.activeAccountId : "",
    lastChallengeActivatedAtMs: readTimestampMs(rawUser.lastChallengeActivatedAt),
  }

  const activeAccountId =
    typeof userProfile.activeAccountId === "string"
      ? userProfile.activeAccountId.trim()
      : ""

  if (!activeAccountId) {
    syncTradeAccountSnapshot(null)
    return {
      status: "no_active_account",
      userProfile,
      account: null,
      trades: [],
    }
  }

  const accountRef = doc(db, "accounts", activeAccountId)
  const accountSnap = await getDoc(accountRef)

  if (!accountSnap.exists()) {
    syncTradeAccountSnapshot(null)
    return {
      status: "account_not_found",
      userProfile,
      account: null,
      trades: [],
    }
  }

  const account = mapAccountDoc(
    accountSnap.id,
    uid,
    accountSnap.data() as Record<string, unknown>,
  )

  let trades: TradeRecord[] = []

  if (includeTrades) {
    const tradesSnap = await getDocs(
      query(
        collection(db, "trades"),
        where("accountId", "==", activeAccountId),
        orderBy("createdAtMs", "desc"),
        limit(tradeLimit),
      ),
    )

    trades = tradesSnap.docs.map((tradeDoc) =>
      mapTradeDoc(tradeDoc.id, tradeDoc.data() as Record<string, unknown>),
    )
  }

  syncTradeAccountSnapshot(account)

  return {
    status: "ready",
    userProfile,
    account,
    trades,
  }
}
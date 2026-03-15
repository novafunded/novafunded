"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

type AccountData = {
  accountId: string
  userId: string
  planName: string
  phase: number
  status: string
  startBalance: number
  balance: number
  equity: number
  maxLossLimit: number
  dailyLossLimit: number
  closedTrades: number
  tradingDays: number
  breached: boolean
}

type UserData = {
  uid: string
  email: string
  displayName: string
  role: string
  activeAccountId: string
}

type TradeRecord = {
  id: string
  symbol: string
  side: string
  pnl: number
  accountId?: string
  userId?: string
  createdAtMs?: number
}

type CurrentUserProfile = {
  uid?: string
  email?: string
  role?: string
  activeAccountId?: string
}

const DEFAULT_ACCOUNT: AccountData = {
  accountId: "",
  userId: "",
  planName: "Flash 5K",
  phase: 1,
  status: "active",
  startBalance: 5000,
  balance: 5000,
  equity: 5000,
  maxLossLimit: 500,
  dailyLossLimit: 250,
  closedTrades: 0,
  tradingDays: 0,
  breached: false,
}

const DEFAULT_USER: UserData = {
  uid: "",
  email: "",
  displayName: "",
  role: "",
  activeAccountId: "",
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatTime(timestamp?: number) {
  if (!timestamp) return "--"

  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

export default function AdminTraderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accountIdFromUrl = searchParams.get("accountId") ?? ""

  const [authLoading, setAuthLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [account, setAccount] = useState<AccountData>(DEFAULT_ACCOUNT)
  const [user, setUser] = useState<UserData>(DEFAULT_USER)
  const [trades, setTrades] = useState<TradeRecord[]>([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/login")
        return
      }

      try {
        const currentUserRef = doc(db, "users", firebaseUser.uid)
        const currentUserSnap = await getDoc(currentUserRef)

        if (!currentUserSnap.exists()) {
          router.replace("/dashboard")
          return
        }

        const currentUserData = currentUserSnap.data() as CurrentUserProfile
        const role = typeof currentUserData.role === "string" ? currentUserData.role : ""

        if (role !== "admin") {
          router.replace("/dashboard")
          return
        }

        setIsAdmin(true)
      } catch (err) {
        console.error("Failed to verify admin access:", err)
        router.replace("/dashboard")
        return
      } finally {
        setAuthLoading(false)
      }
    })

    return () => unsub()
  }, [router])

  useEffect(() => {
    if (authLoading || !isAdmin) return

    async function loadTrader() {
      setLoading(true)
      setError("")

      try {
        let targetAccountId = accountIdFromUrl

        if (!targetAccountId) {
          const accountsSnap = await getDocs(query(collection(db, "accounts"), limit(1)))

          if (accountsSnap.empty) {
            setError("No accounts found in Firestore.")
            setLoading(false)
            return
          }

          targetAccountId = accountsSnap.docs[0].id
        }

        const accountRef = doc(db, "accounts", targetAccountId)
        const accountSnap = await getDoc(accountRef)

        if (!accountSnap.exists()) {
          setError("Account not found.")
          setLoading(false)
          return
        }

        const accountData = accountSnap.data()

        const nextAccount: AccountData = {
          accountId: accountSnap.id,
          userId: typeof accountData.userId === "string" ? accountData.userId : "",
          planName:
            typeof accountData.planName === "string" ? accountData.planName : "Flash 5K",
          phase: typeof accountData.phase === "number" ? accountData.phase : 1,
          status: typeof accountData.status === "string" ? accountData.status : "active",
          startBalance:
            typeof accountData.startBalance === "number" ? accountData.startBalance : 5000,
          balance: typeof accountData.balance === "number" ? accountData.balance : 5000,
          equity: typeof accountData.equity === "number" ? accountData.equity : 5000,
          maxLossLimit:
            typeof accountData.maxLossLimit === "number" ? accountData.maxLossLimit : 500,
          dailyLossLimit:
            typeof accountData.dailyLossLimit === "number" ? accountData.dailyLossLimit : 250,
          closedTrades:
            typeof accountData.closedTrades === "number" ? accountData.closedTrades : 0,
          tradingDays:
            typeof accountData.tradingDays === "number" ? accountData.tradingDays : 0,
          breached: typeof accountData.breached === "boolean" ? accountData.breached : false,
        }

        setAccount(nextAccount)

        const usersSnap = await getDocs(
          query(
            collection(db, "users"),
            where("activeAccountId", "==", targetAccountId),
            limit(1)
          )
        )

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0]
          const userData = userDoc.data()

          setUser({
            uid: typeof userData.uid === "string" ? userData.uid : userDoc.id,
            email: typeof userData.email === "string" ? userData.email : "",
            displayName:
              typeof userData.displayName === "string" ? userData.displayName : "",
            role: typeof userData.role === "string" ? userData.role : "",
            activeAccountId:
              typeof userData.activeAccountId === "string" ? userData.activeAccountId : "",
          })
        } else {
          setUser(DEFAULT_USER)
        }

        let nextTrades: TradeRecord[] = []

        const tradesByAccountSnap = await getDocs(
          query(
            collection(db, "trades"),
            where("accountId", "==", targetAccountId),
            orderBy("createdAtMs", "desc"),
            limit(100)
          )
        )

        nextTrades = tradesByAccountSnap.docs.map((tradeDoc) => {
          const tradeData = tradeDoc.data()

          return {
            id: tradeDoc.id,
            symbol: typeof tradeData.symbol === "string" ? tradeData.symbol : "XAUUSD",
            side: typeof tradeData.side === "string" ? tradeData.side : "buy",
            pnl: typeof tradeData.pnl === "number" ? tradeData.pnl : 0,
            accountId:
              typeof tradeData.accountId === "string" ? tradeData.accountId : undefined,
            userId: typeof tradeData.userId === "string" ? tradeData.userId : undefined,
            createdAtMs:
              typeof tradeData.createdAtMs === "number" ? tradeData.createdAtMs : undefined,
          }
        })

        if (nextTrades.length === 0 && nextAccount.userId) {
          const tradesByUserSnap = await getDocs(
            query(
              collection(db, "trades"),
              where("userId", "==", nextAccount.userId),
              orderBy("createdAtMs", "desc"),
              limit(100)
            )
          )

          nextTrades = tradesByUserSnap.docs.map((tradeDoc) => {
            const tradeData = tradeDoc.data()

            return {
              id: tradeDoc.id,
              symbol: typeof tradeData.symbol === "string" ? tradeData.symbol : "XAUUSD",
              side: typeof tradeData.side === "string" ? tradeData.side : "buy",
              pnl: typeof tradeData.pnl === "number" ? tradeData.pnl : 0,
              accountId:
                typeof tradeData.accountId === "string" ? tradeData.accountId : undefined,
              userId: typeof tradeData.userId === "string" ? tradeData.userId : undefined,
              createdAtMs:
                typeof tradeData.createdAtMs === "number" ? tradeData.createdAtMs : undefined,
            }
          })
        }

        setTrades(nextTrades)
      } catch (err) {
        console.error("Failed to load trader page:", err)
        setError("Failed to load trader data.")
      } finally {
        setLoading(false)
      }
    }

    void loadTrader()
  }, [accountIdFromUrl, authLoading, isAdmin])

  const totalPnl = useMemo(() => {
    return Number((account.balance - account.startBalance).toFixed(2))
  }, [account.balance, account.startBalance])

  const drawdownUsed = useMemo(() => {
    return Math.max(0, account.startBalance - account.balance)
  }, [account.startBalance, account.balance])

  const drawdownLeft = useMemo(() => {
    return Number((account.maxLossLimit - drawdownUsed).toFixed(2))
  }, [account.maxLossLimit, drawdownUsed])

  const winRate = useMemo(() => {
    if (trades.length === 0) return 0
    const wins = trades.filter((trade) => trade.pnl > 0).length
    return Math.round((wins / trades.length) * 100)
  }, [trades])

  const bestTrade = useMemo(() => {
    if (trades.length === 0) return 0
    return Math.max(...trades.map((trade) => trade.pnl))
  }, [trades])

  const worstTrade = useMemo(() => {
    if (trades.length === 0) return 0
    return Math.min(...trades.map((trade) => trade.pnl))
  }, [trades])

  const targetAmount = useMemo(() => {
    return 500
  }, [])

  const targetProgress = useMemo(() => {
    return clamp((totalPnl / targetAmount) * 100, 0, 100)
  }, [totalPnl, targetAmount])

  const statusTone = account.breached
    ? "text-red-400"
    : account.status === "active"
      ? "text-cyan-300"
      : "text-emerald-400"

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050816] p-6 text-white">
        <div className="text-sm text-white/55">Checking admin access...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto w-full max-w-[1700px] px-4 py-6 xl:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
                NovaFunded Admin
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Trader Inspection
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Uses account document id instead of uid routing.
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.07]"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          {loading ? (
            <div className="text-sm text-white/55">Loading trader data...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-300">
              {error}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/45">Account ID</p>
                  <p className="mt-2 break-all text-sm font-medium">{account.accountId}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/45">Email</p>
                  <p className="mt-2 break-all text-sm font-medium">{user.email || "--"}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/45">Plan</p>
                  <p className="mt-2 text-lg font-semibold">{account.planName}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/45">Balance</p>
                  <p className="mt-2 text-lg font-semibold">{formatMoney(account.balance)}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/45">Equity</p>
                  <p className="mt-2 text-lg font-semibold">{formatMoney(account.equity)}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/45">Status</p>
                  <p className={`mt-2 text-lg font-semibold ${statusTone}`}>
                    {account.breached ? "Breached" : account.status}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                        Account Metrics
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">
                        Evaluation Snapshot
                      </h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                      Phase {account.phase}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Start Balance</p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatMoney(account.startBalance)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Net PnL</p>
                      <p
                        className={`mt-2 text-lg font-semibold ${
                          totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {totalPnl >= 0 ? "+" : ""}
                        {formatMoney(totalPnl)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Closed Trades</p>
                      <p className="mt-2 text-lg font-semibold">{account.closedTrades}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Trading Days</p>
                      <p className="mt-2 text-lg font-semibold">{account.tradingDays}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Max Loss Limit</p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatMoney(account.maxLossLimit)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Drawdown Left</p>
                      <p
                        className={`mt-2 text-lg font-semibold ${
                          drawdownLeft > 100 ? "text-emerald-400" : "text-yellow-300"
                        }`}
                      >
                        {formatMoney(drawdownLeft)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                      <span>Target progress</span>
                      <span>{targetProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                        style={{ width: `${targetProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                    Performance
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">Trade Stats</h2>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Win Rate</p>
                      <p className="mt-2 text-lg font-semibold">{winRate}%</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Trades Loaded</p>
                      <p className="mt-2 text-lg font-semibold">{trades.length}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Best Trade</p>
                      <p
                        className={`mt-2 text-lg font-semibold ${
                          bestTrade >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {bestTrade > 0 ? "+" : ""}
                        {formatMoney(bestTrade)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-white/45">Worst Trade</p>
                      <p
                        className={`mt-2 text-lg font-semibold ${
                          worstTrade >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {worstTrade > 0 ? "+" : ""}
                        {formatMoney(worstTrade)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                      User
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">Linked User Record</h2>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-white/45">Display Name</p>
                    <p className="mt-2 text-sm font-medium">{user.displayName || "--"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-white/45">Email</p>
                    <p className="mt-2 break-all text-sm font-medium">{user.email || "--"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-white/45">Role</p>
                    <p className="mt-2 text-sm font-medium">{user.role || "--"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-white/45">User ID</p>
                    <p className="mt-2 break-all text-sm font-medium">{user.uid || "--"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                      History
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">Trade History</h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                    {trades.length} loaded
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-white/45">
                      <tr className="border-b border-white/10">
                        <th className="px-3 py-3 font-medium">Symbol</th>
                        <th className="px-3 py-3 font-medium">Side</th>
                        <th className="px-3 py-3 font-medium">PnL</th>
                        <th className="px-3 py-3 font-medium">Account</th>
                        <th className="px-3 py-3 font-medium">User</th>
                        <th className="px-3 py-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-white/40">
                            No matching trades found. That’s fine for now if your trade docs
                            don’t have `accountId` or `userId` yet.
                          </td>
                        </tr>
                      ) : (
                        trades.map((trade) => (
                          <tr key={trade.id} className="border-b border-white/5">
                            <td className="px-3 py-3 font-medium">{trade.symbol}</td>
                            <td className="px-3 py-3 uppercase">{trade.side}</td>
                            <td
                              className={`px-3 py-3 font-medium ${
                                trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {trade.pnl >= 0 ? "+" : ""}
                              {formatMoney(trade.pnl)}
                            </td>
                            <td className="px-3 py-3 text-white/55">
                              {trade.accountId || "--"}
                            </td>
                            <td className="px-3 py-3 text-white/55">
                              {trade.userId || "--"}
                            </td>
                            <td className="px-3 py-3 text-white/55">
                              {formatTime(trade.createdAtMs)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
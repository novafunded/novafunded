"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

type TraderAccount = {
  id: string
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default function AdminPage() {
  const [accounts, setAccounts] = useState<TraderAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAccounts() {
      try {
        const q = query(collection(db, "accounts"), orderBy("balance", "desc"))
        const snap = await getDocs(q)

        const results: TraderAccount[] = snap.docs.map((accountDoc) => {
          const d = accountDoc.data()

          return {
            id: accountDoc.id,
            userId: typeof d.userId === "string" ? d.userId : "",
            planName: typeof d.planName === "string" ? d.planName : "Flash 5K",
            phase: typeof d.phase === "number" ? d.phase : 1,
            status: typeof d.status === "string" ? d.status : "active",
            startBalance:
              typeof d.startBalance === "number" ? d.startBalance : 5000,
            balance: typeof d.balance === "number" ? d.balance : 0,
            equity: typeof d.equity === "number" ? d.equity : 0,
            maxLossLimit:
              typeof d.maxLossLimit === "number" ? d.maxLossLimit : 500,
            dailyLossLimit:
              typeof d.dailyLossLimit === "number" ? d.dailyLossLimit : 250,
            closedTrades:
              typeof d.closedTrades === "number" ? d.closedTrades : 0,
            tradingDays:
              typeof d.tradingDays === "number" ? d.tradingDays : 0,
            breached: typeof d.breached === "boolean" ? d.breached : false,
          }
        })

        setAccounts(results)
      } catch (err) {
        console.error("Admin load error:", err)
      } finally {
        setLoading(false)
      }
    }

    void loadAccounts()
  }, [])

  const totals = useMemo(() => {
    const totalAccounts = accounts.length
    const breachedCount = accounts.filter((account) => account.breached).length
    const activeCount = accounts.filter(
      (account) => !account.breached && account.status === "active"
    ).length
    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    )

    return {
      totalAccounts,
      breachedCount,
      activeCount,
      totalBalance,
    }
  }, [accounts])

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                NovaFunded Admin
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Trader Accounts</h1>
              <p className="mt-1 text-sm text-white/60">
                Live overview of all funded challenge accounts.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs text-white/45">Accounts</p>
                <p className="mt-1 text-lg font-semibold">
                  {totals.totalAccounts}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs text-white/45">Active</p>
                <p className="mt-1 text-lg font-semibold text-cyan-300">
                  {totals.activeCount}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs text-white/45">Breached</p>
                <p className="mt-1 text-lg font-semibold text-red-400">
                  {totals.breachedCount}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs text-white/45">Combined Balance</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatMoney(totals.totalBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          {loading ? (
            <div className="text-sm text-white/50">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="text-sm text-white/50">No trader accounts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/10 text-white/40">
                  <tr>
                    <th className="py-3 pr-6 text-left">Account</th>
                    <th className="py-3 pr-6 text-left">Plan</th>
                    <th className="py-3 pr-6 text-left">Phase</th>
                    <th className="py-3 pr-6 text-left">Balance</th>
                    <th className="py-3 pr-6 text-left">Equity</th>
                    <th className="py-3 pr-6 text-left">Closed</th>
                    <th className="py-3 pr-6 text-left">Days</th>
                    <th className="py-3 pr-6 text-left">Status</th>
                    <th className="py-3 pr-6 text-left">View</th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.map((account) => {
                    const pnl = account.balance - account.startBalance

                    return (
                      <tr
                        key={account.id}
                        className="border-b border-white/5"
                      >
                        <td className="py-4 pr-6">
                          <div>
                            <p className="font-medium">{account.id}</p>
                            <p className="mt-1 text-xs text-white/45">
                              {account.userId || "No linked userId"}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 pr-6">{account.planName}</td>

                        <td className="py-4 pr-6">{account.phase}</td>

                        <td className="py-4 pr-6 font-medium">
                          {formatMoney(account.balance)}
                        </td>

                        <td className="py-4 pr-6">
                          {formatMoney(account.equity)}
                        </td>

                        <td className="py-4 pr-6">{account.closedTrades}</td>

                        <td className="py-4 pr-6">{account.tradingDays}</td>

                        <td className="py-4 pr-6">
                          {account.breached ? (
                            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-400">
                              Breached
                            </span>
                          ) : pnl >= 0 ? (
                            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
                              Profitable
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs text-yellow-300">
                              Drawdown
                            </span>
                          )}
                        </td>

                        <td className="py-4 pr-6">
                          <Link
                            href={`/admin/trader?accountId=${encodeURIComponent(account.id)}`}
                            className="inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/15"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
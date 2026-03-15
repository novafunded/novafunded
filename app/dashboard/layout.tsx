"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

type AccountTone = "positive" | "negative"

type AccountItem = {
  name: string
  phase: string
  status: string
  statusTone: AccountTone
}

type SyncedTradeAccount = {
  balance: number
  equity: number
  status: string
  statusTone: AccountTone
  tradingDays: number
  closedTrades: number
}

const defaultAccounts: AccountItem[] = [
  {
    name: "Flash 5K",
    phase: "Phase 1",
    status: "On Track",
    statusTone: "positive",
  },
]

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Trade", href: "/dashboard/trade", icon: "💹" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { name: "Payouts", href: "/dashboard/payouts", icon: "💰" },
  { name: "Certificates", href: "/dashboard/certificates", icon: "📜" },
  { name: "Rewards", href: "/dashboard/rewards", icon: "🎁" },
  { name: "Tournaments", href: "/dashboard/tournaments", icon: "🏆" },
  { name: "Affiliates", href: "/dashboard/affiliates", icon: "🤝" },
  { name: "Discord", href: "/dashboard/discord", icon: "💬" },
  { name: "Billing", href: "/dashboard/billing", icon: "💳" },
  { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
]

const defaultTradeAccount: SyncedTradeAccount = {
  balance: 5000,
  equity: 5000,
  status: "On Track",
  statusTone: "positive",
  tradingDays: 0,
  closedTrades: 0,
}

function readStoredTradeAccount(): SyncedTradeAccount {
  if (typeof window === "undefined") return defaultTradeAccount

  try {
    const raw = window.localStorage.getItem("novafunded-trade-account")
    if (!raw) return defaultTradeAccount

    const parsed = JSON.parse(raw) as Partial<SyncedTradeAccount>

    return {
      balance:
        typeof parsed.balance === "number" ? parsed.balance : defaultTradeAccount.balance,
      equity: typeof parsed.equity === "number" ? parsed.equity : defaultTradeAccount.equity,
      status: typeof parsed.status === "string" ? parsed.status : defaultTradeAccount.status,
      statusTone:
        parsed.statusTone === "negative" ? "negative" : defaultTradeAccount.statusTone,
      tradingDays:
        typeof parsed.tradingDays === "number"
          ? parsed.tradingDays
          : defaultTradeAccount.tradingDays,
      closedTrades:
        typeof parsed.closedTrades === "number"
          ? parsed.closedTrades
          : defaultTradeAccount.closedTrades,
    }
  } catch {
    return defaultTradeAccount
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountItem>(defaultAccounts[0])
  const [liveTradeAccount, setLiveTradeAccount] =
    useState<SyncedTradeAccount>(defaultTradeAccount)

  const accountMenuRef = useRef<HTMLDivElement | null>(null)
  const notificationsRef = useRef<HTMLDivElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMobileOpen(false)
    setAccountMenuOpen(false)
    setNotificationsOpen(false)
    setProfileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const syncTradeAccount = () => {
      setLiveTradeAccount(readStoredTradeAccount())
    }

    syncTradeAccount()

    window.addEventListener("storage", syncTradeAccount)
    window.addEventListener("novafunded-account-sync", syncTradeAccount as EventListener)

    return () => {
      window.removeEventListener("storage", syncTradeAccount)
      window.removeEventListener("novafunded-account-sync", syncTradeAccount as EventListener)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false)
      }

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false)
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const enhancedSelectedAccount = useMemo(() => {
    return {
      ...selectedAccount,
      status: liveTradeAccount.status,
      statusTone: liveTradeAccount.statusTone,
      phase:
        liveTradeAccount.status === "Passed"
          ? "Passed"
          : liveTradeAccount.status === "Breached"
            ? "Breached"
            : "Phase 1",
    }
  }, [selectedAccount, liveTradeAccount])

  const topBarBalance = liveTradeAccount.balance
  const topBarEquity = liveTradeAccount.equity

  const payoutLabel =
    enhancedSelectedAccount.status === "Passed"
      ? "Eligible"
      : enhancedSelectedAccount.status === "Breached"
        ? "Locked"
        : "Tracking"

  const payoutToneClass =
    enhancedSelectedAccount.status === "Passed"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
      : enhancedSelectedAccount.status === "Breached"
        ? "border-red-400/20 bg-red-400/10 text-red-400"
        : "border-white/10 bg-white/5 text-white/70"

  const statusClass =
    enhancedSelectedAccount.statusTone === "positive"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
      : "border-red-400/20 bg-red-400/10 text-red-400"

  const pageTitle = useMemo(() => {
    if (pathname === "/dashboard") return "Dashboard Overview"
    if (pathname === "/dashboard/trade") return "Trade Terminal"
    if (pathname === "/dashboard/analytics") return "Analytics"
    if (pathname === "/dashboard/payouts") return "Payouts"
    if (pathname === "/dashboard/certificates") return "Certificates"
    if (pathname === "/dashboard/rewards") return "Rewards"
    if (pathname === "/dashboard/tournaments") return "Tournaments"
    if (pathname === "/dashboard/affiliates") return "Affiliates"
    if (pathname === "/dashboard/discord") return "Discord"
    if (pathname === "/dashboard/billing") return "Billing"
    if (pathname === "/dashboard/settings") return "Settings"

    return "NovaFunded Dashboard"
  }, [pathname])

  const isBreached = liveTradeAccount.status === "Breached"
  const hasUnreadNotifications = isBreached || liveTradeAccount.closedTrades > 0

  return (
    <>
      <style jsx global>{`
        @keyframes dashboardFadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes sidebarGlowFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.5;
          }
          100% {
            transform: translate3d(0, -20px, 0) scale(1.06);
            opacity: 0.9;
          }
        }

        @keyframes pulseDot {
          0% {
            transform: scale(1);
            opacity: 0.9;
          }
          100% {
            transform: scale(1.35);
            opacity: 0.45;
          }
        }

        @keyframes softBorderGlow {
          0% {
            box-shadow: 0 0 0 rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 28px rgba(16, 185, 129, 0.08);
          }
        }

        @keyframes panelSlide {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="relative flex min-h-screen bg-[#0A0A0A] text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
          <div className="absolute left-[-200px] top-[-200px] h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-[140px]" />
          <div className="absolute bottom-[-220px] right-[-180px] h-[520px] w-[520px] rounded-full bg-white/10 blur-[150px]" />
        </div>

        {mobileOpen ? (
          <button
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col border-r border-white/10 bg-black/70 backdrop-blur-2xl transition-transform duration-300 lg:static lg:z-20 lg:w-72 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                background:
                  "radial-gradient(circle at top left, rgba(16,185,129,0.20), transparent 38%), radial-gradient(circle at bottom right, rgba(255,255,255,0.05), transparent 30%)",
                animation: "sidebarGlowFloat 10s ease-in-out infinite alternate",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-black shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                    N
                  </div>

                  <div>
                    <p className="text-lg font-semibold tracking-tight text-white">
                      NovaFunded
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                      PROP TRADING
                    </p>
                  </div>
                </div>

                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
                  onClick={() => setMobileOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div
                className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-[0_0_40px_rgba(16,185,129,0.08)]"
                style={{ animation: "softBorderGlow 2.6s ease-in-out infinite alternate" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-emerald-400/80">Selected Account</p>
                    <p className="mt-1 text-base font-semibold text-white">
                      {enhancedSelectedAccount.name}
                    </p>
                  </div>

                  <div className="relative flex h-3 w-3 items-center justify-center">
                    <span
                      className={`absolute inline-flex h-3 w-3 rounded-full ${
                        enhancedSelectedAccount.statusTone === "positive"
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }`}
                      style={{ animation: "pulseDot 1.5s ease-in-out infinite alternate" }}
                    />
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${
                        enhancedSelectedAccount.statusTone === "positive"
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60">
                    {enhancedSelectedAccount.phase}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${statusClass}`}>
                    {enhancedSelectedAccount.status}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${payoutToneClass}`}>
                    Payout {payoutLabel}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                      Balance
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      ${liveTradeAccount.balance.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                      Equity
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      ${liveTradeAccount.equity.toLocaleString()}
                    </p>
                  </div>
                </div>

                {isBreached ? (
                  <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3">
                    <p className="text-sm font-semibold text-red-300">Account breached</p>
                    <p className="mt-1 text-xs text-red-200/70">
                      Start a new challenge to get back in the game.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Link
                        href="/checkout"
                        className="rounded-xl bg-emerald-500 px-3 py-2 text-center text-sm font-semibold text-black transition hover:bg-emerald-400"
                      >
                        Buy New
                      </Link>
                      <Link
                        href="/dashboard/billing"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        View Plans
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-3 px-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
                Navigation
              </p>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm font-medium transition duration-200 ${
                      active
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-white shadow-[0_0_30px_rgba(16,185,129,0.08)]"
                        : "border border-transparent text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active ? (
                      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-emerald-400" />
                    ) : null}

                    <span
                      className={`relative flex h-9 w-9 items-center justify-center rounded-xl border text-base transition ${
                        active
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-white/10 bg-white/5 text-white/70 group-hover:text-white"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span className="relative">{item.name}</span>

                    {active ? (
                      <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-400">
                        Live
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/40">Support</p>
              <p className="mt-1 text-sm text-white/70">
                Need help with rules, payouts, or account access?
              </p>

              <div className="mt-4 space-y-2">
                <button className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400">
                  Open Help Center
                </button>
                <Link
                  href="/"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Back to Site
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-black/50 backdrop-blur-2xl">
            <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  ☰
                </button>

                <div className="hidden items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:inline-flex">
                  Live Account
                </div>

                <div className="hidden text-sm text-white/40 md:block">{pageTitle}</div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm md:block">
                  <span className="text-white/40">Balance</span>
                  <span className="ml-2 font-semibold text-white">
                    ${topBarBalance.toLocaleString()}
                  </span>
                </div>

                <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm lg:block">
                  <span className="text-white/40">Equity</span>
                  <span className="ml-2 font-semibold text-white">
                    ${topBarEquity.toLocaleString()}
                  </span>
                </div>

                <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm xl:block">
                  <span className="text-white/40">Days</span>
                  <span className="ml-2 font-semibold text-white">
                    {liveTradeAccount.tradingDays}
                  </span>
                </div>

                <div className="relative" ref={accountMenuRef}>
                  <button
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      setAccountMenuOpen((prev) => !prev)
                      setNotificationsOpen(false)
                      setProfileMenuOpen(false)
                    }}
                  >
                    <span className="hidden sm:inline">🏦 {selectedAccount.name}</span>
                    <span className="sm:hidden">🏦</span>
                  </button>

                  {accountMenuOpen ? (
                    <div
                      className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-white/10 bg-[#0F0F0F]/95 p-2 shadow-2xl backdrop-blur-2xl"
                      style={{ animation: "panelSlide 0.2s ease-out" }}
                    >
                      <p className="px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/30">
                        Active Account
                      </p>

                      <div className="space-y-2">
                        {defaultAccounts.map((account) => {
                          const active = account.name === selectedAccount.name
                          const toneClass =
                            liveTradeAccount.statusTone === "positive"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "border-red-400/20 bg-red-400/10 text-red-400"

                          return (
                            <button
                              key={account.name}
                              className={`w-full rounded-2xl border p-3 text-left transition ${
                                active
                                  ? "border-emerald-500/20 bg-emerald-500/10"
                                  : "border-white/10 bg-white/5 hover:bg-white/10"
                              }`}
                              onClick={() => {
                                setSelectedAccount(account)
                                setAccountMenuOpen(false)
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {account.name}
                                  </p>
                                  <p className="mt-1 text-xs text-white/40">
                                    Days {liveTradeAccount.tradingDays} • Trades {liveTradeAccount.closedTrades}
                                  </p>
                                </div>

                                <span className={`rounded-full border px-2 py-1 text-[10px] ${toneClass}`}>
                                  {liveTradeAccount.status}
                                </span>
                              </div>
                            </button>
                          )
                        })}

                        <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-sm font-semibold text-white">Need another account?</p>
                          <p className="mt-1 text-xs text-white/45">
                            Jump back in fast with a new challenge.
                          </p>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Link
                              href="/checkout"
                              className="rounded-xl bg-emerald-500 px-3 py-2 text-center text-sm font-semibold text-black transition hover:bg-emerald-400"
                            >
                              Buy New
                            </Link>
                            <Link
                              href="/dashboard/billing"
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                            >
                              Plans
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative" ref={notificationsRef}>
                  <button
                    className="relative rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      setNotificationsOpen((prev) => !prev)
                      setAccountMenuOpen(false)
                      setProfileMenuOpen(false)
                    }}
                  >
                    🔔
                    {hasUnreadNotifications ? (
                      <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    ) : null}
                  </button>

                  {notificationsOpen ? (
                    <div
                      className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-white/10 bg-[#0F0F0F]/95 p-2 shadow-2xl backdrop-blur-2xl"
                      style={{ animation: "panelSlide 0.2s ease-out" }}
                    >
                      <div className="px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
                          Notifications
                        </p>
                      </div>

                      <div className="space-y-2">
                        {isBreached ? (
                          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3">
                            <p className="text-sm font-semibold text-red-300">
                              Your account was breached
                            </p>
                            <p className="mt-1 text-xs text-red-200/70">
                              Start a new challenge to continue trading.
                            </p>
                            <Link
                              href="/checkout"
                              className="mt-3 inline-flex rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
                            >
                              Buy New Account
                            </Link>
                          </div>
                        ) : (
                          <>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-sm font-semibold text-white">Account synced</p>
                              <p className="mt-1 text-xs text-white/45">
                                Balance and equity are updating from the trade terminal.
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <p className="text-sm font-semibold text-white">Trading progress</p>
                              <p className="mt-1 text-xs text-white/45">
                                {liveTradeAccount.closedTrades} closed trades • {liveTradeAccount.tradingDays} trading days
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative" ref={profileMenuRef}>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm transition hover:bg-white/10"
                    onClick={() => {
                      setProfileMenuOpen((prev) => !prev)
                      setAccountMenuOpen(false)
                      setNotificationsOpen(false)
                    }}
                  >
                    👤
                  </button>

                  {profileMenuOpen ? (
                    <div
                      className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-white/10 bg-[#0F0F0F]/95 p-2 shadow-2xl backdrop-blur-2xl"
                      style={{ animation: "panelSlide 0.2s ease-out" }}
                    >
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-sm font-semibold text-white">Trader Profile</p>
                        <p className="mt-1 text-xs text-white/45">
                          Manage your funded journey and account actions.
                        </p>
                      </div>

                      <div className="mt-2 space-y-1">
                        <Link
                          href="/dashboard/settings"
                          className="block rounded-xl px-3 py-2 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                        >
                          Settings
                        </Link>
                        <Link
                          href="/dashboard/billing"
                          className="block rounded-xl px-3 py-2 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                        >
                          Billing
                        </Link>
                        <Link
                          href="/checkout"
                          className="block rounded-xl px-3 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/10 hover:text-emerald-200"
                        >
                          Buy New Funded Account
                        </Link>
                        <Link
                          href="/"
                          className="block rounded-xl px-3 py-2 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                        >
                          Log Out
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main
            key={pathname}
            className="mx-auto w-full max-w-[1520px] flex-1 px-4 py-6 md:px-6 md:py-8"
            style={{ animation: "dashboardFadeIn 0.35s ease-out" }}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
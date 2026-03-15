export default function DiscordPage() {
  const channels = [
    { name: "#announcements", desc: "Platform updates, releases, and system notices", members: "12.4k" },
    { name: "#market-chat", desc: "Live trader discussion during major sessions", members: "8.1k" },
    { name: "#funded-wins", desc: "Payout screenshots, milestones, and trader highlights", members: "6.7k" },
    { name: "#support", desc: "Quick help with account, rules, and dashboard questions", members: "4.2k" },
  ]

  const perks = [
    {
      title: "Private trader community",
      desc: "Makes NovaFunded feel alive with a real member base around the product.",
    },
    {
      title: "Real-time discussion",
      desc: "Gives the impression of live market conversation and active platform engagement.",
    },
    {
      title: "Support and announcements",
      desc: "Adds a clean place for updates, rules, and staff communication.",
    },
    {
      title: "Social proof",
      desc: "A Discord integration instantly makes the platform feel more trusted and established.",
    },
  ]

  const activity = [
    {
      title: "New trader role granted",
      time: "5 min ago",
      desc: "Your dashboard profile has been marked eligible for community access and member perks.",
    },
    {
      title: "Funded wins channel updated",
      time: "18 min ago",
      desc: "Recent payout and tournament winner highlights were published for community visibility.",
    },
    {
      title: "Market chat surge detected",
      time: "42 min ago",
      desc: "Session engagement increased during New York open as traders discussed momentum setups.",
    },
    {
      title: "Weekly announcement posted",
      time: "1 hr ago",
      desc: "NovaFunded released an update covering payouts, tournaments, and community schedule changes.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                💬 Community Hub
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Stay connected to the NovaFunded trader community
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                This page makes the platform feel more alive by presenting a polished Discord-style
                community hub with announcements, market chat, support access, and trader social proof.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
                Join Discord
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                View Community Rules
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                🟢 Community Online
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                4,281 members active now
              </span>
            </div>

            <h2 className="text-2xl font-semibold md:text-3xl">
              Trade, learn, and stay plugged into the platform
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
              NovaFunded Discord access is designed to look like a premium trader community where
              users can follow updates, discuss markets, celebrate payouts, and get support without
              leaving the ecosystem.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Total Members</p>
                <p className="mt-2 text-lg font-semibold">12,842</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Your Access</p>
                <p className="mt-2 text-lg font-semibold text-emerald-400">Eligible</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">Member Role</p>
                <p className="mt-2 text-lg font-semibold">Prime Trader</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Access Status</h3>
            <p className="mt-1 text-sm text-white/40">Current community connection summary</p>

            <div className="mt-5 space-y-3">
              {[
                { label: "Discord Link", value: "Ready" },
                { label: "Role Sync", value: "Connected" },
                { label: "Announcements", value: "Enabled" },
                { label: "Support Access", value: "Included" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm text-white/60">{item.label}</p>
                  <p className="text-sm font-medium text-emerald-400">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Community Channels</h3>
            <p className="mt-1 text-sm text-white/40">
              A believable Discord channel layout for the trader ecosystem
            </p>

            <div className="mt-5 space-y-3">
              {channels.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.desc}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                      {item.members}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Why this page works</h3>
            <p className="mt-1 text-sm text-white/40">
              Social and community pages instantly boost platform realism
            </p>

            <div className="mt-5 space-y-3">
              {perks.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/50">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-xl font-semibold">Recent Community Activity</h3>
          <p className="mt-1 text-sm text-white/40">
            Live-style updates that make the community feel active
          </p>

          <div className="mt-5 space-y-4">
            {activity.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    💬
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium">{item.title}</p>
                      <span className="text-xs text-white/40">{item.time}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/50">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
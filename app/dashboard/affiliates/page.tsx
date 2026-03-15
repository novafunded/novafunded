import LeaderboardCard from "@/components/dashboard/LeaderboardCard"
import SectionCard from "@/components/dashboard/SectionCard"
import StatCard from "@/components/dashboard/StatCard"
import TradeTable from "@/components/dashboard/TradeTable"

const referralRows = [
  {
    pair: "TRADER-01",
    side: "Buy" as const,
    result: "Challenge Purchase • 5K Flash",
    pnl: "+$48",
    status: "Win" as const,
    time: "Today",
  },
  {
    pair: "TRADER-02",
    side: "Buy" as const,
    result: "Challenge Upgrade • 25K",
    pnl: "+$85",
    status: "Win" as const,
    time: "Today",
  },
  {
    pair: "TRADER-03",
    side: "Sell" as const,
    result: "Checkout Abandonment",
    pnl: "$0",
    status: "Open" as const,
    time: "2h ago",
  },
  {
    pair: "TRADER-04",
    side: "Buy" as const,
    result: "Phase 1 Purchase",
    pnl: "+$52",
    status: "Win" as const,
    time: "Yesterday",
  },
  {
    pair: "TRADER-05",
    side: "Sell" as const,
    result: "Link Click Only",
    pnl: "$0",
    status: "Open" as const,
    time: "Yesterday",
  },
]

const affiliateLeaders = [
  { rank: 1, name: "ForexNova", value: "$8,420", badge: "124 conversions" },
  { rank: 2, name: "PipTitan", value: "$6,970", badge: "98 conversions" },
  { rank: 3, name: "AlexAssin", value: "$4,860", badge: "73 conversions" },
  { rank: 4, name: "LondonSnipes", value: "$4,115", badge: "62 conversions" },
]

export default function AffiliatesPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-400">
              NovaFunded Affiliate Center
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Affiliate Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
              Track referral traffic, monitor conversions, view commissions, and
              manage your NovaFunded partner performance from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
              View Terms
            </button>

            <button className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-400">
              Withdraw Commission
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          icon="🔗"
          label="Referral Clicks"
          value="2,184"
          subtext="Tracked across all partner links"
          trend="+18.2%"
          trendPositive
        />

        <StatCard
          icon="🎯"
          label="Conversions"
          value="73"
          subtext="Challenge purchases attributed to you"
          trend="+9 this week"
          trendPositive
        />

        <StatCard
          icon="💵"
          label="Total Commission"
          value="$4,860"
          subtext="All-time affiliate earnings"
          trend="+$420"
          trendPositive
        />

        <StatCard
          icon="🏦"
          label="Next Payout"
          value="$620"
          subtext="Estimated on next affiliate cycle"
          trend="Pending"
          trendPositive
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Referral Link Generator"
          subtitle="Promote NovaFunded with your custom tracking link"
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Primary Referral Link</p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row">
                <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  https://novafunded.com/signup?ref=alexassin
                </div>
                <button className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-black transition hover:bg-emerald-400">
                  Copy Link
                </button>
              </div>
              <p className="mt-2 text-xs text-white/40">
                Use this link in TikTok bios, Discord, YouTube descriptions, and trader communities.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Conversion Rate</p>
                <p className="mt-2 text-2xl font-semibold text-white">3.34%</p>
                <p className="mt-2 text-xs text-white/40">
                  Clicks turning into paid challenges
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">EPC</p>
                <p className="mt-2 text-2xl font-semibold text-white">$2.22</p>
                <p className="mt-2 text-xs text-white/40">
                  Earnings per click across your traffic
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Approval Rate</p>
                <p className="mt-2 text-2xl font-semibold text-white">92%</p>
                <p className="mt-2 text-xs text-white/40">
                  Commissions cleared after fraud review
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Affiliate Tier"
          subtitle="Your current partner level"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-medium text-emerald-400">Current Tier</p>
              <p className="mt-2 text-2xl font-semibold text-white">Gold Partner</p>
              <p className="mt-2 text-sm text-white/70">
                18% commission rate on qualified referrals
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-white/60">Progress to Platinum</span>
                <span className="text-sm font-medium text-white">73 / 100</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[73%] rounded-full bg-emerald-500" />
              </div>

              <p className="mt-3 text-xs text-white/40">
                27 more verified conversions needed to unlock Platinum commission rates.
              </p>
            </div>

            <div className="space-y-3">
              {[
                ["💰 Current Commission Rate", "18%"],
                ["📦 Qualified Referrals", "73"],
                ["🧾 Pending Review", "6"],
                ["🏁 Tier Reset Window", "Monthly"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white/60">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Commission Overview"
          subtitle="Breakdown of your affiliate earnings"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/60">This Week</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-400">$420</p>
              <p className="mt-2 text-xs text-white/40">From 9 approved conversions</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/60">This Month</p>
              <p className="mt-2 text-3xl font-semibold text-white">$1,740</p>
              <p className="mt-2 text-xs text-white/40">Best month so far this quarter</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/60">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-white">$620</p>
              <p className="mt-2 text-xs text-white/40">Awaiting payout release window</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-white/60">Approved Commission</span>
                <span className="text-sm font-medium text-emerald-400">88%</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[88%] rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-white/60">Pending Review</span>
                <span className="text-sm font-medium text-white/70">12%</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[12%] rounded-full bg-white/40" />
              </div>
            </div>
          </div>
        </SectionCard>

        <LeaderboardCard
          title="Top Affiliates"
          subtitle="Highest earning partners this month"
          entries={affiliateLeaders}
        />
      </div>

      <TradeTable trades={referralRows} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Traffic Sources"
          subtitle="Where your affiliate traffic is coming from"
        >
          <div className="space-y-4">
            {[
              ["🎵 TikTok", "1,240 clicks", "Largest traffic source"],
              ["💬 Discord", "420 clicks", "Strong community conversions"],
              ["📺 YouTube", "312 clicks", "Long-form traffic funnel"],
              ["📸 Instagram", "212 clicks", "Bio link + story traffic"],
            ].map(([label, value, note]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white/70">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
                <p className="mt-2 text-xs text-white/40">{note}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Affiliate Notes"
          subtitle="Quick insights on your partner performance"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-medium text-emerald-400">Strongest Funnel</p>
              <p className="mt-2 text-xl font-semibold text-white">
                TikTok short-form trader content
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/50">
                Short prop-firm clips and payout-style content are currently driving the best click volume.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/60">Best Converting Angle</p>
              <p className="mt-2 text-lg font-semibold text-white">
                “Get funded without risking personal capital”
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                This messaging angle is performing best across landing page clicks and signups.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/60">Optimization Opportunity</p>
              <p className="mt-2 text-lg font-semibold text-white">
                Push more users to 25K and 50K challenge tiers
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                Higher-ticket challenge purchases increase average commission per conversion.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
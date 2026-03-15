export default function SettingsPage() {
  const profileItems = [
    { label: "Full Name", value: "Alexander Assin" },
    { label: "Email Address", value: "alex@novafunded.io" },
    { label: "Account Type", value: "Prime Trader" },
    { label: "Time Zone", value: "America/Halifax" },
  ]

  const preferences = [
    { title: "Email Notifications", status: "Enabled" },
    { title: "Tournament Alerts", status: "Enabled" },
    { title: "Payout Updates", status: "Enabled" },
    { title: "Dark Mode Theme", status: "Active" },
  ]

  const security = [
    { title: "Password", status: "Last updated 14 days ago" },
    { title: "Two-Step Verification", status: "Not enabled" },
    { title: "Login Activity", status: "No unusual activity" },
    { title: "Session Devices", status: "2 active sessions" },
  ]

  const linkedAccess = [
    { title: "Discord Access", status: "Connected" },
    { title: "Affiliate Profile", status: "Enabled" },
    { title: "Reward Tier Sync", status: "Active" },
    { title: "Tournament Eligibility", status: "Approved" },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                ⚙️ Account Settings
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Manage profile details, preferences, and account controls
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                A clean settings page ties everything together and makes NovaFunded feel like a real
                platform with profile controls, notification preferences, security sections, and linked
                account states.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
                Save Changes
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Export Profile
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Profile Information</h3>
            <p className="mt-1 text-sm text-white/40">
              Core account identity and dashboard profile details
            </p>

            <div className="mt-5 space-y-3">
              {profileItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm text-white/60">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Preferences</h3>
            <p className="mt-1 text-sm text-white/40">
              Notification and platform experience controls
            </p>

            <div className="mt-5 space-y-3">
              {preferences.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Security</h3>
            <p className="mt-1 text-sm text-white/40">
              Account safety and sign-in visibility
            </p>

            <div className="mt-5 space-y-3">
              {security.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-white/40">{item.status}</p>
                  </div>
                  <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Linked Access</h3>
            <p className="mt-1 text-sm text-white/40">
              Connected platform features and eligibility states
            </p>

            <div className="mt-5 space-y-3">
              {linkedAccess.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-xl font-semibold">Quick Account Actions</h3>
          <p className="mt-1 text-sm text-white/40">
            Final settings controls to round out the dashboard
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Update Profile",
              "Change Password",
              "Manage Alerts",
              "Review Sessions",
            ].map((item) => (
              <button
                key={item}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-sm font-medium text-white transition hover:bg-white/5"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
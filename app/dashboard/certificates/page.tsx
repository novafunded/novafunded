export default function CertificatesPage() {
  const certificateStats = [
    {
      label: "Certificates Issued",
      value: "4",
      subtext: "Across funded milestones and completions",
      tone: "neutral",
    },
    {
      label: "Latest Achievement",
      value: "Funded Account Activated",
      subtext: "Issued Mar 08, 2026",
      tone: "positive",
    },
    {
      label: "Verification Status",
      value: "Verified",
      subtext: "All achievement records validated",
      tone: "positive",
    },
    {
      label: "Account Milestones",
      value: "7",
      subtext: "Tracked across your NovaFunded profile",
      tone: "neutral",
    },
  ]

  const certificates = [
    {
      title: "Funded Trader Certificate",
      type: "Primary",
      issued: "Mar 08, 2026",
      account: "$100,000 Evaluation",
      status: "Verified",
      id: "NV-CERT-10482",
      description:
        "Awarded after successful completion of the NovaFunded evaluation process and activation of a funded trading profile.",
    },
    {
      title: "Phase One Completion",
      type: "Milestone",
      issued: "Feb 19, 2026",
      account: "$100,000 Challenge",
      status: "Verified",
      id: "NV-CERT-10351",
      description:
        "Issued for meeting the phase one profit objective while remaining within all drawdown and consistency requirements.",
    },
    {
      title: "Phase Two Completion",
      type: "Milestone",
      issued: "Mar 02, 2026",
      account: "$100,000 Verification",
      status: "Verified",
      id: "NV-CERT-10411",
      description:
        "Granted upon successful completion of the verification stage with clean risk management and compliant performance.",
    },
  ]

  const milestones = [
    {
      title: "Challenge Purchased",
      value: "Completed",
      note: "Account enrollment and competition access confirmed.",
    },
    {
      title: "Phase One Passed",
      value: "+10.4%",
      note: "Target achieved without violating daily or max drawdown limits.",
    },
    {
      title: "Phase Two Passed",
      value: "+5.7%",
      note: "Verification stage completed with stable consistency metrics.",
    },
    {
      title: "Funded Status Activated",
      value: "Live",
      note: "Trader account upgraded into funded tracking environment.",
    },
  ]

  const benefits = [
    {
      title: "Public Proof of Achievement",
      desc: "Certificates make the account journey feel documented and credible across the platform.",
    },
    {
      title: "Verification-Style Record Keeping",
      desc: "Every certificate includes an issue date, record ID, and account reference for a premium funded-firm experience.",
    },
    {
      title: "Milestone Visibility",
      desc: "Track progress from challenge purchase to funded activation in one polished profile section.",
    },
  ]

  const activity = [
    {
      title: "Funded Trader Certificate issued",
      time: "Mar 08, 2026",
      desc: "Your funded account activation certificate was added to your NovaFunded profile and marked as verified.",
    },
    {
      title: "Phase Two milestone verified",
      time: "Mar 02, 2026",
      desc: "Your verification-stage completion record was approved after final risk review.",
    },
    {
      title: "Certificate archive updated",
      time: "Feb 20, 2026",
      desc: "Past milestone records were synced into your achievement history for easier profile tracking.",
    },
    {
      title: "Achievement visibility enabled",
      time: "Feb 18, 2026",
      desc: "Your dashboard now displays verified progress records across evaluations and funded milestones.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="space-y-8">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                🏅 Certificates & Achievements
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Verified trader milestones, completion records, and funded certificates
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                This section gives NovaFunded a premium prop-firm feel by documenting important
                account milestones, funded status achievements, and verifiable certificates that
                make the platform look fully launched and believable.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
                View Latest Certificate
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Download Records
              </button>
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                ✅ Verified Achievement
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                NovaFunded Prime Trader
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Your funded journey is now backed by visible proof
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
                  NovaFunded certificates are designed to showcase progress in a premium, minimal,
                  and believable way. From passing challenge phases to funded account activation,
                  every key step can be represented through clean milestone records and verified
                  certificate cards.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Latest Certificate</p>
                  <p className="mt-2 text-lg font-semibold">Funded Trader</p>
                  <p className="mt-1 text-xs text-white/50">Issued Mar 08, 2026</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Current Account</p>
                  <p className="mt-2 text-lg font-semibold">$100,000</p>
                  <p className="mt-1 text-xs text-white/50">Funded tracking profile</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/40">Verification State</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-400">Confirmed</p>
                  <p className="mt-1 text-xs text-white/50">Profile records validated</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                  Achievement Completion
                </p>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[91%] rounded-full bg-emerald-500" />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                  <span>Challenge, verification, funded activation, and profile records</span>
                  <span>91%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Certificate Verification</p>
                <p className="mt-1 text-xs text-white/40">Current record summary</p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                🔒 Secure
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Primary Record ID</p>
                  <p className="text-sm font-medium">NV-CERT-10482</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Issue Date</p>
                  <p className="text-sm font-medium">Mar 08, 2026</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Record Status</p>
                  <p className="text-sm font-medium text-emerald-400">Verified</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/60">Associated Account</p>
                  <p className="text-sm font-medium">$100,000 Evaluation</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-medium text-emerald-400">Profile credibility boost</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Visible milestone records and achievement certificates instantly make the dashboard
                feel more established, premium, and trustworthy.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {certificateStats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="text-sm text-white/40">{item.label}</p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  item.tone === "positive" ? "text-emerald-400" : "text-white"
                }`}
              >
                {item.value}
              </p>
              <p className="mt-2 text-sm text-white/50">{item.subtext}</p>
            </div>
          ))}
        </section>

        {/* Certificate Cards */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Issued Certificates</h3>
              <p className="mt-1 text-sm text-white/40">
                Premium-looking account records for milestones and funded progression
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                Verified archive
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                Download-ready view
              </span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {certificates.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60">
                      {item.type}
                    </span>
                    <h4 className="mt-3 text-lg font-semibold">{item.title}</h4>
                  </div>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    {item.status}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/50">{item.description}</p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] text-white/40">Issued</p>
                    <p className="mt-1 text-sm font-medium">{item.issued}</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] text-white/40">Account Reference</p>
                    <p className="mt-1 text-sm font-medium">{item.account}</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] text-white/40">Certificate ID</p>
                    <p className="mt-1 text-sm font-medium">{item.id}</p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400">
                    View Record
                  </button>
                  <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Milestones + Benefits */}
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Progress Milestones</h3>
              <p className="mt-1 text-sm text-white/40">
                Track the steps that made your account look fully advanced
              </p>
            </div>

            <div className="space-y-3">
              {milestones.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.note}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Why this section matters</h3>
              <p className="mt-1 text-sm text-white/40">
                This page adds visual legitimacy to the overall prop-firm dashboard
              </p>
            </div>

            <div className="space-y-3">
              {benefits.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/50">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium">Suggested future polish</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Later you could add a full-screen printable certificate modal, certificate preview
                card designs, or achievement filtering — but this version already sells the
                illusion really well frontend-only.
              </p>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Recent Certificate Activity</h3>
            <p className="mt-1 text-sm text-white/40">
              Latest verification-style updates across your NovaFunded achievement history
            </p>
          </div>

          <div className="space-y-4">
            {activity.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    📜
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
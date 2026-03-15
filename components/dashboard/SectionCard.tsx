import { ReactNode } from "react"

type SectionCardProps = {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}

export default function SectionCard({
  title,
  subtitle,
  children,
  className = "",
  actions,
}: SectionCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(16,185,129,0.05)] ${className}`}
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -left-16 top-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* header */}
      <div className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1 text-sm text-white/45">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
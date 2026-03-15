"use client"

import { useEffect, useMemo, useRef } from "react"

type TradingViewChartProps = {
  symbol: string
}

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown
    }
  }
}

function mapSymbol(symbol: string) {
  if (symbol === "XAUUSD") return "OANDA:XAUUSD"
  if (symbol === "EURUSD") return "OANDA:EURUSD"
  if (symbol === "GBPUSD") return "OANDA:GBPUSD"
  if (symbol === "NAS100") return "OANDA:NAS100USD"
  if (symbol === "BTCUSD") return "BITSTAMP:BTCUSD"
  return "OANDA:XAUUSD"
}

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const containerId = useMemo(() => {
    return `tv-chart-${Math.random().toString(36).slice(2, 11)}`
  }, [])

  useEffect(() => {
    let isMounted = true

    function createWidget() {
      if (!isMounted || !wrapperRef.current || !window.TradingView) return

      wrapperRef.current.innerHTML = `<div id="${containerId}" class="h-full w-full"></div>`

      new window.TradingView.widget({
        autosize: true,
        symbol: mapSymbol(symbol),
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        allow_symbol_change: false,
        withdateranges: true,
        details: false,
        hotlist: false,
        calendar: false,
        studies: [],
        toolbar_bg: "#0b1020",
        loading_screen: { backgroundColor: "#0b1020", foregroundColor: "#22d3ee" },
        overrides: {
          "paneProperties.background": "#0b1020",
          "paneProperties.vertGridProperties.color": "rgba(255,255,255,0.05)",
          "paneProperties.horzGridProperties.color": "rgba(255,255,255,0.05)",
          "scalesProperties.textColor": "rgba(255,255,255,0.65)",
          "mainSeriesProperties.candleStyle.upColor": "#10b981",
          "mainSeriesProperties.candleStyle.downColor": "#ef4444",
          "mainSeriesProperties.candleStyle.borderUpColor": "#10b981",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
          "mainSeriesProperties.candleStyle.wickUpColor": "#10b981",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
        },
        enabled_features: [
          "header_resolutions",
          "header_chart_type",
          "header_indicators",
          "header_compare",
          "header_screenshot",
          "show_interval_dialog_on_key_press",
          "side_toolbar_in_fullscreen_mode",
        ],
        disabled_features: ["use_localstorage_for_settings"],
        container_id: containerId,
      })
    }

    if (window.TradingView) {
      createWidget()
    } else {
      const existingScript = document.querySelector(
        'script[src="https://s3.tradingview.com/tv.js"]'
      ) as HTMLScriptElement | null

      if (existingScript) {
        existingScript.addEventListener("load", createWidget)
        return () => {
          isMounted = false
          existingScript.removeEventListener("load", createWidget)
        }
      }

      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/tv.js"
      script.async = true
      script.onload = createWidget
      document.body.appendChild(script)

      return () => {
        isMounted = false
        script.onload = null
      }
    }

    return () => {
      isMounted = false
    }
  }, [symbol, containerId])

  return (
    <div className="relative h-[620px] w-full overflow-hidden rounded-[24px] pointer-events-auto">
      <div ref={wrapperRef} className="h-full w-full pointer-events-auto" />
    </div>
  )
}
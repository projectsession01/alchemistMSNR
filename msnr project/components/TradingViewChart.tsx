import React, { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol: string;
}

function TradingViewChart({ symbol }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol.includes(":") ? symbol : `OANDA:${symbol}`,
      "interval": "60",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "backgroundColor": "rgba(10, 10, 11, 1)",
      "gridColor": "rgba(255, 255, 255, 0.06)",
      "withdateranges": true,
      "hide_side_toolbar": false,
      "allow_symbol_change": true,
      "save_image": false,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container w-full h-full rounded-2xl overflow-hidden border border-[#242427]" 
         ref={container} 
         style={{ height: "500px", width: "100%" }}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}

export default memo(TradingViewChart);

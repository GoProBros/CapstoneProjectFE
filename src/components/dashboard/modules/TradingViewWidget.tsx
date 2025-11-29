'use client';

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  interval?: string;
  style?: string;
}

function TradingViewWidget({ 
  symbol = 'NASDAQ:AAPL',
  theme = 'dark',
  interval = 'D',
  style = '1'
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous content
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "allow_symbol_change": true,
      "calendar": false,
      "details": true,
      "hide_side_toolbar": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": false,
      "hotlist": true,
      "interval": interval,
      "locale": "vi",
      "save_image": true,
      "style": style,
      "symbol": symbol,
      "theme": theme,
      "timezone": "Asia/Ho_Chi_Minh",
      "backgroundColor": theme === 'dark' ? "#0F0F0F" : "#FFFFFF",
      "gridColor": "rgba(242, 242, 242, 0.06)",
      "watchlist": [],
      "withdateranges": true,
      "range": "YTD",
      "compareSymbols": [],
      "show_popup_button": true,
      "popup_height": "650",
      "popup_width": "1000",
      "studies": [],
      "autosize": true,
      "width": "100%",
      "height": "100%"
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    container.current.appendChild(widgetContainer);
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, theme, interval, style]);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container} 
      style={{ height: "100%", width: "100%" }}
    />
  );
}

export default memo(TradingViewWidget);

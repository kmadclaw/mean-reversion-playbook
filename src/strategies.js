export const strategyFramework = {
  name: 'Uptrend Pullback Mean Reversion',
  premise:
    'Markets overshoot in the short term from emotional volatility, then often revert toward fair value when the larger trend remains intact.',
  timeframe: 'Daily chart entries with 4–6 weeks to option expiry for the swing hold.',
  assetUniverse:
    'Highly liquid stocks, major index ETFs, and sector ETFs with tight options markets and a proven long-term upward trajectory.',
  baselineMean: ['20 EMA', '50 SMA'],
  trendFilter: 'Trade long setups only when the 20 EMA above 50 SMA structure is intact or quickly reclaimed.',
  primaryStructures: ['Call debit spread', 'Put credit spread below support'],
  scannerVision:
    'Each setup is written as a future scanner module: trend filter, deviation, confirmation trigger, target, invalidation, and options template.',
}

export const processRules = [
  {
    title: '1. Regime filter',
    rules: [
      'Prefer bullish reversion when SPY/QQQ and the sector ETF are above or reclaiming key moving averages.',
      'Avoid new longs when VIX is spiking, breadth is breaking down, or the market is in broad liquidation.',
    ],
  },
  {
    title: '2. Trend filter',
    rules: [
      'Require 20 EMA > 50 SMA for clean trend-continuation setups.',
      'Prefer 50 SMA rising or flat and price above the 200 SMA for higher quality.',
    ],
  },
  {
    title: '3. Pullback / deviation',
    rules: [
      'Wait for a multi-day selloff into the 20 EMA / 50 SMA mean zone.',
      'Look for RSI below 40, lower Bollinger Band pressure, or short-term panic near support.',
    ],
  },
  {
    title: '4. Entry confirmation',
    rules: [
      'Oversold creates the setup; a reversal trigger creates the entry.',
      'Use hammer, bullish engulfing, prior-day-high break, EMA8 reclaim, or close back inside the lower Bollinger Band.',
    ],
  },
  {
    title: '5. Options expression',
    rules: [
      'Default to 30–45 DTE call debit spreads: buy 45–55 delta, sell near target/resistance.',
      'Use put credit spreads below support when IV is elevated and support quality is high.',
    ],
  },
  {
    title: '6. Exit logic',
    rules: [
      'Target return to the 20 EMA, Bollinger midline, prior breakdown level, or recent swing high.',
      'Exit on daily close below support, 50 SMA failure, reversal-candle low break, or 40–50% debit-spread loss.',
    ],
  },
]

export const bullishSetups = [
  {
    id: 'ema20-pullback-bounce',
    rank: 2,
    title: '20 EMA Pullback Bounce',
    label: 'Clean trend-continuation reversion',
    summary:
      'Price pulls back to the rising 20 EMA inside an established uptrend, then buyers step back in.',
    pattern: [
      '20 EMA > 50 SMA.',
      'Price pulls back to or slightly below the 20 EMA.',
      'RSI cools toward 30–40 without a structural trend break.',
      'Selling pressure fades near dynamic support.',
    ],
    entryTriggers: ['Bullish engulfing candle', 'Hammer near 20 EMA', 'Break above prior day high', 'Close back above EMA8'],
    optionStructures: ['Call debit spread', 'Put credit spread below 20 EMA / nearby support'],
    targets: ['Bollinger midline', 'Prior swing high', 'Upper Bollinger Band if momentum resumes'],
    invalidation: ['Daily close below the 20 EMA support zone with follow-through', 'Reversal candle low breaks'],
    scannerSeeds: ['ema20 > sma50', 'distance_to_ema20 between -2% and +2%', 'rsi14 between 30 and 42', 'bullish candle reversal flag'],
  },
  {
    id: 'ema20-sma50-mean-zone',
    rank: 4,
    title: '20 EMA to 50 SMA Mean Zone Pullback',
    label: 'Deeper but still trend-aligned',
    summary:
      'A deeper pullback moves below the 20 EMA into the space between 20 EMA and 50 SMA while the larger uptrend remains intact.',
    pattern: [
      '20 EMA remains above 50 SMA.',
      'Price trades between the 20 EMA and 50 SMA.',
      '50 SMA is rising or flat.',
      'RSI is washed out, but price has not made a confirmed breakdown.',
    ],
    entryTriggers: ['Reversal candle inside the mean zone', 'Prior day high break', 'EMA8 reclaim', 'Support hold near 50 SMA'],
    optionStructures: ['Call debit spread after confirmation', 'Put credit spread below the 50 SMA when IV is elevated'],
    targets: ['20 EMA', 'Bollinger midline', 'Prior resistance'],
    invalidation: ['Daily close below 50 SMA', 'Multiple closes under the mean zone', 'High-volume support break'],
    scannerSeeds: ['ema20 > sma50', 'close < ema20 and close >= sma50', 'sma50_slope >= 0', 'rsi14 < 40'],
  },
  {
    id: 'lower-bollinger-reentry',
    rank: 3,
    title: 'Lower Bollinger Band Re-entry',
    label: 'Classic volatility snapback',
    summary:
      'Price stretches below the lower Bollinger Band, then closes back inside the band as panic pressure fades.',
    pattern: [
      'Uptrending asset pulls back sharply.',
      'Price closes below the lower Bollinger Band or meaningfully pierces it intraday.',
      'The next candle closes back inside the band.',
      'Move appears emotionally stretched, not structurally broken.',
    ],
    entryTriggers: ['Close back inside the Bollinger Band', 'Break above the re-entry candle high', 'Bullish reversal candle after lower-band pierce'],
    optionStructures: ['Call debit spread', 'Long call only when IV is cheap and reversal is strong'],
    targets: ['Bollinger middle band', '20 EMA', 'EMA21'],
    invalidation: ['Close back below lower band with expanding range', 'Fresh low after failed re-entry'],
    scannerSeeds: ['close_previous < bb_lower_previous', 'close_current > bb_lower_current', 'ema20 > sma50', 'rsi14 < 42'],
  },
  {
    id: 'rsi-oversold-reversal',
    rank: 7,
    title: 'RSI Oversold Reversal',
    label: 'Momentum exhaustion',
    summary:
      'RSI reaches oversold or washed-out levels inside an uptrend, then turns higher as price stabilizes near support.',
    pattern: [
      'Long-term trend is still up.',
      'RSI drops below 40, ideally near or below 30.',
      'Price approaches 20 EMA, 50 SMA, lower Bollinger Band, or prior support.',
      'Selling pressure slows before entry.',
    ],
    entryTriggers: ['RSI hooks upward', 'Bullish engulfing candle', 'Hammer candle', 'Close above prior day high', 'Close above EMA8'],
    optionStructures: ['Call debit spread', 'Put credit spread when support matters more than speed'],
    targets: ['20 EMA', 'SMA20', 'Prior breakdown level', 'Recent swing high'],
    invalidation: ['RSI remains weak while price makes a fresh low', 'Support break after oversold reading'],
    scannerSeeds: ['rsi14 <= 35', 'ema20 > sma50', 'near_support == true', 'momentum_improving == true'],
  },
  {
    id: 'sma50-defense',
    rank: 5,
    title: '50 SMA Defense Setup',
    label: 'Last line of trend support',
    summary:
      'Price tests the 50 SMA in a larger uptrend and rejects lower levels, suggesting institutions are defending the trend.',
    pattern: [
      'Price pulls back toward the 50 SMA.',
      '50 SMA is rising.',
      '20 EMA is still above or near the 50 SMA.',
      'Price rejects lower levels near the 50 SMA.',
    ],
    entryTriggers: ['Hammer at 50 SMA', 'Bullish engulfing at 50 SMA', 'Daily close back above 50 SMA', 'Break above reversal candle high'],
    optionStructures: ['Put credit spread below 50 SMA / support', 'Call debit spread after stronger confirmation'],
    targets: ['20 EMA', 'Bollinger middle band', 'Prior swing high'],
    invalidation: ['Multiple daily closes below 50 SMA', '50 SMA starts sloping down', '20 EMA crosses below 50 SMA'],
    scannerSeeds: ['abs(distance_to_sma50) <= 2%', 'sma50_slope > 0', 'reclaim_sma50 == true', 'rsi14 < 45'],
  },
  {
    id: 'prior-support-breakout-retest',
    rank: 1,
    title: 'Prior Support / Breakout Retest',
    label: 'Highest-quality structural retest',
    summary:
      'A prior breakout level is retested from above while moving-average support and oversold conditions align.',
    pattern: [
      'Stock previously broke out from a clear resistance zone.',
      'Pullback returns to that old resistance, now acting as support.',
      '20 EMA or 50 SMA is nearby.',
      'RSI is washed out, but the breakout structure remains valid.',
    ],
    entryTriggers: ['Reversal candle at the retest level', 'Close above prior day high', 'Strong close from support', 'EMA8 reclaim'],
    optionStructures: ['Call debit spread', 'Put credit spread below the retest support'],
    targets: ['20 EMA', 'Prior high', 'Upper Bollinger Band'],
    invalidation: ['Daily close back below the breakout level', 'Failed retest with heavy selling volume'],
    scannerSeeds: ['near_prior_breakout_level == true', 'ema20 > sma50', 'rsi14 < 42', 'support_rejection_candle == true'],
  },
  {
    id: 'capitulation-wick-reversal',
    rank: 8,
    title: 'Capitulation Wick Reversal',
    label: 'Emotional flush and reclaim',
    summary:
      'A hard intraday selloff undercuts support or the lower band, then buyers force a strong close with a long lower wick.',
    pattern: [
      'Uptrending asset sells off hard intraday.',
      'Price undercuts support or lower Bollinger Band.',
      'Buyers push price back up before the close.',
      'Candle leaves a long lower wick and RSI is oversold or near oversold.',
    ],
    entryTriggers: ['Hammer candle confirmation', 'Next-day break above hammer high', 'Close back inside Bollinger Band'],
    optionStructures: ['Call debit spread', 'Avoid credit spreads unless support is clearly reclaimed'],
    targets: ['20 EMA', 'Bollinger midline', 'Prior breakdown area'],
    invalidation: ['Break below capitulation low', 'Second high-volume selloff after wick'],
    scannerSeeds: ['lower_wick_percent >= 55', 'intraday_undercut_support == true', 'close_position_in_range >= 65', 'rsi14 < 40'],
  },
  {
    id: 'ema8-reclaim-after-pullback',
    rank: 6,
    title: 'EMA8 Reclaim After Pullback',
    label: 'Confirmation-first entry',
    summary:
      'After the pullback cools off, price closes back above the EMA8, showing short-term buyers have regained control.',
    pattern: [
      'Stock pulls below EMA8 during a controlled selloff.',
      'RSI cools from extended levels.',
      'Price stabilizes near 20 EMA or support.',
      'Trend filter remains bullish.',
    ],
    entryTriggers: ['Daily close above EMA8', 'Next-day continuation above EMA8 reclaim candle'],
    optionStructures: ['Call debit spread'],
    targets: ['20 EMA if still below it', 'Prior swing high if already above 20 EMA'],
    invalidation: ['Close back below EMA8 and reversal candle low', 'Support failure after reclaim'],
    scannerSeeds: ['close_previous < ema8_previous', 'close_current > ema8_current', 'ema20 > sma50', 'pullback_days >= 3'],
  },
]

export const qualityScoreRules = [
  '+2 20 EMA > 50 SMA',
  '+2 Price near 20 EMA / 50 SMA support',
  '+2 RSI below 35',
  '+2 Price pierced lower Bollinger Band and reclaimed',
  '+2 Bullish reversal candle',
  '+1 MACD histogram improving',
  '+1 Sector ETF still healthy',
  '+1 Broad market stable',
  '-2 Earnings before expiry',
  '-2 Price below 50 SMA',
  '-2 High-volume breakdown',
  '-3 20 EMA below 50 SMA',
]

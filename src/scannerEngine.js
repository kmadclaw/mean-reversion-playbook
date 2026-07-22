import { scannerRun } from './scannerRecommendations'
import { bullishSetups } from './strategies'

const DEFAULT_UNIVERSE = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'BA', 'ISRG', 'MCD', 'PEP', 'DHR', 'CVS', 'NFLX']

const fallbackOrderByStrategy = {
  'prior-support-breakout-retest': ['BA', 'ISRG', 'DHR', 'NFLX', 'MCD'],
  'ema20-pullback-bounce': ['MCD', 'PEP', 'NFLX', 'BA', 'ISRG'],
  'lower-bollinger-reentry': ['BA', 'TBB', 'ISRG', 'DHR', 'NFLX'],
  'ema20-sma50-mean-zone': ['DHR', 'ISRG', 'BA', 'MCD', 'PEP'],
  'sma50-defense': ['MCD', 'PEP', 'DHR', 'ISRG', 'BA'],
  'ema8-reclaim-after-pullback': ['NFLX', 'BA', 'ISRG', 'MCD', 'PEP'],
  'rsi-oversold-reversal': ['TBB', 'NFLX', 'ISRG', 'BA', 'DHR'],
  'capitulation-wick-reversal': ['BA', 'TBB', 'NFLX', 'DHR', 'ISRG'],
}

const strategyFitById = {
  'prior-support-breakout-retest': 'Closest match to support / breakout retest behavior from the latest feed.',
  'ema20-pullback-bounce': 'Pullback candidate near the 20 EMA mean with oversold/reversal conditions.',
  'lower-bollinger-reentry': 'Lower Bollinger Band stretch candidate; watch for re-entry confirmation.',
  'ema20-sma50-mean-zone': 'Deeper mean-zone candidate between 20 EMA and 50 SMA support.',
  'sma50-defense': '50 SMA defense candidate; watch whether buyers defend the larger trend line.',
  'ema8-reclaim-after-pullback': 'EMA8 reclaim candidate after a controlled pullback.',
  'rsi-oversold-reversal': 'RSI oversold / washed-out reversal candidate.',
  'capitulation-wick-reversal': 'Capitulation flush candidate; needs wick/reclaim confirmation.',
}

function average(values) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function sma(values, period) {
  if (values.length < period) return average(values)
  return average(values.slice(-period))
}

function ema(values, period) {
  if (!values.length) return 0
  const multiplier = 2 / (period + 1)
  return values.reduce((previous, current, index) => (index === 0 ? current : current * multiplier + previous * (1 - multiplier)), values[0])
}

function standardDeviation(values) {
  const mean = average(values)
  const variance = average(values.map((value) => (value - mean) ** 2))
  return Math.sqrt(variance)
}

function rsi(values, period = 14) {
  if (values.length <= period) return 50
  const slice = values.slice(-(period + 1))
  let gains = 0
  let losses = 0
  for (let index = 1; index < slice.length; index += 1) {
    const change = slice[index] - slice[index - 1]
    if (change >= 0) gains += change
    else losses += Math.abs(change)
  }
  if (losses === 0) return 100
  const rs = gains / losses
  return 100 - 100 / (1 + rs)
}

function firstFriday28To42Dte(now = new Date()) {
  for (let dte = 28; dte <= 42; dte += 1) {
    const candidate = new Date(now)
    candidate.setDate(candidate.getDate() + dte)
    if (candidate.getDay() === 5) {
      return { expiry: candidate.toISOString().slice(0, 10), dte }
    }
  }
  return { expiry: '', dte: 0 }
}

function scoreLiveForStrategy(strategyId, metrics) {
  const distanceToEma20 = (metrics.close - metrics.ema20) / metrics.ema20
  const distanceToSma50 = (metrics.close - metrics.sma50) / metrics.sma50
  const lowerBandStretch = (metrics.close - metrics.bbLower) / metrics.close
  const trendUp = metrics.ema20 >= metrics.sma50 * 0.98
  let score = 0
  const reasons = []

  if (trendUp) {
    score += 1.5
    reasons.push('20 EMA / 50 SMA trend structure is intact or close to reclaim')
  }
  if (metrics.rsi14 <= 45) {
    score += metrics.rsi14 <= 35 ? 2 : 1
    reasons.push(`RSI washed out at ${metrics.rsi14.toFixed(1)}`)
  }

  if (strategyId === 'ema20-pullback-bounce') {
    if (Math.abs(distanceToEma20) <= 0.08) {
      score += 3
      reasons.push('Price is close to the 20 EMA pullback zone')
    }
  } else if (strategyId === 'sma50-defense') {
    if (Math.abs(distanceToSma50) <= 0.1) {
      score += 3
      reasons.push('Price is close to the 50 SMA defense zone')
    }
  } else if (strategyId === 'lower-bollinger-reentry') {
    if (lowerBandStretch <= 0.04) {
      score += 3
      reasons.push('Price is stretched toward the lower Bollinger Band')
    }
  } else if (strategyId === 'rsi-oversold-reversal') {
    if (metrics.rsi14 <= 42) {
      score += 3
      reasons.push('RSI is oversold/washed out for a reversal scan')
    }
  } else if (strategyId === 'ema20-sma50-mean-zone') {
    if (metrics.close <= metrics.ema20 && metrics.close >= metrics.sma50 * 0.92) {
      score += 3
      reasons.push('Price is inside the 20 EMA to 50 SMA mean zone')
    }
  } else if (strategyId === 'ema8-reclaim-after-pullback') {
    if (metrics.close >= metrics.ema8 && metrics.previousClose < metrics.ema8) {
      score += 3
      reasons.push('Price reclaimed EMA8 after the pullback')
    } else if (metrics.close >= metrics.ema8) {
      score += 1.5
      reasons.push('Price is above EMA8; watch for reclaim continuation')
    }
  } else if (strategyId === 'prior-support-breakout-retest') {
    if (Math.abs(distanceToEma20) <= 0.1 || Math.abs(distanceToSma50) <= 0.1) {
      score += 2.5
      reasons.push('Price is near dynamic support for a retest-style setup')
    }
  } else if (strategyId === 'capitulation-wick-reversal') {
    if (metrics.rsi14 <= 45 && lowerBandStretch <= 0.06) {
      score += 2.5
      reasons.push('Washed-out lower-band candidate; needs wick/reclaim confirmation')
    }
  }

  return { score, reasons }
}

async function fetchYahooMetrics(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Yahoo request failed for ${symbol}`)
  const json = await response.json()
  const result = json.chart?.result?.[0]
  const quote = result?.indicators?.quote?.[0]
  const closes = quote?.close?.filter((value) => Number.isFinite(value)) ?? []
  if (closes.length < 30) throw new Error(`Not enough chart data for ${symbol}`)
  const last20 = closes.slice(-20)
  const middle = sma(closes, 20)
  const deviation = standardDeviation(last20)
  const close = closes.at(-1)
  return {
    symbol,
    close,
    previousClose: closes.at(-2),
    ema8: ema(closes, 8),
    ema20: ema(closes, 20),
    sma20: middle,
    sma50: sma(closes, 50),
    bbLower: middle - deviation * 2,
    bbUpper: middle + deviation * 2,
    rsi14: rsi(closes, 14),
  }
}

function toRecommendationFromLive(strategyId, metrics, score, reasons) {
  const { expiry, dte } = firstFriday28To42Dte()
  return {
    symbol: metrics.symbol,
    signal: 'BULLISH_REVERSION',
    direction: 'Bullish bounce',
    score: Number(score.toFixed(1)),
    structure: 'CALL_DEBIT_SPREAD',
    expiry,
    dte,
    close: Number(metrics.close.toFixed(2)),
    target: Number(Math.max(metrics.ema20, metrics.sma20, metrics.close * 1.04).toFixed(2)),
    invalidation: Number(Math.min(metrics.sma50, metrics.close * 0.94).toFixed(2)),
    rsi14: Number(metrics.rsi14.toFixed(1)),
    reasoning: reasons.join(' | '),
    warnings: 'Live browser scan uses Yahoo daily candles and strategy predicates; exact options strikes are not selected yet.',
    strategyFit: strategyFitById[strategyId],
  }
}

function fallbackRecommendations(strategyId) {
  const setup = bullishSetups.find((candidate) => candidate.id === strategyId) ?? bullishSetups[0]
  const orderedSymbols = fallbackOrderByStrategy[strategyId] ?? scannerRun.recommendations.map((item) => item.symbol)
  const recommendations = orderedSymbols
    .map((symbol) => scannerRun.recommendations.find((item) => item.symbol === symbol))
    .filter(Boolean)
    .map((item, index) => ({
      ...item,
      score: Number((8 - index * 0.4).toFixed(1)),
      strategyFit: strategyFitById[strategyId],
    }))

  return {
    strategyId,
    strategyTitle: setup.title,
    generatedAt: scannerRun.generatedAt,
    source: scannerRun.source,
    mode: 'snapshot-fallback',
    recommendations,
  }
}

export async function scanStrategy(strategyId, universe = DEFAULT_UNIVERSE) {
  const setup = bullishSetups.find((candidate) => candidate.id === strategyId) ?? bullishSetups[0]
  try {
    const settled = await Promise.allSettled(universe.map((symbol) => fetchYahooMetrics(symbol)))
    const recommendations = settled
      .filter((item) => item.status === 'fulfilled')
      .map((item) => item.value)
      .map((metrics) => {
        const { score, reasons } = scoreLiveForStrategy(strategyId, metrics)
        return { metrics, score, reasons }
      })
      .filter((candidate) => candidate.score > 2.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((candidate) => toRecommendationFromLive(strategyId, candidate.metrics, candidate.score, candidate.reasons))

    if (!recommendations.length) return fallbackRecommendations(strategyId)

    return {
      strategyId,
      strategyTitle: setup.title,
      generatedAt: new Date().toISOString(),
      source: 'Live Yahoo Finance daily chart candles fetched in browser',
      mode: 'live',
      recommendations,
    }
  } catch {
    return fallbackRecommendations(strategyId)
  }
}

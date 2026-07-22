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

  const gains = []
  const losses = []
  for (let index = 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1]
    gains.push(Math.max(change, 0))
    losses.push(Math.max(-change, 0))
  }

  let averageGain = average(gains.slice(0, period))
  let averageLoss = average(losses.slice(0, period))
  for (let index = period; index < gains.length; index += 1) {
    averageGain = (averageGain * (period - 1) + gains[index]) / period
    averageLoss = (averageLoss * (period - 1) + losses[index]) / period
  }

  if (averageLoss === 0) return 100
  const rs = averageGain / averageLoss
  return 100 - 100 / (1 + rs)
}

function finiteSeries(values) {
  return values.map((value) => Number(value)).filter((value) => Number.isFinite(value))
}

function parseYahoo(symbol, json) {
  const result = json.chart?.result?.[0]
  const quote = result?.indicators?.quote?.[0]
  const timestamps = result?.timestamp ?? []
  const closes = quote?.close ?? []
  const highs = quote?.high ?? []
  const lows = quote?.low ?? []
  const rows = closes
    .map((close, index) => ({
      date: timestamps[index] ? new Date(timestamps[index] * 1000).toISOString().slice(0, 10) : `${index}`,
      close,
      high: highs[index],
      low: lows[index],
    }))
    .filter((row) => Number.isFinite(row.close) && Number.isFinite(row.high) && Number.isFinite(row.low))

  if (rows.length < 30) throw new Error(`Not enough chart data for ${symbol}`)

  const closeSeries = rows.map((row) => row.close)
  const highSeries = rows.map((row) => row.high)
  const lowSeries = rows.map((row) => row.low)
  const last20 = closeSeries.slice(-20)
  const middle = sma(closeSeries, 20)
  const deviation = standardDeviation(last20)
  const latest = rows.at(-1)

  return {
    symbol,
    close: latest.close,
    previousClose: closeSeries.at(-2),
    dayHigh: latest.high,
    dayLow: latest.low,
    week52High: Math.max(...finiteSeries(highSeries.slice(-252))),
    week52Low: Math.min(...finiteSeries(lowSeries.slice(-252))),
    ema8: ema(closeSeries, 8),
    ema20: ema(closeSeries, 20),
    ema50: ema(closeSeries, 50),
    sma20: middle,
    sma50: sma(closeSeries, 50),
    bbLower: middle - deviation * 2,
    bbUpper: middle + deviation * 2,
    rsi14: rsi(closeSeries, 14),
    chartPoints: rows.slice(-130),
  }
}

async function fetchYahoo(symbol, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 mean-reversion-playbook',
      Accept: 'application/json',
    },
  })
  if (!response.ok) throw new Error(`Yahoo ${response.status} for ${symbol}`)
  return parseYahoo(symbol, await response.json())
}

export default async function handler(request, response) {
  const symbols = String(request.query.symbols || '')
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 30)
  const range = ['1mo', '3mo', '6mo', '1y'].includes(request.query.range) ? request.query.range : '6mo'

  response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900')

  if (!symbols.length) {
    response.status(400).json({ error: 'symbols required' })
    return
  }

  const settled = await Promise.allSettled(symbols.map((symbol) => fetchYahoo(symbol, range)))
  const payload = { symbols: {}, errors: {} }
  settled.forEach((item, index) => {
    const symbol = symbols[index]
    if (item.status === 'fulfilled') payload.symbols[symbol] = item.value
    else payload.errors[symbol] = item.reason?.message ?? 'unknown error'
  })

  response.status(200).json(payload)
}

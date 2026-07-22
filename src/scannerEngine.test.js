import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSymbolSnapshot, scanStrategy } from './scannerEngine'

function makeApiSymbol(symbol, closes, overrides = {}) {
  const close = closes.at(-1)
  return {
    symbol,
    close,
    previousClose: closes.at(-2),
    dayHigh: close + 2,
    dayLow: close - 2,
    week52High: Math.max(...closes) + 4,
    week52Low: Math.min(...closes) - 4,
    ema8: close - 1,
    ema20: close + 1,
    sma20: close,
    sma50: close - 2,
    bbLower: close - 5,
    bbUpper: close + 5,
    rsi14: 39,
    chartPoints: closes.slice(-65).map((itemClose, index) => ({ date: `d${index}`, close: itemClose, high: itemClose + 1, low: itemClose - 1 })),
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('strategy-specific scanner engine', () => {
  it('returns different fallback recommendations for different selected strategies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')))

    const supportRetest = await scanStrategy('prior-support-breakout-retest')
    const smaDefense = await scanStrategy('sma50-defense')

    expect(supportRetest.strategyId).toBe('prior-support-breakout-retest')
    expect(smaDefense.strategyId).toBe('sma50-defense')
    expect(supportRetest.mode).toBe('snapshot-fallback')
    expect(smaDefense.mode).toBe('snapshot-fallback')
    expect(supportRetest.scannedCount).toBeGreaterThanOrEqual(100)
    expect(smaDefense.scannedCount).toBeGreaterThanOrEqual(100)
    expect(supportRetest.strategyTitle).toBe('Prior Support / Breakout Retest')
    expect(smaDefense.strategyTitle).toBe('50 SMA Defense Setup')
    expect(supportRetest.recommendations[0].strategyFit).toMatch(/support|retest/i)
    expect(smaDefense.recommendations[0].strategyFit).toMatch(/50 SMA/i)
    expect(supportRetest.recommendations.map((trade) => trade.symbol).join(',')).not.toBe(
      smaDefense.recommendations.map((trade) => trade.symbol).join(','),
    )
  })

  it('scans through the app API proxy instead of direct Yahoo browser calls', async () => {
    const closes = Array.from({ length: 90 }, (_, index) => 100 + index * 0.25)
    closes[89] = 119
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ symbols: { MOCK: makeApiSymbol('MOCK', closes) } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await scanStrategy('ema20-pullback-bounce', ['MOCK'])

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/^\/api\/chart\?symbols=MOCK&range=6mo$/))
    expect(result.mode).toBe('live')
    expect(result.source).toMatch(/app market-data API/i)
    expect(result.scannedCount).toBe(1)
    expect(result.recommendations[0].symbol).toBe('MOCK')
    expect(result.recommendations[0].strategyFit).toMatch(/20 EMA/i)
  })

  it('ranks the same scanned universe differently for each strategy predicate', async () => {
    const closes = Array.from({ length: 90 }, () => 100)
    const symbols = {
      EMA: makeApiSymbol('EMA', closes, { close: 100, previousClose: 99, ema8: 98, ema20: 100.5, sma20: 101, sma50: 82, bbLower: 80, rsi14: 41 }),
      SMA: makeApiSymbol('SMA', closes, { close: 100, previousClose: 99, ema8: 96, ema20: 112, sma20: 106, sma50: 100.5, bbLower: 80, rsi14: 41 }),
      BBL: makeApiSymbol('BBL', closes, { close: 100, previousClose: 99, ema8: 96, ema20: 115, sma20: 106, sma50: 88, bbLower: 99, rsi14: 39 }),
      RSI: makeApiSymbol('RSI', closes, { close: 100, previousClose: 98, ema8: 94, ema20: 115, sma20: 105, sma50: 84, bbLower: 82, rsi14: 25 }),
      RCL: makeApiSymbol('RCL', closes, { close: 100, previousClose: 96, ema8: 98, ema20: 96, sma20: 97, sma50: 93, bbLower: 90, rsi14: 47 }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ symbols }) }))

    const universe = Object.keys(symbols)
    const ema = await scanStrategy('ema20-pullback-bounce', universe)
    const sma = await scanStrategy('sma50-defense', universe)
    const bb = await scanStrategy('lower-bollinger-reentry', universe)
    const rsi = await scanStrategy('rsi-oversold-reversal', universe)
    const reclaim = await scanStrategy('ema8-reclaim-after-pullback', universe)

    expect(ema.recommendations[0].symbol).toBe('EMA')
    expect(sma.recommendations[0].symbol).toBe('SMA')
    expect(bb.recommendations[0].symbol).toBe('BBL')
    expect(rsi.recommendations[0].symbol).toBe('RSI')
    expect(reclaim.recommendations[0].symbol).toBe('RCL')
    expect(new Set([ema, sma, bb, rsi, reclaim].map((result) => result.recommendations[0].symbol)).size).toBe(5)
  })

  it('returns real range fields and multi-point chart data for universe tiles', async () => {
    const closes = Array.from({ length: 90 }, (_, index) => 90 + index)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ symbols: { XLP: makeApiSymbol('XLP', closes) } }),
    }))

    const snapshot = await fetchSymbolSnapshot('XLP')

    expect(snapshot.dayLow).toBe(177)
    expect(snapshot.dayHigh).toBe(181)
    expect(snapshot.week52Low).toBe(86)
    expect(snapshot.week52High).toBe(183)
    expect(snapshot.chartPoints.length).toBeGreaterThan(50)
  })
})

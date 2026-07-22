import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSymbolSnapshot, scanStrategy } from './scannerEngine'

function makeApiSymbol(symbol, closes) {
  return {
    symbol,
    close: closes.at(-1),
    previousClose: closes.at(-2),
    dayHigh: closes.at(-1) + 2,
    dayLow: closes.at(-1) - 2,
    week52High: Math.max(...closes) + 4,
    week52Low: Math.min(...closes) - 4,
    ema8: closes.at(-1) - 1,
    ema20: closes.at(-1) + 1,
    sma20: closes.at(-1),
    sma50: closes.at(-1) - 2,
    bbLower: closes.at(-1) - 5,
    bbUpper: closes.at(-1) + 5,
    rsi14: 39,
    chartPoints: closes.slice(-65).map((close, index) => ({ date: `d${index}`, close, high: close + 1, low: close - 1 })),
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

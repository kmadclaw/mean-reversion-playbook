import { afterEach, describe, expect, it, vi } from 'vitest'
import { scanStrategy } from './scannerEngine'

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
    expect(supportRetest.strategyTitle).toBe('Prior Support / Breakout Retest')
    expect(smaDefense.strategyTitle).toBe('50 SMA Defense Setup')
    expect(supportRetest.recommendations[0].strategyFit).toMatch(/support|retest/i)
    expect(smaDefense.recommendations[0].strategyFit).toMatch(/50 SMA/i)
    expect(supportRetest.recommendations.map((trade) => trade.symbol).join(',')).not.toBe(
      smaDefense.recommendations.map((trade) => trade.symbol).join(','),
    )
  })

  it('uses live Yahoo chart data when the browser can fetch it', async () => {
    const closes = Array.from({ length: 80 }, (_, index) => 100 + index * 0.4)
    closes[79] = 118
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          chart: {
            result: [
              {
                timestamp: closes.map((_, index) => index),
                indicators: {
                  quote: [
                    {
                      close: closes,
                      high: closes.map((close) => close + 1),
                      low: closes.map((close) => close - 1),
                    },
                  ],
                },
              },
            ],
          },
        }),
      }),
    )

    const result = await scanStrategy('ema20-pullback-bounce', ['MOCK'])

    expect(result.mode).toBe('live')
    expect(result.recommendations[0].symbol).toBe('MOCK')
    expect(result.recommendations[0].strategyFit).toMatch(/20 EMA/i)
  })
})

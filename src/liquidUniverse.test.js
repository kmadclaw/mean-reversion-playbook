import { describe, expect, it } from 'vitest'
import { LIQUID_OPTIONS_UNIVERSE, getUniverseSymbols } from './liquidUniverse'

describe('liquid options universe', () => {
  it('contains a curated 100+ ticker universe for scanner breadth', () => {
    const symbols = getUniverseSymbols()

    expect(symbols.length).toBeGreaterThanOrEqual(100)
    expect(symbols.length).toBeLessThanOrEqual(150)
    expect(new Set(symbols).size).toBe(symbols.length)
    expect(symbols).toEqual(expect.arrayContaining(['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'JPM', 'XOM']))
  })

  it('stores display metadata for universe tiles', () => {
    const apple = LIQUID_OPTIONS_UNIVERSE.find((item) => item.symbol === 'AAPL')

    expect(apple).toMatchObject({ symbol: 'AAPL', name: expect.any(String), group: expect.any(String) })
  })
})

import { describe, expect, it } from 'vitest'
import { bullishSetups, strategyFramework } from './strategies'

describe('mean reversion pullback strategy content', () => {
  it('defines the core strategy framework for 4-6 week options', () => {
    expect(strategyFramework.timeframe).toContain('4–6 weeks')
    expect(strategyFramework.baselineMean).toEqual(['20 EMA', '50 SMA'])
    expect(strategyFramework.assetUniverse).toContain('Highly liquid stocks')
    expect(strategyFramework.trendFilter).toContain('20 EMA above 50 SMA')
  })

  it('includes all eight bullish setup types from the brainstorm', () => {
    expect(bullishSetups).toHaveLength(8)
    expect(bullishSetups.map((setup) => setup.title)).toEqual([
      '20 EMA Pullback Bounce',
      '20 EMA to 50 SMA Mean Zone Pullback',
      'Lower Bollinger Band Re-entry',
      'RSI Oversold Reversal',
      '50 SMA Defense Setup',
      'Prior Support / Breakout Retest',
      'Capitulation Wick Reversal',
      'EMA8 Reclaim After Pullback',
    ])
  })

  it('captures setup, trigger, structure, target, invalidation, and scanner fields for each setup', () => {
    for (const setup of bullishSetups) {
      expect(setup.pattern.length).toBeGreaterThanOrEqual(3)
      expect(setup.entryTriggers.length).toBeGreaterThanOrEqual(2)
      expect(setup.optionStructures.length).toBeGreaterThanOrEqual(1)
      expect(setup.targets.length).toBeGreaterThanOrEqual(1)
      expect(setup.invalidation.length).toBeGreaterThanOrEqual(1)
      expect(setup.scannerSeeds.length).toBeGreaterThanOrEqual(3)
    }
  })
})

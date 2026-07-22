import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './chart.js'

const catCloses = [
  648.41, 626.62, 635.92, 638.91, 643.28, 665.24, 657.36, 690.91,
  702.89, 691.82, 678.31, 726.2, 742.12, 742.37, 775, 758.29,
  774.2, 764.76, 751.97, 760.53, 759.74, 756.47, 768.23, 766.61,
  752.93, 742.83, 752.32, 722.18, 731.97, 706.08, 680.9, 704.82,
  716.68, 707.59, 700.69, 693.99, 699.78, 702, 693.62, 688.65,
  680.88, 701.7, 716.63, 719.04, 703.19, 695.4, 667.43, 708.46,
  730.32, 717.22, 721.24, 724.44, 771.58, 787.07, 790.66, 791.73,
  794.25, 770.17, 772.66, 794.65, 798.4, 800.45, 808.87, 835.24,
  830.79, 828.79, 817.87, 810.05, 890.11, 889.67, 874.78, 904.59,
  926.93, 895.69, 897.45, 926.79, 912.14, 902.3, 920.22, 888.31,
  863.95, 860.15, 872.56, 865.95, 879.89, 908.55, 909.93, 887.67,
  875.87, 865.36, 909.81, 926.18, 940.48, 904.28, 915.64, 914.7,
  856.16, 897.63, 910.57, 933.93, 945.46, 955.92, 985.82, 1022.28,
  984.24, 994.45, 1057.01, 997.47, 1033.19, 1064.9, 991.41, 963.53,
  969.92, 940.12, 948.08, 938.39, 952.41, 931.47, 933.34, 914.3,
  877.17, 880.28, 864.3, 889.97,
]

function yahooPayload(symbol, closes) {
  return {
    chart: {
      result: [{
        timestamp: closes.map((_, index) => 1_700_000_000 + index * 86_400),
        indicators: {
          quote: [{
            close: closes,
            high: closes.map((close) => close + 5),
            low: closes.map((close) => close - 5),
          }],
        },
      }],
    },
  }
}

function responseMock() {
  return {
    headers: {},
    statusCode: null,
    payload: null,
    setHeader(key, value) { this.headers[key] = value },
    status(code) { this.statusCode = code; return this },
    json(payload) { this.payload = payload; return this },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('market data chart API indicators', () => {
  it('calculates CAT RSI14 with Wilder smoothing like broker terminals', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => yahooPayload('CAT', catCloses),
    }))
    const response = responseMock()

    await handler({ query: { symbols: 'CAT', range: '6mo' } }, response)

    expect(response.statusCode).toBe(200)
    expect(response.payload.symbols.CAT.rsi14).toBeCloseTo(43.1, 1)
    expect(response.payload.symbols.CAT.rsi14).not.toBeCloseTo(20.1, 1)
  })
})

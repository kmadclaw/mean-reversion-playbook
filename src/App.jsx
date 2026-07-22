import { useEffect, useState } from 'react'
import './App.css'
import { LIQUID_OPTIONS_UNIVERSE } from './liquidUniverse'
import { fetchSymbolSnapshot, fetchUniverseSnapshots, scanStrategy } from './scannerEngine'
import { bullishSetups, processRules, qualityScoreRules, strategyFramework } from './strategies'

const pages = [
  { id: 'overview', label: 'Overview', eyebrow: 'r/meanreversion' },
  { id: 'rules', label: 'Core rules', eyebrow: 'Execution' },
  { id: 'strategies', label: 'Strategies', eyebrow: 'Setups' },
  { id: 'universe', label: 'Universe', eyebrow: 'Stocks' },
  { id: 'roadmap', label: 'Roadmap', eyebrow: 'Coming soon' },
]

function RuleList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function DetailGroup({ title, items }) {
  return (
    <section className="detail-group">
      <h4>{title}</h4>
      <RuleList items={items} />
    </section>
  )
}

function SideNav({ activePage, onSelectPage }) {
  return (
    <aside className="sidebar-card">
      <div className="brand-block">
        <div className="brand-mark">MR</div>
        <div>
          <p>Playbook</p>
          <span>Bullish pullbacks</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="Playbook sections">
        {pages.map((page) => {
          const isActive = page.id === activePage
          return (
            <button
              type="button"
              key={page.id}
              aria-current={isActive ? 'page' : undefined}
              className={isActive ? 'side-nav-item active' : 'side-nav-item'}
              onClick={() => onSelectPage(page.id)}
            >
              <span>{page.eyebrow}</span>
              {page.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p className="lede">{description}</p> : null}
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  )
}

function OverviewPage({ onSelectPage }) {
  return (
    <section className="content-page compact-page">
      <PageHeader
        eyebrow="Trading strategy library · sleek v0.3"
        title={strategyFramework.name}
        description={strategyFramework.premise}
        actions={
          <button className="button primary" type="button" onClick={() => onSelectPage('strategies')}>
            Select strategy
          </button>
        }
      />

      <div className="metric-strip" aria-label="Strategy framework summary">
        <div>
          <span>Timeframe</span>
          <strong>{strategyFramework.timeframe}</strong>
        </div>
        <div>
          <span>Universe</span>
          <strong>{strategyFramework.assetUniverse}</strong>
        </div>
        <div>
          <span>Baseline mean</span>
          <strong>{strategyFramework.baselineMean.join(' + ')}</strong>
        </div>
        <div>
          <span>Trend filter</span>
          <strong>{strategyFramework.trendFilter}</strong>
        </div>
      </div>
    </section>
  )
}

function RulesPage() {
  return (
    <section className="content-page">
      <PageHeader
        eyebrow="Execution mechanics"
        title="Core rules before any setup qualifies"
        description="Oversold creates a candidate. Confirmation creates the trade. Keep each rule compact enough to become a scanner predicate later."
      />
      <div className="process-grid">
        {processRules.map((group) => (
          <article className="process-card" key={group.title}>
            <h3>{group.title}</h3>
            <RuleList items={group.rules} />
          </article>
        ))}
      </div>
    </section>
  )
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`
}

function fallbackPrice(symbol) {
  return 60 + (symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 420)
}

function makeFallbackSnapshot(symbol) {
  const price = fallbackPrice(symbol)
  const chartPoints = Array.from({ length: 90 }, (_, index) => {
    const close = price * (0.9 + index / 900 + Math.sin(index / 5) / 50)
    return { date: `d${index}`, close: Number(close.toFixed(2)), high: Number((close * 1.012).toFixed(2)), low: Number((close * 0.988).toFixed(2)) }
  })
  return {
    symbol,
    price,
    changePercent: ((symbol.charCodeAt(0) % 9) - 4) / 2,
    dayLow: Number((price * 0.985).toFixed(2)),
    dayHigh: Number((price * 1.015).toFixed(2)),
    week52Low: Number((price * 0.72).toFixed(2)),
    week52High: Number((price * 1.18).toFixed(2)),
    rsi14: 48,
    ema8: Number((price * 0.99).toFixed(2)),
    ema20: Number((price * 0.98).toFixed(2)),
    ema50: Number((price * 0.965).toFixed(2)),
    sma50: Number((price * 0.95).toFixed(2)),
    bbLower: Number((price * 0.9).toFixed(2)),
    chartPoints,
  }
}

function getUniverseStock(symbol) {
  return LIQUID_OPTIONS_UNIVERSE.find((stock) => stock.symbol === symbol)
}

function PriceSparkline({ points }) {
  const safePoints = points.length ? points : [{ close: 1 }]
  const closes = safePoints.map((point) => (typeof point === 'number' ? point : point.close))
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const coords = closes
    .map((point, index) => `${(index / Math.max(1, closes.length - 1)) * 100},${60 - ((point - min) / span) * 50}`)
    .join(' ')

  return (
    <svg className="price-chart" viewBox="0 0 100 64" role="img" aria-label="Interactive chart display">
      <polyline points={coords} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {closes.map((point, index) => {
        const x = (index / Math.max(1, closes.length - 1)) * 100
        const y = 60 - ((point - min) / span) * 50
        return <circle key={`${index}-${point}`} cx={x} cy={y} r="1.1"><title>{`${safePoints[index].date ?? index}: ${formatCurrency(point)}`}</title></circle>
      })}
    </svg>
  )
}

function UniversePage() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [selectedRange, setSelectedRange] = useState('3mo')
  const [snapshot, setSnapshot] = useState(makeFallbackSnapshot('AAPL'))
  const fallbackSnapshots = () => Object.fromEntries(LIQUID_OPTIONS_UNIVERSE.map((stock) => [stock.symbol, makeFallbackSnapshot(stock.symbol)]))
  const [universeSnapshots, setUniverseSnapshots] = useState(fallbackSnapshots)
  const selectedStock = LIQUID_OPTIONS_UNIVERSE.find((stock) => stock.symbol === selectedSymbol) ?? LIQUID_OPTIONS_UNIVERSE[0]
  const ranges = [
    { label: '1M', value: '1mo', points: 22 },
    { label: '3M', value: '3mo', points: 65 },
    { label: '6M', value: '6mo', points: 130 },
  ]
  const activeRange = ranges.find((range) => range.value === selectedRange) ?? ranges[1]
  const visiblePoints = snapshot.chartPoints.slice(-activeRange.points)

  useEffect(() => {
    let active = true
    fetchUniverseSnapshots(LIQUID_OPTIONS_UNIVERSE.map((stock) => stock.symbol))
      .then((snapshots) => {
        if (!active) return
        setUniverseSnapshots((current) => ({
          ...current,
          ...Object.fromEntries(snapshots.map((nextSnapshot) => [nextSnapshot.symbol, nextSnapshot])),
        }))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setSnapshot(makeFallbackSnapshot(selectedSymbol))
    fetchSymbolSnapshot(selectedSymbol, '6mo')
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [selectedSymbol])

  return (
    <section className="content-page universe-page">
      <PageHeader
        eyebrow="Scanner coverage"
        title="Liquid options universe"
        description={`${LIQUID_OPTIONS_UNIVERSE.length} names from a curated 100–150 liquid option names universe. Select a table row to load the price detail panel and interactive chart display.`}
      />
      <div className="universe-layout">
        <div className="universe-table-wrap">
          <table className="universe-table" aria-label="Liquid options universe indicator table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Group</th>
                <th>Current</th>
                <th>RSI14</th>
                <th>8 EMA</th>
                <th>20 EMA</th>
                <th>50 EMA</th>
                <th>50 SMA</th>
                <th>52W range</th>
              </tr>
            </thead>
            <tbody>
              {LIQUID_OPTIONS_UNIVERSE.map((stock) => {
                const rowSnapshot = universeSnapshots[stock.symbol] ?? makeFallbackSnapshot(stock.symbol)
                const isActive = stock.symbol === selectedSymbol
                return (
                  <tr className={isActive ? 'active' : undefined} key={stock.symbol}>
                    <th scope="row" className="symbol-cell">
                      <div className="mobile-row-title">
                        <button
                          type="button"
                          className="universe-symbol-button"
                          onClick={() => {
                            setSelectedSymbol(stock.symbol)
                            setSelectedRange('3mo')
                          }}
                          aria-label={`Select ${stock.symbol}`}
                        >
                          {stock.symbol}
                        </button>
                        <div className="mobile-row-name">
                          <small>{stock.name}</small>
                        </div>
                        <div className="mobile-row-chips">
                          <span>{formatCurrency(rowSnapshot.price)}</span>
                          <span>RSI {rowSnapshot.rsi14}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="universe-symbol-button desktop-symbol"
                        onClick={() => {
                          setSelectedSymbol(stock.symbol)
                          setSelectedRange('3mo')
                        }}
                        aria-label={`Select ${stock.symbol}`}
                      >
                        {stock.symbol}
                      </button>
                    </th>
                    <td className="group-cell" data-label="Group">{stock.group}</td>
                    <td className="current-cell" data-label="Current">{formatCurrency(rowSnapshot.price)}</td>
                    <td className="rsi-cell" data-label="RSI14">{rowSnapshot.rsi14}</td>
                    <td data-label="8 EMA">{formatCurrency(rowSnapshot.ema8)}</td>
                    <td data-label="20 EMA">{formatCurrency(rowSnapshot.ema20)}</td>
                    <td data-label="50 EMA">{formatCurrency(rowSnapshot.ema50)}</td>
                    <td data-label="50 SMA">{formatCurrency(rowSnapshot.sma50)}</td>
                    <td data-label="52W range"><PriceRangeBar low={rowSnapshot.week52Low} high={rowSnapshot.week52High} price={rowSnapshot.price} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <aside className="chart-panel" role="region" aria-label="Interactive price chart">
          <div className="chart-panel__header">
            <div>
              <p className="eyebrow">{selectedStock.group}</p>
              <h2>{selectedSymbol} - {selectedStock.name}</h2>
            </div>
            <div className={snapshot.changePercent >= 0 ? 'price-change positive' : 'price-change negative'}>
              {snapshot.changePercent >= 0 ? '+' : ''}{snapshot.changePercent.toFixed(2)}%
            </div>
          </div>
          <div className="price-hero">
            <span>Last price</span>
            <strong>{formatCurrency(snapshot.price)}</strong>
          </div>
          <PriceSparkline points={visiblePoints} />
          <div className="chart-controls" aria-label="Chart range controls">
            {ranges.map((range) => (
              <button
                type="button"
                key={range.value}
                className={range.value === selectedRange ? 'active' : undefined}
                onClick={() => setSelectedRange(range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>
          <dl className="price-stats price-stats--wide">
            <div><dt>Day low</dt><dd>{formatCurrency(snapshot.dayLow)}</dd></div>
            <div><dt>Day high</dt><dd>{formatCurrency(snapshot.dayHigh)}</dd></div>
            <div><dt>52W low</dt><dd>{formatCurrency(snapshot.week52Low)}</dd></div>
            <div><dt>52W high</dt><dd>{formatCurrency(snapshot.week52High)}</dd></div>
            <div><dt>RSI14</dt><dd>{snapshot.rsi14}</dd></div>
            <div><dt>8 EMA</dt><dd>{formatCurrency(snapshot.ema8)}</dd></div>
            <div><dt>20 EMA</dt><dd>{formatCurrency(snapshot.ema20)}</dd></div>
            <div><dt>50 EMA</dt><dd>{formatCurrency(snapshot.ema50)}</dd></div>
            <div><dt>50 SMA</dt><dd>{formatCurrency(snapshot.sma50)}</dd></div>
            <div><dt>BB lower</dt><dd>{formatCurrency(snapshot.bbLower)}</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  )
}

function PriceRangeBar({ low, high, price }) {
  const span = high - low
  const position = span > 0 ? Math.max(0, Math.min(100, ((price - low) / span) * 100)) : 50
  return (
    <div className="range-cell" aria-label={`52 week range ${formatCurrency(low)} to ${formatCurrency(high)}`}>
      <div className="range-track"><span style={{ left: `${position}%` }} /></div>
      <div className="range-labels"><small>{formatCurrency(low)}</small><small>{position.toFixed(0)}%</small><small>{formatCurrency(high)}</small></div>
    </div>
  )
}

function ScannerResults({ result }) {
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 12
  const totalResults = result.recommendations.length
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize))
  const safePageIndex = Math.min(pageIndex, totalPages - 1)
  const pageStart = safePageIndex * pageSize
  const visibleRecommendations = result.recommendations.slice(pageStart, pageStart + pageSize)
  const pageEnd = pageStart + visibleRecommendations.length
  const generated = new Date(result.generatedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const modeLabel = result.mode === 'live' ? 'Live browser scan' : 'Snapshot fallback'

  return (
    <section className="scanner-results" role="region" aria-label="Scanner recommendations">
      <div className="scanner-results__header">
        <div>
          <p className="eyebrow">{modeLabel} · {result.source}</p>
          <h3>{result.strategyTitle} scanner results</h3>
          <p>Last run: {generated}. Ranked by the selected setup; table shows technical indicators only.</p>
        </div>
        <span>{pageStart + 1}-{pageEnd} of {totalResults} shown · {result.passedCount ?? totalResults} passed · {result.scannedCount ?? '—'} scanned</span>
      </div>

      <div className="scanner-pagination" aria-label="Scanner pagination">
        <button type="button" onClick={() => setPageIndex((current) => Math.max(0, current - 1))} disabled={safePageIndex === 0} aria-label="Previous scanner results">
          Previous
        </button>
        <span>Page {safePageIndex + 1} of {totalPages}</span>
        <button type="button" onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))} disabled={safePageIndex >= totalPages - 1} aria-label="Next scanner results">
          Next
        </button>
      </div>

      <div className="scanner-table-wrap">
        <table className="scanner-table" aria-label="Scanner indicator table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Symbol</th>
              <th>Score</th>
              <th>Current</th>
              <th>RSI14</th>
              <th>8 EMA</th>
              <th>20 EMA</th>
              <th>50 EMA</th>
              <th>50 SMA</th>
              <th>BB lower</th>
              <th>52W range</th>
            </tr>
          </thead>
          <tbody>
            {visibleRecommendations.map((trade, index) => {
              const rank = pageStart + index + 1
              const stock = getUniverseStock(trade.symbol)
              return (
                <tr className="scanner-mobile-row" key={trade.symbol}>
                  <td className="rank-cell" data-label="Rank">#{rank}</td>
                  <th scope="row" className="symbol-cell" data-mobile-symbol="true">
                    <div className="mobile-row-title">
                      <span className="mobile-rank">#{rank}</span>
                      <div className="mobile-row-name">
                        <strong>{trade.symbol}</strong>
                        <small>{stock?.name ?? stock?.group ?? 'Ticker'}</small>
                      </div>
                      <div className="mobile-row-chips">
                        <span>Score {trade.score}</span>
                        <span>RSI {trade.rsi14}</span>
                      </div>
                    </div>
                    <span className="desktop-symbol">{trade.symbol}</span>
                  </th>
                  <td className="score-cell" data-label="Score">{trade.score}</td>
                  <td data-label="Current">{formatCurrency(trade.currentPrice ?? trade.close)}</td>
                  <td className="rsi-cell" data-label="RSI14">{trade.rsi14}</td>
                  <td data-label="8 EMA">{formatCurrency(trade.ema8)}</td>
                  <td data-label="20 EMA">{formatCurrency(trade.ema20)}</td>
                  <td data-label="50 EMA">{formatCurrency(trade.ema50)}</td>
                  <td data-label="50 SMA">{formatCurrency(trade.sma50)}</td>
                  <td data-label="BB lower">{formatCurrency(trade.bbLower)}</td>
                  <td data-label="52W range"><PriceRangeBar low={trade.week52Low} high={trade.week52High} price={trade.currentPrice ?? trade.close} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StrategyDetail({ setup, scannerStatus, scannerResult, onRunScanner }) {
  return (
    <article className="strategy-detail" role="tabpanel" id={`${setup.id}-panel`} aria-labelledby={`${setup.id}-tab`}>
      <div className="detail-hero">
        <div>
          <div className="setup-card__topline">
            <span className="rank">#{setup.rank}</span>
            <span className="label">{setup.label}</span>
          </div>
          <h2>{setup.title}</h2>
          <p className="summary">{setup.summary}</p>
        </div>
        <div className="future-actions" aria-label="Strategy tools">
          <button type="button" className="scanner-action" onClick={onRunScanner} disabled={scannerStatus === 'scanning'} aria-busy={scannerStatus === 'scanning'}>
            {scannerStatus === 'scanning' ? 'Scanning…' : 'Run scanner'}
          </button>
          <button type="button" disabled aria-label="Backtest coming soon">
            Backtest coming soon
          </button>
        </div>
      </div>

      {scannerStatus === 'scanning' ? <div className="scanner-loading" role="status">Scanning live market data for {setup.title}…</div> : null}
      {scannerStatus === 'done' && scannerResult ? <ScannerResults key={`${scannerResult.strategyId}-${scannerResult.generatedAt}`} result={scannerResult} /> : null}

      <div className="rule-grid compact">
        <DetailGroup title="Pattern" items={setup.pattern} />
        <DetailGroup title="Entry triggers" items={setup.entryTriggers} />
        <DetailGroup title="Options expression" items={setup.optionStructures} />
        <DetailGroup title="Targets" items={setup.targets} />
        <DetailGroup title="Invalidation" items={setup.invalidation} />
        <DetailGroup title="Scanner seeds" items={setup.scannerSeeds} />
      </div>
    </article>
  )
}

function StrategiesPage({ sortedSetups, activeSetup, onSelectSetup, scannerStatus, scannerResult, onRunScanner }) {
  return (
    <section className="content-page strategy-workspace">
      <PageHeader
        eyebrow="Strategy selector"
        title="Select a bullish setup"
        description="Choose a setup on the left. The detail page loads on the right, like a compact Reddit sidebar + post view."
      />

      <div className="strategy-shell">
        <aside className="strategy-tabs" aria-label="Bullish setup types">
          <div role="tablist" aria-orientation="vertical">
            {sortedSetups.map((setup) => {
              const isActive = setup.id === activeSetup.id
              return (
                <button
                  type="button"
                  role="tab"
                  id={`${setup.id}-tab`}
                  aria-controls={`${setup.id}-panel`}
                  aria-selected={isActive}
                  className={isActive ? 'strategy-tab active' : 'strategy-tab'}
                  key={setup.id}
                  onClick={() => onSelectSetup(setup.id)}
                >
                  <span>#{setup.rank}</span>
                  {setup.title}
                </button>
              )
            })}
          </div>
        </aside>

        <StrategyDetail setup={activeSetup} scannerStatus={scannerStatus} scannerResult={scannerResult} onRunScanner={onRunScanner} />
      </div>
    </section>
  )
}

function RoadmapPage() {
  return (
    <section className="content-page roadmap">
      <PageHeader eyebrow="Later version" title="Scanner build path" description={strategyFramework.scannerVision} />
      <div className="roadmap-grid">
        <article>
          <h3>Phase 1 · Strategy library</h3>
          <p>Define human-readable strategies, chart rules, entry triggers, and invalidation logic.</p>
        </article>
        <article>
          <h3>Phase 2 · Deterministic signals</h3>
          <p>Translate each strategy into indicator predicates: EMA/SMA state, Bollinger events, RSI, candles, support distance.</p>
        </article>
        <article>
          <h3>Phase 3 · Options layer</h3>
          <p>Attach expiry selection, delta bands, liquidity filters, bid/ask spread checks, and debit/credit risk templates.</p>
        </article>
      </div>
      <div className="score-card">
        <h3>Starting quality score</h3>
        <div className="score-list">
          {qualityScoreRules.map((rule) => (
            <span key={rule}>{rule}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function App() {
  const sortedSetups = [...bullishSetups].sort((a, b) => a.rank - b.rank)
  const [activePage, setActivePage] = useState('overview')
  const [activeSetupId, setActiveSetupId] = useState(sortedSetups[0].id)
  const [scannerStatus, setScannerStatus] = useState('idle')
  const [scannerResult, setScannerResult] = useState(null)
  const activeSetup = sortedSetups.find((setup) => setup.id === activeSetupId) ?? sortedSetups[0]

  const handleSelectSetup = (setupId) => {
    setActiveSetupId(setupId)
    setScannerStatus('idle')
    setScannerResult(null)
  }

  const handleRunScanner = async () => {
    setScannerStatus('scanning')
    setScannerResult(null)
    const result = await scanStrategy(activeSetup.id)
    setScannerResult(result)
    setScannerStatus('done')
  }

  return (
    <main className="app-shell">
      <SideNav activePage={activePage} onSelectPage={setActivePage} />
      <div className="content-shell">
        {activePage === 'overview' ? <OverviewPage onSelectPage={setActivePage} /> : null}
        {activePage === 'rules' ? <RulesPage /> : null}
        {activePage === 'strategies' ? (
          <StrategiesPage
            sortedSetups={sortedSetups}
            activeSetup={activeSetup}
            onSelectSetup={handleSelectSetup}
            scannerStatus={scannerStatus}
            scannerResult={scannerResult}
            onRunScanner={handleRunScanner}
          />
        ) : null}
        {activePage === 'universe' ? <UniversePage /> : null}
        {activePage === 'roadmap' ? <RoadmapPage /> : null}
      </div>
    </main>
  )
}

export default App

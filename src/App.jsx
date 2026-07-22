import { useEffect, useState } from 'react'
import './App.css'
import { LIQUID_OPTIONS_UNIVERSE } from './liquidUniverse'
import { fetchSymbolSnapshot, scanStrategy } from './scannerEngine'
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
  return {
    symbol,
    price,
    changePercent: ((symbol.charCodeAt(0) % 9) - 4) / 2,
    rsi14: 48,
    ema20: Number((price * 0.98).toFixed(2)),
    sma50: Number((price * 0.95).toFixed(2)),
    chartPoints: [price * 0.92, price * 0.96, price * 0.94, price * 1.01, price].map((value) => Number(value.toFixed(2))),
  }
}

function PriceSparkline({ points }) {
  const safePoints = points.length ? points : [1, 1]
  const min = Math.min(...safePoints)
  const max = Math.max(...safePoints)
  const span = max - min || 1
  const coords = safePoints
    .map((point, index) => `${(index / Math.max(1, safePoints.length - 1)) * 100},${60 - ((point - min) / span) * 50}`)
    .join(' ')

  return (
    <svg className="price-chart" viewBox="0 0 100 64" role="img" aria-label="Interactive chart display">
      <polyline points={coords} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UniversePage() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [snapshot, setSnapshot] = useState(makeFallbackSnapshot('AAPL'))
  const selectedStock = LIQUID_OPTIONS_UNIVERSE.find((stock) => stock.symbol === selectedSymbol) ?? LIQUID_OPTIONS_UNIVERSE[0]

  useEffect(() => {
    let active = true
    setSnapshot(makeFallbackSnapshot(selectedSymbol))
    fetchSymbolSnapshot(selectedSymbol)
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
        description={`${LIQUID_OPTIONS_UNIVERSE.length} names from a curated 100–150 liquid option names universe. Click a tile to load the price detail panel and interactive chart display.`}
      />
      <div className="universe-layout">
        <div className="universe-grid" aria-label="Stock universe tiles">
          {LIQUID_OPTIONS_UNIVERSE.map((stock) => (
            <button
              type="button"
              key={stock.symbol}
              className={stock.symbol === selectedSymbol ? 'universe-tile active' : 'universe-tile'}
              onClick={() => setSelectedSymbol(stock.symbol)}
            >
              <strong>{stock.symbol}</strong>
              <span>{stock.name}</span>
              <small>{stock.group}</small>
            </button>
          ))}
        </div>
        <aside className="chart-panel" role="region" aria-label="Interactive price chart">
          <div className="chart-panel__header">
            <div>
              <p className="eyebrow">{selectedStock.group}</p>
              <h2>{selectedSymbol} price chart</h2>
              <p>{selectedStock.name}</p>
            </div>
            <div className={snapshot.changePercent >= 0 ? 'price-change positive' : 'price-change negative'}>
              {snapshot.changePercent >= 0 ? '+' : ''}{snapshot.changePercent.toFixed(2)}%
            </div>
          </div>
          <div className="price-hero">
            <span>Last price</span>
            <strong>{formatCurrency(snapshot.price)}</strong>
          </div>
          <PriceSparkline points={snapshot.chartPoints} />
          <div className="chart-controls" aria-label="Chart range controls">
            <button type="button">1M</button>
            <button type="button" className="active">3M</button>
            <button type="button">6M</button>
          </div>
          <dl className="price-stats">
            <div><dt>RSI14</dt><dd>{snapshot.rsi14}</dd></div>
            <div><dt>20 EMA</dt><dd>{formatCurrency(snapshot.ema20)}</dd></div>
            <div><dt>50 SMA</dt><dd>{formatCurrency(snapshot.sma50)}</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  )
}

function ScannerResults({ result }) {
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
          <h3>{result.strategyTitle} scanner recommendations</h3>
          <p>Last run: {generated}. Results are generated for the selected strategy only; option structures are templates, not exact contracts.</p>
        </div>
        <span>{result.recommendations.length} shown · {result.passedCount ?? result.recommendations.length} passed · {result.scannedCount ?? '—'} scanned</span>
      </div>

      <div className="recommendation-list">
        {result.recommendations.map((trade, index) => (
          <article className="recommendation-card" key={trade.symbol}>
            <div className="recommendation-rank">#{index + 1}</div>
            <div className="recommendation-main">
              <div className="recommendation-title">
                <h4>{trade.symbol}</h4>
                <span>{trade.direction}</span>
              </div>
              <p><strong>Strategy fit:</strong> {trade.strategyFit}</p>
              <p>{trade.reasoning}</p>
              {trade.warnings ? <small>{trade.warnings}</small> : null}
            </div>
            <dl className="recommendation-stats">
              <div>
                <dt>Score</dt>
                <dd>{trade.score}</dd>
              </div>
              <div>
                <dt>Structure</dt>
                <dd>{trade.structure}</dd>
              </div>
              <div>
                <dt>Expiry</dt>
                <dd>{trade.expiry} · {trade.dte} DTE</dd>
              </div>
              <div>
                <dt>Close / Target / Stop</dt>
                <dd>{formatCurrency(trade.close)} → {formatCurrency(trade.target)} / {formatCurrency(trade.invalidation)}</dd>
              </div>
              <div>
                <dt>RSI14</dt>
                <dd>{trade.rsi14}</dd>
              </div>
            </dl>
          </article>
        ))}
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
      {scannerStatus === 'done' && scannerResult ? <ScannerResults result={scannerResult} /> : null}

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

import { useState } from 'react'
import './App.css'
import { bullishSetups, processRules, qualityScoreRules, strategyFramework } from './strategies'

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

function StrategyDetail({ setup }) {
  return (
    <article className="strategy-detail" role="tabpanel" id={`${setup.id}-panel`} aria-labelledby={`${setup.id}-tab`}>
      <div className="detail-hero">
        <div>
          <div className="setup-card__topline">
            <span className="rank">#{setup.rank}</span>
            <span className="label">{setup.label}</span>
          </div>
          <h3>{setup.title}</h3>
          <p className="summary">{setup.summary}</p>
        </div>
        <div className="future-actions" aria-label="Future tools">
          <button type="button" disabled aria-label="Scanner coming soon">
            Scanner coming soon
          </button>
          <button type="button" disabled aria-label="Backtest coming soon">
            Backtest coming soon
          </button>
        </div>
      </div>

      <div className="rule-grid compact">
        <DetailGroup title="Pattern" items={setup.pattern} />
        <DetailGroup title="Entry triggers" items={setup.entryTriggers} />
        <DetailGroup title="Options expression" items={setup.optionStructures} />
        <DetailGroup title="Targets" items={setup.targets} />
        <DetailGroup title="Invalidation" items={setup.invalidation} />
        <DetailGroup title="Future scanner seeds" items={setup.scannerSeeds} />
      </div>
    </article>
  )
}

function App() {
  const sortedSetups = [...bullishSetups].sort((a, b) => a.rank - b.rank)
  const [activeSetupId, setActiveSetupId] = useState(sortedSetups[0].id)
  const activeSetup = sortedSetups.find((setup) => setup.id === activeSetupId) ?? sortedSetups[0]

  return (
    <main>
      <nav className="top-nav" aria-label="Strategy navigation">
        <a href="#framework">Framework</a>
        <a href="#rules">Rules</a>
        <a href="#strategies">Strategies</a>
        <a href="#scanner-roadmap">Roadmap</a>
      </nav>

      <section className="hero" id="framework">
        <div className="eyebrow">Trading strategy library · v0.2</div>
        <h1>{strategyFramework.name}</h1>
        <p className="lede">{strategyFramework.premise}</p>
        <div className="hero-actions">
          <a className="button primary" href="#strategies">Select a strategy</a>
          <a className="button secondary" href="#scanner-roadmap">Future scanners</a>
        </div>
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

      <section className="panel" id="rules">
        <div className="section-heading">
          <span className="eyebrow">Execution mechanics</span>
          <h2>Core rules before any setup qualifies</h2>
          <p>
            Oversold creates a candidate. Confirmation creates the trade. Keep the rules simple enough to become
            scanner predicates later.
          </p>
        </div>
        <div className="process-grid">
          {processRules.map((group) => (
            <article className="process-card" key={group.title}>
              <h3>{group.title}</h3>
              <RuleList items={group.rules} />
            </article>
          ))}
        </div>
      </section>

      <section className="panel alt strategy-workspace" id="strategies">
        <div className="section-heading">
          <span className="eyebrow">Strategy selector</span>
          <h2>Pick one setup, read one clean strategy page</h2>
          <p>
            Tabs keep the UX simple and accessible. Scanner and backtest actions are visible but disabled to signal
            planned future versions.
          </p>
        </div>

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
                    onClick={() => setActiveSetupId(setup.id)}
                  >
                    <span>#{setup.rank}</span>
                    {setup.title}
                  </button>
                )
              })}
            </div>
          </aside>

          <StrategyDetail setup={activeSetup} />
        </div>
      </section>

      <section className="panel roadmap" id="scanner-roadmap">
        <div className="section-heading">
          <span className="eyebrow">Later version</span>
          <h2>Scanner build path</h2>
          <p>{strategyFramework.scannerVision}</p>
        </div>
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
    </main>
  )
}

export default App

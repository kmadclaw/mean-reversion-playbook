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

function SetupCard({ setup }) {
  return (
    <article className="setup-card" id={setup.id}>
      <div className="setup-card__topline">
        <span className="rank">#{setup.rank}</span>
        <span className="label">{setup.label}</span>
      </div>
      <h3>{setup.title}</h3>
      <p className="summary">{setup.summary}</p>
      <div className="rule-grid compact">
        <section>
          <h4>Pattern</h4>
          <RuleList items={setup.pattern} />
        </section>
        <section>
          <h4>Entry triggers</h4>
          <RuleList items={setup.entryTriggers} />
        </section>
        <section>
          <h4>Options expression</h4>
          <RuleList items={setup.optionStructures} />
        </section>
        <section>
          <h4>Targets</h4>
          <RuleList items={setup.targets} />
        </section>
        <section>
          <h4>Invalidation</h4>
          <RuleList items={setup.invalidation} />
        </section>
        <section>
          <h4>Future scanner seeds</h4>
          <RuleList items={setup.scannerSeeds} />
        </section>
      </div>
    </article>
  )
}

function App() {
  const sortedSetups = [...bullishSetups].sort((a, b) => a.rank - b.rank)

  return (
    <main>
      <nav className="top-nav" aria-label="Strategy navigation">
        <a href="#framework">Framework</a>
        <a href="#rules">Rules</a>
        <a href="#setups">Setups</a>
        <a href="#scanner-roadmap">Scanner roadmap</a>
      </nav>

      <section className="hero" id="framework">
        <div className="eyebrow">Trading strategy library · v0.1</div>
        <h1>{strategyFramework.name}</h1>
        <p className="lede">{strategyFramework.premise}</p>
        <div className="hero-actions">
          <a className="button primary" href="#setups">Review bullish setups</a>
          <a className="button secondary" href="#scanner-roadmap">Scanner roadmap</a>
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
            The scanner version should separate setup conditions from entry triggers. Oversold creates a candidate;
            confirmation creates the trade.
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

      <section className="panel alt" id="setups">
        <div className="section-heading">
          <span className="eyebrow">Bullish setup catalog</span>
          <h2>Eight pullback patterns to turn into scanner modules</h2>
          <p>
            Ranked by setup quality. Each card has chart conditions, entry confirmation, options expression,
            target, invalidation, and initial scanner fields.
          </p>
        </div>
        <div className="setup-grid">
          {sortedSetups.map((setup) => (
            <SetupCard key={setup.id} setup={setup} />
          ))}
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

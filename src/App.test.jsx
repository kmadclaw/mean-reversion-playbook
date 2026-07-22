import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('App strategy navigation', () => {
  it('loads pages from a compact Reddit-inspired side navigation', () => {
    render(<App />)

    const sidebar = screen.getByRole('navigation', { name: /Playbook sections/i })
    expect(within(sidebar).getByRole('button', { name: /Overview/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { name: /Uptrend Pullback Mean Reversion/i })).toBeInTheDocument()

    fireEvent.click(within(sidebar).getByRole('button', { name: /Core rules/i }))

    expect(within(sidebar).getByRole('button', { name: /Core rules/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { name: /Core rules before any setup qualifies/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Uptrend Pullback Mean Reversion/i })).not.toBeInTheDocument()
  })

  it('renders a compact strategy page with strategy selection and opens selected details', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Strategies/i }))

    expect(screen.getByRole('heading', { name: /Select a bullish setup/i })).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(8)
    expect(screen.getByRole('tab', { name: /Prior Support/i })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('tab', { name: /50 SMA Defense/i }))

    expect(screen.getByRole('tab', { name: /50 SMA Defense/i })).toHaveAttribute('aria-selected', 'true')
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { name: '50 SMA Defense Setup' })).toBeInTheDocument()
    expect(within(panel).getByText(/Last line of trend support/i)).toBeInTheDocument()
  })

  it('loads the universe page with compact stock title, range stats, and interactive chart controls', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Universe/i }))

    expect(screen.getByRole('heading', { name: /Liquid options universe/i })).toBeInTheDocument()
    expect(screen.getByText(/100–150 liquid option names/i)).toBeInTheDocument()
    expect(screen.getAllByText(/AAPL/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Apple/).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /XLP/i }))

    const chart = screen.getByRole('region', { name: /Interactive price chart/i })
    expect(within(chart).getByRole('heading', { name: /XLP - Consumer Staples SPDR/i })).toBeInTheDocument()
    expect(within(chart).queryByText(/price chart/i)).not.toBeInTheDocument()
    expect(within(chart).getByRole('img', { name: /Interactive chart display/i })).toBeInTheDocument()
    expect(within(chart).getByText(/Day low/i)).toBeInTheDocument()
    expect(within(chart).getByText(/Day high/i)).toBeInTheDocument()
    expect(within(chart).getByText(/52W low/i)).toBeInTheDocument()
    expect(within(chart).getByText(/52W high/i)).toBeInTheDocument()

    const oneMonth = within(chart).getByRole('button', { name: /1M/i })
    fireEvent.click(oneMonth)
    expect(oneMonth).toHaveClass('active')
  })

  it('runs the selected strategy scanner and shows strategy-specific recommendations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Strategies/i }))
    fireEvent.click(screen.getByRole('tab', { name: /50 SMA Defense/i }))

    const scannerButton = screen.getByRole('button', { name: /^Run scanner$/i })
    const backtestButton = screen.getByRole('button', { name: /Backtest coming soon/i })
    expect(scannerButton).toBeEnabled()
    expect(backtestButton).toBeDisabled()

    fireEvent.click(scannerButton)

    expect(screen.getByText(/Scanning live market data/i)).toBeInTheDocument()
    const results = await screen.findByRole('region', { name: /Scanner recommendations/i })
    expect(within(results).getByRole('heading', { name: /50 SMA Defense Setup scanner results/i })).toBeInTheDocument()
    expect(within(results).getByText(/Ranked by the selected setup/i)).toBeInTheDocument()
    expect(within(results).getByRole('table', { name: /Scanner indicator table/i })).toBeInTheDocument()
    expect(within(results).getByRole('columnheader', { name: /Symbol/i })).toBeInTheDocument()
    expect(within(results).getByRole('columnheader', { name: /Score/i })).toBeInTheDocument()
    expect(within(results).getByRole('columnheader', { name: /Current/i })).toBeInTheDocument()
    expect(within(results).getByRole('columnheader', { name: /RSI14/i })).toBeInTheDocument()
    expect(within(results).getByRole('columnheader', { name: /8 EMA/i })).toBeInTheDocument()
    expect(within(results).getByRole('columnheader', { name: /20 EMA/i })).toBeInTheDocument()
    expect(within(results).getByRole('columnheader', { name: /50 EMA/i })).toBeInTheDocument()
    expect(within(results).getByRole('columnheader', { name: /52W range/i })).toBeInTheDocument()
    expect(within(results).queryByText(/Strategy fit:/i)).not.toBeInTheDocument()
    expect(within(results).queryByText(/Bullish bounce/i)).not.toBeInTheDocument()
    expect(within(results).queryByText(/CALL_DEBIT_SPREAD/i)).not.toBeInTheDocument()
    expect(within(results).queryByText(/DTE/i)).not.toBeInTheDocument()
    expect(within(results).queryByText(/Close \/ Target \/ Stop/i)).not.toBeInTheDocument()
    expect(within(results).getAllByText(/Snapshot fallback/i).length).toBeGreaterThan(0)
    expect(within(results).queryByText(/exact options strikes are not selected yet/i)).not.toBeInTheDocument()
    expect(within(results).getByText(/Page 1/i)).toBeInTheDocument()
    expect(within(results).getByRole('button', { name: /Previous scanner results/i })).toBeDisabled()
    const nextPage = within(results).getByRole('button', { name: /Next scanner results/i })
    expect(nextPage).toBeEnabled()
    expect(within(results).getByText('MCD')).toBeInTheDocument()

    fireEvent.click(nextPage)

    expect(within(results).getByText(/Page 2/i)).toBeInTheDocument()
    expect(within(results).queryByText('MCD')).not.toBeInTheDocument()
    expect(within(results).getByText(/#13/)).toBeInTheDocument()
  })
})

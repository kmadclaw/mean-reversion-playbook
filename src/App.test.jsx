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

  it('loads the universe page with stock tiles and an interactive chart panel', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Universe/i }))

    expect(screen.getByRole('heading', { name: /Liquid options universe/i })).toBeInTheDocument()
    expect(screen.getByText(/100–150 liquid option names/i)).toBeInTheDocument()
    expect(screen.getAllByText(/AAPL/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Apple/).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /NVDA/i }))

    const chart = screen.getByRole('region', { name: /Interactive price chart/i })
    expect(within(chart).getByRole('heading', { name: /NVDA price chart/i })).toBeInTheDocument()
    expect(within(chart).getByRole('img', { name: /Interactive chart display/i })).toBeInTheDocument()
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
    expect(within(results).getByRole('heading', { name: /50 SMA Defense Setup scanner recommendations/i })).toBeInTheDocument()
    expect(within(results).getAllByText(/50 SMA defense candidate/i).length).toBeGreaterThan(0)
    expect(within(results).getByText(/Snapshot fallback/i)).toBeInTheDocument()
    expect(within(results).getByText('MCD')).toBeInTheDocument()
  })
})

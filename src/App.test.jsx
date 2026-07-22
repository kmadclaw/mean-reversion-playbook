import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(() => cleanup())

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

  it('shows disabled scanner and backtest buttons as future features on the strategy page', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Strategies/i }))

    const scannerButton = screen.getByRole('button', { name: /Scanner coming soon/i })
    const backtestButton = screen.getByRole('button', { name: /Backtest coming soon/i })

    expect(scannerButton).toBeDisabled()
    expect(backtestButton).toBeDisabled()
  })
})

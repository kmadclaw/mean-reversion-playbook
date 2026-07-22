import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(() => cleanup())

describe('App strategy navigation', () => {
  it('renders strategies as accessible tabs and opens a selected strategy detail page', () => {
    render(<App />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(8)
    expect(screen.getByRole('tab', { name: /Prior Support/i })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('tab', { name: /50 SMA Defense/i }))

    expect(screen.getByRole('tab', { name: /50 SMA Defense/i })).toHaveAttribute('aria-selected', 'true')
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { name: '50 SMA Defense Setup' })).toBeInTheDocument()
    expect(within(panel).getByText(/Last line of trend support/i)).toBeInTheDocument()
  })

  it('shows disabled scanner and backtest buttons as future features', () => {
    render(<App />)

    const scannerButton = screen.getByRole('button', { name: /Scanner coming soon/i })
    const backtestButton = screen.getByRole('button', { name: /Backtest coming soon/i })

    expect(scannerButton).toBeDisabled()
    expect(backtestButton).toBeDisabled()
  })
})

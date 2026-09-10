import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';

vi.mock('../src/nivoCharts.jsx', () => ({
  NivoChart: ({ options }) => <div data-testid="nivo-chart">{options?.title?.text || 'chart'}</div>
}));

vi.mock('../src/services/marketWorkerClient.js', async () => {
  const service = await import('../src/services/marketService.js');
  return {
    analyseInWorker: (rows, options) => Promise.resolve(service.analyse(rows, options)),
    parseCsvFileInWorker: file => Promise.resolve({
      name: file.name,
      invalidDateCount: 0,
      rows: [{
        'Market Name': 'Test Item',
        'Game Name': 'Test Game',
        Type: 'Purchase',
        'Price in Cents': '100',
        'Display Price': '$1.00',
        'Acted On': '2025-01-01',
        _type: 'purchase',
        _price: 100,
        _currency: 'USD',
        _date: '2025-01-01T00:00:00.000Z',
        _hasTime: false,
        _index: 0
      }]
    })
  };
});

describe('MarketMemento React UI', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders onboarding and loads the demo dashboard', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /Pazar geçmişini kolayca incele/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Örnek verilerle keşfet/i }));

    expect(await screen.findByRole('heading', { name: 'Pazar geçmişin' })).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Demo verisi · 48 kayıt')).toBeInTheDocument();
    expect(screen.getByText('Gerçekleşmemiş ROI')).toBeInTheDocument();
  });

  it('switches language and exposes accessible dashboard tabs', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(await screen.findByRole('heading', { name: /Explore your market/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Explore sample data/i }));
    expect(await screen.findByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-controls', 'overview-panel');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });

  it('filters demo transactions by transaction type', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Örnek verilerle keşfet/i }));
    await screen.findByRole('heading', { name: 'Pazar geçmişin' });

    fireEvent.change(screen.getByRole('combobox', { name: 'İşlem türü' }), { target: { value: 'sale' } });
    await waitFor(() => expect(screen.getByText((_, element) => element?.textContent === 'Demo verisi · 16 kayıt')).toBeInTheDocument());
  });
});

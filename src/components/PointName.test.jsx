import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import PointName from './PointName';

describe('PointName', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('retries a lookup that failed instead of keeping the fallback forever', async () => {
    const fetch = vi.fn()
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValueOnce({ json: () => Promise.resolve({ address: { town: 'Moab', state: 'Utah' } }) });
    vi.stubGlobal('fetch', fetch);

    const first = render(<PointName lat={38.57} lon={-109.55} fallback="Point 2" />);
    expect(await screen.findByText('Point 2')).toBeInTheDocument();
    first.unmount();

    render(<PointName lat={38.57} lon={-109.55} fallback="Point 2" />);
    // lookups are spaced 1.1 s apart
    await waitFor(() => expect(screen.getByText('Moab, Utah')).toBeInTheDocument(), { timeout: 3000 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

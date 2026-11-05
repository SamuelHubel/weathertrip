// src/components/TripMap.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TripMap from './TripMap';

const map = { flyTo: vi.fn(), fitBounds: vi.fn(), getZoom: () => 5 };

// Mock react-leaflet — jsdom has no real map renderer
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: ({ url }) => <div data-testid="tiles" data-url={url} />,
  ZoomControl: () => null,
  Polyline: ({ positions }) => <div data-testid="polyline" data-positions={JSON.stringify(positions)} />,
  Marker: ({ children, eventHandlers }) => <div data-testid="marker" onClick={eventHandlers?.click}>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  useMap: () => map,
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));

const mockTrip = {
  start: { lat: 39.7392, lon: -104.9903 },
  end:   { lat: 40.7608, lon: -111.8910 },
  route: {
    distance: 685000,
    duration:  22200,
    geometry:  [[39.7392, -104.9903], [40.1, -106.5], [40.7608, -111.8910]],
  },
};

beforeEach(() => vi.clearAllMocks());

describe('TripMap — empty state (no trip)', () => {
  it('renders the map container', () => {
    render(<TripMap trip={null} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('does not render a polyline or markers when there is no trip', () => {
    render(<TripMap trip={null} />);
    expect(screen.queryByTestId('polyline')).not.toBeInTheDocument();
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });
});

describe('TripMap — with a valid trip', () => {
  it('passes the route geometry to the polyline and frames it', () => {
    render(<TripMap trip={mockTrip} />);
    const positions = JSON.parse(screen.getByTestId('polyline').dataset.positions);
    expect(positions).toEqual(mockTrip.route.geometry);
    expect(map.fitBounds).toHaveBeenCalledWith(mockTrip.route.geometry, expect.any(Object));
  });

  it('labels the origin and destination markers', () => {
    render(<TripMap trip={mockTrip} />);
    expect(screen.getAllByTestId('marker')).toHaveLength(2);
    expect(screen.getByText('Origin')).toBeInTheDocument();
    expect(screen.getByText('Destination')).toBeInTheDocument();
  });
});

describe('TripMap — sky', () => {
  it('uses dark tiles at night and light tiles otherwise', () => {
    const { rerender } = render(<TripMap trip={null} time="night" />);
    expect(screen.getByTestId('tiles').dataset.url).toContain('alidade_smooth_dark');
    rerender(<TripMap trip={null} time="day" />);
    expect(screen.getByTestId('tiles').dataset.url).not.toContain('dark');
  });
});

describe('TripMap — partial/malformed trip data', () => {
  it('renders without a polyline when geometry is absent', () => {
    const badTrip = { ...mockTrip, route: { distance: 100, duration: 60 } };
    expect(() => render(<TripMap trip={badTrip} />)).not.toThrow();
    expect(screen.queryByTestId('polyline')).not.toBeInTheDocument();
  });

  it('renders without crashing when start or end coords are missing', () => {
    expect(() => render(<TripMap trip={{ ...mockTrip, start: {} }} />)).not.toThrow();
    expect(() => render(<TripMap trip={{ ...mockTrip, end: {} }} />)).not.toThrow();
  });
});

describe('TripMap — weather points', () => {
  const tripWithPoint = (latitude, longitude) => ({
    ...mockTrip,
    weather: [{ location: { latitude, longitude }, weathercode: 0, temperature: 10, windspeed: 5 }],
  });

  it('shows the reverse-geocoded place name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ address: { town: 'Glenwood Springs', state: 'Colorado' } }),
    }));
    render(<TripMap trip={tripWithPoint(39.55, -107.32)} />);
    expect(await screen.findByText('Glenwood Springs, Colorado')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('falls back to "Stop N" when the lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<TripMap trip={tripWithPoint(40.1, -106.5)} />);
    // waits out the 1 req/s gap left by the previous lookup
    expect(await screen.findByText('Point 1', {}, { timeout: 3000 })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('shows US units in the popup', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<TripMap trip={tripWithPoint(40.2, -106.6)} />);
    expect(screen.getByText('50°F · Wind 11 mph')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('selects a point when its marker is clicked', () => {
    const onSelect = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<TripMap trip={tripWithPoint(40.3, -106.7)} onSelect={onSelect} />);
    fireEvent.click(screen.getAllByTestId('marker')[2]);
    expect(onSelect).toHaveBeenCalledWith(0);
    vi.unstubAllGlobals();
  });

  it('flies to the selected point', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<TripMap trip={tripWithPoint(40.4, -106.8)} selected={0} />);
    expect(map.flyTo).toHaveBeenCalledWith([40.4, -106.8], 8, expect.any(Object));
    vi.unstubAllGlobals();
  });
});

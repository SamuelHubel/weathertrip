// src/components/TripMap.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TripMap from './TripMap';


// Mock react-leaflet — jsdom has no real map renderer
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Polyline: ({ positions }) => <div data-testid="polyline" data-positions={JSON.stringify(positions)} />,
  Marker:   ({ children }) => <div data-testid="marker">{children}</div>,
  Popup:    ({ children }) => <div>{children}</div>,
}));

// Mock leaflet CSS import
vi.mock('leaflet/dist/leaflet.css', () => ({}));

// ── Helpers ──────────────────────────────────────────────────────────

const mockTrip = {
  start: { lat: 39.7392, lon: -104.9903 },
  end:   { lat: 40.7608, lon: -111.8910 },
  route: {
    distance: 685000,   // ~426 miles in meters
    duration:  22200,   // ~6h 10m in seconds
    geometry:  [[39.7392, -104.9903], [40.1, -106.5], [40.7608, -111.8910]],
  },
};

// ── Test suites ───────────────────────────────────────────────────────

describe('TripMap — empty state (no trip)', () => {
  it('renders the map container', () => {
    render(<TripMap trip={null} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('shows the empty state prompt', () => {
    render(<TripMap trip={null} />);
    expect(screen.getByText(/enter a route to begin/i)).toBeInTheDocument();
  });

  it('shows dashes for all stat values', () => {
    render(<TripMap trip={null} />);
    // All three stats should display placeholder dashes
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('does not render a polyline when there is no trip', () => {
    render(<TripMap trip={null} />);
    expect(screen.queryByTestId('polyline')).not.toBeInTheDocument();
  });

  it('does not render origin/destination markers when there is no trip', () => {
    render(<TripMap trip={null} />);
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });
});

describe('TripMap — with a valid trip', () => {
  it('renders the route polyline', () => {
    render(<TripMap trip={mockTrip} />);
    expect(screen.getByTestId('polyline')).toBeInTheDocument();
  });

  it('passes the correct geometry coordinates to the polyline', () => {
    render(<TripMap trip={mockTrip} />);
    const polyline = screen.getByTestId('polyline');
    const positions = JSON.parse(polyline.dataset.positions);
    expect(positions).toEqual(mockTrip.route.geometry);
  });

  it('renders exactly two markers (origin and destination)', () => {
    render(<TripMap trip={mockTrip} />);
    expect(screen.getAllByTestId('marker')).toHaveLength(2);
  });

  it('labels markers as ORIGIN and DESTINATION', () => {
    render(<TripMap trip={mockTrip} />);
    expect(screen.getByText('ORIGIN')).toBeInTheDocument();
    expect(screen.getByText('DESTINATION')).toBeInTheDocument();
  });

  it('hides the empty state overlay', () => {
    render(<TripMap trip={mockTrip} />);
    expect(screen.queryByText(/enter a route to begin/i)).not.toBeInTheDocument();
  });
});

describe('TripMap — stat bar formatting', () => {
  it('converts meters to miles correctly', () => {
    render(<TripMap trip={mockTrip} />);
    // 685000m ÷ 1609.34 ≈ 426 mi
    expect(screen.getByText('426 mi')).toBeInTheDocument();
  });

  it('formats duration as hours and minutes', () => {
    render(<TripMap trip={mockTrip} />);
    // 22200s = 6h 10m
    expect(screen.getByText('6h 10m')).toBeInTheDocument();
  });

  it('formats a sub-hour duration as minutes only', () => {
    const shortTrip = { ...mockTrip, route: { ...mockTrip.route, duration: 2700 } };
    render(<TripMap trip={shortTrip} />);
    // 2700s = 45m
    expect(screen.getByText('45m')).toBeInTheDocument();
  });

  it('shows coming-soon placeholder for weather points', () => {
    render(<TripMap trip={mockTrip} />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});

describe('TripMap — panel collapse toggle', () => {
  it('panel body is open by default', () => {
    render(<TripMap trip={null} />);
    const body = document.querySelector('.panel-body');
    expect(body.classList.contains('open')).toBe(true);
  });

  it('closes the panel when the header is clicked', () => {
    render(<TripMap trip={null} />);
    fireEvent.click(screen.getByText(/route map/i).closest('.panel-header'));
    const body = document.querySelector('.panel-body');
    expect(body.classList.contains('open')).toBe(false);
  });

  it('re-opens the panel on a second click', () => {
    render(<TripMap trip={null} />);
    const header = screen.getByText(/route map/i).closest('.panel-header');
    fireEvent.click(header);
    fireEvent.click(header);
    const body = document.querySelector('.panel-body');
    expect(body.classList.contains('open')).toBe(true);
  });

  it('rotates the toggle chevron when open', () => {
    render(<TripMap trip={null} />);
    const toggle = document.querySelector('.panel-toggle');
    expect(toggle.classList.contains('open')).toBe(true);
  });

  it('removes open class from chevron when closed', () => {
    render(<TripMap trip={null} />);
    fireEvent.click(screen.getByText(/route map/i).closest('.panel-header'));
    const toggle = document.querySelector('.panel-toggle');
    expect(toggle.classList.contains('open')).toBe(false);
  });
});

describe('TripMap — partial/malformed trip data', () => {
  it('renders without crashing when route geometry is missing', () => {
    const badTrip = { ...mockTrip, route: { distance: 100, duration: 60 } };
    expect(() => render(<TripMap trip={badTrip} />)).not.toThrow();
  });

  it('does not render a polyline when geometry is absent', () => {
    const badTrip = { ...mockTrip, route: { distance: 100, duration: 60 } };
    render(<TripMap trip={badTrip} />);
    expect(screen.queryByTestId('polyline')).not.toBeInTheDocument();
  });

  it('renders without crashing when start coords are missing', () => {
    const noStart = { ...mockTrip, start: {} };
    expect(() => render(<TripMap trip={noStart} />)).not.toThrow();
  });

  it('renders without crashing when end coords are missing', () => {
    const noEnd = { ...mockTrip, end: {} };
    expect(() => render(<TripMap trip={noEnd} />)).not.toThrow();
  });
});
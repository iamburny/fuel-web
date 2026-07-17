import { render, screen, waitFor } from "@testing-library/react";
import HomePage from "@/app/page";
import { api } from "@/lib/api";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// react-leaflet touches `window` in ways jsdom doesn't support and isn't what these tests are
// about — stub it so the page can render without the real map.
vi.mock("@/components/StationMap", () => ({
  default: () => <div data-testid="station-map" />,
}));

vi.mock("@/lib/api", () => ({
  api: {
    nearbyStations: vi.fn(),
    cheapest: vi.fn(),
    searchStations: vi.fn(),
  },
}));

const mockedApi = api as unknown as {
  nearbyStations: ReturnType<typeof vi.fn>;
  cheapest: ReturnType<typeof vi.fn>;
  searchStations: ReturnType<typeof vi.fn>;
};

const MAP_STATE_KEY = "fuel-map-state";
const PREFS_KEY = "fuel-preferences";

function stubGeolocation() {
  const getCurrentPosition = vi.fn();
  Object.defineProperty(window.navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });
  return getCurrentPosition;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
  mockedApi.nearbyStations.mockResolvedValue({ count: 0, stations: [] });
  mockedApi.cheapest.mockResolvedValue({ results: [], discrepancy_report_url: "", data_notice: "" });
  mockedApi.searchStations.mockResolvedValue({ count: 0, stations: [] });
  stubGeolocation();
});

describe("HomePage — fresh visit (no saved map state)", () => {
  it("defaults to London/E10/nearby and requests geolocation", async () => {
    const getCurrentPosition = stubGeolocation();
    render(<HomePage />);

    await waitFor(() => expect(mockedApi.nearbyStations).toHaveBeenCalled());
    expect(getCurrentPosition).toHaveBeenCalled();

    const [lat, lng, , fuelType] = mockedApi.nearbyStations.mock.calls[0];
    expect(lat).toBeCloseTo(51.5074);
    expect(lng).toBeCloseTo(-0.1278);
    expect(fuelType).toBe("E10");
  });

  it("applies the saved usual-fuel preference when no map state is restored", async () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ fuelType: "B7_STANDARD", useLongFuelNames: false }));
    render(<HomePage />);

    await waitFor(() => {
      const lastCall = mockedApi.nearbyStations.mock.calls.at(-1);
      expect(lastCall?.[3]).toBe("B7_STANDARD");
    });
  });
});

describe("HomePage — restored map state (repeat visit)", () => {
  it("restores fuelType/mode/coords/radius from sessionStorage and skips geolocation", async () => {
    sessionStorage.setItem(
      MAP_STATE_KEY,
      JSON.stringify({ lat: 52, lng: -1, radius: 20, mode: "cheapest", fuelType: "E5" }),
    );
    const getCurrentPosition = stubGeolocation();

    render(<HomePage />);

    await waitFor(() => expect(mockedApi.cheapest).toHaveBeenCalled());
    expect(getCurrentPosition).not.toHaveBeenCalled();

    const [fuelType, lat, lng, radius] = mockedApi.cheapest.mock.calls[0];
    expect(fuelType).toBe("E5");
    expect(lat).toBe(52);
    expect(lng).toBe(-1);
    expect(radius).toBe(20);
  });

  it("does not let a different saved 'usual fuel' preference override the restored fuel type", async () => {
    // This is the exact ordering hazard the restore logic has to guard against: a saved
    // preference disagreeing with a saved map-state fuel type. Restored state must win.
    localStorage.setItem(PREFS_KEY, JSON.stringify({ fuelType: "HVO", useLongFuelNames: false }));
    sessionStorage.setItem(
      MAP_STATE_KEY,
      JSON.stringify({ lat: 52, lng: -1, radius: 20, mode: "nearby", fuelType: "E5" }),
    );

    render(<HomePage />);

    await waitFor(() => expect(mockedApi.nearbyStations).toHaveBeenCalled());
    // Give the preference-sync effect a chance to (incorrectly) fire if it were going to.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const lastCall = mockedApi.nearbyStations.mock.calls.at(-1);
    expect(lastCall?.[3]).toBe("E5");
  });

  it("does not fire an extra fetch against stale defaults before the restore completes", async () => {
    sessionStorage.setItem(
      MAP_STATE_KEY,
      JSON.stringify({ lat: 52, lng: -1, radius: 20, mode: "nearby", fuelType: "E5" }),
    );

    render(<HomePage />);

    await waitFor(() => expect(mockedApi.nearbyStations).toHaveBeenCalled());
    // Only one call, with the restored values — not a wasted first call against London/E10.
    expect(mockedApi.nearbyStations).toHaveBeenCalledTimes(1);
    const [lat, , , fuelType] = mockedApi.nearbyStations.mock.calls[0];
    expect(lat).toBe(52);
    expect(fuelType).toBe("E5");
  });
});

describe("HomePage — Cheapest mode station shape", () => {
  it("gives StationList a synthesized prices array instead of crashing on stations with none", async () => {
    // /api/prices/cheapest's station objects carry no `prices` array at all — this is the exact
    // shape that crashed StationList/StationMarker with "Cannot read properties of undefined
    // (reading 'filter')" before the fix in app/page.tsx.
    mockedApi.cheapest.mockResolvedValue({
      results: [
        {
          station: {
            id: 1,
            gov_id: "abc",
            name: "Test Cheapest Station",
            latitude: 51.5,
            longitude: -0.1,
          },
          price_pence: 145.9,
          distance_miles: 2.3,
        },
      ],
      discrepancy_report_url: "",
      data_notice: "",
    });
    sessionStorage.setItem(
      MAP_STATE_KEY,
      JSON.stringify({ lat: 51.5, lng: -0.1, radius: 10, mode: "cheapest", fuelType: "E10" }),
    );

    render(<HomePage />);

    // Real StationList component renders here (not mocked) — if the fix weren't in place, this
    // would throw synchronously instead of ever reaching this assertion.
    await waitFor(() => expect(screen.getByText("Test Cheapest Station")).toBeInTheDocument());
    expect(screen.getByText("145.9")).toBeInTheDocument();
  });
});

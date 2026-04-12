import { api } from "@/lib/api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: unknown = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("api.nearbyStations", () => {
  it("builds correct URL with all params", async () => {
    mockOk({ count: 0, stations: [] });
    await api.nearbyStations(51.5, -0.1, 5, "E10", 10);

    expect(mockFetch).toHaveBeenCalledOnce();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/stations/nearby");
    expect(url.searchParams.get("lat")).toBe("51.5");
    expect(url.searchParams.get("lng")).toBe("-0.1");
    expect(url.searchParams.get("radius")).toBe("5");
    expect(url.searchParams.get("fuel_type")).toBe("E10");
    expect(url.searchParams.get("limit")).toBe("10");
  });
});

describe("api.searchStations", () => {
  it("passes q param", async () => {
    mockOk({ count: 0, stations: [] });
    await api.searchStations("London");

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/stations/search/");
    expect(url.searchParams.get("q")).toBe("London");
  });
});

describe("api.cheapest", () => {
  it("omits lat/lng when not provided", async () => {
    mockOk({ results: [] });
    await api.cheapest("E10");

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get("fuel_type")).toBe("E10");
    // Empty strings should not be appended as search params
    expect(url.searchParams.has("lat")).toBe(false);
    expect(url.searchParams.has("lng")).toBe(false);
  });
});

describe("api.trends", () => {
  it("passes fuel_type and days", async () => {
    mockOk({ trend: [] });
    await api.trends("B7_STANDARD", 14);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/prices/trends");
    expect(url.searchParams.get("fuel_type")).toBe("B7_STANDARD");
    expect(url.searchParams.get("days")).toBe("14");
  });
});

describe("api.getStation", () => {
  it("builds correct path", async () => {
    mockOk({ id: 42, name: "Test" });
    await api.getStation(42);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/stations/42");
  });
});

describe("error handling", () => {
  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
    });

    await expect(api.averages()).rejects.toThrow("API 500: Server Error");
  });
});

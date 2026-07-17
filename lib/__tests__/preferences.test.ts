import { renderHook, act, waitFor } from "@testing-library/react";
import { usePreferences } from "@/lib/preferences";

const STORAGE_KEY = "fuel-preferences";

beforeEach(() => {
  localStorage.clear();
});

describe("usePreferences", () => {
  it("starts from defaults, then syncs the saved value after mount", async () => {
    // This two-step behaviour (defaults first, real value synced in an effect) is exactly what
    // avoids the SSR hydration mismatch this hook was rewritten to fix — reading localStorage
    // directly in the useState initializer would disagree with server-rendered defaults.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fuelType: "B7_STANDARD", useLongFuelNames: true }));

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => {
      expect(result.current[0].fuelType).toBe("B7_STANDARD");
    });
    expect(result.current[0].useLongFuelNames).toBe(true);
  });

  it("falls back to defaults when nothing is saved", async () => {
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => {
      expect(result.current[0]).toEqual({ fuelType: "E10", useLongFuelNames: false });
    });
  });

  it("update() merges a partial patch onto existing preferences", async () => {
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current[0].fuelType).toBe("E10"));

    act(() => {
      result.current[1]({ mpg: 45 });
    });

    expect(result.current[0]).toMatchObject({ fuelType: "E10", mpg: 45, useLongFuelNames: false });
  });

  it("update() persists to localStorage", async () => {
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current[0].fuelType).toBe("E10"));

    act(() => {
      result.current[1]({ fuelType: "HVO", tankCapacityLitres: 50 });
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toMatchObject({ fuelType: "HVO", tankCapacityLitres: 50 });
  });

  it("composes multiple update() calls instead of each resetting to defaults", async () => {
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current[0].fuelType).toBe("E10"));

    act(() => {
      result.current[1]({ mpg: 40 });
    });
    act(() => {
      result.current[1]({ tankCapacityLitres: 55 });
    });

    expect(result.current[0]).toMatchObject({ mpg: 40, tankCapacityLitres: 55 });
  });

  it("handles corrupt localStorage data gracefully", async () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    const { result } = renderHook(() => usePreferences());
    await waitFor(() => {
      expect(result.current[0]).toEqual({ fuelType: "E10", useLongFuelNames: false });
    });
  });
});

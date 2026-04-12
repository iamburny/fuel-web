import { FUEL_TYPES, FUEL_LABELS, FUEL_SHORT_LABELS, FUEL_COLORS } from "@/lib/types";

describe("FUEL_TYPES", () => {
  it("contains exactly 6 values", () => {
    expect(FUEL_TYPES).toHaveLength(6);
  });

  it.each(["E10", "E5", "B7_STANDARD", "B7_PREMIUM", "B10", "HVO"] as const)(
    "contains %s",
    (fuelType) => {
      expect(FUEL_TYPES).toContain(fuelType);
    },
  );
});

describe("FUEL_LABELS", () => {
  it("has a label for every FUEL_TYPES entry", () => {
    for (const t of FUEL_TYPES) {
      expect(FUEL_LABELS[t]).toBeDefined();
      expect(typeof FUEL_LABELS[t]).toBe("string");
    }
  });
});

describe("FUEL_SHORT_LABELS", () => {
  it("has a label for every FUEL_TYPES entry", () => {
    for (const t of FUEL_TYPES) {
      expect(FUEL_SHORT_LABELS[t]).toBeDefined();
      expect(typeof FUEL_SHORT_LABELS[t]).toBe("string");
    }
  });
});

describe("FUEL_COLORS", () => {
  it("has a color for every FUEL_TYPES entry", () => {
    for (const t of FUEL_TYPES) {
      expect(FUEL_COLORS[t]).toBeDefined();
      expect(typeof FUEL_COLORS[t]).toBe("string");
    }
  });
});

describe("completeness check", () => {
  it("no FUEL_TYPES value is missing from any map", () => {
    const labelKeys = Object.keys(FUEL_LABELS);
    const shortLabelKeys = Object.keys(FUEL_SHORT_LABELS);
    const colorKeys = Object.keys(FUEL_COLORS);

    for (const t of FUEL_TYPES) {
      expect(labelKeys).toContain(t);
      expect(shortLabelKeys).toContain(t);
      expect(colorKeys).toContain(t);
    }
  });
});

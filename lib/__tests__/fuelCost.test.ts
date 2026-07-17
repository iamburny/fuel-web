import { haversineMiles, estimateDriveCostPounds } from "@/lib/fuelCost";

describe("haversineMiles", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMiles(51.5074, -0.1278, 51.5074, -0.1278)).toBe(0);
  });

  it("calculates London to Manchester as ~163 miles", () => {
    const distance = haversineMiles(51.5074, -0.1278, 53.4808, -2.2426);
    expect(distance).toBeGreaterThan(161);
    expect(distance).toBeLessThan(165);
  });

  it("is symmetric (a to b equals b to a)", () => {
    const ab = haversineMiles(51.5074, -0.1278, 53.4808, -2.2426);
    const ba = haversineMiles(53.4808, -2.2426, 51.5074, -0.1278);
    expect(ab).toBeCloseTo(ba, 10);
  });
});

describe("estimateDriveCostPounds", () => {
  it("matches a hand-computed value", () => {
    // 10 miles at 40 mpg, 150p/litre: (150/100 * 4.546) / 40 * 10 = 1.70475
    expect(estimateDriveCostPounds(10, 40, 150)).toBeCloseTo(1.70475, 5);
  });

  it("is zero for zero distance", () => {
    expect(estimateDriveCostPounds(0, 40, 150)).toBe(0);
  });

  it("scales linearly with distance", () => {
    const half = estimateDriveCostPounds(5, 40, 150);
    const full = estimateDriveCostPounds(10, 40, 150);
    expect(full).toBeCloseTo(half * 2, 10);
  });

  it("costs more per mile at worse mpg", () => {
    const efficient = estimateDriveCostPounds(10, 60, 150);
    const inefficient = estimateDriveCostPounds(10, 20, 150);
    expect(inefficient).toBeGreaterThan(efficient);
  });

  it("costs more per mile at a higher price", () => {
    const cheap = estimateDriveCostPounds(10, 40, 130);
    const expensive = estimateDriveCostPounds(10, 40, 180);
    expect(expensive).toBeGreaterThan(cheap);
  });
});

import { render, screen } from "@testing-library/react";
import StationList from "@/components/StationList";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const stations = [
  {
    id: 1,
    gov_id: "abc",
    name: "Test Station",
    brand: "BP",
    latitude: 51.5,
    longitude: -0.1,
    postcode: "SW1A 1AA",
    distance_miles: 1.5,
    prices: [
      { fuel_type: "E10", price_pence: 145.9, reported_at: "2026-01-01" },
    ],
  },
  {
    id: 2,
    gov_id: "def",
    name: "Empty Station",
    latitude: 52.0,
    longitude: -0.2,
    prices: [],
    distance_miles: 3.0,
  },
];

describe("StationList", () => {
  it("renders station names", () => {
    render(<StationList stations={stations} fuelType="E10" />);
    expect(screen.getByText("Test Station")).toBeInTheDocument();
    expect(screen.getByText("Empty Station")).toBeInTheDocument();
  });

  it("renders price for selected fuel type", () => {
    render(<StationList stations={stations} fuelType="E10" />);
    expect(screen.getByText("145.9")).toBeInTheDocument();
  });

  it("shows dash when no price available", () => {
    render(<StationList stations={stations} fuelType="E10" />);
    // The "Empty Station" has no prices, so it should show a dash
    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("shows empty state when no stations", () => {
    render(<StationList stations={[]} fuelType="E10" />);
    expect(screen.getByText("No stations found.")).toBeInTheDocument();
  });

  it("renders links to station pages", () => {
    render(<StationList stations={stations} fuelType="E10" />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/stations/1");
    expect(hrefs).toContain("/stations/2");
  });
});

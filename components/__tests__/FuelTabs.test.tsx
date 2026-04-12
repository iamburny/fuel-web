import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FuelTabs from "@/components/FuelTabs";
import type { FuelType } from "@/lib/types";

describe("FuelTabs", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockReset();
  });

  it("renders 6 buttons", () => {
    render(<FuelTabs selected="E10" onChange={onChange} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(6);
  });

  it("renders short labels", () => {
    render(<FuelTabs selected="E10" onChange={onChange} />);
    expect(screen.getByText("E10")).toBeInTheDocument();
    expect(screen.getByText("E5")).toBeInTheDocument();
    expect(screen.getByText("Diesel")).toBeInTheDocument();
    expect(screen.getByText("Super Diesel")).toBeInTheDocument();
    expect(screen.getByText("B10")).toBeInTheDocument();
    expect(screen.getByText("HVO")).toBeInTheDocument();
  });

  it("marks selected tab as active", () => {
    render(<FuelTabs selected="B7_STANDARD" onChange={onChange} />);
    const dieselBtn = screen.getByText("Diesel");
    expect(dieselBtn).toHaveClass("active");

    const e10Btn = screen.getByText("E10");
    expect(e10Btn).not.toHaveClass("active");
  });

  it("calls onChange with correct FuelType when clicked", async () => {
    const user = userEvent.setup();
    render(<FuelTabs selected="E10" onChange={onChange} />);

    await user.click(screen.getByText("Diesel"));
    expect(onChange).toHaveBeenCalledWith("B7_STANDARD");

    await user.click(screen.getByText("HVO"));
    expect(onChange).toHaveBeenCalledWith("HVO");
  });
});

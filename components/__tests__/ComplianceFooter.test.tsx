import { render, screen } from "@testing-library/react";
import ComplianceFooter from "@/components/ComplianceFooter";

describe("ComplianceFooter", () => {
  it("renders the compliance text about Open Government Licence", () => {
    render(<ComplianceFooter />);
    expect(
      screen.getByText(/Open Government Licence/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Data is presented without modification/),
    ).toBeInTheDocument();
  });

  it("renders the discrepancy report link", () => {
    render(<ComplianceFooter />);
    const link = screen.getByRole("link", {
      name: /report a price discrepancy/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://www.fuel-finder.service.gov.uk/",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

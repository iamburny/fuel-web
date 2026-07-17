// The specific report-discrepancy path 404s (confirmed via curl) — same issue fixed on the
// Android app. Points at the working base domain until the real report URL is known.
const DISCREPANCY_URL = "https://www.fuel-finder.service.gov.uk/";

export default function ComplianceFooter() {
  return (
    <div className="compliance-bar">
      <span>
        Prices sourced from the UK Government Fuel Finder scheme under the Open Government Licence.
        Data is presented without modification.
      </span>
      <a href={DISCREPANCY_URL} target="_blank" rel="noopener noreferrer">
        Report a price discrepancy
      </a>
    </div>
  );
}

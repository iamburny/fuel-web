import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Fuel Tracker UK",
  description: "How Fuel Tracker UK collects, uses, and protects your data.",
};

const CONTACT_EMAIL = "privacy@fueltracker.uk";
const LAST_UPDATED = "23 July 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1>Privacy Policy</h1>
        <p>Last updated: {LAST_UPDATED}</p>
      </div>

      <div style={{ lineHeight: 1.7, color: "var(--text-primary)" }}>
        <p style={{ marginBottom: 16 }}>
          Fuel Tracker UK (&ldquo;we&rdquo;, &ldquo;us&rdquo;) helps you find UK fuel prices on the web
          (fueltracker.uk) and in our Android app. This policy explains what data we collect, why, and
          the choices you have. We collect the minimum needed to run the service and never sell your
          data or use it for advertising.
        </p>

        <Section title="Information we collect">
          <ul style={ulStyle}>
            <li>
              <strong>Location.</strong> With your permission, we use your device&rsquo;s location to
              find nearby stations and estimate driving distances and costs. Your coordinates are sent
              to our API only to return stations near you and are not stored against your identity.
            </li>
            <li>
              <strong>Account details (Google Sign-In).</strong> If you sign in with Google, we receive
              your email address and a Google account identifier to create and identify your account.
              We never receive your Google password.
            </li>
            <li>
              <strong>Favourites.</strong> Stations you save are stored against your account so they
              sync across the web and app.
            </li>
            <li>
              <strong>Notification token.</strong> If you enable price-drop alerts, we store a Firebase
              Cloud Messaging token so we can send you notifications. You can disable this at any time.
            </li>
            <li>
              <strong>Preferences.</strong> Your fuel type, vehicle MPG, tank capacity, and theme are
              stored locally on your device, not on our servers.
            </li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <ul style={ulStyle}>
            <li>Show fuel prices and stations near you.</li>
            <li>Save and sync your favourite stations.</li>
            <li>Send price-drop alerts you&rsquo;ve opted into.</li>
            <li>Operate, secure, and improve the service.</li>
          </ul>
        </Section>

        <Section title="Data sharing and third parties">
          <p style={pStyle}>We do not sell your data. We rely on these providers to deliver the service:</p>
          <ul style={ulStyle}>
            <li>
              <strong>Google</strong> — Maps (map display), Sign-In (authentication), and Firebase
              Cloud Messaging (notifications). Your use of these is subject to Google&rsquo;s privacy
              policy.
            </li>
            <li>
              <strong>UK Government Fuel Finder scheme</strong> — the source of fuel price data, used
              under the Open Government Licence. We consume this data; we do not share your information
              with them.
            </li>
          </ul>
        </Section>

        <Section title="Data storage and retention">
          <p style={pStyle}>
            Account data (your email, Google identifier, and favourites) is retained while your account
            is active. Fuel price data is public information from the Fuel Finder scheme. Data is stored
            on our own servers in the UK/EU.
          </p>
        </Section>

        <Section title="Your rights and choices">
          <ul style={ulStyle}>
            <li><strong>Location:</strong> revoke location permission in your browser or device settings at any time.</li>
            <li><strong>Notifications:</strong> turn off price-drop alerts or revoke notification permission on your device.</li>
            <li><strong>Sign out:</strong> sign out from Settings to stop using your account on a device.</li>
            <li><strong>Favourites:</strong> remove any saved station at any time.</li>
            <li>
              <strong>Access or deletion:</strong> to request a copy of your data or delete your account
              and associated data, email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              As a UK service, we honour your rights under UK GDPR.
            </li>
          </ul>
        </Section>

        <Section title="Children">
          <p style={pStyle}>
            The service is not directed at children under 13, and we do not knowingly collect their data.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p style={pStyle}>
            We may update this policy from time to time. Material changes will be reflected by the
            &ldquo;last updated&rdquo; date above.
          </p>
        </Section>

        <Section title="Contact">
          <p style={pStyle}>
            Questions about this policy or your data? Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>
      </div>
    </div>
  );
}

const pStyle: React.CSSProperties = { marginBottom: 12 };
const ulStyle: React.CSSProperties = { margin: "0 0 12px", paddingLeft: 20, display: "grid", gap: 8 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: 10 }}>{title}</h2>
      {children}
    </section>
  );
}

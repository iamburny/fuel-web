"use client";

import { useRef, useState } from "react";
import { usePreferences } from "@/lib/preferences";
import FuelTabs from "@/components/FuelTabs";
import type { FuelType } from "@/lib/types";
import ComplianceFooter from "@/components/ComplianceFooter";

export default function SettingsPage() {
  const [prefs, updatePrefs] = usePreferences();
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preferences save automatically as they're changed — this just shows a transient
  // confirmation, mirroring the Android app's Preferences screen.
  const flashSaved = () => {
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1500);
  };

  const handleMpgChange = (text: string) => {
    const value = text.trim() === "" ? undefined : Number(text);
    updatePrefs({ mpg: value != null && !Number.isNaN(value) ? value : undefined });
    flashSaved();
  };

  const handleTankChange = (text: string) => {
    const value = text.trim() === "" ? undefined : Number(text);
    updatePrefs({ tankCapacityLitres: value != null && !Number.isNaN(value) ? value : undefined });
    flashSaved();
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Preferences</h1>
        <p>Personalise fuel type display and estimated driving costs</p>
      </div>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 4 }}>Your usual fuel</h2>
      <FuelTabs
        selected={prefs.fuelType}
        onChange={(t: FuelType) => {
          updatePrefs({ fuelType: t });
          flashSaved();
        }}
        useLongFuelNames={prefs.useLongFuelNames}
      />

      <div
        className="card"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}
      >
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Long fuel names</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Show &ldquo;Unleaded (E10)&rdquo; instead of &ldquo;E10&rdquo; throughout the site
          </div>
        </div>
        <label
          aria-label="Toggle long fuel names"
          style={{ position: "relative", display: "inline-block", width: 44, height: 24, flexShrink: 0 }}
        >
          <input
            type="checkbox"
            checked={prefs.useLongFuelNames}
            onChange={(e) => {
              updatePrefs({ useLongFuelNames: e.target.checked });
              flashSaved();
            }}
            style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              background: prefs.useLongFuelNames ? "var(--accent)" : "var(--border)",
              transition: "background 0.2s",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: prefs.useLongFuelNames ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </span>
        </label>
      </div>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 4 }}>Your car</h2>
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
        Used to estimate whether driving to a cheaper station is actually worth it, factoring in the fuel it
        takes to get there.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 8 }}>
        <label>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6 }}>Average MPG</div>
          <input
            type="number"
            className="search-input"
            placeholder="e.g. 45"
            defaultValue={prefs.mpg ?? ""}
            onChange={(e) => handleMpgChange(e.target.value)}
          />
        </label>
        <label>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6 }}>
            Tank capacity (litres)
          </div>
          <input
            type="number"
            className="search-input"
            placeholder="e.g. 55"
            defaultValue={prefs.tankCapacityLitres ?? ""}
            onChange={(e) => handleTankChange(e.target.value)}
          />
        </label>
      </div>

      <p style={{ minHeight: "1.2em", color: "var(--accent)", fontSize: "0.85rem", marginBottom: 24 }}>
        {justSaved ? "Saved" : ""}
      </p>

      <ComplianceFooter />
    </div>
  );
}

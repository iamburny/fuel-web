"use client";

import { clsx } from "clsx";
import { FUEL_TYPES, FUEL_COLORS, fuelLabel, type FuelType } from "@/lib/types";

export default function FuelTabs({
  selected,
  onChange,
  useLongFuelNames = false,
}: {
  selected: string;
  onChange: (t: FuelType) => void;
  useLongFuelNames?: boolean;
}) {
  return (
    <div className="fuel-tabs">
      {FUEL_TYPES.map((t) => {
        const isActive = selected === t;
        return (
          <button
            key={t}
            data-fuel={t}
            className={clsx("fuel-tab", isActive && "active")}
            style={isActive ? { background: FUEL_COLORS[t], borderColor: FUEL_COLORS[t], color: "#fff" } : undefined}
            onClick={() => onChange(t)}
          >
            {fuelLabel(t, useLongFuelNames)}
          </button>
        );
      })}
    </div>
  );
}

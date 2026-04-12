"use client";

import { clsx } from "clsx";
import { FUEL_TYPES, FUEL_SHORT_LABELS, type FuelType } from "@/lib/types";

export default function FuelTabs({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (t: FuelType) => void;
}) {
  return (
    <div className="fuel-tabs">
      {FUEL_TYPES.map((t) => (
        <button
          key={t}
          data-fuel={t}
          className={clsx("fuel-tab", selected === t && "active")}
          onClick={() => onChange(t)}
        >
          {FUEL_SHORT_LABELS[t]}
        </button>
      ))}
    </div>
  );
}

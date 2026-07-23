"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { useAuth } from "@/lib/auth";
import { useFavourites } from "@/lib/favourites";

/**
 * Heart toggle for saving a station. Signed out → routes to Settings (where sign-in lives). Signed
 * in → adds/removes the favourite via the shared store, so every heart for the same station and the
 * Favourites page update together. Safe to place inside a station-row <Link>: the click is stopped
 * from bubbling so it doesn't also navigate.
 */
export default function FavouriteButton({
  stationId,
  fuelType = "E10",
  size = 22,
}: {
  stationId: number;
  fuelType?: string;
  size?: number;
}) {
  const { isLoggedIn } = useAuth();
  const { favouriteFor, add, remove } = useFavourites();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const fav = favouriteFor(stationId);
  const active = fav != null;

  const onClick = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push("/settings");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (fav) await remove(fav.id);
      else await add(stationId, fuelType);
    } catch {
      // transient failure — leave state as-is
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      title={active ? "Remove from favourites" : "Save to favourites"}
      style={{
        background: "none",
        border: "none",
        padding: 4,
        lineHeight: 0,
        cursor: busy ? "default" : "pointer",
        color: active ? "var(--accent)" : "var(--text-muted)",
      }}
    >
      <Heart size={size} fill={active ? "currentColor" : "none"} />
    </button>
  );
}

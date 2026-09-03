/** Coordinate rules are deliberately provider-independent so GPS, manual pins, and geocoding share one trust boundary. */
export type LocationSource = "manual" | "gps_capture" | "geocoded";

export function assertValidCoordinates(latitude: number, longitude: number, accuracyMeters?: number | null) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("Latitude must be between -90 and 90.");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Longitude must be between -180 and 180.");
  if (accuracyMeters !== undefined && accuracyMeters !== null && (!Number.isFinite(accuracyMeters) || accuracyMeters < 0 || accuracyMeters > 100_000)) throw new Error("GPS accuracy must be between 0 and 100,000 metres.");
}

export function coordinateQualityNotice(latitude: number, longitude: number, accuracyMeters?: number | null) {
  const notices: string[] = [];
  if (accuracyMeters && accuracyMeters > 100) notices.push("GPS accuracy is above 100m; consider an outdoor recapture before relying on this pin.");
  // Rwanda-oriented operating bounds are a quality signal only, never a hard block for a growing portfolio.
  if (latitude < -3.5 || latitude > -0.7 || longitude < 28.6 || longitude > 31.1) notices.push("This pin is outside the usual Rwanda operating region. Review it before dispatching work.");
  return notices;
}

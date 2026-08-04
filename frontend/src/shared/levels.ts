export function displayLearningLevel(value?: string | null, fallback = "N5"): string {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return fallback;
  }
  if (normalized === "ZERO" || normalized === "N0") {
    return "Số 0";
  }
  return normalized;
}

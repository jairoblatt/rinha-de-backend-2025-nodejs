export function floatToCents(value: number): number {
  return Math.round(value * 100);
}

export function centsToFloat(value: number): number {
  return value / 100;
}

export function createSocketPath(hostname: string): string {
  return `/tmp/${hostname}.sock`;
}

export function getSocketPath(): string {
  const hostname = process.env.HOSTNAME || "app";
  return `/tmp/${hostname}.sock`;
}

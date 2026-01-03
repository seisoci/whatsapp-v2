export function formatTraffic(bps: string | number): string {
  const value = typeof bps === 'string' ? parseFloat(bps) : bps;
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)} Gbps`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} Mbps`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} Kbps`;
  }
  return `${value.toFixed(2)} bps`;
}

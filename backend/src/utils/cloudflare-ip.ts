const CF_CIDRS_V4 = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
];

const CF_CIDRS_V6 = [
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function isInCidrV4(ip: string, cidr: string): boolean {
  const [network, bits] = cidr.split('/');
  const mask = bits ? (~0 << (32 - parseInt(bits))) >>> 0 : 0xffffffff;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(network) & mask);
}

function expandIPv6(ip: string): bigint {
  // Handle :: expansion
  const halves = ip.split('::');
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  const full = [...left, ...Array(missing).fill('0'), ...right];
  return full.reduce((acc, group) => (acc << 16n) | BigInt(parseInt(group || '0', 16)), 0n);
}

function isInCidrV6(ip: string, cidr: string): boolean {
  const [network, bits] = cidr.split('/');
  const prefixLen = BigInt(parseInt(bits));
  const mask = prefixLen === 0n ? 0n : (~0n << (128n - prefixLen)) & ((1n << 128n) - 1n);
  return (expandIPv6(ip) & mask) === (expandIPv6(network) & mask);
}

function isCloudflareIp(ip: string): boolean {
  if (ip.includes(':')) {
    return CF_CIDRS_V6.some((cidr) => { try { return isInCidrV6(ip, cidr); } catch { return false; } });
  }
  return CF_CIDRS_V4.some((cidr) => { try { return isInCidrV4(ip, cidr); } catch { return false; } });
}

/**
 * Extract real sender IP, skipping Cloudflare proxy IPs.
 * Priority: cf-connecting-ip → first non-CF IP in x-forwarded-for → x-real-ip
 */
export function extractRealIp(headers: {
  cfConnectingIp?: string | null;
  xForwardedFor?: string | null;
  xRealIp?: string | null;
}): string {
  if (headers.cfConnectingIp?.trim()) {
    return headers.cfConnectingIp.trim().slice(0, 255);
  }

  if (headers.xForwardedFor) {
    const real = headers.xForwardedFor
      .split(',')
      .map((s) => s.trim())
      .find((ip) => ip && !isCloudflareIp(ip));
    if (real) return real.slice(0, 255);
  }

  return (headers.xRealIp?.trim() || 'unknown').slice(0, 255);
}

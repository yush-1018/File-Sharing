/** Extract /24 subnet string from an IP address (handling IPv6 mapping) */
export function extractSubnet(ip: string): string {
  if (!ip) return 'unknown';
  const cleaned = ip.replace(/^::ffff:/, '');
  const parts = cleaned.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return 'unknown';
}

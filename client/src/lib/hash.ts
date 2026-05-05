import { ethers } from 'ethers';

/** SHA-256 of file contents as `0x` + 64 hex chars (bytes32-compatible). */
export async function computePdfSha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}

/** Normalize user-pasted diploma hash (32-byte hex → checksummed 0x prefix). */
export function normalizeBytes32(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const with0x = s.startsWith('0x') ? s : `0x${s}`;
  const body = with0x.slice(2).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(body)) return null;
  return ethers.zeroPadValue(`0x${body}`, 32);
}

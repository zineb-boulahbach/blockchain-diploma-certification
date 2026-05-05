export function shortenAddress(addr: string, left = 6, right = 4): string {
  if (!addr || addr.length < left + right + 2) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

export function shortenHash(hex: string, head = 8, tail = 6): string {
  const s = hex.startsWith('0x') ? hex : `0x${hex}`;
  if (s.length <= head + tail + 2) return s;
  return `${s.slice(0, head + 2)}…${s.slice(-tail)}`;
}

export function fmtDate(epochSec: bigint | number): string {
  const n = typeof epochSec === 'bigint' ? Number(epochSec) : epochSec;
  if (!n) return '—';
  return new Date(n * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format JJ/MM/AAAA (comme sur les maquettes). */
export function fmtDateFRDigits(epochSec: bigint | number): string {
  const n = typeof epochSec === 'bigint' ? Number(epochSec) : epochSec;
  if (!n) return '—';
  return new Date(n * 1000).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Texte relatif façon maquette (« il y a 2 min », « hier »). */
export function formatRelativeFr(isoDate: Date): string {
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  const sec = Math.round((isoDate.getTime() - Date.now()) / 1000);
  const abs = Math.abs(sec);
  if (abs < 60) return rtf.format(Math.floor(sec / 1), 'second');
  if (abs < 3600) return rtf.format(Math.floor(sec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.floor(sec / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.floor(sec / 86400), 'day');
  return isoDate.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

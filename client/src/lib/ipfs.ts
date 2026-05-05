const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined;

export function gatewayUrl(cid: string): string {
  if (!cid || cid === 'local-demo') return '#';
  const c = cid.startsWith('ipfs://') ? cid.slice(7) : cid;
  return `https://ipfs.io/ipfs/${c}`;
}

/** Upload PDF + sidecar JSON to Pinata when `VITE_PINATA_JWT` is set; otherwise returns `local-demo`. */
export async function pinDiplomaPayload(
  pdf: File,
  meta: Record<string, string>
): Promise<{ pdfCid: string; jsonCid: string }> {
  if (!PINATA_JWT) {
    return { pdfCid: 'local-demo', jsonCid: 'local-demo' };
  }

  const pdfForm = new FormData();
  pdfForm.append('file', pdf);

  const pdfRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: pdfForm,
  });
  if (!pdfRes.ok) throw new Error(`Pinata PDF: ${pdfRes.status}`);
  const pdfJson = (await pdfRes.json()) as { IpfsHash: string };

  const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
  const jsonFile = new File([blob], `diploma-${meta.studentId ?? 'meta'}.json`, {
    type: 'application/json',
  });
  const jsonForm = new FormData();
  jsonForm.append('file', jsonFile);

  const metaRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: jsonForm,
  });
  if (!metaRes.ok) throw new Error(`Pinata JSON: ${metaRes.status}`);
  const metaJson = (await metaRes.json()) as { IpfsHash: string };

  return { pdfCid: pdfJson.IpfsHash, jsonCid: metaJson.IpfsHash };
}

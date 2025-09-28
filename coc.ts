import fs from 'fs';
import path from 'path';

export async function createChainOfCustody(args: {
  exportDir: string;
  originalPath: string;
  processedPath: string;
  sha256Original: string;
  provider: string;
  meta?: Record<string, any>;
}) {
  const { exportDir, originalPath, processedPath, sha256Original, provider, meta } = args;
  const record = {
    event: 'TRANSCRIBE',
    time: new Date().toISOString(),
    originalPath,
    processedPath,
    sha256Original,
    provider,
    meta: meta || {}
  };
  const filename = `coc_${Date.now()}.json`;
  const full = path.join(exportDir, filename);
  await fs.promises.writeFile(full, JSON.stringify(record, null, 2));
  return { filename };
}

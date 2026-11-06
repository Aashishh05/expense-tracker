import path from 'path';
import fs from 'fs';

/** Uploaded receipts live in server/uploads (gitignored), created on demand. */
const RECEIPTS_DIR = path.resolve(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

export function receiptsDir(): string {
  return RECEIPTS_DIR;
}

/** Absolute path for a stored filename — basenames only, never path-shaped input. */
export function receiptPath(filename: string): string {
  return path.join(RECEIPTS_DIR, path.basename(filename));
}

/** Best-effort unlink; a missing file (or a failed cleanup) is never fatal. */
export function deleteReceiptFile(filename: string | null | undefined): void {
  if (!filename) return;
  void fs.promises.unlink(receiptPath(filename)).catch(() => undefined);
}

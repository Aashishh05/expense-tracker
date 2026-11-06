import { useEffect, useState } from 'react';
import type { Transaction } from '@/types';
import { receiptPreviewUrl } from '@/api/transactions';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Loader';
import { apiMessage } from '@/utils/format';

interface ReceiptViewerProps {
  transaction: Transaction | null;
  onClose: () => void;
}

/**
 * Streams a receipt through the authenticated API into an object URL —
 * the file itself never sits at a publicly guessable URL.
 */
export function ReceiptViewer({ transaction, onClose }: ReceiptViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transaction) return;
    let objectUrl: string | null = null;
    let active = true;

    setLoading(true);
    setUrl(null);
    setError(null);

    receiptPreviewUrl(transaction._id)
      .then(({ blob, type }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setIsImage(type.startsWith('image/'));
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (active) setError(apiMessage(err, 'Could not load the receipt'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [transaction]);

  return (
    <Modal open={transaction !== null} onClose={onClose} title="Receipt" maxWidth="42rem">
      {loading && <Skeleton className="h-72 w-full rounded-2xl" />}

      {error && <p className="error-text">{error}</p>}

      {url && isImage && (
        <img src={url} alt="Transaction receipt" className="max-h-[70vh] w-full rounded-xl object-contain" />
      )}

      {url && !isImage && (
        <div className="grid place-items-center gap-3 py-14 text-center">
          <p className="text-[14px] text-ink-2">This receipt is a PDF document.</p>
          <Button onClick={() => window.open(url, '_blank', 'noopener')}>Open in a new tab</Button>
        </div>
      )}
    </Modal>
  );
}

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Reserved for genuinely destructive actions only. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="26rem">
      <p className="text-[14.5px] text-ink-2">{message}</p>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" size="md" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

import { useRef, useEffect, useState, ReactNode } from 'react';
import { MoreHorizontal as MoreHorizontalIcon, Pencil as PencilIcon, Trash2 as TrashIcon } from 'lucide-react';
import { cn } from '@/utils/format';
import { IconButton } from './Button';

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  icon?: ReactNode;
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  triggerLabel?: string;
  align?: 'left' | 'right';
}

/**
 * A simple dropdown menu component with click-outside-to-close behavior.
 * Usage: pass items and it renders a trigger button with a three-dot icon,
 * showing the items in a dropdown panel when clicked.
 */
export function DropdownMenu({
  items,
  triggerLabel = 'More options',
  align = 'right',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <div className="relative inline-block" ref={wrapperRef}>
      <IconButton
        label={triggerLabel}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontalIcon className="h-4.5 w-4.5" />
      </IconButton>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            'absolute z-50 top-full mt-1.5 min-w-[140px] rounded-xl bg-surface shadow-xl border border-line p-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="menu"
          aria-label={triggerLabel}
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[13.5px] font-medium',
                'transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                item.tone === 'danger'
                  ? 'text-expense hover:bg-expense-soft'
                  : 'text-ink hover:bg-ink/[0.05]',
                item.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {item.icon && <span className="shrink-0 h-4 w-4" aria-hidden="true">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Helper to create edit/delete dropdown items with default icons.
 */
export function editDeleteItems(
  onEdit: () => void,
  onDelete: () => void,
  options?: { editLabel?: string; deleteLabel?: string }
): DropdownMenuItem[] {
  return [
    {
      label: options?.editLabel ?? 'Edit',
      onClick: onEdit,
      icon: <PencilIcon className="h-4 w-4" />,
    },
    {
      label: options?.deleteLabel ?? 'Delete',
      onClick: onDelete,
      tone: 'danger' as const,
      icon: <TrashIcon className="h-4 w-4" />,
    },
  ];
}
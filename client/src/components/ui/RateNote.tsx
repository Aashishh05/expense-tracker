import { BASE_CURRENCY, RATE_DATE } from '@/utils/currency';
import { useAuth } from '@/context/AuthContext';

/**
 * A one-line conversion notice. Renders nothing while the user's display
 * currency is the NPR base, so it can be dropped under any money-heavy header.
 */
export function RateNote({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  if (!user || user.currency === BASE_CURRENCY) return null;
  return (
    <p className={`text-[12px] text-ink-3 ${className}`}>
      Amounts are converted from {BASE_CURRENCY} · rate snapshot {RATE_DATE}
    </p>
  );
}

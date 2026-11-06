import { Link } from 'react-router-dom';
import { ArrowRight as ArrowRightIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4">
      <div className="card max-w-[380px] animate-fade-rise p-8 text-center">
        <p className="nums text-[44px] font-semibold tracking-tight text-ink-3">404</p>
        <h1 className="mt-1 text-[18px] font-semibold text-ink">Page not found</h1>
        <p className="mt-1.5 text-[14px] text-ink-2">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#940125] active:scale-95"
        >
          Back to dashboard
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

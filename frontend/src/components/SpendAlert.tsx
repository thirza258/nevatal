import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import services, { onHistoryChanged } from '../services/services';
import { SPEND_ALERT_STORAGE_KEY } from '../constant';

const readThreshold = (): number => {
  try {
    const stored = Number(localStorage.getItem(SPEND_ALERT_STORAGE_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  } catch {
    return 0;
  }
};

/**
 * A standing warning once this session's estimated spend passes a figure the
 * user set.
 *
 * It re-checks after every generation, because that is when the number can
 * have changed, and it sits in the workspace rather than on the usage page: an
 * alert nobody sees until they go looking is not an alert.
 */
const SpendAlert: React.FC = () => {
  const [spend, setSpend] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(readThreshold);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setThreshold(readThreshold());
      try {
        const report = await services.getUsage();
        if (isMounted) setSpend(report?.totals?.cost ?? null);
      } catch {
        // No usage figures is not something to interrupt anyone about.
      }
    };

    void load();
    const stopListening = onHistoryChanged(() => void load());
    const onStorage = () => setThreshold(readThreshold());
    window.addEventListener('storage', onStorage);

    return () => {
      isMounted = false;
      stopListening();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (dismissed || threshold <= 0 || spend == null || spend < threshold) return null;

  return (
    <div
      role="alert"
      className="flex-shrink-0 bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-sm flex items-center justify-between gap-3"
    >
      <span>
        <strong>Spending alert.</strong> This key has spent an estimated $
        {spend.toFixed(spend < 0.01 ? 5 : 2)}, past the ${threshold} you set.{' '}
        <Link to="/usage" className="underline">
          See usage
        </Link>
        .
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 px-2 py-0.5 rounded-md hover:bg-amber-200"
        aria-label="Dismiss the spending alert"
      >
        ×
      </button>
    </div>
  );
};

export default SpendAlert;

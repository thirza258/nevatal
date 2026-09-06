import React, { useCallback, useEffect, useState } from 'react';
import services, { toApiError } from '../../services/services';
import PageLayout from '../../components/PageLayout';
import type { KeySlots, UsageReport } from '../../interface';
import { SPEND_ALERT_STORAGE_KEY } from '../../constant';

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
};

const money = (value: number | null | undefined) => {
  if (value == null) return '—';
  if (value === 0) return '$0';
  if (value < 0.01) return `$${value.toFixed(5)}`;
  return `$${value.toFixed(2)}`;
};

const count = (value: number | null | undefined) =>
  value == null ? '—' : value.toLocaleString();

const readThreshold = (): number => {
  try {
    const stored = Number(localStorage.getItem(SPEND_ALERT_STORAGE_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  } catch {
    return 0;
  }
};

interface StatProps {
  label: string;
  value: string;
  hint?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, hint }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
  </div>
);

/**
 * What this session has spent, and which key spent it.
 *
 * Token counts are the provider's own, recorded per request. Cost is an
 * estimate from published prices and is blank where a provider publishes none
 * — the provider's own balance, where it has one, is the figure to trust.
 */
const UsagePage: React.FC = () => {
  const [report, setReport] = useState<UsageReport | null>(null);
  const [keys, setKeys] = useState<KeySlots | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [threshold, setThreshold] = useState(readThreshold);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [keyMessage, setKeyMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usage, slots] = await Promise.all([
        services.getUsage(),
        services.listKeys(),
      ]);
      setReport(usage);
      setKeys(slots);
      setError('');
    } catch (failure) {
      setError(toApiError(failure).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveThreshold = (value: number) => {
    setThreshold(value);
    try {
      if (value > 0) {
        localStorage.setItem(SPEND_ALERT_STORAGE_KEY, String(value));
      } else {
        localStorage.removeItem(SPEND_ALERT_STORAGE_KEY);
      }
    } catch {
      // A browser that will not store it still shows it for this session.
    }
  };

  const withKeyAction = async (action: () => Promise<KeySlots>, message: string) => {
    setIsBusy(true);
    setKeyMessage('');
    try {
      setKeys(await action());
      setKeyMessage(message);
      await load();
    } catch (failure) {
      setKeyMessage(toApiError(failure).message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKey.trim()) return;
    await withKeyAction(
      () => services.addKey(newKey.trim(), newLabel.trim() || undefined),
      'Key added to this session.'
    );
    setNewKey('');
    setNewLabel('');
  };

  const spend = report?.totals?.cost ?? null;
  const overThreshold = threshold > 0 && spend != null && spend >= threshold;
  const slots = keys?.slots ?? [];
  const canAddMore = slots.length < (keys?.limit ?? 1);

  return (
    <PageLayout
      title="Usage & keys"
      description="What this session has spent, per model and per tool — and the keys it can spend it on."
      error={error}
      onClear={undefined}
    >
      {overThreshold && (
        <div
          role="alert"
          className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 text-sm"
        >
          <strong>Spending alert.</strong> This key has spent an estimated{' '}
          {money(spend)}, at or above the {money(threshold)} you set.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Requests" value={count(report?.totals?.requests)} />
        <Stat label="Tokens in" value={count(report?.totals?.tokens_in)} />
        <Stat label="Tokens out" value={count(report?.totals?.tokens_out)} />
        <Stat
          label="Estimated cost"
          value={money(spend)}
          hint="From the provider's list prices."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Spending alert
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Warn me once this session's estimated spend passes a figure. Kept in
            this browser.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500">$</span>
            <input
              type="number"
              min={0}
              step="0.5"
              value={threshold || ''}
              onChange={(event) => saveThreshold(Number(event.target.value) || 0)}
              placeholder="No alert"
              className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Spending alert threshold in dollars"
            />
            {threshold > 0 && (
              <button
                type="button"
                onClick={() => saveThreshold(0)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
              >
                Turn off
              </button>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Provider balance
          </h2>
          {report?.account ? (
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">Spent</dt>
              <dd className="text-gray-900">{money(report.account.spend)}</dd>
              <dt className="text-gray-500">Limit</dt>
              <dd className="text-gray-900">
                {report.account.limit == null ? 'None set' : money(report.account.limit)}
              </dd>
              <dt className="text-gray-500">Remaining</dt>
              <dd className="text-gray-900">{money(report.account.remaining)}</dd>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              This provider does not publish a balance for a key, so the figures
              above are this app's own estimate.
            </p>
          )}
        </section>
      </div>

      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Keys in this session
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {slots.length} of {keys?.limit ?? 1}
            </span>
            <button
              type="button"
              onClick={() => void withKeyAction(services.rotateKey, 'Rotated to the next key.')}
              disabled={isBusy || slots.length < 2}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 disabled:opacity-50"
            >
              Rotate now
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {slots.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">
              No keys recorded for this session yet.
            </p>
          ) : (
            slots.map((slot) => {
              const usage = report?.keys?.find((entry) => entry.index === slot.index);
              return (
                <div
                  key={slot.index}
                  className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {slot.label}
                      {slot.active && (
                        <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          active
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      {slot.masked} · {PROVIDER_LABELS[slot.provider] ?? slot.provider}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {usage ? `${usage.requests} requests · ${money(usage.cost)}` : '—'}
                    </span>
                    {!slot.active && (
                      <button
                        type="button"
                        onClick={() =>
                          void withKeyAction(
                            () => services.switchKey(slot.index),
                            'Switched key.'
                          )
                        }
                        disabled={isBusy}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 disabled:opacity-50"
                      >
                        Make active
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        void withKeyAction(
                          () => services.removeKey(slot.index),
                          'Key removed.'
                        )
                      }
                      disabled={isBusy}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-red-100 rounded-md text-gray-700 hover:text-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canAddMore && (
          <div className="px-4 py-3 border-t border-gray-200 flex flex-wrap items-end gap-2">
            <div className="flex-grow min-w-[14rem]">
              <label htmlFor="new-key" className="block text-xs font-medium text-gray-600">
                Add another key
              </label>
              <input
                id="new-key"
                type="password"
                autoComplete="off"
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                placeholder="sk-or-v1-..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-40">
              <label htmlFor="new-label" className="block text-xs font-medium text-gray-600">
                Label
              </label>
              <input
                id="new-label"
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                placeholder="Spare"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleAddKey()}
              disabled={isBusy || !newKey.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              Add key
            </button>
          </div>
        )}

        <p className="px-4 pb-3 text-xs text-gray-500">
          Keys are checked with the provider, then held encrypted in an httpOnly
          cookie — never in this browser's storage. A request refused for rate
          limits or credit rotates to the next key and is retried once.
          {keyMessage && <span className="block mt-1 text-gray-700">{keyMessage}</span>}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="px-4 py-2.5 border-b border-gray-200 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            By model
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2">Model</th>
                  <th className="text-right px-4 py-2">Requests</th>
                  <th className="text-right px-4 py-2">Tokens</th>
                  <th className="text-right px-4 py-2">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(report?.by_model ?? []).map((row) => (
                  <tr key={row.model}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-800 truncate max-w-[14rem]">
                      {row.model}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">{count(row.requests)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {count((row.tokens_in ?? 0) + (row.tokens_out ?? 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">{money(row.cost)}</td>
                  </tr>
                ))}
                {(report?.by_model ?? []).length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">
                      Nothing recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="px-4 py-2.5 border-b border-gray-200 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            By tool
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2">Tool</th>
                  <th className="text-right px-4 py-2">Requests</th>
                  <th className="text-right px-4 py-2">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(report?.by_method ?? []).map((row) => (
                  <tr key={row.method}>
                    <td className="px-4 py-2 text-gray-800">{row.method.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{count(row.requests)}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{money(row.cost)}</td>
                  </tr>
                ))}
                {(report?.by_method ?? []).length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">
                      Nothing recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default UsagePage;

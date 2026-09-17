import { useCallback, useEffect, useRef, useState } from "react";
import { toApiError } from "../services/services";

/**
 * State for a single-result AI page: one request in flight at a time, with a
 * loading flag and an error message the page can actually render.
 *
 * Responses from superseded requests are dropped, so a slow first call can
 * never overwrite the result of a later one.
 */
export function useAsyncTask<T>(emptyResult: T) {
  const [result, setResult] = useState<T>(emptyResult);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => () => { requestId.current += 1; }, []);

  const run = useCallback(async (task: () => Promise<T>) => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError("");
    setResult(emptyResult);

    try {
      const value = await task();
      if (requestId.current !== id) return;
      setResult(value);
    } catch (err) {
      if (requestId.current !== id) return;
      setError(toApiError(err).message);
    } finally {
      if (requestId.current === id) {
        setIsLoading(false);
      }
    }
  }, [emptyResult]);

  const reset = useCallback(() => {
    requestId.current += 1;
    setResult(emptyResult);
    setError("");
    setIsLoading(false);
  }, [emptyResult]);

  return { result, error, isLoading, run, reset };
}

/** Text tools also explain an empty response instead of showing a blank result. */
export function useAiTask() {
  const { run, ...state } = useAsyncTask("");
  const runText = useCallback(
    (task: () => Promise<string>) => run(async () => (
      await task() || "The service returned an empty response."
    )),
    [run]
  );
  return { ...state, run: runText };
}

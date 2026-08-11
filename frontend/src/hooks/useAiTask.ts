import { useCallback, useRef, useState } from "react";
import { toApiError } from "../services/services";

/**
 * State for a single-result AI page: one request in flight at a time, with a
 * loading flag and an error message the page can actually render.
 *
 * Responses from superseded requests are dropped, so a slow first call can
 * never overwrite the result of a later one.
 */
export function useAiTask() {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const requestId = useRef(0);

  const run = useCallback(async (task: () => Promise<string>) => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError("");
    setResult("");

    try {
      const value = await task();
      if (requestId.current !== id) return;
      setResult(value || "The service returned an empty response.");
    } catch (err) {
      if (requestId.current !== id) return;
      setError(toApiError(err).message);
    } finally {
      if (requestId.current === id) {
        setIsLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    requestId.current += 1;
    setResult("");
    setError("");
    setIsLoading(false);
  }, []);

  return { result, error, isLoading, run, reset };
}
